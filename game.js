// 🐱 КОТИК ТАМАГОЧИ - game.js (минимальная версия)

let catState = {
    name: 'КОТИК',
    hunger: 80,
    happiness: 80,
    health: 100,
    energy: 100
};

let mainScreenState = {
    catX: 200, catY: 0, action: 'idle', targetX: 200,
    isSleeping: false, direction: 1,
    isOnSofa: false, isOnWindow: false
};

function loadState() {
    try {
        if (window.Telegram?.WebApp?.CloudStorage) {
            window.Telegram.WebApp.CloudStorage.getItem('catState', (err, val) => {
                if (!err && val) catState = JSON.parse(val);
                else {
                    const s = localStorage.getItem('catState');
                    if (s) catState = JSON.parse(s);
                }
                updateStats();
            });
        } else {
            const s = localStorage.getItem('catState');
            if (s) catState = JSON.parse(s);
            updateStats();
        }
    } catch(e) { console.error('Load error:', e); updateStats(); }
}

function saveState() {
    try {
        localStorage.setItem('catState', JSON.stringify(catState));
        if (window.Telegram?.WebApp?.CloudStorage) {
            window.Telegram.WebApp.CloudStorage.setItem('catState', JSON.stringify(catState), (err) => {
                if (err) console.error('Cloud save error:', err);
            });
        }
    } catch(e) { console.error('Save error:', e); }
}

function updateStats() {
    try {
        const map = [
            ['hungerBar', catState.hunger],
            ['happyBar', catState.happiness],
            ['healthBar', catState.health],
            ['energyBar', catState.energy],
            ['catNameDisplay', catState.name]
        ];
        map.forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) {
                if (typeof val === 'number') el.style.width = val + '%';
                else el.textContent = val;
            }
        });
    } catch(e) { console.error('Stats error:', e); }
}

function toggleSleep() {
    mainScreenState.isSleeping = !mainScreenState.isSleeping;
    mainScreenState.action = mainScreenState.isSleeping ? 'sleeping' : 'idle';
    mainScreenState.targetX = mainScreenState.isSleeping ? 180 : 200;
}

// Ухудшение состояния
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

// Инициализация главного экрана
function initMainScreen() {
    loadState();
    const canvas = document.getElementById('mainCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const COLORS = {
        wall: '#F5E6D3', floor: '#8B4513', floorLight: '#A0522D',
        sofa: '#8B0000', sofaLight: '#A52A2A', sofaSeat: '#DC143C',
        window: '#87CEEB', windowFrame: '#FFFFFF',
        cat1: '#C0C0C0', cat2: '#A0A0A0', cat3: '#808080',
        catLight: '#E0E0E0', catEye: '#FFD000', catNose: '#FF80A0'
    };
    
    let frame = 0;
    const groundY = canvas.height - 60;
    
    // ✅ ПРАВИЛЬНЫЕ КООРДИНАТЫ
    const sofa = { x: 100, y: groundY - 55, width: 160, height: 55, seatY: groundY - 55 };
    const window = { x: canvas.width - 200, y: 60, width: 140, height: 160, sillY: groundY - 100 };
    
    let autoMoveTimer = 0, currentTarget = 'none';
    
    function updateCatMovement() {
        if (mainScreenState.isSleeping) {
            mainScreenState.action = 'sleeping';
            mainScreenState.targetX = sofa.x + 50;
            mainScreenState.isOnSofa = true;
        }
        const dx = mainScreenState.targetX - mainScreenState.catX;
        if (Math.abs(dx) > 5) {
            mainScreenState.catX += dx * 0.03;
            mainScreenState.direction = dx > 0 ? 1 : -1;
            mainScreenState.action = 'walking';
            mainScreenState.isOnSofa = false;
            mainScreenState.isOnWindow = false;
        } else if (mainScreenState.action !== 'sleeping' && mainScreenState.action !== 'window') {
            mainScreenState.action = 'idle';
        }
        autoMoveTimer++;
        if (autoMoveTimer > 200 && !mainScreenState.isSleeping) {
            autoMoveTimer = 0;
            const rand = Math.random();
            if (rand < 0.3 && catState.energy < 50) {
                currentTarget = 'sofa'; mainScreenState.targetX = sofa.x + 50; mainScreenState.action = 'walking';
            } else if (rand < 0.6 && catState.happiness < 60) {
                currentTarget = 'window'; mainScreenState.targetX = window.x + 40; mainScreenState.action = 'walking';
            } else {
                currentTarget = 'random'; mainScreenState.targetX = 150 + Math.random() * (canvas.width - 400);
            }
        }
        if (Math.abs(dx) < 10) {
            if (currentTarget === 'sofa') { mainScreenState.isOnSofa = true; mainScreenState.isOnWindow = false; if (!mainScreenState.isSleeping) mainScreenState.action = 'idle'; }
            else if (currentTarget === 'window') { mainScreenState.isOnWindow = true; mainScreenState.isOnSofa = false; mainScreenState.action = 'window'; catState.happiness = Math.min(100, catState.happiness + 0.1); }
        }
        if (mainScreenState.action === 'sleeping' || mainScreenState.isOnSofa) mainScreenState.catY = sofa.seatY - 35;
        else if (mainScreenState.action === 'window' || mainScreenState.isOnWindow) mainScreenState.catY = window.sillY - 35;
        else mainScreenState.catY = groundY - 50;
    }
    
    function drawRoom() {
        // Стена
        const grad = ctx.createLinearGradient(0, 0, 0, groundY);
        grad.addColorStop(0, '#FFF8DC'); grad.addColorStop(1, COLORS.wall);
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, groundY);
        
        // Пол
        ctx.fillStyle = COLORS.floor; ctx.fillRect(0, groundY, canvas.width, 60);
        ctx.fillStyle = COLORS.floorLight;
        for (let i = 0; i < canvas.width; i += 40) ctx.fillRect(i, groundY + 10, 35, 5);
        
        // 🪟 Окно (НА СТЕНЕ, y: 60)
        ctx.fillStyle = COLORS.windowFrame;
        ctx.fillRect(window.x, window.y, window.width, window.height);
        ctx.fillStyle = COLORS.window;
        ctx.fillRect(window.x + 12, window.y + 12, window.width - 24, window.height - 24);
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(window.x + window.width/2, window.y);
        ctx.lineTo(window.x + window.width/2, window.y + window.height);
        ctx.moveTo(window.x, window.y + window.height/2);
        ctx.lineTo(window.x + window.width, window.y + window.height/2);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(window.x - 20, window.y + window.height - 12, window.width + 40, 20);
        
        // 🛋️ Диван (НА ПОЛУ, y: groundY - 55)
        ctx.fillStyle = '#4A0000';
        ctx.fillRect(sofa.x + 15, sofa.y + sofa.height - 10, 20, 10);
        ctx.fillRect(sofa.x + sofa.width - 35, sofa.y + sofa.height - 10, 20, 10);
        ctx.fillStyle = COLORS.sofa;
        ctx.fillRect(sofa.x, sofa.y, sofa.width, sofa.height);
        ctx.fillStyle = COLORS.sofaSeat;
        ctx.fillRect(sofa.x + 10, sofa.y + 5, sofa.width - 20, sofa.height - 15);
        ctx.fillStyle = COLORS.sofaLight;
        ctx.fillRect(sofa.x, sofa.y - 35, sofa.width, 40);
        ctx.fillRect(sofa.x + 10, sofa.y - 30, sofa.width - 20, 30);
        ctx.fillRect(sofa.x - 10, sofa.y - 10, 15, sofa.height + 10);
        ctx.fillRect(sofa.x + sofa.width - 5, sofa.y - 10, 15, sofa.height + 10);
    }
    
    function drawCat(x, y, direction, action) {
        ctx.save(); ctx.translate(x, y);
        if (direction === -1) { ctx.scale(-1, 1); ctx.translate(-70, 0); }
        
        if (action === 'sleeping') {
            ctx.fillStyle = COLORS.cat2; ctx.beginPath(); ctx.ellipse(35, 40, 35, 20, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.cat3; ctx.fillRect(20, 25, 8, 25); ctx.fillRect(35, 25, 8, 25); ctx.fillRect(50, 25, 8, 25);
            ctx.fillStyle = COLORS.cat1; ctx.beginPath(); ctx.arc(55, 35, 18, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.cat2; ctx.beginPath(); ctx.moveTo(45, 25); ctx.lineTo(48, 15); ctx.lineTo(52, 23); ctx.fill();
            ctx.beginPath(); ctx.moveTo(58, 23); ctx.lineTo(62, 15); ctx.lineTo(65, 25); ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(50, 33); ctx.quadraticCurveTo(53, 36, 56, 33); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(60, 33); ctx.quadraticCurveTo(63, 36, 66, 33); ctx.stroke();
            ctx.fillStyle = COLORS.catNose; ctx.beginPath(); ctx.arc(58, 38, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#87CEEB'; ctx.font = 'bold 12px "Press Start 2P"';
            const z = Math.sin(frame * 0.08) * 3;
            ctx.fillText('Z', 30 + z, 15 - z); ctx.fillText('z', 22 + z*0.8, 10 - z*0.8);
        } else if (action === 'window') {
            ctx.fillStyle = COLORS.cat2; const tw = Math.sin(frame * 0.05) * 3;
            ctx.fillRect(10, 45, 8, 40 + tw); ctx.fillRect(8, 80 + tw, 12, 8);
            ctx.fillStyle = COLORS.cat2; ctx.fillRect(15, 40, 10, 12); ctx.fillRect(45, 40, 10, 12);
            ctx.fillStyle = COLORS.cat1; ctx.fillRect(10, 15, 50, 35);
            ctx.fillStyle = COLORS.cat2; ctx.fillRect(10, 35, 50, 15);
            ctx.fillStyle = COLORS.cat3; ctx.fillRect(18, 18, 8, 28); ctx.fillRect(32, 18, 8, 28); ctx.fillRect(46, 18, 8, 28);
            ctx.fillStyle = COLORS.cat2; ctx.fillRect(20, 45, 8, 10); ctx.fillRect(42, 45, 8, 10);
            ctx.fillStyle = COLORS.cat1; ctx.fillRect(35, 0, 35, 28);
            ctx.fillStyle = COLORS.cat2; ctx.fillRect(38, -8, 10, 10); ctx.fillRect(56, -8, 10, 10);
            ctx.fillStyle = COLORS.catLight; ctx.fillRect(40, -6, 6, 6); ctx.fillRect(58, -6, 6, 6);
            ctx.fillStyle = COLORS.catLight; ctx.fillRect(42, 8, 10, 10); ctx.fillRect(58, 8, 10, 10);
            ctx.fillStyle = COLORS.catEye; ctx.fillRect(44, 10, 6, 6); ctx.fillRect(60, 10, 6, 6);
            ctx.fillStyle = '#000'; ctx.fillRect(46, 11, 3, 3); ctx.fillRect(62, 11, 3, 3);
            ctx.fillStyle = COLORS.catNose; ctx.fillRect(66, 18, 5, 4);
            ctx.fillStyle = COLORS.catLight;
            ctx.fillRect(30, 14, 12, 2); ctx.fillRect(30, 18, 12, 2);
            ctx.fillRect(70, 14, 12, 2); ctx.fillRect(70, 18, 12, 2);
        } else {
            const walk = action === 'walking';
            const tw = walk ? Math.sin(frame * 0.3) * 12 : Math.sin(frame * 0.15) * 6;
            ctx.fillStyle = COLORS.cat2; ctx.fillRect(-20, 30 + tw, 25, 8); ctx.fillRect(-30, 25 + tw, 15, 8);
            const lo = walk ? Math.sin(frame * 0.4) * 10 : 0;
            ctx.fillStyle = COLORS.cat2; ctx.fillRect(5 + lo, 48, 8, 12); ctx.fillRect(20 - lo, 48, 8, 12);
            ctx.fillStyle = COLORS.cat1; ctx.fillRect(0, 20, 50, 30);
            ctx.fillStyle = COLORS.cat2; ctx.fillRect(0, 35, 50, 15);
            ctx.fillStyle = COLORS.cat3; ctx.fillRect(10, 22, 6, 24); ctx.fillRect(25, 22, 6, 24); ctx.fillRect(40, 22, 6, 24);
            ctx.fillStyle = COLORS.cat2; ctx.fillRect(42 + lo, 48, 8, 12); ctx.fillRect(55 - lo, 48, 8, 12);
            ctx.fillStyle = COLORS.cat1; ctx.fillRect(40, 5, 32, 26);
            ctx.fillStyle = COLORS.cat2; ctx.fillRect(42, 0, 10, 10); ctx.fillRect(60, 0, 10, 10);
            ctx.fillStyle = COLORS.catLight; ctx.fillRect(44, 2, 6, 6); ctx.fillRect(62, 2, 6, 6);
            ctx.fillStyle = COLORS.catLight; ctx.fillRect(46, 10, 10, 10); ctx.fillRect(62, 10, 10, 10);
            ctx.fillStyle = COLORS.catEye; ctx.fillRect(48, 12, 6, 6); ctx.fillRect(64, 12, 6, 6);
            ctx.fillStyle = '#000'; ctx.fillRect(50, 13, 3, 3); ctx.fillRect(66, 13, 3, 3);
            ctx.fillStyle = COLORS.catNose; ctx.fillRect(68, 20, 6, 5);
            ctx.fillStyle = COLORS.catLight;
            ctx.fillRect(35, 15, 12, 2); ctx.fillRect(35, 19, 12, 2); ctx.fillRect(35, 23, 12, 2);
            ctx.fillRect(74, 15, 12, 2); ctx.fillRect(74, 19, 12, 2); ctx.fillRect(74, 23, 12, 2);
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
