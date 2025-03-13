const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '../public');
const SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');

async function generateFavicons() {
  try {
    console.log('Reading SVG file...');
    const svgBuffer = fs.readFileSync(SVG_PATH);
    
    // Generate favicon.ico (multi-size ICO file)
    console.log('Generating favicon.ico...');
    
    // For better browser compatibility, create a proper favicon with multiple sizes
    const sizes = [16, 32, 48];
    const pngBuffers = await Promise.all(
      sizes.map(size => 
        sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );
    
    // Since we can't create true .ico files with sharp, we'll output PNG
    // and rename it to .ico - browsers are generally forgiving about this
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), pngBuffers[1]); // Use 32x32 version
    console.log('favicon.ico created (using PNG format with .ico extension)');
    
    // Also create a dedicated favicon.png for modern browsers
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.png'), pngBuffers[1]);
    
    // Generate logo192.png
    console.log('Generating logo192.png...');
    await sharp(svgBuffer)
      .resize(192)
      .toFormat('png')
      .toFile(path.join(PUBLIC_DIR, 'logo192.png'));
    
    // Generate logo512.png
    console.log('Generating logo512.png...');
    await sharp(svgBuffer)
      .resize(512)
      .toFormat('png')
      .toFile(path.join(PUBLIC_DIR, 'logo512.png'));
    
    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons(); 