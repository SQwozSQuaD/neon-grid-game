const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#050505',
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

let score = 0, highScore = localStorage.getItem('neon_high_score') || 0;
let lives = 3, combo = 0, isPlaying = false;
let spawnRate = 1000, activeThemeColor = 0x00ffff;
let grid = [], scoreText, livesText, comboText;

function preload() {
    // Используем стандартные белые круги для частиц, окрасим их кодом
}

function create() {
    const scene = this;
    showMainMenu(scene);
}

function showMainMenu(scene) {
    scene.children.removeAll(); // Очистка экрана
    
    const center = config.width / 2;
    scene.add.text(center, 120, 'NEON GRID', { fontSize: '48px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    scene.add.text(center, 180, `BEST: ${highScore}`, { fontSize: '22px', fill: '#0ff' }).setOrigin(0.5);

    // Кнопка СТАРТ с эффектом пульсации
    const startBtn = scene.add.text(center, 350, 'START SYNC', { 
        fontSize: '32px', fill: '#000', backgroundColor: '#0f0', padding: {x:40, y:20} 
    }).setOrigin(0.5).setInteractive();
    
    scene.tweens.add({ targets: startBtn, scale: 1.1, duration: 800, yoyo: true, loop: -1 });

    startBtn.on('pointerdown', () => {
        scene.children.removeAll();
        startGame(scene);
    });

    // Магазин скинов
    const shopBtn = scene.add.text(center, 500, '🛒 SKINS (STARS)', { fontSize: '18px', fill: '#ffd700' }).setOrigin(0.5).setInteractive();
    shopBtn.on('pointerdown', () => {
        tg.showConfirm("Buy VIP Gold Theme for 100 Stars?", (ok) => {
            if(ok) { activeThemeColor = 0xffd700; tg.HapticFeedback.notificationOccurred('success'); }
        });
    });
}

function startGame(scene) {
    isPlaying = true;
    score = 0; lives = 3; combo = 0; spawnRate = 1000;
    
    scoreText = scene.add.text(20, 20, 'SCORE: 0', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' });
    livesText = scene.add.text(config.width - 20, 20, '❤️❤️❤️', { fontSize: '24px' }).setOrigin(1, 0);
    comboText = scene.add.text(config.width / 2, 80, '', { fontSize: '32px', fill: '#fbff00', fontStyle: 'bold' }).setOrigin(0.5);

    const startX = (config.width - (3 * 90)) / 2;
    grid = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const tile = scene.add.rectangle(startX + i*90, 250 + j*90, 80, 80, 0x111111).setInteractive();
            tile.setStrokeStyle(2, 0x333333);
            tile.on('pointerdown', () => handleTap(scene, tile));
            grid.push(tile);
        }
    }
    spawnLoop(scene);
}

function spawnLoop(scene) {
    if (!isPlaying) return;
    
    const target = Phaser.Utils.Array.GetRandom(grid);
    if (target.isTarget) return spawnLoop(scene);

    target.setFillStyle(activeThemeColor);
    target.isTarget = true;
    
    // Плавное появление (Tween)
    scene.tweens.add({ targets: target, alpha: { from: 0.5, to: 1 }, duration: 100 });

    scene.time.delayedCall(spawnRate, () => {
        if (target.isTarget && isPlaying) {
            target.setFillStyle(0x111111);
            target.isTarget = false;
            loseLife(scene);
        }
        if (isPlaying) spawnLoop(scene);
    });

    // Постепенное ускорение каждые 5 очков
    if (score > 0 && score % 500 === 0 && spawnRate > 350) spawnRate -= 20;
}

function handleTap(scene, tile) {
    if (tile.isTarget) {
        // ПОПАЛ
        combo++;
        score += 100 * (combo > 5 ? 2 : 1);
        scoreText.setText(`SCORE: ${score}`);
        if(combo > 2) comboText.setText(`${combo}x COMBO!`);
        
        tile.isTarget = false;
        tile.setFillStyle(0xffffff);
        
        // Эффект частиц (имитация)
        createParticles(scene, tile.x, tile.y);
        
        scene.time.delayedCall(100, () => tile.setFillStyle(0x111111));
        tg.HapticFeedback.impactOccurred('light');
    } else {
        // ПРОМАХНУЛСЯ
        loseLife(scene);
    }
}

function createParticles(scene, x, y) {
    for(let i=0; i<6; i++) {
        const p = scene.add.circle(x, y, 4, activeThemeColor);
        scene.tweens.add({
            targets: p,
            x: x + Phaser.Math.Between(-50, 50),
            y: y + Phaser.Math.Between(-50, 50),
            alpha: 0,
            duration: 400,
            onComplete: () => p.destroy()
        });
    }
}

function loseLife(scene) {
    lives--;
    combo = 0;
    comboText.setText('');
    livesText.setText('❤️'.repeat(lives) + '🖤'.repeat(3 - lives));
    scene.cameras.main.shake(150, 0.01);
    tg.HapticFeedback.notificationOccurred('error');

    if (lives <= 0) gameOver(scene);
}

function gameOver(scene) {
    isPlaying = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neon_high_score', highScore);
    }

    const center = config.width / 2;
    scene.add.rectangle(center, config.height/2, config.width, config.height, 0x000, 0.8);
    scene.add.text(center, 250, 'GAME OVER', { fontSize: '50px', fill: '#f00', fontStyle: 'bold' }).setOrigin(0.5);
    
    const shareBtn = scene.add.text(center, 400, 'SHARE RESULT', { 
        fontSize: '20px', fill: '#fff', backgroundColor: '#0088cc', padding: 15 
    }).setOrigin(0.5).setInteractive();

    shareBtn.on('pointerdown', () => {
        tg.shareToStory("https://t.me/NeonGS_bot/game", { text: `Я набрал ${score} в Neon Grid! Попробуй побить мой рекорд!` });
    });

    const restartBtn = scene.add.text(center, 480, 'TRY AGAIN', { fontSize: '18px', fill: '#aaa' }).setOrigin(0.5).setInteractive();
    restartBtn.on('pointerdown', () => scene.scene.restart());
}

function update() {}
