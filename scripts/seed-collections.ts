import { mkdirSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const MAILMAN_DIR = join(homedir(), '.mailman');
const COLLECTIONS_FILE = join(MAILMAN_DIR, 'collections.json');
const EXAMPLE_FILE = join(import.meta.dirname, '../docs/example-collections.json');

if (!existsSync(MAILMAN_DIR)) {
  mkdirSync(MAILMAN_DIR, { recursive: true });
}

if (existsSync(COLLECTIONS_FILE)) {
  console.log('⚠️  collections.json already exists. Overwrite? (y/N)');
  process.exit(0);
}

copyFileSync(EXAMPLE_FILE, COLLECTIONS_FILE);
console.log('✅ Example collections loaded successfully!');
console.log(`📁 Location: ${COLLECTIONS_FILE}`);
console.log('\nCollections created:');
console.log('  📁 REST API Example (4 requests)');
console.log('  📁 Weather API (2 requests)');
console.log('  📁 Authentication Examples (3 requests)');
