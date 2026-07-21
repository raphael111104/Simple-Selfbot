"use strict";

const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { instagramGetUrl } = require('instagram-url-direct');

const execFileAsync = promisify(execFile);
const youtubeDlPackage = path.dirname(require.resolve('youtube-dl-exec/package.json'));
const youtubeDlPath = path.join(
  youtubeDlPackage,
  'bin',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
);

const MAX_MEDIA_ITEMS = 20;

function normalizeInstagramUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value || '').trim());
  } catch {
    throw new Error('Link Instagram tidak valid.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!['instagram.com', 'www.instagram.com', 'm.instagram.com'].includes(hostname)) {
    throw new Error('Link harus berasal dari instagram.com.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('Link Instagram tidak valid.');
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments[0] === 'stories') {
    throw new Error('Instagram Story belum didukung. Gunakan link post, Reel, atau TV.');
  }

  const supportedSegments = new Set(['p', 'reel', 'reels', 'tv', 'share']);
  if (!segments.length || !supportedSegments.has(segments[0]) || segments.length < 2) {
    throw new Error('Gunakan link post, Reel, carousel, atau Instagram TV yang valid.');
  }

  parsed.protocol = 'https:';
  parsed.hostname = 'www.instagram.com';
  parsed.hash = '';
  return parsed.toString();
}

function getInstagramLinkType(url) {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  const marker = segments[0] === 'share' ? segments[1] : segments[0];
  return ['reel', 'reels', 'tv'].includes(marker) ? 'reel' : 'post';
}

function validRemoteUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function normalizeDirectResult(result, originalUrl) {
  const details = Array.isArray(result?.media_details) ? result.media_details : [];
  const urlList = Array.isArray(result?.url_list) ? result.url_list : [];
  const length = Math.max(details.length, urlList.length);
  const items = [];

  for (let index = 0; index < length && items.length < MAX_MEDIA_ITEMS; index++) {
    const detail = details[index] || {};
    const mediaUrl = validRemoteUrl(detail.url || urlList[index]);
    if (!mediaUrl || !['image', 'video'].includes(detail.type)) continue;
    items.push({ type: detail.type, source: mediaUrl });
  }

  if (!items.length) throw new Error('Scraper tidak mengembalikan media yang dapat dikirim.');

  return {
    items,
    kind: items.length > 1 ? 'carousel' : getInstagramLinkType(originalUrl),
    postInfo: {
      username: String(result?.post_info?.owner_username || ''),
      caption: String(result?.post_info?.caption || '')
    },
    engine: 'instagram-url-direct',
    cleanup() {}
  };
}

function bestThumbnail(item) {
  const selected = validRemoteUrl(item?.thumbnail);
  if (selected) return selected;

  const candidates = Array.isArray(item?.thumbnails) ? item.thumbnails : [];
  return candidates
    .map(thumbnail => ({
      url: validRemoteUrl(thumbnail?.url),
      area: (Number(thumbnail?.width) || 0) * (Number(thumbnail?.height) || 0)
    }))
    .filter(thumbnail => thumbnail.url)
    .sort((a, b) => b.area - a.area)[0]?.url || null;
}

function bestVideoUrl(item) {
  const selected = validRemoteUrl(item?.url);
  if (selected && Array.isArray(item?.formats) && item.formats.length) return selected;

  const formats = Array.isArray(item?.formats) ? item.formats : [];
  return formats
    .filter(format => format?.vcodec !== 'none')
    .map(format => ({
      url: validRemoteUrl(format?.url),
      score: (format?.ext === 'mp4' ? 1_000_000_000 : 0)
        + ((Number(format?.width) || 0) * (Number(format?.height) || 0))
    }))
    .filter(format => format.url)
    .sort((a, b) => b.score - a.score)[0]?.url || null;
}

function normalizeYtDlpResult(result, originalUrl) {
  const entries = Array.isArray(result?.entries) && result.entries.length
    ? result.entries
    : [result];
  const items = [];

  for (const entry of entries.slice(0, MAX_MEDIA_ITEMS)) {
    const videoUrl = bestVideoUrl(entry);
    if (videoUrl) {
      items.push({ type: 'video', source: videoUrl });
      continue;
    }

    const imageUrl = bestThumbnail(entry);
    if (imageUrl) items.push({ type: 'image', source: imageUrl });
  }

  if (!items.length) throw new Error('yt-dlp tidak mengembalikan media Instagram.');

  const firstEntry = entries[0] || {};
  return {
    items,
    kind: items.length > 1 ? 'carousel' : getInstagramLinkType(originalUrl),
    postInfo: {
      username: String(result?.channel || firstEntry?.channel || ''),
      caption: String(result?.description || firstEntry?.description || '')
    },
    engine: 'yt-dlp-metadata',
    cleanup() {}
  };
}

async function extractWithYtDlp(url) {
  const { stdout } = await execFileAsync(youtubeDlPath, [
    '--ignore-no-formats-error',
    '--skip-download',
    '--dump-single-json',
    '--no-warnings',
    '--playlist-end', String(MAX_MEDIA_ITEMS),
    '--socket-timeout', '20',
    '--retries', '2',
    '--', url
  ], {
    maxBuffer: 50 * 1024 * 1024,
    timeout: 60 * 1000,
    windowsHide: true
  });

  return normalizeYtDlpResult(JSON.parse(stdout), url);
}

function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Scraper Instagram timeout.')), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function downloadInstagram(value, options = {}) {
  const url = normalizeInstagramUrl(value);
  const directScraper = options.directScraper || instagramGetUrl;
  const fallbackDownloader = options.fallbackDownloader || extractWithYtDlp;
  let directError;

  try {
    const result = await withTimeout(
      directScraper(url, { retries: 1, delay: 750 }),
      options.scraperTimeoutMs || 20_000
    );
    return normalizeDirectResult(result, url);
  } catch (error) {
    directError = error;
  }

  try {
    return await fallbackDownloader(url);
  } catch (fallbackError) {
    throw new Error(
      'Media Instagram tidak dapat diunduh. Pastikan link publik dan bukan Story atau akun private.',
      { cause: { directError, fallbackError } }
    );
  }
}

module.exports = {
  downloadInstagram,
  getInstagramLinkType,
  normalizeDirectResult,
  normalizeInstagramUrl,
  normalizeYtDlpResult
};
