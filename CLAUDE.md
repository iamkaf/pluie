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
npm run edit b1.7.3/terrain.png     # Edit terrain.png in Aseprite
npm run aseprite b1.7.3/items.png   # Alternative command name
```

### Deployment
```bash
npm run deploy               # Deploy to Minecraft
npm run deploy all          # Deploy all versions
```

### Management
```bash
npm run list                 # List available versions
npm run status               # Show system status
npm run typecheck            # Run TypeScript type checking
```

### Setup
```bash
npm install                 # Install dependencies
```

## Architecture

### CLI-Based Structure
- `src/` - Complete CLI toolchain and core functionality
  - `commands/` - Individual CLI command implementations
  - `build.ts` - Core build logic
  - `watch.ts` - Hot reload system with chokidar
  - `deploy.ts` - Deployment functionality
  - `cli.ts` - Commander.js CLI setup
- `versions/` - Multi-version texture pack structure
  - `b1.7.3/` - Beta 1.7.3 textures
  - `shared/` - Shared assets used across versions
- `output/` - Generated ZIP files (gitignored)
- `backups/` - Automatic deployment backups

### Texture Pack Organization
Each version directory follows the classic Minecraft texture pack structure:
- `terrain.png` - All block textures (256x256 single file for Beta 1.7.3)
- `items.png` - Item and GUI textures
- `environment/` - Sun, moon, clouds
- `gui/` - Interface elements (inventory, crafting, furnace)
- `misc/` - Particles, color maps
- `pack.txt` - Pack metadata

### Hot Reload System
- **File Watching:** Uses chokidar for cross-platform file monitoring
- **Debouncing:** 500ms delay to prevent excessive builds during rapid editing
- **Auto-Deployment:** Integrates with deployment system for instant updates
- **Shared Assets:** Changes in `versions/shared/` trigger rebuilds of all versions
- **Version-Specific:** Changes in version directories rebuild only that version

### Build System
- TypeScript-based with comprehensive error handling
- Uses `archiver` library for ZIP creation with maximum compression
- Outputs to `output/` directory with naming pattern: `Pluie-{version}.zip`
- Multi-version support with shared asset pipeline
- Automatic backup system before deployment

### Environment Configuration
- `ASEPRITE_PATH` environment variable required for texture editing
- `.env` file supported via dotenvx
- `.deployrc` - Deployment configuration
- `.hotreloadrc` - Hot reload settings
- Aseprite launcher validates executable exists before launching

### Key Technical Details
- Beta 1.7.3 uses legacy texture format with single `terrain.png` containing all blocks
- CLI built with Commander.js for professional command structure
- Modular TypeScript architecture with clean separation of concerns
- Hot reload provides instant feedback for faster development iteration
- Comprehensive error handling and validation throughout the system