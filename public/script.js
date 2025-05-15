const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const INITIAL_DROP_INTERVAL = 1000; // начальный интервал падения в мс

// Параметры игры:
let score1 = 0, score2 = 0;
let level1 = 1, level2 = 1;
let dropInterval1 = INITIAL_DROP_INTERVAL;
let dropInterval2 = INITIAL_DROP_INTERVAL;
let isPaused = false;
let gameMode = "single";

const surrenderBtn = document.getElementById("surrenderBtn");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const nextPieceCanvas1 = document.getElementById("nextPiece1");
const nextCtx1 = nextPieceCanvas1.getContext("2d");
const nextPieceCanvas2 = document.getElementById("nextPiece2");
const nextCtx2 = nextPieceCanvas2.getContext("2d");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const scoreDiv2 = document.getElementById("scoreDiv2");

const pauseBtn = document.getElementById("pauseBtn");

// Элементы авторизации и выбора режима:
const authModal = document.getElementById("authModal");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const authMessage = document.getElementById("authMessage");

const modeSelect = document.getElementById("modeSelect");
const singlePlayerBtn = document.getElementById("singlePlayerBtn");
const multiPlayerBtn = document.getElementById("multiPlayerBtn");

const gameContainer = document.getElementById("gameContainer");

// Определения фигур:
const PIECES = [
  // Фигура T
  { shape: [[0,1,0],[1,1,1]], color: "purple" },
  // Фигура O
  { shape: [[1,1],[1,1]], color: "yellow" },
  // Фигура S
  { shape: [[0,1,1],[1,1,0]], color: "green" },
  // Фигура Z
  { shape: [[1,1,0],[0,1,1]], color: "red" },
  // Фигура L
  { shape: [[1,0,0],[1,1,1]], color: "orange" },
  // Фигура J
  { shape: [[0,0,1],[1,1,1]], color: "blue" },
  // Фигура I
  { shape: [[1,1,1,1]], color: "cyan" }
];


function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// Создаем доски для игроков:
let board1 = createBoard();
let board2 = createBoard();

// Генерация случайной фигуры:
function getRandomPiece() {
  const index = Math.floor(Math.random() * PIECES.length);
  return JSON.parse(JSON.stringify(PIECES[index]));
}

// Объекты игроков.
const player1 = {
  board: board1,
  currentPiece: null,
  nextPiece: null,
  pos: { x: 3, y: 0 },
  lastDropTime: Date.now()
};

const player2 = {
  board: board2,
  currentPiece: null,
  nextPiece: null,
  pos: { x: 3, y: 0 },
  lastDropTime: Date.now()
};

// Функция поворота фигуры:
function rotate(piece) {
  const newShape = [];
  for (let x = 0; x < piece.shape[0].length; x++) {
    newShape[x] = piece.shape.map(row => row[x]).reverse();
  }
  piece.shape = newShape;
}

// Проверка столкновения:
function collision(board, piece, pos) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const x = pos.x + col;
        const y = pos.y + row;
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && board[y][x] !== 0) return true;
      }
    }
  }
  return false;
}

// "Пристыковка" фигуры к доске:
function placePiece(board, piece, pos) {
  piece.shape.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) {
        board[rowIndex + pos.y][colIndex + pos.x] = piece.color;
      }
    });
  });
}

// Удаление заполненных строк и обновление счета:
function removeFullLines(board, playerNumber) {
  let linesRemoved = 0;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(cell => cell !== 0)) {
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(0));
      linesRemoved++;
      row++;
    }
  }
  if (linesRemoved > 0) {
    if (playerNumber === 1) {
      score1 += linesRemoved * 10;
      score1El.innerText = score1;
      updateLevelAndSpeed(1);
      saveScore(1, score1);
    } else if (playerNumber === 2) {
      score2 += linesRemoved * 10;
      score2El.innerText = score2;
      updateLevelAndSpeed(2);
      saveScore(2, score2);
    }
  }
}

// Обновление уровня и скорости:
function updateLevelAndSpeed(playerNumber) {
  const levelThreshold = 100;
  if (playerNumber === 1) {
    const newLevel = Math.floor(score1 / levelThreshold) + 1;
    if (newLevel > level1) {
      level1 = newLevel;
      dropInterval1 = INITIAL_DROP_INTERVAL * Math.pow(0.9, level1 - 1);
      console.log(`Игрок 1 - уровень ${level1}, интервал: ${dropInterval1.toFixed(0)} мс`);
    }
  } else if (playerNumber === 2) {
    const newLevel = Math.floor(score2 / levelThreshold) + 1;
    if (newLevel > level2) {
      level2 = newLevel;
      dropInterval2 = INITIAL_DROP_INTERVAL * Math.pow(0.9, level2 - 1);
      console.log(`Игрок 2 - уровень ${level2}, интервал: ${dropInterval2.toFixed(0)} мс`);
    }
  }
}

function canMoveDown(piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] !== 0) { 
        let newY = piece.y + y + 1;
        if (newY >= ROWS || board[newY][piece.x + x] !== 0) {
          return false; 
        }
      }
    }
  }
  return true; 
}

function fixPiece(piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[piece.y + y][piece.x + x] = value;
      }
    });
  });
}


function drawBoard(board, offsetX) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];
      if (cell !== 0) {
        ctx.fillStyle = cell;
        ctx.fillRect(offsetX + col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(offsetX + col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      } else {
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(offsetX + col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = "#ddd";
        ctx.strokeRect(offsetX + col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }

  // Добавляем разделяющую линию между игроками
  if (gameMode === "multi") {
    ctx.fillStyle = "black"; // Цвет разделительной линии
    ctx.fillRect(COLS * BLOCK_SIZE, 0, 2, ROWS * BLOCK_SIZE); // Ширина линии 2 пикселя
  }
}

// Отрисовка текущей фигуры:
function drawPiece(piece, pos, offsetX) {
  piece.shape.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) {
        ctx.fillStyle = piece.color;
        ctx.fillRect(
          offsetX + (pos.x + colIndex) * BLOCK_SIZE,
          (pos.y + rowIndex) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
        ctx.strokeStyle = "#000";
        ctx.strokeRect(
          offsetX + (pos.x + colIndex) * BLOCK_SIZE,
          (pos.y + rowIndex) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
      }
    });
  });
}

// Отрисовка следующей фигуры:
function drawNextPiece(piece, nextCtx) {
  nextCtx.clearRect(0, 0, nextCtx.canvas.width, nextCtx.canvas.height);
  const gridSize = 30;
  piece.shape.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) {
        nextCtx.fillStyle = piece.color;
        nextCtx.fillRect(colIndex * gridSize, rowIndex * gridSize, gridSize, gridSize);
        nextCtx.strokeStyle = "#000";
        nextCtx.strokeRect(colIndex * gridSize, rowIndex * gridSize, gridSize, gridSize);
      }
    });
  });
}

function dropPiece() {
  if (canMoveDown(currentPiece)) {
    currentPiece.y += 1; 
  } else {
    fixPiece(currentPiece);
    currentPiece = getNewPiece(); 
    if (!canMoveDown(currentPiece)) {
      isGameOver = true; 
    }
  }
}

function update() {
  if (isPaused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const now = Date.now();

  // Обработка игрока 1
  if (now - player1.lastDropTime > dropInterval1) {
    if (collision(player1.board, player1.currentPiece, { x: player1.pos.x, y: player1.pos.y + 1 })) {
      // Фиксируем фигуру, если она достигла дна или соприкоснулась с другой фигурой
      placePiece(player1.board, player1.currentPiece, player1.pos);
      removeFullLines(player1.board, 1);
      player1.currentPiece = player1.nextPiece;
      player1.nextPiece = getRandomPiece();
      player1.pos = { x: 3, y: 0 };
      drawNextPiece(player1.nextPiece, nextCtx1);
      if (collision(player1.board, player1.currentPiece, player1.pos)) {
        alert("Игра окончена!");
        document.location.reload();
      }
    } else {
      player1.pos.y++;
    }
    player1.lastDropTime = now; // Обновляем время последнего падения
  }

  // Если режим мультиигрок, обрабатываем второго игрока:
  if (gameMode === "multi") {
    if (now - player2.lastDropTime > dropInterval2) {
      if (collision(player2.board, player2.currentPiece, { x: player2.pos.x, y: player2.pos.y + 1 })) {
        // Фиксируем фигуру игрока 2
        placePiece(player2.board, player2.currentPiece, player2.pos);
        removeFullLines(player2.board, 2);
        player2.currentPiece = player2.nextPiece;
        player2.nextPiece = getRandomPiece();
        player2.pos = { x: 3, y: 0 };
        drawNextPiece(player2.nextPiece, nextCtx2);
        if (collision(player2.board, player2.currentPiece, player2.pos)) {
          alert("Игра игрока 2 окончена!");
          document.location.reload();
        }
      } else {
        player2.pos.y++;
      }
      player2.lastDropTime = now; // Обновляем время последнего падения
    }
  }


  // Отрисовка досок
  if (gameMode === "single") {
    // Если одиночный режим – отрисовываем только доску player1 в левой половине холста
    drawBoard(player1.board, 0);
    drawPiece(player1.currentPiece, player1.pos, 0);
  } else {
    // Для мультиплеера отрисовываем обе доски
    drawBoard(player1.board, 0);
    drawBoard(player2.board, COLS * BLOCK_SIZE);
    drawPiece(player1.currentPiece, player1.pos, 0);
    drawPiece(player2.currentPiece, player2.pos, COLS * BLOCK_SIZE);
  }

  requestAnimationFrame(update);
}

// Функция запуска игры:
function startGame() {
  // Инициализация объектов игроков:
  player1.currentPiece = getRandomPiece();
  player1.nextPiece = getRandomPiece();
  player1.pos = { x: 3, y: 0 };
  player1.lastDropTime = Date.now();
  drawNextPiece(player1.nextPiece, nextCtx1);

  if (gameMode === "multi") {
    player2.currentPiece = getRandomPiece();
    player2.nextPiece = getRandomPiece();
    player2.pos = { x: 3, y: 0 };
    player2.lastDropTime = Date.now();
    drawNextPiece(player2.nextPiece, nextCtx2);
  }
  update();
}

// Обработка клавиш:
document.addEventListener("keydown", event => {
  // Пауза (P)
  if (event.key.toLowerCase() === "p") {
    isPaused = !isPaused;
    if (!isPaused) {
      player1.lastDropTime = Date.now();
      if (gameMode === "multi") player2.lastDropTime = Date.now();
      update();
      pauseBtn.innerText = "Пауза";
    } else {
      pauseBtn.innerText = "Продолжить";
    }
  }

  surrenderBtn.addEventListener("click", () => {
  if (confirm("Вы действительно хотите сдаться?")) {
    alert("Вы сдались! Игра окончена!");
    document.location.reload();
  }
});

  // Обработка для игрока 1:
  if (!isPaused) {
    if (event.key === "ArrowLeft") {
      if (!collision(player1.board, player1.currentPiece, { x: player1.pos.x - 1, y: player1.pos.y })) {
        player1.pos.x--;
      }
    }
    if (event.key === "ArrowRight") {
      if (!collision(player1.board, player1.currentPiece, { x: player1.pos.x + 1, y: player1.pos.y })) {
        player1.pos.x++;
      }
    }
    if (event.key === "ArrowDown") {
      if (!collision(player1.board, player1.currentPiece, { x: player1.pos.x, y: player1.pos.y + 1 })) {
        player1.pos.y++;
        player1.lastDropTime = Date.now();
      }
    }
    if (event.key === "ArrowUp") {
      let tempPiece = JSON.parse(JSON.stringify(player1.currentPiece));
      rotate(tempPiece);
      if (!collision(player1.board, tempPiece, player1.pos)) {
        player1.currentPiece = tempPiece;
      }
    }

    // Если мультиплеер, обрабатываем клавиши для игрока 2:
    if (gameMode === "multi") {
       if (event.key === "z" || event.key === "Z") { 
      if (confirm("Игрок 2, вы действительно хотите сдаться?")) {
        alert("Игрок 2 сдался! Игра окончена!");
        document.location.reload();
      }
    }
      if (event.key === "a" || event.key === "A") {
        if (!collision(player2.board, player2.currentPiece, { x: player2.pos.x - 1, y: player2.pos.y })) {
          player2.pos.x--;
        }
      }
      if (event.key === "d" || event.key === "D") {
        if (!collision(player2.board, player2.currentPiece, { x: player2.pos.x + 1, y: player2.pos.y })) {
          player2.pos.x++;
        }
      }
      if (event.key === "s" || event.key === "S") {
        if (!collision(player2.board, player2.currentPiece, { x: player2.pos.x, y: player2.pos.y + 1 })) {
          player2.pos.y++;
          player2.lastDropTime = Date.now();
        }
      }
      if (event.key === "w" || event.key === "W") {
        let tempPiece = JSON.parse(JSON.stringify(player2.currentPiece));
        rotate(tempPiece);
        if (!collision(player2.board, tempPiece, player2.pos)) {
          player2.currentPiece = tempPiece;
        }
      }
    }
  }
});

// Функции для аутентификации
async function login(username, password) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  } catch (error) {
    console.error("Ошибка входа:", error);
    return { success: false, message: "Ошибка запроса" };
  }
}

async function register(username, password) {
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    return { success: false, message: "Ошибка запроса" };
  }
}

// Обработчики авторизации:
loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) {
    authMessage.innerText = "Введите логин и пароль";
    return;
  }
  let result = await login(username, password);
  if (result.success) {
    authModal.style.display = "none";
    modeSelect.style.display = "flex";
  } else {
    authMessage.innerText = result.message;
  }
});

registerBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) {
    authMessage.innerText = "Введите логин и пароль";
    return;
  }
  let result = await register(username, password);
  authMessage.innerText = result.message;
});

// Обработка выбора режима игры:
singlePlayerBtn.addEventListener("click", () => {
  gameMode = "single";
  document.getElementById("nextPieceContainer2").style.display = "none";
  scoreDiv2.style.display = "none";
  canvas.width = COLS * BLOCK_SIZE; 
  gameContainer.style.display = "block";
  modeSelect.style.display = "none";
  startGame();
});

multiPlayerBtn.addEventListener("click", () => {
  gameMode = "multi";
  // Отображаем элементы для второго игрока
  document.getElementById("nextPieceContainer2").style.display = "block";
  scoreDiv2.style.display = "block";
  // Используем полный холст (600 px)
  canvas.width = COLS * BLOCK_SIZE * 2;
  gameContainer.style.display = "block";
  modeSelect.style.display = "none";
  startGame();
});

// Функция сохранения счета на сервере:
async function saveScore(player, score) {
  try {
    const response = await fetch("/api/saveScore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, score })
    });
    if (response.ok) {
      console.log(`Счёт игрока ${player} сохранён`);
    } else {
      console.error(`Ошибка при сохранении счёта игрока ${player}`);
    }
  } catch (error) {
    console.error("Ошибка запроса:", error);
  }
}