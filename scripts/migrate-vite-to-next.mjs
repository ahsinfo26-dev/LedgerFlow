#!/usr/bin/env node
/**
 * Simple migration driver (starter).
 * - Uses fs-extra and globby (workflow installs them).
 * - Finds candidate files and applies mechanical replacements.
 *
 * Paste this into scripts/migrate-vite-to-next.mjs and commit.
 */

import fs from 'fs-extra';
import { globby } from 'globby';

async function processFile(file) {
  const text = await fs.readFile(file, 'utf8');

  // Example mechanical edits — customize these rules as needed.
  let updated = text;

  // Example: replace imports from 'vite' with a placeholder import from 'next'
  updated = updated.replace(/from\s+['"]vite['"]/g, "from 'next'");

  // Add more rules here, e.g. route changes, file renames, etc.

  if (updated !== text) {
    await fs.writeFile(file, updated, 'utf8');
    console.log(`Updated: ${file}`);
    return true;
  }
  return false;
}

async function run() {
  console.log('Starting migration script...');
  const patterns = [
    'src/**/*.{js,jsx,ts,tsx,mjs}',
    'pages/**/*.{js,ts,jsx,tsx}',
    'components/**/*.{js,ts,jsx,tsx}',
    '*.js',
    '*.mjs',
    '!node_modules/**'
  ];

  const files = await globby(patterns);
  console.log(`Found ${files.length} candidate files.`);

  let changed = 0;
  for (const file of files) {
    try {
      if (await processFile(file)) changed++;
    } catch (err) {
      console.warn(`Error processing ${file}: ${err.message}`);
    }
  }

  console.log(`Migration complete. Files changed: ${changed}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
