#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const required = [
  'quality/regression/scenario-index.md',
  'quality/regression/hubei-pdb-top5.md',
  'quality/regression/government.md',
  'quality/regression/document-viewers.md',
  'quality/regression/search-pagination.md',
  'quality/regression/content-sites.md',
  'quality/regression/developer-sites.md',
  'quality/regression/failures.md'
];

let failed = false;
for (const rel of required) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.error(`missing ${rel}`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  if (!/^#\s+/m.test(text) || text.length < 200) {
    console.error(`invalid ${rel}`);
    failed = true;
  } else {
    console.log(`ok scenario ${path.basename(rel, '.md')}`);
  }
}

if (failed) process.exit(1);
