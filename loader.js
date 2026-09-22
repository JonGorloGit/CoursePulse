import fs from 'fs';
const p='public/index.html';
let html=fs.readFileSync(p,'utf8');
if(!html.includes('/patch.js')){
  html=html.replace('</body>','<script src="/patch.js"></script></body>');
  fs.writeFileSync(p,html);
}
await import('./server.js');
