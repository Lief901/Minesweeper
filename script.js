class Minesweeper {
    constructor() {
        this.size = 10;
        this.mines = 15;
        this.grid = [];
        this.gameOver = false;
        this.init();
        this.setupParticles();
        this.setupCursorTrail();
        this.setupSounds();
    }

    init() {
        this.createGrid();
        this.placeMines();
        this.calculateNumbers();
        this.render();
        this.addEventListeners();
    }

    createGrid() {
        this.grid = Array(this.size).fill().map(() => 
            Array(this.size).fill().map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            }))
        );
    }

    placeMines() {
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const x = Math.floor(Math.random() * this.size);
            const y = Math.floor(Math.random() * this.size);
            if (!this.grid[y][x].isMine) {
                this.grid[y][x].isMine = true;
                minesPlaced++;
            }
        }
    }

    calculateNumbers() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (!this.grid[y][x].isMine) {
                    this.grid[y][x].neighborMines = this.countNeighborMines(x, y);
                }
            }
        }
    }

    countNeighborMines(x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newY = y + dy;
                const newX = x + dx;
                if (newY >= 0 && newY < this.size && newX >= 0 && newX < this.size) {
                    if (this.grid[newY][newX].isMine) count++;
                }
            }
        }
        return count;
    }

    render() {
        const container = document.getElementById('minesweeper');
        container.innerHTML = '';
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                if (this.grid[y][x].isRevealed) {
                    cell.classList.add('revealed');
                    if (this.grid[y][x].isMine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (this.grid[y][x].neighborMines > 0) {
                        cell.textContent = this.grid[y][x].neighborMines;
                    }
                } else if (this.grid[y][x].isFlagged) {
                    cell.classList.add('flag');
                    cell.textContent = '🚩';
                }
                
                container.appendChild(cell);
            }
        }
    }

    setupParticles() {
        const canvas = document.getElementById('particle-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 3 + 1;
                this.speedX = Math.random() * 2 - 1;
                this.speedY = Math.random() * 2 - 1;
                this.life = 150;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.life--;
            }

            draw() {
                ctx.fillStyle = `rgba(52, 152, 219, ${this.life/150})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (Math.random() < 0.1) {
                particles.push(new Particle(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height
                ));
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                }
            }
            
            requestAnimationFrame(animate);
        }

        animate();
    }

    setupCursorTrail() {
        const canvas = document.getElementById('cursor-trail');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const trail = [];
        const maxTrailLength = 7;
        let lastX = 0;
        let lastY = 0;

        document.addEventListener('mousemove', (e) => {
            const x = e.clientX;
            const y = e.clientY;
            const speed = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2));
            
            trail.push({
                x: x,
                y: y,
                speed: speed
            });
            
            if (trail.length > maxTrailLength) {
                trail.shift();
            }
            
            lastX = x;
            lastY = y;
        });

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (trail.length > 2) {
                for (let i = 1; i < trail.length; i++) {
                    const point = trail[i];
                    const prevPoint = trail[i - 1];
                    
                    const width = (trail.length - i) * 2;
                    const alpha = (trail.length - i) / trail.length;
                    
                    const gradient = ctx.createLinearGradient(
                        prevPoint.x, prevPoint.y,
                        point.x, point.y
                    );
                    
                    gradient.addColorStop(0, `rgba(255, 100, 50, ${alpha})`);
                    gradient.addColorStop(0.4, `rgba(255, 50, 0, ${alpha * 0.8})`);
                    gradient.addColorStop(1, `rgba(255, 200, 50, ${alpha * 0.5})`);
                    
                    ctx.beginPath();
                    ctx.lineWidth = width;
                    ctx.lineCap = 'round';
                    ctx.strokeStyle = gradient;
                    
                    ctx.beginPath();
                    ctx.moveTo(prevPoint.x, prevPoint.y);
                    ctx.lineTo(point.x, point.y);
                    ctx.stroke();
                    
                    if (i > 1) {
                        const sparkRadius = width * 0.5;
                        ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.3})`;
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, sparkRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                const currentPoint = trail[trail.length - 1];
                const glow = ctx.createRadialGradient(
                    currentPoint.x, currentPoint.y, 0,
                    currentPoint.x, currentPoint.y, 20
                );
                glow.addColorStop(0, 'rgba(255, 200, 50, 0.3)');
                glow.addColorStop(1, 'rgba(255, 100, 50, 0)');
                
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(currentPoint.x, currentPoint.y, 20, 0, Math.PI * 2);
                ctx.fill();
            }
            
            requestAnimationFrame(animate);
        }

        animate();
    }

    setupSounds() {
        this.sounds = {
            click: document.getElementById('clickSound'),
            reveal: document.getElementById('revealSound'),
            explosion: document.getElementById('explosionSound')
        };
        
        this.playSound = (soundId) => {
            const sound = this.sounds[soundId];
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => console.log('音频播放失败:', e));
            }
        };
    }

    revealCell(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) return;
        if (this.grid[y][x].isRevealed || this.grid[y][x].isFlagged) return;

        this.playSound('click');
        this.grid[y][x].isRevealed = true;

        if (this.grid[y][x].isMine) {
            this.playSound('explosion');
            this.gameOver = true;
            this.revealAll();
            this.showModal('游戏失败！');
            return;
        }

        this.playSound('reveal');

        if (this.grid[y][x].neighborMines === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    this.revealCell(x + dx, y + dy);
                }
            }
        }

        if (this.checkWin()) {
            this.gameOver = true;
            this.showModal('游戏胜利！');
        }
    }

    revealAll() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                this.grid[y][x].isRevealed = true;
            }
        }
        this.render();
    }

    checkWin() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (!this.grid[y][x].isMine && !this.grid[y][x].isRevealed) {
                    return false;
                }
            }
        }
        return true;
    }

    checkFlagWin() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.grid[y][x].isMine !== this.grid[y][x].isFlagged) {
                    return false;
                }
            }
        }
        return true;
    }

    showModal(message) {
        const modal = document.getElementById('modal');
        const resultText = document.getElementById('game-result');
        resultText.textContent = message;
        modal.style.display = 'block';
    }

    addEventListeners() {
        const container = document.getElementById('minesweeper');
        container.addEventListener('click', (e) => {
            if (this.gameOver) return;
            const cell = e.target;
            if (cell.classList.contains('cell')) {
                const x = parseInt(cell.dataset.x);
                const y = parseInt(cell.dataset.y);
                this.revealCell(x, y);
                this.render();
            }
        });

        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.gameOver) return;
            const cell = e.target;
            if (cell.classList.contains('cell')) {
                const x = parseInt(cell.dataset.x);
                const y = parseInt(cell.dataset.y);
                this.grid[y][x].isFlagged = !this.grid[y][x].isFlagged;
                this.render();

                if (this.checkFlagWin()) {
                    this.gameOver = true;
                    this.showModal('游戏胜利！');
                }
            }
        });

        document.getElementById('restart').addEventListener('click', () => {
            this.gameOver = false;
            this.init();
            document.getElementById('modal').style.display = 'none';
        });

        document.getElementById('close').addEventListener('click', () => {
            document.body.innerHTML = '<div style="text-align: center; padding: 20px; font-size: 18px;">游戏已结束，请关闭页面</div>';
        });
    }
}

// 启动游戏
new Minesweeper(); 