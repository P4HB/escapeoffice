import { apiRequest } from '../services/api.js';

export default class AccountScene extends Phaser.Scene {
  constructor(key, register) { super({ key }); this.register = register; }
  create() {
    const register = this.register;
    this.add.text(this.scale.width / 2, 100, register ? '회원가입' : '탈출 오피스 · 로그인', {
      fontSize: '32px', color: '#ffe477',
    }).setOrigin(0.5);
    const form = this.add.dom(this.scale.width / 2, this.scale.height / 2).createFromHTML(`
      <form style="width:320px;display:flex;flex-direction:column;gap:14px;color:white;font:16px sans-serif">
        <label>아이디 <input name="user_id" required minlength="3" maxlength="50" pattern="[A-Za-z0-9_-]{3,50}"
          autocomplete="username" style="box-sizing:border-box;width:100%;padding:10px"></label>
        <label>비밀번호 <input name="password" type="password" required ${register ? 'minlength="8"' : ''} maxlength="128"
          autocomplete="${register ? 'new-password' : 'current-password'}" style="box-sizing:border-box;width:100%;padding:10px"></label>
        ${register ? '<label>닉네임 <input name="nickname" required maxlength="50" style="box-sizing:border-box;width:100%;padding:10px"></label>' : ''}
        <button name="submit" style="padding:12px">${register ? '회원가입' : '로그인'}</button>
        <button type="button" name="back" style="padding:10px">${register ? '로그인으로 돌아가기' : '새 계정 만들기'}</button>
        <p id="account-status" role="status" style="margin:0;color:#ffbb99;min-height:40px"></p>
      </form>`);
    const element = form.node.querySelector('form') || form.node;
    const controller = new AbortController();
    let pending = false;
    element.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending) return;
      pending = true;
      const submit = form.getChildByName('submit');
      submit.disabled = true;
      try {
        const body = Object.fromEntries(new FormData(element));
        await apiRequest(register ? '/register' : '/login', { method: 'POST', body, signal: controller.signal });
        if (this.sys.isActive()) this.scene.start(register ? 'LoginScene' : 'MenuScene');
      } catch (error) {
        if (this.sys.isActive()) form.getChildByID('account-status').textContent = error.message;
      } finally {
        pending = false;
        if (this.sys.isActive()) submit.disabled = false;
      }
    });
    form.getChildByName('back').addEventListener('click', () => this.scene.start(register ? 'LoginScene' : 'RegisterScene'));
    this.input.keyboard.disableGlobalCapture();
    this.events.once('shutdown', () => { controller.abort(); this.input.keyboard.enableGlobalCapture(); });
  }
}
