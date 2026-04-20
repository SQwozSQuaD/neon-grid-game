// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // Расширяем на весь экран

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 400,
    height: 600,
    backgroundColor: '#0d0d0d',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let score = 0;
let combo = 0;
let timeLeft = 60;
let gameActive = true;
let spawnRate = 1000; // Начальная скорость (1 сек)
let tiles = [];
let scoreText, timerText;

function preload() {
    // В прототипе создаем графику программно (без внешних картинок)
}

function create() {
    const self = this;

    // Выводим имя пользователя из Telegram
    const username = tg.initDataUnsafe?.user?.first_name || "Игрок";
    this.add.text(20, 20, `Пилот: ${username}`, { fontSize: '18px', fill: '#0ff' });

    scoreText = this.add.text(20, 50, 'Очки: 0', { fontSize: '24px', fill: '#fff' });
    timerText = this.add.text(300, 20, '01:00', { fontSize: '24px', fill: '#f0f' });

    // Рисуем сетку 4х4
    const gridSize = 4;
    const cellSize = 80;
    const startX = 80;
    const startY = 200;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            let cell = this.add.rectangle(startX + i * cellSize, startY + j * cellSize, 70, 70, 0x1a1a1a)
                .setStrokeStyle(2, 0x333333)
                .setInteractive();
            
            cell.on('pointerdown', () => handleTap(cell, false));
            tiles.push(cell);
        }
    }

    // Таймер игры
    this.time.addEvent({
        delay: 1000,
        callback: () => {
            if (timeLeft > 0) {
                timeLeft--;
                timerText.setText(`00:${timeLeft < 10 ? '0' : ''}${timeLeft}`);
                
                // Каждые 15 секунд ускоряемся
                if (timeLeft % 15 === 0 && spawnRate > 400) {
                    spawnRate -= 200;
                }
            } else {
                endGame();
            }
        },
        callbackScope: this,
        loop: true
    });

    // Цикл появления вспышек
    const spawnLoop = () => {
        if (!gameActive) return;
        const randomTile = Phaser.Utils.Array.GetRandom(tiles);
        activateTile(randomTile);
        this.time.addEvent({ delay: spawnRate, callback: spawnLoop });
    };
    spawnLoop();
}

function activateTile(tile) {
    tile.setFillStyle(0x00ffff); // Неоновый голубой
    tile.isTarget = true;
    tile.postFX.addGlow(0x00ffff, 2, 0, false, 0.1, 10);

    // Плитка гаснет сама, если не успел нажать
    setTimeout(() => {
        if (tile.isTarget) {
            tile.setFillStyle(0x1a1a1a);
            tile.isTarget = false;
            tile.postFX.clear();
            combo = 0; // Сброс комбо
        }
    }, spawnRate * 0.9);
}

function handleTap(tile, isManual) {
    if (tile.isTarget) {
        score += 10 + (combo * 2);
        combo++;
        tile.setFillStyle(0xff00ff); // Вспышка при попадании
        setTimeout(() => {
            tile.setFillStyle(0x1a1a1a);
            tile.isTarget = false;
            tile.postFX.clear();
        }, 100);
        scoreText.setText(`Очки: ${score}`);
        tg.HapticFeedback.impactOccurred('light'); // Виброотклик в Telegram
    } else {
        combo = 0;
        tg.HapticFeedback.notificationOccurred('error');
    }
}

function update() {}

function endGame() {
    gameActive = false;
    alert(`Игра окончена! Твой счет: ${score}`);
    tg.close(); // Закрыть Web App или отправить счет боту
}
