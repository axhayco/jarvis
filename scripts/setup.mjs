#!/usr/bin/env node
// JARVIS preflight — a friendly, advisory check you run with `npm run setup`.
//
// It changes nothing and installs nothing. It looks at your machine, tells you
// what is ready and what is missing, and prints the two commands that start
// JARVIS. Every check degrades to a single friendly line if something is not
// there, and the script always exits 0 — it is advice, not a gate.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const tick = '  ok  ';
const warn = ' note ';
const info = '  ·   ';

function line(tag, msg) {
  console.log(`[${tag}] ${msg}`);
}

console.log('');
console.log('JARVIS preflight — checking your machine (nothing is changed)');
console.log('------------------------------------------------------------');

// --- Node version --------------------------------------------------------
try {
  const major = Number(process.versions.node.split('.')[0]);
  if (Number.isFinite(major) && major >= 20) {
    line(tick, `Node.js ${process.versions.node} (20+ required).`);
  } else {
    line(warn, `Node.js ${process.versions.node} is below 20. Please upgrade — the bridge needs Node 20 or newer.`);
  }
} catch {
  line(warn, 'Could not read the Node.js version. JARVIS needs Node 20 or newer.');
}

// --- Gemini API Key check ------------------------------------------------
let geminiKeyFound = false;
if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
  geminiKeyFound = true;
  line(tick, 'Gemini API key found in process environment.');
} else {
  try {
    const localEnv = readFileSync('.env.local', 'utf8');
    if (/GEMINI_API_KEY\s*=\s*\S+/.test(localEnv)) {
      geminiKeyFound = true;
      line(tick, 'Gemini API key found in .env.local.');
    }
  } catch {}
}
if (!geminiKeyFound) {
  line(warn, 'GEMINI_API_KEY not found.');
  line(info, 'Get a free key from Google AI Studio (https://aistudio.google.com/)');
  line(info, 'Add it to .env.local: GEMINI_API_KEY=your_key_here');
}

// --- ElevenLabs key (env or the elevenlabs MCP entry) --------------------
function findElevenLabsKey() {
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim()) {
    return 'environment (ELEVENLABS_API_KEY)';
  }
  try {
    const localEnv = readFileSync('.env.local', 'utf8');
    if (/ELEVENLABS_API_KEY\s*=\s*\S+/.test(localEnv)) {
      return '.env.local (ELEVENLABS_API_KEY)';
    }
  } catch {}
  return null;
}

const elSource = findElevenLabsKey();
if (elSource) {
  line(tick, `Premium voice available — ElevenLabs key found via ${elSource}.`);
} else {
  line(info, 'No ElevenLabs key found — JARVIS will use browser speech (that is completely fine).');
  line(info, '  Optional: add ELEVENLABS_API_KEY for a better voice and Scribe transcription. The free tier is enough for a demo.');
}

// --- How to run ----------------------------------------------------------
console.log('');
console.log('To run JARVIS, open two terminals:');
console.log('  1)  npm run bridge      # the brain (Google Gemini via bridge)');
console.log('  2)  npm run dev         # the face (open http://localhost:5173 in Chrome)');
console.log('');
console.log('Then click INITIALISE and say "Hey Jarvis".');
console.log('To let JARVIS take real actions (phone, browser, sending), run `npm run bridge:writes` instead of `npm run bridge`.');
console.log('');

process.exit(0);
