const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
const svgPath = path.join(assetsDir, 'icon-template.svg');

// Read SVG file
const svgBuffer = fs.readFileSync(svgPath);

// Generate icon.png (1024x1024)
sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'))
    .then(() => console.log('✅ Generated icon.png'))
    .catch(err => console.error('Error generating icon.png:', err));

// Generate adaptive-icon.png (1024x1024)
sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'))
    .then(() => console.log('✅ Generated adaptive-icon.png'))
    .catch(err => console.error('Error generating adaptive-icon.png:', err));

// Generate splash-icon.png (2048x2048)
sharp(svgBuffer)
    .resize(2048, 2048)
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'))
    .then(() => console.log('✅ Generated splash-icon.png'))
    .catch(err => console.error('Error generating splash-icon.png:', err));

// Generate favicon.png (48x48)
sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'))
    .then(() => console.log('✅ Generated favicon.png'))
    .catch(err => console.error('Error generating favicon.png:', err));
