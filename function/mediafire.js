"use strict";

const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const MIME_TYPES = {
  '.apk': 'application/vnd.android.package-archive',
  '.pdf': 'application/pdf',
  '.rar': 'application/vnd.rar',
  '.txt': 'text/plain',
  '.zip': 'application/zip'
};

async function downloadMediafire(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const downloadUrl = $('a#downloadButton').attr('href');
  if (!downloadUrl) throw new Error('MediaFire download link was not found');

  const name = decodeURIComponent(new URL(downloadUrl).pathname.split('/').filter(Boolean).pop());
  const size = $('a#downloadButton').text().replace(/Download|[()\n]/g, '').trim();
  const mimeType = MIME_TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream';
  return { name, mimeType, size, url: downloadUrl };
}

module.exports = { downloadMediafire };
