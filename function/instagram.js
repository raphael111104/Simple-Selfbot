"use strict";

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Downloads media from Instagram (Images, Carousel/Slide, and Videos/Reels)
 * @param {string} url Instagram URL (post, reel, tv)
 * @returns {Promise<Array<{type: 'image'|'video', url: string}>>}
 */
async function downloadInstagram(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL Instagram tidak valid');
  }

  const cleanUrl = url.trim().split('?')[0].replace(/\/$/, '');
  const results = [];

  // Method 1: SnapSave API Scraper
  try {
    const params = new URLSearchParams({ url: cleanUrl });
    const response = await axios.post('https://snapsave.app/action.php', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://snapsave.app',
        'Referer': 'https://snapsave.app/'
      },
      timeout: 10000
    });

    if (response.data) {
      const htmlStr = String(response.data);
      const matches = htmlStr.match(/https?:\/\/[^\s"',]+\.(mp4|jpg|jpeg|png|webp)[^\s"',]*/gi);
      if (matches) {
        matches.forEach(mediaUrl => {
          if ((mediaUrl.includes('cdninstagram') || mediaUrl.includes('fbcdn')) && !results.some(r => r.url === mediaUrl)) {
            const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('_n.mp4') || mediaUrl.includes('bytestream');
            results.push({ type: isVideo ? 'video' : 'image', url: mediaUrl });
          }
        });
      }
    }
  } catch (err) {}

  if (results.length > 0) return results;

  // Method 2: InDown Scraper
  try {
    const homeRes = await axios.get('https://indown.io/en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    });

    const cookies = homeRes.headers['set-cookie'] ? homeRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : '';
    const $home = cheerio.load(homeRes.data);
    const token = $home('input[name="_token"]').val();

    if (token) {
      const formParams = new URLSearchParams({
        _token: token,
        link: cleanUrl,
        referer: 'https://indown.io/en',
        locale: 'en'
      });

      const postRes = await axios.post('https://indown.io/download', formParams.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Cookie': cookies,
          'Origin': 'https://indown.io',
          'Referer': 'https://indown.io/en'
        },
        timeout: 10000
      });

      const $ = cheerio.load(postRes.data);
      $('a[href*="cdninstagram"], a[href*="fbcdn"], video source').each((_, el) => {
        const link = $(el).attr('href') || $(el).attr('src');
        if (link && (link.startsWith('http') || link.startsWith('//'))) {
          const fullLink = link.startsWith('//') ? 'https:' + link : link;
          if (!fullLink.includes('indown.io') && !results.some(r => r.url === fullLink)) {
            const isVid = fullLink.includes('.mp4') || fullLink.includes('_n.mp4') || fullLink.includes('bytestream');
            results.push({ type: isVid ? 'video' : 'image', url: fullLink });
          }
        }
      });
    }
  } catch (err) {}

  if (results.length > 0) return results;

  // Method 3: Instagram OEmbed API
  try {
    const oembedRes = await axios.get(`https://api.instagram.com/oembed/?url=${encodeURIComponent(cleanUrl)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000
    });
    if (oembedRes.data && oembedRes.data.thumbnail_url) {
      results.push({ type: 'image', url: oembedRes.data.thumbnail_url });
    }
  } catch (err) {}

  if (results.length === 0) {
    throw new Error('Gagal mengunduh media Instagram. Pastikan link publik dan valid!');
  }

  return results;
}

module.exports = { downloadInstagram };
