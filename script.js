// Глобальные переменные
let players = [];
let rounds = [];
let gameName = '';
let gameDate = '';
let pendingRoundScores = null;

// Элементы DOM
const gameSetup = document.getElementById('game-setup');
const playersSection = document.getElementById('players-section');
const roundSection = document.getElementById('round-section');
const resultsSection = document.getElementById('results-section');
const saveSection = document.getElementById('save-section');
const savedGamesSection = document.getElementById('saved-games-section');

const gameNameInput = document.getElementById('game-name');
const gameDateInput = document.getElementById('game-date');
const createGameBtn = document.getElementById('create-game-btn');

const playerNameInput = document.getElementById('player-name');
const addPlayerBtn = document.getElementById('add-player-btn');
const playersList = document.getElementById('players-list');

const roundInputs = document.getElementById('round-inputs');
const addRoundBtn = document.getElementById('add-round-btn');

const resultsTable = document.getElementById('results-table');
const resultsBody = document.getElementById('results-body');
const resultsGameTitle = document.getElementById('results-game-title');

const saveGameBtn = document.getElementById('save-game-btn');
const savedGamesList = document.getElementById('saved-games-list');
const orderModal = document.getElementById('order-modal');
const orderInputs = document.getElementById('order-inputs');
const confirmOrderBtn = document.getElementById('confirm-order-btn');
const cancelOrderBtn = document.getElementById('cancel-order-btn');

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadSavedGames();
});

// Создание игры
createGameBtn.addEventListener('click', () => {
    gameName = gameNameInput.value.trim();
    gameDate = gameDateInput.value;
    if (!gameName || !gameDate) {
        alert('Заполните название и дату игры');
        return;
    }
    gameSetup.classList.add('hidden');
    playersSection.classList.remove('hidden');
    savedGamesSection.classList.add('hidden');
});

// Добавление игрока
addPlayerBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert('Введите имя игрока');
        return;
    }
    if (players.some(p => p.name === name)) {
        alert('Игрок с таким именем уже добавлен');
        return;
    }
    players.push({ name, total: 0 });
    playerNameInput.value = '';
    updatePlayersList();
    if (players.length >= 3) {
        roundSection.classList.remove('hidden');
        resultsSection.classList.remove('hidden');
        saveSection.classList.remove('hidden');
        updateRoundInputs();
        updateTable();
    }
});

// Обновление списка игроков
function updatePlayersList() {
    playersList.innerHTML = '';
    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${player.name} <button data-index="${index}" data-dir="up">↑</button><button data-index="${index}" data-dir="down">↓</button>`;
        playersList.appendChild(li);
    });
}

// Перемещение игрока
function movePlayer(index, direction) {
    if (direction === 'up' && index > 0) {
        [players[index], players[index - 1]] = [players[index - 1], players[index]];
    } else if (direction === 'down' && index < players.length - 1) {
        [players[index], players[index + 1]] = [players[index + 1], players[index]];
    }
    updatePlayersList();
    if (players.length >= 3) {
        updateRoundInputs();
        updateTable();
    }
}

// Обработчик кликов на кнопки перемещения
playersList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const index = parseInt(e.target.dataset.index);
        const dir = e.target.dataset.dir;
        movePlayer(index, dir);
    }
});

// Обновление полей для партии
function updateRoundInputs() {
    roundInputs.innerHTML = '';
    players.forEach(player => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label>${player.name}</label>
            <input type="number" min="0" max="16" value="0" data-player="${player.name}">
        `;
        roundInputs.appendChild(div);
    });
    // Добавить listeners для динамического max
    const inputs = roundInputs.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            updateMax(inputs);
        });
    });
    updateMax(inputs); // Инициализировать
}

function updateMax(inputs) {
    const totalUsed = Array.from(inputs).reduce((sum, inp) => sum + (parseInt(inp.value) || 0), 0);
    const remaining = 16 - totalUsed;
    inputs.forEach(inp => {
        const current = parseInt(inp.value) || 0;
        inp.max = current + remaining;
    });
}

// Добавление партии
addRoundBtn.addEventListener('click', () => {
    if (players.length < 3) {
        alert('Минимум 3 игрока для добавления партии');
        return;
    }
    const round = {};
    let hasInput = false;
    players.forEach(player => {
        const input = roundInputs.querySelector(`input[data-player="${player.name}"]`);
        const score = parseInt(input.value) || 0;
        round[player.name] = score;
        if (score > 0) hasInput = true;
    });
    if (!hasInput) {
        alert('Введите очки хотя бы для одного игрока');
        return;
    }
    pendingRoundScores = round;
    openOrderModal();
});

// Окно выбора очередности ударов
function openOrderModal() {
    orderInputs.innerHTML = '';
    players.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = 'order-row';

        const label = document.createElement('label');
        label.textContent = player.name;
        label.setAttribute('for', `order-${index}`);

        const select = document.createElement('select');
        select.id = `order-${index}`;
        select.dataset.player = player.name;
        for (let i = 1; i <= players.length; i++) {
            const option = document.createElement('option');
            option.value = i.toString();
            option.textContent = i.toString();
            if (i === index + 1) {
                option.selected = true;
            }
            select.appendChild(option);
        }

        row.appendChild(label);
        row.appendChild(select);
        orderInputs.appendChild(row);
    });
    orderModal.classList.remove('hidden');
}

function closeOrderModal() {
    orderModal.classList.add('hidden');
    orderInputs.innerHTML = '';
}

confirmOrderBtn.addEventListener('click', () => {
    if (!pendingRoundScores) {
        closeOrderModal();
        return;
    }

    const selectedOrders = Array.from(orderInputs.querySelectorAll('select')).map(select => ({
        player: select.dataset.player,
        position: parseInt(select.value)
    }));
    const positions = selectedOrders.map(item => item.position);
    const uniquePositions = new Set(positions);

    if (uniquePositions.size !== players.length) {
        alert('У каждого игрока должен быть свой номер очереди');
        return;
    }

    const order = selectedOrders
        .sort((a, b) => a.position - b.position)
        .map(item => item.player);

    rounds.push({
        scores: pendingRoundScores,
        order
    });

    pendingRoundScores = null;
    closeOrderModal();
    updateTable();
    // Сбросить поля
    roundInputs.querySelectorAll('input').forEach(input => input.value = '0');
    updateRoundInputs(); // Обновить max после сброса
});

cancelOrderBtn.addEventListener('click', () => {
    pendingRoundScores = null;
    closeOrderModal();
});

orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) {
        pendingRoundScores = null;
        closeOrderModal();
    }
});

function getRoundScores(round) {
    return round.scores || round;
}

function getRoundOrder(round) {
    const currentPlayerNames = players.map(player => player.name);
    const savedOrder = Array.isArray(round.order) ? round.order : currentPlayerNames;
    const knownOrder = savedOrder.filter(name => currentPlayerNames.includes(name));
    const missedPlayers = currentPlayerNames.filter(name => !knownOrder.includes(name));
    return [...knownOrder, ...missedPlayers];
}

function formatTotal(total) {
    return total > 0 ? `+${total}` : total.toString();
}

function updateResultsTitle() {
    resultsGameTitle.textContent = gameName;
}

// Обновление таблицы результатов
function updateTable() {
    updateResultsTitle();

    // Рассчитать итоги по раундам
    let roundTotals = [];
    rounds.forEach(round => {
        let roundTotal = {};
        const roundScores = getRoundScores(round);
        const roundOrder = getRoundOrder(round);
        roundOrder.forEach((playerName, i) => {
            const n = roundOrder.length;
            const nextIndex = (i + 1) % n;
            const scored = roundScores[playerName] || 0;
            const nextScored = roundScores[roundOrder[nextIndex]] || 0;
            roundTotal[playerName] = scored - nextScored;
        });
        roundTotals.push(roundTotal);
    });

    // Обновить итоги игроков
    players.forEach(player => {
        player.total = roundTotals.reduce((sum, rt) => sum + (rt[player.name] || 0), 0);
    });

    // Заголовки: первая строка показывает общий итог, вторая - названия колонок.
    const tableHead = resultsTable.querySelector('thead');
    const totalsHtml = players
        .map(player => {
            const total = formatTotal(player.total);
            const totalClass = player.total > 0 ? 'positive' : player.total < 0 ? 'negative' : '';
            return `<th class="total-cell ${totalClass}">${total}</th>`;
        })
        .join('');
    const namesHtml = players
        .map(player => `<th>${player.name}</th>`)
        .join('');
    tableHead.innerHTML = `
        <tr class="summary-row">
            <th>Итог</th>
            ${totalsHtml}
        </tr>
        <tr id="header-row">
            <th>Партия</th>
            ${namesHtml}
        </tr>
    `;

    // Тело таблицы
    resultsBody.innerHTML = '';
    rounds.forEach((round, index) => {
        const roundScores = getRoundScores(round);
        const roundOrder = getRoundOrder(round);
        const tr = document.createElement('tr');
        let html = `<td>${index + 1}</td>`;
        players.forEach(player => {
            const roundScore = roundScores[player.name] || 0;
            const playerOrder = roundOrder.indexOf(player.name) + 1;
            html += `
                <td class="score-cell">
                    <span class="score-value">${roundScore}</span>
                    <span class="order-badge">${playerOrder}</span>
                </td>
            `;
        });
        tr.innerHTML = html;
        resultsBody.appendChild(tr);
    });
}

// Сохранение игры
saveGameBtn.addEventListener('click', () => {
    if (!gameName || players.length === 0) {
        alert('Создайте игру и добавьте игроков');
        return;
    }
    const game = {
        name: gameName,
        date: gameDate,
        players: players.map(p => ({ name: p.name })),
        rounds: rounds
    };
    const savedGames = JSON.parse(localStorage.getItem('kolhoz_games') || '[]');
    savedGames.push(game);
    localStorage.setItem('kolhoz_games', JSON.stringify(savedGames));
    alert('Игра сохранена');
    loadSavedGames();
});

// Загрузка списка сохранённых игр
function loadSavedGames() {
    const savedGames = JSON.parse(localStorage.getItem('kolhoz_games') || '[]');
    savedGamesList.innerHTML = '';
    savedGames.forEach((game, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${game.name} (${game.date})</span>
            <div class="saved-game-actions">
                <button data-index="${index}" data-action="open">Открыть</button>
                <button data-index="${index}" data-action="delete" class="delete-game-btn" type="button">Удалить</button>
            </div>
        `;
        savedGamesList.appendChild(li);
    });
}

// Открытие игры
savedGamesList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const index = e.target.dataset.index;
        const action = e.target.dataset.action;
        const savedGames = JSON.parse(localStorage.getItem('kolhoz_games') || '[]');

        if (action === 'delete') {
            const game = savedGames[index];
            if (!game) return;
            const shouldDelete = confirm(`Удалить сохранённую игру "${game.name}"?`);
            if (!shouldDelete) return;
            savedGames.splice(index, 1);
            localStorage.setItem('kolhoz_games', JSON.stringify(savedGames));
            loadSavedGames();
            return;
        }

        const game = savedGames[index];
        if (!game) return;
        loadGame(game);
    }
});

// Загрузка игры
function loadGame(game) {
    gameName = game.name;
    gameDate = game.date;
    players = game.players.map(p => ({ name: p.name, total: 0 }));
    rounds = game.rounds;
    gameSetup.classList.add('hidden');
    playersSection.classList.remove('hidden');
    roundSection.classList.remove('hidden');
    resultsSection.classList.remove('hidden');
    saveSection.classList.remove('hidden');
    savedGamesSection.classList.add('hidden');
    updatePlayersList();
    updateRoundInputs();
    updateTable();
}
