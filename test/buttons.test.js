"use strict";

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildInteractiveBizNode,
  parseNativeFlowResponse,
  sendQuickReplyButtons
} = require('../function/buttons');

test('parseNativeFlowResponse extracts a quick-reply command safely', () => {
  const message = {
    interactiveResponseMessage: {
      nativeFlowResponseMessage: {
        paramsJson: JSON.stringify({ display_text: 'Menu', id: '!menu' })
      }
    }
  };

  assert.equal(parseNativeFlowResponse(message), '!menu');
  assert.equal(parseNativeFlowResponse({}), '');
  assert.equal(parseNativeFlowResponse({
    interactiveResponseMessage: {
      nativeFlowResponseMessage: { paramsJson: '{invalid-json' }
    }
  }), '');
});

test('sendQuickReplyButtons relays two native quick-reply buttons', async () => {
  const calls = [];
  const conn = {
    user: { id: '628123456789:1@s.whatsapp.net' },
    async relayMessage(jid, message, options) {
      calls.push({ jid, message, options });
    }
  };

  const quoted = {
    key: { remoteJid: 'chat@s.whatsapp.net', fromMe: true, id: 'QUOTED' },
    message: { conversation: '!test' }
  };

  const result = await sendQuickReplyButtons(conn, 'chat@s.whatsapp.net', {
    title: 'Simple Selfbot',
    text: 'Selfbot online',
    footer: 'Simple Selfbot',
    quoted,
    buttons: [
      { id: '!menu', text: 'Menu' },
      { id: '!creator', text: 'Creator' }
    ]
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].jid, 'chat@s.whatsapp.net');
  assert.equal(calls[0].options.messageId, result.key.id);
  assert.deepEqual(calls[0].options.additionalNodes, [buildInteractiveBizNode()]);
  assert.equal(calls[0].message.viewOnceMessage, null);
  assert.equal(calls[0].message.messageContextInfo, null);

  const interactive = calls[0].message.interactiveMessage;
  assert.equal(interactive.header.title, 'Simple Selfbot');
  assert.equal(interactive.header.hasMediaAttachment, false);
  assert.equal(interactive.body.text, 'Selfbot online');
  assert.equal(interactive.footer.text, 'Simple Selfbot');
  assert.equal(interactive.nativeFlowMessage.messageVersion, 1);
  const messageParams = JSON.parse(interactive.nativeFlowMessage.messageParamsJson);
  assert.equal(messageParams.from, 'api');
  assert.match(messageParams.templateId, /^[0-9a-f-]{36}$/i);
  assert.deepEqual(
    interactive.nativeFlowMessage.buttons.map(button => ({
      name: button.name,
      params: JSON.parse(button.buttonParamsJson)
    })),
    [
      { name: 'quick_reply', params: { display_text: 'Menu', id: '!menu' } },
      { name: 'quick_reply', params: { display_text: 'Creator', id: '!creator' } }
    ]
  );
  assert.equal(interactive.contextInfo.stanzaId, 'QUOTED');

  const { proto } = await import('baileys');
  const roundTrip = proto.Message.decode(
    proto.Message.encode(calls[0].message).finish()
  );
  assert.equal(roundTrip.interactiveMessage.body.text, 'Selfbot online');
  assert.equal(roundTrip.interactiveMessage.nativeFlowMessage.buttons.length, 2);
});

test('test command relays a render-compatible payload without a prefix', async t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'error', () => {});

  const handler = require('../conn');
  const setting = require('../config.json');
  const ownerNumber = String(setting.ownerNumber).replace(/\D/g, '');
  const ownerJid = `${ownerNumber}@s.whatsapp.net`;
  const relayed = [];
  const fallbackMessages = [];
  const conn = {
    user: { id: `${ownerNumber}:1@s.whatsapp.net` },
    contacts: {},
    decodeJid: jid => String(jid || '').replace(/:\d+@/, '@'),
    async sendMessage(jid, content, options = {}) {
      fallbackMessages.push({ jid, content, options });
      return { key: { remoteJid: jid, fromMe: true, id: 'FALLBACK' } };
    },
    async relayMessage(jid, message, options = {}) {
      relayed.push({ jid, message, options });
    }
  };
  const timestamp = Math.floor(Date.now() / 1000);
  const message = {
    key: { remoteJid: ownerJid, fromMe: true },
    message: { conversation: 'test' },
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

  assert.equal(relayed.length, 1);
  assert.equal(fallbackMessages.length, 0);
  const sentMessage = relayed[0].message;
  assert.equal(sentMessage.viewOnceMessage, null);
  assert.equal(sentMessage.messageContextInfo, null);
  assert.match(sentMessage.interactiveMessage.body.text, /SELFBOT ONLINE/);
  assert.equal(sentMessage.interactiveMessage.contextInfo, null);
  assert.deepEqual(relayed[0].options.additionalNodes, [buildInteractiveBizNode()]);
  assert.deepEqual(
    sentMessage.interactiveMessage.nativeFlowMessage.buttons.map(button => JSON.parse(button.buttonParamsJson).id),
    [`${setting.prefix}menu`, `${setting.prefix}creator`]
  );
});
