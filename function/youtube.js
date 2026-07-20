"use strict";

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const ffmpegPath = require('ffmpeg-static');

const execFileAsync = promisify(execFile);
const youtubeDlPackage = path.dirname(require.resolve('youtube-dl-exec/package.json'));
const youtubeDlPath = path.join(youtubeDlPackage, 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

async function downloadYouTube(url, type) {
  const isAudio = type === 'audio';
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'simple-selfbot-ytdl-'));
  const outputTemplate = path.join(tempDirectory, '%(id)s.%(ext)s');
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--no-progress',
    '--js-runtimes', 'node',
    '--ffmpeg-location', ffmpegPath,
    '--output', outputTemplate,
    '--max-filesize', isAudio ? '50M' : '100M'
  ];

  if (isAudio) {
    args.push(
      '--format', 'bestaudio/best',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '5'
    );
  } else {
    args.push(
      '--format', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]',
      '--merge-output-format', 'mp4'
    );
  }

  try {
    args.push('--', url);
    await execFileAsync(youtubeDlPath, args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 5 * 60 * 1000,
      windowsHide: true
    });

    const outputFiles = fs.readdirSync(tempDirectory)
      .filter(file => file.endsWith(isAudio ? '.mp3' : '.mp4'));
    if (!outputFiles.length) throw new Error('yt-dlp did not produce an output file.');
    return fs.readFileSync(path.join(tempDirectory, outputFiles[0]));
  } finally {
    if (fs.existsSync(tempDirectory)) {
      for (const file of fs.readdirSync(tempDirectory)) {
        fs.unlinkSync(path.join(tempDirectory, file));
      }
      fs.rmdirSync(tempDirectory);
    }
  }
}

async function searchYouTube(query) {
  const args = [
    '--flat-playlist',
    '--dump-single-json',
    '--no-warnings',
    '--js-runtimes', 'node',
    `ytsearch10:${query}`
  ];

  const { stdout } = await execFileAsync(youtubeDlPath, args, {
    maxBuffer: 10 * 1024 * 1024,
    timeout: 30 * 1000,
    windowsHide: true
  });

  const data = JSON.parse(stdout);
  return (data.entries || []).map(item => ({
    title: item.title || 'Untitled',
    durationH: item.duration ? `${Math.floor(item.duration / 60)}:${String(Math.floor(item.duration % 60)).padStart(2, '0')}` : 'N/A',
    publishedTime: item.upload_date ? `${item.upload_date.slice(0, 4)}-${item.upload_date.slice(4, 6)}-${item.upload_date.slice(6, 8)}` : 'N/A',
    viewH: item.view_count ? item.view_count.toLocaleString() : 'N/A',
    url: item.url || (item.id ? `https://www.youtube.com/watch?v=${item.id}` : '')
  })).filter(item => item.url && item.url.includes('watch?v='));
}

module.exports = { downloadYouTube, searchYouTube };
