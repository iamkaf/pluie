#!/usr/bin/env node

/**
 * Script to decompose a terrain.png file into individual block textures
 * and place them in the shared assets folder structure.
 */

import path from 'path';
import sharp from 'sharp';
import fs from 'fs-extra';

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

async function decomposeTerrain(terrainPath: string, outputBaseDir: string, forceOverwrite: boolean = false): Promise<void> {
  console.log('🔧 Decomposing terrain.png into individual textures...');
  console.log(`📁 Source: ${terrainPath}`);
  console.log(`📁 Output: ${outputBaseDir}`);
  console.log('');

  try {
    // Check if source file exists
    if (!await fs.pathExists(terrainPath)) {
      throw new Error(`Source terrain.png not found: ${terrainPath}`);
    }

    // Load the terrain.png
    const terrainImage = sharp(terrainPath);
    const metadata = await terrainImage.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not read terrain.png dimensions');
    }

    console.log(`📊 Terrain image: ${metadata.width}x${metadata.height}px`);

    // Ensure output directories exist
    const blocksDir = path.join(outputBaseDir, 'versions/shared/assets/blocks');
    const itemsDir = path.join(outputBaseDir, 'versions/shared/assets/items');
    const guiDir = path.join(outputBaseDir, 'versions/shared/assets/gui');
    const environmentDir = path.join(outputBaseDir, 'versions/shared/assets/environment');
    const miscDir = path.join(outputBaseDir, 'versions/shared/assets/misc');

    await fs.ensureDir(blocksDir);
    await fs.ensureDir(itemsDir);
    await fs.ensureDir(guiDir);
    await fs.ensureDir(environmentDir);
    await fs.ensureDir(miscDir);

    let extractedCount = 0;
    let skippedCount = 0;

    // Extract each texture from the grid
    for (const position of TERRAIN_GRID_POSITIONS) {
      const left = position.gridX * 16;
      const top = position.gridY * 16;

      // Check if extraction area is within image bounds
      if (left + 16 > metadata.width! || top + 16 > metadata.height!) {
        console.warn(`⚠️  Skipping ${position.textureName}: extraction area (${left},${top},16,16) exceeds image bounds (${metadata.width}x${metadata.height})`);
        skippedCount++;
        continue;
      }

      try {
        // Extract the 16x16 region
        const extractedBuffer = await terrainImage
          .extract({ left, top, width: 16, height: 16 })
          .png()
          .toBuffer();

        // Determine output directory based on texture type
        let outputDir: string;
        if (position.textureName.includes('door') || position.textureName.includes('sign')) {
          outputDir = itemsDir;
        } else if (position.textureName.includes('furnace') || position.textureName.includes('chest') ||
                   position.textureName.includes('crafting_table') || position.textureName.includes('jukebox') ||
                   position.textureName.includes('cake') || position.textureName.includes('bookshelf')) {
          outputDir = guiDir;
        } else if (position.textureName.includes('water') || position.textureName.includes('lava') ||
                   position.textureName.includes('fire') || position.textureName.includes('portal')) {
          outputDir = environmentDir;
        } else if (position.textureName.includes('torch') || position.textureName.includes('wire') ||
                   position.textureName.includes('rails') || position.textureName.includes('ladder')) {
          outputDir = miscDir;
        } else {
          outputDir = blocksDir;
        }

        const outputPath = path.join(outputDir, `${position.textureName}.png`);

        // Check if file already exists
        if (await fs.pathExists(outputPath) && !forceOverwrite) {
          console.log(`⏭️  Skipping ${position.textureName}.png (already exists, use --force to overwrite)`);
          skippedCount++;
          continue;
        }

        await fs.writeFile(outputPath, extractedBuffer);
        console.log(`✅ Extracted ${position.textureName}.png → ${path.relative(outputBaseDir, outputPath)}`);
        extractedCount++;

      } catch (error) {
        console.warn(`⚠️  Failed to extract ${position.textureName}:`, error);
        skippedCount++;
      }
    }

    console.log('');
    console.log(`🎉 Decomposition complete!`);
    console.log(`✅ Extracted: ${extractedCount} textures`);
    console.log(`⏭️  Skipped: ${skippedCount} textures`);
    console.log('');
    console.log('📂 Output directories:');
    console.log(`   🔷 Blocks: ${blocksDir}`);
    console.log(`   ⚔️  Items: ${itemsDir}`);
    console.log(`   🖥️  GUI: ${guiDir}`);
    console.log(`   🌍 Environment: ${environmentDir}`);
    console.log(`   🎨 Misc: ${miscDir}`);

  } catch (error) {
    console.error('❌ Decomposition failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: tsx scripts/decompose-terrain.ts <terrain.png> [output-directory] [--force]');
    console.log('');
    console.log('Options:');
    console.log('  --force    Overwrite existing files');
    console.log('');
    console.log('Example: tsx scripts/decompose-terrain.ts versions/b1.7.3/terrain_backup_dec_08_2025.png . --force');
    process.exit(1);
  }

  const terrainPath = args[0];
  const outputBaseDir = args[1] || '.'; // Default to current directory
  const forceFlag = args.includes('--force');

  await decomposeTerrain(terrainPath, outputBaseDir, forceFlag);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

export { decomposeTerrain };