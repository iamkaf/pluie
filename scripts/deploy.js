#!/usr/bin/env node

/**
 * Deploy script for Pluie Texture Pack
 *
 * This script deploys built texture packs to Minecraft installations.
 * It reads deployment configuration from .deployrc file and handles
 * backup of existing texture packs before deployment.
 *
 * Usage: node scripts/deploy.js [version]
 * Examples:
 *   node scripts/deploy.js b1.7.3
 *   node scripts/deploy.js (deploys all versions)
 */

const fs = require('fs');
const path = require('path');
const { build } = require('./build');

// Paths
const deployConfigPath = path.join(__dirname, '..', '.deployrc');
const outputDir = path.join(__dirname, '..', 'output');
const backupDir = path.join(__dirname, '..', 'backups');

// Parse deployment configuration
function parseDeployConfig() {
    if (!fs.existsSync(deployConfigPath)) {
        console.error('❌ Error: .deployrc file not found');
        process.exit(1);
    }

    const config = {};
    const lines = fs.readFileSync(deployConfigPath, 'utf8')
        .split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('#'));

    for (const line of lines) {
        const [version, ...pathParts] = line.split('=');
        if (!version || !pathParts.length) continue;

        const fullPath = pathParts.join('=');
        const [deployPath, ...options] = fullPath.split(':');

        config[version.trim()] = {
            path: deployPath.trim(),
            backup: true
        };

        // Parse options
        for (const option of options) {
            const [key, value] = option.split(',');
            if (key && value) {
                config[version.trim()][key.trim()] = value.trim() === 'true';
            }
        }
    }

    return config;
}

// Create backup of existing texture pack
function createBackup(sourcePath, version) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `Pluie-${version}-backup-${timestamp}.zip`;
    const backupPath = path.join(backupDir, backupFileName);

    if (!fs.existsSync(sourcePath)) {
        return null; // No existing file to backup
    }

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, backupPath);
    console.log(`📦 Backed up to: ${backupPath}`);
    return backupPath;
}

// Deploy texture pack
async function deployTexturePack(version, config) {
    const sourceFileName = `Pluie-${version}.zip`;

    // Build the texture pack first
    console.log(`🔨 Building ${version}...`);
    try {
        const sourcePath = await build(version);
        console.log(`✅ Built: ${sourceFileName}`);
        const targetPath = path.join(config.path, sourceFileName);

        // Create target directory if it doesn't exist
        if (!fs.existsSync(config.path)) {
            fs.mkdirSync(config.path, { recursive: true });
            console.log(`📁 Created directory: ${config.path}`);
        }

        // Backup existing file if requested
        if (config.backup && fs.existsSync(targetPath)) {
            createBackup(targetPath, version);
        }

        // Deploy new file
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Deployed to: ${targetPath}`);

        return true;
    } catch (err) {
        console.error(`❌ Build failed: ${err.message}`);
        return false;
    }
}

// Main deployment function
async function deploy(targetVersion) {
    console.log('🚀 Deploying Pluie Texture Pack...\n');

    const config = parseDeployConfig();
    const versions = targetVersion ? [targetVersion] : Object.keys(config);

    if (versions.length === 0) {
        console.log('❌ No versions found in .deployrc');
        return;
    }

    let successCount = 0;

    for (const version of versions) {
        if (!config[version]) {
            console.log(`⚠️  No deployment configuration for version: ${version}`);
            continue;
        }

        console.log(`📦 Deploying ${version} to ${config[version].path}`);
        if (await deployTexturePack(version, config[version])) {
            successCount++;
        }
        console.log('');
    }

    console.log(`🎉 Deployment complete! ${successCount}/${versions.length} versions deployed.`);
}

// Get version from command line arguments
const targetVersion = process.argv[2];

// Start deployment
deploy(targetVersion).catch(err => {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
});