require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

const SERVER_IP   = process.env.SERVER_IP;
const SERVER_MAC  = process.env.SERVER_MAC;
const BROADCAST   = process.env.BROADCAST_IP;
const PORT        = process.env.PORT || 3000;
const API_KEY     = process.env.API_KEY;
const TUNNEL_URL  = process.env.TUNNEL_URL; // np. https://main.rudex.click

function httpGet(url, timeout) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve) => {
    let responded = false;
    const request = lib.get(url, { timeout }, (response) => {
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

// Sprawdź czy nginx + main-app gotowy (opcjonalnie też tunel, jeśli ustawiony TUNNEL_URL)
app.get('/api/ready', async (req, res) => {
  // /api/shutdown/status proxies through nginx → main-app, so 200 means the full stack is up
  const localCode = await httpGet(`http://${SERVER_IP}/api/shutdown/status`, 3000);
  const local = localCode === 200;

  if (!TUNNEL_URL) {
    return res.json({ ready: local });
  }

  const tunnelCode = await httpGet(`${TUNNEL_URL}/api/shutdown/status`, 6000);
  const tunnel = tunnelCode === 200;
  res.json({ ready: local && tunnel, local, tunnel });
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
