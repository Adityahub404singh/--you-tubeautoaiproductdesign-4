import { readFileSync, writeFileSync } from 'fs';

const code = readFileSync('app/api/video/generate/route.js', 'utf8');
const lines = code.split('\n');

let fixed = 0;
const result = lines.map((line, i) => {
  // Fix any broken concatTxt line with backtick/replace issue
  if (line.includes('concatTxt') && line.includes('proc') && line.includes('replace')) {
    console.log('Found at line ' + i + ': ' + line.trim());
    // Replace with safe string concatenation
    const newLine = "            concatTxt += \"file '\" + proc.replace(/\\\\/g, \"/\") + \"'\\n\";";
    fixed++;
    return newLine;
  }
  return line;
});

if (fixed === 0) {
  // Try to find similar pattern
  lines.forEach((line, i) => {
    if (line.includes('concatTxt')) {
      console.log('concatTxt at line ' + i + ': ' + line.trim());
    }
  });
  console.log('Nothing fixed - check above lines');
} else {
  writeFileSync('app/api/video/generate/route.js', result.join('\n'), 'utf8');
  console.log('Fixed ' + fixed + ' lines!');
}
