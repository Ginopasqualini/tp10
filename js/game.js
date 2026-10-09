// ============================================
// ASTEROIDS GAME - TP10
// Arquitectura clásica con Canvas HTML5
// ============================================

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GAME_STATE = {
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// Colores personalizados (Rojo Bordo, Amarillo, Negro)
const COLORS = {
    DARK_RED: '#8B0000',      // Rojo bordo oscuro
    BRIGHT_RED: '#FF0000',    // Rojo brillante
    YELLOW: '#FFD700',        // Amarillo dorado
    BLACK: '#000000',         // Negro
    DARK_BG: '#0A0000'        // Negro muy oscuro para el fondo
};

// Variable global para el audio
let gameAudio = null;
let shootSound = null;
let musicStarted = false;

// Variable global para la imagen de la nave
let shipImage = null;

// ============================================
// CLASE: NAVE (Con imagen custom)
// ============================================
class Ship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.radius = 15;
        this.speed = 0.3;
        this.rotationSpeed = 6;
        this.isThrusting = false;
        this.canShoot = true;
        this.shootCooldown = 200; // ms
        this.lastShootTime = 0;
        this.powerUpActive = null;
        this.powerUpTimer = 0;
    }

    // Dibuja la nave usando imagen o figura por defecto
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Si la imagen está cargada, usarla
        if (shipImage && shipImage.complete && shipImage.naturalHeight !== 0) {
            ctx.drawImage(shipImage, -15, -15, 30, 30);
        } else {
            // Figura de fallback (triángulo dorado)
            ctx.fillStyle = COLORS.YELLOW;
            ctx.strokeStyle = COLORS.YELLOW;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(15, 0);           // Punta delantera
            ctx.lineTo(-10, -12);        // Ala izquierda
            ctx.lineTo(-5, 0);           // Base trasera izquierda
            ctx.lineTo(-10, 12);         // Ala derecha
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Llama del propulsor (usando curva Bézier cuadrática)
        if (this.isThrusting) {
            ctx.strokeStyle = COLORS.BRIGHT_RED;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-5, -6);
            // Bézier cuadrática para la llama izquierda
            ctx.quadraticCurveTo(-15, -8, -20 - Math.random() * 10, -10);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-5, 6);
            // Bézier cuadrática para la llama derecha
            ctx.quadraticCurveTo(-15, 8, -20 - Math.random() * 10, 10);
            ctx.stroke();
        }

        // Escudo visual (si está activo)
        if (this.powerUpActive === 'shield') {
            ctx.strokeStyle = COLORS.YELLOW;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    update() {
        // Movimiento
        this.x += this.vx;
        this.y += this.vy;

        // Fricción más pronunciada
        this.vx *= 0.97;
        this.vy *= 0.97;

        // Límite de velocidad máxima
        const maxSpeed = 4;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        // Límites del canvas
        if (this.x < 0) this.x = CANVAS_WIDTH;
        if (this.x > CANVAS_WIDTH) this.x = 0;
        if (this.y < 0) this.y = CANVAS_HEIGHT;
        if (this.y > CANVAS_HEIGHT) this.y = 0;

        // Actualizar power-up
        if (this.powerUpActive) {
            this.powerUpTimer--;
            if (this.powerUpTimer <= 0) {
                this.powerUpActive = null;
            }
        }

        // Control de cooldown de disparo
        if (!this.canShoot && Date.now() - this.lastShootTime > this.shootCooldown) {
            this.canShoot = true;
        }
    }

    rotate(direction) {
        this.angle += direction * this.rotationSpeed * (Math.PI / 180);
    }

    thrust() {
        this.isThrusting = true;
        const thrustForce = 0.3;
        this.vx += Math.cos(this.angle) * thrustForce;
        this.vy += Math.sin(this.angle) * thrustForce;
    }

    stopThrust() {
        this.isThrusting = false;
    }

    activatePowerUp(type) {
        this.powerUpActive = type;
        this.powerUpTimer = 1500; // 25 segundos (60fps * 25)
    }

    canCollideWith(obj) {
        const dx = this.x - obj.x;
        const dy = this.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + obj.radius;
    }
}

// ============================================
// CLASE: PROYECTIL
// ============================================
class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 3;
        this.life = 60; // frames
        this.isMissile = false;
        this.explosionRadius = 0;
        this.isEnemyProjectile = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) {
        if (!this.isMissile) {
            // Bala normal (amarilla para la nave, roja para enemigos)
            ctx.fillStyle = this.isEnemyProjectile ? COLORS.BRIGHT_RED : COLORS.YELLOW;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Misil (con triángulo y efecto)
            ctx.save();
            ctx.translate(this.x, this.y);
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle);

            ctx.fillStyle = COLORS.BRIGHT_RED;
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-6, -4);
            ctx.lineTo(-6, 4);
            ctx.closePath();
            ctx.fill();

            // Estela del misil
            ctx.strokeStyle = COLORS.YELLOW;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-6, -2);
            ctx.lineTo(-12 - Math.random() * 5, 0);
            ctx.stroke();

            ctx.restore();

            // Dibujar radio de explosión si está activo
            if (this.explosionRadius > 0) {
                ctx.strokeStyle = `rgba(255, 215, 0, ${this.explosionRadius / 50})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    isAlive() {
        return this.life > 0 && this.x > 0 && this.x < CANVAS_WIDTH && this.y > 0 && this.y < CANVAS_HEIGHT;
    }

    canCollideWith(obj) {
        const dx = this.x - obj.x;
        const dy = this.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + obj.radius;
    }

    explode() {
        this.explosionRadius = 50;
    }
}

// ============================================
// CLASE: ASTEROIDE
// ============================================
class Asteroid {
    constructor(x, y, size = 3) {
        this.x = x;
        this.y = y;
        this.size = size; // 1 (pequeño), 2 (mediano), 3 (grande)
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        
        // Radio basado en tamaño
        this.radiusMap = { 1: 8, 2: 15, 3: 25 };
        this.radius = this.radiusMap[size];

        // Puntos por destruir
        this.pointsMap = { 1: 100, 2: 50, 3: 20 };
        this.points = this.pointsMap[size];
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Asteroide como círculo irregular con espiral (Rojo bordo)
        ctx.strokeStyle = COLORS.DARK_RED;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sides = 8 + this.size * 2;
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const variation = this.radius * (0.6 + Math.random() * 0.4);
            const x = Math.cos(angle) * variation;
            const y = Math.sin(angle) * variation;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();

        // Espiral dentro del asteroide
        ctx.strokeStyle = COLORS.BRIGHT_RED;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < Math.PI * 4; i += 0.1) {
            const x = (i * 2) * Math.cos(i) / Math.PI;
            const y = (i * 2) * Math.sin(i) / Math.PI;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.rotationSpeed;

        // Límites del canvas (sin wrap)
        if (this.x < -50) this.x = CANVAS_WIDTH + 50;
        if (this.x > CANVAS_WIDTH + 50) this.x = -50;
        if (this.y < -50) this.y = CANVAS_HEIGHT + 50;
        if (this.y > CANVAS_HEIGHT + 50) this.y = -50;
    }

    canCollideWith(obj) {
        const dx = this.x - obj.x;
        const dy = this.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + obj.radius;
    }

    isInExplosion(explosionX, explosionY, explosionRadius) {
        const dx = this.x - explosionX;
        const dy = this.y - explosionY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < explosionRadius + this.radius;
    }
}

// ============================================
// CLASE: POWER-UP
// ============================================
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'triple', 'missile', 'shield'
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2 - 1;
        this.radius = 12;
        this.angle = 0;
        this.life = 300; // 5 segundos

        this.colorMap = {
            'triple': COLORS.YELLOW,
            'missile': COLORS.BRIGHT_RED,
            'shield': COLORS.YELLOW
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const color = this.colorMap[this.type];
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        // Estrella de 5 puntas
        const points = 5;
        const innerRadius = 5;
        const outerRadius = 12;

        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const x = Math.cos(angle - Math.PI / 2) * radius;
            const y = Math.sin(angle - Math.PI / 2) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Texto indicador
        ctx.fillStyle = COLORS.BLACK;
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textMap = { 'triple': 'x3', 'missile': 'MS', 'shield': 'SH' };
        ctx.fillText(textMap[this.type], 0, 0);

        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.angle += 0.05;
        this.life--;
    }

    isAlive() {
        return this.life > 0 && this.x > 0 && this.x < CANVAS_WIDTH && this.y > 0 && this.y < CANVAS_HEIGHT;
    }

    canCollideWith(obj) {
        const dx = this.x - obj.x;
        const dy = this.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + obj.radius;
    }
}

// ============================================
// CLASE: ENEMIGO
// ============================================
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = 12;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.08;
        
        // Disparos
        this.shootCooldown = 1000; // ms
        this.lastShootTime = 0;
        this.canShoot = true;
        
        // AI
        this.targetAngle = 0;
        this.health = 2; // Se necesitan 2 impactos para destruir
        this.score = 150; // Puntos por destruir enemigo
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Enemigo como octágono rojo oscuro
        ctx.fillStyle = COLORS.DARK_RED;
        ctx.strokeStyle = COLORS.BRIGHT_RED;
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * this.radius;
            const y = Math.sin(angle) * this.radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Indicador de salud (barrita arriba del enemigo)
        ctx.fillStyle = this.health === 2 ? COLORS.YELLOW : COLORS.BRIGHT_RED;
        ctx.fillRect(-5, -18, 10 * this.health, 3);
        ctx.strokeStyle = COLORS.YELLOW;
        ctx.strokeRect(-5, -18, 10, 3);

        ctx.restore();
    }

    update() {
        // Movimiento
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.rotationSpeed;

        // Límites del canvas (rebota)
        if (this.x < this.radius || this.x > CANVAS_WIDTH - this.radius) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(CANVAS_WIDTH - this.radius, this.x));
        }
        if (this.y < this.radius || this.y > CANVAS_HEIGHT - this.radius) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(CANVAS_HEIGHT - this.radius, this.y));
        }

        // Control de cooldown de disparo
        if (!this.canShoot && Date.now() - this.lastShootTime > this.shootCooldown) {
            this.canShoot = true;
        }
    }

    shoot(ship) {
        if (!this.canShoot) return null;

        this.canShoot = false;
        this.lastShootTime = Date.now();

        // Calcular dirección hacia la nave
        const dx = ship.x - this.x;
        const dy = ship.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return null;

        const bulletSpeed = 3.5;
        const vx = (dx / distance) * bulletSpeed;
        const vy = (dy / distance) * bulletSpeed;

        const projectile = new Projectile(this.x, this.y, vx, vy);
        projectile.isEnemyProjectile = true;
        return projectile;
    }

    canCollideWith(obj) {
        const dx = this.x - obj.x;
        const dy = this.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + obj.radius;
    }

    takeDamage() {
        this.health--;
        return this.health <= 0;
    }
}

// ============================================
// FUNCIÓN: REPRODUCIR SONIDO DE DISPARO
// ============================================
function playShootSound() {
    if (shootSound) {
        shootSound.currentTime = 0;
        shootSound.play().catch(() => {
            // El sonido no se pudo reproducir, ignorar error
        });
    }
}

// ============================================
// CLASE: JUEGO PRINCIPAL
// ============================================
class AsteroidsGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.state = GAME_STATE.PLAYING;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.wave = 0;
        this.asteroidsDestroyed = 0;

        this.ship = new Ship(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        this.asteroids = [];
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];

        this.keys = {};
        this.setupEventListeners();

        this.spawnWave();
        this.gameLoop();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            if (e.key === ' ') {
                e.preventDefault();
                
                // Iniciar música en el primer espacio si aún no ha empezado
                if (!musicStarted && gameAudio) {
                    gameAudio.src = 'audio/music.mp3';
                    gameAudio.volume = 0.25;
                    gameAudio.play().catch(() => {
                        console.log("No se pudo iniciar la música");
                    });
                    musicStarted = true;
                }
                
                this.ship.shoot(this);
            }
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    spawnWave() {
        this.asteroids = [];
        this.enemies = [];
        
        // Aumentar cantidad de asteroides por nivel
        const asteroidCount = 3 + (this.level - 1) * 2;

        for (let i = 0; i < asteroidCount; i++) {
            let x, y;
            do {
                x = Math.random() * CANVAS_WIDTH;
                y = Math.random() * CANVAS_HEIGHT;
            } while (Math.hypot(x - this.ship.x, y - this.ship.y) < 100);

            this.asteroids.push(new Asteroid(x, y, 3));
        }

        // Añadir enemigos a partir del nivel 2
        if (this.level >= 2) {
            const enemyCount = 1 + (this.level - 2);
            for (let i = 0; i < enemyCount; i++) {
                let x, y;
                do {
                    x = Math.random() * CANVAS_WIDTH;
                    y = Math.random() * CANVAS_HEIGHT;
                } while (Math.hypot(x - this.ship.x, y - this.ship.y) < 150);

                this.enemies.push(new Enemy(x, y));
            }
        }
    }

    togglePause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
        } else if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
        }
    }

    handleInput() {
        if (this.keys['w'] || this.keys['arrowup']) {
            this.ship.thrust();
        } else {
            this.ship.stopThrust();
        }

        if (this.keys['a'] || this.keys['arrowleft']) {
            this.ship.rotate(-1);
        }

        if (this.keys['d'] || this.keys['arrowright']) {
            this.ship.rotate(1);
        }
    }

    update() {
        if (this.state !== GAME_STATE.PLAYING) return;

        this.handleInput();
        this.ship.update();

        // Actualizar proyectiles
        this.projectiles = this.projectiles.filter((proj) => {
            proj.update();
            return proj.isAlive();
        });

        // Actualizar asteroides
        this.asteroids.forEach((asteroid) => asteroid.update());

        // Actualizar enemigos
        this.enemies.forEach((enemy) => {
            enemy.update();
            
            if (enemy.canShoot) {
                const projectile = enemy.shoot(this.ship);
                if (projectile) {
                    this.projectiles.push(projectile);
                }
            }
        });

        // Actualizar power-ups
        this.powerUps = this.powerUps.filter((pu) => {
            pu.update();
            return pu.isAlive();
        });

        // Colisiones: proyectiles con asteroides
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                if (this.projectiles[i] && this.asteroids[j] && this.projectiles[i].canCollideWith(this.asteroids[j])) {
                    if (this.projectiles[i].isEnemyProjectile) continue;

                    const asteroid = this.asteroids[j];
                    const projectile = this.projectiles[i];
                    
                    this.score += asteroid.points;
                    this.asteroidsDestroyed++;

                    if (Math.random() < 0.3) {
                        const types = ['triple', 'missile', 'shield'];
                        const randomType = types[Math.floor(Math.random() * types.length)];
                        this.powerUps.push(new PowerUp(asteroid.x, asteroid.y, randomType));
                    }

                    if (projectile.isMissile) {
                        projectile.explode();
                        
                        const asteroidsToDie = [];
                        for (let k = this.asteroids.length - 1; k >= 0; k--) {
                            if (this.asteroids[k].isInExplosion(projectile.x, projectile.y, 50)) {
                                asteroidsToDie.push(k);
                            }
                        }

                        for (let asteroidIndex of asteroidsToDie) {
                            if (this.asteroids[asteroidIndex]) {
                                const ast = this.asteroids[asteroidIndex];
                                this.score += ast.points;
                                this.asteroidsDestroyed++;

                                if (Math.random() < 0.3) {
                                    const types = ['triple', 'missile', 'shield'];
                                    const randomType = types[Math.floor(Math.random() * types.length)];
                                    this.powerUps.push(new PowerUp(ast.x, ast.y, randomType));
                                }

                                if (ast.size > 1) {
                                    for (let k = 0; k < 2; k++) {
                                        this.asteroids.push(new Asteroid(ast.x, ast.y, ast.size - 1));
                                    }
                                }

                                this.asteroids.splice(asteroidIndex, 1);
                            }
                        }
                    } else {
                        if (asteroid.size > 1) {
                            for (let k = 0; k < 2; k++) {
                                this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, asteroid.size - 1));
                            }
                        }
                    }

                    this.asteroids.splice(j, 1);
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }

        // Colisiones: proyectiles con enemigos
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.projectiles[i] && this.enemies[j] && this.projectiles[i].canCollideWith(this.enemies[j])) {
                    if (this.projectiles[i].isEnemyProjectile) continue;

                    const enemy = this.enemies[j];
                    
                    if (enemy.takeDamage()) {
                        this.score += enemy.score;
                        this.enemies.splice(j, 1);
                    }

                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }

        // Colisiones: nave con power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            if (this.powerUps[i] && this.ship.canCollideWith(this.powerUps[i])) {
                this.ship.activatePowerUp(this.powerUps[i].type);
                this.powerUps.splice(i, 1);
            }
        }

        // Colisiones: nave con asteroides
        for (let asteroid of this.asteroids) {
            if (this.ship.canCollideWith(asteroid)) {
                if (this.ship.powerUpActive === 'shield') {
                    this.ship.powerUpActive = null;
                } else {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.state = GAME_STATE.GAME_OVER;
                    } else {
                        this.ship.x = CANVAS_WIDTH / 2;
                        this.ship.y = CANVAS_HEIGHT / 2;
                        this.ship.vx = 0;
                        this.ship.vy = 0;
                    }
                }
            }
        }

        // Colisiones: nave con enemigos
        for (let enemy of this.enemies) {
            if (this.ship.canCollideWith(enemy)) {
                if (this.ship.powerUpActive === 'shield') {
                    this.ship.powerUpActive = null;
                } else {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.state = GAME_STATE.GAME_OVER;
                    } else {
                        this.ship.x = CANVAS_WIDTH / 2;
                        this.ship.y = CANVAS_HEIGHT / 2;
                        this.ship.vx = 0;
                        this.ship.vy = 0;
                    }
                }
            }
        }

        // Colisiones: proyectiles enemigos con nave
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (this.projectiles[i] && this.projectiles[i].isEnemyProjectile && this.ship.canCollideWith(this.projectiles[i])) {
                if (this.ship.powerUpActive === 'shield') {
                    this.ship.powerUpActive = null;
                } else {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.state = GAME_STATE.GAME_OVER;
                    } else {
                        this.ship.x = CANVAS_WIDTH / 2;
                        this.ship.y = CANVAS_HEIGHT / 2;
                        this.ship.vx = 0;
                        this.ship.vy = 0;
                    }
                }
                this.projectiles.splice(i, 1);
            }
        }

        // Siguiente nivel
        if (this.asteroidsDestroyed >= 15 && this.asteroids.length === 0 && this.enemies.length === 0) {
            this.asteroidsDestroyed = 0;
            this.level++;
            this.spawnWave();
        } else if (this.asteroids.length === 0 && this.enemies.length === 0 && this.asteroidsDestroyed < 15) {
            this.level++;
            this.asteroidsDestroyed = 0;
            this.spawnWave();
        }
    }

    draw() {
        // Fondo (Negro muy oscuro)
        this.ctx.fillStyle = COLORS.DARK_BG;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Cuadrícula de fondo (efecto arcade en rojo oscuro)
        this.ctx.strokeStyle = 'rgba(139, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < CANVAS_WIDTH; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, CANVAS_HEIGHT);
            this.ctx.stroke();
        }
        for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(CANVAS_WIDTH, i);
            this.ctx.stroke();
        }

        // Dibujar entidades
        this.ship.draw(this.ctx);
        this.asteroids.forEach((asteroid) => asteroid.draw(this.ctx));
        this.enemies.forEach((enemy) => enemy.draw(this.ctx));
        this.projectiles.forEach((proj) => proj.draw(this.ctx));
        this.powerUps.forEach((pu) => pu.draw(this.ctx));

        // Actualizar HUD
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;

        // Mostrar power-up activo con duración en segundos
        const powerUpInfo = this.ship.powerUpActive
            ? `${this.ship.powerUpActive.toUpperCase()} (${Math.ceil(this.ship.powerUpTimer / 60)}s)`
            : 'Ninguno';
        document.getElementById('power-ups-info').textContent = `Power-up: ${powerUpInfo}`;

        // Pausa
        if (this.state === GAME_STATE.PAUSED) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.fillStyle = COLORS.BRIGHT_RED;
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }

        // Game Over
        if (this.state === GAME_STATE.GAME_OVER) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.fillStyle = COLORS.BRIGHT_RED;
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
            this.ctx.font = 'bold 32px Arial';
            this.ctx.fillText(`Score Final: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = COLORS.YELLOW;
            this.ctx.fillText('Recarga la página para jugar de nuevo', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Extender la clase Ship para agregar método de disparo
Ship.prototype.shoot = function (game) {
    if (!this.canShoot) return;

    this.canShoot = false;
    this.lastShootTime = Date.now();

    playShootSound();

    const bulletSpeed = 5;
    const bx = Math.cos(this.angle) * bulletSpeed;
    const by = Math.sin(this.angle) * bulletSpeed;

    if (this.powerUpActive === 'triple') {
        for (let angle of [-0.3, 0, 0.3]) {
            const newAngle = this.angle + angle;
            const vx = Math.cos(newAngle) * bulletSpeed;
            const vy = Math.sin(newAngle) * bulletSpeed;
            game.projectiles.push(new Projectile(this.x, this.y, vx, vy));
        }
    } else if (this.powerUpActive === 'missile') {
        const missile = new Projectile(this.x, this.y, bx * 2, by * 2);
        missile.isMissile = true;
        missile.radius = 5;
        game.projectiles.push(missile);
    } else {
        game.projectiles.push(new Projectile(this.x, this.y, bx, by));
    }
};

// ============================================
// INICIAR JUEGO
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    gameAudio = document.getElementById('bgm');
    shootSound = document.getElementById('shootSound');
    
    // Cargar imagen de la nave
    shipImage = new Image();
    shipImage.src = 'img/ship.png';
    
    new AsteroidsGame();
});
