"use strict";

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const figlet = require('figlet');
const lolcatjs = require('lolcatjs');
const chalk = require('chalk');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const { serialize, getBuffer } = require('./function/func_Server');
const { status_Connection } = require('./function/Data_Server_Bot/Status_Connect');
const { Memory_Store } = require('./function/Data_Server_Bot/Memory_Store');
const { color } = require('./function/Data_Server_Bot/Console_Data');

process.chdir(__dirname);

const setting = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const botLogger = pino({ level: process.env.LOG_LEVEL || 'silent' });
const sessionPath = path.join(__dirname, 'sessions');
const usePairingCode = !process.argv.includes('--qr');
const useStore = !process.argv.includes('--no-store');
let messageHandler = require('./conn');

function nocache(moduleName, callback = () => {}) {
  try {
    const filePath = require.resolve(moduleName);
    fs.watchFile(filePath, { interval: 500 }, () => {
      delete require.cache[filePath];
      callback(filePath);
    });
  } catch (e) {}
}

nocache('./conn', (file) => {
  try {
    messageHandler = require('./conn');
    console.log(chalk.green.bold(`⚡ [HOT RELOAD] File '${path.basename(file)}' was updated and reloaded!`));
  } catch (error) {
    console.error(chalk.red.bold(`❌ [HOT RELOAD ERROR] Could not reload '${path.basename(file)}':`), error.message);
  }
});

nocache('./config.json', () => {
  try {
    const freshSetting = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
    Object.assign(setting, freshSetting);
    console.log(chalk.green.bold(`⚡ [HOT RELOAD] Config 'config.json' reloaded!`));
  } catch (e) {}
});

let baileys;
let currentSocket;

function title() {
  if (process.stdout.isTTY) console.clear();
  console.log('----------------------------------------------------');
  lolcatjs.fromString(chalk.cyan(figlet.textSync('Rafli A.', {
    font: 'Bloody',
    horizontalLayout: 'full',
    verticalLayout: 'full',
    whitespaceBreak: true
  })));
  console.log('----------------------------------------------------');
  lolcatjs.fromString('[SERVER STARTED]');
  console.log('----------------------------------------------------');
  lolcatjs.fromString('Created by Rafli A.');
  console.log('----------------------------------------------------');
}

function normalizePhoneNumber(value) {
  const phoneNumber = String(value || '').replace(/\D/g, '');
  if (!/^\d{8,15}$/.test(phoneNumber)) {
    throw new Error('Phone number must use country code and contain 8-15 digits, for example 628123456789.');
  }
  return phoneNumber;
}

function ask(question) {
  if (!process.stdin.isTTY) {
    throw new Error('Set WA_PHONE_NUMBER when running without an interactive terminal.');
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getPhoneNumber() {
  if (process.env.WA_PHONE_NUMBER) return normalizePhoneNumber(process.env.WA_PHONE_NUMBER);
  return normalizePhoneNumber(await ask('Enter your WhatsApp number with country code (example 628123456789):\n'));
}

async function connectToWhatsApp() {
  const {
    default: makeWASocket,
    Browsers,
    DisconnectReason,
    downloadContentFromMessage,
    jidDecode,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    WAMessageStatus
  } = baileys;

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  let pairingCodeRequested = false;

  const conn = makeWASocket({
    logger: botLogger,
    browser: Browsers.macOS('Google Chrome'),
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, botLogger)
    },
    getMessage: async key => Memory_Store.get(key)?.message
  });

  currentSocket = conn;
  title();
  if (useStore) Memory_Store.bind(conn.ev);

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('messages.update', updates => {
    for (const { key, update } of updates || []) {
      if (update?.status !== WAMessageStatus.ERROR) continue;

      const errorCode = update.messageStubParameters?.join(', ') || 'unknown';
      console.error(chalk.red(
        `[MESSAGE DELIVERY ERROR] ID: ${key?.id || '-'} | TO: ${key?.remoteJid || '-'} | CODE: ${errorCode}`
      ));
    }
  });

  conn.ev.on('connection.update', async update => {
    if (!state.creds.registered) {
      if (usePairingCode && !pairingCodeRequested && update.qr) {
        pairingCodeRequested = true;
        try {
          const phoneNumber = await getPhoneNumber();
          const code = await conn.requestPairingCode(phoneNumber);
          console.log(`Pairing code: ${code.match(/.{1,4}/g)?.join('-') || code}`);
        } catch (error) {
          pairingCodeRequested = false;
          console.error('Could not request a pairing code:', error.message);
        }
      } else if (!usePairingCode && update.qr) {
        qrcode.generate(update.qr, { small: true });
      }
    }

    await status_Connection(conn, update, connectToWhatsApp, DisconnectReason);
  });

  conn.ev.on('messages.upsert', async event => {
    // Abaikan riwayat pesan lama saat koneksi ulang (history sync)
    if (event.type === 'append') return;

    for (const rawMessage of event.messages || []) {
      if (!rawMessage?.message || rawMessage.key?.remoteJid === 'status@broadcast') continue;

      const msg = serialize(conn, rawMessage);

      try {
        await messageHandler(conn, msg, event, setting, Memory_Store);
      } catch (error) {
        console.error('Message handler failed:', error);
      }
    }
  });

  conn.ev.on('group-participants.update', update => {
    const action = update.action === 'remove' ? 'REMOVE' : update.action === 'add' ? 'ADD' : update.action.toUpperCase();
    const actionColor = update.action === 'remove' ? 'red' : 'green';
    let text = `\n${color(`-----------------> PARTICIPANTS ${action}`, actionColor)}\n`;
    text += color(`- Id           : ${update.id}`, actionColor) + '\n';
    text += color(`- Participants : ${update.participants.join(', ')}`, actionColor) + '\n';
    text += color('-------------------------------------->', actionColor) + '\n';
    console.log(text);
  });

  conn.reply = (jid, content, quoted) => conn.sendMessage(jid, { text: content }, { quoted });

  conn.sendImage = async (jid, source, caption = '', quoted, options = {}) => {
    const buffer = Buffer.isBuffer(source)
      ? source
      : /^data:.*?\/.*?;base64,/i.test(source)
        ? Buffer.from(source.split(',')[1], 'base64')
        : /^https?:\/\//.test(source)
          ? await getBuffer(source)
          : fs.existsSync(source)
            ? fs.readFileSync(source)
            : Buffer.alloc(0);

    return conn.sendMessage(jid, { image: buffer, caption, ...options }, { quoted });
  };

  conn.decodeJid = jid => {
    if (!jid || !/:\d+@/i.test(jid)) return jid;
    const decoded = jidDecode(jid) || {};
    return decoded.user && decoded.server ? `${decoded.user}@${decoded.server}` : jid;
  };

  conn.downloadAndSaveMediaMessage = async (msg, mediaType, destination) => {
    const property = `${mediaType}Message`;
    const directMessage = msg.message?.[property];
    const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const mediaMessage = directMessage
      || quotedMessage?.[property]
      || quotedMessage?.ephemeralMessage?.message?.[property];

    if (!mediaMessage) throw new Error(`No ${mediaType} media found in the message.`);

    const stream = await downloadContentFromMessage(mediaMessage, mediaType);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    fs.writeFileSync(destination, Buffer.concat(chunks));
    return destination;
  };

  return conn;
}

async function start() {
  // Baileys v7 is ESM-only. Dynamic import lets the existing CommonJS command
  // modules remain compatible while using the maintained Baileys package.
  baileys = await import('baileys');
  await connectToWhatsApp();
}

process.once('SIGINT', () => {
  currentSocket?.end(new Error('Process interrupted'));
  process.exit(0);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled rejection:', error);
});

start().catch(error => {
  console.error('Unable to start the bot:', error);
  process.exitCode = 1;
});
