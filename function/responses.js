"use strict";

const fs = require('fs');
const path = require('path');

const responsesPath = path.join(__dirname, '..', 'database', 'responses.json');

function saveResponses(responses) {
  fs.writeFileSync(responsesPath, JSON.stringify(responses, null, 2));
}

function getResponse(chatId, key, responses) {
  return responses.find(item => item.id === chatId && item.key === key);
}

function hasResponse(chatId, key, responses) {
  return Boolean(getResponse(chatId, key, responses));
}

function addResponse(chatId, key, response, responses) {
  responses.push({ id: chatId, key, response });
  saveResponses(responses);
}

function deleteResponse(chatId, key, responses) {
  const position = responses.findIndex(item => item.id === chatId && item.key === key);
  if (position === -1) return false;

  responses.splice(position, 1);
  saveResponses(responses);
  return true;
}

module.exports = { addResponse, deleteResponse, getResponse, hasResponse };
