import { fetchWithRetry } from "./client";
import { getAccessToken } from "./auth";
import { getAllDescendantFolders } from "./fetchers";
import { DriveFile } from "./types";
import { unstable_cache } from "next/cache";
import { getRootFolderId } from "@/lib/config";
import { logger } from "@/lib/logger";

async function fetchStorageDetails() {
  const accessToken = await getAccessToken();
  const rootFolderId = await getRootFolderId();
  const GOOGLE_DRIVE_API_URL = "https://www.googleapis.com/drive/v3";

  let globalUsage = 0;
  let limit = 0;

  try {
    const aboutResponse = await fetchWithRetry(
      `${GOOGLE_DRIVE_API_URL}/about?fields=storageQuota`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );

    if (aboutResponse.ok) {
      const aboutData: { storageQuota?: { usage?: string; limit?: string } } =
        await aboutResponse.json();
      if (aboutData?.storageQuota) {
        if (aboutData.storageQuota.usage) {
          globalUsage = parseInt(aboutData.storageQuota.usage, 10) || 0;
        }
        if (aboutData.storageQuota.limit) {
          limit = parseInt(aboutData.storageQuota.limit, 10) || 0;
        }
      }
    } else {
      logger.warn(
        { status: aboutResponse.status },
        "[Storage] about?fields=storageQuota returned non-200",
      );
    }
  } catch (err) {
    logger.warn(
      { err },
      "[Storage] Failed to fetch Google Drive storage quota",
    );
  }

  const envLimitGB = process.env.STORAGE_LIMIT_GB;
  if (envLimitGB) {
    const parsedLimit = parseInt(envLimitGB, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = parsedLimit * 1024 * 1024 * 1024;
    }
  }

  let rawFiles: DriveFile[] = [];

  try {
    const largestFilesParams = new URLSearchParams({
      q: "trashed=false and mimeType != 'application/vnd.google-apps.folder'",
      orderBy: "quotaBytesUsed desc",
      pageSize: "1000",
      fields:
        "files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, hasThumbnail, parents, trashed)",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    let largestFilesResponse = await fetchWithRetry(
      `${GOOGLE_DRIVE_API_URL}/files?${largestFilesParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );

    if (!largestFilesResponse.ok) {
      // Fallback query without orderBy quotaBytesUsed for shared drive compatibility
      const fallbackParams = new URLSearchParams({
        q: "trashed=false and mimeType != 'application/vnd.google-apps.folder'",
        orderBy: "modifiedTime desc",
        pageSize: "1000",
        fields:
          "files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, hasThumbnail, parents, trashed)",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      });
      largestFilesResponse = await fetchWithRetry(
        `${GOOGLE_DRIVE_API_URL}/files?${fallbackParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        },
      );
    }

    if (largestFilesResponse.ok) {
      const largestFilesData = await largestFilesResponse.json();
      rawFiles = (largestFilesData.files || []) as DriveFile[];
    }
  } catch (err) {
    logger.warn({ err }, "[Storage] Failed to fetch largest files list");
  }

  if (rootFolderId && rawFiles.length > 0) {
    try {
      const descendantFolderIds = await getAllDescendantFolders(
        accessToken,
        rootFolderId,
      );
      const validParentIds = new Set(descendantFolderIds);
      validParentIds.add(rootFolderId);

      rawFiles = rawFiles.filter((file) => {
        if (file.parents && file.parents.length > 0) {
          return file.parents.some((parent) => validParentIds.has(parent));
        }
        return false;
      });
    } catch (err) {
      logger.warn({ err }, "[Storage] Failed to filter descendant folders");
    }
  }

  const allFiles = rawFiles.map((file) => ({
    ...file,
    isFolder: file.mimeType === "application/vnd.google-apps.folder",
  }));

  // Sort files by size descending
  allFiles.sort(
    (a, b) => parseInt(b.size || "0", 10) - parseInt(a.size || "0", 10),
  );

  const localUsage = allFiles.reduce(
    (acc, file) => acc + parseInt(file.size || "0", 10),
    0,
  );

  const finalUsage = rootFolderId ? localUsage : globalUsage || localUsage;

  if (limit <= 0) {
    limit = Math.max(
      Math.ceil((finalUsage * 1.3) / (1024 * 1024 * 1024)) * 1024 * 1024 * 1024,
      15 * 1024 * 1024 * 1024,
    );
  }

  const breakdownMap: Record<string, { size: number; count: number }> = {};
  allFiles.forEach((file: DriveFile) => {
    let type = "Lainnya";
    const mime = file.mimeType || "";

    if (mime.startsWith("image/")) type = "Gambar";
    else if (mime.startsWith("video/")) type = "Video";
    else if (mime.startsWith("audio/")) type = "Audio";
    else if (mime === "application/pdf") type = "PDF";
    else if (
      mime.includes("zip") ||
      mime.includes("rar") ||
      mime.includes("tar") ||
      mime.includes("7z")
    )
      type = "Arsip";
    else if (
      mime.includes("word") ||
      mime.includes("document") ||
      mime.includes("sheet") ||
      mime.includes("presentation")
    )
      type = "Dokumen";

    if (!breakdownMap[type]) {
      breakdownMap[type] = { size: 0, count: 0 };
    }

    const fileSize = parseInt(file.size || "0", 10) || 0;
    breakdownMap[type].size += fileSize;
    breakdownMap[type].count += 1;
  });

  const breakdown = Object.entries(breakdownMap)
    .map(([type, data]) => ({
      type,
      count: data.count,
      size: data.size,
    }))
    .sort((a, b) => b.size - a.size);

  return {
    usage: finalUsage,
    limit,
    breakdown,
    largestFiles: allFiles.slice(0, 10),
  };
}

export const getStorageDetails = unstable_cache(
  fetchStorageDetails,
  ["storage-details"],
  { revalidate: 300, tags: ["storage-details"] },
);
