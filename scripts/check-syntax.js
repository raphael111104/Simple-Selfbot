"use strict";

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const files = [
  path.join(projectRoot, 'main.js'),
  path.join(projectRoot, 'conn.js'),
  ...fs.readdirSync(path.join(projectRoot, 'function'))
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(projectRoot, 'function', file))
];

for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

console.log(`Syntax check passed for ${files.length} files.`);
