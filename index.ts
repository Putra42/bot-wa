
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";

import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";


// ======================================================
// NOMOR TUJUAN
// ======================================================

const TARGET_NUMBER = "62895391518953@s.whatsapp.net";


// ======================================================
// CONNECT WHATSAPP
// ======================================================

async function connectToWhatsApp() {

  const {
    state,
    saveCreds,
  } = await useMultiFileAuthState("session");


  const sock = makeWASocket({
    auth: state,

    // Jangan gunakan printQRInTerminal
    // karena sudah deprecated
    printQRInTerminal: false,

    browser: [
      "Ubuntu",
      "Chrome",
      "22.04.4",
    ],
  });


  // ====================================================
  // SAVE LOGIN SESSION
  // ====================================================

  sock.ev.on(
    "creds.update",
    saveCreds
  );


  // ====================================================
  // CONNECTION UPDATE
  // ====================================================

  sock.ev.on(
    "connection.update",
    async (update) => {

      const {
        connection,
        lastDisconnect,
        qr,
      } = update;


      // =================================================
      // QR CODE
      // =================================================

      if (qr) {

        console.log("");
        console.log(
          "=============================================="
        );

        console.log(
          "📱 SCAN QR CODE DENGAN WHATSAPP"
        );

        console.log(
          "=============================================="
        );

        console.log("");


        qrcode.generate(
          qr,
          {
            small: true,
          }
        );
      }


      // =================================================
      // CONNECTED
      // =================================================

      if (connection === "open") {

        console.log("");
        console.log(
          "=============================================="
        );

        console.log(
          "✅ WHATSAPP BERHASIL TERHUBUNG"
        );

        console.log(
          "=============================================="
        );

        console.log("");


        try {

          await sock.sendMessage(
            TARGET_NUMBER,
            {
              text: "hello",
            }
          );


          console.log(
            `✅ Pesan "hello" berhasil dikirim ke ${TARGET_NUMBER}`
          );


        } catch (error) {

          console.error(
            "❌ Gagal mengirim pesan:",
            error
          );
        }
      }


      // =================================================
      // CONNECTION CLOSED
      // =================================================

      if (connection === "close") {

        const statusCode =
          (lastDisconnect?.error as Boom)
            ?.output?.statusCode;


        console.log("");
        console.log(
          "❌ WhatsApp connection closed"
        );

        console.log(
          "Status code:",
          statusCode
        );


        const shouldReconnect =
          statusCode !==
          DisconnectReason.loggedOut;


        if (shouldReconnect) {

          console.log(
            "🔄 Mencoba reconnect dalam 3 detik..."
          );


          setTimeout(() => {

            connectToWhatsApp();

          }, 3000);


        } else {

          console.log(
            "❌ Session WhatsApp sudah logout."
          );

          console.log(
            "Hapus folder session kemudian jalankan kembali."
          );
        }
      }
    }
  );
}


// ======================================================
// START
// ======================================================

connectToWhatsApp();
