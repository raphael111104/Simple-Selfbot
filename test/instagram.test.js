"use strict";

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  downloadInstagram,
  normalizeDirectResult,
  normalizeInstagramUrl,
  normalizeYtDlpResult
} = require('../function/instagram');

test('normalizeInstagramUrl accepts supported Instagram media links', () => {
  assert.equal(
    normalizeInstagramUrl('https://instagram.com/reel/ABC123/?igsh=test#fragment'),
    'https://www.instagram.com/reel/ABC123/?igsh=test'
  );
  assert.equal(
    normalizeInstagramUrl('https://m.instagram.com/p/POST123/'),
    'https://www.instagram.com/p/POST123/'
  );
});

test('normalizeInstagramUrl rejects foreign hosts and Stories', () => {
  assert.throws(() => normalizeInstagramUrl('https://instagram.com.evil.example/p/ABC/'), /instagram\.com/);
  assert.throws(() => normalizeInstagramUrl('https://www.instagram.com/stories/example/123/'), /Story/);
});

test('normalizeDirectResult preserves mixed carousel media types', () => {
  const result = normalizeDirectResult({
    post_info: { owner_username: 'creator', caption: 'Example caption' },
    media_details: [
      { type: 'image', url: 'https://cdn.example/image.jpg' },
      { type: 'video', url: 'https://cdn.example/video.mp4' }
    ]
  }, 'https://www.instagram.com/p/POST123/');

  assert.equal(result.kind, 'carousel');
  assert.deepEqual(result.items.map(item => item.type), ['image', 'video']);
  assert.equal(result.postInfo.username, 'creator');
});

test('normalizeYtDlpResult treats a format-less Instagram post as an image', () => {
  const result = normalizeYtDlpResult({
    id: 'IMAGE123',
    channel: 'creator',
    description: 'Image caption',
    formats: [],
    thumbnail: 'https://cdn.example/image.jpg'
  }, 'https://www.instagram.com/p/IMAGE123/');

  assert.equal(result.kind, 'post');
  assert.deepEqual(result.items, [{ type: 'image', source: 'https://cdn.example/image.jpg' }]);
  assert.equal(result.postInfo.username, 'creator');
});

test('normalizeYtDlpResult preserves mixed carousel entries', () => {
  const result = normalizeYtDlpResult({
    _type: 'playlist',
    entries: [
      { formats: [], thumbnail: 'https://cdn.example/image.jpg' },
      {
        formats: [{ ext: 'mp4', vcodec: 'h264', url: 'https://cdn.example/video.mp4' }],
        url: 'https://cdn.example/video.mp4'
      }
    ]
  }, 'https://www.instagram.com/p/CAROUSEL123/');

  assert.equal(result.kind, 'carousel');
  assert.deepEqual(result.items.map(item => item.type), ['image', 'video']);
});

test('downloadInstagram uses metadata fallback when direct scraper fails', async () => {
  const expected = {
    items: [{ type: 'video', source: 'C:\\temp\\reel.mp4' }],
    kind: 'reel',
    postInfo: { username: '', caption: '' },
    cleanup() {}
  };
  let fallbackUrl;

  const result = await downloadInstagram('https://www.instagram.com/reel/ABC123/', {
    directScraper: async () => { throw new Error('scraper unavailable'); },
    fallbackDownloader: async url => {
      fallbackUrl = url;
      return expected;
    }
  });

  assert.equal(result, expected);
  assert.equal(fallbackUrl, 'https://www.instagram.com/reel/ABC123/');
});

test('Instagram command sends every carousel item using its media type', async t => {
  t.mock.method(console, 'log', () => {});

  const instagramModule = require('../function/instagram');
  const connPath = require.resolve('../conn');
  const originalDownloadInstagram = instagramModule.downloadInstagram;
  let cleanedUp = false;

  instagramModule.downloadInstagram = async () => ({
    items: [
      { type: 'image', source: 'https://cdn.example/photo.jpg' },
      { type: 'video', source: 'https://cdn.example/reel.mp4' }
    ],
    kind: 'carousel',
    postInfo: { username: 'creator', caption: 'Carousel caption' },
    cleanup() { cleanedUp = true; }
  });
  delete require.cache[connPath];

  try {
    const handler = require('../conn');
    const setting = require('../config.json');
    const ownerJid = `${String(setting.ownerNumber).replace(/\D/g, '')}@s.whatsapp.net`;
    const sent = [];
    const conn = {
      user: { id: `${String(setting.ownerNumber).replace(/\D/g, '')}:1@s.whatsapp.net` },
      contacts: {},
      decodeJid: jid => String(jid || '').replace(/:\d+@/, '@'),
      sendMessage: async (jid, content, options = {}) => {
        sent.push({ jid, content, options });
        return {};
      }
    };
    const timestamp = Math.floor(Date.now() / 1000);
    const message = {
      key: { remoteJid: ownerJid, fromMe: true },
      message: { conversation: `${setting.prefix}ig https://www.instagram.com/p/POST123/` },
      type: 'conversation',
      quotedMsg: null,
      mentioned: [],
      now: timestamp,
      fromMe: true,
      sender: ownerJid,
      pushName: 'Owner',
      messageTimestamp: timestamp,
      expiration: 0
    };

    await handler(conn, message, {}, setting, {});

    assert.equal(sent.length, 3);
    assert.equal(sent[1].content.image.url, 'https://cdn.example/photo.jpg');
    assert.equal(sent[2].content.video.url, 'https://cdn.example/reel.mp4');
    assert.match(sent[1].content.caption, /Carousel/);
    assert.equal(cleanedUp, true);
  } finally {
    instagramModule.downloadInstagram = originalDownloadInstagram;
    delete require.cache[connPath];
  }
});

test('Instagram command sends an all-image carousel as a native WhatsApp album', async t => {
  t.mock.method(console, 'log', () => {});

  const instagramModule = require('../function/instagram');
  const connPath = require.resolve('../conn');
  const originalDownloadInstagram = instagramModule.downloadInstagram;
  let cleanedUp = false;

  instagramModule.downloadInstagram = async () => ({
    items: [
      { type: 'image', source: 'https://cdn.example/slide-1.jpg' },
      { type: 'image', source: 'https://cdn.example/slide-2.jpg' }
    ],
    kind: 'carousel',
    postInfo: { username: 'creator', caption: 'Image carousel' },
    cleanup() { cleanedUp = true; }
  });
  delete require.cache[connPath];

  try {
    const handler = require('../conn');
    const setting = require('../config.json');
    const ownerNumber = String(setting.ownerNumber).replace(/\D/g, '');
    const ownerJid = `${ownerNumber}@s.whatsapp.net`;
    const sent = [];
    const conn = {
      user: { id: `${ownerNumber}:1@s.whatsapp.net` },
      contacts: {},
      decodeJid: jid => String(jid || '').replace(/:\d+@/, '@'),
      sendMessage: async (jid, content, options = {}) => {
        sent.push({ jid, content, options });
        return { key: { remoteJid: jid, fromMe: true, id: `MESSAGE-${sent.length}` } };
      }
    };
    const timestamp = Math.floor(Date.now() / 1000);
    const message = {
      key: { remoteJid: ownerJid, fromMe: true },
      message: { conversation: `${setting.prefix}ig https://www.instagram.com/p/ALBUM123/` },
      type: 'conversation',
      quotedMsg: null,
      mentioned: [],
      now: timestamp,
      fromMe: true,
      sender: ownerJid,
      pushName: 'Owner',
      messageTimestamp: timestamp,
      expiration: 0
    };

    await handler(conn, message, {}, setting, {});

    assert.equal(sent.length, 4);
    assert.deepEqual(sent[1].content.album, { expectedImageCount: 2, expectedVideoCount: 0 });
    assert.equal(sent[2].content.image.url, 'https://cdn.example/slide-1.jpg');
    assert.equal(sent[3].content.image.url, 'https://cdn.example/slide-2.jpg');
    assert.equal(sent[2].content.albumParentKey.id, 'MESSAGE-2');
    assert.equal(sent[3].content.albumParentKey.id, 'MESSAGE-2');
    assert.match(sent[2].content.caption, /Carousel/);
    assert.equal(cleanedUp, true);
  } finally {
    instagramModule.downloadInstagram = originalDownloadInstagram;
    delete require.cache[connPath];
  }
});
