"use strict";

const sharp = require('sharp');

const MAX_PROFILE_DIMENSION = 720;

async function prepareFullProfilePicture(source) {
  const { data, info } = await sharp(source)
    .rotate()
    .resize({
      width: MAX_PROFILE_DIMENSION,
      height: MAX_PROFILE_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 90 })
    .toBuffer({ resolveWithObject: true });

  if (!info.width || !info.height) {
    throw new Error('Dimensi gambar tidak dapat dibaca.');
  }

  return {
    buffer: data,
    dimensions: {
      width: info.width,
      height: info.height
    }
  };
}

async function updateFullProfilePicture(conn, jid, source) {
  const { buffer, dimensions } = await prepareFullProfilePicture(source);
  await conn.updateProfilePicture(jid, buffer, dimensions);
  return dimensions;
}

module.exports = { prepareFullProfilePicture, updateFullProfilePicture };
