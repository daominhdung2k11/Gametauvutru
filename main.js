// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas'), ctx =
canvas.getContext('2d');
const scoreEl = document.getElementById('score'),
livesContainer = document.getElementById('livesContainer');
const finalScoreEl = document.getElementById('finalScore'),
gameOverMenu = document.getElementById('gameOverMenu');const victoryMenu = document.getElementById('victoryMenu'),
playAgainButton = document.getElementById('playAgainButton');
const startMenu = document.getElementById('startMenu');
const shieldSkillButton =
document.getElementById('shieldSkillButton'), bombSkillButton =
document.getElementById('bombSkillButton'), machineGunSkillButton =
document.getElementById('machineGunSkillButton'), damageSkillButton =
document.getElementById('damageSkillButton'), timeStopSkillButton =
document.getElementById('timeStopSkillButton');
const bossHealthContainer =
document.getElementById('bossHealthContainer'), bossName =
document.getElementById('bossName'), bossHealthBar =
document.getElementById('bossHealthBar');
const announcementText =
document.getElementById('announcementText');
// --- Sound Engine ---
let soundEnabled = false;
const masterVolume = new Tone.Volume(-10).toDestination();
const laserSynth = new Tone.Synth({ oscillator: { type:
'triangle' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1,
release: 0.1 } }).connect(masterVolume);
const hitSynth = new Tone.MetalSynth({ frequency: 200,
envelope: { attack: 0.001, decay: 0.1, release: 0.05 }, harmonicity:
5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5
}).connect(masterVolume);
const explosionSynth = new Tone.NoiseSynth({ noise: { type:
'white' }, envelope: { attack: 0.005, decay: 0.2, sustain: 0, release:
0.2 } }).connect(masterVolume);
const playerHitSynth = new Tone.MembraneSynth({ pitchDecay:
0.1, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack:
0.01, decay: 0.5, sustain: 0.01, release: 0.6, attackCurve:
'exponential' } }).connect(masterVolume);
const skillSynth = new Tone.PolySynth(Tone.Synth, {
oscillator: { type: "sine" }, envelope: { attack: 0.05, decay: 0.1,
sustain: 0.3, release: 0.5 } }).connect(masterVolume);
const giftSynth = new Tone.PolySynth(Tone.Synth, { oscillator:
{ type: "triangle" } }).connect(masterVolume);
const announcementSynth = new Tone.MembraneSynth({ pitchDecay:
0.8, octaves: 2, oscillator: { type: "sine" }
}).connect(masterVolume);
const victorySynth = new
Tone.PolySynth(Tone.Synth).toDestination();
// --- Canvas Setup ---
let canvasWidth, canvasHeight;
function resizeCanvas() { canvasWidth = window.innerWidth;
canvasHeight = window.innerHeight; canvas.width = canvasWidth;canvas.height = canvasHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
// --- Game Classes (with crash fixes and updates) ---
class Player { constructor() { this.width = 50; this.height =
50; this.x = canvasWidth / 2 - this.width / 2; this.y = canvasHeight -
this.height - 120; this.emoji = '🚀'; this.fontSize = 50; this.lives =
3; this.isInvincible = false; this.invincibilityTimer = 0; } draw() {
if (this.isInvincible) { ctx.globalAlpha =
Math.abs(Math.sin(Date.now() / 100)); } ctx.font = `${this.fontSize}px
Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
ctx.fillText(this.emoji, this.x + this.width / 2, this.y + this.height
/ 2); ctx.globalAlpha = 1.0; if (isShieldActive) { ctx.beginPath();
ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width,
0, Math.PI * 2); ctx.strokeStyle = `rgba(0, 191, 255, ${0.5 +
Math.abs(Math.sin(Date.now() / 100)) * 0.5})`; ctx.lineWidth = 5;
ctx.stroke(); } } updatePosition(x, y) { this.x = x; this.y = y;
this.clampPosition(); } clampPosition() { if (this.x < 0) this.x = 0;
if (this.x + this.width > canvasWidth) this.x = canvasWidth -
this.width; if (this.y < 0) this.y = 0; if (this.y + this.height >
canvasHeight) this.y = canvasHeight - this.height; } loseLife() { if
(this.isInvincible || isShieldActive) return; this.lives--;
if(soundEnabled) playerHitSynth.triggerAttackRelease("C2", "0.5s");
updateLivesUI(); if (this.lives > 0) { this.isInvincible = true;
this.invincibilityTimer = 3000; } else { gameRunning = false; } } }
class Bullet { constructor(x, y) { this.width = 8; this.height
= 20; this.x = x - this.width / 2; this.y = y; this.speed = 10;
this.damage = isDamageBoostActive ? 10 : 5; const isComboActive =
isDamageBoostActive && isMachineGunActive; this.color = isComboActive
? '#ff4500' : (isMachineGunActive ? '#facc15' : (isDamageBoostActive ?
'#34d399' : '#00f6ff')); if(soundEnabled)
laserSynth.triggerAttackRelease(isComboActive ? "C5" : "C6", "0.1"); }
draw() { ctx.fillStyle = this.color; ctx.shadowBlur = 10;
ctx.shadowColor = this.color; ctx.fillRect(this.x, this.y, this.width,
this.height); ctx.shadowBlur = 0; } update() { this.y -= this.speed; }
}
class Enemy { constructor() { this.width = 40; this.height =
40; this.x = Math.random() * (canvasWidth - this.width); this.y =
-this.height; this.speed = Math.random() * 2 + 2; this.emoji = '🛸';
this.fontSize = 40; } draw() { ctx.font = `${this.fontSize}px Arial`;
ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
ctx.fillText(this.emoji, this.x + this.width / 2, this.y + this.height
/ 2); } update() { if(isTimeStopActive) return; this.y += this.speed;
} }
class EnemyBullet { constructor(x, y, speedX, speedY, size =
10, color = '#ff4757') { this.x = x; this.y = y; this.speedX = speedX;
this.speedY = speedY; this.size = size; this.color = color; } draw() {ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y,
this.size, 0, Math.PI * 2); ctx.fill(); } update() {
if(isTimeStopActive) return; this.x += this.speedX; this.y +=
this.speedY; } }
class FloatingText { constructor(text, x, y, color = 'white',
size = 24) { this.text = text; this.x = x; this.y = y; this.color =
color; this.size = size; this.life = 1; this.speedY = -1; }
update(deltaTime) { this.y += this.speedY; this.life -= deltaTime; }
draw() { ctx.globalAlpha = this.life > 0 ? this.life : 0;
ctx.fillStyle = this.color; ctx.font = `bold ${this.size}px Arial`;
ctx.textAlign = 'center'; ctx.fillText(this.text, this.x, this.y);
ctx.globalAlpha = 1.0; } }
class GiftBox { constructor() { this.width = 50; this.height =
50; this.x = Math.random() * (canvasWidth - this.width); this.y =
-this.height; this.speed = 1.5; this.emoji = '🎁'; this.fontSize = 50;
this.hp = 1; } draw() { ctx.font = `${this.fontSize}px Arial`;
ctx.textAlign = 'center'; ctx.fillText(this.emoji, this.x +
this.width/2, this.y + this.height/2); } update() {
if(isTimeStopActive) return; this.y += this.speed; } die() {
if(soundEnabled) giftSynth.triggerAttackRelease(["C5", "E5", "G5"],
"0.4"); addScore(1000); floatingTexts.push(new FloatingText('+1000',
this.x + this.width/2, this.y, '#ffd700', 30)); } }
class Boss { constructor(name, hp, width, height, emoji,
pointsValue) { this.name = name; this.maxHp = hp; this.hp = hp;
this.width = width; this.height = height; this.x = canvasWidth / 2 -
width / 2; this.y = -height; this.emoji = emoji; this.fontSize =
width; this.pointsValue = pointsValue; this.arrived = false;
this.arrivalSpeed = 2; this.attackCooldown = 0; this.isInvincible =
false; this.activeTimeouts = new Set(); } draw() {
if(this.isInvincible) ctx.globalAlpha = 0.5; ctx.font =
`${this.fontSize}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline
= 'middle'; ctx.fillText(this.emoji, this.x + this.width / 2, this.y +
this.height / 2); ctx.globalAlpha = 1.0; } update(deltaTime) {
if(isTimeStopActive) return; if (!this.arrived) { this.y +=
this.arrivalSpeed; if (this.y >= 50) { this.y = 50; this.arrived =
true; } return; } this.attackCooldown -= deltaTime;
if(this.attackCooldown <= 0) { this.attack(); } } takeDamage(amount) {
if(this.isInvincible) return; if(soundEnabled)
hitSynth.triggerAttackRelease(200, '0.1'); this.hp -= amount; if
(this.hp < 0) this.hp = 0; updateBossHealthUI(); if (this.hp <= 0) {
this.die(); } } die() { this.activeTimeouts.forEach(clearTimeout);
if(soundEnabled) explosionSynth.triggerAttackRelease("2n");
createExplosion(this.x + this.width/2, this.y + this.height/2,
['#ffcc00', '#ff0000'], 100); addScore(this.pointsValue);
floatingTexts.push(new FloatingText(`+${this.pointsValue}`, this.x +
this.width/2, this.y, 'white')); currentBoss = null; isBossFight =
false; bossHealthContainer.style.display = 'none'; } attack(){} }
class MiniBoss extends Boss { constructor() { super('Mắt Quỷ',500, 80, 80, '👁', 250); this.attackCooldown = 2000; } attack() {
if(soundEnabled) laserSynth.triggerAttackRelease('A4', '0.2'); const
spreadAngle = Math.PI / 4; const numBullets = 5; const angleStep =
spreadAngle / (numBullets - 1); const startAngle = -spreadAngle / 2;
for (let i = 0; i < numBullets; i++) { const angle = startAngle + i *
angleStep; const speed = 4; enemyProjectiles.push(new
EnemyBullet(this.x + this.width / 2, this.y + this.height,
Math.sin(angle) * speed, Math.cos(angle) * speed)); }
this.attackCooldown = 1500; } }
class SkullBoss extends Boss { constructor() { super('Boss Đầu
Lâu', 1000, 100, 100, '💀', 500); this.attackPattern = 0; } attack() {
if(soundEnabled) laserSynth.triggerAttackRelease('G4', '0.2');
switch(this.attackPattern) { case 0: { const dx = player.x +
player.width/2 - (this.x + this.width/2); const dy = player.y +
player.height/2 - (this.y + this.height/2); const angle =
Math.atan2(dy, dx); enemyProjectiles.push(new EnemyBullet(this.x +
this.width/2, this.y + this.height, Math.cos(angle) * 3,
Math.sin(angle) * 3, 15)); this.attackCooldown = 2000; break; } case
1: { for(let i=0; i<5; i++){ const timeoutId = setTimeout(() => {
if(this.hp <= 0) return; enemyProjectiles.push(new EnemyBullet(this.x
+ this.width/2, this.y + this.height, 0, 5)); }, i * 100);
this.activeTimeouts.add(timeoutId); } this.attackCooldown = 2500;
break; } case 2: { enemies.push(new Enemy()); enemies.push(new
Enemy()); this.attackCooldown = 4000; break; } } this.attackPattern =
(this.attackPattern + 1) % 3; } }
class EagleBoss extends Boss { constructor() { super('Đại
Bàng', 2500, 120, 120, '🦅', 1000); this.attackPattern = 0;
this.spiralAngle = 0; } attack() { if(soundEnabled)
laserSynth.triggerAttackRelease('F4', '0.2');
switch(this.attackPattern) { case 0: { for(let i=0; i<10; i++){ const
angle = this.spiralAngle + i * (Math.PI / 5);
enemyProjectiles.push(new EnemyBullet(this.x + this.width/2, this.y +
this.height, Math.cos(angle) * 4, Math.sin(angle) * 4, 8)); }
this.spiralAngle += 0.5; this.attackCooldown = 500; break; } case 1: {
const angle = Math.random() * Math.PI * 2; for(let i=0; i<15; i++){
enemyProjectiles.push(new EnemyBullet(this.x + this.width/2, this.y +
this.height, Math.cos(angle) * (2 + i*0.2), Math.sin(angle) * (2 +
i*0.2))); } this.attackCooldown = 2000; break; } case 2: { for(let
i=-2; i<=2; i++){ let e = new Enemy(); e.x = this.x + this.width/2 +
i*50; e.y = this.y + this.height; enemies.push(e); }
this.attackCooldown = 5000; break; } case 3: { this.diveTarget = {x:
player.x, y: player.y}; this.isDiving = true; this.attackCooldown =
3000; break; } case 4: { for(let i = 0; i < 3; i++) { const timeoutId
= setTimeout(() => { if(this.hp <= 0) return; const dx = player.x +
player.width/2 - (this.x + this.width/2); const dy = player.y +
player.height/2 - (this.y + this.height/2); const angle =
Math.atan2(dy, dx); enemyProjectiles.push(new EnemyBullet(this.x +
this.width/2, this.y + this.height, Math.cos(angle) * 5,Math.sin(angle) * 5, 12)); }, i * 200);
this.activeTimeouts.add(timeoutId); } this.attackCooldown = 2500;
break; } } this.attackPattern = (this.attackPattern + 1) % 5; } }
class FinalBoss extends Boss { constructor() { super('Boss Ba
Mắt', 5000, 140, 140, '👾', 2500); this.attackPattern = 0;
this.laserChargeTime = 0; this.laserTargetY = 0; } die() {
super.die(); gameWon = true; gameRunning = false; } attack() {
if(soundEnabled) laserSynth.triggerAttackRelease('E4', '0.2'); const
pattern = Math.floor(Math.random() * 10); switch(pattern) { case 0:
case 1: { for(let i=0; i<5; i++){ const timeoutId = setTimeout(() => {
if(this.hp <= 0) return; const dx = player.x - this.x; const dy =
player.y - this.y; const angle = Math.atan2(dy, dx) + (Math.random() -
0.5) * 0.5; enemyProjectiles.push(new EnemyBullet(this.x, this.y,
Math.cos(angle) * 6, Math.sin(angle) * 6, 10, '#9932cc')); }, i *
150); this.activeTimeouts.add(timeoutId); } this.attackCooldown =
1500; break; } case 2: { for(let i = 0; i < 36; i++){ const angle = i
* (Math.PI / 18); enemyProjectiles.push(new EnemyBullet(this.x,
this.y, Math.cos(angle)*5, Math.sin(angle)*5, 7, '#4b0082')); }
this.attackCooldown = 2000; break; } case 3: { for(let i=0; i<3; i++){
let e = new EagleBoss(); e.hp=500; e.pointsValue=0; e.width=80;
e.height=80; e.fontSize=80; e.x=Math.random()*canvasWidth;
enemies.push(e); } this.attackCooldown = 6000; break; } case 4: {
this.laserChargeTime = 1000; this.laserTargetY = player.y;
this.attackCooldown = 2500; break; } case 5: { this.isInvincible =
true; const timeoutId = setTimeout(() => {if(this.hp <= 0) return;
this.isInvincible = false}, 2000); this.activeTimeouts.add(timeoutId);
this.x = Math.random() * (canvasWidth - this.width); this.y =
Math.random() * (canvasHeight / 3) + 20; this.attackCooldown = 3000;
break; } case 6: { for(let i=0; i<30; i++){ let meteor = new
EnemyBullet(Math.random() * canvasWidth, -20, (Math.random() - 0.5) *
2, 6, Math.random() * 10 + 5); enemyProjectiles.push(meteor); }
this.attackCooldown = 2500; break; } default: { this.attackCooldown =
1000; break; } } } }
class Particle { constructor(x, y, color) { this.x = x; this.y
= y; this.color = Array.isArray(color) ?
color[Math.floor(Math.random() * color.length)] : color; this.size =
Math.random() * 5 + 2; this.speedX = Math.random() * 6 - 3;
this.speedY = Math.random() * 6 - 3; this.life = 1; }
update(deltaTime) { this.x += this.speedX; this.y += this.speedY;
this.life -= deltaTime; } draw() { ctx.fillStyle = this.color;
ctx.globalAlpha = this.life > 0 ? this.life : 0; ctx.beginPath();
ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
ctx.globalAlpha = 1.0; } }
class Star { constructor() { this.x = Math.random() *
canvasWidth; this.y = Math.random() * canvasHeight; this.size =
Math.random() * 2 + 0.5; this.speed = Math.random() * 1 + 0.5; }
draw() { ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(this.x,
this.y, this.size, 0, Math.PI * 2); ctx.fill(); } update() { this.y +=this.speed; if (this.y > canvasHeight) { this.y = 0; this.x =
Math.random() * canvasWidth; } } }
// --- Game State ---
let player, bullets, enemies, particles, stars, score,
gameRunning, gameWon, floatingTexts, giftBoxes;
let enemySpawnTimer, bulletCooldownTimer, giftBoxSpawnTimer;
let isShieldActive, shieldTimer, shieldCooldownTimer,
bombCooldownTimer;
let isMachineGunActive, machineGunTimer,
machineGunCooldownTimer;
let isDamageBoostActive, damageBoostTimer,
damageBoostCooldownTimer;
let isTimeStopActive, timeStopTimer, timeStopCooldownTimer;
let enemyProjectiles, currentBoss, isBossFight, bossTriggers;
let announcementTimer, announcementMessage;
const keys = { w: false, a: false, s: false, d: false };
const PLAYER_KEYBOARD_SPEED = 8;
// --- Init Function ---
function init() {
player = new Player(); bullets = []; enemies = [];
particles = []; enemyProjectiles = []; floatingTexts = []; giftBoxes =
[];
stars = []; for (let i = 0; i < 100; i++) stars.push(new
Star());
score = 0; gameRunning = true; gameWon = false;
enemySpawnTimer = 1000; bulletCooldownTimer = 0;
giftBoxSpawnTimer = 15000;
isShieldActive = false; shieldTimer = 0;
shieldCooldownTimer = 0; bombCooldownTimer = 0;
isMachineGunActive = false; machineGunTimer = 0;
machineGunCooldownTimer = 0;
isDamageBoostActive = false; damageBoostTimer = 0;
damageBoostCooldownTimer = 0;
isTimeStopActive = false; timeStopTimer = 0;
timeStopCooldownTimer = 0;
currentBoss = null; isBossFight = false; bossTriggers = {
mini: false, skull: false, eagle: false, final: false };
announcementTimer = 0; announcementMessage = '';
scoreEl.textContent = score; updateLivesUI();
gameOverMenu.style.display = 'none';
victoryMenu.style.display = 'none'; startMenu.style.display = 'none';
bossHealthContainer.style.display = 'none';
announcementText.style.display = 'none';
updateSkillsUI();lastTime = performance.now();
requestAnimationFrame(gameLoop);
}
// --- Game Logic ---
function handleKeyboardInput() { if (!player || !gameRunning)
return; if (keys.w || keys.a || keys.s || keys.d) { if (keys.w)
player.y -= PLAYER_KEYBOARD_SPEED; if (keys.s) player.y +=
PLAYER_KEYBOARD_SPEED; if (keys.a) player.x -= PLAYER_KEYBOARD_SPEED;
if (keys.d) player.x += PLAYER_KEYBOARD_SPEED; player.clampPosition();
} }
function checkCollisions() {
// Player bullets vs... (iterating backwards is safer)
for (let i = bullets.length - 1; i >= 0; i--) {
if (!bullets[i]) continue;
const b = bullets[i];
// vs Boss
if(isBossFight && currentBoss) { if (b.x <
currentBoss.x + currentBoss.width && b.x + b.width > currentBoss.x &&
b.y < currentBoss.y + currentBoss.height && b.y + b.height >
currentBoss.y) { currentBoss.takeDamage(b.damage); bullets.splice(i,
1); continue; } }
// vs Enemies
for (let j = enemies.length - 1; j >= 0; j--) { if
(b.x < enemies[j].x + enemies[j].width && b.x + b.width > enemies[j].x
&& b.y < enemies[j].y + enemies[j].height && b.y + b.height >
enemies[j].y) { if(soundEnabled) hitSynth.triggerAttackRelease(400,
'0.05'); createExplosion(enemies[j].x + enemies[j].width/2,
enemies[j].y + enemies[j].height/2, '#ffa500', 15); bullets.splice(i,
1); enemies.splice(j, 1); addScore(10); break; } }
if(!bullets[i]) continue; // check again as bullet
might be removed
// vs Gift Boxes
for (let j = giftBoxes.length - 1; j >= 0; j--) { if
(b.x < giftBoxes[j].x + giftBoxes[j].width && b.x + b.width >
giftBoxes[j].x && b.y < giftBoxes[j].y + giftBoxes[j].height && b.y +
b.height > giftBoxes[j].y) { giftBoxes[j].die(); bullets.splice(i, 1);
giftBoxes.splice(j, 1); break; } }
}
// Player vs...
if(player.isInvincible || isShieldActive) return; const
checkPlayerCollision = (obj) => { const p = player; if (obj.x < p.x +
p.width && obj.x + (obj.width || obj.size) > p.x && obj.y < p.y +
p.height && obj.y + (obj.height || obj.size) > p.y) { p.loseLife();
createExplosion(p.x + p.width/2, p.y + p.height/2, '#ff4500', 30);
return true; } return false; };
for (let i = enemies.length - 1; i >= 0; i--) {
if(checkPlayerCollision(enemies[i])) { enemies.splice(i,1); break; } }for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
if(checkPlayerCollision(enemyProjectiles[i])) {
enemyProjectiles.splice(i,1); break; } }
}
function activateBomb() { if (bombCooldownTimer > 0) return;
if(soundEnabled) { explosionSynth.triggerAttackRelease("1n");
skillSynth.triggerAttackRelease("C3", "0.5s"); } if(isBossFight &&
currentBoss) { currentBoss.takeDamage(50);
createExplosion(currentBoss.x + currentBoss.width/2, currentBoss.y +
currentBoss.height/2, ['#ffcc00', '#ff4500', '#ff6347'], 40); } else {
enemies.forEach(e => { addScore(10); createExplosion(e.x + e.width/2,
e.y + e.height/2, '#ffcc00', 20); }); enemies = []; }
bombCooldownTimer = 30000; }
function triggerBossSequence(bossType) { if(soundEnabled)
announcementSynth.triggerAttackRelease("C1", "1s"); isBossFight =
true; enemies = []; announcementTimer = 3000; const timeoutId =
setTimeout(() => { if (!gameRunning) return; if(bossType === 'mini') {
bossTriggers.mini = true; announcementMessage = "MINI-BOSS Sắp Xuất
Hiện!"; currentBoss = new MiniBoss(); } else if (bossType === 'skull')
{ bossTriggers.skull = true; announcementMessage = "BOSS ĐẦU LÂU TỚI
KÌA!"; currentBoss = new SkullBoss(); } else if (bossType === 'eagle')
{ bossTriggers.eagle = true; announcementMessage = "SIÊU BOSS: ĐẠI
BÀNG!"; currentBoss = new EagleBoss(); } else if (bossType ===
'final') { bossTriggers.final = true; announcementMessage = "TRÙM
CUỐI: BOSS BA MẮT!"; currentBoss = new FinalBoss(); } setupBossUI();
}, 3000); }
// --- Game Loop ---
let lastTime = 0;
function gameLoop(timestamp) {
if (!gameRunning) { if (gameWon) { showVictoryScreen(); }
else { showGameOverMenu(); } return; }
const deltaTime = timestamp - lastTime; const deltaSeconds
= deltaTime / 1000; lastTime = timestamp;
handleKeyboardInput();
// Timers & State
if (player.isInvincible) { player.invincibilityTimer -=
deltaTime; if (player.invincibilityTimer <= 0) player.isInvincible =
false; }
if (isShieldActive) { shieldTimer -= deltaTime;
if(shieldTimer <= 0) isShieldActive = false; }
if (isMachineGunActive) { machineGunTimer -= deltaTime;
if(machineGunTimer <= 0) isMachineGunActive = false; }
if (isDamageBoostActive) { damageBoostTimer -= deltaTime;
if(damageBoostTimer <= 0) isDamageBoostActive = false; }
if (isTimeStopActive) { timeStopTimer -= deltaTime;if(timeStopTimer <= 0) isTimeStopActive = false; }
if (shieldCooldownTimer > 0) shieldCooldownTimer -=
deltaTime; if (bombCooldownTimer > 0) bombCooldownTimer -= deltaTime;
if (machineGunCooldownTimer > 0) machineGunCooldownTimer
-= deltaTime; if (damageBoostCooldownTimer > 0)
damageBoostCooldownTimer -= deltaTime;
if (timeStopCooldownTimer > 0) timeStopCooldownTimer -=
deltaTime;
if (announcementTimer > 0) { announcementTimer -=
deltaTime; announcementText.style.display = 'block';
announcementText.textContent = announcementMessage;
if(announcementTimer <= 0) announcementText.style.display = 'none'; }
if(currentBoss && currentBoss instanceof FinalBoss &&
currentBoss.laserChargeTime > 0){ currentBoss.laserChargeTime -=
deltaTime; }
// Updates
bullets.forEach(b => b.update()); floatingTexts.forEach(t
=> t.update(deltaSeconds)); particles.forEach(p =>
p.update(deltaSeconds)); stars.forEach(s => s.update());
if(!isTimeStopActive) { enemies.forEach(e => e.update());
giftBoxes.forEach(g => g.update()); enemyProjectiles.forEach(p =>
p.update()); if(currentBoss) currentBoss.update(deltaTime); }
// Spawning
if (!isBossFight && announcementTimer <= 0 &&
!isTimeStopActive) { enemySpawnTimer -= deltaTime; giftBoxSpawnTimer
-= deltaTime; if (enemySpawnTimer <= 0) { enemies.push(new Enemy());
enemySpawnTimer = 1000 * (0.99 ** (score/100)); } if (score >= 500 &&
giftBoxSpawnTimer <= 0) { giftBoxes.push(new GiftBox());
giftBoxSpawnTimer = Math.random() * 15000 + 10000; } }
bulletCooldownTimer -= deltaTime; if (bulletCooldownTimer
<= 0 && player) { bullets.push(new Bullet(player.x + player.width / 2,
player.y)); bulletCooldownTimer = isMachineGunActive ? 50 : 250; }
// Cleanup
bullets = bullets.filter(b => b.y > -b.height); enemies =
enemies.filter(e => e.y < canvasHeight); giftBoxes =
giftBoxes.filter(g => g.y < canvasHeight);
enemyProjectiles = enemyProjectiles.filter(p => p.y <
canvasHeight && p.y > -1000 && p.x > -1000 && p.x < canvasWidth+1000);
particles = particles.filter(p => p.life > 0);
floatingTexts = floatingTexts.filter(t => t.life > 0);
checkCollisions();
// Boss Triggers
if (!isBossFight && !isTimeStopActive) {if(score >= 500 && !bossTriggers.mini){
triggerBossSequence('mini'); }
else if(score >= 1000 && !bossTriggers.skull){
triggerBossSequence('skull'); }
else if(score >= 2000 && !bossTriggers.eagle){
triggerBossSequence('eagle'); }
else if(score >= 4500 && !bossTriggers.final){
triggerBossSequence('final'); }
}
// Drawing
ctx.clearRect(0, 0, canvasWidth, canvasHeight);
stars.forEach(s => s.draw());
if(isTimeStopActive){ ctx.fillStyle = 'rgba(173, 216, 230,
0.3)'; ctx.fillRect(0,0,canvasWidth, canvasHeight); }
enemies.forEach(e => e.draw()); giftBoxes.forEach(g =>
g.draw());
if(currentBoss) currentBoss.draw();
enemyProjectiles.forEach(p => p.draw());
if(player) player.draw();
bullets.forEach(b => b.draw());
particles.forEach(p => p.draw()); floatingTexts.forEach(t
=> t.draw());
updateSkillsUI();
requestAnimationFrame(gameLoop);
}
// --- UI & Helper Functions ---
function addScore(amount) { score += amount;
scoreEl.textContent = score; }
function updateSkillsUI() { const u = (b, c, e) => { if (c >
0) { b.disabled = true; b.textContent = Math.ceil(c / 1000); } else {
b.disabled = false; b.innerHTML = e; } }; u(shieldSkillButton,
shieldCooldownTimer, '🛡<span class="absolute -top-2 -right-2
text-base bg-black bg-opacity-70 rounded-full px-2">1</span>');
u(damageSkillButton, damageBoostCooldownTimer, '💪<span
class="absolute -top-2 -right-2 text-base bg-black bg-opacity-70
rounded-full px-2">2</span>'); u(bombSkillButton, bombCooldownTimer,
'💣<span class="absolute -top-2 -right-2 text-base bg-black
bg-opacity-70 rounded-full px-2">3</span>'); u(machineGunSkillButton,
machineGunCooldownTimer, '🔫<span class="absolute -top-2 -right-2
text-base bg-black bg-opacity-70 rounded-full px-2">4</span>');
u(timeStopSkillButton, timeStopCooldownTimer, '⏳<span class="absolute
-top-2 -right-2 text-base bg-black bg-opacity-70 rounded-full
px-2">G</span>'); }
function updateLivesUI() { if(player)
livesContainer.textContent = '❤️'.repeat(player.lives); }function setupBossUI() { bossHealthContainer.style.display =
'flex'; if(currentBoss) bossName.textContent = currentBoss.name;
updateBossHealthUI(); }
function updateBossHealthUI() { if(!currentBoss) return; const
hpPercent = (currentBoss.hp / currentBoss.maxHp) * 100;
bossHealthBar.style.width = `${hpPercent}%`; }
function showGameOverMenu() { finalScoreEl.textContent =
score; gameOverMenu.style.display = 'flex'; }
function showVictoryScreen() { if(soundEnabled)
victorySynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2s");
victoryMenu.style.display = 'flex'; }
function createExplosion(x, y, color, count) {
if(soundEnabled) explosionSynth.triggerAttackRelease("0.5n"); for(let
k = 0; k < count; k++) particles.push(new Particle(x, y, color)); }
function activateShield() { if (shieldCooldownTimer <= 0) {
if(soundEnabled) skillSynth.triggerAttackRelease("C4", "0.2s");
isShieldActive = true; shieldTimer = 5000; shieldCooldownTimer =
20000; } }
function activateMachineGun() { if (machineGunCooldownTimer <=
0) { if(soundEnabled) skillSynth.triggerAttackRelease("E4", "0.2s");
isMachineGunActive = true; machineGunTimer = 5000;
machineGunCooldownTimer = 35000; } }
function activateDamageBoost() { if (damageBoostCooldownTimer
<= 0) { if(soundEnabled) skillSynth.triggerAttackRelease("G4",
"0.2s"); isDamageBoostActive = true; damageBoostTimer = 10000;
damageBoostCooldownTimer = 40000; } }
function activateTimeStop() { if (timeStopCooldownTimer <= 0)
{ if(soundEnabled) { const now = Tone.now();
skillSynth.triggerAttackRelease("C5", "0.5s", now);
skillSynth.triggerAttackRelease("G4", "0.5s", now + 0.1); }
isTimeStopActive = true; timeStopTimer = 5000; timeStopCooldownTimer =
75000; } }
// --- Event Listeners ---
function handleMove(e) {
e.preventDefault();
if (!gameRunning || !player) return;
// Chỉ di chuyển nếu sự kiện chạm/di chuột xảy ra trên
canvas, không phải nút bấm
if (e.target.id === 'gameCanvas') {
let t = e.touches ? e.touches[0] : e;
player.updatePosition(t.clientX - player.width / 2,
t.clientY - player.height / 2);
}
}
canvas.addEventListener('touchmove', handleMove, { passive:
false });
canvas.addEventListener('touchstart', handleMove, { passive:false });
canvas.addEventListener('mousemove', handleMove);
window.addEventListener('keydown', (e) => { const key =
e.key.toLowerCase(); if (keys.hasOwnProperty(key)) { keys[key] = true;
} if (!gameRunning) return; switch (key) { case '1':
shieldSkillButton.click(); break; case '2': damageSkillButton.click();
break; case '3': bombSkillButton.click(); break; case '4':
machineGunSkillButton.click(); break; case 'g':
timeStopSkillButton.click(); break; } });
window.addEventListener('keyup', (e) => { const key =
e.key.toLowerCase(); if (keys.hasOwnProperty(key)) { keys[key] =
false; } });
startButton.addEventListener('click', async () => { if
(!soundEnabled) { await Tone.start(); soundEnabled = true; } init();
});
restartButton.addEventListener('click', init);
playAgainButton.addEventListener('click', init);
shieldSkillButton.addEventListener('click', activateShield);
bombSkillButton.addEventListener('click', activateBomb);
machineGunSkillButton.addEventListener('click',
activateMachineGun);
damageSkillButton.addEventListener('click',
activateDamageBoost);
timeStopSkillButton.addEventListener('click',
activateTimeStop);
// --- Initial Load ---
window.onload = () => { gameRunning = false; ctx.clearRect(0,
0, canvasWidth, canvasHeight); stars = []; for (let i = 0; i < 100;
i++) stars.push(new Star()); stars.forEach(s => s.draw()); new
Player().draw(); gameOverMenu.style.display = 'none';
victoryMenu.style.display = 'none'; bossHealthContainer.style.display
= 'none'; startMenu.style.display = 'flex'; }