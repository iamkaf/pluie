#!/usr/bin/env node

/**
 * Deploy script for Pluie Texture Pack
 *
 * This script deploys built texture packs to Minecraft installations.
 * It reads deployment configuration from .deployrc file and handles
 * backup of existing texture packs before deployment.
 *
 * Usage: tsx scripts/deploy.ts [version|all]
 * Examples:
 *   tsx scripts/deploy.ts b1.7.3
 *   tsx scripts/deploy.ts all
 *   tsx scripts/deploy.ts (deploys configured versions)
 */

import * as fs from 'fs';
import * as path from 'path';
import { build } from './build';

interface VersionDeployConfig {
    path: string;
    backup: boolean;
    [key: string]: boolean | string;
}

interface DeployConfig {
    [version: string]: VersionDeployConfig;
}

const DEPLOY_CONFIG_PATH = path.join(__dirname, '..', '.deployrc');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const VERSIONS_DIR = path.join(__dirname, '..', 'versions');

/**
 * Parse deployment configuration file
 */
export function parseDeployConfig(): DeployConfig {
    try {
        if (!fs.existsSync(DEPLOY_CONFIG_PATH)) {
            throw new Error(`Deploy configuration file not found: ${DEPLOY_CONFIG_PATH}`);
        }

        const config: DeployConfig = {};
        const content = fs.readFileSync(DEPLOY_CONFIG_PATH, 'utf8');

        for (const [lineNumber, rawLine] of content.split('\n').entries()) {
            const trimmed = rawLine.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }

            const [version, ...pathParts] = trimmed.split('=');
            if (!version || pathParts.length === 0) {
                console.warn(`⚠️  Invalid config line ${lineNumber + 1}: ${trimmed}`);
                continue;
            }

            const fullPath = pathParts.join('=');
            const [deployPath, ...options] = fullPath.split(':');

            const versionConfig: VersionDeployConfig = {
                path: deployPath.trim(),
                backup: true
            };

            // Parse options
            for (const option of options) {
                const [key, value] = option.split(',');
                if (key && value) {
                    const normalizedValue = value.trim().toLowerCase();
                    if (normalizedValue === 'true' || normalizedValue === 'false') {
                        versionConfig[key.trim()] = normalizedValue === 'true';
                    } else {
                        versionConfig[key.trim()] = value.trim();
                    }
                }
            }

            config[version.trim()] = versionConfig;
        }

        return config;
    } catch (error) {
        console.error('❌ Failed to parse deploy config:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

/**
 * Create backup of existing texture pack
 */
function createBackup(sourcePath: string, version: string): string | null {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `Pluie-${version}-backup-${timestamp}.zip`;
        const backupPath = path.join(BACKUP_DIR, backupFileName);

        if (!fs.existsSync(sourcePath)) {
            return null; // No existing file to backup
        }

        // Create backup directory if it doesn't exist
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        fs.copyFileSync(sourcePath, backupPath);
        console.log(`📦 Backed up to: ${backupPath}`);
        return backupPath;
    } catch (error) {
        console.error(`⚠️  Failed to create backup for ${version}:`, error instanceof Error ? error.message : error);
        return null;
    }
}

/**
 * Ensure target directory exists
 */
function ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dirPath}`);
    }
}

/**
 * Deploy a single texture pack version
 */
export async function deployTexturePack(version: string, config: VersionDeployConfig): Promise<void> {
    try {
        const sourceFileName = `Pluie-${version}.zip`;

        // Build the texture pack first
        console.log(`🔨 Building ${version}...`);
        const sourcePath = await build(version);
        console.log(`✅ Built: ${sourceFileName}`);

        const targetPath = path.join(config.path, sourceFileName);

        // Ensure target directory exists
        ensureDirectoryExists(config.path);

        // Backup existing file if requested
        if (config.backup && fs.existsSync(targetPath)) {
            createBackup(targetPath, version);
        }

        // Deploy new file
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Deployed to: ${targetPath}`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to deploy ${version}: ${errorMessage}`);
    }
}

/**
 * Get all available versions
 */
function getAvailableVersions(): string[] {
    try {
        if (!fs.existsSync(VERSIONS_DIR)) {
            throw new Error(`Versions directory not found: ${VERSIONS_DIR}`);
        }

        return fs.readdirSync(VERSIONS_DIR)
            .filter(name => {
                const versionPath = path.join(VERSIONS_DIR, name);
                return fs.statSync(versionPath).isDirectory() && name !== 'shared';
            })
            .sort();
    } catch (error) {
        console.error('❌ Failed to get available versions:', error instanceof Error ? error.message : error);
        return [];
    }
}

/**
 * Validate version exists
 */
function validateVersion(version: string): boolean {
    const versionPath = path.join(VERSIONS_DIR, version);
    return fs.existsSync(versionPath) && fs.statSync(versionPath).isDirectory();
}

/**
 * Main deployment function
 */
export async function deploy(targetVersion?: string): Promise<void> {
    try {
        console.log('🚀 Deploying Pluie Texture Pack...\n');

        const config = parseDeployConfig();
        let versions: string[];

        if (targetVersion === 'all') {
            versions = getAvailableVersions();
            if (versions.length === 0) {
                throw new Error('No version directories found in versions/');
            }
        } else if (targetVersion) {
            if (!validateVersion(targetVersion)) {
                throw new Error(`Invalid version: ${targetVersion}`);
            }
            versions = [targetVersion];
        } else {
            versions = Object.keys(config);
        }

        if (versions.length === 0) {
            throw new Error('No versions found to deploy');
        }

        let successCount = 0;
        let failureCount = 0;

        for (const version of versions) {
            try {
                const versionConfig = config[version];
                if (!versionConfig) {
                    console.warn(`⚠️  No deployment configuration for version: ${version}`);
                    continue;
                }

                console.log(`📦 Deploying ${version} to ${versionConfig.path}`);
                await deployTexturePack(version, versionConfig);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to deploy ${version}:`, error instanceof Error ? error.message : error);
                failureCount++;
            }
            console.log('');
        }

        console.log(`🎉 Deployment complete! ${successCount}/${versions.length} versions deployed.`);
        if (failureCount > 0) {
            console.log(`⚠️  ${failureCount} version(s) failed to deploy.`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Deployment failed:', errorMessage);
        throw error;
    }
}

/**
 * Validate command line arguments
 */
function validateArguments(): string | undefined {
    const targetVersion = process.argv[2];

    if (!targetVersion) {
        return undefined; // Use default behavior (deploy configured versions)
    }

    if (targetVersion === 'all') {
        return targetVersion;
    }

    // Basic validation for version format
    if (targetVersion.startsWith('-')) {
        throw new Error(`Invalid version: ${targetVersion}. Version should not start with '-'`);
    }

    return targetVersion;
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
    try {
        const targetVersion = validateArguments();
        await deploy(targetVersion);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Deployment failed:', errorMessage);
        process.exit(1);
    }
}

// Run if this script is executed directly
if (require.main === module) {
    main().catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Deployment failed:', errorMessage);
        process.exit(1);
    });
}