const GAME_CONFIG = {
  ROUND_DURATION_SEC: 60,
  MAX_HEARTS: 3,
  BASE_POINTS: 10,
  STREAK_BONUS_PER_ORDER: 2,
  HIGH_SCORE_STORAGE_KEY: "orderUpHighScore",
  CANVAS_WIDTH: 880,
  CANVAS_HEIGHT: 220,
  COUNTER_Y: 162,
  DIFFICULTY_LEVELS: [
    { level: 1, minOrders: 0, minItems: 1, maxItems: 2, patienceSec: 15 },
    { level: 2, minOrders: 4, minItems: 2, maxItems: 3, patienceSec: 12 },
    { level: 3, minOrders: 9, minItems: 2, maxItems: 4, patienceSec: 9.5 },
  ],
  COLORS: {
    wallTop: "#F6E7C2",
    wallStripe: "#D9C49A",
    counterWood: "#7A442B",
    counterTrim: "#3B2A20",
    counterTop: "#D0A66F",
    plate: "#F7EDCF",
    plateRim: "#CBB58A",
    gold: "#C58A35",
    green: "#557B62",
    red: "#A94C35",
  },
};

const MENU_ITEM_PRICES = {
  burger: 75,
  fries: 45,
  pizza: 89,
  soda: 35,
  hotdog: 55,
  icecream: 50,
};

const MENU_ITEMS = [
  {
    id: "burger",
    name: "Burger",
    price: 75,
    keyHint: "1",
    accent: "#D97706",
    icon: "burger",
  },
  {
    id: "fries",
    name: "Fries",
    price: 45,
    keyHint: "2",
    accent: "#F59E0B",
    icon: "fries",
  },
  {
    id: "pizza",
    name: "Pizza",
    price: 89,
    keyHint: "3",
    accent: "#EA580C",
    icon: "pizza",
  },
  {
    id: "soda",
    name: "Soda",
    price: 35,
    keyHint: "4",
    accent: "#DC2626",
    icon: "soda",
  },
  {
    id: "hotdog",
    name: "Hotdog",
    price: 55,
    keyHint: "5",
    accent: "#B45309",
    icon: "hotdog",
  },
  {
    id: "icecream",
    name: "Ice Cream",
    price: 50,
    keyHint: "6",
    accent: "#EC4899",
    icon: "icecream",
  },
];

const CUSTOMER_STYLES = [
  { shirt: "#A94C35", hair: "#3B2A20", skin: "#E2C09A", hat: "#C58A35" },
  { shirt: "#557B62", hair: "#4A3528", skin: "#C99B72", hat: null },
  { shirt: "#C96B35", hair: "#6F4A32", skin: "#E9CBA8", hat: "#A94C35" },
  { shirt: "#7A442B", hair: "#35271F", skin: "#A97857", hat: null },
  { shirt: "#B88A52", hair: "#C58A35", skin: "#DFC09B", hat: "#557B62" },
];


const gameState = {
  screen: "start",
  gameActive: false,
  isPaused: false,
  isMuted: false,
  score: 0,
  highScore: Number(localStorage.getItem(GAME_CONFIG.HIGH_SCORE_STORAGE_KEY)) || 0,
  ordersServed: 0,
  orderCounter: 0,
  streak: 0,
  hearts: GAME_CONFIG.MAX_HEARTS,
  timeLeft: GAME_CONFIG.ROUND_DURATION_SEC,
  patienceLeft: 15,
  patienceMax: 15,
  selectedItems: [],
  currentOrder: { id: 0, items: [] },
  lastFrameTime: 0,
  secondAccumulator: 0,
  animationFrameId: null,
  audioCtx: null,
};

const canvasWorld = {
  customer: null,
  outgoingCustomers: [],
  particles: [],
  floatingTexts: [],
  servingPlates: [],
  shakeTimer: 0,
  shakeIntensity: 0,
  ambientTime: 0,
};

const dom = {
  screens: {
    start: document.getElementById("start-screen"),
    instructions: document.getElementById("instructions-screen"),
    game: document.getElementById("game-screen"),
    gameOver: document.getElementById("game-over-screen"),
  },
  pauseModal: document.getElementById("pause-modal"),
  buttons: {
    play: document.getElementById("play-btn"),
    howToPlay: document.getElementById("how-to-play-btn"),
    startGame: document.getElementById("start-game-btn"),
    backToStart: document.getElementById("back-to-start-btn"),
    serve: document.getElementById("serve-btn"),
    clear: document.getElementById("clear-btn"),
    pause: document.getElementById("pause-btn"),
    resume: document.getElementById("resume-btn"),
    quit: document.getElementById("quit-btn"),
    playAgain: document.getElementById("play-again-btn"),
    backToMenu: document.getElementById("back-to-menu-btn"),
    mute: document.getElementById("mute-btn"),
  },
  muteLabel: document.getElementById("mute-label"),
  bestScoreStart: document.getElementById("best-score-start"),
  timerBox: document.getElementById("timer-box"),
  timerDisplay: document.getElementById("timer-display"),
  scoreDisplay: document.getElementById("score-display"),
  ordersDisplay: document.getElementById("orders-display"),
  levelDisplay: document.getElementById("level-display"),
  streakDisplay: document.getElementById("streak-display"),
  healthDisplay: document.getElementById("health-display"),
  orderNumberLabel: document.getElementById("order-number-label"),
  orderItemsList: document.getElementById("order-items-list"),
  patienceBarFill: document.getElementById("patience-bar-fill"),
  patienceText: document.getElementById("patience-text"),
  feedbackBanner: document.getElementById("feedback-banner"),
  menuGrid: document.getElementById("menu-grid"),
  gameOverReason: document.getElementById("game-over-reason"),
  highScoreBadge: document.getElementById("high-score-badge"),
  finalScoreDisplay: document.getElementById("final-score-display"),
  finalOrdersDisplay: document.getElementById("final-orders-display"),
  highScoreDisplay: document.getElementById("high-score-display"),
  canvas: document.getElementById("game-canvas"),
  ctx: null,
};

if (dom.canvas) {
  dom.ctx = dom.canvas.getContext("2d");
}


function menuItemIconSVG(item) {
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#icon-${item.icon}"></use></svg>`;
}

function initMenuCards() {
  dom.menuGrid.innerHTML = "";
  MENU_ITEMS.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "food-card";
    card.dataset.itemId = item.id;
    card.setAttribute("aria-pressed", "false");
    card.innerHTML = `
      <span class="food-card-key">${item.keyHint}</span>
      ${menuItemIconSVG(item)}
      <span class="food-card-name">${item.name}</span>
      <span class="food-card-price">₱${MENU_ITEM_PRICES[item.id]}</span>
    `;
    card.addEventListener("click", () => selectItem(item.id));
    dom.menuGrid.appendChild(card);
  });
}

function selectItem(itemId) {
  if (!gameState.gameActive || gameState.isPaused) {
    return;
  }

  const existingIndex = gameState.selectedItems.indexOf(itemId);
  if (existingIndex !== -1) {
    gameState.selectedItems.splice(existingIndex, 1);
    playTone(340, 0.06, "triangle", 0.08);
  } else {
    gameState.selectedItems.push(itemId);
    playTone(520, 0.07, "sine", 0.1);
  }

  syncMenuCardSelectionUI();
}

function clearSelection() {
  if (!gameState.gameActive || gameState.isPaused) {
    return;
  }
  if (gameState.selectedItems.length === 0) {
    return;
  }
  gameState.selectedItems = [];
  syncMenuCardSelectionUI();
  playTone(280, 0.06, "triangle", 0.07);
}

function syncMenuCardSelectionUI() {
  const cards = dom.menuGrid.querySelectorAll(".food-card");
  cards.forEach((card) => {
    const isSelected = gameState.selectedItems.includes(card.dataset.itemId);
    card.classList.toggle("is-selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
  });
}

function handleKeyboardInput(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const key = event.key;

  if (key === "m" || key === "M") {
    toggleMute();
    return;
  }

  if (gameState.screen === "start" && (key === "Enter" || key === " ")) {
    event.preventDefault();
    startGame();
    return;
  }

  if (gameState.screen === "instructions" && (key === "Enter" || key === " ")) {
    event.preventDefault();
    startGame();
    return;
  }

  if (gameState.screen === "gameover" && (key === "Enter" || key === " ")) {
    event.preventDefault();
    startGame();
    return;
  }

  if (gameState.screen === "playing" && gameState.gameActive) {
    if (posDOM.modal && !posDOM.modal.hidden) {
      if (key === "Escape") {
        event.preventDefault();
        togglePause();
      } else if (key === "Enter") {
        event.preventDefault();
        attemptCompleteTransaction();
      } else if (key === "c" || key === "C") {
        event.preventDefault();
        clearChangeSelection();
      }
      return;
    }

    if (key === "Escape" || key === "p" || key === "P") {
      event.preventDefault();
      togglePause();
      return;
    }

    if (gameState.isPaused) {
      return;
    }

    const keyIndex = Number(key) - 1;
    if (key >= "1" && key <= "6" && MENU_ITEMS[keyIndex]) {
      event.preventDefault();
      selectItem(MENU_ITEMS[keyIndex].id);
      return;
    }

    if (key === "c" || key === "C" || key === "Backspace") {
      event.preventDefault();
      clearSelection();
      return;
    }

    if (key === "Enter" || key === " ") {
      event.preventDefault();
      serveOrder();
    }
  }
}

function togglePause() {
  if (!gameState.gameActive) {
    return;
  }
  gameState.isPaused = !gameState.isPaused;
  dom.pauseModal.hidden = !gameState.isPaused;
  if (!gameState.isPaused) {
    gameState.lastFrameTime = performance.now();
  }
}

function toggleMute() {
  gameState.isMuted = !gameState.isMuted;
  dom.buttons.mute.setAttribute("aria-pressed", String(gameState.isMuted));
  dom.muteLabel.textContent = gameState.isMuted ? "Muted" : "Sound On";
}

function bindEvents() {
  dom.buttons.play.addEventListener("click", startGame);
  dom.buttons.howToPlay.addEventListener("click", () => showScreen("instructions"));
  dom.buttons.startGame.addEventListener("click", startGame);
  dom.buttons.backToStart.addEventListener("click", () => showScreen("start"));

  dom.buttons.serve.addEventListener("click", serveOrder);
  dom.buttons.clear.addEventListener("click", clearSelection);

  dom.buttons.pause.addEventListener("click", togglePause);
  dom.buttons.resume.addEventListener("click", togglePause);
  dom.buttons.quit.addEventListener("click", quitToMenu);

  dom.buttons.playAgain.addEventListener("click", startGame);
  dom.buttons.backToMenu.addEventListener("click", quitToMenu);
  dom.buttons.mute.addEventListener("click", toggleMute);

  dom.canvas.addEventListener("click", () => {
    if (gameState.gameActive && !gameState.isPaused && gameState.selectedItems.length > 0) {
      serveOrder();
    }
  });

  window.addEventListener("keydown", handleKeyboardInput);
  window.addEventListener("blur", () => {
    if (gameState.gameActive && !gameState.isPaused) {
      togglePause();
    }
  });
}


function getDifficultyTier() {
  const levels = GAME_CONFIG.DIFFICULTY_LEVELS;
  let activeTier = levels[0];
  for (let i = 0; i < levels.length; i++) {
    if (gameState.ordersServed >= levels[i].minOrders) {
      activeTier = levels[i];
    }
  }
  return activeTier;
}

function spawnCustomerEntity() {
  const style = CUSTOMER_STYLES[Math.floor(Math.random() * CUSTOMER_STYLES.length)];
  return {
    x: -90,
    targetX: 250,
    y: GAME_CONFIG.COUNTER_Y - 12,
    vx: 0,
    bobPhase: Math.random() * Math.PI * 2,
    mood: "waiting",
    style,
  };
}

function spawnServingPlate(isCorrect) {
  const text = isCorrect ? "OK" : "NO";
  const color = isCorrect ? "#15803D" : "#DC2626";

  canvasWorld.servingPlates.push({
    isCorrect,
    x: 680,
    y: GAME_CONFIG.COUNTER_Y - 6,
    targetX: 340,
    vy: -55,
    gravity: 120,
    text,
    color,
    life: 0.95,
    maxLife: 0.95,
  });
}

function spawnFloatingText(x, y, text, color) {
  canvasWorld.floatingTexts.push({
    x,
    y,
    text,
    color,
    vy: -24,
    life: 1.1,
    maxLife: 1.1,
  });
}

function spawnParticleBurst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 45 + Math.random() * 95;
    const life = 0.45 + Math.random() * 0.35;

    canvasWorld.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 35,
      gravity: 120,
      radius: 2 + Math.random() * 2,
      color,
      life,
      maxLife: life,
    });
  }
}

function triggerCameraShake(intensity, duration) {
  canvasWorld.shakeIntensity = intensity;
  canvasWorld.shakeTimer = duration;
}

function updateEntitiesAndPhysics(dt) {
  canvasWorld.ambientTime += dt;

  if (canvasWorld.shakeTimer > 0) {
    canvasWorld.shakeTimer = Math.max(0, canvasWorld.shakeTimer - dt);
  }

  const customer = canvasWorld.customer;
  if (customer) {
    const dx = customer.targetX - customer.x;
    if (Math.abs(dx) > 1.5) {
      customer.x += dx * Math.min(1, dt * 8);
      customer.bobPhase += dt * 12;
    } else {
      customer.x = customer.targetX;
      customer.bobPhase += dt * 3;
    }

    const patienceRatio = gameState.patienceLeft / gameState.patienceMax;
    if (patienceRatio < 0.32 && customer.mood === "waiting") {
      customer.mood = "impatient";
    }
  }

  for (let i = canvasWorld.outgoingCustomers.length - 1; i >= 0; i--) {
    const out = canvasWorld.outgoingCustomers[i];
    out.x += 420 * dt;
    out.bobPhase += dt * 14;
    if (out.x > GAME_CONFIG.CANVAS_WIDTH + 90) {
      canvasWorld.outgoingCustomers.splice(i, 1);
    }
  }

  for (let i = canvasWorld.servingPlates.length - 1; i >= 0; i--) {
    const plate = canvasWorld.servingPlates[i];
    plate.x += (plate.targetX - plate.x) * Math.min(1, dt * 10);
    plate.vy += plate.gravity * dt;
    plate.y += plate.vy * dt;

    const floorY = GAME_CONFIG.COUNTER_Y - 6;
    if (plate.y > floorY) {
      plate.y = floorY;
      plate.vy = 0;
    }

    plate.life -= dt;
    if (plate.life <= 0) {
      canvasWorld.servingPlates.splice(i, 1);
    }
  }

  for (let i = canvasWorld.particles.length - 1; i >= 0; i--) {
    const p = canvasWorld.particles[i];
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      canvasWorld.particles.splice(i, 1);
    }
  }

  for (let i = canvasWorld.floatingTexts.length - 1; i >= 0; i--) {
    const ft = canvasWorld.floatingTexts[i];
    ft.y += ft.vy * dt;
    ft.life -= dt;
    if (ft.life <= 0) {
      canvasWorld.floatingTexts.splice(i, 1);
    }
  }
}


function drawCustomer(ctx, customer) {
  if (!customer) return;

  const bob = Math.sin(customer.bobPhase) * 3;
  const x = customer.x;
  const y = customer.y + bob;
  const { shirt, hair, skin, hat } = customer.style;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.roundRect(-26, -24, 52, 36, [18, 18, 0, 0]);
  ctx.fill();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -44, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(0, -49, 22, Math.PI, Math.PI * 2);
  ctx.fill();

  if (hat) {
    ctx.fillStyle = hat;
    ctx.beginPath();
    ctx.roundRect(-20, -68, 40, 14, 6);
    ctx.fill();
    ctx.fillRect(-20, -57, 46, 5);
  }

  ctx.fillStyle = "#2C1810";
  ctx.beginPath();
  ctx.arc(-7, -45, 2.6, 0, Math.PI * 2);
  ctx.arc(7, -45, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2C1810";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (customer.mood === "happy") {
    ctx.arc(0, -37, 7, 0.1 * Math.PI, 0.9 * Math.PI);
  } else if (customer.mood === "upset" || customer.mood === "impatient") {
    ctx.arc(0, -31, 6, 1.15 * Math.PI, 1.85 * Math.PI);
  } else {
    ctx.moveTo(-6, -35);
    ctx.lineTo(6, -35);
  }
  ctx.stroke();

  if (customer.mood === "impatient") {
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.arc(23, -52, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderCanvasScene() {
  const ctx = dom.ctx;
  if (!ctx) return;

  const w = GAME_CONFIG.CANVAS_WIDTH;
  const h = GAME_CONFIG.CANVAS_HEIGHT;
  const counterY = GAME_CONFIG.COUNTER_Y;

  ctx.save();

  if (canvasWorld.shakeTimer > 0) {
    const sx = (Math.random() - 0.5) * canvasWorld.shakeIntensity;
    const sy = (Math.random() - 0.5) * canvasWorld.shakeIntensity;
    ctx.translate(sx, sy);
  }

  ctx.fillStyle = GAME_CONFIG.COLORS.wallTop;
  ctx.fillRect(0, 0, w, counterY);

  ctx.fillStyle = GAME_CONFIG.COLORS.wallStripe;
  for (let x = 20; x < w; x += 64) {
    ctx.fillRect(x, 0, 12, counterY);
  }

  ctx.fillStyle = "#E8D4B7";
  ctx.fillRect(460, 26, 360, 108);
  ctx.strokeStyle = "#7A4222";
  ctx.lineWidth = 4;
  ctx.strokeRect(460, 26, 360, 108);

  [180, 640].forEach((lx) => {
    ctx.strokeStyle = "#4A2511";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 24);
    ctx.stroke();

    ctx.fillStyle = "#D97706";
    ctx.beginPath();
    ctx.arc(lx, 32, 16, Math.PI, 0);
    ctx.fill();
  });

  canvasWorld.outgoingCustomers.forEach((out) => drawCustomer(ctx, out));
  drawCustomer(ctx, canvasWorld.customer);

  ctx.fillStyle = GAME_CONFIG.COLORS.counterTop;
  ctx.fillRect(0, counterY - 8, w, 14);
  ctx.fillStyle = GAME_CONFIG.COLORS.counterWood;
  ctx.fillRect(0, counterY + 6, w, h - counterY);
  ctx.fillStyle = GAME_CONFIG.COLORS.counterTrim;
  ctx.fillRect(0, counterY + 4, w, 5);

  ctx.fillStyle = "#E5E7EB";
  ctx.beginPath();
  ctx.arc(410, counterY - 8, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#6B7280";
  ctx.fillRect(395, counterY - 8, 30, 4);

  canvasWorld.servingPlates.forEach((plate) => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, plate.life * 2);
    ctx.fillStyle = plate.isCorrect ? "#DCFCE7" : "#FEE2E2";
    ctx.strokeStyle = plate.isCorrect ? "#15803D" : "#DC2626";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(plate.x, plate.y, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = "800 18px 'Bricolage Grotesque', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = plate.color;
    ctx.fillText(plate.text, plate.x, plate.y - 2);
    ctx.restore();
  });

  canvasWorld.particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  canvasWorld.floatingTexts.forEach((ft) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
    ctx.font = "800 20px 'Bricolage Grotesque', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });

  ctx.restore();
}

function gameLoop(timestamp) {
  if (!gameState.gameActive) {
    gameState.animationFrameId = null;
    return;
  }

  const rawDt = (timestamp - gameState.lastFrameTime) / 1000;
  gameState.lastFrameTime = timestamp;
  const dt = Math.min(Math.max(rawDt, 0), 0.05);

  if (!gameState.isPaused) {
    const isCashierOpen = Boolean(posDOM.modal && !posDOM.modal.hidden);

    if (!isCashierOpen) {
      gameState.secondAccumulator += dt;
      if (gameState.secondAccumulator >= 1) {
        gameState.secondAccumulator -= 1;
        gameState.timeLeft = Math.max(0, gameState.timeLeft - 1);
        updateTimerDisplay();

        if (gameState.timeLeft <= 10 && gameState.timeLeft > 0) {
          playTone(660, 0.04, "sine", 0.05);
        }

        if (gameState.timeLeft <= 0) {
          endGame("Shift complete! Here is your final score.");
          return;
        }
      }

      gameState.patienceLeft -= dt;
      updatePatienceBar();
      if (gameState.patienceLeft <= 0) {
        handleOrderTimeout();
      }
    }

    updateEntitiesAndPhysics(dt);
  }

  renderCanvasScene();

  gameState.animationFrameId = requestAnimationFrame(gameLoop);
}


function showScreen(screenName) {
  gameState.screen = screenName;
  Object.values(dom.screens).forEach((el) => el.classList.remove("is-active"));

  if (screenName === "start") {
    dom.screens.start.classList.add("is-active");
    dom.bestScoreStart.textContent = String(gameState.highScore);
  } else if (screenName === "instructions") {
    dom.screens.instructions.classList.add("is-active");
  } else if (screenName === "playing") {
    dom.screens.game.classList.add("is-active");
  } else if (screenName === "gameover") {
    dom.screens.gameOver.classList.add("is-active");
  }
}

function generateOrder() {
  const tier = getDifficultyTier();
  const count =
    tier.minItems +
    Math.floor(Math.random() * (tier.maxItems - tier.minItems + 1));

  const pool = [...MENU_ITEMS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const chosenIds = pool.slice(0, count).map((item) => item.id);
  gameState.orderCounter += 1;
  gameState.currentOrder = {
    id: gameState.orderCounter,
    items: chosenIds,
  };
  gameState.patienceMax = tier.patienceSec;
  gameState.patienceLeft = tier.patienceSec;

  canvasWorld.customer = spawnCustomerEntity();

  renderOrderTicket();
  updatePatienceBar();
  updateHudDisplays();
}

function renderOrderTicket() {
  dom.orderNumberLabel.textContent = `ORDER #${gameState.currentOrder.id}`;
  dom.orderItemsList.innerHTML = "";

  gameState.currentOrder.items.forEach((itemId) => {
    const item = MENU_ITEMS.find((entry) => entry.id === itemId);
    if (!item) return;

    const chip = document.createElement("div");
    chip.className = "order-chip";
    chip.innerHTML = `${menuItemIconSVG(item)}<span>${item.name}</span>`;
    dom.orderItemsList.appendChild(chip);
  });
}

function isOrderExactMatch(selected, requested) {
  if (selected.length !== requested.length) {
    return false;
  }
  return requested.every((itemId) => selected.includes(itemId));
}

function penalizeHeart() {
  gameState.hearts = Math.max(0, gameState.hearts - 1);
  updateHudDisplays();
}

function closeShiftOrContinue(gameOverMessage) {
  if (gameState.hearts <= 0) {
    endGame(gameOverMessage);
    return;
  }
  generateOrder();
}

function serveOrder() {
  if (!gameState.gameActive || gameState.isPaused) {
    return;
  }

  if (gameState.selectedItems.length === 0) {
    setFeedback("Choose the items before serving.", "warn");
    playTone(300, 0.08, "triangle", 0.08);
    return;
  }

  const matched = isOrderExactMatch(
    gameState.selectedItems,
    gameState.currentOrder.items
  );

  if (matched) {
    gameState.ordersServed += 1;
    gameState.streak += 1;
    const bonus = (gameState.streak - 1) * GAME_CONFIG.STREAK_BONUS_PER_ORDER;
    const pointsEarned = GAME_CONFIG.BASE_POINTS + bonus;
    gameState.score += pointsEarned;

    if (canvasWorld.customer) {
      canvasWorld.customer.mood = "happy";
      canvasWorld.outgoingCustomers.push(canvasWorld.customer);
    }

    spawnServingPlate(true);
    spawnParticleBurst(260, GAME_CONFIG.COUNTER_Y - 40, "#15803D", 14);
    spawnParticleBurst(260, GAME_CONFIG.COUNTER_Y - 40, "#F59E0B", 10);
    spawnFloatingText(
      260,
      GAME_CONFIG.COUNTER_Y - 70,
      bonus > 0 ? `+${pointsEarned} (Streak x${gameState.streak})` : `+${pointsEarned}`,
      "#15803D"
    );
    setFeedback("Perfect match! Complete the payment at the register.", "success");
    playSuccessChime();
    gameState.selectedItems = [];
    syncMenuCardSelectionUI();
    openCashierModal(gameState.currentOrder.items, pointsEarned);
    return;
  } else {
    penalizeHeart();

    if (canvasWorld.customer) {
      canvasWorld.customer.mood = "upset";
      canvasWorld.outgoingCustomers.push(canvasWorld.customer);
    }

    spawnServingPlate(false);
    triggerCameraShake(8, 0.28);
    spawnFloatingText(260, GAME_CONFIG.COUNTER_Y - 70, "-1 Heart", "#DC2626");
    setFeedback("Not quite! Check the order and try the next customer.", "error");
    playErrorBuzz();
  }

  gameState.selectedItems = [];
  syncMenuCardSelectionUI();
  closeShiftOrContinue("Kitchen closed! You ran out of customer hearts.");
}

function handleOrderTimeout() {
  gameState.streak = 0;
  penalizeHeart();

  if (canvasWorld.customer) {
    canvasWorld.customer.mood = "upset";
    canvasWorld.outgoingCustomers.push(canvasWorld.customer);
  }

  triggerCameraShake(6, 0.24);
  spawnFloatingText(260, GAME_CONFIG.COUNTER_Y - 70, "Too Slow! -1 Heart", "#DC2626");
  setFeedback("Customer left waiting! Serve faster before patience runs out.", "error");
  playErrorBuzz();

  gameState.selectedItems = [];
  syncMenuCardSelectionUI();
  closeShiftOrContinue("Kitchen closed! Too many customers walked out.");
}

function setFeedback(message, tone) {
  dom.feedbackBanner.textContent = message;
  dom.feedbackBanner.classList.remove(
    "feedback-success",
    "feedback-error",
    "feedback-warn"
  );
  if (tone === "success") {
    dom.feedbackBanner.classList.add("feedback-success");
  } else if (tone === "error") {
    dom.feedbackBanner.classList.add("feedback-error");
  } else if (tone === "warn") {
    dom.feedbackBanner.classList.add("feedback-warn");
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(gameState.timeLeft / 60);
  const secs = gameState.timeLeft % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  dom.timerDisplay.textContent = formatted;
  dom.timerBox.classList.toggle("is-urgent", gameState.timeLeft <= 10);
}

function updatePatienceBar() {
  const ratio = Math.max(0, Math.min(1, gameState.patienceLeft / gameState.patienceMax));
  dom.patienceBarFill.style.width = `${(ratio * 100).toFixed(1)}%`;
  dom.patienceText.textContent = `${Math.ceil(gameState.patienceLeft)}s`;

  const isWarning = ratio <= 0.55 && ratio > 0.28;
  const isUrgent = ratio <= 0.28;

  dom.patienceBarFill.classList.toggle("is-warning", isWarning);
  dom.patienceBarFill.classList.toggle("is-urgent", isUrgent);
  dom.patienceText.classList.toggle("is-urgent", isUrgent);
}

function updateHudDisplays() {
  const tier = getDifficultyTier();
  dom.scoreDisplay.textContent = String(gameState.score).padStart(3, "0");
  dom.ordersDisplay.textContent = String(gameState.ordersServed);
  dom.streakDisplay.textContent = `x${gameState.streak}`;
  dom.levelDisplay.textContent = `Rush Lv ${tier.level}`;
  dom.healthDisplay.setAttribute(
    "aria-label",
    `${gameState.hearts} of ${GAME_CONFIG.MAX_HEARTS} hearts remaining`
  );
  dom.healthDisplay.querySelectorAll(".health-heart").forEach((heart, index) => {
    const isFilled = index < gameState.hearts;
    heart.classList.toggle("is-filled", isFilled);
    heart.classList.toggle("is-empty", !isFilled);
  });
}

function startGame() {
  if (gameState.animationFrameId !== null) {
    cancelAnimationFrame(gameState.animationFrameId);
    gameState.animationFrameId = null;
  }

  gameState.gameActive = true;
  gameState.isPaused = false;
  dom.pauseModal.hidden = true;

  gameState.score = 0;
  gameState.ordersServed = 0;
  gameState.orderCounter = 0;
  gameState.streak = 0;
  gameState.hearts = GAME_CONFIG.MAX_HEARTS;
  gameState.timeLeft = GAME_CONFIG.ROUND_DURATION_SEC;
  gameState.selectedItems = [];
  gameState.secondAccumulator = 0;

  canvasWorld.outgoingCustomers = [];
  canvasWorld.particles = [];
  canvasWorld.floatingTexts = [];
  canvasWorld.servingPlates = [];
  canvasWorld.shakeTimer = 0;

  syncMenuCardSelectionUI();
  updateTimerDisplay();
  updateHudDisplays();
  setFeedback("Select the matching items below and press Serve Order!", "");
  generateOrder();
  showScreen("playing");

  playTone(523.25, 0.08, "sine", 0.09);
  gameState.lastFrameTime = performance.now();
  gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame(reasonMessage) {
  gameState.gameActive = false;
  gameState.isPaused = false;
  dom.pauseModal.hidden = true;

  if (gameState.animationFrameId !== null) {
    cancelAnimationFrame(gameState.animationFrameId);
    gameState.animationFrameId = null;
  }

  const isNewRecord = gameState.score > gameState.highScore;
  if (isNewRecord) {
    gameState.highScore = gameState.score;
    localStorage.setItem(
      GAME_CONFIG.HIGH_SCORE_STORAGE_KEY,
      String(gameState.highScore)
    );
  }

  dom.gameOverReason.textContent =
    reasonMessage || "Shift complete! Here is your final score.";
  dom.finalScoreDisplay.textContent = String(gameState.score);
  dom.finalOrdersDisplay.textContent = String(gameState.ordersServed);
  dom.highScoreDisplay.textContent = String(gameState.highScore);
  dom.highScoreBadge.hidden = !isNewRecord;

  playTone(440, 0.12, "triangle", 0.09);
  showScreen("gameover");
}

function quitToMenu() {
  gameState.gameActive = false;
  gameState.isPaused = false;
  dom.pauseModal.hidden = true;

  if (gameState.animationFrameId !== null) {
    cancelAnimationFrame(gameState.animationFrameId);
    gameState.animationFrameId = null;
  }

  showScreen("start");
}

function ensureAudioContext() {
  if (!gameState.audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      gameState.audioCtx = new AudioCtx();
    }
  }
  if (gameState.audioCtx && gameState.audioCtx.state === "suspended") {
    gameState.audioCtx.resume().catch(() => {});
  }
  return gameState.audioCtx;
}

function playTone(freq, durationSec, type, volume) {
  if (gameState.isMuted) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationSec);
}

function playSuccessChime() {
  playTone(587.33, 0.09, "sine", 0.1);
  setTimeout(() => playTone(880, 0.14, "sine", 0.11), 65);
}

function playErrorBuzz() {
  playTone(190, 0.14, "sawtooth", 0.07);
  setTimeout(() => playTone(150, 0.16, "sawtooth", 0.07), 85);
}

initMenuCards();
bindEvents();
showScreen("start");

const CUSTOMER_BILLS = [50, 100, 200, 500, 1000];

const TIP_POINTS = 15;

let registerDrawerTotal = 0;

let cashierIdleTimerId = null;
let cashierIdleSeconds = 15;

const posRegisterState = {
  totalDue: 0,
  cashReceived: 0,
  changeGiven: 0,
  pendingOrderItems: [],
  pendingPoints: 0,
};

const posDOM = {
  modal:              document.getElementById("cashier-modal"),
  receiptItems:       document.getElementById("pos-receipt-items"),
  totalDue:           document.getElementById("pos-total-due"),
  cashReceived:       document.getElementById("pos-cash-received"),
  displayTotal:       document.getElementById("pos-display-total"),
  correctChange:      document.getElementById("pos-correct-change"),
  changeSelected:     document.getElementById("pos-change-selected"),
  paymentTypeLabel:   document.getElementById("pos-payment-type-label"),
  idleTimer:          document.getElementById("pos-idle-timer"),
  cashPanel:          document.getElementById("pos-cash-panel"),
  feedback:           document.getElementById("pos-feedback"),
  completeBtn:        document.getElementById("pos-complete-btn"),
  skipBtn:            document.getElementById("pos-skip-btn"),
  clearChangeBtn:     document.getElementById("pos-clear-change-btn"),
};

function startCashierIdleTimer() {
  stopCashierIdleTimer();
  cashierIdleSeconds = 15;
  updateCashierIdleBadge();

  cashierIdleTimerId = setInterval(() => {
    if (!gameState.gameActive || gameState.isPaused || !posDOM.modal || posDOM.modal.hidden) {
      stopCashierIdleTimer();
      return;
    }
    cashierIdleSeconds -= 1;
    updateCashierIdleBadge();

    if (cashierIdleSeconds <= 0) {
      stopCashierIdleTimer();
      handleCashierInactivityTimeout();
    }
  }, 1000);
}

function stopCashierIdleTimer() {
  if (cashierIdleTimerId) {
    clearInterval(cashierIdleTimerId);
    cashierIdleTimerId = null;
  }
}

function resetCashierIdleTimer() {
  cashierIdleSeconds = 15;
  updateCashierIdleBadge();
}

function updateCashierIdleBadge() {
  if (posDOM.idleTimer) {
    posDOM.idleTimer.textContent = `Leaves in ${cashierIdleSeconds}s`;
    posDOM.idleTimer.classList.toggle("is-urgent", cashierIdleSeconds <= 5);
  }
}

function handleCashierInactivityTimeout() {
  closeCashierModal();
  gameState.streak = 0;
  penalizeHeart();
  playErrorBuzz();
  triggerCameraShake(6, 0.24);
  spawnFloatingText(260, GAME_CONFIG.COUNTER_Y - 70, "Too Slow! -1 ♥", "#DC2626");
  setFeedback("Customer got tired of waiting for change and walked out! -1 Heart", "error");

  closeShiftOrContinue("Kitchen closed! Too many customers walked out.");
}

function formatPeso(amount) {
  return `₱${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function computeOrderTotal(itemIds) {
  return round2(itemIds.reduce((sum, id) => sum + (MENU_ITEM_PRICES[id] || 0), 0));
}

function pickCashTendered(total) {
  for (const bill of CUSTOMER_BILLS) {
    if (bill > total) return bill;
  }
  return Math.ceil(total / 1000) * 1000;
}

function openCashierModal(itemIds, earnedPoints) {
  posRegisterState.pendingOrderItems = [...itemIds];
  posRegisterState.pendingPoints     = earnedPoints;

  const total  = computeOrderTotal(itemIds);
  const tender = pickCashTendered(total);

  posRegisterState.totalDue     = total;
  posRegisterState.cashReceived = tender;
  posRegisterState.changeGiven  = 0;

  posDOM.receiptItems.innerHTML = "";

  const itemCounts = {};
  itemIds.forEach(id => { itemCounts[id] = (itemCounts[id] || 0) + 1; });

  Object.entries(itemCounts).forEach(([id, qty]) => {
    const item   = MENU_ITEMS.find(m => m.id === id);
    const price  = MENU_ITEM_PRICES[id] || 0;
    const lineTotal = round2(price * qty);

    const li = document.createElement("li");
    li.className = "receipt-item-row";
    li.innerHTML = `
      <span class="receipt-item-name">${item ? item.name : id}</span>
      <span class="receipt-item-qty">x${qty} @ ${formatPeso(price)}</span>
      <span class="receipt-item-price">${formatPeso(lineTotal)}</span>
    `;
    posDOM.receiptItems.appendChild(li);
  });

  const totalStr  = formatPeso(total);
  const tenderStr = formatPeso(tender);

  posDOM.totalDue.textContent     = totalStr;
  posDOM.displayTotal.textContent = totalStr;
  posDOM.cashReceived.textContent = tenderStr;
  posDOM.changeSelected.textContent = formatPeso(0);
  posDOM.changeSelected.classList.remove("is-exact");

  const correctChange = round2(tender - total);
  if (posDOM.correctChange) {
    posDOM.correctChange.textContent = formatPeso(correctChange);
  }

  setPosPaymentMode();

  setPosRegisterFeedback(
    `Customer hands you ${tenderStr}. Count out the correct change using the buttons below.`,
    "neutral"
  );

  posDOM.modal.hidden = false;
  startCashierIdleTimer();
  posDOM.completeBtn.focus();
}

function setPosPaymentMode() {
  resetCashierIdleTimer();

  posDOM.cashPanel.hidden = false;
  posDOM.paymentTypeLabel.textContent = "Cash Payment";
  posDOM.completeBtn.textContent = "Complete Transaction";
}

function addDenomToChange(denomValue) {
  resetCashierIdleTimer();
  posRegisterState.changeGiven = round2(posRegisterState.changeGiven + denomValue);
  refreshChangeSumDisplay();
}

function refreshChangeSumDisplay() {
  const correctChange = round2(posRegisterState.cashReceived - posRegisterState.totalDue);
  const given         = posRegisterState.changeGiven;

  posDOM.changeSelected.textContent = formatPeso(given);

  if (round2(given) === round2(correctChange)) {
    posDOM.changeSelected.classList.add("is-exact");
    setPosRegisterFeedback("Change matches! Hit 'Complete Transaction' to finish.", "success");
  } else if (given > correctChange) {
    posDOM.changeSelected.classList.remove("is-exact");
    setPosRegisterFeedback(
      `Too much change! Correct change is ${formatPeso(correctChange)}. Clear and try again.`,
      "warn"
    );
  } else {
    posDOM.changeSelected.classList.remove("is-exact");
    const diff = round2(correctChange - given);
    setPosRegisterFeedback(`Still need ${formatPeso(diff)} more in change.`, "neutral");
  }
}

function clearChangeSelection() {
  resetCashierIdleTimer();
  posRegisterState.changeGiven = 0;
  posDOM.changeSelected.textContent = formatPeso(0);
  posDOM.changeSelected.classList.remove("is-exact");
  const correctChange = round2(posRegisterState.cashReceived - posRegisterState.totalDue);
  setPosRegisterFeedback(
    `Change cleared. You need to give back ${formatPeso(correctChange)}.`,
    "neutral"
  );
}

function setPosRegisterFeedback(message, tone) {
  posDOM.feedback.textContent = message;
  posDOM.feedback.classList.remove("pos-feedback-success", "pos-feedback-error", "pos-feedback-warn");

  if (tone === "success") {
    posDOM.feedback.classList.add("pos-feedback-success");
  } else if (tone === "error") {
    posDOM.feedback.classList.add("pos-feedback-error");
    void posDOM.feedback.offsetWidth;
  } else if (tone === "warn") {
    posDOM.feedback.classList.add("pos-feedback-warn");
  }
}

function attemptCompleteTransaction() {
  resetCashierIdleTimer();

  const correctChange = round2(posRegisterState.cashReceived - posRegisterState.totalDue);
  const given         = round2(posRegisterState.changeGiven);

  if (given === 0 && correctChange > 0) {
    setPosRegisterFeedback(
      `Please give the customer their change first! Total change due is ${formatPeso(correctChange)}.`,
      "warn"
    );
    playErrorBuzz();
    return;
  }

  const delta = round2(given - correctChange);

  if (delta === 0) {
    finishTransaction(true);
  } else if (delta < 0) {
    const shortBy = round2(-delta);
    setPosRegisterFeedback(
      `Short change! You're ${formatPeso(shortBy)} short. Total change due is ${formatPeso(correctChange)}.`,
      "error"
    );
    playErrorBuzz();
    penalizeHeart();
    spawnFloatingText(260, GAME_CONFIG.COUNTER_Y - 70, "Short Change! -1 ♥", GAME_CONFIG.COLORS.red);
    if (gameState.hearts <= 0) {
      closeCashierModal();
      endGame("Kitchen closed! Too many cashier errors.");
    }
  } else {
    const extraBy = round2(delta);
    setPosRegisterFeedback(
      `Too much change! You gave ${formatPeso(extraBy)} extra. Total change due is ${formatPeso(correctChange)}. Click Clear to try again.`,
      "warn"
    );
    playErrorBuzz();
    gameState.score = Math.max(0, gameState.score - 5);
    updateHudDisplays();
    spawnFloatingText(260, GAME_CONFIG.COUNTER_Y - 70, "Too Much Change! -5pts", GAME_CONFIG.COLORS.gold);
  }
}

function finishTransaction(isCorrect) {
  stopCashierIdleTimer();
  const saleAmount = posRegisterState.totalDue;
  const tip        = isCorrect ? TIP_POINTS : 0;

  if (tip > 0) {
    gameState.score += tip;
    updateHudDisplays();
  }

  registerDrawerTotal = round2(registerDrawerTotal + saleAmount);

  const confirmMsg = `Transaction complete! Change given: ${formatPeso(posRegisterState.changeGiven)} + ₱${tip} tip bonus`;

  setPosRegisterFeedback(confirmMsg, "success");
  playSuccessChime();
  spawnParticleBurst(260, GAME_CONFIG.COUNTER_Y - 40, "#15803D", 12);
  spawnFloatingText(260, GAME_CONFIG.COUNTER_Y - 70, `+₱${tip} Tip!`, GAME_CONFIG.COLORS.gold);

  setFeedback(
    `Perfect change! +${tip} tip pts — Drawer: ${formatPeso(registerDrawerTotal)}`,
    "success"
  );

  setTimeout(() => {
    closeCashierModal();

    if (gameState.hearts > 0 && gameState.gameActive) {
      generateOrder();
    }
  }, 1100);
}

function skipCashier() {
  stopCashierIdleTimer();
  closeCashierModal();
  setFeedback("Cashier skipped — no tip earned this round.", "warn");
  if (gameState.gameActive && gameState.hearts > 0) {
    generateOrder();
  }
}

function closeCashierModal() {
  stopCashierIdleTimer();
  posDOM.modal.hidden = true;
}

function bindCashierEvents() {
  document.querySelectorAll(".pos-bill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const denom = parseFloat(btn.dataset.denom);
      addDenomToChange(denom);
      playTone(520, 0.06, "sine", 0.08);
    });
  });

  document.querySelectorAll(".pos-coin-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const denom = parseFloat(btn.dataset.denom);
      addDenomToChange(denom);
      playTone(620, 0.05, "triangle", 0.07);
    });
  });

  posDOM.clearChangeBtn.addEventListener("click", () => {
    clearChangeSelection();
    playTone(300, 0.06, "triangle", 0.06);
  });

  posDOM.completeBtn.addEventListener("click", attemptCompleteTransaction);

  posDOM.skipBtn.addEventListener("click", skipCashier);
}

function initCashier() {
  bindCashierEvents();
  registerDrawerTotal = 0;
}

initCashier();

