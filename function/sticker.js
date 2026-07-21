"use strict";

const fs = require('fs');
const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const ffmpegPath = require('ffmpeg-static');
const sharp = require('sharp');
const webp = require('node-webpmux');
const { getBuffer } = require('./utils');

const execFileAsync = promisify(execFile);

async function addMetadata(sticker, pack, author) {
  if (!pack && !author) return sticker;

  const metadata = Buffer.from(JSON.stringify({
    'sticker-pack-id': 'simple-selfbot',
    'sticker-pack-name': pack || '',
    'sticker-pack-publisher': author || '',
    emojis: ['']
  }));
  const exif = Buffer.concat([
    Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]),
    metadata
  ]);
  exif.writeUIntLE(metadata.length, 14, 4);

  const image = new webp.Image();
  await image.load(sticker);
  image.exif = exif;
  return image.save(null);
}

async function videoToWebp(input, cropped, quality) {
  const id = randomUUID();
  const inputPath = path.join(os.tmpdir(), `${id}.mp4`);
  const outputPath = path.join(os.tmpdir(), `${id}.webp`);
  const fit = cropped
    ? 'scale=512:512:force_original_aspect_ratio=increase,crop=512:512'
    : 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000';

  fs.writeFileSync(inputPath, input);
  try {
    await execFileAsync(ffmpegPath, [
      '-y', '-i', inputPath, '-t', '10', '-vf', `${fit},fps=15`,
      '-vcodec', 'libwebp', '-lossless', '0', '-compression_level', '6',
      '-q:v', String(quality), '-loop', '0', '-an', '-vsync', '0', outputPath
    ]);
    return fs.readFileSync(outputPath);
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}

async function createSticker(source, options = {}) {
  const input = Buffer.isBuffer(source) ? source : await getBuffer(source);
  if (!input?.length) throw new Error('Sticker media could not be loaded.');

  const quality = Math.max(1, Math.min(100, Number(options.quality) || 75));
  const cropped = options.cropped === true;
  let sticker;

  if (options.video) {
    sticker = await videoToWebp(input, cropped, quality);
  } else {
    sticker = await sharp(input, { animated: true })
      .resize(512, 512, {
        fit: cropped ? 'cover' : 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality })
      .toBuffer();
  }

  return addMetadata(sticker, options.pack, options.author);
}

module.exports = { createSticker };
