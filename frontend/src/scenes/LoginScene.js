export default class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
  }

  create() {
    const { width } = this.scale;

    // 타이틀
    this.add.text(width / 2, 50, '👔 탈출 오피스 👔', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // 로그인 입력창
    this.createLoginForm(); // ✅

    // 로그인 버튼
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

             // 👉 여기서 localStorage에 user_id 저장하기!
             localStorage.setItem('user_id', user_id);
            
            this.shutdown();
            this.scene.start('MenuScene');
          } else {
            alert(`❌ 실패: ${data.error}`);
          }
        })
        .catch(() => alert('❌ 서버 오류'));
    });

    // 구글 시작 버튼
    const googleBtn = this.add.text(width / 2, 300, '[🔗 구글로 시작하기]', {
      fontSize: '20px',
      fill: '#ffffff',
      backgroundColor: '#db4437',
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5).setInteractive();

    googleBtn.on('pointerdown', () => {
      alert('⚠️ 구글 로그인은 나중에 연결됩니다!');
    });

    // 회원가입 버튼
    const registerBtn = this.add.text(width / 2, 350, '[📝 회원가입]', {
      fontSize: '20px',
      fill: '#ffaa00',
    }).setOrigin(0.5).setInteractive();

    registerBtn.on('pointerdown', () => {
      this.shutdown();
      this.scene.start('RegisterScene');
    });
    // 게임 설명 버튼

    // 창 크기 바뀔 때 반응형 입력창 조절
    window.addEventListener('resize', this.resizeInputs);
    this.resizeInputs(); // 최초 실행
  }

  // 📌 반응형 입력창 생성
  createLoginForm() {
    const wrapper = document.createElement('div');
    wrapper.id = 'login-wrapper';

    Object.assign(wrapper.style, {
      position: 'fixed',
      top: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      zIndex: 1000
    });

    const userInput = document.createElement('input');
    userInput.id = 'user_id';
    userInput.placeholder = '아이디';

    const passInput = document.createElement('input');
    passInput.id = 'password';
    passInput.type = 'password';
    passInput.placeholder = '비밀번호';

    // 공통 스타일 일부만 미리 지정
    [userInput, passInput].forEach(input => {
      input.style.padding = '8px';
      input.style.fontSize = '16px';
      input.style.boxSizing = 'border-box';
    });

    wrapper.appendChild(userInput);
    wrapper.appendChild(passInput);
    document.body.appendChild(wrapper);
  }

  // 📌 수동으로 사이즈 조절
  resizeInputs = () => {
    const width = Math.min(window.innerWidth * 0.8, 300);
    const inputs = [document.getElementById('user_id'), document.getElementById('password')];
    inputs.forEach(input => {
      if (input) {
        input.style.width = `${width}px`;
      }
    });
  }

  // 정리
  shutdown() {
    const wrapper = document.getElementById('login-wrapper');
    if (wrapper) wrapper.remove();
    window.removeEventListener('resize', this.resizeInputs);
  }

  onShutdown() { this.shutdown(); }
  onDestroy() { this.shutdown(); }
}
