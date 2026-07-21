"use strict";

const { randomUUID } = require('crypto');

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
  const { title = '', text = '', footer = '', buttons = [], quoted } = options;
  validateButtons(buttons);

  if (!conn?.relayMessage || !conn?.user?.id) {
    throw new Error('Koneksi Baileys tidak siap untuk mengirim quick-reply button.');
  }

  const {
    generateMessageIDV2,
    generateWAMessageFromContent,
    jidNormalizedUser,
    proto
  } = await import('baileys');
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

  const userJid = jidNormalizedUser(conn.user.id);
  const messageId = generateMessageIDV2(userJid);
  const message = generateWAMessageFromContent(jid, { interactiveMessage }, {
    userJid,
    quoted,
    messageId
  });

  await conn.relayMessage(jid, message.message, {
    messageId: message.key.id,
    additionalNodes: [buildInteractiveBizNode()]
  });
  return message;
}

module.exports = { buildInteractiveBizNode, parseNativeFlowResponse, sendQuickReplyButtons };
