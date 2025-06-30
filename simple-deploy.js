#!/usr/bin/env node
import fs from 'fs';

console.log('🔧 초간단 배포 생성');

// 완전히 새로운 dist 폴더
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist');

// 가장 단순한 서버
const simpleServer = `const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('<h1>EzTax 배포 성공!</h1><p>서버가 정상 작동중입니다.</p>');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log('Server running on port ' + port);
});`;

fs.writeFileSync('dist/index.js', simpleServer);

// 가장 단순한 package.json
const simplePackage = {
  "name": "eztax",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(simplePackage, null, 2));

console.log('✅ 배포 파일 생성 완료');
console.log('📁 dist/index.js, dist/package.json');