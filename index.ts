
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import express, { Request, Response } from "express";
import qrcode from "qrcode-terminal";

const PORT = Number(process.env.WHATSAPP_BOT_PORT || 3001);
const TOKEN = process.env.WHATSAPP_BOT_TOKEN;
const SESSION_DIR = process.env.WHATSAPP_SESSION_DIR || "session";

type SendRequestBody = {
  phone?: string;
  message?: string;
};

let sock: ReturnType<typeof makeWASocket> | undefined;
let connectionState: "close" | "connecting" | "open" = "close";
let reconnectTimer: NodeJS.Timeout | undefined;

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

async function connectToWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  connectionState = "connecting";
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "22.04.4"],
  });


  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("Scan QR code berikut dengan WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      connectionState = "open";
      console.log("WhatsApp berhasil terhubung.");
    }

    if (connection === "close") {
      connectionState = "close";
      sock = undefined;

      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.error(`Koneksi WhatsApp tertutup. Status: ${statusCode || "unknown"}`);

      if (shouldReconnect && !reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = undefined;
          connectToWhatsApp().catch((error) => {
            console.error("Gagal reconnect ke WhatsApp:", error);
          });
        }, 3000);
      }

      if (!shouldReconnect) {
        console.error("Session WhatsApp logout. Hapus folder session lalu jalankan ulang.");
      }
    }
  });
}

const app = express();
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_request: Request, response: Response) => {
  response.json({ connected: connectionState === "open" });
});

app.post(
  "/send",
  async (
    request: Request<Record<string, never>, unknown, SendRequestBody>,
    response: Response,
  ) => {
    if (!TOKEN || request.headers.authorization !== `Bearer ${TOKEN}`) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const phone = request.body.phone?.trim();
    const message = request.body.message?.trim();
    const normalizedPhone = phone ? normalizePhoneNumber(phone) : "";

    if (!normalizedPhone || !message) {
      response.status(422).json({ message: "phone dan message wajib diisi." });
      return;
    }

    if (connectionState !== "open" || !sock) {
      response.status(503).json({ message: "WhatsApp belum terhubung." });
      return;
    }

    try {
      await sock.sendMessage(`${normalizedPhone}@s.whatsapp.net`, { text: message });
      response.json({ sent: true });
    } catch (error) {
      console.error("Gagal mengirim pesan WhatsApp:", error);
      response.status(502).json({ message: "Gagal mengirim pesan WhatsApp." });
    }
  },
);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`WhatsApp bot API berjalan di http://127.0.0.1:${PORT}`);
});

if (!TOKEN) {
  console.error("WHATSAPP_BOT_TOKEN belum diatur.");
}

connectToWhatsApp().catch((error) => {
  console.error("Gagal memulai WhatsApp bot:", error);
  process.exitCode = 1;
});
