// 创建清晰的TabBar图标
const fs = require('fs');
const path = require('path');

// 生成PNG文件的函数
function createPNGFromFunc(width, height, drawFunc) {
  // 创建RGBA像素数据
  const pixels = new Uint8Array(width * height * 4);

  // 绘制图形
  drawFunc(pixels, width, height);

  // 生成PNG
  return encodePNG(width, height, pixels);
}

// PNG编码器
function encodePNG(width, height, pixels) {
  const chunks = [];

  // PNG签名
  chunks.push(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));

  // IHDR块
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(createChunk('IHDR', ihdr));

  // IDAT块 - 压缩像素数据
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (width * 4 + 1) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);
  chunks.push(createChunk('IDAT', compressed));

  // IEND块
  chunks.push(createChunk('IEND', Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// 绘制函数：画圆形
function drawCircle(pixels, width, height, cx, cy, r, R, G, B, A = 255) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) {
        const idx = (y * width + x) * 4;
        pixels[idx] = R;
        pixels[idx + 1] = G;
        pixels[idx + 2] = B;
        pixels[idx + 3] = A;
      }
    }
  }
}

// 绘制函数：画线条（带抗锯齿）
function drawLine(pixels, width, height, x1, y1, x2, y2, thickness, R, G, B, A = 255) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + dx * t;
    const y = y1 + dy * t;

    // 画粗线
    for (let ty = -thickness/2; ty <= thickness/2; ty++) {
      for (let tx = -thickness/2; tx <= thickness/2; tx++) {
        const px = Math.round(x + tx);
        const py = Math.round(y + ty);
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          pixels[idx] = R;
          pixels[idx + 1] = G;
          pixels[idx + 2] = B;
          pixels[idx + 3] = A;
        }
      }
    }
  }
}

// 绘制函数：画矩形
function drawRect(pixels, width, height, x, y, w, h, R, G, B, A = 255) {
  for (let py = y; py < y + h && py < height; py++) {
    for (let px = x; px < x + w && px < width; px++) {
      if (px >= 0 && py >= 0) {
        const idx = (py * width + px) * 4;
        pixels[idx] = R;
        pixels[idx + 1] = G;
        pixels[idx + 2] = B;
        pixels[idx + 3] = A;
      }
    }
  }
}

// 绘制函数：画三角形（箭头）
function drawTriangle(pixels, width, height, x1, y1, x2, y2, x3, y3, R, G, B, A = 255) {
  const minX = Math.min(x1, x2, x3);
  const maxX = Math.max(x1, x2, x3);
  const minY = Math.min(y1, y2, y3);
  const maxY = Math.max(y1, y2, y3);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInTriangle(x, y, x1, y1, x2, y2, x3, y3)) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * 4;
          pixels[idx] = R;
          pixels[idx + 1] = G;
          pixels[idx + 2] = B;
          pixels[idx + 3] = A;
        }
      }
    }
  }
}

function pointInTriangle(x, y, x1, y1, x2, y2, x3, y3) {
  const d1 = sign(x, y, x1, y1, x2, y2);
  const d2 = sign(x, y, x2, y2, x3, y3);
  const d3 = sign(x, y, x3, y3, x1, y1);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

function sign(x1, y1, x2, y2, x3, y3) {
  return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
}

// 图标尺寸
const SIZE = 81;
const iconsDir = path.join(__dirname, 'src/static/icons');
fs.mkdirSync(iconsDir, { recursive: true });

// ========== 行情图标（柱状图）==========
function drawMarketIcon(pixels, w, h) {
  const color = [51, 51, 51]; // 灰色
  const barWidth = 12;
  const gap = 8;
  const startX = (w - (barWidth * 3 + gap * 2)) / 2;

  // 三根柱子，从矮到高
  drawRect(pixels, w, h, startX, h - 35, barWidth, 25, ...color);
  drawRect(pixels, w, h, startX + barWidth + gap, h - 50, barWidth, 40, ...color);
  drawRect(pixels, w, h, startX + (barWidth + gap) * 2, h - 65, barWidth, 55, ...color);
}

function drawMarketActiveIcon(pixels, w, h) {
  const color = [24, 144, 255]; // 蓝色
  const barWidth = 12;
  const gap = 8;
  const startX = (w - (barWidth * 3 + gap * 2)) / 2;

  drawRect(pixels, w, h, startX, h - 35, barWidth, 25, ...color);
  drawRect(pixels, w, h, startX + barWidth + gap, h - 50, barWidth, 40, ...color);
  drawRect(pixels, w, h, startX + (barWidth + gap) * 2, h - 65, barWidth, 55, ...color);
}

// ========== 自选图标（星星）==========
function drawStar(pixels, w, h, cx, cy, outerR, innerR, R, G, B) {
  const points = 5;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const angle = Math.atan2(y - cy, x - cx);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      // 计算当前角度对应的半径
      const segAngle = (2 * Math.PI) / points;
      const halfSeg = segAngle / 2;
      const normAngle = ((angle + Math.PI / 2) % segAngle + segAngle) % segAngle;
      const t = Math.abs(normAngle - halfSeg) / halfSeg;
      const radius = innerR + (outerR - innerR) * t;

      if (dist <= radius) {
        const idx = (y * w + x) * 4;
        pixels[idx] = R;
        pixels[idx + 1] = G;
        pixels[idx + 2] = B;
        pixels[idx + 3] = 255;
      }
    }
  }
}

function drawWatchlistIcon(pixels, w, h) {
  drawStar(pixels, w, h, w/2, h/2, 30, 14, 102, 102, 102);
}

function drawWatchlistActiveIcon(pixels, w, h) {
  drawStar(pixels, w, h, w/2, h/2, 30, 14, 24, 144, 255);
}

// ========== 持仓图标（钱包）==========
function drawPortfolioIcon(pixels, w, h) {
  const color = [102, 102, 102];
  // 钱包主体
  drawRect(pixels, w, h, 15, 20, 50, 35, ...color);
  // 钱包盖
  drawRect(pixels, w, h, 15, 18, 50, 10, ...color);
  // 扣子
  drawCircle(pixels, w, h, 55, 37, 5, 153, 153, 153);
}

function drawPortfolioActiveIcon(pixels, w, h) {
  const color = [24, 144, 255];
  drawRect(pixels, w, h, 15, 20, 50, 35, ...color);
  drawRect(pixels, w, h, 15, 18, 50, 10, ...color);
  drawCircle(pixels, w, h, 55, 37, 5, 100, 200, 255);
}

// ========== 信号图标（铃铛）==========
function drawSignalIcon(pixels, w, h) {
  const color = [102, 102, 102];
  const cx = w / 2;

  // 铃铛主体
  drawCircle(pixels, w, h, cx, 35, 22, ...color);

  // 铃铛底部
  drawRect(pixels, w, h, cx - 22, 35, 44, 15, ...color);

  // 铃铛口
  drawRect(pixels, w, h, cx - 26, 48, 52, 6, ...color);

  // 小球
  drawCircle(pixels, w, h, cx, 58, 6, 153, 153, 153);

  // 顶部小环
  drawCircle(pixels, w, h, cx, 15, 5, 153, 153, 153);
}

function drawSignalActiveIcon(pixels, w, h) {
  const color = [24, 144, 255];
  const cx = w / 2;

  drawCircle(pixels, w, h, cx, 35, 22, ...color);
  drawRect(pixels, w, h, cx - 22, 35, 44, 15, ...color);
  drawRect(pixels, w, h, cx - 26, 48, 52, 6, ...color);
  drawCircle(pixels, w, h, cx, 58, 6, 100, 200, 255);
  drawCircle(pixels, w, h, cx, 15, 5, 100, 200, 255);
}

// 生成所有图标
const iconConfigs = [
  { name: 'market', draw: drawMarketIcon },
  { name: 'market-active', draw: drawMarketActiveIcon },
  { name: 'watchlist', draw: drawWatchlistIcon },
  { name: 'watchlist-active', draw: drawWatchlistActiveIcon },
  { name: 'portfolio', draw: drawPortfolioIcon },
  { name: 'portfolio-active', draw: drawPortfolioActiveIcon },
  { name: 'signal', draw: drawSignalIcon },
  { name: 'signal-active', draw: drawSignalActiveIcon }
];

iconConfigs.forEach(({ name, draw }) => {
  const png = createPNGFromFunc(SIZE, SIZE, draw);
  const filePath = path.join(iconsDir, `${name}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Created: ${name}.png (${png.length} bytes)`);
});

console.log('\nAll icons created successfully!');
