// Simple script to create placeholder PWA icons
// This creates basic SVG files that browsers can use

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

// Create 192x192 icon
const icon192 = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#2196F3"/>
  <text x="96" y="130" font-size="100" text-anchor="middle" fill="white" font-family="Arial, sans-serif">💰</text>
</svg>`;

// Create 512x512 icon
const icon512 = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2196F3"/>
  <text x="256" y="320" font-size="280" text-anchor="middle" fill="white" font-family="Arial, sans-serif">💰</text>
</svg>`;

// For now, we'll use SVG files as placeholders
// In production, you should replace these with proper PNG files
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.svg'), icon192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.svg'), icon512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), icon512);

console.log('✓ Icon placeholders created in public/ directory');
console.log('Note: For production, replace these SVG files with PNG files of the same names');
