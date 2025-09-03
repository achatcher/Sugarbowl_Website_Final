# Image Conversion Scripts

This directory contains scripts to optimize images for the SugarBowl website.

## WebP Conversion Script

The `convert-to-webp.js` script automatically converts all JPG, JPEG, and PNG images to WebP format with optimized settings.

### Prerequisites

1. **Node.js** - Make sure you have Node.js installed (version 14 or higher recommended)
2. **Sharp library** - The script will help you install this

### Quick Start

1. **Navigate to your website directory:**
   ```bash
   cd /Users/abbyhatcher/Desktop/Sugarbowl_Website_Final
   ```

2. **Install the Sharp library:**
   ```bash
   npm install sharp
   ```
   
   Or if you prefer global installation:
   ```bash
   npm install -g sharp
   ```

3. **Run the conversion script:**
   ```bash
   node scripts/convert-to-webp.js
   ```

### What the Script Does

- **Finds all images** in your `img/` directory and subdirectories
- **Converts** JPG, JPEG, and PNG files to WebP format
- **Optimizes quality** based on image type:
  - 🎨 **Graphics/Logos**: 90% quality (crisp text and graphics)
  - 📸 **Photos**: 80% quality (good balance for food photos)
  - 🖼️ **Thumbnails**: 75% quality (smaller files for small images)
- **Creates responsive sizes** for large images (480px, 768px, 1200px wide)
- **Preserves original files** so you don't lose anything
- **Skips already converted** files that are newer than originals
- **Shows detailed progress** and file size savings

### Sample Output

```
🖼️  SugarBowl WebP Converter Starting...

[10:30:15] ℹ️ Starting conversion of images in: ./img
[10:30:15] ℹ️ Quality settings: Photos=80%, Graphics=90%, Thumbnails=75%
[10:30:15] ℹ️ Found 12 image files to process

[10:30:16] ✅ Converted: burger1.jpg → burger1.webp
[10:30:16] ℹ️   Size: 245.3 KB → 156.7 KB (36.1% saved)
[10:30:17] ✅ Converted: logo.svg → logo.webp
[10:30:17] ℹ️   Size: 12.4 KB → 8.9 KB (28.2% saved)

📊 CONVERSION REPORT
================================
Files processed: 12
Files converted: 10
Files skipped: 2
Errors: 0
Original size: 2.1 MB
WebP size: 1.4 MB
Space saved: 700.5 KB (33.3%)
```

### Configuration Options

You can modify these settings at the top of `convert-to-webp.js`:

```javascript
const CONFIG = {
    inputDir: './img',              // Directory to scan for images
    keepOriginals: true,            // Keep original files
    createResponsiveSizes: true,    // Create multiple sizes for large images
    quality: {
        photos: 80,                 // Quality for food photos
        graphics: 90,               // Quality for logos/graphics
        thumbnails: 75              // Quality for small images
    },
    responsiveSizes: [480, 768, 1200], // Responsive breakpoints
    verbose: true                   // Show detailed progress
};
```

### Troubleshooting

**"Sharp library not found"**
```bash
npm install sharp
```

**"Permission denied"**
```bash
chmod +x scripts/convert-to-webp.js
```

**"Input directory not found"**
- Make sure you're running the script from the website root directory
- Check that your images are in the `img/` folder

### Advanced Usage

**Convert only specific quality:**
Edit the `quality` settings in the script before running.

**Convert specific directory:**
Change `inputDir: './img'` to your desired directory.

**Batch convert with different settings:**
Make multiple copies of the script with different configurations.

### File Naming Convention

The script creates these files:
- `burger1.jpg` → `burger1.webp` (main WebP)
- `burger1.jpg` → `burger1-480w.webp` (480px wide)
- `burger1.jpg` → `burger1-768w.webp` (768px wide) 
- `burger1.jpg` → `burger1-1200w.webp` (1200px wide)

### Next Steps After Conversion

1. ✅ **Your HTML is already updated** - The website already includes WebP support with fallbacks
2. 🧪 **Test your website** - Open it in a browser to verify images load correctly
3. 🚀 **Deploy** - Upload the new WebP files along with your originals
4. 📊 **Monitor performance** - Use browser dev tools to see the file size improvements

### Performance Benefits

- **30-50% smaller file sizes** compared to JPEG/PNG
- **Faster page loading** times
- **Better user experience** on mobile devices
- **Improved SEO** scores due to faster loading
- **Reduced bandwidth** costs for hosting