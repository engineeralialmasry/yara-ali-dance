const http = require('http');
const fs = require('fs');
const path = require('path');

const FRAME_DELAY = 150;
const FRAME_COUNT = 10;
const COLUMN_WIDTH = 25;
const PORT = process.env.PORT || 8080;

function loadFrames(character) {
  const frames = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const filePath = path.join(__dirname, 'frames', character, `frame${i}.txt`);
    try {
      frames.push(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`Missing: ${filePath}`);
      frames.push('');
    }
  }
  return frames;
}

const yaraFrames = loadFrames('yara');
const aliFrames = loadFrames('ali');

function mergeFrames(frameA, frameB) {
  const linesA = frameA.split('\n');
  const linesB = frameB.split('\n');
  const maxLines = Math.max(linesA.length, linesB.length);
  const result = [];
  for (let i = 0; i < maxLines; i++) {
    const left = (linesA[i] || '').padEnd(COLUMN_WIDTH);
    const right = linesB[i] || '';
    result.push(left + right);
  }
  return result.join('\n');
}

function buildOutput(frameIndex) {
  const yaraFrame = yaraFrames[frameIndex % yaraFrames.length];
  const aliOffset = Math.floor(FRAME_COUNT / 2);
  const aliFrame = aliFrames[(frameIndex + aliOffset) % aliFrames.length];
  const merged = mergeFrames(yaraFrame, aliFrame);
  const title = '        ♪  Yara & Ali Dance  ♪\n\n';
  const labels = '        Yara'.padEnd(COLUMN_WIDTH + 8) + 'Ali\n';
  const divider = '─'.repeat(50) + '\n';
  return title + merged + '\n' + divider + labels;
}

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=UTF-8',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
  });

  let frameIndex = 0;
  res.write('\033[2J\033[H' + buildOutput(frameIndex));
  frameIndex++;

  const interval = setInterval(() => {
    res.write('\033[2J\033[H' + buildOutput(frameIndex));
    frameIndex++;
  }, FRAME_DELAY);

  req.on('close', () => clearInterval(interval));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test it: curl localhost:${PORT}`);
});