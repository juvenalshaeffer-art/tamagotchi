// Общее состояние котика
let catState = {
    name: 'КОТИК',
    hunger: 80,
    happiness: 80,
    health: 100,
    energy: 100
};

// Состояние на главном экране
let mainScreenState = {
    catX: 200,
    catY: 0,
    action: 'idle',  // idle, walking, sleeping, window
    targetX: 200,
    isSleeping: false,
    sleepTimer: 0,
    direction: 1
};

function loadState() {
    const saved = localStorage.getItem('catState');
    if (saved) {
        catState = JSON.parse(saved);
    }
    updateStats();
}

function saveState() {
    localStorage.setItem('catState', JSON.stringify(catState));
}

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

function toggleSleep() {
    mainScreenState.isSleeping = !mainScreenState.isSleeping;
    if (mainScreenState.isSleeping) {
        mainScreenState.action = 'sleeping';
        mainScreenState.targetX = 150;  // Диван
    } else {
        mainScreenState.action = 'idle';
    }
}

setInterval(() => {
    if (mainScreenState.action !== 'sleeping') {
        catState.hunger = Math.max(0, catState.hunger - 0.3);
        catState.happiness = Math.max(0, catState.happiness - 0.2);
        catState.energy = Math.min(100, catState.energy + 0.1);
        
        if (catState.hunger < 30 || catState.happiness < 30) {
            catState.health = Math.max(0, catState.health - 0.2);
        }
    } else {
        // Во сне восстанавливается энергия
        catState.energy = Math.min(100, catState.energy + 0.5);
        catState.hunger = Math.max(0, catState.hunger - 0.1);
    }
    
    saveState();
    updateStats();
}, 3000);

function initMainScreen() {
    loadState();
    const canvas = document.getElementById('mainCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const COLORS = {
        wall: '#F5E6D3',
        floor: '#8B4513',
        floorLight: '#A0522D',
        sofa: '#8B0000',
        sofaLight: '#A52A2A',
        window: '#87CEEB',
        windowFrame: '#FFFFFF',
        table: '#654321',
        cat1: '#C0C0C0',
        cat2: '#A0A0A0',
        cat3: '#808080',
        catLight: '#E0E0E0',
        catEye: '#FFD000',
        catNose: '#FF80A0'
    };
    
    let frame = 0;
    const groundY = canvas.height - 60;
    
    // Объекты комнаты
    const sofa = { x: 100, y: groundY - 50, width: 120, height: 50 };
    const window = { x: canvas.width - 150, y: groundY - 120, width: 100, height: 120 };
    const table = { x: canvas.width - 280, y: groundY - 40, width: 80, height: 40 };
    
    // Автоматическое движение котика
    let autoMoveTimer = 0;
    let currentTarget = 'none';
    
    function updateCatMovement() {
        if (mainScreenState.isSleeping) {
            mainScreenState.action = 'sleeping';
            mainScreenState.targetX = sofa.x + 30;
        }
        
        // Движение к цели
        const dx = mainScreenState.targetX - mainScreenState.catX;
        if (Math.abs(dx) > 5) {
            mainScreenState.catX += dx * 0.03;
            mainScreenState.direction = dx > 0 ? 1 : -1;
            mainScreenState.action = 'walking';
        } else {
            mainScreenState.action = 'idle';
        }
        
        // Автоматический выбор действия
        autoMoveTimer++;
        if (autoMoveTimer > 200 && !mainScreenState.isSleeping) {
            autoMoveTimer = 0;
            const rand = Math.random();
            
            if (rand < 0.3 && catState.energy < 50) {
                // Идти спать на диван
                currentTarget = 'sofa';
                mainScreenState.targetX = sofa.x + 30;
                mainScreenState.action = 'walking';
            } else if (rand < 0.6 && catState.happiness < 60) {
                // Идти к окну
                currentTarget = 'window';
                mainScreenState.targetX = window.x + 20;
                mainScreenState.action = 'walking';
            } else if (rand < 0.8) {
                // Идти к столу
                currentTarget = 'table';
                mainScreenState.targetX = table.x - 50;
                mainScreenState.action = 'walking';
            } else {
                // Просто ходить
                currentTarget = 'random';
                mainScreenState.targetX = 150 + Math.random() * (canvas.width - 300);
            }
        }
        
        // Проверка достижения цели
        if (Math.abs(dx) < 10) {
            if (currentTarget === 'sofa' && !mainScreenState.isSleeping) {
                mainScreenState.action = 'sleeping';
                catState.energy = Math.min(100, catState.energy + 5);
                catState.happiness = Math.min(100, catState.happiness + 3);
            } else if (currentTarget === 'window') {
                mainScreenState.action = 'window';
                catState.happiness = Math.min(100, catState.happiness + 5);
            }
        }
        
        // Y позиция (на диване или подоконнике)
        if (mainScreenState.action === 'sleeping') {
            mainScreenState.catY = sofa.y - 20;
        } else if (mainScreenState.action === 'window') {
            mainScreenState.catY = window.y + 80;
        } else {
            mainScreenState.catY = groundY - 50;
        }
    }
    
    function drawRoom() {
        // Стена
        const wallGradient = ctx.createLinearGradient(0, 0, 0, groundY);
        wallGradient.addColorStop(0, '#FFF8DC');
        wallGradient.addColorStop(1, COLORS.wall);
        ctx.fillStyle = wallGradient;
        ctx.fillRect(0, 0, canvas.width, groundY);
        
        // Пол
        ctx.fillStyle = COLORS.floor;
        ctx.fillRect(0, groundY, canvas.width, 60);
        ctx.fillStyle = COLORS.floorLight;
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.fillRect(i, groundY + 10, 35, 5);
        }
        
        // 🪟 Окно
        ctx.fillStyle = COLORS.windowFrame;
        ctx.fillRect(window.x, window.y, window.width, window.height);
        ctx.fillStyle = COLORS.window;
        ctx.fillRect(window.x + 8, window.y + 8, window.width - 16, window.height - 16);
        
        // Рама окна
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(window.x + window.width/2, window.y);
        ctx.lineTo(window.x + window.width/2, window.y + window.height);
        ctx.moveTo(window.x, window.y + window.height/2);
        ctx.lineTo(window.x + window.width, window.y + window.height/2);
        ctx.stroke();
        
        // Подоконник
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(window.x - 10, window.y + window.height - 10, window.width + 20, 15);
        
        // 🛋️ Диван
        ctx.fillStyle = COLORS.sofa;
        ctx.fillRect(sofa.x, sofa.y, sofa.width, sofa.height);
        ctx.fillStyle = COLORS.sofaLight;
        ctx.fillRect(sofa.x + 10, sofa.y + 10, sofa.width - 20, sofa.height - 20);
        
        // Подушки на диване
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(sofa.x + 20, sofa.y + 5, 35, 30);
        ctx.fillRect(sofa.x + 65, sofa.y + 5, 35, 30);
        
        // Ножки дивана
        ctx.fillStyle = '#4A0000';
        ctx.fillRect(sofa.x + 10, sofa.y + sofa.height - 10, 15, 10);
        ctx.fillRect(sofa.x + sofa.width - 25, sofa.y + sofa.height - 10, 15, 10);
        
        // 🪑 Столик
        ctx.fillStyle = COLORS.table;
        ctx.fillRect(table.x, table.y, table.width, table.height);
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(table.x + 5, table.y + 5, table.width - 10, 10);
        
        // Ножки стола
        ctx.fillStyle = '#4A3010';
        ctx.fillRect(table.x + 10, table.y + table.height, 10, 20);
        ctx.fillRect(table.x + table.width - 20, table.y + table.height, 10, 20);
        
        // Чашка на столе
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(table.x + 30, table.y - 15, 20, 18);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(table.x + 45, table.y - 12, 8, 12);
    }
    
    function drawCat(x, y, direction, action) {
        ctx.save();
        ctx.translate(x, y);
        
        if (direction === -1) {
            ctx.scale(-1, 1);
            ctx.translate(-70, 0);
        }
        
        if (action === 'sleeping') {
            // 😴 Спящий котик (свёрнулся клубком)
            ctx.fillStyle = COLORS.cat2;
            ctx.beginPath();
            ctx.ellipse(35, 35, 30, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = COLORS.cat1;
            ctx.beginPath();
            ctx.arc(55, 30, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Закрытые глаза
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(52, 28);
            ctx.lineTo(58, 28);
            ctx.moveTo(64, 28);
            ctx.lineTo(70, 28);
            ctx.stroke();
            
            // Zzz
            ctx.fillStyle = '#87CEEB';
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText('Z', 40 + Math.sin(frame * 0.1) * 3, 10 - Math.cos(frame * 0.1) * 5);
            ctx.fillText('z', 35 + Math.sin(frame * 0.15) * 3, 5 - Math.cos(frame * 0.15) * 5);
            
        } else if (action === 'window') {
            // 🪟 Котик на подоконнике смотрит в окно
            ctx.fillStyle = COLORS.cat2;
            ctx.fillRect(0, 20, 50, 30);
            ctx.fillStyle = COLORS.cat1;
            ctx.fillRect(0, 35, 50, 15);
            
            ctx.fillStyle = COLORS.cat3;
            ctx.fillRect(10, 22, 6, 24);
            ctx.fillRect(25, 22, 6, 24);
            ctx.fillRect(40, 22, 6, 24);
            
            ctx.fillStyle = COLORS.cat1;
            ctx.fillRect(40, 5, 32, 26);
            
            ctx.fillStyle = COLORS.cat2;
            ctx.fillRect(42, 0, 10, 10);
            ctx.fillRect(60, 0, 10, 10);
            ctx.fillStyle = COLORS.catLight;
            ctx.fillRect(44, 2, 6, 6);
            ctx.fillRect(62, 2, 6, 6);
            
            // Глаза смотрят в окно
            ctx.fillStyle = COLORS.catLight;
            ctx.fillRect(46, 10, 10, 10);
            ctx.fillRect(62, 10, 10, 10);
            ctx.fillStyle = COLORS.catEye;
            ctx.fillRect(50, 12, 6, 6);
            ctx.fillRect(66, 12, 6, 6);
            ctx.fillStyle = '#000';
            ctx.fillRect(52, 13, 3, 3);
            ctx.fillRect(68, 13, 3, 3);
            
            ctx.fillStyle = COLORS.catNose;
            ctx.fillRect(68, 20, 6, 5);
            
            // Хвост свисает с подоконника
            const tailWag = Math.sin(frame * 0.1) * 5;
            ctx.fillStyle = COLORS.cat2;
            ctx.fillRect(-20, 35 + tailWag, 25, 8);
            
        } else {
            // 🐱 Обычный котик
            const tailWag = action === 'walking' ? Math.sin(frame * 0.3) * 10 : Math.sin(frame * 0.2) * 8;
            ctx.fillStyle = COLORS.cat2;
            ctx.fillRect(-20, 30 + tailWag, 25, 8);
            ctx.fillRect(-30, 25 + tailWag, 15, 8);
            
            const legOffset = action === 'walking' ? Math.sin(frame * 0.4) * 10 : Math.sin(frame * 0.3) * 8;
            ctx.fillStyle = COLORS.cat2;
            ctx.fillRect(5 + legOffset, 48, 8, 12);
            ctx.fillRect(20 - legOffset, 48, 8, 12);
            
            ctx.fillStyle = COLORS.cat1;
            ctx.fillRect(0, 20, 50, 30);
            ctx.fillStyle = COLORS.cat2;
            ctx.fillRect(0, 35, 50, 15);
            
            ctx.fillStyle = COLORS.cat3;
            ctx.fillRect(10, 22, 6, 24);
            ctx.fillRect(25, 22, 6, 24);
            ctx.fillRect(40, 22, 6, 24);
            
            ctx.fillStyle = COLORS.cat2;
            ctx.fillRect(42 + legOffset, 48, 8, 12);
            ctx.fillRect(55 - legOffset, 48, 8, 12);
            
            ctx.fillStyle = COLORS.cat1;
            ctx.fillRect(40, 5, 32, 26);
            
            ctx.fillStyle = COLORS.cat2;
            ctx.fillRect(42, 0, 10, 10);
            ctx.fillRect(60, 0, 10, 10);
            ctx.fillStyle = COLORS.catLight;
            ctx.fillRect(44, 2, 6, 6);
            ctx.fillRect(62, 2, 6, 6);
            
            ctx.fillStyle = COLORS.catLight;
            ctx.fillRect(46, 10, 10, 10);
            ctx.fillRect(62, 10, 10, 10);
            ctx.fillStyle = COLORS.catEye;
            ctx.fillRect(48, 12, 6, 6);
            ctx.fillRect(64, 12, 6, 6);
            ctx.fillStyle = '#000';
            ctx.fillRect(50, 13, 3, 3);
            ctx.fillRect(66, 13, 3, 3);
            
            ctx.fillStyle = COLORS.catNose;
            ctx.fillRect(68, 20, 6, 5);
            
            ctx.fillStyle = COLORS.catLight;
            ctx.fillRect(35, 15, 12, 2);
            ctx.fillRect(35, 19, 12, 2);
            ctx.fillRect(35, 23, 12, 2);
            ctx.fillRect(74, 15, 12, 2);
            ctx.fillRect(74, 19, 12, 2);
            ctx.fillRect(74, 23, 12, 2);
        }
        
        ctx.restore();
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        updateCatMovement();
        drawRoom();
        drawCat(mainScreenState.catX, mainScreenState.catY, mainScreenState.direction, mainScreenState.action);
        
        frame++;
        requestAnimationFrame(animate);
    }
    
    animate();
}
