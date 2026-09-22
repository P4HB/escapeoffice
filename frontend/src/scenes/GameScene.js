import Player from '../objects/Player.js';
import Monster from '../objects/Monster.js';
import Boss from '../objects/Boss.js';
import { spawnMonster, findSpawnPosition } from '../systems/monsterspawn.js';
import { DroppedUsableItem, Skill } from '../objects/usableitems.js';
import WeaponSwapModal from '../ui/WeaponSwapModal.js';
import WeaponUpgradeModal from '../ui/WeaponUpgradeModal.js';
import { GUEST_MODE, assetUrl } from '../services/gameMode.js';
import { getGuestReply } from '../services/guestGame.js';
import { apiRequest } from '../services/api.js';
import { GAME, WEAPONS, bossStats, spawnInterval, clamp } from '../config/balance.js';
import { RunState, combatTargets, targetInRange } from '../services/runState.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }
  preload() {
    const images = {
      boojang: 'monster/boojang', gwajang: 'monster/gwajang', file: 'monster/file', bogoseo: 'monster/bogoseo',
      usb: 'weapon/usb', coffee: 'weapon/coffee', mouse: 'weapon/mouse', bomb: 'weapon/printer',
      typing: 'weapon/typing', skill: 'usableitem/skill', player: 'images/Player', map3: 'map/map3',
      exp: 'images/exp', boss: 'boss/boss',
    };
    for (const [key, path] of Object.entries(images)) this.load.image(key, assetUrl(`assets/${path}.png`));
  }
  create() {
    this.run = new RunState();
    this.physics.world.resume();
    this.runId = {};
    this.pendingUpgrades = 0;
    this.weaponUpgradeModalInstance = null;
    this.weaponSwapModalInstance = null;
    this.bossSpawned = false;
    this.isChattingWithKim = false;
    this.chatRequestPending = false;
    this.chatHistory = [];
    this.chatCount = 0;
    this.kimDaeRiMood = 0;
    this.chatUIElements = [];
    this.chatFormComponent = null;
    this.remainingMinutes = 0;
    this.nextSpawnAt = 800;
    this.nextItemAt = GAME.itemSpawnMs;
    this.playerUsableItems = [];
    this.hudNodes = [];
    this.hudDirty = true;

    const map = this.add.image(0, 0, 'map3').setOrigin(0);
    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.bullets = this.physics.add.group();
    this.weapons = this.physics.add.group();
    this.bombs = this.physics.add.group();
    this.exps = this.physics.add.group();
    this.usableItems = this.physics.add.group();
    this.monsters = this.physics.add.group({ classType: Monster });
    this.bossGroup = this.physics.add.group();
    this.player = new Player(this, map.width / 2, map.height / 2);
    this.cameras.main.startFollow(this.player);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.enabled = true;
    this.input.keyboard.enableGlobalCapture();
    this.input.keyboard.on('keydown-SPACE', event => { if (!event.repeat) this.useUsableItem(0); });
    this.input.keyboard.on('keydown-Q', event => { if (!event.repeat) this.useUsableItem(1); });
    this.input.keyboard.on('keydown-E', event => { if (!event.repeat) this.useUsableItem(2); });
    this.input.keyboard.on('keydown-ESC', event => {
      if (!event.repeat && !this.isChattingWithKim) this.setPaused('manual', !this.run.pauses.has('manual'));
    });

    const addOverlap = (a, b, handler) => this.physics.add.overlap(a, b, handler, () => !this.run.paused, this);
    for (const group of [this.monsters, this.bossGroup]) {
      addOverlap(this.player, group, this.handlePlayerHit);
      addOverlap(this.bullets, group, this.handleBulletMonsterCollision);
      addOverlap(group, this.bombs, (_monster, bomb) => this.explodeBomb(bomb));
    }
    addOverlap(this.player, this.weapons, this.handleWeaponPickup);
    addOverlap(this.player, this.exps, this.handleExpPickup);
    addOverlap(this.player, this.usableItems, this.handleUsableItemPickup);

    this.statusText = this.add.text(20, 20, '', { fontSize: '20px', color: '#fff', stroke: '#000', strokeThickness: 3 }).setScrollFactor(0).setDepth(100);
    this.timerText = this.add.text(20, 50, '', { fontSize: '18px', color: '#ff9999', stroke: '#000', strokeThickness: 3 }).setScrollFactor(0).setDepth(100);
    this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2, '일시정지 · ESC로 계속', {
      fontSize: '28px', color: '#fff', backgroundColor: '#111111', padding: { x: 24, y: 20 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3000).setVisible(false);
    const blur = () => this.setPaused('blur', true);
    const focus = () => { this.input.keyboard.resetKeys(); this.setPaused('blur', false); };
    this.game.events.on(Phaser.Core.Events.BLUR, blur);
    this.game.events.on(Phaser.Core.Events.FOCUS, focus);
    this.events.once('shutdown', () => {
      this.run.ended = true;
      this.chatAbort?.abort();
      this.weaponUpgradeModalInstance?.destroy();
      this.weaponSwapModalInstance?.destroy();
      this.input.keyboard.removeAllListeners();
      this.input.keyboard.enabled = true;
      this.input.keyboard.enableGlobalCapture();
      this.game.events.off(Phaser.Core.Events.BLUR, blur);
      this.game.events.off(Phaser.Core.Events.FOCUS, focus);
    });
    this.updateHud();
  }
  setPaused(reason, paused) {
    paused ? this.run.pause(reason) : this.run.resume(reason);
    if (this.run.paused) this.physics.world.pause();
    else this.physics.world.resume();
    this.pauseText?.setVisible(this.run.pauses.has('manual') || this.run.pauses.has('blur'));
  }
  update(_time, delta) {
    if (this.run.paused) return;
    this.run.tick(delta);
    if (!this.run.remainingSeconds) { this.finishRun('GameOverScene', { reason: 'timeout' }); return; }
    if (this.pendingUpgrades) { this.showWeaponUpgradeModal(); return; }
    if (!this.bossSpawned && this.player.level >= GAME.bossLevel) { this.startBossChatSequence(); return; }
    const now = this.run.elapsedMs;
    if (now >= this.nextSpawnAt) {
      spawnMonster(this, this.player, this.monsters);
      this.nextSpawnAt = now + spawnInterval(now, this.bossSpawned);
    }
    if (now >= this.nextItemAt) { this.spawnRandomUsableItem(); this.nextItemAt = now + GAME.itemSpawnMs; }
    this.player.update(now, this.cursors, delta);
    if (this.run.ended) return;
    for (const target of combatTargets(this)) target.update();
    for (const bomb of [...this.bombs.getChildren()]) {
      if (now >= bomb.expiresAt) this.explodeBomb(bomb);
      if (this.run.ended) return;
    }
    for (const group of [this.bullets, this.weapons, this.usableItems, this.exps]) {
      for (const object of [...group.getChildren()]) {
        if (now >= object.expiresAt) object.destroy();
      }
    }
    for (const exp of this.exps.getChildren()) {
      if (Math.hypot(exp.x - this.player.x, exp.y - this.player.y) < GAME.pickupRadius)
        this.physics.moveToObject(exp, this.player, 300);
    }
    this.updateHud();
  }
  updateHud() {
    const minute = Math.min(GAME.overtimeLimit, this.remainingMinutes);
    this.statusText.setText(`퇴근 시간: ${19 + Math.floor(minute / 60)}:${String(minute % 60).padStart(2, '0')}`);
    const remaining = Math.ceil(this.run.remainingSeconds);
    this.timerText.setText(`남은 시간: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')} · ESC 일시정지`);
    if (!this.hudDirty) return;
    this.hudDirty = false;
    this.hudNodes.forEach(node => node.destroy());
    this.hudNodes = [];
    const x = this.scale.width - 255;
    const y = this.scale.height - 75;
    const text = (tx, ty, value, color = '#fff') => {
      const node = this.add.text(tx, ty, value, { fontSize: '15px', color, stroke: '#000', strokeThickness: 3 }).setScrollFactor(0).setDepth(100);
      this.hudNodes.push(node);
    };
    Object.entries(this.player.obtainedWeapons).forEach(([key, weapon], i) => {
      const icon = this.add.image(x + i * 80 + 22, y, key).setDisplaySize(36, 36).setScrollFactor(0).setDepth(100);
      this.hudNodes.push(icon);
      text(x + i * 80, y + 22, weapon.level === GAME.maxWeaponLevel ? 'MAX' : `Lv.${weapon.level}`, '#ffff66');
    });
    text(x, y - 72, '휴가신청서 · Space / Q / E');
    this.playerUsableItems.forEach((_, i) => {
      const icon = this.add.image(x + i * 65 + 22, y - 38, 'skill').setDisplaySize(28, 28).setScrollFactor(0).setDepth(100);
      this.hudNodes.push(icon);
    });
  }
  finishRun(scene, data) {
    if (this.run.ended) return;
    this.run.ended = true;
    this.physics.world.pause();
    this.scene.start(scene, data);
  }
  handleBulletMonsterCollision(bullet, target) {
    if (this.run.paused || !bullet.active || !target.active) return;
    const damage = bullet.damage;
    bullet.destroy();
    target.takeDamage(damage);
  }
  handlePlayerHit(player, target) {
    if (this.run.paused || player.isInvincible || !target.active) return;
    this.remainingMinutes += target.damage;
    player.setInvincible();
    if (this.remainingMinutes >= GAME.overtimeLimit) this.finishRun('GameOverScene', { reason: 'overworked' });
  }
  explodeBomb(bomb) {
    if (!bomb.active || this.run.paused) return;
    const { x, y, damage, explosionRadius } = bomb;
    bomb.destroy();
    for (const target of combatTargets(this)) {
      if (targetInRange(x, y, explosionRadius, target)) target.takeDamage(damage);
      if (this.run.ended) return;
    }
    const effect = this.add.circle(x, y, explosionRadius, 0xff7755, 0.25).setStrokeStyle(2, 0xff7755);
    this.tweens.add({ targets: effect, alpha: 0, duration: 300, onComplete: () => effect.destroy() });
  }
  handleExpPickup(player, exp) {
    if (this.run.paused || !exp.active) return;
    const amount = exp.amount;
    exp.destroy();
    player.gainExp(amount);
  }
  queueWeaponUpgrades(count) { this.pendingUpgrades += count; }
  showWeaponUpgradeModal() {
    const available = Object.values(this.player.obtainedWeapons).some(weapon => weapon.level < GAME.maxWeaponLevel);
    if (!available) { this.pendingUpgrades = 0; return; }
    this.pendingUpgrades--;
    this.setPaused('upgrade', true);
    this.weaponUpgradeModalInstance = new WeaponUpgradeModal(this, this.player, () => {
      this.weaponUpgradeModalInstance = null;
      this.hudDirty = true;
      this.setPaused('upgrade', false);
    });
  }
  handleWeaponPickup(player, drop) {
    if (this.run.paused || !drop.active) return;
    const key = drop.weaponKey;
    if (player.obtainedWeapons[key]) { drop.destroy(); return; }
    if (Object.keys(player.obtainedWeapons).length >= GAME.maxWeapons) {
      this.setPaused('swap', true);
      this.weaponSwapModalInstance = new WeaponSwapModal(this, player, key, drop, () => {
        this.weaponSwapModalInstance = null;
        this.hudDirty = true;
        this.setPaused('swap', false);
      });
    } else { player.obtainWeapon(key); drop.destroy(); }
  }
  handleUsableItemPickup(player, item) {
    if (this.run.paused || !item.active || this.playerUsableItems.length >= GAME.maxItems) return;
    this.playerUsableItems.push(new Skill(this, player));
    item.destroy();
    this.hudDirty = true;
  }
  useUsableItem(index) {
    if (this.run.paused || !this.playerUsableItems[index]) return;
    if (this.playerUsableItems[index].use()) {
      this.playerUsableItems.splice(index, 1);
      this.hudDirty = true;
    }
  }
  spawnRandomUsableItem() {
    if (this.usableItems.countActive(true) >= 3) return;
    const pos = findSpawnPosition(this, this.player, 180);
    this.usableItems.add(new DroppedUsableItem(this, pos.x, pos.y));
  }
  startBossChatSequence() {
    if (this.bossSpawned || this.isChattingWithKim) return;
    this.isChattingWithKim = true;
    this.setPaused('chat', true);
    this.input.keyboard.enabled = false;
    this.input.keyboard.disableGlobalCapture();
    const bg = this.add.rectangle(this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height, 0x000000, 0.7).setScrollFactor(0).setDepth(2000);
    const form = this.add.dom(this.scale.width / 2, this.scale.height / 2).createFromHTML(`
      <div id="chat-form">
        <div id="chat-heading"><img src="${assetUrl('daeri.png')}" alt="거래처 김대리">
          <span>거래처 김대리${GUEST_MODE ? ' · 기본 대화' : ''}</span><button name="leaveButton">보스 만나기</button></div>
        <div id="chatLog" aria-live="polite"></div>
        <div id="input-container"><input type="text" name="playerInput" maxlength="500" aria-label="김대리에게 할 말"
          placeholder="할 말을 입력하세요..."><button name="sendButton">전송</button></div>
      </div>`).setScrollFactor(0).setDepth(2001);
    this.chatUIElements = [bg, form];
    this.chatFormComponent = form;
    const submit = () => {
      const input = form.getChildByName('playerInput');
      if (!this.chatRequestPending && input.value.trim()) { this.handlePlayerMessage(input.value); input.value = ''; }
    };
    form.addListener('click');
    form.on('click', event => {
      if (event.target.name === 'leaveButton') this.endChatAndSpawnBoss();
      if (event.target.name === 'sendButton') submit();
    });
    const input = form.getChildByName('playerInput');
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); submit(); }
    });
    this.appendMessageToLog('김대리: 안녕하세요. 대화는 최대 10번입니다. 준비되면 “가볼게요”라고 말씀해 주세요.');
    input.focus();
  }
  appendMessageToLog(message) {
    const log = this.chatFormComponent?.getChildByID('chatLog');
    if (!log) return;
    const line = document.createElement('p');
    line.textContent = message;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }
  async handlePlayerMessage(message) {
    message = message.trim().slice(0, 500);
    if (!message || !this.isChattingWithKim || this.chatRequestPending) return;
    if (/가볼게요|가보겠습니다|그만/.test(message)) { this.endChatAndSpawnBoss(); return; }
    const runId = this.runId;
    this.chatRequestPending = true;
    this.appendMessageToLog(`나: ${message}`);
    this.chatAbort = new AbortController();
    try {
      const data = GUEST_MODE ? getGuestReply(message) : await apiRequest('/chat', {
        method: 'POST', body: { message, history: this.chatHistory }, signal: this.chatAbort.signal,
      });
      if (this.runId !== runId || !this.isChattingWithKim || this.run.ended) return;
      if (typeof data.response !== 'string' || !Number.isFinite(data.moodChange)) throw new Error('대화 응답 형식 오류');
      const moodChange = clamp(Math.round(data.moodChange), -10, 10);
      this.kimDaeRiMood = clamp(this.kimDaeRiMood + moodChange, -50, 50);
      this.chatCount++;
      this.chatHistory.push({ role: 'user', content: message }, { role: 'model', content: data.response });
      this.appendMessageToLog(`김대리: ${data.response}`);
      this.appendMessageToLog(`[기분 ${this.kimDaeRiMood} · 남은 대화 ${GAME.maxChatCount - this.chatCount}회]`);
      if (this.chatCount >= GAME.maxChatCount) this.endChatAndSpawnBoss();
    } catch (error) {
      if (this.runId === runId && this.isChattingWithKim)
        this.appendMessageToLog('[시스템] 대화에 연결하지 못했습니다. 다시 시도하거나 보스 만나기를 눌러주세요.');
    } finally {
      if (this.runId === runId) this.chatRequestPending = false;
    }
  }
  endChatAndSpawnBoss() {
    if (!this.isChattingWithKim || this.run.ended) return;
    this.isChattingWithKim = false;
    this.chatAbort?.abort();
    this.chatUIElements.forEach(node => node.destroy());
    this.chatUIElements = [];
    this.chatFormComponent = null;
    this.input.keyboard.enabled = true;
    this.input.keyboard.enableGlobalCapture();
    this.input.keyboard.resetKeys();
    const pos = findSpawnPosition(this, this.player, 300);
    this.bossGroup.add(new Boss(this, pos.x, pos.y, this.player, bossStats(this.kimDaeRiMood)));
    this.bossSpawned = true;
    this.nextSpawnAt = this.run.elapsedMs + spawnInterval(this.run.elapsedMs, true);
    this.setPaused('chat', false);
  }
}
