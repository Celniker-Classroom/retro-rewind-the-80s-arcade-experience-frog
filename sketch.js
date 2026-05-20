// =====================================================
//  FROGGER - 80s Arcade Experience
//  Inspired by the classic 1982 Konami arcade game
//  Use ARROW KEYS to move, SPACE to start/restart
// =====================================================

// Game constants
const GRID_COLS = 14;
const GRID_ROWS = 14;
const TILE_SIZE = 40;
const CANVAS_WIDTH = GRID_COLS * TILE_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE;

// Game states
const GAME_STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  GAME_OVER: 'gameOver',
  LEVEL_COMPLETE: 'levelComplete'
};

// Global variables
let gameState = GAME_STATE.TITLE;
let score = 0;
let level = 1;
let lives = 3;
let highScore = 0;
let lastScore = 0;

// Timer for each run (seconds)
let runDuration = 60; // starts at 60s and shortens with level
let timeLeft = 60;

// Starfield for title screen
let stars = [];

// Game objects
let frog = {
  col: 7,
  row: 13,
  alive: true,
  deathTimer: 0,
  x: 0,
  y: 0
};

// Replace plain arrays with sprite groups (q5play / p5.play style)
let cars = []; // Array of car objects
let logs = []; // Array of log objects
let spritesData; // Load from sprites.json
let goals = [
  { col: 1, filled: false },
  { col: 4, filled: false },
  { col: 7, filled: false },
  { col: 10, filled: false },
  { col: 13, filled: false }
];

// =====================================================
//  PRELOAD - Load images and data before game starts
// =====================================================
function preload() {
  // Load sprite definitions from JSON (synchronously wait for it to load)
  spritesData = loadJSON('sprites.json');
  // No external frog sprite; we'll use emoji for the frog player.
}

// Helper function to ensure data is loaded
function ensureSpritesData() {
  if (!spritesData || typeof spritesData.then === 'function') {
    // If it's a Promise, log a warning
    console.warn('spritesData is still loading or is null');
    return false;
  }
  return true;
}

// =====================================================
//  SETUP - Initialize canvas and game
// =====================================================
function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  spawnCars();
  spawnLogs();
  if (localStorage.getItem('froggerHighScore')) {
    highScore = parseInt(localStorage.getItem('froggerHighScore'));
  }
  if (localStorage.getItem('froggerLastScore')) {
    lastScore = parseInt(localStorage.getItem('froggerLastScore'));
  }

  // Prepare title screen starfield
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: random(0, CANVAS_WIDTH),
      y: random(0, CANVAS_HEIGHT / 2),
      sz: random(1, 3),
      hue: random(150, 360)
    });
  }
}

// =====================================================
//  MAIN GAME LOOP
// =====================================================
function draw() {
  background(0);

  if (gameState === GAME_STATE.TITLE) {
    drawTitleScreen();
  } else if (gameState === GAME_STATE.PLAYING) {
    drawGameplay();
  } else if (gameState === GAME_STATE.GAME_OVER) {
    drawGameOverScreen();
  } else if (gameState === GAME_STATE.LEVEL_COMPLETE) {
    drawLevelCompleteScreen();
  }
}

// =====================================================
//  TITLE SCREEN
// =====================================================
function drawTitleScreen() {
  // Retro starfield and grid background
  background(6, 6, 10);

  // Stars
  noStroke();
  for (let s of stars) {
    fill(220, 220, 255, map(s.sz, 1, 3, 120, 255));
    circle(s.x, s.y, s.sz);
  }

  // Perspective grid
  stroke(80, 30, 90);
  strokeWeight(1);
  for (let i = 0; i < 8; i++) {
    let y = CANVAS_HEIGHT * 0.6 + i * 20;
    line(0, y, CANVAS_WIDTH, y);
  }
  for (let i = 0; i < 16; i++) {
    let x = i * (CANVAS_WIDTH / 16);
    let y1 = CANVAS_HEIGHT * 0.6;
    line(x, y1, CANVAS_WIDTH / 2 + (x - CANVAS_WIDTH / 2) * 4, CANVAS_HEIGHT);
  }

  // HIGH SCORE at top center
  textAlign(CENTER, TOP);
  textSize(18);
  fill(255, 120, 150);
  text('HIGH SCORE', CANVAS_WIDTH / 2, 8);
  textSize(22);
  fill(255, 255, 255);
  text(nf(highScore, 0), CANVAS_WIDTH / 2, 28);

  // Main title: PRESS START
  textAlign(CENTER, CENTER);
  textSize(72);
  // Glow effect
  fill(255, 120, 60);
  text('PRESS START', CANVAS_WIDTH / 2 + 4, CANVAS_HEIGHT / 2 - 40);
  fill(255, 200, 80);
  text('PRESS START', CANVAS_WIDTH / 2 - 2, CANVAS_HEIGHT / 2 - 44);
  // Subtext
  textSize(18);
  fill(200);
  text('INSERT COIN TO CONTINUE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

  // Show last run score and credit
  textSize(12);
  fill(255);
  text('LAST SCORE: ' + lastScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);

  // Credit on bottom-left
  textAlign(LEFT);
  fill(220, 70, 120);
  textSize(14);
  text('CREDIT 00', 8, CANVAS_HEIGHT - 24);
}

// =====================================================
//  GAMEPLAY
// =====================================================
function drawGameplay() {
  drawWorld();
  updateAndDrawObjects();

  // Update timer
  timeLeft -= deltaTime / 1000;
  if (timeLeft <= 0) {
    // Time's up -> frog drowns / loses a life
    timeLeft = 0;
    killFrog();
  }

  if (frog.alive) {
    handleFrogInput();
    checkCollisions();
  } else {
    frog.deathTimer--;
    if (frog.deathTimer <= 0) {
      lives--;
      if (lives <= 0) {
        gameState = GAME_STATE.GAME_OVER;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('froggerHighScore', highScore);
        }
      } else {
        respawnFrog();
      }
    }
  }

  drawFrog();
  drawHUD();
}

// =====================================================
//  WORLD DRAWING
// =====================================================
function drawWorld() {
  // Goal zone (row 0) - dark green
  fill(20, 80, 20);
  noStroke();
  rect(0, 0, CANVAS_WIDTH, TILE_SIZE);

  // River (rows 1-5) - blue
  fill(20, 60, 130);
  rect(0, TILE_SIZE * 1, CANVAS_WIDTH, TILE_SIZE * 5);

  // Safe strip (rows 6-7) - green
  fill(60, 90, 40);
  rect(0, TILE_SIZE * 6, CANVAS_WIDTH, TILE_SIZE * 2);

  // Road (rows 8-12) - dark gray with lane markings
  fill(60, 60, 70);
  rect(0, TILE_SIZE * 8, CANVAS_WIDTH, TILE_SIZE * 5);

  // Road markings - yellow dashed lines
  stroke(200, 190, 50, 120);
  strokeWeight(2);
  for (let row = 8; row <= 12; row++) {
    for (let x = 0; x < CANVAS_WIDTH; x += TILE_SIZE * 1.5) {
      let y = row * TILE_SIZE + TILE_SIZE / 2;
      line(x, y, x + TILE_SIZE * 0.8, y);
    }
  }
  noStroke();

  // Start zone (row 13) - green
  fill(60, 90, 40);
  rect(0, TILE_SIZE * 13, CANVAS_WIDTH, TILE_SIZE);

  // Draw lily pads (goals)
  for (let goal of goals) {
    if (goal.filled) {
      fill(50, 200, 80); // Bright green when occupied
    } else {
      fill(40, 110, 40); // Dark green when empty
    }
    ellipse(goal.col * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE * 0.8, TILE_SIZE * 0.7);

    // Highlight on filled lily pads
    if (goal.filled) {
      fill(100, 255, 100, 200);
      ellipse(goal.col * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE * 0.3, TILE_SIZE * 0.3);
    }
  }
}

// =====================================================
//  SPAWN CARS AND LOGS
// =====================================================
function spawnCars() {
  // Clear previous cars and spawn new ones from JSON data
  cars = [];

  if (!ensureSpritesData()) return;

  let speedMultiplier = 1 + (level - 1) * 0.2;

  // Iterate through car configurations from sprites.json
  for (let carConfig of spritesData.cars) {
    addCarsToRow(carConfig.row, carConfig.count, carConfig.speed * speedMultiplier, 
                 carConfig.direction, carConfig.color, carConfig.size);
  }
}

function addCarsToRow(row, count, speed, direction, carColor, size) {
  let spacing = CANVAS_WIDTH / count;
  for (let i = 0; i < count; i++) {
    let w = TILE_SIZE * size;
    let h = TILE_SIZE * 0.75;
    let x = i * spacing + random(0, spacing * 0.4);
    let y = row * TILE_SIZE + TILE_SIZE / 2;

    cars.push({
      x: x,
      y: y,
      w: w,
      h: h,
      vx: speed * direction,
      row: row,
      color: carColor
    });
  }
}

function spawnLogs() {
  // Clear previous logs and spawn new ones from JSON data
  logs = [];

  if (!ensureSpritesData()) return;

  let speedMultiplier = 1 + (level - 1) * 0.15;

  // Iterate through log configurations from sprites.json
  for (let logConfig of spritesData.logs) {
    addLogsToRow(logConfig.row, logConfig.count, logConfig.speed * speedMultiplier, 
                 logConfig.direction, logConfig.lengthInTiles);
  }
}

function addLogsToRow(row, count, speed, direction, lengthInTiles) {
  let spacing = CANVAS_WIDTH / count;
  for (let i = 0; i < count; i++) {
    let w = TILE_SIZE * lengthInTiles;
    let h = TILE_SIZE * 0.7;
    let x = i * spacing;
    let y = row * TILE_SIZE + TILE_SIZE / 2;

    let s = createSprite(x, y, w, h);
    sogs.push({
      x: x,
      y: y,
      w: w,
      h: h,
      vx: speed * direction,
      row: row
    }
}

// =====================================================
//  UPDATE AND DRAW CARS AND LOGS
// =====================================================
function updateAndDrawObjects() {
  // Update and draw logs
  for (let i = 0; i < logs.length; i++) {
    let log = logs[i];

    // Update position
    log.x += log.vx * deltaTime / 1000; // deltaTime in milliseconds

    // Wrap around horizontally
    if (log.vx > 0 && log.x - log.w / 2 > CANVAS_WIDTH) {
      log.x = -log.w / 2;
    }
    if (log.vx < 0 && log.x + log.w / 2 < 0) {
      log.x = CANVAS_WIDTH + log.w / 2;
    }

    // Draw log as rounded rect
    let lx = log.x - log.w / 2;
    let ly = log.y - log.h / 2 + TILE_SIZE * 0.15;
    fill(139, 90, 43);
    stroke(100, 60, 20);
    strokeWeight(1);
    rect(lx, ly, log.w, log.h, 6);

    // Log texture
    stroke(120, 75, 30, 150);
    strokeWeight(1);
    for (let t = 1; t < log.w / TILE_SIZE; t++) {
      line(lx + t * TILE_SIZE, ly + 4, lx + t * TILE_SIZE, ly + log.h - 4);
    }
    noStroke();
  }

  // Update and draw cars
  for (let i = 0; i < cars.length; i++) {
    let car = cars[i];

    // Update position
    car.x += car.vx * deltaTime / 1000; // deltaTime in milliseconds

    // Wrap around horizontally
    if (car.vx > 0 && car.x - car.w / 2 > CANVAS_WIDTH) {
      car.x = -car.w / 2;
    }
    if (car.vx < 0 && car.x + car.w / 2 < 0) {
      car.x = CANVAS_WIDTH + car.w / 2;
    }

    // Draw car body
    let cx = car.x - car.w / 2;
    let cy = car.y - car.h / 2 + TILE_SIZE * 0.125;
    fill(...car.color);
    noStroke();
    rect(cx, cy, car.w, car.h, 5);

    // Car windows
    fill(180, 230, 255, 200);
    rect(cx + car.w * 0.1, cy + car.h * 0.1, car.w * 0.35, car.h * 0.4, 2);
    rect(cx + car.w * 0.55, cy + car.h * 0.1, car.w * 0.35, car.h * 0.4, 2);

    // Headlights
    fill(255, 255, 180);
    let hlx = car.vx > 0 ? cx + car.w - 4 : cx + 4;
    circle(hlx, cy + car.h * 0.3, 4);
    circle(hlx, cy + car.h * 0.7, 4);
  }
}

// =====================================================
//  FROG DRAWING AND ANIMATION
// =====================================================
function drawFrog() {
  let x = frog.col * TILE_SIZE + TILE_SIZE / 2;
  let y = frog.row * TILE_SIZE + TILE_SIZE / 2;
  push();
  translate(x, y + 4);
  textAlign(CENTER, CENTER);
  textSize(TILE_SIZE * 0.9);
  if (!frog.alive) {
    // Brief death effect: fade the emoji
    fill(255, 80, 80, map(frog.deathTimer, 60, 0, 255, 0));
  } else {
    fill(255);
  }
  text('🐸', 0, 0);
  pop();
}

// =====================================================
//  FROG INPUT HANDLING
// =====================================================
function handleFrogInput() {
  // Movement is now handled in keyPressed() function
  // This function is called every frame to handle riding logs in the river

  // Handle river/log movement
  if (frog.row >= 1 && frog.row <= 5) {
    let onLog = false;
    let frogPixelX = frog.col * TILE_SIZE;

    for (let i = 0; i < logs.length; i++) {
      let log = logs[i];
      if (log.row === frog.row) {
        let lx = log.x - log.w / 2;
        if (frogPixelX + TILE_SIZE > lx && frogPixelX < lx + log.w) {
          // Frog is on this log - ride with it
          frog.col += log.vx / TILE_SIZE;
          onLog = true;
          break;
        }
      }
    }

    if (!onLog) {
      // Frog fell in the river!
      killFrog();
    } else if (frog.col < 0 || frog.col >= GRID_COLS) {
      // Frog rode off the edge
      killFrog();
    }
  }
}

// =====================================================
//  COLLISION DETECTION
// =====================================================
function checkCollisions() {
  // Car collision - only check in road rows (8-12)
  if (frog.row >= 8 && frog.row <= 12) {
    let frogLeft = frog.col * TILE_SIZE + TILE_SIZE * 0.15;
    let frogRight = frog.col * TILE_SIZE + TILE_SIZE * 0.85;
    let frogTop = frog.row * TILE_SIZE + TILE_SIZE * 0.15;
    let frogBottom = frog.row * TILE_SIZE + TILE_SIZE * 0.85;

    for (let i = 0; i < cars.length; i++) {
      let car = cars[i];
      if (car.row !== frog.row) continue;

      let carTop = car.y - car.h / 2;
      let carBottom = carTop + car.h;
      let carLeft = car.x - car.w / 2;
      let carRight = carLeft + car.w;

      // Rectangle collision
      if (frogRight > carLeft && frogLeft < carRight &&
          frogBottom > carTop && frogTop < carBottom) {
        killFrog();
        return;
      }
    }
  }

  // Check if frog reached a goal
  if (frog.row === 0) {
    for (let goal of goals) {
      if (abs(frog.col - goal.col) < 0.8) {
        if (goal.filled) {
          // Already filled - frog dies
          killFrog();
        } else {
          // New goal reached!
          goal.filled = true;
          score += 50;

          // Check if all goals filled
          if (goals.every(g => g.filled)) {
            // Level complete!
            gameState = GAME_STATE.LEVEL_COMPLETE;
            score += 500;
          } else {
            // Respawn for next lily pad
            respawnFrog();
          }
        }
        return;
      }
    }

    // Landed outside any goal
    killFrog();
  }
}

// =====================================================
//  FROG STATE MANAGEMENT
// =====================================================
function killFrog() {
  frog.alive = false;
  frog.deathTimer = 60;
}

function respawnFrog() {
  frog.col = 7;
  frog.row = 13;
  frog.alive = true;
}

function resetGame() {
  score = 0;
  level = 1;
  lives = 3;
  frog.col = 7;
  frog.row = 13;
  frog.alive = true;
  goals.forEach(g => g.filled = false);
  spawnCars();
  spawnLogs();
  // Set timer for this run depending on level
  runDuration = max(60 - (level - 1) * 5, 30);
  timeLeft = runDuration;
  gameState = GAME_STATE.PLAYING;
}

function nextLevel() {
  level++;
  goals.forEach(g => g.filled = false);
  frog.col = 7;
  frog.row = 13;
  frog.alive = true;
  spawnCars();
  spawnLogs();
  // shorten the timer each level, cap at 30s
  runDuration = max(60 - (level - 1) * 5, 30);
  timeLeft = runDuration;
  gameState = GAME_STATE.PLAYING;
}

// =====================================================
//  HUD - Heads Up Display
// =====================================================
function drawHUD() {
  fill(0, 255, 0); // Green text - retro arcade
  textAlign(LEFT);
  textSize(14);
  text('SCORE: ' + score, 8, CANVAS_HEIGHT - 5);

  // Timer at top center
  textAlign(CENTER, TOP);
  textSize(18);
  fill(255, 200, 80);
  let displayTime = max(0, Math.ceil(timeLeft));
  text('TIME: ' + nf(displayTime, 2) + 's', CANVAS_WIDTH / 2, 6);

  textAlign(RIGHT);
  text('LIVES: ', CANVAS_WIDTH - 60, CANVAS_HEIGHT - 5);

  // Draw life indicators (small circles)
  for (let i = 0; i < lives; i++) {
    fill(0, 255, 0);
    circle(CANVAS_WIDTH - 20 - i * 15, CANVAS_HEIGHT - 8, 8);
  }

  // Level indicator
  textAlign(CENTER);
  text('LEVEL: ' + level, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5);
}

// =====================================================
//  GAME OVER SCREEN
// =====================================================
function drawGameOverScreen() {
  // Dark overlay
  fill(0, 0, 0, 200);
  rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Game Over text
  fill(255, 50, 50); // Red
  textAlign(CENTER, CENTER);
  textSize(48);
  text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  // Score display
  textSize(24);
  fill(0, 255, 0);
  text('FINAL SCORE: ' + score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  text('HIGH SCORE: ' + highScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  // Save last score persistently
  lastScore = score;
  localStorage.setItem('froggerLastScore', lastScore);

  // Restart instructions
  textSize(16);
  fill(255, 255, 255);
  text('PRESS SPACE TO RETURN TO TITLE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
}

// =====================================================
//  LEVEL COMPLETE SCREEN
// =====================================================
function drawLevelCompleteScreen() {
  // Dark overlay
  fill(0, 0, 0, 200);
  rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Level Complete text
  fill(0, 255, 0); // Green
  textAlign(CENTER, CENTER);
  textSize(48);
  text('LEVEL ' + level + ' COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  // Score display
  textSize(20);
  fill(200, 200, 200);
  text('SCORE: ' + score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  // Next level instructions
  textSize(16);
  fill(0, 255, 0);
  text('PRESS SPACE FOR NEXT LEVEL', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}

// =====================================================
//  KEYBOARD INPUT
// =====================================================
function keyPressed() {
  if (keyCode === 32) { // SPACE key
    if (gameState === GAME_STATE.TITLE) {
      resetGame();
    } else if (gameState === GAME_STATE.GAME_OVER) {
      gameState = GAME_STATE.TITLE;
    } else if (gameState === GAME_STATE.LEVEL_COMPLETE) {
      nextLevel();
    }
    return false; // Prevent default spacebar behavior
  }

  // R key to restart
  if (keyCode === 82) {
    resetGame();
    return false;
  }

  // Handle frog movement during gameplay
  if (gameState === GAME_STATE.PLAYING && frog.alive) {
    let moved = false;

    // Arrow keys and WASD
    if (keyCode === LEFT_ARROW || keyCode === 65) { // LEFT_ARROW or A
      if (frog.col > 0) {
        frog.col--;
        moved = true;
      }
      return false;
    }
    if (keyCode === RIGHT_ARROW || keyCode === 68) { // RIGHT_ARROW or D
      if (frog.col < GRID_COLS - 1) {
        frog.col++;
        moved = true;
      }
      return false;
    }
    if (keyCode === UP_ARROW || keyCode === 87) { // UP_ARROW or W
      if (frog.row > 0) {
        frog.row--;
        moved = true;
      }
      return false;
    }
    if (keyCode === DOWN_ARROW || keyCode === 83) { // DOWN_ARROW or S
      if (frog.row < GRID_ROWS - 1) {
        frog.row++;
        moved = true;
      }
      return false;
    }

    // Award points for moving forward
    if (moved && frog.row < 13) {
      score += 10;
    }
  }
}
}
