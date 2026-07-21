"use strict";

const { randomUUID } = require('crypto');

const FAKE_LOCATION_THUMBNAIL_WIDTH = 64;

function parseNativeFlowResponse(message = {}) {
  const paramsJson = message?.interactiveResponseMessage
    ?.nativeFlowResponseMessage?.paramsJson;

  if (typeof paramsJson !== 'string' || !paramsJson.trim()) return '';

  try {
    const params = JSON.parse(paramsJson);
    return params.id || params.selected_id || params.row_id || '';
  } catch {
    return '';
  }
}

function validateButtons(buttons) {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    throw new Error('Minimal satu quick-reply button diperlukan.');
  }

  for (const button of buttons) {
    if (!button?.id || !button?.text) {
      throw new Error('Setiap quick-reply button wajib memiliki id dan text.');
    }
  }
}

function validateLocation(location) {
  if (!location) return;

  const hasLatitude = location.degreesLatitude != null;
  const hasLongitude = location.degreesLongitude != null;
  if (hasLatitude !== hasLongitude) {
    throw new Error('Latitude dan longitude fake location harus diisi bersamaan.');
  }

  if (hasLatitude && (
    !Number.isFinite(location.degreesLatitude)
    || !Number.isFinite(location.degreesLongitude)
  )) {
    throw new Error('Koordinat fake location harus berupa angka yang valid.');
  }

  if (!Buffer.isBuffer(location.jpegThumbnail) || location.jpegThumbnail.length === 0) {
    throw new Error('Fake location wajib memiliki jpegThumbnail yang valid.');
  }
}

async function buildFakeLocationQuote({
  extractImageThumb,
  generateMessageIDV2,
  location,
  proto,
  title,
  userJid
}) {
  const { buffer: jpegThumbnail } = await extractImageThumb(
    location.jpegThumbnail,
    FAKE_LOCATION_THUMBNAIL_WIDTH
  );

  return {
    key: {
      // Synthetic status quote is the established fake-location shape and avoids PN/LID mapping.
      remoteJid: 'status@broadcast',
      fromMe: false,
      participant: '0@s.whatsapp.net',
      id: generateMessageIDV2(userJid)
    },
    message: {
      locationMessage: proto.Message.LocationMessage.create({
        degreesLatitude: location.degreesLatitude,
        degreesLongitude: location.degreesLongitude,
        name: location.name || title,
        address: location.address || '',
        jpegThumbnail
      })
    }
  };
}

function buildInteractiveBizNode() {
  return {
    tag: 'biz',
    attrs: {},
    content: [
      {
        tag: 'interactive',
        attrs: { type: 'native_flow', v: '1' },
        content: [
          {
            tag: 'native_flow',
            attrs: { v: '9', name: 'mixed' }
          }
        ]
      }
    ]
  };
}

async function sendQuickReplyButtons(conn, jid, options = {}) {
  const { title = '', text = '', footer = '', buttons = [], location, quoted } = options;
  validateButtons(buttons);
  validateLocation(location);

  if (!conn?.relayMessage || !conn?.user?.id) {
    throw new Error('Koneksi Baileys tidak siap untuk mengirim quick-reply button.');
  }

  const {
    extractImageThumb,
    generateMessageIDV2,
    generateWAMessageFromContent,
    jidNormalizedUser,
    proto
  } = await import('baileys');
  const userJid = jidNormalizedUser(conn.user.id);
  const messageQuote = location
    ? await buildFakeLocationQuote({
      extractImageThumb,
      generateMessageIDV2,
      location,
      proto,
      title,
      userJid
    })
    : quoted;

  const interactiveMessage = proto.Message.InteractiveMessage.create({
    header: proto.Message.InteractiveMessage.Header.create({
      title,
      hasMediaAttachment: false
    }),
    body: proto.Message.InteractiveMessage.Body.create({ text }),
    footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons: buttons.map(button => (
        proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton.create({
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: button.text,
            id: button.id
          })
        })
      )),
      messageParamsJson: JSON.stringify({
        from: 'api',
        templateId: randomUUID()
      }),
      messageVersion: 1
    })
  });

  const messageId = generateMessageIDV2(userJid);
  const message = generateWAMessageFromContent(jid, { interactiveMessage }, {
    userJid,
    quoted: messageQuote,
    messageId
  });

  await conn.relayMessage(jid, message.message, {
    messageId: message.key.id,
    additionalNodes: [buildInteractiveBizNode()]
  });
  return message;
}

module.exports = {
  FAKE_LOCATION_THUMBNAIL_WIDTH,
  buildInteractiveBizNode,
  parseNativeFlowResponse,
  sendQuickReplyButtons
};
