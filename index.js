const express = require('express');
const http = require('http');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

const SERVER_IP = '192.168.50.144';
const PORT = 3000;

function httpGet(url, timeout) {
  return new Promise((resolve) => {
    let responded = false;
    const request = http.get(url, { timeout }, (response) => {
      if (!responded) { responded = true; resolve(response.statusCode); }
    });
    request.on('error', () => { if (!responded) { responded = true; resolve(null); } });
    request.on('timeout', () => { request.destroy(); if (!responded) { responded = true; resolve(null); } });
  });
}

// Sprawdź czy serwer żyje (ogólny ping)
app.get('/api/status', async (req, res) => {
  const code = await httpGet(`http://${SERVER_IP}`, 2000);
  res.json({ online: code !== null });
});

// Sprawdź czy nginx jest gotowy (healthz)
app.get('/api/ready', async (req, res) => {
  const code = await httpGet(`http://${SERVER_IP}/healthz`, 2000);
  res.json({ ready: code === 200 });
});

app.post('/api/wake', (req, res) => {
  exec('wakeonlan -i 192.168.50.255 30:9c:23:63:a4:de', (error, stdout, stderr) => {
    if (error) res.status(500).json({ success: false, error: stderr });
    else res.json({ success: true, message: 'Magic packet wysłany' });
  });
});

app.listen(PORT, () => {
  console.log(`Backend działa na porcie ${PORT}`);
});
