"use strict";

let reconnectTimer;

exports.handleConnectionUpdate = async (conn, update, connectToWhatsApp, DisconnectReason) => {
  const { connection, lastDisconnect } = update;

  if (connection === 'open') {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
    console.log(`Connected with ${conn.user?.id || 'WhatsApp'}`);
    return;
  }

  if (connection !== 'close') return;

  const statusCode = lastDisconnect?.error?.output?.statusCode
    || lastDisconnect?.error?.statusCode;

  if (statusCode === DisconnectReason.loggedOut) {
    console.error('Session has been logged out. Delete the sessions folder and pair the device again.');
    return;
  }

  if (!reconnectTimer) {
    const delay = statusCode === DisconnectReason.restartRequired ? 0 : 3000;
    console.warn(`Connection closed (${statusCode || 'unknown'}). Reconnecting...`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined;
      connectToWhatsApp().catch(error => console.error('Reconnect failed:', error));
    }, delay);
  }
};
