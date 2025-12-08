export enum AssetType {
  // Core texture types
  TEXTURE_BLOCKS = 'texture_blocks',
  TEXTURE_ITEMS = 'texture_items',
  TEXTURE_GUI = 'texture_gui',
  TEXTURE_ENVIRONMENT = 'texture_environment',
  TEXTURE_PARTICLES = 'texture_particles',
  TEXTURE_MISC = 'texture_misc',

  // Legacy texture types (for backward compatibility)
  TEXTURE_TERRAIN = 'texture_terrain',

  // Compiled texture types (Beta 1.7.3 specific)
  COMPILED_TERRAIN = 'compiled_terrain',
  COMPILED_ITEMS = 'compiled_items',

  // Metadata types
  METADATA_PACK = 'metadata_pack',
  METADATA_CONFIG = 'metadata_config',

  // Model types (for future versions)
  MODEL_BLOCK = 'model_block',
  MODEL_ITEM = 'model_item',

  // Unknown/Catch-all
  UNKNOWN = 'unknown',
}

export interface AssetFile {
  sourcePath: string;
  relativePath: string;
  type: AssetType;
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  size?: { width: number; height: number };
  format?: string;
  lastModified: Date;
  checksum?: string;
}

export interface ProcessResult {
  success: boolean;
  outputPath?: string;
  error?: Error;
  processedFiles: string[];
  skippedFiles: string[];
}

export interface BuildContext {
  version: string;
  sourceDir: string;
  outputDir: string;
  buildDir: string;
  timestamp: Date;
}

export interface VersionTransformer {
  version: string;
  name: string;
  transform(assets: AssetFile[], context: BuildContext): Promise<ProcessResult>;
  getRequiredAssetTypes?(): AssetType[];
  isApplicable?(version: string): boolean;
}

export interface TransformerRegistry {
  transformers: Map<string, VersionTransformer>;
  register(transformer: VersionTransformer): void;
  get(version: string): VersionTransformer | undefined;
  getAll(): VersionTransformer[];
}

export interface AssetDiscoveryResult {
  assets: AssetFile[];
  totalFiles: number;
  discoveredTypes: Set<AssetType>;
}