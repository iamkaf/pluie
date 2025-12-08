#!/usr/bin/env node

/**
 * Build Queue Management for Pluie Texture Pack
 *
 * Manages build requests with debouncing to prevent excessive builds
 * during rapid file changes. Ensures only one build per version
 * runs at a time.
 */

interface BuildRequest {
    version: string;
    timestamp: number;
    resolve: () => void;
    reject: (error: Error) => void;
}

interface BuildQueueConfig {
    debounceMs: number;
}

class BuildQueue {
    private queues: Map<string, NodeJS.Timeout> = new Map();
    private building: Set<string> = new Set();
    private config: BuildQueueConfig;

    constructor(config: BuildQueueConfig) {
        this.config = config;
    }

    /**
     * Schedule a build for a specific version with debouncing
     */
    scheduleBuild(version: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Clear any existing timeout for this version
            const existingTimeout = this.queues.get(version);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            // Schedule new build
            const timeout = setTimeout(() => {
                this.queues.delete(version);
                this.executeBuild(version).then(resolve).catch(reject);
            }, this.config.debounceMs);

            this.queues.set(version, timeout);
        });
    }

    /**
     * Execute a build immediately
     */
    async executeBuild(version: string): Promise<void> {
        if (this.building.has(version)) {
            throw new Error(`Build already in progress for version ${version}`);
        }

        this.building.add(version);

        try {
            // Import build function dynamically to avoid circular dependencies
            const { build } = await import('./build');
            await build(version);
        } finally {
            this.building.delete(version);
        }
    }

    /**
     * Cancel any pending builds for a version
     */
    cancelPendingBuild(version: string): void {
        const timeout = this.queues.get(version);
        if (timeout) {
            clearTimeout(timeout);
            this.queues.delete(version);
        }
    }

    /**
     * Cancel all pending builds
     */
    cancelAllPending(): void {
        for (const [version, timeout] of this.queues) {
            clearTimeout(timeout);
        }
        this.queues.clear();
    }

    /**
     * Check if a build is currently in progress
     */
    isBuilding(version: string): boolean {
        return this.building.has(version);
    }

    /**
     * Get all versions currently being built
     */
    getBuildingVersions(): string[] {
        return Array.from(this.building);
    }

    /**
     * Get all versions with pending builds
     */
    getPendingVersions(): string[] {
        return Array.from(this.queues.keys());
    }
}

export { BuildQueue, type BuildQueueConfig };