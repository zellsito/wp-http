let {
  default: makeWASocket,
  DisconnectReason,
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
} = require('@adiwajshing/baileys')
let pino = require("pino")
let { Boom } = require("@hapi/boom")
let path = require("path").join;
let express = require('express')
let app = new express()

// let QR;

let PORT = 4000
app.listen(PORT, () => {
  console.log(`Running at ${PORT}`);
});

let store = makeInMemoryStore({
  logger: pino().child({
    level: 'silent',
    stream: 'store'
  })
})

async function start() {

  // connect to whatsapp
  async function connect() {
    let { state, saveState } = useSingleFileAuthState(path(__dirname, `./sessions.json`), pino({ level: "silent" }));
    let { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`Using: ${version}, newer: ${isLatest}`);

    let conn = makeWASocket({
      printQRInTerminal: true,
      auth: state,
      logger: pino({
        level: "silent"
      }),
      version,
    });

    store.bind(conn.ev);

    conn.ev.on("creds.update", saveState);

    conn.ev.on("connection.update", async (up) => {
      let { lastDisconnect, connection } = up;

      if (connection) {
        console.log("Connection Status: ", connection);
      }

      if (connection === "close") {
        let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason === DisconnectReason.badSession) {
          console.log(`Bad Session File, Please Delete sessions.json and Scan Again`);
          connect();
          //conn.logout();
        } else if (reason === DisconnectReason.connectionClosed) {
          console.log("Connection closed, reconnecting....");
          connect();
        } else if (reason === DisconnectReason.connectionLost) {
          console.log("Connection Lost from Server, reconnecting...");
          connect();
        } else if (reason === DisconnectReason.connectionReplaced) {
          console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
          conn.logout();
        } else if (reason === DisconnectReason.loggedOut) {
          console.log(`Device Logged Out, Please Delete ${session} and Scan Again.`);
          conn.logout();
        } else if (reason === DisconnectReason.restartRequired) {
          console.log("Restart Required, Restarting...");
          connect();
        } else if (reason === DisconnectReason.timedOut) {
          console.log("Connection TimedOut, Reconnecting...");
          connect();
        } else {
          conn.end(`Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`);
        }
      }
    })
    conn.ev.on('messages.upsert', async m => {
      await conn.sendMessage(m.messages[0].key.remoteJid, { text: 'Hello there!' })
      //require('./msg/message')(conn, chatUpdate)

    })
    conn.ev.on('group-participants.update', async (chat) => {
      try {
        let mdata = await conn.groupMetadata(chat.id)
        switch(chat.action) {
          case 'add':
            if (_welcome.includes(chat.id)) return
            var num = chat.participants[0]
            var welcomeText = welcome.getWelcomeText(chat.id)
            if (welcomeText.includes('@user')) {
              welcomeText.replace('@user', `@${num.split('@')[0]}`)
            }
            try {
              var imgUrl = await CXD.profilePictureUrl(`${num.split('@')[0]}@c.us`)
            } catch {
              imgUrl = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg'
            }
            if (welcome.getUseProfileImage(mdata.id) == true) {
              conn.sendMessage(mdata.id,  {
                image: {
                  url: imgUrl
                },
                caption: welcomeText,
                mentions: [num]
              })
            } else {
              conn.sendMessage(mdata.id, {
                text: welcomeText,
                mentions: [num]
              })
            }
          break
        }
      } catch (err) {
        console.log("Error:", err)
      }
    })
  }
  connect()
}

app.get('/', (req, res) => {
  res.send('Hola 😎');
});



start()
