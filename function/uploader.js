"use strict";

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadToTelegraph(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('File not found');

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  const { data } = await axios.post('https://telegra.ph/upload', form, {
    headers: form.getHeaders()
  });

  if (!data?.[0]?.src) throw new Error('Telegraph did not return an uploaded file URL');
  return `https://telegra.ph${data[0].src}`;
}

module.exports = { uploadToTelegraph };
