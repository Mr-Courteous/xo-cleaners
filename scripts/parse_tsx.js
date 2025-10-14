const fs = require('fs');
const parser = require('@babel/parser');
const path = process.argv[2];
try {
  const src = fs.readFileSync(path, 'utf8');
  const ast = parser.parse(src, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx', 'classProperties', 'decorators-legacy'],
  });
  console.log('Parsed OK');
} catch (e) {
  console.error('Parse error:');
  console.error(e.message);
  if (e.loc) console.error('At', e.loc);
  process.exit(1);
}
