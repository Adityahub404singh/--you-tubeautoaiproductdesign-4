import { readFileSync, writeFileSync } from 'fs';

const code = readFileSync('app/api/video/generate/route.js', 'utf8');
const lines = code.split('\n');

// Show lines 315-330 to see the exact problem
console.log('Lines 315-330:');
lines.slice(314, 330).forEach((line, i) => {
  console.log((315+i) + ': ' + line);
});
