const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, pixels) {
  function crc32(buf) {
    let c = 0xFFFFFFFF;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let v = n;
      for (let k = 0; k < 8; k++) v = v & 1 ? 0xEDB88320 ^ (v >>> 1) : v >>> 1;
      table[n] = v;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crc]);
  }

  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * (1 + width * 4) + 1 + x * 4;
      raw[di] = pixels[si]; raw[di+1] = pixels[si+1]; raw[di+2] = pixels[si+2]; raw[di+3] = pixels[si+3];
    }
  }

  const compressed = zlib.deflateSync(raw);
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

function setPixel(pixels, w, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= w || y < 0 || y >= 36) return;
  const i = (y * w + x) * 4;
  const aa = a / 255;
  pixels[i] = Math.round(r * aa + pixels[i] * (1 - aa));
  pixels[i+1] = Math.round(g * aa + pixels[i+1] * (1 - aa));
  pixels[i+2] = Math.round(b * aa + pixels[i+2] * (1 - aa));
  pixels[i+3] = Math.min(255, pixels[i+3] + a);
}

function drawLine(pixels, w, x0, y0, x1, y1, r, g, b, t = 1) {
  const dx = Math.abs(x1-x0), dy = Math.abs(y1-y0);
  const sx = x0<x1?1:-1, sy = y0<y1?1:-1;
  let err = dx-dy;
  while(true) {
    for(let tx=-t;tx<=t;tx++) for(let ty=-t;ty<=t;ty++) setPixel(pixels,w,x0+tx,y0+ty,r,g,b);
    if(x0===x1&&y0===y1)break;
    const e2=2*err;
    if(e2>-dy){err-=dy;x0+=sx;}
    if(e2<dx){err+=dx;y0+=sy;}
  }
}

function drawCircle(pixels, w, cx, cy, radius, r, g, b, filled) {
  for(let y=cy-radius;y<=cy+radius;y++)
    for(let x=cx-radius;x<=cx+radius;x++){
      const d=Math.sqrt((x-cx)**2+(y-cy)**2);
      if(filled?d<=radius:(d>=radius-1.5&&d<=radius+0.5))
        setPixel(pixels,w,Math.round(x),Math.round(y),r,g,b);
    }
}

function drawRect(pixels, w, x0, y0, x1, y1, r, g, b, filled) {
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++)
    if(filled||y===y0||y===y1||x===x0||x===x1) setPixel(pixels,w,x,y,r,g,b);
}

const SIZE = 36;

function createIcon(drawFn, r, g, b) {
  const pixels = Buffer.alloc(SIZE * SIZE * 4);
  drawFn(pixels, SIZE, r, g, b);
  return createPNG(SIZE, SIZE, pixels);
}

function drawMarket(p, w, r, g, b) {
  drawLine(p,w,4,28,10,18,r,g,b,1);
  drawLine(p,w,10,18,18,22,r,g,b,1);
  drawLine(p,w,18,22,26,8,r,g,b,1);
  drawLine(p,w,26,8,32,12,r,g,b,1);
  drawCircle(p,w,26,8,2,r,g,b,true);
}

function drawStar(p, w, r, g, b) {
  const cx=18,cy=16,o=13,i=6,pts=[];
  for(let k=0;k<10;k++){
    const a=(Math.PI/2)+(k*Math.PI/5),rad=k%2===0?o:i;
    pts.push({x:Math.round(cx+rad*Math.cos(a)),y:Math.round(cy-rad*Math.sin(a))});
  }
  for(let k=0;k<pts.length;k++){
    const n=pts[(k+1)%pts.length];
    drawLine(p,w,pts[k].x,pts[k].y,n.x,n.y,r,g,b,1);
  }
  for(let y=cy-5;y<=cy+5;y++) for(let x=cx-5;x<=cx+5;x++){
    let inside=false;
    for(let a=0,j=pts.length-1;a<pts.length;j=a++){
      if((pts[a].y>y)!==(pts[j].y>y)&&x<(pts[j].x-pts[a].x)*(y-pts[a].y)/(pts[j].y-pts[a].y)+pts[a].x) inside=!inside;
    }
    if(inside) setPixel(p,w,x,y,r,g,b);
  }
}

function drawPie(p, w, r, g, b) {
  drawCircle(p,w,18,17,13,r,g,b,false);
  drawLine(p,w,18,17,18,4,r,g,b,1);
  drawLine(p,w,18,17,29,23,r,g,b,1);
}

function drawBell(p, w, r, g, b) {
  drawCircle(p,w,18,14,10,r,g,b,false);
  drawLine(p,w,8,14,8,20,r,g,b,1);
  drawLine(p,w,28,14,28,20,r,g,b,1);
  drawRect(p,w,8,20,28,22,r,g,b,true);
  drawCircle(p,w,18,26,3,r,g,b,true);
}

const iconsDir = path.join(__dirname, 'src/static/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const gray = [153,153,153];
const red = [232,69,60];
const icons = [
  { name: 'market', fn: drawMarket },
  { name: 'watchlist', fn: drawStar },
  { name: 'portfolio', fn: drawPie },
  { name: 'signal', fn: drawBell },
];

icons.forEach(({ name, fn }) => {
  fs.writeFileSync(path.join(iconsDir, `${name}.png`), createIcon(fn, ...gray));
  fs.writeFileSync(path.join(iconsDir, `${name}-active.png`), createIcon(fn, ...red));
  console.log(`Created: ${name}.png & ${name}-active.png`);
});
console.log('Done!');
