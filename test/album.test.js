"use strict";

const test = require('node:test');
const assert = require('node:assert/strict');
const { AlbumSendError, sendImageAlbum } = require('../function/album');

function createMockConnection(failAtCall = 0) {
  const calls = [];
  return {
    calls,
    conn: {
      async sendMessage(jid, content, options = {}) {
        calls.push({ jid, content, options });
        if (failAtCall && calls.length === failAtCall) throw new Error('mock send failure');
        return {
          key: {
            remoteJid: jid,
            fromMe: true,
            id: `MESSAGE-${calls.length}`
          }
        };
      }
    }
  };
}

const images = [
  { type: 'image', source: 'https://cdn.example/slide-1.jpg' },
  { type: 'image', source: 'https://cdn.example/slide-2.jpg' },
  { type: 'image', source: 'https://cdn.example/slide-3.jpg' }
];

test('sendImageAlbum creates an album parent and associates every image child', async () => {
  const { conn, calls } = createMockConnection();
  const quoted = { key: { remoteJid: 'chat@s.whatsapp.net', id: 'QUOTED' }, message: { conversation: 'ig' } };

  const result = await sendImageAlbum(conn, 'chat@s.whatsapp.net', images, {
    caption: 'Instagram album',
    quoted
  });

  assert.deepEqual(calls[0].content, {
    album: { expectedImageCount: 3, expectedVideoCount: 0 }
  });
  assert.equal(calls[0].options.quoted, quoted);
  assert.equal(calls[1].content.caption, 'Instagram album');
  assert.equal(calls[1].content.image.url, images[0].source);
  assert.equal(calls[1].content.albumParentKey, result.parentMessage.key);
  assert.equal(calls[2].content.albumParentKey, result.parentMessage.key);
  assert.equal(calls[3].content.albumParentKey, result.parentMessage.key);
  assert.equal(result.children.length, 3);
});

test('sendImageAlbum reports how many children were sent before a failure', async () => {
  const { conn } = createMockConnection(3);

  await assert.rejects(
    sendImageAlbum(conn, 'chat@s.whatsapp.net', images),
    error => {
      assert.equal(error instanceof AlbumSendError, true);
      assert.equal(error.parentSent, true);
      assert.equal(error.sentChildCount, 1);
      return true;
    }
  );
});

test('sendImageAlbum rejects non-image and single-item albums', async () => {
  const { conn } = createMockConnection();
  await assert.rejects(sendImageAlbum(conn, 'chat@s.whatsapp.net', images.slice(0, 1)), /minimal dua gambar/);
  await assert.rejects(sendImageAlbum(conn, 'chat@s.whatsapp.net', [images[0], { type: 'video', source: 'video.mp4' }]), /hanya menerima item gambar/);
});
