#!/usr/bin/env node

/**
 * Simple script to manually extract a few key textures from the terrain backup
 */

import path from 'path';
import sharp from 'sharp';
import fs from 'fs-extra';

async function simpleExtract(): Promise<void> {
  const terrainPath = 'versions/b1.7.3/terrain_backup_dec_08_2025.png';
  const blocksDir = 'versions/shared/assets/blocks';

  console.log('🔧 Simple terrain decomposition...');
  console.log(`📁 Source: ${terrainPath}`);
  console.log(`📁 Output: ${blocksDir}`);

  if (!await fs.pathExists(terrainPath)) {
    console.error('❌ Source file not found');
    process.exit(1);
  }

  await fs.ensureDir(blocksDir);

  // Key textures to extract manually
  const textures = [
    { name: 'stone', x: 16, y: 0 },
    { name: 'cobblestone', x: 48, y: 0 },
    { name: 'planks', x: 64, y: 0 },
    { name: 'bedrock', x: 96, y: 0 },
    { name: 'sand', x: 176, y: 0 },
    { name: 'gravel', x: 192, y: 0 },
    { name: 'log', x: 0, y: 16 },
    { name: 'leaves', x: 16, y: 16 },
  ];

  try {
    const terrainImage = sharp(terrainPath);
    const metadata = await terrainImage.metadata();
    console.log(`📊 Image: ${metadata.width}x${metadata.height}px`);

    let successCount = 0;
    let failCount = 0;

    for (const texture of textures) {
      try {
        console.log(`🔍 Extracting ${texture.name} from (${texture.x}, ${texture.y})`);

        const buffer = await terrainImage
          .extract({ left: texture.x, top: texture.y, width: 16, height: 16 })
          .png()
          .toBuffer();

        const outputPath = path.join(blocksDir, `${texture.name}.png`);
        await fs.writeFile(outputPath, buffer);

        console.log(`✅ Saved ${texture.name}.png`);
        successCount++;

      } catch (error) {
        console.warn(`⚠️  Failed to extract ${texture.name}:`, error);
        failCount++;
      }
    }

    console.log(`\n🎉 Complete! ✅${successCount} ⚠️${failCount}`);

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

simpleExtract().catch(console.error);