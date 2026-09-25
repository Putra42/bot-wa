// 9xdown.js atau di bagian atas index.js
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function get9xDownloadLinks(videoUrl) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const processUrl = `https://9xbuddy.com/process?url=${encodeURIComponent(videoUrl)}`;
  await page.goto(processUrl, { waitUntil: 'networkidle2' });

  // Poll sampai link muncul
  let downloadLinks = [];
  let retries = 0, maxRetries = 30;
  while (retries < maxRetries) {
    let anchors = await page.$$eval('a', as => as.map(a => [a.innerText, a.href]));
    downloadLinks = anchors
      .filter(([text, href]) => text && text.toLowerCase().includes('download now') && href && href.startsWith('http'))
      .map(([text, href]) => ({ label: text.toLowerCase(), url: href }));

    if (downloadLinks.length > 0) break;
    await new Promise(r => setTimeout(r, 1000));
    retries++;
  }
  await browser.close();
  return downloadLinks;
}

async function download9xBuddy(videoUrl, folderName = '9xvideos') {
  const downloadPath = path.join(__dirname, folderName);
  if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

  const links = await get9xDownloadLinks(videoUrl);

  let original = links.find(l => l.url.endsWith('.mp4'));
  let backup = links.find(l => l.url.includes('customName=Player_Backup'));
  let backup2 = links.find(l => l.url.includes('customName=Player_+%2F2'));

  let selected = null;
  for (let candidate of [original, backup, backup2]) {
    if (candidate) {
      try {
        const res = await axios.head(candidate.url, { maxRedirects: 3, timeout: 10000 });
        if (res.status === 200) {
          selected = candidate;
          break;
        }
      } catch { /* try next */ }
    }
  }

  if (!selected) throw new Error('Tidak ada link yang bisa didownload');

  // Penamaan file aman
  let filename = 'video.mp4';
  try {
    const urlObj = new URL(selected.url);
    if (urlObj.searchParams.has('customName')) {
      filename = urlObj.searchParams.get('customName')
        .replace(/[^\w\-_\.]/gi, '_') + '.mp4';
    } else {
      const match = selected.url.match(/([a-zA-Z0-9\-_]{8,})\.mp4/);
      if (match) filename = match[0];
      else filename = 'backup2_' + Date.now() + '.mp4';
    }
  } catch (e) {
    filename = 'backup2_' + Date.now() + '.mp4';
  }
  const filePath = path.join(downloadPath, filename);

  // Download file
  const writer = fs.createWriteStream(filePath);
  const response = await axios.get(selected.url, { responseType: 'stream' });
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  return filePath; // Path ke file lokal
}

module.exports = { download9xBuddy };
