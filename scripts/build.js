#!/usr/bin/env node

/**
 * Build script for Pluie Texture Pack
 *
 * This script creates a distributable ZIP file containing all texture pack files
 * for the specified Minecraft version. It compresses the entire version directory
 * into a single zip file that can be installed in Minecraft.
 *
 * Usage: node scripts/build.js [version]
 * Default version: b1.7.3
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration for this build
const config = {
    packName: 'Pluie',
    version: 'b1.7.3',
    description: 'A gentle, rain-inspired texture pack for Minecraft Beta 1.7.3'
};

// Paths
const sourceDir = path.join(__dirname, '..', 'b1.7.3');
const outputDir = path.join(__dirname, '..', 'output');
const zipFileName = `${config.packName}-${config.version}.zip`;

// Verify source directory exists
if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Error: Source directory not found: ${sourceDir}`);
    process.exit(1);
}

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(outputDir, zipFileName));
const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
});

// Archive completion handler
output.on('close', () => {
    const archiveSize = (archive.pointer() / 1024).toFixed(2);
    console.log(`✅ ${archiveSize} KB total`);
    console.log(`🎉 ${config.packName} texture pack created successfully!`);
    console.log(`📁 Location: ${path.join(outputDir, zipFileName)}`);
});

// Error handling
archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
        console.warn('⚠️  Warning:', err.message);
    } else {
        console.error('❌ Error:', err);
        process.exit(1);
    }
});

archive.on('error', (err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});

// Start building
console.log(`🔨 Building ${config.packName} texture pack`);
console.log(`📋 Version: ${config.version}`);
console.log(`📝 ${config.description}`);
console.log(`📦 Source: ${sourceDir}`);
console.log(`💾 Output: ${zipFileName}`);
console.log('');

// Pipe archive data to the file
archive.pipe(output);

// Add all files from the source directory
archive.directory(sourceDir, false);

// Add a small info file
archive.append(
    `${config.packName} Texture Pack\n` +
    `Version: ${config.version}\n` +
    `Description: ${config.description}\n` +
    `Built: ${new Date().toISOString()}\n`,
    { name: 'INFO.txt' }
);

// Complete the archive
archive.finalize();

// Export build function for use by other scripts
module.exports = { build };

async function build(version = 'b1.7.3') {
    return new Promise((resolve, reject) => {
        const buildConfig = { ...config, version };
        const sourceDir = path.join(__dirname, '..', version);
        const zipFileName = `${buildConfig.packName}-${buildConfig.version}.zip`;

        // Verify source directory exists
        if (!fs.existsSync(sourceDir)) {
            reject(new Error(`Source directory not found: ${sourceDir}`));
            return;
        }

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const output = fs.createWriteStream(path.join(outputDir, zipFileName));
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        output.on('close', () => {
            resolve(path.join(outputDir, zipFileName));
        });

        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

// Run build if this script is executed directly
if (require.main === module) {
    const targetVersion = process.argv[2] || 'b1.7.3';
    build(targetVersion).catch(err => {
        console.error('❌ Build failed:', err.message);
        process.exit(1);
    });
}