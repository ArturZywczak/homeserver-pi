require('dotenv').config();
const express = require('express');
const http = require('http');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

const SERVER_IP   = process.env.SERVER_IP;
const SERVER_MAC  = process.env.SERVER_MAC;
const BROADCAST   = process.env.BROADCAST_IP;
const PORT        = process.env.PORT || 3000;
const API_KEY     = process.env.API_KEY;

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

// Sprawdź czy serwer żyje
app.get('/api/status', async (req, res) => {
  const code = await httpGet(`http://${SERVER_IP}`, 2000);
  res.json({ online: code !== null });
});

// Sprawdź czy nginx gotowy
app.get('/api/ready', async (req, res) => {
  const code = await httpGet(`http://${SERVER_IP}/healthz`, 2000);
  res.json({ ready: code === 200 });
});

// Wyślij WoL — wymaga API key
app.post('/api/wake', (req, res) => {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  exec(`wakeonlan -i ${BROADCAST} ${SERVER_MAC}`, (error, stdout, stderr) => {
    if (error) res.status(500).json({ success: false, error: stderr });
    else res.json({ success: true, message: 'Magic packet wysłany' });
  });
});

app.listen(PORT, () => {
  console.log(`Backend działa na porcie ${PORT}`);
});
