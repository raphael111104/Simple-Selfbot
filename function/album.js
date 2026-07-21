"use strict";

class AlbumSendError extends Error {
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = 'AlbumSendError';
    this.parentSent = options.parentSent === true;
    this.sentChildCount = Number(options.sentChildCount) || 0;
  }
}

function validateImages(images) {
  if (!Array.isArray(images) || images.length < 2) {
    throw new Error('Album WhatsApp membutuhkan minimal dua gambar.');
  }

  for (const image of images) {
    if (image?.type !== 'image' || typeof image?.source !== 'string' || !image.source) {
      throw new Error('Album WhatsApp hanya menerima item gambar yang valid.');
    }
  }
}

async function sendImageAlbum(conn, jid, images, options = {}) {
  validateImages(images);

  let parentMessage;
  try {
    parentMessage = await conn.sendMessage(jid, {
      album: {
        expectedImageCount: images.length,
        expectedVideoCount: 0
      }
    }, options.quoted ? { quoted: options.quoted } : {});
  } catch (error) {
    throw new AlbumSendError('Parent album WhatsApp gagal dikirim.', {
      cause: error,
      parentSent: false,
      sentChildCount: 0
    });
  }

  if (!parentMessage?.key?.id) {
    throw new AlbumSendError('Baileys tidak mengembalikan key parent album.', {
      parentSent: false,
      sentChildCount: 0
    });
  }

  const children = [];
  for (let index = 0; index < images.length; index++) {
    const content = {
      image: { url: images[index].source },
      albumParentKey: parentMessage.key
    };
    if (index === 0 && options.caption) content.caption = options.caption;

    try {
      children.push(await conn.sendMessage(jid, content));
    } catch (error) {
      throw new AlbumSendError(`Gambar album ke-${index + 1} gagal dikirim.`, {
        cause: error,
        parentSent: true,
        sentChildCount: children.length
      });
    }
  }

  return { parentMessage, children };
}

module.exports = { AlbumSendError, sendImageAlbum };
