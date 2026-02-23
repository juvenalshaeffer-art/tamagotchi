// Общее состояние котика
let catState = {
    name: 'КОТИК',
    hunger: 80,
    happiness: 80,
    health: 100,
    energy: 100
};

// Загрузка состояния из localStorage
function loadState() {
    const saved = localStorage.getItem('catState');
    if (saved) {
        catState = JSON.parse(saved);
    }
    updateStats();
}

// Сохранение состояния
function saveState() {
    localStorage.setItem('catState', JSON.stringify(catState));
}

// Обновление статистики на экране
function updateStats() {
    const hungerBar = document.getElementById('hungerBar');
    const happyBar = document.getElementById('happyBar');
    const healthBar = document.getElementById('healthBar');
    const energyBar = document.getElementById('energyBar');
    const nameDisplay = document.getElementById('catNameDisplay');
    
    if (hungerBar) hungerBar.style.width = catState.hunger + '%';
    if (happyBar) happyBar.style.width = catState.happiness + '%';
    if (healthBar) healthBar.style.width = catState.health + '%';
    if (energyBar) energyBar.style.width = catState.energy + '%';
    if (nameDisplay) nameDisplay.textContent = catState.name;
}

// Изменение имени
function changeName() {
    const newName = prompt('ВВЕДИ ИМЯ КОТИКА:', catState.name);
    if (newName && newName.trim()) {
        catState.name = newName.toUpperCase().trim();
        saveState();
        updateStats();
    }
}

// Ухудшение состояния со временем
setInterval(() => {
    catState.hunger = Math.max(0, catState.hunger - 0.5);
    catState.happiness = Math.max(0, catState.happiness - 0.3);
    catState.energy = Math.min(100, catState.energy + 0.2);
    
    if (catState.hunger < 30 || catState.happiness < 30) {
        catState.health = Math.max(0, catState.health - 0.3);
    }
    
    saveState();
    updateStats();
}, 3000);

// Инициализация главного экрана
function initMainScreen() {
    loadState();
    const canvas = document.getElementById('mainCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const COLORS = {
        sky1: '#87CEEB', sky2: '#98D8E8',
        ground: '#8B4513', grass: '#228B22',
        cat1: '#C0C0C0', cat2: '#A0A0A0', cat3: '#808080',
        catLight: '#E0E0E0', catEye: '#FFD000', catNose: '#FF80A0',
        tree: '#008000', trunk: '#603000', cloud: '#FFFFFF'
    };
    
    let frame = 0;
    const groundY = canvas.height - 60;
    
    // Отрисовка котика
    function drawCat(x, y) {
        ctx.save();
        ctx.translate(x, y);
        
        // Тело
        ctx.fillStyle = COLORS.cat1;
        ctx.fillRect(0, 20, 50, 30);
        ctx.fillStyle = COLORS.cat2;
        ctx.fillRect(0, 35, 50, 15);
        
        // Полоски
        ctx.fillStyle = COLORS.cat3;
        ctx.fillRect(10, 22, 6, 24);
        ctx.fillRect(25, 22, 6, 24);
        ctx.fillRect(40, 22, 6, 24);
        
        // Голова
        ctx.fillStyle = COLORS.cat1;
        ctx.fillRect(40, 5, 32, 26);
        
        // Уши
        ctx.fillStyle = COLORS.cat2;
        ctx.fillRect(42, 0, 10, 10);
        ctx.fillRect(60, 0, 10, 10);
        ctx.fillStyle = COLORS.catLight;
        ctx.fillRect(44, 2, 6, 6);
        ctx.fillRect(62, 2, 6, 6);
        
        // Глаза
        ctx.fillStyle = COLORS.catLight;
        ctx.fillRect(46, 10, 10, 10);
        ctx.fillRect(62, 10, 10, 10);
        ctx.fillStyle = COLORS.catEye;
        ctx.fillRect(48, 12, 6, 6);
        ctx.fillRect(64, 12, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(50, 13, 3, 3);
        ctx.fillRect(66, 13, 3, 3);
        
        // Нос
        ctx.fillStyle = COLORS.catNose;
        ctx.fillRect(68, 20, 6, 5);
        
        // Усы
        ctx.fillStyle = COLORS.catLight;
        ctx.fillRect(35, 15, 12, 2);
        ctx.fillRect(35, 19, 12, 2);
        ctx.fillRect(35, 23, 12, 2);
        ctx.fillRect(74, 15, 12, 2);
        ctx.fillRect(74, 19, 12, 2);
        ctx.fillRect(74, 23, 12, 2);
        
        // Хвост
        const tailWag = Math.sin(frame * 0.2) * 8;
        ctx.fillStyle = COLORS.cat2;
        ctx.fillRect(-20, 30 + tailWag, 25, 8);
        ctx.fillRect(-30, 25 + tailWag, 15, 8);
        
        // Лапы
        const legOffset = Math.sin(frame * 0.3) * 8;
        ctx.fillStyle = COLORS.cat2;
        ctx.fillRect(5 + legOffset, 48, 8, 12);
        ctx.fillRect(20 - legOffset, 48, 8, 12);
        ctx.fillRect(42 + legOffset, 48, 8, 12);
        ctx.fillRect(55 - legOffset, 48, 8, 12);
        
        ctx.restore();
    }
    
    // Фон
    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, groundY);
        gradient.addColorStop(0, COLORS.sky1);
        gradient.addColorStop(1, COLORS.sky2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, groundY);
        
        // Облака
        ctx.fillStyle = COLORS.cloud;
        for (let i = 0; i < 4; i++) {
            const x = ((frame * 0.3) + i * 180) % (canvas.width + 120) - 60;
            const y = 30 + (i % 3) * 25;
            ctx.fillRect(x, y, 70, 20);
            ctx.fillRect(x + 12, y - 12, 45, 15);
        }
        
        // Деревья
        for (let i = 0; i < 5; i++) {
            const x = (i * 120 + 40) % canvas.width;
            ctx.fillStyle = COLORS.trunk;
            ctx.fillRect(x, groundY - 70, 10, 70);
            ctx.fillStyle = COLORS.tree;
            ctx.fillRect(x - 20, groundY - 100, 40, 40);
            ctx.fillStyle = '#00A000';
            ctx.fillRect(x - 16, groundY - 92, 32, 32);
        }
        
        // Земля
        ctx.fillStyle = COLORS.ground;
        ctx.fillRect(0, groundY, canvas.width, 60);
        ctx.fillStyle = COLORS.grass;
        ctx.fillRect(0, groundY, canvas.width, 12);
    }
    
    // Анимация
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawCat(120, groundY - 50);
        frame++;
        requestAnimationFrame(animate);
    }
    
    animate();
}