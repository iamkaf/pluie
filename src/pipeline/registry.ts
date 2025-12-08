import { VersionTransformer, TransformerRegistry } from './types.js';

export class DefaultTransformerRegistry implements TransformerRegistry {
  public transformers: Map<string, VersionTransformer>;

  constructor() {
    this.transformers = new Map();
  }

  register(transformer: VersionTransformer): void {
    console.log(`[Pipeline] Registering transformer for ${transformer.version}: ${transformer.name}`);
    this.transformers.set(transformer.version, transformer);
  }

  get(version: string): VersionTransformer | undefined {
    return this.transformers.get(version);
  }

  getAll(): VersionTransformer[] {
    return Array.from(this.transformers.values());
  }

  getVersions(): string[] {
    return Array.from(this.transformers.keys());
  }
}