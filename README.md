# homeserver-pi

Raspberry Pi Zero W jako brama do domowego serwera.

## Co robi
- Serwuje stronę w stylu BIOS (rudex.click)
- Sprawdza czy główny serwer jest online
- Budzi serwer przez Wake-on-LAN
- Backend Node.js + nginx

## Stack
- Node.js (Express)
- nginx
- wakeonlan
- Cloudflare Tunnel
