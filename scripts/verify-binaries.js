"use strict";

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ffmpegPath = require('ffmpeg-static');
const youtubeDlPackage = path.dirname(require.resolve('youtube-dl-exec/package.json'));
const youtubeDlBinary = path.join(
  youtubeDlPackage,
  'bin',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
);

function isUsable(file, minimumSize) {
  return fs.existsSync(file) && fs.statSync(file).size >= minimumSize;
}

if (!isUsable(ffmpegPath, 1024 * 1024)) {
  throw new Error('FFmpeg binary was not installed correctly. Run npm install again.');
}

if (!isUsable(youtubeDlBinary, 1024 * 1024)) {
  const installer = path.join(youtubeDlPackage, 'scripts', 'postinstall.js');
  console.log('Retrying yt-dlp binary installation...');
  execFileSync(process.execPath, [installer], { stdio: 'inherit' });
}

if (!isUsable(youtubeDlBinary, 1024 * 1024)) {
  throw new Error('yt-dlp binary was not installed correctly. Run npm rebuild youtube-dl-exec.');
}

console.log('Media binaries verified.');
