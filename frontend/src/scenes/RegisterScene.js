export default class RegisterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RegisterScene' });
  }

  create() {
    const { width } = this.scale;

    // 🧾 타이틀
    this.add.text(width / 2, 50, '📝 회원가입', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // ✏️ 입력창 생성
    this.createInput(width / 2 - 100, 120, 'user_id', '아이디');
    this.createInput(width / 2 - 100, 180, 'password', '비밀번호');
    this.createInput(width / 2 - 100, 240, 'nickname', '닉네임');

    // ✅ [회원가입 완료] 버튼
    const registerBtn = this.add.text(width / 2, 310, '[✅ 회원가입 완료]', {
      fontSize: '20px',
      fill: '#00ff00'
    }).setOrigin(0.5).setInteractive();

    registerBtn.on('pointerdown', () => {
      const user_id = document.getElementById('user_id')?.value;
      const password = document.getElementById('password')?.value;
      const nickname = document.getElementById('nickname')?.value;

      fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, password, nickname })
      })
        .then(res => res.json())
        .then(data => {
          if (data.message) {
            alert('✅ 회원가입 성공!');
            this.shutdown();
            this.scene.start('LoginScene');
          } else {
            alert(`❌ 실패: ${data.error}`);
          }
        })
        .catch(() => alert('❌ 서버 오류'));
    });

    // 🔙 [← 뒤로가기] 버튼
    const backBtn = this.add.text(width / 2, 370, '[← 뒤로가기]', {
      fontSize: '18px',
      fill: '#ffaa00'
    }).setOrigin(0.5).setInteractive();

    backBtn.on('pointerdown', () => {
      this.shutdown();
      this.scene.start('LoginScene');
    });
  }

  createInput(x, y, id, placeholder) {
    const input = document.createElement('input');
    input.type = id === 'password' ? 'password' : 'text';
    input.id = id;
    input.placeholder = placeholder;
    input.style.position = 'absolute';
    input.style.left = `${x}px`;
    input.style.top = `${y}px`;
    input.style.width = '200px';
    input.style.fontSize = '18px';
    document.body.appendChild(input);
  }

  shutdown() {
    ['user_id', 'password', 'nickname'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  onShutdown() { this.shutdown(); }
  onDestroy() { this.shutdown(); }
}
