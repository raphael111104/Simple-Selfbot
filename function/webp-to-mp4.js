"use strict";

const fs = require('fs');
const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const ffmpegPath = require('ffmpeg-static');

const execFileAsync = promisify(execFile);

async function convertWebpToMp4(source) {
  const output = path.join(os.tmpdir(), `${randomUUID()}.mp4`);

  try {
    await execFileAsync(ffmpegPath, [
      '-y', '-i', source,
      '-movflags', 'faststart',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      output
    ]);
    return { result: fs.readFileSync(output) };
  } finally {
    if (fs.existsSync(output)) fs.unlinkSync(output);
  }
}

module.exports = { convertWebpToMp4 };
