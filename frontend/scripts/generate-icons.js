/**
 * Boyaka PWA Icon Generator
 * 
 * Bu script Node.js bilan run qilib barcha kerakli iconlarni generatsiya qiladi.
 * 
 * Ishlash uchun:
 *   cd frontend
 *   node scripts/generate-icons.js
 *
 * Talab: 
 *   npm install sharp -D  (yoki global)
 *
 * ⚠️ MUHIM: Hozir placeholder SVG iconlar public/icons/ papkasiga joylashtirilgan.
 * Final branding tayyor bo'lganda:
 *   1. public/icons/source-icon.svg fayliga yangi logoni qo'ying
 *   2. Bu scriptni qayta ishlating
 */

const fs = require('fs');
const path = require('path');

// Barcha kerakli icon sizes
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];
const APPLE_SIZE = 180;

// SVG template — Boyaka "B" logo
function generateSVG(size, isMaskable = false) {
  const padding = isMaskable ? size * 0.1 : size * 0.15;
  const innerSize = size - padding * 2;
  const radius = isMaskable ? size * 0.25 : size * 0.22;
  const fontSize = innerSize * 0.55;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1D4ED8"/>
      <stop offset="100%" style="stop-color:#2563EB"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  <text
    x="${size / 2}"
    y="${size / 2 + fontSize * 0.36}"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-weight="700"
    font-size="${fontSize}"
    fill="white"
    text-anchor="middle"
    dominant-baseline="middle"
  >B</text>
</svg>`;
}

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Standard icons
SIZES.forEach(size => {
  const svgContent = generateSVG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svgContent);
  console.log(`✅ Created: icon-${size}x${size}.svg`);
});

// Maskable icons
MASKABLE_SIZES.forEach(size => {
  const svgContent = generateSVG(size, true);
  fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}x${size}.svg`), svgContent);
  console.log(`✅ Created: icon-maskable-${size}x${size}.svg`);
});

// Apple touch icon
const appleContent = generateSVG(APPLE_SIZE);
fs.writeFileSync(path.join(iconsDir, `apple-touch-icon-${APPLE_SIZE}x${APPLE_SIZE}.svg`), appleContent);
console.log(`✅ Created: apple-touch-icon-${APPLE_SIZE}x${APPLE_SIZE}.svg`);

console.log('\n🎉 All SVG icons generated!');
console.log('⚠️  PNG conversion: sharp yordamida PNG ga o\'tkazing yoki online convertor ishlating');
console.log('💡 Recommended: https://squoosh.app yoki https://cloudconvert.com/svg-to-png');
