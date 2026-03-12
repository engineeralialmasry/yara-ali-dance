const http = require('http');
const fs   = require('fs');
const path = require('path');

// ── Settings ──────────────────────────────────────────────
const FRAME_DELAY  = 150;   // ms between frames (lower = faster dance)
const FRAME_COUNT  = 10;    // number of frames per character
const COLUMN_WIDTH = 30;    // characters wide per dancer
const PORT         = 8080;

// ── Load all frames from disk at startup ──────────────────
function loadFrames(character) {
  const frames = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const filePath = path.join(__dirname, 'frames', character, `frame${i}.txt`);
    try {
      frames.push(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`Missing frame: ${filePath}`);
      frames.push('');
    }
  }
  return frames;
}

const yaraFrames = loadFrames('yara');
const aliFrames  = loadFrames('ali');

// ── Merge two frames side by side ─────────────────────────
function mergeFrames(frameA, frameB) {
  const linesA   = frameA.split('\n');
  const linesB   = frameB.split('\n');
  const maxLines = Math.max(linesA.length, linesB.length);

  const result = [];
  for (let i = 0; i < maxLines; i++) {
    const left  = (linesA[i] || '').padEnd(COLUMN_WIDTH);
    const right = linesB[i] || '';
    result.push(left + right);
  }
  return result.join('\n');
}

// ── Title and labels ───────────────────────────────────────
function buildOutput(frameIndex) {
  const yaraFrame = yaraFrames[frameIndex % yaraFrames.length];

  // Ali is offset by half so they're on opposite beats
  const aliOffset = Math.floor(FRAME_COUNT / 2);
  const aliFrame  = aliFrames[(frameIndex + aliOffset) % aliFrames.length];

  const merged = mergeFrames(yaraFrame, aliFrame);

  const title  = '       ♪  Yara & Ali Dance  ♪\n';
  const spacer = '\n';
  const labels = '       Yara'.padEnd(COLUMN_WIDTH + 6) + 'Ali\n';
  const divider = '─'.repeat(COLUMN_WIDTH * 2) + '\n';

  return title + spacer + merged + '\n' + divider + labels;
}

// ── HTTP Server ────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type'      : 'text/plain; charset=UTF-8',
    'Transfer-Encoding' : 'chunked',
    'Cache-Control'     : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });

  let frameIndex = 0;

  // Send first frame immediately
  res.write('\033[2J\033[H' + buildOutput(frameIndex));
  frameIndex++;

  const interval = setInterval(() => {
    // \033[2J = clear screen   \033[H = move cursor to top-left
    res.write('\033[2J\033[H' + buildOutput(frameIndex));
    frameIndex++;
  }, FRAME_DELAY);

  // Clean up when user presses Ctrl+C
  req.on('close', () => {
    clearInterval(interval);
  });
});

server.listen(PORT, () => {
  console.log(`✓ Server is running!`);
  console.log(`✓ Open a new terminal and run: curl localhost:${PORT}`);
});