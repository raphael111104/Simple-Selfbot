"use strict";
const axios = require("axios");
const fetch = require('node-fetch')

// exports serialize
exports.serialize = (conn, msg) => {
  if (!msg || !msg.message) return msg;

  if (msg.message.ephemeralMessage) {
    msg.message = msg.message.ephemeralMessage.message;
  }
  if (msg.message.viewOnceMessage) {
    msg.message = msg.message.viewOnceMessage.message;
  }
  if (msg.message.viewOnceMessageV2) {
    msg.message = msg.message.viewOnceMessageV2.message;
  }
  if (msg.message.documentWithCaptionMessage) {
    msg.message = msg.message.documentWithCaptionMessage.message;
  }

  msg.isGroup = msg.key.remoteJid.endsWith('@g.us');
  try {
    const messageType = Object.keys(msg.message)[0];
    msg.type = messageType;
  } catch {
    msg.type = null;
  }

  try {
    const context = msg.message[msg.type]?.contextInfo?.quotedMessage;
    if (context) {
      if (context["ephemeralMessage"]) {
        msg.quotedMsg = context.ephemeralMessage.message;
      } else {
        msg.quotedMsg = context;
      }
      msg.isQuotedMsg = true;
      msg.quotedMsg.sender = msg.message[msg.type].contextInfo.participant;
      msg.quotedMsg.fromMe = msg.quotedMsg.sender === (conn.user.id.split(':')[0] + '@s.whatsapp.net');
      msg.quotedMsg.type = Object.keys(msg.quotedMsg)[0];
      const quotedContent = msg.quotedMsg;
      msg.quotedMsg.chats = (quotedContent.type === 'conversation' && quotedContent.conversation) ? quotedContent.conversation : (quotedContent.type == 'imageMessage') && quotedContent.imageMessage.caption ? quotedContent.imageMessage.caption : (quotedContent.type == 'documentMessage') && quotedContent.documentMessage.caption ? quotedContent.documentMessage.caption : (quotedContent.type == 'videoMessage') && quotedContent.videoMessage.caption ? quotedContent.videoMessage.caption : (quotedContent.type == 'extendedTextMessage') && quotedContent.extendedTextMessage.text ? quotedContent.extendedTextMessage.text : (quotedContent.type == 'buttonsMessage') && quotedContent.buttonsMessage.contentText ? quotedContent.buttonsMessage.contentText : "";
      msg.quotedMsg.id = msg.message[msg.type].contextInfo.stanzaId;
    } else {
      msg.quotedMsg = null;
      msg.isQuotedMsg = false;
    }
  } catch {
    msg.quotedMsg = null;
    msg.isQuotedMsg = false;
  }

  try {
    const mention = msg.message[msg.type]?.contextInfo?.mentionedJid;
    msg.mentioned = mention || [];
  } catch {
    msg.mentioned = [];
  }

  if (msg.isGroup) {
    msg.sender = msg.key.participant || msg.participant;
  } else {
    msg.sender = msg.key.remoteJid;
  }
  if (msg.key.fromMe) {
    msg.sender = conn.user.id.split(':')[0] + '@s.whatsapp.net';
  }

  msg.from = msg.key.remoteJid;
  msg.now = msg.messageTimestamp;
  msg.fromMe = msg.key.fromMe;
  msg.expiration = msg.message?.ephemeralMessage?.expiration || msg.message?.[msg.type]?.contextInfo?.expiration || 0;

  return msg;
};

// exports getrandom
exports.getRandom = (ext) => {
return `${Math.floor(Math.random() * 10000)}${ext}`
}

// exports getBuffer
exports.getBuffer = async (url, options) => {
try {
options ? options : {}
const res = await axios({
method: "get",
url,
headers: {
'DNT': 1,
'Upgrade-Insecure-Request': 1
},
...options,
responseType: 'arraybuffer'
})
return res.data
} catch (e) {
console.log(`Error : ${e}`)
}
}

// exports fetchJson
exports.fetchJson = (url, options) => new Promise(async(resolve, reject) => {
fetch(url, options)
.then(response => response.json())
.then(json => {
resolve(json)
})
.catch((err) => {
reject(err)
})
})

// exports getGroupAdmins
exports.getGroupAdmins = function(participants){
let admins = []
for (let i of participants) {
i.admin !== null ? admins.push(i.id) : ''
}
return admins
}

// exports runtime
exports.runtime = function(seconds) {
seconds = Number(seconds);
var d = Math.floor(seconds / (3600 * 24));
var h = Math.floor(seconds % (3600 * 24) / 3600);
var m = Math.floor(seconds % 3600 / 60);
var s = Math.floor(seconds % 60);
var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
return dDisplay + hDisplay + mDisplay + sDisplay;
}

// exports sleep
exports.sleep = async (ms) => {
return new Promise(resolve => setTimeout(resolve, ms));
}
