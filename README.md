# WhatsApp Bot Mentioned All 🌐

## Deskripsi

Dalam repo ini, membuat sebuah bot yang langsung terhubung dengan whatsapp. mengirim pesan secara otomatis, membalas pesan otomatis dan lain sebagai nya. Namun pada kali ini saya akan mengimplementasikan pembuatan tag all. bagaimana caranya? beginilah caranya!

## Fitur

- Bot Api 🤖
- @hapi/boom 📨
- @whiskeysockets/baileys 🔃

## Cara Membuat Aplikasi

### Langkah 1:

Anda bisa membuat aplikasi ini dengan hardcore ( menulis sendiri ) karena code nya tergolong singkat dan mudah dipahami, atau anda bisa menjalankan perintah ini untuk meng-clone repositori ini
Jalankan perintah:

```
git clone https://github.com/panntod/Whatsapp-Mentioned-All.git
```

### Langkah 2:

Instalasi dependencies, pastikan anda telah menginstal berbagai dependesi yang dibutuhkan, kalau anda meng-clone repositori ini anda bisa menjalankan perintah:

```
npm i
# OR
pnpm i
# OR
yarn add
```

### Langkah 3:

Anda bisa menjalankan aplikasi dengan perintah:

```
npm start
```

### Langkah 4:

Jika aplikasi sudah berjalan, maka akan muncul sebuah qr ( barcode ) anda bisa meng-scan nya menggunakan whatsapp di pengaturan/ tautkan perangkat

### Langkah 5:

Tunggu sampai muncul tulisan `bot siap dipakai`, dan kirim pesan anda dengan kode yang telah anda buat. disini saya menggunakan `info`, otomatis bot akan mengambil gambar dan menyimpan nya di localstorage anda, dan mengirim secara otomatis

## Kustomisasi:

1. Anda bisa merubah perintah untuk menjalankan bot:

```js
if (m.messages[0].message?.conversation === "customable") {     // Perintah ini bisa diganti dengan apa pun untuk menjalankan bot
    const groupData = await sock.groupMetadata(
      m.messages[0].key.remoteJid as string
    );
}
```

2. Anda bisa merubah pesan yang dikirim oleh bot:

```js
    await sock.sendMessage(m.messages[0].key.remoteJid as string, {
      text: "@customable",                                        // Pesan yang dikirim oleh bot bisa diganti dengan apa pun
      mentions: mentionedJidList,
    });
  
```
# bot-wa
