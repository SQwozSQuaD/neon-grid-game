const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000',
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

let score = 0;
let highScore = localStorage.getItem('neon_high_score') || 0;
let activeThemeColor = 0x00ffff; // Голубой по умолчанию
let isPlaying = false;
let scoreText, grid = [];

function preload() {}

function create() {
    const scene = this;
    
    // Главное меню
    const title = this.add.text(config.width/2, 100, 'NEON GRID', { fontSize: '42px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    const highText = this.add.text(config.width/2, 150, `РЕКОРД: ${highScore}`, { fontSize: '20px', fill: '#0ff' }).setOrigin(0.5);

    // --- МАГАЗИН ТЕМ (Telegram Stars) ---
    const themeBtn = this.add.text(config.width/2, 450, '🎨 КУПИТЬ РОЗОВУЮ ТЕМУ (50 ⭐)', { 
        fontSize: '18px', fill: '#000', backgroundColor: '#ff00ff', padding: 12 
    }).setOrigin(0.5).setInteractive();

    themeBtn.on('pointerdown', () => {
        tg.showConfirm("Хотите купить 'Neon Pink' за 50 Telegram Stars?", (ok) => {
            if(ok) {
                activeThemeColor = 0xff00ff;
                tg.showAlert("Тема успешно применена!");
                tg.HapticFeedback.notificationOccurred('success');
            }
        });
    });

    // --- ТАБЛИЦА РЕКОРДОВ ---
    const leaderBtn = this.add.text(config.width/2, 520, '🏆 ЛИДЕРЫ СРЕДИ ДРУЗЕЙ', { 
        fontSize: '18px', fill: '#fff', backgroundColor: '#333', padding: 10 
    }).setOrigin(0.5).setInteractive();

    leaderBtn.on('pointerdown', () => {
        const name = tg.initDataUnsafe?.user?.first_name || "Игрок";
        tg.showAlert(`ТОП НЕДЕЛИ:\n1. ${name} (ВЫ) — ${highScore}\n2. Max — 2450\n3. Света — 1800`);
    });

    // КНОПКА СТАРТА
    const startBtn = this.add.text(config.width/2, 300, 'ИГРАТЬ', { 
        fontSize: '32px', fill: '#fff', backgroundColor: '#0f0', padding: 20
    }).setOrigin(0.5).setInteractive();

    startBtn.on('pointerdown', () => {
        title.destroy();
        highText.destroy();
        themeBtn.destroy();
        leaderBtn.destroy();
        startBtn.destroy();
        startGame(scene);
    });
}

function startGame(scene) {
    isPlaying = true;
    score = 0;
    scoreText = scene.add.text(20, 20, 'Очки: 0', { fontSize: '24px', fill: '#fff' });

    // Создаем сетку 4x4
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const tile = scene.add.rectangle(70 + i*85, 180 + j*85, 75, 75, 0x1a1a1a).setInteractive();
            tile.setStrokeStyle(2, 0x333333);
            tile.on('pointerdown', () => handleTap(tile));
            grid.push(tile);
        }
    }
    spawnTile(scene);
}

function spawnTile(scene) {
    if(!isPlaying) return;
    const target = Phaser.Utils.Array.GetRandom(grid);
    target.setFillStyle(activeThemeColor);
    target.isTarget = true;
    
    scene.time.delayedCall(800, () => {
        target.setFillStyle(0x1a1a1a);
        target.isTarget = false;
        if(isPlaying) spawnTile(scene);
    });
}

function handleTap(tile) {
    if(tile.isTarget) {
        score += 100;
        scoreText.setText(`Очки: ${score}`);
        tile.setFillStyle(0xffffff);
        tg.HapticFeedback.impactOccurred('medium');
        if(score > highScore) {
            highScore = score;
            localStorage.setItem('neon_high_score', highScore);
        }
    }
}

function update() {}
