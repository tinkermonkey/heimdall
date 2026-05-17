# Self-Hosted Fonts

This directory contains @font-face declarations and local font file references.

## Font Sources

### Inter
- **Source**: https://github.com/rsms/inter/releases
- **Weights**: 300, 400, 500, 600, 700, 800, 900
- **Format**: .woff2 (modern browsers)
- **Files**: 
  - Inter-Light.woff2 (300)
  - Inter-Regular.woff2 (400)
  - Inter-Medium.woff2 (500)
  - Inter-SemiBold.woff2 (600)
  - Inter-Bold.woff2 (700)
  - Inter-ExtraBold.woff2 (800)
  - Inter-Black.woff2 (900)

### JetBrains Mono
- **Source**: https://github.com/JetBrains/JetBrainsMono/releases
- **Weights**: 400, 500, 600
- **Format**: .woff2 (modern browsers)
- **Files**:
  - JetBrainsMono-Regular.woff2 (400)
  - JetBrainsMono-Medium.woff2 (500)
  - JetBrainsMono-SemiBold.woff2 (600)

## Font Loading

The CSS declarations reference `/fonts/` paths which should be:

1. Served from public static assets in your application
2. Copy font files to `public/fonts/{inter,jetbrains-mono}/`
3. Serve via static asset middleware

## Testing

Tests verify that @font-face declarations exist, but actual font file loading requires:

1. Font files to be present in the served location
2. Network requests to resolve successfully
3. `font-display: block` ensures layout stability while fonts load

## Notes

- Font files are not included in the repository
- Download directly from the sources listed above
- Only .woff2 format is needed (modern browsers only)
- Size: ~300KB total for both font families
