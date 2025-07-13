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

    // ✏️ 입력창 DOM 생성 (기존 createInput 전부 제거)
    this.createRegisterForm();

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

  // ✅ 회원가입 입력 폼 DOM 요소 생성
  createRegisterForm() {
    const wrapper = document.createElement('div');
    wrapper.id = 'register-wrapper';
    wrapper.innerHTML = `
      <style>
        #register-wrapper {
          position: fixed;
          top: 120px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        #register-wrapper input {
          width: 80vw;            /* 📱 반응형 너비 */
          max-width: 300px;       /* 💻 최대 너비 제한 */
          padding: 10px;
          font-size: 16px;
          border-radius: 5px;
          border: none;
          box-sizing: border-box; /* ✅ 패딩 포함 너비 계산 */
        }
      </style>

      <input type="text" id="user_id" placeholder="아이디" />
      <input type="password" id="password" placeholder="비밀번호" />
      <input type="text" id="nickname" placeholder="닉네임" />
    `;
    document.body.appendChild(wrapper);
  }

  // 🧹 씬 전환 시 DOM 정리
  shutdown() {
    const wrapper = document.getElementById('register-wrapper');
    if (wrapper) wrapper.remove();
  }

  onShutdown() { this.shutdown(); }
  onDestroy() { this.shutdown(); }
}
