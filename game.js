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
    action: 'idle',
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
        mainScreenState.targetX = 180;
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
        cat1: '#C0C0C0',
        cat2: '#A0A0A0',
        cat3: '#808080',
        catLight: '#E0E0E0',
        catEye: '#FFD000',
        catNose: '#FF80A0'
    };
    
    let frame = 0;
    const groundY = canvas.height - 60;
    
    // Объекты комнаты (СТОЛИК УБРАН)
    const sofa = { 
        x: 80, 
        y: groundY - 70,
        width: 180,
        height: 70
    };
    
    const window = { 
        x: canvas.width - 180, 
        y: 80,
        width: 120,
        height: 140
    };
    
    let autoMoveTimer = 0;
    let currentTarget = 'none';
    
    function updateCatMovement() {
        if (mainScreenState.isSleeping) {
            mainScreenState.action = 'sleeping';
            mainScreenState.targetX = sofa.x + 50;
        }
        
        const dx = mainScreenState.targetX - mainScreenState.catX;
        if (Math.abs(dx) > 5) {
            mainScreenState.catX += dx * 0.03;
            mainScreenState.direction = dx > 0 ? 1 : -1;
            mainScreenState.action = 'walking';
        } else {
            mainScreenState.action = 'idle';
        }
        
        autoMoveTimer++;
        if (autoMoveTimer > 200 && !mainScreenState.isSleeping) {
            autoMoveTimer = 0;
            const rand = Math.random();
            
            if (rand < 0.3 && catState.energy < 50) {
                currentTarget = 'sofa';
                mainScreenState.targetX = sofa.x + 50;
                mainScreenState.action = 'walking';
            } else if (rand < 0.6 && catState.happiness < 60) {
                currentTarget = 'window';
                mainScreenState.targetX = window.x + 30;
                mainScreenState.action = 'walking';
            } else {
                currentTarget = 'random';
                mainScreenState.targetX = 150 + Math.random() * (canvas.width - 350);
            }
        }
        
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
        
        if (mainScreenState.action === 'sleeping') {
            mainScreenState.catY = sofa.y - 20;
        } else if (mainScreenState.action === 'window') {
            mainScreenState.catY = window.y + window.height - 20;
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
        ctx.fillRect(window.x + 10, window.y + 10, window.width - 20, window.height - 20);
        
        // Рама окна
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(window.x + window.width/2, window.y);
        ctx.lineTo(window.x + window.width/2, window.y + window.height);
        ctx.moveTo(window.x, window.y + window.height/2);
        ctx.lineTo(window.x + window.width, window.y + window.height/2);
        ctx.stroke();
        
        // Подоконник
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(window.x - 15, window.y + window.height - 8, window.width + 30, 15);
        
        // 🛋️ Диван
        ctx.fillStyle = COLORS.sofa;
        ctx.fillRect(sofa.x, sofa.y, sofa.width, sofa.height);
        ctx.fillStyle = COLORS.sofaLight;
        ctx.fillRect(sofa.x + 15, sofa.y + 15, sofa.width - 30, sofa.height - 25);
        
        // Подушки на диване
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(sofa.x + 25, sofa.y + 10, 45, 35);
        ctx.fillRect(sofa.x + 80, sofa.y + 10, 45, 35);
        
        // Спинка дивана
        ctx.fillStyle = '#A52A2A';
        ctx.fillRect(sofa.x, sofa.y - 20, sofa.width, 25);
        
        // Ножки дивана
        ctx.fillStyle = '#4A0000';
        ctx.fillRect(sofa.x + 15, sofa.y + sofa.height - 8, 20, 8);
        ctx.fillRect(sofa.x + sofa.width - 35, sofa.y + sofa.height - 8, 20, 8);
    }
    
    // ✅ ИСПРАВЛЕНО: Лапы двигаются только при ходьбе
    function drawCat(x, y, direction, action) {
        ctx.save();
        ctx.translate(x, y);
        
        if (direction === -1) {
            ctx.scale(-1, 1);
            ctx.translate(-70, 0);
        }
        
        if (action === 'sleeping') {
            // 😴 Спящий котик
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
            // 🪟 Котик на подоконнике (лапы не двигаются)
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
            
            // Хвост слегка двигается
            const tailWag = Math.sin(frame * 0.1) * 3;
            ctx.fillStyle = COLORS.cat2;
            ctx.fillRect(-20, 35 + tailWag, 25, 8);
            
        } else {
            // 🐱 Обычный котик
            // ✅ Хвост двигается всегда (даже когда стоит)
            const tailWag = Math.sin(frame * 0.2) * 8;
            ctx.fillStyle = COLORS.cat2;
            ctx.fillRect(-20, 30 + tailWag, 25, 8);
            ctx.fillRect(-30, 25 + tailWag, 15, 8);
            
            // ✅ Лапы двигаются ТОЛЬКО при ходьбе
            const legOffset = action === 'walking' ? Math.sin(frame * 0.4) * 10 : 0;
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
            
            // Передние лапы тоже только при ходьбе
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
