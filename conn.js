"use strict";
const { execFile } = require("child_process");
const ffmpegPath = require('ffmpeg-static');
const { color, bgcolor, pickRandom, randomNomor } = require('./function/Data_Server_Bot/Console_Data')
const { removeEmojis, bytesToSize, getBuffer, fetchJson, getRandom, getGroupAdmins, runtime, sleep, makeid, isUrl } = require("./function/func_Server");
const { TelegraPh } = require("./function/uploader_Media");
const { addResponList, delResponList, isAlreadyResponList, isAlreadyResponListGroup, sendResponList, updateResponList, getDataResponList } = require('./function/func_Addlist');
const { setting_JSON, server_eror_JSON, db_respon_list_JSON } = require('./function/Data_Location.js')
const { mediafireDl } = require('./function/scrape_Mediafire')
const { webp2mp4File } = require("./function/Webp_Tomp4")

//module
const { File } = require("megajs")
const { downloadYouTube, searchYouTube } = require('./function/youtube')
const { updateFullProfilePicture } = require('./function/profile-picture')

const fs = require("fs");
const ms = require("ms");
const chalk = require('chalk');
const axios = require("axios");
const moment = require("moment-timezone");
const util = require("util");
const { createSticker } = require('./function/sticker');


// DB
const setting = setting_JSON
const server_eror = server_eror_JSON
const db_respon_list = db_respon_list_JSON

moment.tz.setDefault("Asia/Jakarta").locale("id");
module.exports = async (conn, msg, m, setting, store) => {
  try {
    const { type, quotedMsg, mentioned, now, fromMe } = msg
    const jam = moment.tz('asia/jakarta').format('HH:mm:ss')
    const tanggal = moment().tz("Asia/Jakarta").format("ll")
    let dt = moment(Date.now()).tz('Asia/Jakarta').locale('id').format('a')
    const content = JSON.stringify(msg.message)
    const from = msg.key.remoteJid
    const time = moment(new Date()).format("HH:mm");
    var chats = (type === 'conversation' && msg.message?.conversation)
      ? msg.message.conversation
      : (type === 'imageMessage') && msg.message?.imageMessage?.caption
        ? msg.message.imageMessage.caption
        : (type === 'videoMessage') && msg.message?.videoMessage?.caption
          ? msg.message.videoMessage.caption
          : (type === 'extendedTextMessage') && msg.message?.extendedTextMessage?.text
            ? msg.message.extendedTextMessage.text
            : (type === 'buttonsResponseMessage') && quotedMsg?.fromMe && msg.message?.buttonsResponseMessage?.selectedButtonId
              ? msg.message.buttonsResponseMessage.selectedButtonId
              : (type === 'templateButtonReplyMessage') && quotedMsg?.fromMe && msg.message?.templateButtonReplyMessage?.selectedId
                ? msg.message.templateButtonReplyMessage.selectedId
                : (type === 'listResponseMessage') && quotedMsg?.fromMe && msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId
                  ? msg.message.listResponseMessage.singleSelectReply.selectedRowId
                  : (msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || "")
    if (!chats) { chats = '' }
    const prefix = setting.prefix
    const isGroup = msg.key.remoteJid.endsWith('@g.us')
    const rawSender = msg.key.fromMe
      ? (conn.user.id.split(':')[0] + '@s.whatsapp.net')
      : (msg.sender || (isGroup ? (msg.key.participant || msg.participant) : msg.key.remoteJid))
    const sender = conn.decodeJid(rawSender)
    const senderNum = sender ? sender.split('@')[0].split(':')[0] : ''
    const senderPhone = senderNum ? (senderNum.startsWith('+') ? senderNum : `+${senderNum}`) : ''
    const isOwner = [`${setting.ownerNumber}@s.whatsapp.net`].includes(sender) ? true : false
    const pushname = msg.pushName
    const senderDisplay = pushname ? `${pushname} (${senderPhone})` : senderPhone
    const body = chats.startsWith(prefix) ? chats : ''
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(" ");
    const isCommand = body.startsWith(prefix);
    const commandText = body.slice(prefix.length).trim()
    const command = commandText.split(/ +/).shift().toLowerCase()
    const isCmd = isCommand ? command : null;
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net'

    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => ({})) : {}
    const groupName = isGroup ? (groupMetadata.subject || '') : ''
    const groupId = isGroup ? (groupMetadata.id || '') : ''
    const groupMembers = isGroup ? (groupMetadata.participants || []) : []
    const participants = groupMembers
    const groupAdmins = isGroup ? getGroupAdmins(groupMembers) : []
    const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
    const isGroupAdmins = groupAdmins.includes(sender)

    const quoted = msg.quoted ? msg.quoted : msg

    const isImage = (type == 'imageMessage')
    const isQuotedMsg = (type == 'extendedTextMessage')
    const isMedia = (type === 'imageMessage' || type === 'videoMessage');
    const isQuotedImage = isQuotedMsg ? content.includes('imageMessage') ? true : false : false
    const isVideo = (type == 'videoMessage')
    const isQuotedVideo = isQuotedMsg ? content.includes('videoMessage') ? true : false : false
    const isSticker = (type == 'stickerMessage')
    const isQuotedSticker = isQuotedMsg ? content.includes('stickerMessage') ? true : false : false
    const isQuotedAudio = isQuotedMsg ? content.includes('audioMessage') ? true : false : false

    const mentionByTag = type == "extendedTextMessage" && msg.message.extendedTextMessage.contextInfo != null ? msg.message.extendedTextMessage.contextInfo.mentionedJid : []
    const mentionByReply = type == "extendedTextMessage" && msg.message.extendedTextMessage.contextInfo != null ? msg.message.extendedTextMessage.contextInfo.participant || "" : ""
    const mention = typeof (mentionByTag) == 'string' ? [mentionByTag] : mentionByTag
    mention != undefined ? mention.push(mentionByReply) : []
    const mentionUser = mention != undefined ? mention.filter(n => n) : []

    /*try {
      var pp_user = await conn.profilePictureUrl(sender, 'image')
    } catch {
      var pp_user = 'https://i.ibb.co/0M6Hppv/3626e36344a1.jpg'
    }*/

    function mentions(teks, mems = [], id) {
      if (id == null || id == undefined || id == false) {
        let res = conn.sendMessage(from, { text: teks, mentions: mems })
        return res
      } else {
        let res = conn.sendMessage(from, { text: teks, mentions: mems }, { quoted: msg })
        return res
      }
    }

    function monospace(string) {
      return '```' + string + '```'
    }

    const more = String.fromCharCode(8206)
    const readmore = more.repeat(4001)

    function parseMention(text = '') {
      return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }

    const isEmoji = (emo) => {
      let emoji_ranges = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
      let regexEmoji = new RegExp(emoji_ranges, 'gi');
      return emo.match(regexEmoji)
    }

    const reply = (teks) => { conn.sendMessage(from, { text: teks }, { quoted: msg }) }

    const adReply = async (teks, judul, isi, quo) => {
      conn.sendMessage(from, {
        text: teks,
        contextInfo: {
          "externalAdReply":
          {
            showAdAttribution: true,
            title: judul,
            body: isi,
            mediaType: 1,
            thumbnail: fs.readFileSync('./sticker/adreply.jpg'),
            sourceUrl: 'https://github.com/dragneel1111/Simple-Selfbot'
          }
        }
      },
        {
          quoted: quo
        })
    }

    const adReply2 = async (teks, judul, isi, quo) => {
      conn.sendMessage(from, {
        text: teks,
        contextInfo: {
          "externalAdReply":
          {
            showAdAttribution: true,
            title: judul,
            body: isi,
            mediaType: 1,
            renderLargerThumbnail: true,
            thumbnail: fs.readFileSync('./sticker/menu.jpg'),
            sourceUrl: 'https://github.com/dragneel1111/Simple-Selfbot'
          }
        }
      },
        {
          quoted: quo
        })
    }

    const fstatus = {
      key: {
        fromMe: false,
        participant: `0@s.whatsapp.net`,
        ...(from ? { remoteJid: "status@broadcast" } : {}),
      },
      message: {
        imageMessage: {
          url: "https://mmg.whatsapp.net/d/f/At0x7ZdIvuicfjlf9oWS6A3AR9XPh0P-hZIVPLsI70nM.enc",
          mimetype: "image/jpeg",
          caption: setting.wm,
          fileSha256: "+Ia+Dwib70Y1CWRMAP9QLJKjIJt54fKycOfB2OEZbTU=",
          fileLength: "28777",
          height: 1080,
          width: 1079,
          mediaKey: "vXmRR7ZUeDWjXy5iQk17TrowBzuwRya0errAFnXxbGc=",
          fileEncSha256: "sR9D2RS5JSifw49HeBADguI23fWDz1aZu4faWG/CyRY=",
          directPath:
            "/v/t62.7118-24/21427642_840952686474581_572788076332761430_n.enc?oh=3f57c1ba2fcab95f2c0bb475d72720ba&oe=602F3D69",
          mediaKeyTimestamp: "1610993486",
          jpegThumbnail: fs.readFileSync("./sticker/thumb.jpg"),
          scansSidecar:
            "1W0XhfaAcDwc7xh1R8lca6Qg/1bB4naFCSngM2LKO2NoP5RI7K+zLw==",
        },
      },
    }

    if (!isCmd && isGroup && isAlreadyResponList(from, chats, db_respon_list)) {
      var get_data_respon = getDataResponList(from, chats, db_respon_list)
      if (get_data_respon.isImage === false) {
        adReply(sendResponList(from, chats, db_respon_list), groupName, tanggal, msg)
      } else {
        conn.sendMessage(from, { image: await getBuffer(get_data_respon.image_url), caption: get_data_respon.response }, {
          quoted: msg
        })
      }
    }

    const sendContact = (jid, numbers, name, quoted, mn) => {
      let number = numbers.replace(/[^0-9]/g, '')
      const vcard = 'BEGIN:VCARD\n'
        + 'VERSION:3.0\n'
        + 'FN:' + name + '\n'
        + 'ORG:;\n'
        + 'TEL;type=CELL;type=VOICE;waid=' + number + ':+' + number + '\n'
        + 'END:VCARD'
      return conn.sendMessage(from, { contacts: { displayName: name, contacts: [{ vcard }] }, mentions: mn ? mn : [] }, { quoted: quoted })
    }

    // presence update
    // await conn.sendPresenceUpdate('unavailable', from)

    // Terminal Logger
    const timeFormatted = moment(msg.messageTimestamp ? msg.messageTimestamp * 1000 : Date.now()).format('DD/MM/YYYY HH:mm:ss')
    const formattedChats = chats ? chats.replace(/\n/g, '\n│          ') : ''

    // Logs Command (RED)
    if (isCmd && fromMe) {
      let logTxt = chalk.red('╭──────────────────────────────────────────────────╮') + '\n'
      logTxt += chalk.red('│') + chalk.red.bold('              ⚡ COMMAND DETECTED                 ') + chalk.red('│') + '\n'
      logTxt += chalk.red('├──────────────────────────────────────────────────┤') + '\n'
      logTxt += chalk.red('│') + chalk.white(` 🕒 Time   : ${timeFormatted}`) + '\n'
      logTxt += chalk.red('│') + chalk.white(` 👤 From   : ${senderDisplay}`) + '\n'
      logTxt += chalk.red('│') + chalk.white(` 📍 In     : ${isGroup ? (groupName || 'Group Chat') : 'Personal Chat'}`) + '\n'
      logTxt += chalk.red('│') + chalk.red.bold(` 🎯 Cmd    : ${prefix}${command}`) + chalk.gray(` [${args.length} args]`) + '\n'
      if (q) logTxt += chalk.red('│') + chalk.yellow(` 💬 Input  : ${q}`) + '\n'
      logTxt += chalk.red('╰──────────────────────────────────────────────────╯')
      console.log(logTxt)
    }

    // Logs Personal Chat (BLUE)
    if (!isCmd && !isGroup && chats && chats !== 'undefined' && !isSticker && !isMedia) {
      let logTxt = chalk.blue('╭──────────────────────────────────────────────────╮') + '\n'
      logTxt += chalk.blue('│') + chalk.blue.bold('             💬 PERSONAL CHAT LOG                 ') + chalk.blue('│') + '\n'
      logTxt += chalk.blue('├──────────────────────────────────────────────────┤') + '\n'
      logTxt += chalk.blue('│') + chalk.white(` 🕒 Time   : ${timeFormatted}`) + '\n'
      logTxt += chalk.blue('│') + chalk.white(` 👤 From   : ${senderDisplay}`) + '\n'
      logTxt += chalk.blue('│') + chalk.cyan(` 💬 Text   : ${formattedChats}`) + '\n'
      logTxt += chalk.blue('╰──────────────────────────────────────────────────╯')
      console.log(logTxt)
    }

    // Logs Group Chat (YELLOW)
    if (!isCmd && isGroup && chats && chats !== 'undefined' && !isSticker && !isMedia) {
      let logTxt = chalk.yellow('╭──────────────────────────────────────────────────╮') + '\n'
      logTxt += chalk.yellow('│') + chalk.yellow.bold('             👥 GROUP CHAT LOG                    ') + chalk.yellow('│') + '\n'
      logTxt += chalk.yellow('├──────────────────────────────────────────────────┤') + '\n'
      logTxt += chalk.yellow('│') + chalk.white(` 🕒 Time   : ${timeFormatted}`) + '\n'
      logTxt += chalk.yellow('│') + chalk.white(` 👤 Sender : ${senderDisplay}`) + '\n'
      logTxt += chalk.yellow('│') + chalk.white(` 🏘️ Group  : ${groupName || 'Group Chat'}`) + '\n'
      logTxt += chalk.yellow('│') + chalk.yellowBright(` 💬 Text   : ${formattedChats}`) + '\n'
      logTxt += chalk.yellow('╰──────────────────────────────────────────────────╯')
      console.log(logTxt)
    }

    if (!fromMe) return

    // Eval
    if (chats.startsWith("x ")) {
      console.log(color('[EVAL]'), color(moment(msg.messageTimestamp * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`From Owner`))
      try {
        let evaled = await eval(chats.slice(1))
        if (typeof evaled !== 'string') evaled = require("util").inspect(evaled)
        reply(`${evaled}`)
      } catch (err) {
        reply(err)
      }
    }
    if (chats.startsWith("> ")) {
      console.log(color('[EVAL]'), color(moment(msg.messageTimestamp * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`Dari Owner aowkoakwoak`))
      const ev = (sul) => {
        var sat = JSON.stringify(sul, null, 2)
        var bang = util.format(sat)
        if (sat == undefined) {
          bang = util.format(sul)
        }
        return reply(bang)
      }
      try {
        reply(util.format(eval(`;(async () => { ${chats.slice(1)} })()`)))
      } catch (e) {
        reply(util.format(e))
      }
    }

    if (chats.startsWith("Test")) {
      adReply(`*SELFBOT ONLINE* ✅

• Botname : ${setting.botName}
• Library : Baileys
• Prefix : ${prefix}
• Creator : ${setting.ownerName}
• Runtime : ${runtime(process.uptime())}
• Source Code :
https://github.com/dragneel1111/Simple-Selfbot
`,
        `${tanggal}`, `${jam}`)
      console.log(color(`[ SELFBOT ONLINE || RUNTIME: ${runtime(process.uptime())} ] ${tanggal}`, 'cyan'))
    }

    switch (command) {

      case 'menu': case 'help':
        if (!q) {
          var cptn = `*Just Simple Selfbot*\n${readmore}\n`
          cptn += `_Convert_\n`
          cptn += `• ${prefix}sticker\n`
          cptn += `• ${prefix}toimg\n`
          cptn += `• ${prefix}tovideo\n`
          cptn += `• ${prefix}toaudio\n`
          cptn += `• ${prefix}tourl\n`
          cptn += `• ${prefix}take\n`
          cptn += `• ${prefix}stickermeme\n\n`
          cptn += `_Downloader_\n`
          cptn += `• ${prefix}play\n`
          cptn += `• ${prefix}ytsearch\n`
          cptn += `• ${prefix}ytmp3\n`
          cptn += `• ${prefix}ytmp4\n`
          cptn += `• ${prefix}tiktok\n`
          cptn += `• ${prefix}mediafire\n`
          cptn += `• ${prefix}mega\n\n`
          cptn += `_Tools_\n`
          cptn += `• ${prefix}creator\n`
          cptn += `• ${prefix}setppbot\n`
          cptn += `• ${prefix}infogroup\n`
          cptn += `• ${prefix}reply\n`
          cptn += `• ${prefix}readmore\n`
          cptn += `• ${prefix}hidetag\n\n`
          cptn += `${setting.wm}\n_Create by @Rafli A.~_\n_Since 01-12-2020_`
          adReply2(cptn, setting.wm, setting.botName)
        } else if (q.includes('owner')) {
          var cptn = `_Owner Tools_\n`
          cptn += `• ${prefix}setprefix\n`
          cptn += `• ${prefix}setmenu\n`
          cptn += `• ${prefix}setadreply\n`
          cptn += `• ${prefix}setthumb\n`
          cptn += `• ${prefix}error\n`
          cptn += `• ${prefix}clear\n`
          cptn += `• ${prefix}addrespon\n`
          cptn += `• ${prefix}delrespon\n`
          adReply(cptn, tanggal, jam)
        }
        break

      // DOWNLOADER
      case 'mega':
        if (!q) return reply(`example:\n${prefix + command} https://mega.nz/file/0FUA2bzb#vSu3Ud9Ft_HDz6zPvfIg_y62vE1qF8EmoYT3kY16zxo`)
        var file = File.fromURL(q)
        await file.loadAttributes()
        if (file.size >= 300000000) return adReply('Minimum Size: 300MB', 'Error: file size is too large ')
        adReply(`*_Please wait a few minutes..._*`, file.name, 'downloading...')
        var data = await file.downloadBuffer()
        await conn.sendMessage(from, {
          document: data,
          mimetype: file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
          fileName: file.name
        }, { quoted: msg })
        break

      case 'play':
      case 'ytplay':
        if (!q) return reply(`example:\n${prefix + command} kokoronashi`)
        var ytplay = await searchYouTube(q)
        if (!ytplay.length) return reply('Video tidak ditemukan')
        var hasil = await downloadYouTube(ytplay[0].url, 'audio')
        await conn.sendMessage(from, {
          document: hasil,
          mimetype: "audio/mpeg",
          fileName: `${ytplay[0].title}.mp3`,
          jpegThumbnail: fs.readFileSync('./sticker/thumb.jpg'),
        }, { quoted: msg })
        await conn.sendMessage(from, { audio: hasil, mimetype: "audio/mpeg" }, { quoted: msg })
        break

      case 'ytmp3':
      case 'mp3':
        if (!q) return reply(`example\n${prefix + command} https://youtu.be/Pp2p4WABjos`)
        var hasil = await downloadYouTube(q, 'audio')
        await conn.sendMessage(from, {
          document: hasil,
          mimetype: "audio/mpeg",
          fileName: `youtube-audio.mp3`,
          jpegThumbnail: fs.readFileSync('./sticker/thumb.jpg'),
        }, { quoted: msg })
        await sleep(500)
        await conn.sendMessage(from, { audio: hasil, mimetype: "audio/mpeg" }, { quoted: msg })
        break
      case 'ytmp4':
      case 'mp4':
        if (!q) return reply(`example\n${prefix + command} https://youtu.be/Pp2p4WABjos`)
        var hasil = await downloadYouTube(q, 'video')
        await conn.sendMessage(from, {
          video: hasil,
          caption: 'YouTube video',
        }, { quoted: msg })
        break
      case 'ytsearch':
      case 'yts':
        if (!q) return reply(`example:\n${prefix + command} Tekotok`)
        var data = await searchYouTube(q)
        if (!data.length) return reply('Video tidak ditemukan')
        var cptn = `_*Result of ${q}*_\n\n`
        for (let y of data) {
          cptn += `• title: ${y.title}\n`
          cptn += `• duration: ${y.durationH}\n`
          cptn += `• uploaded: ${y.publishedTime}\n`
          cptn += `• views: ${y.viewH}\n`
          cptn += `• url: ${y.url}\n\n`
        }
        adReply(cptn, q, 'Youtube Search', msg)
        break

      case 'tiktok':
      case 'tt':
        if (!q) return reply(`example :\n${prefix + command} https://vt.tiktok.com/ZSN7Lf1dg/`)
        var data = await fetchJson(`https://www.tikwm.com/api/?url=${encodeURIComponent(q)}&hd=1`)
        hasil = data.data
        try {
          var url = data.data.images
          var cptn = `*Id:* ${hasil.author.unique_id}\n`
          cptn += `*Nickname:* ${hasil.author.nickname}\n`
          cptn += `*Play Count:* ${hasil.play_count}\n`
          cptn += `*Comment Count:* ${hasil.comment_count}\n`
          cptn += `*Download Count:* ${hasil.download_count}\n`
          cptn += `*Images Count:* ${url.length}\n`
          cptn += `\n${hasil.title}`
          await adReply(cptn, "Uploading Media...", "Tiktok Downloader", msg)
          await sleep(500)
          for (let o = 0; o < url.length; o++) {
            await conn.sendMessage(from, {
              [(/mp4/.test(url[o])) ? "video" : "image"]: { url: url[o] }
            },
              { quoted: msg })
            await sleep(200)
          }
        } catch (err) {
          var url = data.data.play
          var cptn = `*Id:* ${hasil.author.unique_id}\n`
          cptn += `*Nickname:* ${hasil.author.nickname}\n`
          cptn += `*Play Count:* ${hasil.play_count}\n`
          cptn += `*Comment Count:* ${hasil.comment_count}\n`
          cptn += `*Download Count:* ${hasil.download_count}\n`
          cptn += `\n${hasil.title}`
          await conn.sendMessage(from, {
            video: { url: url },
            caption: cptn,
          },
            { quoted: msg })
        }
        break

      case 'mediafire':
        if (!q) return reply('*example:*\n#mediafire https://www.mediafire.com/file/451l493otr6zca4/V4.zip/file')
        let isLinks = q.match(/(?:https?:\/{2})?(?:w{3}\.)?mediafire(?:com)?\.(?:com|be)(?:\/www\?v=|\/)([^\s&]+)/)
        if (!isLinks) return reply('Invalid Link')
        let baby1 = await mediafireDl(isLinks[0])
        if (baby1[0].size.split('MB')[0] >= 1500) return reply('File Melebihi Batas ' + util.format(baby1))
        let result4 = `*MEDIAFIRE DOWNLOADER*

*Name* : ${baby1[0].nama}
*Size* : ${baby1[0].size}
*Type* : ${baby1[0].mime}

_Wait Mengirim file..._
`
        adReply(result4, `${baby1[0].nama}`, ``)
        conn.sendMessage(from, { document: { url: baby1[0].link }, fileName: baby1[0].nama, mimetype: baby1[0].mime }, { quoted: msg }).catch((err) => adReply('*Failed to uploading media*', 'ERROR'))
        break

      // Owner tools

      case 'setmenu':
        if (isImage || isQuotedImage) {
          await conn.downloadAndSaveMediaMessage(msg, 'image', `./sticker/menu.jpg`)
        }
        reply('Done')
        break
      case 'setthumb':
        if (isImage || isQuotedImage) {
          await conn.downloadAndSaveMediaMessage(msg, 'image', `./sticker/thumb.jpg`)
        }
        reply('Done')
        break
      case 'setadreply':
        if (isImage || isQuotedImage) {
          await conn.downloadAndSaveMediaMessage(msg, 'image', `./sticker/adreply.jpg`)
        }
        reply('Done')
        break
      case 'setppbot':
      case 'setpp':
      case 'spb':
        if (!isImage && !isQuotedImage) return reply(`Kirim atau balas gambar dengan caption ${prefix + command}`)
        await conn.downloadAndSaveMediaMessage(msg, "image", `./sticker/${sender.split('@')[0]}.jpg`)
        var media = `./sticker/${sender.split('@')[0]}.jpg`
        try {
          await updateFullProfilePicture(conn, botNumber, media)
          reply('Foto profil berhasil diperbarui')
        } finally {
          if (fs.existsSync(media)) fs.unlinkSync(media)
        }
        break
      case 'setprefix':
        if (!args[0]) return reply(`Gunakan ${prefix + command} <prefix-baru>`)
        setting.prefix = args[0]
        fs.writeFileSync('./config.json', JSON.stringify(setting, null, 2))
        reply('done')
        break
      case 'mysesi': case 'sendsesi': case 'session': {
        reply('Pengiriman session dinonaktifkan demi keamanan. Backup folder sessions langsung dari perangkat dan jangan pernah membagikannya.')
      }
        break

      case 'clear':
      case 'clearer':
      case 'clearerr': {
        server_eror.length = 0
        fs.writeFileSync('./database/func_error.json', JSON.stringify(server_eror))
        reply('Done')
      }
        break
      case 'error': {
        var teks = `*ERROR SERVER*\n_Error total_ : ${server_eror.length}\n\n`
        var NO = 1
        for (let i of server_eror) {
          teks += `=> *ERROR (${NO++})*\n${i.error}\n\n`
        }
        adReply(teks, "List Error", "")
      }
        break
      case 'addrespon':
        var args1 = q.split("|")[0]
        var args2 = q.split("|")[1]
        if (!q.includes("|")) return reply(`use ${prefix + command} *key|response*\n\n_example_\n\n#${command} tes|apa`)
        if (isAlreadyResponList(from, args1, db_respon_list)) return reply(`Response key : *${args1}* already added in this group`)
        addResponList(from, args1, args2, false, '-', db_respon_list)
        reply(`Success add key: *${args1}*`)
        break
      case 'delrespon':
        if (db_respon_list.length === 0) return reply(`not found`)
        if (!q) return reply(`use: ${prefix + command} *key*\n\n_example_\n\n${command} hello`)
        if (!isAlreadyResponList(from, q, db_respon_list)) return reply(`List response key: *${q}* not found in database!`)
        delResponList(from, q, db_respon_list)
        reply(`Success delete key: *${q}*`)
        break

      case 'fitnah':
      case 'reply':
        if (!isGroup) return reply('Perintah ini hanya dapat digunakan di dalam grup!')
        if (!q || !q.includes('|')) return reply(`Contoh penggunaan:\n*${prefix + command}* @tag|pesan target|pesan bot`)
        const argsFitnah = q.split('|')
        const org = argsFitnah[0] ? argsFitnah[0].trim() : ''
        const target = argsFitnah[1] ? argsFitnah[1].trim() : ''
        const bot = argsFitnah[2] ? argsFitnah[2].trim() : ''
        if (!org) return reply('Tag atau masukkan nomor target!')
        if (!target) return reply('Masukkan pesan target!')
        if (!bot) return reply('Masukkan pesan bot!')

        let targetJid
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        if (mentionedJids.length > 0) {
          targetJid = mentionedJids[0]
        } else {
          const parsedTarget = parseMention(org)
          if (parsedTarget.length > 0) {
            targetJid = parsedTarget[0]
          } else {
            const num = org.replace(/[^0-9]/g, '')
            if (num) targetJid = `${num}@s.whatsapp.net`
          }
        }

        if (!targetJid) return reply('Nomor/Tag target tidak valid!')
        targetJid = conn.decodeJid(targetJid)

        const targetMentions = parseMention(target)
        const fakeQuoted = {
          key: {
            fromMe: false,
            participant: targetJid,
            ...(from ? { remoteJid: from } : {})
          },
          message: targetMentions.length > 0 ? {
            extendedTextMessage: {
              text: target,
              contextInfo: { mentionedJid: targetMentions }
            }
          } : {
            conversation: target
          }
        }

        const allMentions = Array.from(new Set([
          ...parseMention(bot),
          ...parseMention(q),
          ...(mentionedJids || []),
          targetJid
        ]))

        await conn.sendMessage(from, { text: bot, mentions: allMentions }, { quoted: fakeQuoted })
        break


      case 'setppgrup':
      case 'setppgc':
      case 'spgc':
        if (!isGroup) return
        if (!isImage && !isQuotedImage) return reply(`Kirim atau balas gambar dengan caption ${prefix + command}`)
        await conn.downloadAndSaveMediaMessage(msg, "image", `./sticker/${sender.split('@')[0]}.jpg`)
        var media = `./sticker/${sender.split('@')[0]}.jpg`
        try {
          await updateFullProfilePicture(conn, from, media)
          reply('Foto profil grup berhasil diperbarui')
        } finally {
          if (fs.existsSync(media)) fs.unlinkSync(media)
        }
        break

      case 'tagall':
        if (!q) return reply(`Teks?`)
        let teks_tagall = `══✪〘 *👥 Tag All* 〙✪══\n\n${q ? q : ''}\n\n`
        for (let mem of participants) {
          teks_tagall += `➲ @${mem.id.split('@')[0]}\n`
        }
        conn.sendMessage(from, { text: teks_tagall, mentions: participants.map(a => a.id) }, { quoted: msg })
        break
      case 'hidetag':
      case 'h':
        if (!isGroup) return
        let mem = [];
        groupMembers.map(i => mem.push(i.id))
        conn.sendMessage(from, { text: q ? q : '', mentions: mem })
        break

      case 'infogc':
      case 'infogrup':
      case 'infogroup':
        if (!isGroup) return
        var ppgc = await conn.profilePictureUrl(from, 'image')
        let cekgcnya = `*INFO GROUP*
        
• *ID:* ${from}
• *Name:* ${groupName}
• *Member:* ${groupMembers.length}
• *Total Admin:* ${groupAdmins.length}
• *Description:*\n ${groupMetadata.desc}
`
        await conn.sendMessage(from, {
          image: { url: ppgc },
          caption: cekgcnya
        })
        break

      //TOOLS

      case 'tourl': case 'upload':
        if (isVideo || isQuotedVideo) {
          await conn.downloadAndSaveMediaMessage(msg, 'video', `./sticker/${sender.split("@")[0]}.mp4`)
          let buffer_up = fs.readFileSync(`./sticker/${sender.split("@")[0]}.mp4`)
          var rand2 = 'sticker/' + getRandom('.mp4')
          fs.writeFileSync(`./${rand2}`, buffer_up)
          var text = await TelegraPh(rand2)
          reply(text)
          fs.unlinkSync(`./sticker/${sender.split("@")[0]}.mp4`)
          fs.unlinkSync(rand2)
        } else if (isImage || isQuotedImage) {
          var mediany = await conn.downloadAndSaveMediaMessage(msg, 'image', `./sticker/${sender.split("@")[0]}.jpg`)
          let buffer_up = fs.readFileSync(mediany)
          var rand2 = 'sticker/' + getRandom('.png')
          fs.writeFileSync(`./${rand2}`, buffer_up)
          var text = await TelegraPh(rand2)
          reply(text)
          fs.unlinkSync(mediany)
          fs.unlinkSync(rand2)
        }
        break

      case 'readmore':
        var txt1 = q.split('|')[0]
        var txt2 = q.split('|')[1]
        await conn.sendMessage(from, { text: `${txt1}${readmore}${txt2}` })
        break

      // CONVERT
      case 'toimg': case 'toimage':
        if (isSticker || isQuotedSticker) {
          await conn.downloadAndSaveMediaMessage(msg, "sticker", `./sticker/${sender.split("@")[0]}.webp`)
          let buffer = fs.readFileSync(`./sticker/${sender.split("@")[0]}.webp`)
          var rand1 = 'sticker/' + getRandom('.webp')
          var rand2 = 'sticker/' + getRandom('.png')
          fs.writeFileSync(`./${rand1}`, buffer)
          execFile(ffmpegPath, ['-y', '-i', `./${rand1}`, `./${rand2}`], (err) => {
            fs.unlinkSync(`./${rand1}`)
            if (err) return reply('*ERROR*')
            conn.sendMessage(from, { image: fs.readFileSync(`./${rand2}`), jpegThumbnail: fs.readFileSync('./sticker/thumb.jpg'), fileLength: 99999999999999 }, { quoted: msg })
            fs.unlinkSync(`./${rand2}`)
            fs.unlinkSync(`./sticker/${sender.split("@")[0]}.webp`)
          })
        } else {
          reply(`Tag/reply picture with caption ${prefix + command}`)
        }
        break
      case 'tomp4': case 'tovideo':
        if (isSticker || isQuotedSticker) {
          await conn.downloadAndSaveMediaMessage(msg, "sticker", `./sticker/${sender.split("@")[0]}.webp`)
          let buffer = `./sticker/${sender.split("@")[0]}.webp`
          let webpToMp4 = await webp2mp4File(buffer)
          conn.sendMessage(from, { video: webpToMp4.result, caption: 'Convert Webp To Video', jpegThumbnail: fs.readFileSync('./sticker/thumb.jpg') }, { quoted: msg })
          fs.unlinkSync(buffer)
        } else {
          reply(`Tag/reply picture with caption ${prefix + command}`)
        }
        break
      case 'tomp3': case 'toaudio':
        if (isVideo || isQuotedVideo) {
          await conn.downloadAndSaveMediaMessage(msg, 'video', `./sticker/${sender.split("@")[0]}.mp4`)
          const inputFile = `./sticker/${sender.split("@")[0]}.mp4`
          const outputFile = 'sticker/' + getRandom('.mp3')
          execFile(ffmpegPath, ['-y', '-i', inputFile, '-vn', '-codec:a', 'libmp3lame', outputFile], (err) => {
            if (err) {
              if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile)
              return reply('*ERROR*: pastikan FFmpeg sudah terpasang dan tersedia di PATH')
            }
            var buffer453 = fs.readFileSync(outputFile);
            conn.sendMessage(from, {
              audio: buffer453,
              mimetype: "audio/mpeg"
            }, { quoted: msg });
            fs.unlinkSync(outputFile);
            fs.unlinkSync(inputFile)
          })
        }
        break

      case 'smeme':
      case 'stikermeme':
      case 'stickermeme':
      case 'memestiker':
      case 'stcmeme':
        anu = q.split("|");
        var atas = anu[0] !== "" ? anu[0] : " ";
        var bawah = q.split('|')[1]
        if (!q) return reply(`Kirim gambar dengan caption ${prefix + command} text_atas|text_bawah atau balas gambar yang sudah dikirim`)
        if (isImage || isQuotedImage) {
          var media = await conn.downloadAndSaveMediaMessage(msg, 'image', `./sticker/${sender.split('@')[0]}.jpg`)
          var media_url = await TelegraPh(media)
          var meme_url = `https://api.memegen.link/images/custom/${encodeURIComponent(atas)}/${encodeURIComponent(bawah)}.png?background=${media_url}`
          var buffer = await createSticker(meme_url, { author: setting.wm, quality: 50 })
          conn.sendMessage(from, { sticker: buffer, fileLength: 1000000000000 }, { quoted: msg })
          fs.unlinkSync(media)
        }
        break

      case 'swm':
      case 'stikerwm':
      case 'stickerwm':
      case 'takesticker':
      case 'take':
        var anu = q.split("|");
        var pname = anu[0] !== "" ? anu[0] : ``;
        var athor = q.split('|')[1]
        if (isSticker || isQuotedSticker) {
          await conn.downloadAndSaveMediaMessage(msg, "sticker", `./sticker/${sender.split("@")[0]}.webp`)
          var media = fs.readFileSync(`./sticker/${sender.split("@")[0]}.webp`)
          var buffer = await createSticker(media, { pack: pname, author: athor, quality: 50 })
          conn.sendMessage(from, { sticker: buffer, fileLength: 1000000000000 }, { quoted: msg })
          fs.unlinkSync(`./sticker/${sender.split("@")[0]}.webp`)
        } else {
          reply(`reply dengan caption ${prefix + command} packname|author atau balas video/foto yang sudah dikirim`)
        }
        break
      case 'sticker': case 's': case 'stiker': case 'stc':
        if (isImage || isQuotedImage) {
          await conn.downloadAndSaveMediaMessage(msg, "image", `./sticker/${sender.split("@")[0]}.jpeg`)
          let stci = fs.readFileSync(`./sticker/${sender.split("@")[0]}.jpeg`)
          var buffer = await createSticker(stci, { author: setting.wm, quality: 75 })
          conn.sendMessage(from, { sticker: buffer, fileLength: 99999999 }, { quoted: msg })
          fs.unlinkSync(`./sticker/${sender.split("@")[0]}.jpeg`)
        } else if ((isVideo && msg.message.videoMessage.seconds < 10) || (isQuotedVideo && quotedMsg?.videoMessage?.seconds < 10)) {
          await conn.downloadAndSaveMediaMessage(msg, "video", `./sticker/${sender.split("@")[0]}.mp4`)
          let stcg = fs.readFileSync(`./sticker/${sender.split("@")[0]}.mp4`)
          const stikk = await createSticker(stcg, { author: setting.wm, quality: 20, video: true })
          conn.sendMessage(from, { sticker: stikk, fileLength: 99999999 }, { quoted: msg })
          fs.unlinkSync(`./sticker/${sender.split("@")[0]}.mp4`)
        }
        break
      case 'stickercrop': case 'scrop': case 'stikercrop':
        if (isImage || isQuotedImage) {
          await conn.downloadAndSaveMediaMessage(msg, "image", `./sticker/${sender.split("@")[0]}.jpeg`)
          let stci = fs.readFileSync(`./sticker/${sender.split("@")[0]}.jpeg`)
          var buffer = await createSticker(stci, { author: setting.wm, quality: 75, cropped: true })
          conn.sendMessage(from, { sticker: buffer, fileLength: 99999999 }, { quoted: msg })
          fs.unlinkSync(`./sticker/${sender.split("@")[0]}.jpeg`)
        } else if ((isVideo && msg.message.videoMessage.seconds < 10) || (isQuotedVideo && quotedMsg?.videoMessage?.seconds < 10)) {
          await conn.downloadAndSaveMediaMessage(msg, "video", `./sticker/${sender.split("@")[0]}.mp4`)
          let stcg = fs.readFileSync(`./sticker/${sender.split("@")[0]}.mp4`)
          const stikk = await createSticker(stcg, { author: setting.wm, quality: 20, cropped: true, video: true })
          conn.sendMessage(from, { sticker: stikk, fileLength: 99999999 }, { quoted: msg })
          fs.unlinkSync(`./sticker/${sender.split("@")[0]}.mp4`)
        }
        break

      default:

    }
  } catch (err) {
    console.log(color('[ERROR]', 'red'), err)
    server_eror.push({ "error": `${err}` })
    fs.writeFileSync('./database/func_error.json', JSON.stringify(server_eror))
  }
}
