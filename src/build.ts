#!/usr/bin/env node

/**
 * Build script for Pluie Texture Pack
 *
 * This script creates a distributable ZIP file containing all texture pack files
 * for the specified Minecraft version. It compresses the entire version directory
 * into a single zip file that can be installed in Minecraft.
 *
 * Usage: tsx scripts/build.ts [version|all]
 * Examples:
 *   tsx scripts/build.ts b1.7.3
 *   tsx scripts/build.ts all
 *   tsx scripts/build.ts (builds b1.7.3)
 */

import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

interface PackConfig {
    packName: string;
    description: string;
}

interface BuildConfig extends PackConfig {
    version: string;
    sourceDir: string;
    zipFileName: string;
}

const DEFAULT_VERSION = 'b1.7.3';
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const VERSIONS_DIR = path.join(__dirname, '..', 'versions');

// Pack configuration
const packConfig: PackConfig = {
    packName: 'Pluie',
    description: 'A gentle, rain-inspired texture pack for Minecraft'
};

/**
 * Get all available versions from the versions directory
 */
export function getAvailableVersions(): string[] {
    try {
        if (!fs.existsSync(VERSIONS_DIR)) {
            throw new Error(`Versions directory not found: ${VERSIONS_DIR}`);
        }

        return fs.readdirSync(VERSIONS_DIR)
            .filter(name => fs.statSync(path.join(VERSIONS_DIR, name)).isDirectory())
            .filter(name => name !== 'shared') // Exclude shared directory
            .sort();
    } catch (error) {
        console.error('❌ Failed to get available versions:', error instanceof Error ? error.message : error);
        return [];
    }
}

/**
 * Validate that a version exists
 */
function validateVersion(version: string): boolean {
    const versionDir = path.join(VERSIONS_DIR, version);
    return fs.existsSync(versionDir) && fs.statSync(versionDir).isDirectory();
}

/**
 * Get version-specific description
 */
function getVersionDescription(version: string): string {
    const packFile = path.join(VERSIONS_DIR, version, 'pack.txt');
    if (fs.existsSync(packFile)) {
        try {
            const content = fs.readFileSync(packFile, 'utf8');
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.startsWith('description=')) {
                    return line.substring(12).trim();
                }
            }
        } catch (error) {
            // Fall back to default description
        }
    }
    return `${packConfig.description} ${version}`;
}

/**
 * Create output directory if it doesn't exist
 */
function ensureOutputDirectory(): void {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
}

/**
 * Build a single version
 */
export async function build(version: string = DEFAULT_VERSION): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const sourceDir = path.join(VERSIONS_DIR, version);
            const zipFileName = `${packConfig.packName}-${version}.zip`;
            const outputPath = path.join(OUTPUT_DIR, zipFileName);
            const description = getVersionDescription(version);

            // Validate inputs
            if (!validateVersion(version)) {
                reject(new Error(`Version directory not found: ${sourceDir}`));
                return;
            }

            const buildConfig: BuildConfig = {
                ...packConfig,
                version,
                sourceDir,
                zipFileName,
                description
            };

            // Ensure output directory exists
            ensureOutputDirectory();

            // Create archive
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            // Event handlers
            output.on('close', () => {
                const archiveSize = (archive.pointer() / 1024).toFixed(2);
                console.log(`✅ ${archiveSize} KB total`);
                console.log(`🎉 ${buildConfig.packName} texture pack created successfully!`);
                console.log(`📁 Location: ${outputPath}`);
                resolve(outputPath);
            });

            output.on('error', (error) => {
                reject(new Error(`Failed to write output file: ${error.message}`));
            });

            archive.on('warning', (error) => {
                if (error.code === 'ENOENT') {
                    console.warn(`⚠️  Warning: ${error.message}`);
                } else {
                    reject(error);
                }
            });

            archive.on('error', (error) => {
                reject(new Error(`Archive creation failed: ${error.message}`));
            });

            // Start building
            console.log(`🔨 Building ${buildConfig.packName} texture pack`);
            console.log(`📋 Version: ${buildConfig.version}`);
            console.log(`📝 ${buildConfig.description}`);
            console.log(`📦 Source: ${buildConfig.sourceDir}`);
            console.log(`💾 Output: ${buildConfig.zipFileName}`);
            console.log('');

            // Pipe archive data to the file
            archive.pipe(output);

            // Add all files from the source directory
            archive.directory(buildConfig.sourceDir, false);

            // Add info file
            archive.append(
                `${buildConfig.packName} Texture Pack\n` +
                `Version: ${buildConfig.version}\n` +
                `Description: ${buildConfig.description}\n` +
                `Built: ${new Date().toISOString()}\n`,
                { name: 'INFO.txt' }
            );

            // Complete the archive
            archive.finalize();

        } catch (error) {
            reject(new Error(`Build initialization failed: ${error instanceof Error ? error.message : error}`));
        }
    });
}

/**
 * Build multiple versions
 */
async function buildAll(): Promise<void> {
    try {
        const versions = getAvailableVersions();
        if (versions.length === 0) {
            throw new Error('No version directories found in versions/');
        }

        console.log(`🔨 Building all versions: ${versions.join(', ')}`);
        let successCount = 0;
        let failureCount = 0;

        for (const version of versions) {
            try {
                console.log(`\n📦 Building ${version}...`);
                await build(version);
                console.log(`✅ ${version} built successfully`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to build ${version}:`, error instanceof Error ? error.message : error);
                failureCount++;
            }
        }

        console.log(`\n🎉 Build complete! ${successCount}/${versions.length} versions built successfully.`);
        if (failureCount > 0) {
            console.log(`⚠️  ${failureCount} version(s) failed to build.`);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Build all failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

/**
 * Validate command line arguments
 */
function validateArguments(): string {
    const targetVersion = process.argv[2] || DEFAULT_VERSION;

    if (targetVersion === 'all') {
        return targetVersion;
    }

    if (!validateVersion(targetVersion)) {
        throw new Error(`Invalid version: ${targetVersion}. Available versions: ${getAvailableVersions().join(', ')}`);
    }

    return targetVersion;
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
    try {
        const targetVersion = validateArguments();

        if (targetVersion === 'all') {
            await buildAll();
        } else {
            await build(targetVersion);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Build failed:', errorMessage);
        process.exit(1);
    }
}

// Run if this script is executed directly
if (require.main === module) {
    main().catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Build failed:', errorMessage);
        process.exit(1);
    });
}