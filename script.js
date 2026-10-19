const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const board = document.getElementById('board');
const turnText = document.getElementById('turnText');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const scoreD = document.getElementById('scoreD');
const nameX = document.getElementById('nameX');
const nameO = document.getElementById('nameO');
const difficultyBar = document.getElementById('difficultyBar');
const banner = document.getElementById('banner');
const bannerEmoji = document.getElementById('bannerEmoji');
const bannerTitle = document.getElementById('bannerTitle');
const bannerBtn = document.getElementById('bannerBtn');
const resetRoundBtn = document.getElementById('resetRound');
const resetScoreBtn = document.getElementById('resetScore');

let cells = ['', '', '', '', '', '', '', '', ''];
let current = 'X';
let mode = 'cpu';
let level = 'medium';
let over = false;
let busy = false;
let scores = { X: 0, O: 0, D: 0 };
let winCombo = [];

const HUMAN = 'X';
const CPU = 'O';

function buildBoard() {
  board.innerHTML = '';
  cells.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.dataset.index = i;
    btn.setAttribute('aria-label', `Cell ${i + 1}`);
    btn.addEventListener('click', () => handleClick(i));
    board.appendChild(btn);
  });
}

function render() {
  board.querySelectorAll('.cell').forEach((btn, i) => {
    btn.textContent = cells[i];
    btn.className =
      'cell' + (cells[i] ? ' ' + cells[i].toLowerCase() : '') + (winCombo.includes(i) ? ' win' : '');
    btn.disabled = over || cells[i] !== '';
  });
}

function setTurnLabel() {
  turnText.classList.remove('x-turn', 'o-turn');
  if (over) return;

  if (mode === 'cpu') {
    if (current === HUMAN) {
      turnText.textContent = "Your turn — you're X";
      turnText.classList.add('x-turn');
    } else {
      turnText.textContent = 'Computer is thinking…';
      turnText.classList.add('o-turn');
    }
  } else {
    turnText.textContent = `Player ${current}'s turn`;
    turnText.classList.add(current === 'X' ? 'x-turn' : 'o-turn');
  }
}

function handleClick(index) {
  if (over || busy || cells[index] !== '') return;
  if (mode === 'cpu' && current !== HUMAN) return;

  place(index, current);
  if (over) return;

  if (mode === 'cpu') {
    current = CPU;
    setTurnLabel();
    busy = true;
    setTimeout(() => {
      const move = pickCpuMove();
      place(move, CPU);
      busy = false;
      if (!over) {
        current = HUMAN;
        setTurnLabel();
      }
    }, 420);
  } else {
    current = current === 'X' ? 'O' : 'X';
    setTurnLabel();
  }
}

function place(index, player) {
  cells[index] = player;
  const btn = board.children[index];
  btn.textContent = player;
  btn.className = 'cell ' + player.toLowerCase() + ' pop';
  btn.disabled = true;

  const result = getResult(cells);
  if (result) {
    over = true;
    if (result === 'D') {
      scores.D++;
      highlight([]);
      setTimeout(() => showBanner('Draw', '🤝', 'It\'s a draw!'), 350);
    } else {
      scores[result]++;
      highlight(WINS.find((combo) => combo.every((i) => cells[i] === result)));
      const humanWin = mode === 'friend' ? null : result === HUMAN;
      const title = mode === 'friend'
        ? `Player ${result} wins!`
        : humanWin ? 'You win!' : 'Computer wins!';
      const emoji = mode === 'friend' ? '🎉' : humanWin ? '🎉' : '🤖';
      setTimeout(() => showBanner(title, emoji), 350);
    }
    updateScores();
    render();
    setTurnLabel();
    return;
  }

  if (cells.every((c) => c !== '')) return;
}

function highlight(combo) {
  winCombo = combo || [];
}

function showBanner(title, emoji) {
  bannerEmoji.textContent = emoji;
  bannerTitle.textContent = title;
  banner.hidden = false;
}

function updateScores() {
  scoreX.textContent = scores.X;
  scoreO.textContent = scores.O;
  scoreD.textContent = scores.D;
}

function getResult(state) {
  for (const combo of WINS) {
    const [a, b, c] = combo;
    if (state[a] && state[a] === state[b] && state[a] === state[c]) return state[a];
  }
  return state.every((c) => c !== '') ? 'D' : null;
}

function emptyIndices(state) {
  return state.map((v, i) => (v === '' ? i : null)).filter((v) => v !== null);
}

function pickCpuMove() {
  const empty = emptyIndices(cells);
  if (empty.length === 0) return -1;

  if (level === 'easy') {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (level === 'medium') {
    if (Math.random() < 0.4) {
      return empty[Math.floor(Math.random() * empty.length)];
    }
    return bestMove(cells, CPU, HUMAN);
  }

  return bestMove(cells, CPU, HUMAN);
}

function bestMove(state, player, opponent) {
  if (level !== 'hard') {
    const win = findWinning(state, player);
    if (win !== -1) return win;
    const block = findWinning(state, opponent);
    if (block !== -1) return block;
    if (state[4] === '') return 4;
    const corners = [0, 2, 6, 8].filter((i) => state[i] === '');
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    const empty = emptyIndices(state);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  return minimax(state, player, true).index;
}

function findWinning(state, player) {
  for (const combo of WINS) {
    const values = combo.map((i) => state[i]);
    const filled = values.filter((v) => v === player).length;
    const empty = values.filter((v) => v === '').length;
    if (filled === 2 && empty === 1) {
      return combo[values.indexOf('')];
    }
  }
  return -1;
}

function minimax(state, player, isMaxing) {
  const result = getResult(state);
  if (result === CPU) return { score: 10 };
  if (result === HUMAN) return { score: -10 };
  if (result === 'D') return { score: 0 };

  const empty = emptyIndices(state);

  if (player === CPU) {
    let best = { score: -Infinity };
    for (const i of empty) {
      const next = state.slice();
      next[i] = CPU;
      const outcome = minimax(next, HUMAN, false);
      if (outcome.score > best.score) best = { score: outcome.score, index: i };
    }
    return best;
  }

  let best = { score: Infinity };
  for (const i of empty) {
    const next = state.slice();
    next[i] = HUMAN;
    const outcome = minimax(next, CPU, true);
    if (outcome.score < best.score) best = { score: outcome.score, index: i };
  }
  return best;
}

function newRound() {
  cells = ['', '', '', '', '', '', '', '', ''];
  current = 'X';
  over = false;
  busy = false;
  winCombo = [];
  banner.hidden = true;
  buildBoard();
  render();
  setTurnLabel();
}

function resetScore() {
  scores = { X: 0, O: 0, D: 0 };
  updateScores();
  newRound();
}

document.querySelectorAll('.mode').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode').forEach((b) => b.classList.toggle('is-active', b === btn));
    mode = btn.dataset.mode;
    difficultyBar.style.display = mode === 'cpu' ? 'flex' : 'none';
    nameX.textContent = mode === 'cpu' ? 'You' : 'Player 1';
    nameO.textContent = mode === 'cpu' ? 'Computer' : 'Player 2';
    newRound();
  });
});

document.querySelectorAll('.diff').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff').forEach((b) => b.classList.toggle('is-active', b === btn));
    level = btn.dataset.level;
    newRound();
  });
});

resetRoundBtn.addEventListener('click', newRound);
resetScoreBtn.addEventListener('click', resetScore);
bannerBtn.addEventListener('click', newRound);

updateScores();
newRound();
