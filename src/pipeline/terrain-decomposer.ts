import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';

interface GridPosition {
  textureName: string;
  gridX: number;
  gridY: number;
}

interface CoordinateData {
  rows: number;
  cols: number;
  tile_size: number;
  coordinates: {
    [key: string]: string; // "x,y": "texture_name"
  };
}

// Legacy Beta 1.7.3 terrain.png grid positions (16x16 grid = 256x256 pixels)
const LEGACY_TERRAIN_POSITIONS: GridPosition[] = [
  // Row 0
  { textureName: 'grass', gridX: 0, gridY: 0 },
  { textureName: 'stone', gridX: 1, gridY: 0 },
  { textureName: 'dirt', gridX: 2, gridY: 0 },
  { textureName: 'cobblestone', gridX: 3, gridY: 0 },
  { textureName: 'planks', gridX: 4, gridY: 0 },
  { textureName: 'sapling', gridX: 5, gridY: 0 },
  { textureName: 'bedrock', gridX: 6, gridY: 0 },
  { textureName: 'water', gridX: 7, gridY: 0 },
  { textureName: 'waterflowing', gridX: 8, gridY: 0 },
  { textureName: 'lava', gridX: 9, gridY: 0 },
  { textureName: 'lavaflowing', gridX: 10, gridY: 0 },
  { textureName: 'sand', gridX: 11, gridY: 0 },
  { textureName: 'gravel', gridX: 12, gridY: 0 },
  { textureName: 'goldore', gridX: 13, gridY: 0 },
  { textureName: 'ironore', gridX: 14, gridY: 0 },
  { textureName: 'coalore', gridX: 15, gridY: 0 },

  // Row 1
  { textureName: 'log', gridX: 0, gridY: 1 },
  { textureName: 'leaves', gridX: 1, gridY: 1 },
  { textureName: 'grass_carried', gridX: 2, gridY: 1 },
  { textureName: 'grass_top', gridX: 3, gridY: 1 },
  { textureName: 'flowers', gridX: 4, gridY: 1 },
  { textureName: 'roses', gridX: 5, gridY: 1 },
  { textureName: 'mushroom_red', gridX: 6, gridY: 1 },
  { textureName: 'mushroom_brown', gridX: 7, gridY: 1 },
  { textureName: 'goldblock', gridX: 8, gridY: 1 },
  { textureName: 'ironblock', gridX: 9, gridY: 1 },
  { textureName: 'double_slab', gridX: 10, gridY: 1 },
  { textureName: 'slab', gridX: 11, gridY: 1 },
  { textureName: 'brick', gridX: 12, gridY: 1 },
  { textureName: 'tnt', gridX: 13, gridY: 1 },
  { textureName: 'bookshelf', gridX: 14, gridY: 1 },
  { textureName: 'mossy_cobblestone', gridX: 15, gridY: 1 },

  // Row 2
  { textureName: 'obsidian', gridX: 0, gridY: 2 },
  { textureName: 'torch', gridX: 1, gridY: 2 },
  { textureName: 'fire', gridX: 2, gridY: 2 },
  { textureName: 'mob_spawner', gridX: 3, gridY: 2 },
  { textureName: 'oak_stairs', gridX: 4, gridY: 2 },
  { textureName: 'chest', gridX: 5, gridY: 2 },
  { textureName: 'redstone_wire', gridX: 6, gridY: 2 },
  { textureName: 'diamondore', gridX: 7, gridY: 2 },
  { textureName: 'diamondblock', gridX: 8, gridY: 2 },
  { textureName: 'crafting_table', gridX: 9, gridY: 2 },
  { textureName: 'crops', gridX: 10, gridY: 2 },
  { textureName: 'soil', gridX: 11, gridY: 2 },
  { textureName: 'furnace', gridX: 12, gridY: 2 },
  { textureName: 'furnace_lit', gridX: 13, gridY: 2 },
  { textureName: 'sign_post', gridX: 14, gridY: 2 },
  { textureName: 'door_wood_upper', gridX: 15, gridY: 2 },

  // Row 3
  { textureName: 'ladder', gridX: 0, gridY: 3 },
  { textureName: 'rails', gridX: 1, gridY: 3 },
  { textureName: 'cobblestone_stairs', gridX: 2, gridY: 3 },
  { textureName: 'door_wood_lower', gridX: 3, gridY: 3 },
  { textureName: 'iron_door_upper', gridX: 4, gridY: 3 },
  { textureName: 'iron_door_lower', gridX: 5, gridY: 3 },
  { textureName: 'redstone_ore', gridX: 6, gridY: 3 },
  { textureName: 'redstone_ore_lit', gridX: 7, gridY: 3 },
  { textureName: 'stone_stairs', gridX: 8, gridY: 3 },
  { textureName: 'button_stone', gridX: 9, gridY: 3 },
  { textureName: 'snow', gridX: 10, gridY: 3 },
  { textureName: 'ice', gridX: 11, gridY: 3 },
  { textureName: 'snow_block', gridX: 12, gridY: 3 },
  { textureName: 'cactus', gridX: 13, gridY: 3 },
  { textureName: 'clay', gridX: 14, gridY: 3 },
  { textureName: 'reeds', gridX: 15, gridY: 3 },

  // Row 4
  { textureName: 'jukebox', gridX: 0, gridY: 4 },
  { textureName: 'fence', gridX: 1, gridY: 4 },
  { textureName: 'pumpkin', gridX: 2, gridY: 4 },
  { textureName: 'bloodstone', gridX: 3, gridY: 4 },
  { textureName: 'slow_sand', gridX: 4, gridY: 4 },
  { textureName: 'lightstone', gridX: 5, gridY: 4 },
  { textureName: 'portal', gridX: 6, gridY: 4 },
  { textureName: 'jack_o_lantern', gridX: 7, gridY: 4 },
  { textureName: 'cake', gridX: 8, gridY: 4 },
];

async function loadCoordinateData(type: 'terrain' | 'items'): Promise<CoordinateData | null> {
  const coordFile = type === 'terrain'
    ? 'atlas_coordinates_terrain.json'
    : 'atlas_coordinates_items.json';

  const coordPath = path.join(process.cwd(), coordFile);
  if (await fs.pathExists(coordPath)) {
    return await fs.readJson(coordPath);
  }
  return null;
}

function parseCoordinates(coordinates: CoordinateData): GridPosition[] {
  const positions: GridPosition[] = [];

  for (const [coordKey, textureName] of Object.entries(coordinates.coordinates)) {
    if (coordKey === 'remaining_tiles' || textureName === 'unused') continue;

    const [xStr, yStr] = coordKey.split(',');
    const gridX = parseInt(xStr);
    const gridY = parseInt(yStr);

    positions.push({ textureName, gridX, gridY });
  }

  return positions;
}

function determineFileType(filePath: string): 'terrain' | 'items' {
  const fileName = path.basename(filePath).toLowerCase();
  if (fileName.includes('terrain') || fileName.includes('blocks')) {
    return 'terrain';
  } else if (fileName.includes('items') || fileName.includes('gui')) {
    return 'items';
  }
  // Default to terrain if unclear
  return 'terrain';
}

export class TextureDecomposer {
  static async decomposeTextures(filePath: string, outputDir: string): Promise<void> {
    const fileType = determineFileType(filePath);
    const assetType = fileType === 'terrain' ? 'blocks' : 'items';
    const defaultOutputDir = path.join('versions/shared/assets', assetType);

    console.log(`🔨 Decomposing ${fileType} file: ${filePath}`);
    console.log(`📁 Output directory: ${outputDir || defaultOutputDir}`);

    if (!await fs.pathExists(filePath)) {
      throw new Error(`${fileType} file not found: ${filePath}`);
    }

    // Use default output directory if none specified
    const finalOutputDir = outputDir || defaultOutputDir;
    await fs.ensureDir(finalOutputDir);

    // Load the image
    const textureImage = sharp(filePath);
    const metadata = await textureImage.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(`Could not read ${fileType}.png dimensions`);
    }

    if (metadata.width !== 256 || metadata.height !== 256) {
      throw new Error(`Expected 256x256 ${fileType}.png, got ${metadata.width}x${metadata.height}`);
    }

    console.log(`📐 Image dimensions: ${metadata.width}x${metadata.height}`);

    // Try to load coordinate data, fall back to legacy positions if not available
    const coordData = await loadCoordinateData(fileType);
    let positions: GridPosition[];

    if (coordData) {
      console.log(`📋 Using JSON coordinate data for ${fileType}`);
      positions = parseCoordinates(coordData);
    } else if (fileType === 'terrain') {
      console.log(`⚠️  No coordinate file found, using legacy terrain positions`);
      positions = LEGACY_TERRAIN_POSITIONS;
    } else {
      console.log(`❌ No coordinate file found for items and no legacy positions available`);
      return;
    }

    // Extract each texture
    const textureSize = 16;
    let extractedCount = 0;
    let skippedCount = 0;

    for (const position of positions) {
      try {
        const outputPath = path.join(finalOutputDir, `${position.textureName}.png`);

        // Skip if file already exists (preserve user edits)
        if (await fs.pathExists(outputPath)) {
          console.log(`⏭️  Skipping ${position.textureName} (already exists)`);
          skippedCount++;
          continue;
        }

        // Extract the 16x16 tile from the image
        const left = position.gridX * textureSize;
        const top = position.gridY * textureSize;

        // Create fresh image instance for each extraction to avoid Sharp issues
        const freshImage = sharp(filePath);
        const extractedBuffer = await freshImage
          .extract({
            left,
            top,
            width: textureSize,
            height: textureSize,
          })
          .png()
          .toBuffer();

        await fs.writeFile(outputPath, extractedBuffer);

        console.log(`✅ Extracted ${position.textureName} at (${position.gridX}, ${position.gridY}) → ${outputPath}`);
        extractedCount++;

      } catch (error) {
        console.warn(`⚠️  Failed to extract ${position.textureName}:`, error);
      }
    }

    console.log(`\n🎉 Decomposition complete!`);
    console.log(`📊 Extracted: ${extractedCount} ${fileType} textures`);
    console.log(`⏭️  Skipped: ${skippedCount} textures (already exist)`);
  }

  static async extractNonEmptyRegions(filePath: string, _outputDir: string): Promise<void> {
    const fileType = determineFileType(filePath);

    console.log(`🔍 Detecting non-empty regions in ${fileType}.png...`);

    if (!await fs.pathExists(filePath)) {
      throw new Error(`${fileType} file not found: ${filePath}`);
    }

    const textureImage = sharp(filePath);
    const { data } = await textureImage
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Try to load coordinate data, fall back to legacy positions if not available
    const coordData = await loadCoordinateData(fileType);
    let positions: GridPosition[];

    if (coordData) {
      positions = parseCoordinates(coordData);
    } else if (fileType === 'terrain') {
      positions = LEGACY_TERRAIN_POSITIONS;
    } else {
      console.log(`❌ No coordinate file found for items and no legacy positions available`);
      return;
    }

    // Check each grid position for non-transparent content
    const textureSize = 16;
    const imageWidth = 256;
    let nonEmptyCount = 0;

    for (const position of positions) {
      const startX = position.gridX * textureSize;
      const startY = position.gridY * textureSize;
      let hasContent = false;

      // Sample the center pixel of each texture
      const centerPixelIndex = ((startY + 8) * imageWidth + (startX + 8)) * 4;
      const alpha = data[centerPixelIndex + 3];

      if (alpha > 0) {
        hasContent = true;
        nonEmptyCount++;
      }

      if (hasContent) {
        console.log(`🎨 ${position.textureName}: Has content at (${position.gridX}, ${position.gridY})`);
      }
    }

    console.log(`📊 Found ${nonEmptyCount} non-empty textures in ${fileType}.png`);
  }

  // Legacy method for backward compatibility
  static async decomposeTerrain(terrainPath: string, outputDir: string): Promise<void> {
    return this.decomposeTextures(terrainPath, outputDir);
  }
}