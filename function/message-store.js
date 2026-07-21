"use strict";

// Baileys v7 no longer exposes the old in-memory store used by this project.
// This small bounded store provides the getMessage callback Baileys needs for
// retries without retaining the complete chat history forever.
const MAX_MESSAGES = 1000;
const messages = new Map();

const keyFor = (key = {}) => `${key.remoteJid || ''}:${key.id || ''}`;

const messageStore = {
  bind(eventEmitter) {
    eventEmitter.on('messages.upsert', ({ messages: incoming = [] }) => {
      for (const message of incoming) {
        if (!message?.key?.id) continue;
        messages.set(keyFor(message.key), message);
      }

      while (messages.size > MAX_MESSAGES) {
        messages.delete(messages.keys().next().value);
      }
    });
  },

  get(key) {
    return messages.get(keyFor(key));
  }
};

module.exports = { messageStore };
