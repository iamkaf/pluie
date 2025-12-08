import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';

interface TerrainGridPosition {
  textureName: string;
  gridX: number;
  gridY: number;
}

// Beta 1.7.3 terrain.png grid positions (16x16 grid = 256x256 pixels)
const TERRAIN_GRID_POSITIONS: TerrainGridPosition[] = [
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

export class TerrainDecomposer {
  static async decomposeTerrain(terrainPath: string, outputDir: string): Promise<void> {
    console.log(`🔨 Decomposing terrain.png: ${terrainPath}`);
    console.log(`📁 Output directory: ${outputDir}`);

    if (!await fs.pathExists(terrainPath)) {
      throw new Error(`Terrain file not found: ${terrainPath}`);
    }

    // Ensure output directory exists
    await fs.ensureDir(outputDir);

    // Load the terrain.png
    const terrainImage = sharp(terrainPath);
    const metadata = await terrainImage.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not read terrain.png dimensions');
    }

    if (metadata.width !== 256 || metadata.height !== 256) {
      throw new Error(`Expected 256x256 terrain.png, got ${metadata.width}x${metadata.height}`);
    }

    console.log(`📐 Terrain dimensions: ${metadata.width}x${metadata.height}`);

    // Extract each texture
    const textureSize = 16;
    let extractedCount = 0;
    let skippedCount = 0;

    for (const position of TERRAIN_GRID_POSITIONS) {
      try {
        const outputPath = path.join(outputDir, `${position.textureName}.png`);

        // Skip if file already exists (preserve user edits)
        if (await fs.pathExists(outputPath)) {
          console.log(`⏭️  Skipping ${position.textureName} (already exists)`);
          skippedCount++;
          continue;
        }

        // Extract the 16x16 tile from the terrain.png
        const left = position.gridX * textureSize;
        const top = position.gridY * textureSize;

        await terrainImage
          .extract({
            left,
            top,
            width: textureSize,
            height: textureSize,
          })
          .png()
          .toFile(outputPath);

        console.log(`✅ Extracted ${position.textureName} at (${position.gridX}, ${position.gridY}) → ${outputPath}`);
        extractedCount++;

      } catch (error) {
        console.warn(`⚠️  Failed to extract ${position.textureName}:`, error);
      }
    }

    console.log(`\n🎉 Decomposition complete!`);
    console.log(`📊 Extracted: ${extractedCount} textures`);
    console.log(`⏭️  Skipped: ${skippedCount} textures (already exist)`);
  }

  static async extractNonEmptyRegions(terrainPath: string, outputDir: string): Promise<void> {
    console.log(`🔍 Detecting non-empty regions in terrain.png...`);

    if (!await fs.pathExists(terrainPath)) {
      throw new Error(`Terrain file not found: ${terrainPath}`);
    }

    const terrainImage = sharp(terrainPath);
    const { data } = await terrainImage
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Check each grid position for non-transparent content
    const textureSize = 16;
    const terrainWidth = 256;
    let nonEmptyCount = 0;

    for (const position of TERRAIN_GRID_POSITIONS) {
      const startX = position.gridX * textureSize;
      const startY = position.gridY * textureSize;
      let hasContent = false;

      // Sample the center pixel of each texture
      const centerPixelIndex = ((startY + 8) * terrainWidth + (startX + 8)) * 4;
      const alpha = data[centerPixelIndex + 3];

      if (alpha > 0) {
        hasContent = true;
        nonEmptyCount++;
      }

      if (hasContent) {
        console.log(`🎨 ${position.textureName}: Has content at (${position.gridX}, ${position.gridY})`);
      }
    }

    console.log(`📊 Found ${nonEmptyCount} non-empty textures in terrain.png`);
  }
}