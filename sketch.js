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
let bugSpriteSheet; // Bug sprite sheet image
let score = 0;
let level = 1;
let lives = 3;
let highScore = 0;

// Game objects
let frog = {
  col: 7,
  row: 13,
  alive: true,
  deathTimer: 0,
  x: 0,
  y: 0
};

let cars = [];
let logs = [];
let goals = [
  { col: 1, filled: false },
  { col: 4, filled: false },
  { col: 7, filled: false },
  { col: 10, filled: false },
  { col: 13, filled: false }
];

// =====================================================
//  PRELOAD - Load images before game starts
// =====================================================
function preload() {
  // Load bug sprite sheet (160x32, two 80x32 frames side by side)
  bugSpriteSheet = loadImage('bug_sprite.png');
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
  fill(0, 255, 0); // Green - retro arcade style
  textAlign(CENTER, CENTER);
  textSize(48);
  text('FROGGER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120);

  textSize(16);
  fill(255);
  text('Help the frog cross the busy road', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  text('and navigate the river to reach safety!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  textSize(14);
  fill(200, 200, 200);
  text('ARROW KEYS to move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  text('Avoid cars and stay on logs', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
  text('Reach all 5 lily pads to beat the level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);

  textSize(20);
  fill(0, 255, 0);
  text('PRESS SPACE TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 180);

  textSize(12);
  fill(150);
  text('High Score: ' + highScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
}

// =====================================================
//  GAMEPLAY
// =====================================================
function drawGameplay() {
  drawWorld();
  updateAndDrawObjects();

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
  cars = [];
  let speedMultiplier = 1 + (level - 1) * 0.2;

  // Row 8: Red cars going right
  addCarsToRow(8, 3, 2 * speedMultiplier, 1, color(220, 50, 50), 1.2);
  // Row 9: Yellow cars going left
  addCarsToRow(9, 3, 2.2 * speedMultiplier, -1, color(240, 180, 20), 1);
  // Row 10: Purple trucks going right (longer, slower)
  addCarsToRow(10, 2, 1.8 * speedMultiplier, 1, color(180, 60, 200), 1.8);
  // Row 11: Blue cars going left
  addCarsToRow(11, 4, 2.1 * speedMultiplier, -1, color(50, 150, 220), 0.9);
  // Row 12: Orange cars going right
  addCarsToRow(12, 3, 2.3 * speedMultiplier, 1, color(220, 120, 50), 1.1);
}

function addCarsToRow(row, count, speed, direction, carColor, size) {
  let spacing = CANVAS_WIDTH / count;
  for (let i = 0; i < count; i++) {
    cars.push({
      x: i * spacing + random(0, spacing * 0.4),
      row: row,
      speed: speed * direction,
      color: carColor,
      width: TILE_SIZE * size,
      height: TILE_SIZE * 0.75
    });
  }
}

function spawnLogs() {
  logs = [];
  let speedMultiplier = 1 + (level - 1) * 0.15;

  // Row 1: Medium logs going right
  addLogsToRow(1, 2, 1.2 * speedMultiplier, 1, 2.5);
  // Row 2: Long logs going left
  addLogsToRow(2, 2, 1.5 * speedMultiplier, -1, 3.5);
  // Row 3: Short logs going right
  addLogsToRow(3, 3, 0.9 * speedMultiplier, 1, 2);
  // Row 4: Long logs going left
  addLogsToRow(4, 2, 1.3 * speedMultiplier, -1, 3);
  // Row 5: Medium logs going right
  addLogsToRow(5, 3, 1.1 * speedMultiplier, 1, 2.2);
}

function addLogsToRow(row, count, speed, direction, lengthInTiles) {
  let spacing = CANVAS_WIDTH / count;
  for (let i = 0; i < count; i++) {
    logs.push({
      x: i * spacing,
      row: row,
      speed: speed * direction,
      width: TILE_SIZE * lengthInTiles,
      height: TILE_SIZE * 0.7
    });
  }
}

// =====================================================
//  UPDATE AND DRAW CARS AND LOGS
// =====================================================
function updateAndDrawObjects() {
  // Update and draw logs
  for (let log of logs) {
    log.x += log.speed;

    // Wrap around screen
    if (log.speed > 0 && log.x > CANVAS_WIDTH) {
      log.x = -log.width;
    }
    if (log.speed < 0 && log.x + log.width < 0) {
      log.x = CANVAS_WIDTH;
    }

    // Draw log
    let y = log.row * TILE_SIZE + TILE_SIZE * 0.15;
    fill(139, 90, 43);
    stroke(100, 60, 20);
    strokeWeight(1);
    rect(log.x, y, log.width, log.height, 6);

    // Log texture lines
    stroke(120, 75, 30, 150);
    strokeWeight(1);
    for (let i = 1; i < log.width / TILE_SIZE; i++) {
      line(log.x + i * TILE_SIZE, y + 4, log.x + i * TILE_SIZE, y + log.height - 4);
    }
    noStroke();
  }

  // Update and draw cars
  for (let car of cars) {
    car.x += car.speed;

    // Wrap around screen
    if (car.speed > 0 && car.x > CANVAS_WIDTH) {
      car.x = -car.width;
    }
    if (car.speed < 0 && car.x + car.width < 0) {
      car.x = CANVAS_WIDTH;
    }

    // Draw car body
    let y = car.row * TILE_SIZE + TILE_SIZE * 0.125;
    fill(car.color);
    noStroke();
    rect(car.x, y, car.width, car.height, 5);

    // Car windows
    fill(180, 230, 255, 200);
    rect(car.x + car.width * 0.1, y + car.height * 0.1, car.width * 0.35, car.height * 0.4, 2);
    rect(car.x + car.width * 0.55, y + car.height * 0.1, car.width * 0.35, car.height * 0.4, 2);

    // Headlights
    fill(255, 255, 180);
    let hlx = car.speed > 0 ? car.x + car.width - 4 : car.x + 4;
    circle(hlx, y + car.height * 0.3, 4);
    circle(hlx, y + car.height * 0.7, 4);
  }
}

// =====================================================
//  FROG DRAWING AND ANIMATION
// =====================================================
function drawFrog() {
  let x = frog.col * TILE_SIZE + TILE_SIZE / 2;
  let y = frog.row * TILE_SIZE + TILE_SIZE / 2;

  // Calculate which frame to show (alternate every 8 frames)
  let frameNum = Math.floor(frameCount / 8) % 2;
  
  push();
  translate(x, y);
  
  if (!frog.alive) {
    // Death animation: spin and fade
    rotate(frameCount * 0.25);
    tint(255, 80, 80, map(frog.deathTimer, 60, 0, 255, 0)); // Red + fade
  }
  
  // Draw the frog sprite if it loaded, otherwise draw a placeholder
  if (bugSpriteSheet && bugSpriteSheet.width > 0) {
    imageMode(CENTER);
    // Use source region from sprite sheet
    let sx = frameNum * 80;
    let sy = 0;
    image(bugSpriteSheet, 0, 0, 80, 32, sx, sy, 80, 32);
  } else {
    // Fallback: draw green circle if sprite didn't load
    fill(0, 200, 0);
    noStroke();
    circle(0, 0, 30);
  }
  
  noTint();
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

    for (let log of logs) {
      if (log.row === frog.row) {
        if (frogPixelX + TILE_SIZE > log.x && frogPixelX < log.x + log.width) {
          // Frog is on this log - ride with it
          frog.col += log.speed / TILE_SIZE;
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

    for (let car of cars) {
      if (car.row !== frog.row) continue;

      let carTop = car.row * TILE_SIZE + TILE_SIZE * 0.125;
      let carBottom = carTop + car.height;

      // Rectangle collision
      if (frogRight > car.x && frogLeft < car.x + car.width &&
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
