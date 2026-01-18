# Creating Extension Icons

This repo already includes `icon16.png`, `icon48.png`, and `icon128.png`. You only need this guide if you want to replace/customize the icons.

## Quick Method (Using macOS)

1. Open `icon.svg` in Safari
2. Take screenshots at different sizes:
   - For 128x128: Take a screenshot of the SVG, then resize to 128x128 and save as `icon128.png`
   - For 48x48: Resize the 128x128 image to 48x48 and save as `icon48.png`
   - For 16x16: Resize the 128x128 image to 16x16 and save as `icon16.png`

## Using Online Tools

1. Go to https://www.iloveimg.com/resize-image or similar
2. Upload the `icon.svg` file
3. Resize to 128x128, 48x48, and 16x16
4. Save each as PNG format with the correct names

## Using Preview (macOS)

1. Open `icon.svg` in Preview
2. Export as PNG
3. Use Tools → Adjust Size to create each size:
   - 128x128 → save as `icon128.png`
   - 48x48 → save as `icon48.png`
   - 16x16 → save as `icon16.png`

## Simple Alternative

If you have any square PNG image you like (robot emoji, GitHub logo, etc.):
1. Start with a 128x128 PNG
2. Resize it to create the smaller versions
3. Name them correctly and place in this `icons/` folder

## Required Files

After creating the icons, this folder should contain:
- ✅ `icon16.png` (16x16 pixels)
- ✅ `icon48.png` (48x48 pixels)
- ✅ `icon128.png` (128x128 pixels)
- ✅ `icon.svg` (template - can keep or delete)
- ✅ `CREATE_ICONS.md` (this file - can delete after creating icons)

The build copies these into `dist/icons/`.
