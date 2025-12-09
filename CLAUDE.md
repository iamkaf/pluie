# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pluie is a Minecraft texture pack project focused on creating gentle, rain-inspired textures. The current target is Minecraft Beta 1.7.3, with a modular structure designed to support multiple Minecraft versions in the future. The project has been transformed into a comprehensive CLI toolchain for efficient development.

## Essential Commands

### Build Texture Pack
```bash
npm run build                # Build default version (b1.7.3)
npm run build all           # Build all versions
npm run build --help        # See build options
```

### Hot Reload Development
```bash
npm run watch                # Start hot reload for default version
npm run watch b1.7.3        # Watch specific version
npm run watch all           # Watch all versions
```

### Texture Editing
```bash
npm run edit blocks/texture.png    # Edit any texture in Aseprite
npm run aseprite blocks/texture.png  # Alternative command name
```

### Management
```bash
npm run list                 # List available versions
npm run status               # Show system status
npm run typecheck            # Run TypeScript type checking
```

### Additional Tools
```bash
npm run decompose terrain.png    # Decompose terrain.png into individual textures
```

## Architecture

### Advanced Asset Pipeline
The project uses a sophisticated asset processing pipeline that transforms individual textures from shared assets into version-specific formats:

- **Pipeline Core (`src/pipeline/`)**:
  - `pipeline.ts` - Main orchestrator for asset processing workflow
  - `types.ts` - Core interfaces and AssetType enum for pipeline architecture
  - `discovery.ts` - Asset discovery and classification system
  - `registry.ts` - Transformer registration and version mapping
  - `transformers/` - Version-specific transformation logic

- **Version-Specific Transformers**:
  - Each Minecraft version has its own transformer implementing `VersionTransformer`
  - Beta 1.7.3 transformer composes individual block textures into legacy `terrain.png` grid
  - Transformers use JSON coordinate files for texture positioning (e.g., `atlas_coordinates_terrain.json`)

### Asset Organization and Processing

**Source Structure (`versions/shared/assets/`)**:
- `blocks/` - Individual block texture files (16x16 PNG files)
- `gui/` - Interface elements (inventory, crafting, furnace)
- `environment/` - Sun, moon, clouds
- `misc/` - Particles, color maps
- `pack.txt` - Pack metadata

**Pipeline Processing**:
1. **Asset Discovery**: Scans shared assets and classifies files by type
2. **Version Matching**: Applies appropriate transformer for target Minecraft version
3. **Format Transformation**: Converts individual textures to version-specific format
   - Beta 1.7.3: Composes 16x16 grid into single 256x256 `terrain.png`
   - Unused coordinates filled with magenta `unused.png` texture
4. **Asset Assembly**: Copies other files directly or transforms as needed

### Coordinate-Based Texture Mapping

The Beta 1.7.3 transformer uses JSON coordinate mapping files:
- `atlas_coordinates_terrain.json` - Maps texture names to grid positions
- Format: `"x,y": "texture_name"` (e.g., `"0,0": "grass_top"`)
- Supports unused positions marked as `"unused"` and filled with magenta texture
- Tile size configurable (typically 16px for Beta 1.7.3)

### CLI Architecture

Built with Commander.js for professional command structure:
- `src/cli.ts` - Main CLI entry point and command definitions
- `src/build.ts` - Build command implementation using asset pipeline
- `src/watch.ts` - Hot reload system with chokidar integration
- `src/deploy.ts` - Deployment functionality
- `src/aseprite.ts` - Aseprite integration for texture editing

### Hot Reload System
- **File Watching**: Uses chokidar for cross-platform file monitoring
- **Debouncing**: 500ms delay to prevent excessive builds during rapid editing
- **Asset Type Awareness**: Different rebuild strategies for different asset types
- **Shared Assets**: Changes in `versions/shared/` trigger rebuilds of all versions

### Environment Configuration
- `ASEPRITE_PATH` environment variable required for texture editing
- `.env` file supported via dotenvx
- Aseprite launcher validates executable exists before launching

### Key Technical Details
- Beta 1.7.3 uses legacy texture format with single `terrain.png` containing all blocks
- TypeScript-based with comprehensive error handling
- Uses Sharp library for image processing and composition
- Uses `archiver` library for ZIP creation with maximum compression
- Outputs to `output/` directory with naming pattern: `Pluie-{version}.zip`
- ARR license - all rights reserved to iamkaf