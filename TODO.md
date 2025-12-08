# Pluie Texture Pack - TODO

## Completed ✅

### ✅ Hot-Reload Development Mode
Watch files → Auto-build → Deploy to Minecraft → In-game reload for faster iteration.
- **Status:** COMPLETED
- **Implementation:** File watching with chokidar, debounced builds, automatic deployment
- **Usage:** `npm run watch` or `npm run watch [version]`

### ✅ CLI Transformation
Transformed from individual scripts to comprehensive CLI toolchain.
- **Status:** COMPLETED
- **Implementation:** Commander.js CLI with modular commands
- **Structure:** `src/commands/` with individual command modules

## High Priority

### Advanced Asset Pipeline
Build system that consumes shared assets and transforms them for different Minecraft versions:

**Architecture:**
- `shared/` - Contains all source assets (textures, metadata)
- `versions/[version]/` - Contains version-specific transformation functions and assets
- Build pipeline calls version transformers to convert shared assets to correct format

**Challenge:** Different Minecraft versions have wildly different texture pack formats
- Beta 1.7.3: Single terrain.png (256x256) with block grid
- Modern versions: Individual PNG files per block + JSON metadata

**Solution:** Per-version transformers that understand format requirements

## Future Improvements

### Texture Preview Generator
Web-based grid showing all textures with hover effects and export options.

### Visual Changelog
Side-by-side texture comparisons between builds with Git integration.

### Texture Showcase
Interactive website with 3D block viewer and in-game screenshots.