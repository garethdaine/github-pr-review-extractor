// Build script for Chrome Extension using esbuild

import esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const isWatch = process.argv.includes('--watch');

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}

// Copy static files
function copyStaticFiles() {
  // Create production manifest
  const manifest = JSON.parse(readFileSync('manifest.base.json', 'utf8'));
  manifest.name = 'GitHub PR Review Extractor';
  manifest.content_scripts[0].js = ['filters.js', 'sorters.js', 'llm-client.js', 'github-api.js', 'review-engine.js', 'content.js'];
  manifest.background.service_worker = 'background.js';
  writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));

  // Copy HTML files
  ['popup.html', 'settings.html', 'history.html', 'analytics.html', 'batch-ui.html'].forEach(file => {
    if (existsSync(file)) {
      copyFileSync(file, `dist/${file}`);
    }
  });

  // Copy icons
  if (existsSync('icons')) {
    mkdirSync('dist/icons', { recursive: true });
    ['icon16.png', 'icon48.png', 'icon128.png'].forEach(icon => {
      if (existsSync(`icons/${icon}`)) {
        copyFileSync(`icons/${icon}`, `dist/icons/${icon}`);
      }
    });
  }

  // Copy locale files
  if (existsSync('src/locales')) {
    mkdirSync('dist/src/locales', { recursive: true });
    ['en', 'es', 'fr', 'de'].forEach(locale => {
      if (existsSync(`src/locales/${locale}/messages.json`)) {
        mkdirSync(`dist/src/locales/${locale}`, { recursive: true });
        copyFileSync(`src/locales/${locale}/messages.json`, `dist/src/locales/${locale}/messages.json`);
      }
    });
  }

  // No standalone JS files to copy - all migrated to TypeScript

}

// Build configuration
const buildConfig = {
  entryPoints: {
    'content': 'src/core/content.ts',
    'background': 'src/ui/background/background.ts',
    'popup': 'src/ui/popup/popup.ts',
    'settings': 'src/ui/settings/settings.ts',
    'review-history': 'src/utils/review-history.ts',
    'analytics': 'src/ui/analytics/analytics.ts',
    'batch-ui': 'src/ui/batch/batch-ui.ts',
    'filter-presets': 'src/core/filter-presets.ts',
    'filters': 'src/core/filters.ts',
    'sorters': 'src/core/sorters.ts',
    'llm-client': 'src/services/llm-client.ts',
    'github-api': 'src/services/github-api.ts',
    'review-engine': 'src/services/review-engine.ts',
    'error-handler': 'src/utils/error-handler.ts',
    'batch-processor': 'src/services/batch-processor.ts',
  },
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: isProduction,
  sourcemap: !isProduction,
  legalComments: 'none',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  plugins: [
    {
      name: 'copy-static-files',
      setup(build) {
        build.onEnd(() => {
          copyStaticFiles();
        });
      }
    }
  ]
};

async function buildExtension() {
  console.log('Building extension...');

  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildConfig);
      await ctx.watch();
      console.log('Watching for changes...');
      await new Promise(() => {});
    } else {
      await esbuild.build(buildConfig);
      console.log('Build complete! Output in dist/');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildExtension();
