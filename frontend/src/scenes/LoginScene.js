export default class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
  }

  create() {
    const { width } = this.scale;

    // 🎯 타이틀 (Phaser 텍스트)
    this.add.text(width / 2, 50, '👔 탈출 오피스 👔', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // ✅ 로그인 입력창 DOM 컨테이너 생성
    this.createLoginForm();

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

    // 🔗 [구글로 시작하기]
    const googleBtn = this.add.text(width / 2, 300, '[🔗 구글로 시작하기]', {
      fontSize: '20px',
      fill: '#ffffff',
      backgroundColor: '#db4437',
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5).setInteractive();

    googleBtn.on('pointerdown', () => {
      alert('⚠️ 구글 로그인은 나중에 연결됩니다!');
    });

    // 📝 [회원가입]
    const registerBtn = this.add.text(width / 2, 350, '[📝 회원가입]', {
      fontSize: '20px',
      fill: '#ffaa00',
    }).setOrigin(0.5).setInteractive();

    registerBtn.on('pointerdown', () => {
      this.shutdown();
      this.scene.start('RegisterScene');
    });
  }

  // 🧱 로그인 폼 DOM 구조 + 스타일
  createLoginForm() {
    const wrapper = document.createElement('div');
    wrapper.id = 'login-wrapper';
    wrapper.innerHTML = `
      <style>
  #login-wrapper {
    position: fixed;
    top: 120px; /* 👈 로그인 버튼과 시각적으로 맞추기 위해 조정 */
    left: 50%;
    transform: translateX(-50%); /* 👈 수평 가운데만 유지 */
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
</style>
      <input type="text" id="user_id" placeholder="아이디" />
      <input type="password" id="password" placeholder="비밀번호" />
    `;
    document.body.appendChild(wrapper);
  }

  // 🧹 DOM 정리
  shutdown() {
    const wrapper = document.getElementById('login-wrapper');
    if (wrapper) wrapper.remove();
  }

  onShutdown() { this.shutdown(); }
  onDestroy() { this.shutdown(); }
}
