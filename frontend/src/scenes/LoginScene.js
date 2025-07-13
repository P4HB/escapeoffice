export default class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
  }

  create() {
    const { width } = this.scale;

    // 🎯 타이틀
    this.add.text(width / 2, 50, '👔 탈출 오피스 👔', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // 🎯 입력창 생성
    this.createInput(width / 2 - 100, 120, 'user_id', '아이디');
    this.createInput(width / 2 - 100, 180, 'password', '비밀번호');

    // ✅ [로그인] 버튼
    const loginBtn = this.add.text(width / 2, 250, '[✅ 로그인]', {
      fontSize: '20px',
      fill: '#00ff00',
    }).setOrigin(0.5).setInteractive();

    loginBtn.on('pointerdown', () => {
      const user_id = document.getElementById('user_id')?.value;
      const password = document.getElementById('password')?.value;

      fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, password })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('✅ 로그인 성공!');
            this.shutdown();
            this.scene.start('MenuScene');
          } else {
            alert(`❌ 실패: ${data.error}`);
          }
        })
        .catch(() => alert('❌ 서버 오류'));
    });

    // 🔗 [구글로 시작하기] 버튼 (일단 연결은 X)
    const googleBtn = this.add.text(width / 2, 300, '[🔗 구글로 시작하기]', {
      fontSize: '20px',
      fill: '#ffffff',
      backgroundColor: '#db4437',
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5).setInteractive();

    googleBtn.on('pointerdown', () => {
      alert('⚠️ 구글 로그인은 나중에 연결됩니다!');
    });

    // 📝 [회원가입] 버튼
    const registerBtn = this.add.text(width / 2, 350, '[📝 회원가입]', {
      fontSize: '20px',
      fill: '#ffaa00',
    }).setOrigin(0.5).setInteractive();

    registerBtn.on('pointerdown', () => {
      this.shutdown();
      this.scene.start('RegisterScene'); // 회원가입 씬으로 전환
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
    ['user_id', 'password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  onShutdown() { this.shutdown(); }
  onDestroy() { this.shutdown(); }
}
