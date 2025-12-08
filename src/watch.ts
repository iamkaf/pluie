#!/usr/bin/env node

/**
 * Hot Reload Watcher for Pluie Texture Pack
 *
 * Watches texture files for changes and automatically builds/deploys
 * texture packs for faster development iteration.
 *
 * Usage: tsx scripts/watch.ts [version|all]
 * Examples:
 *   tsx scripts/watch.ts b1.7.3
 *   tsx scripts/watch.ts all
 *   tsx scripts/watch.ts (uses config file)
 */

import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import { BuildQueue } from './build-queue';

interface HotReloadConfig {
    deploy_on_change: boolean;
    debounce_ms: number;
    notifications: boolean;
    watch_all_versions: boolean;
}

interface FileChangeEvent {
    type: 'add' | 'change' | 'unlink';
    path: string;
    version?: string;
    isShared: boolean;
}

export class TextureWatcher {
    private config: HotReloadConfig;
    private buildQueue: BuildQueue;
    private watchers: chokidar.FSWatcher[] = [];
    private isRunning: boolean = false;
    private versions: string[] = [];

    constructor(config: HotReloadConfig) {
        this.config = config;
        this.buildQueue = new BuildQueue({ debounceMs: config.debounce_ms });
    }

    /**
     * Get all available versions from the versions directory
     */
    private getAvailableVersions(): string[] {
        const versionsDir = path.join(__dirname, '..', 'versions');
        if (!fs.existsSync(versionsDir)) {
            return [];
        }

        return fs.readdirSync(versionsDir)
            .filter(name => fs.statSync(path.join(versionsDir, name)).isDirectory())
            .filter(name => name !== 'shared')
            .sort();
    }

    /**
     * Parse version from file path
     */
    private parseVersionFromPath(filePath: string): { version?: string; isShared: boolean } {
        try {
            const relativePath = path.relative(path.join(__dirname, '..', 'versions'), filePath);
            const parts = relativePath.split(path.sep);

            if (parts.length === 0 || parts[0] === '..') {
                return { isShared: false };
            }

            if (parts[0] === 'shared') {
                return { isShared: true };
            }

            return { version: parts[0], isShared: false };
        } catch (error) {
            console.warn(`⚠️  Failed to parse version from path: ${filePath}`, error);
            return { isShared: false };
        }
    }

    /**
     * Get versions to rebuild based on file change
     */
    private getVersionsToRebuild(event: FileChangeEvent): string[] {
        if (event.isShared) {
            // Shared assets affect all versions
            return this.versions;
        }

        if (event.version) {
            // Version-specific file affects only that version
            return [event.version];
        }

        return [];
    }

    /**
     * Handle file changes
     */
    private async handleFileChange(event: FileChangeEvent): Promise<void> {
        try {
            const versions = this.getVersionsToRebuild(event);
            if (versions.length === 0) {
                return;
            }

            if (this.config.notifications) {
                const fileList = versions.length > 1 ? `${versions.length} versions` : versions[0];
                console.log(`⚡ Changed: ${path.relative(process.cwd(), event.path)} (${fileList})`);
                console.log('⏳ Debouncing build...');
            }

            // Schedule builds for affected versions with proper error handling
            const buildResults = await Promise.allSettled(
                versions.map(version => this.buildAndDeployVersion(version))
            );

            // Check for any failed builds
            const failedBuilds = buildResults.filter(result => result.status === 'rejected');
            if (failedBuilds.length > 0) {
                console.error(`❌ ${failedBuilds.length} build(s) failed`);
                failedBuilds.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        console.error(`   ${versions[index]}: ${result.reason}`);
                    }
                });
            }

            if (this.config.deploy_on_change && this.config.notifications && failedBuilds.length === 0) {
                console.log('🔄 Ready for texture reload (Press F3+T in Minecraft)');
            }
        } catch (error) {
            console.error('❌ Hot reload error:', error instanceof Error ? error.message : error);
        }
    }

    /**
     * Build and deploy a single version
     */
    private async buildAndDeployVersion(version: string): Promise<void> {
        try {
            await this.buildQueue.scheduleBuild(version);

            if (this.config.notifications) {
                console.log(`✅ Built: ${version}`);
            }

            if (this.config.deploy_on_change) {
                await this.deployVersion(version);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Build failed for ${version}: ${errorMessage}`);
        }
    }

    /**
     * Deploy a specific version
     */
    private async deployVersion(version: string): Promise<void> {
        try {
            const deployModule = await import('./deploy');
            const { parseDeployConfig, deployTexturePack } = deployModule;
            const config = parseDeployConfig();

            if (!config[version]) {
                console.warn(`⚠️  No deployment configuration for version: ${version}`);
                return;
            }

            await deployTexturePack(version, config[version]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Deploy failed for ${version}: ${errorMessage}`);
        }
    }

    /**
     * Start watching files
     */
    async start(targetVersion?: string): Promise<void> {
        try {
            this.versions = this.getAvailableVersions();

            if (this.versions.length === 0) {
                throw new Error('No versions found in versions/ directory');
            }

            if (this.isRunning) {
                console.warn('⚠️  Watcher is already running');
                return;
            }

            const versionsToWatch = this.resolveVersionsToWatch(targetVersion);
            const watchPaths = this.buildWatchPaths(versionsToWatch);

            if (this.config.notifications) {
                console.log('🔧 Initializing file watcher...');
                console.log(`📁 Watch paths: ${watchPaths.map(p => path.relative(process.cwd(), p)).join(', ')}`);
            }

            const watcher = chokidar.watch(watchPaths, {
                ignored: ['**/.DS_Store', '**/*.tmp', '**/node_modules/**', '**/.git/**'],
                persistent: true,
                awaitWriteFinish: {
                    stabilityThreshold: 100,
                    pollInterval: 50
                }
            });

            this.setupWatcherEvents(watcher, versionsToWatch);
            this.watchers.push(watcher);
            this.isRunning = true;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to start watcher: ${errorMessage}`);
        }
    }

    /**
     * Resolve which versions to watch based on target and configuration
     */
    private resolveVersionsToWatch(targetVersion?: string): string[] {
        if (targetVersion === 'all') {
            return this.versions;
        }

        if (targetVersion && this.versions.includes(targetVersion)) {
            return [targetVersion];
        }

        if (this.config.watch_all_versions) {
            return this.versions;
        }

        // Default to first version
        return [this.versions[0]];
    }

    /**
     * Build watch paths for given versions
     */
    private buildWatchPaths(versionsToWatch: string[]): string[] {
        const paths = [
            path.join(__dirname, '..', 'versions', 'shared'),
            ...versionsToWatch.map(v => path.join(__dirname, '..', 'versions', v))
        ];

        // Validate paths exist
        return paths.filter(p => {
            const exists = fs.existsSync(p);
            if (!exists) {
                console.warn(`⚠️  Watch path does not exist: ${p}`);
            }
            return exists;
        });
    }

    /**
     * Setup event handlers for the watcher
     */
    private setupWatcherEvents(watcher: chokidar.FSWatcher, versionsToWatch: string[]): void {
        const createFileChangeHandler = (eventType: FileChangeEvent['type']) => (filePath: string) => {
            const { version, isShared } = this.parseVersionFromPath(filePath);
            this.handleFileChange({
                type: eventType,
                path: filePath,
                version,
                isShared
            });
        };

        watcher.on('ready', () => {
            if (this.config.notifications) {
                console.log('🔍 Hot Reload Active');
                console.log(`📁 Watching: ${versionsToWatch.join(', ')}`);
                console.log(`🔄 Shared assets: ${versionsToWatch.length} version${versionsToWatch.length > 1 ? 's' : ''}`);
                console.log('✅ Ready! Press Ctrl+C to stop.\n');
            }
        });

        watcher.on('change', createFileChangeHandler('change'));
        watcher.on('add', createFileChangeHandler('add'));
        watcher.on('unlink', createFileChangeHandler('unlink'));

        watcher.on('error', (error) => {
            console.error('❌ Watcher error:', error instanceof Error ? error.message : error);
        });
    }

    /**
     * Stop watching files
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        if (this.config.notifications) {
            console.log('\n🛑 Stopping hot reload...');
        }

        try {
            // Cancel all pending builds first
            this.buildQueue.cancelAllPending();

            // Close all watchers with timeout
            const closePromises = this.watchers.map(watcher =>
                Promise.race([
                    watcher.close(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Watcher close timeout')), 5000)
                    )
                ])
            );

            await Promise.allSettled(closePromises);

            this.watchers = [];
            this.isRunning = false;

            if (this.config.notifications) {
                console.log('✅ Hot reload stopped');
            }
        } catch (error) {
            console.error('⚠️  Error during shutdown:', error instanceof Error ? error.message : error);
            // Force cleanup even if there's an error
            this.watchers = [];
            this.isRunning = false;
        }
    }
}

/**
 * Parse hot reload configuration file
 */
export function parseConfig(): HotReloadConfig {
    const configPath = path.join(__dirname, '..', '.hotreloadrc');
    const defaultConfig: HotReloadConfig = {
        deploy_on_change: true,
        debounce_ms: 500,
        notifications: true,
        watch_all_versions: false
    };

    if (!fs.existsSync(configPath)) {
        return defaultConfig;
    }

    try {
        const config: HotReloadConfig = { ...defaultConfig };
        const content = fs.readFileSync(configPath, 'utf8');

        for (const [lineNumber, rawLine] of content.split('\n').entries()) {
            const trimmed = rawLine.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }

            const [key, ...valueParts] = trimmed.split('=');
            if (!key || valueParts.length === 0) {
                console.warn(`⚠️  Invalid config line ${lineNumber + 1}: ${trimmed}`);
                continue;
            }

            const normalizedKey = key.trim().toLowerCase();
            const value = valueParts.join('=').trim();

            switch (normalizedKey) {
                case 'deploy_on_change':
                    config.deploy_on_change = value.toLowerCase() === 'true';
                    break;
                case 'debounce_ms':
                    const parsedMs = parseInt(value, 10);
                    config.debounce_ms = isNaN(parsedMs) ? 500 : Math.max(100, parsedMs);
                    break;
                case 'notifications':
                    config.notifications = value.toLowerCase() === 'true';
                    break;
                case 'watch_all_versions':
                    config.watch_all_versions = value.toLowerCase() === 'true';
                    break;
                default:
                    console.warn(`⚠️  Unknown config key: ${normalizedKey}`);
            }
        }

        return config;
    } catch (error) {
        console.warn(`⚠️  Failed to parse config file: ${error instanceof Error ? error.message : error}`);
        return defaultConfig;
    }
}

/**
 * Handle process termination
 */
function setupGracefulShutdown(watcher: TextureWatcher): void {
    const shutdown = async (signal: string) => {
        try {
            console.log(`\n📡 Received ${signal}, stopping gracefully...`);
            await watcher.stop();
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));
}

/**
 * Validate command line arguments
 */
function validateArguments(): string | undefined {
    const targetVersion = process.argv[2];

    if (!targetVersion) {
        return undefined; // Use default behavior
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
        const config = parseConfig();
        const watcher = new TextureWatcher(config);

        setupGracefulShutdown(watcher);

        if (config.notifications) {
            console.log('🚀 Starting Pluie Texture Pack Hot Reload');
            console.log(`⚙️  Config: ${config.deploy_on_change ? 'Auto-deploy ON' : 'Auto-deploy OFF'}, Debounce: ${config.debounce_ms}ms`);
        }

        await watcher.start(targetVersion);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Failed to start hot reload:', errorMessage);
        process.exit(1);
    }
}

// Run if this script is executed directly
if (require.main === module) {
    main().catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Hot reload failed:', errorMessage);
        process.exit(1);
    });
}