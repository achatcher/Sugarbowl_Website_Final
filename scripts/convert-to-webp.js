#!/usr/bin/env node

/**
 * WebP Image Conversion Script for SugarBowl Website
 * 
 * This script converts all JPG, JPEG, and PNG images to WebP format
 * with optimized settings for web performance while maintaining quality.
 * 
 * Usage: node scripts/convert-to-webp.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const CONFIG = {
    // Input directory containing images
    inputDir: './img',
    
    // Quality settings for different image types
    quality: {
        photos: 80,      // For food photos, events (good balance)
        graphics: 90,    // For logos, icons (higher quality)
        thumbnails: 75   // For small images (more compression)
    },
    
    // Size thresholds (in bytes)
    sizeThresholds: {
        thumbnail: 50000,    // 50KB - treat as thumbnail
        large: 500000        // 500KB - treat as photo
    },
    
    // File extensions to convert
    inputFormats: ['.jpg', '.jpeg', '.png'],
    
    // Whether to keep original files
    keepOriginals: true,
    
    // Whether to create responsive sizes
    createResponsiveSizes: true,
    
    // Responsive breakpoints (widths in pixels)
    responsiveSizes: [480, 768, 1200],
    
    // Verbose logging
    verbose: true
};

// Statistics tracking
const stats = {
    processed: 0,
    converted: 0,
    skipped: 0,
    errors: 0,
    totalSizeBefore: 0,
    totalSizeAfter: 0
};

/**
 * Log messages with timestamp
 */
function log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get optimal quality based on file size and type
 */
function getOptimalQuality(filePath, fileSize) {
    const fileName = path.basename(filePath).toLowerCase();
    
    // Logo and icon files - highest quality
    if (fileName.includes('logo') || fileName.includes('icon') || fileName.includes('favicon')) {
        return CONFIG.quality.graphics;
    }
    
    // Small files - more compression
    if (fileSize < CONFIG.sizeThresholds.thumbnail) {
        return CONFIG.quality.thumbnails;
    }
    
    // Default for photos
    return CONFIG.quality.photos;
}

/**
 * Check if WebP file already exists and is newer
 */
function shouldSkipConversion(inputPath, outputPath) {
    if (!fs.existsSync(outputPath)) {
        return false;
    }
    
    const inputStat = fs.statSync(inputPath);
    const outputStat = fs.statSync(outputPath);
    
    return outputStat.mtime > inputStat.mtime;
}

/**
 * Convert single image to WebP
 */
async function convertImage(inputPath, outputPath, quality, width = null) {
    try {
        const inputStat = fs.statSync(inputPath);
        stats.totalSizeBefore += inputStat.size;
        
        let sharpInstance = sharp(inputPath);
        
        // Resize if width is specified (for responsive images)
        if (width) {
            sharpInstance = sharpInstance.resize(width, null, {
                withoutEnlargement: true,
                fit: 'inside'
            });
        }
        
        // Convert to WebP with specified quality
        await sharpInstance
            .webp({ 
                quality: quality,
                effort: 6 // Higher effort = better compression (0-6)
            })
            .toFile(outputPath);
        
        const outputStat = fs.statSync(outputPath);
        stats.totalSizeAfter += outputStat.size;
        
        const sizeDiff = inputStat.size - outputStat.size;
        const percentSaved = ((sizeDiff / inputStat.size) * 100).toFixed(1);
        
        const sizeInfo = width ? ` (${width}px wide)` : '';
        log(`Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)}${sizeInfo}`, 'success');
        log(`  Size: ${formatFileSize(inputStat.size)} → ${formatFileSize(outputStat.size)} (${percentSaved}% saved)`);
        
        return true;
    } catch (error) {
        log(`Failed to convert ${inputPath}: ${error.message}`, 'error');
        stats.errors++;
        return false;
    }
}

/**
 * Process a single image file
 */
async function processImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath);
    const name = path.basename(filePath, ext);
    
    stats.processed++;
    
    if (CONFIG.verbose) {
        log(`Processing: ${path.relative(CONFIG.inputDir, filePath)}`);
    }
    
    try {
        const fileStat = fs.statSync(filePath);
        const quality = getOptimalQuality(filePath, fileStat.size);
        
        // Main WebP conversion
        const outputPath = path.join(dir, `${name}.webp`);
        
        if (shouldSkipConversion(filePath, outputPath)) {
            log(`Skipped: ${path.basename(filePath)} (WebP is newer)`, 'warn');
            stats.skipped++;
            return;
        }
        
        const converted = await convertImage(filePath, outputPath, quality);
        
        if (converted) {
            stats.converted++;
            
            // Create responsive sizes if enabled and image is large enough
            if (CONFIG.createResponsiveSizes && fileStat.size > CONFIG.sizeThresholds.large) {
                for (const width of CONFIG.responsiveSizes) {
                    const responsiveOutputPath = path.join(dir, `${name}-${width}w.webp`);
                    
                    if (!shouldSkipConversion(filePath, responsiveOutputPath)) {
                        await convertImage(filePath, responsiveOutputPath, quality, width);
                    }
                }
            }
        }
        
    } catch (error) {
        log(`Error processing ${filePath}: ${error.message}`, 'error');
        stats.errors++;
    }
}

/**
 * Recursively find all image files
 */
function findImageFiles(dir) {
    const files = [];
    
    try {
        const entries = fs.readdirSync(dir);
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Recursively search subdirectories
                files.push(...findImageFiles(fullPath));
            } else if (stat.isFile()) {
                const ext = path.extname(entry).toLowerCase();
                if (CONFIG.inputFormats.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    } catch (error) {
        log(`Error reading directory ${dir}: ${error.message}`, 'error');
    }
    
    return files;
}

/**
 * Create package.json if it doesn't exist
 */
function createPackageJson() {
    const packagePath = './package.json';
    
    if (!fs.existsSync(packagePath)) {
        const packageContent = {
            "name": "sugarbowl-website",
            "version": "1.0.0",
            "description": "SugarBowl Restaurant Website",
            "scripts": {
                "convert-webp": "node scripts/convert-to-webp.js",
                "optimize-images": "node scripts/convert-to-webp.js"
            },
            "devDependencies": {
                "sharp": "^0.32.6"
            }
        };
        
        fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
        log('Created package.json');
    }
}

/**
 * Check dependencies
 */
function checkDependencies() {
    try {
        require.resolve('sharp');
        return true;
    } catch (error) {
        log('Sharp library not found. Please install it first:', 'error');
        log('Run: npm install sharp', 'error');
        log('Or if you want to install it globally: npm install -g sharp', 'error');
        return false;
    }
}

/**
 * Generate usage report
 */
function generateReport() {
    log('\n📊 CONVERSION REPORT', 'success');
    log('================================');
    log(`Files processed: ${stats.processed}`);
    log(`Files converted: ${stats.converted}`);
    log(`Files skipped: ${stats.skipped}`);
    log(`Errors: ${stats.errors}`);
    
    if (stats.converted > 0) {
        log(`Original size: ${formatFileSize(stats.totalSizeBefore)}`);
        log(`WebP size: ${formatFileSize(stats.totalSizeAfter)}`);
        
        const totalSaved = stats.totalSizeBefore - stats.totalSizeAfter;
        const percentSaved = ((totalSaved / stats.totalSizeBefore) * 100).toFixed(1);
        
        log(`Space saved: ${formatFileSize(totalSaved)} (${percentSaved}%)`, 'success');
    }
    
    log('\n💡 NEXT STEPS:');
    log('1. Your original images are preserved');
    log('2. WebP images have been created alongside them');
    log('3. Your HTML already includes WebP support with fallbacks');
    log('4. Test your website to ensure images load correctly');
    
    if (CONFIG.createResponsiveSizes) {
        log('5. Responsive image sizes created for large images');
        log('   Update your HTML to use srcset for better performance');
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log('🖼️  SugarBowl WebP Converter Starting...\n');
    
    // Check if Sharp is available
    if (!checkDependencies()) {
        return process.exit(1);
    }
    
    // Create package.json if needed
    createPackageJson();
    
    // Check if input directory exists
    if (!fs.existsSync(CONFIG.inputDir)) {
        log(`Input directory not found: ${CONFIG.inputDir}`, 'error');
        log('Please make sure you\'re running this from the website root directory', 'error');
        return process.exit(1);
    }
    
    // Create scripts directory if it doesn't exist
    const scriptsDir = path.dirname(__filename);
    if (!fs.existsSync(scriptsDir)) {
        fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    log(`Starting conversion of images in: ${CONFIG.inputDir}`);
    log(`Quality settings: Photos=${CONFIG.quality.photos}%, Graphics=${CONFIG.quality.graphics}%, Thumbnails=${CONFIG.quality.thumbnails}%`);
    
    // Find all image files
    const imageFiles = findImageFiles(CONFIG.inputDir);
    
    if (imageFiles.length === 0) {
        log('No image files found to convert', 'warn');
        return;
    }
    
    log(`Found ${imageFiles.length} image files to process\n`);
    
    // Process all images
    const startTime = Date.now();
    
    for (const file of imageFiles) {
        await processImage(file);
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log(`\n⏱️  Conversion completed in ${duration} seconds`);
    generateReport();
}

// Handle process termination
process.on('SIGINT', () => {
    log('\n\n⏹️  Conversion interrupted by user', 'warn');
    generateReport();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`, 'error');
    process.exit(1);
});

// Run the main function
if (require.main === module) {
    main().catch(error => {
        log(`Script error: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = { main, CONFIG };