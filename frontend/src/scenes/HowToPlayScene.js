export default class HowToPlayScene extends Phaser.Scene {
    constructor() {
      super({ key: 'HowToPlayScene' });
    }
  
    create() {
      const { width, height } = this.scale;
  
      // 배경
      this.add.rectangle(0, 0, width, height, 0x000000, 0.85)
        .setOrigin(0)
        .setScrollFactor(0);
  
      // 제목
      this.add.text(width / 2, 40, '❓ 게임 설명', {
        fontSize: '28px',
        fill: '#ffff00',
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
  
      // 본문 텍스트
      const instructions = `
  당신은 몰입컴퍼니에 재직중입니다. 
  당신의 목표는 5분안에 거래처 부장을 무찔러 몰입컴퍼니 사장님을 만족시키고 퇴근하는 것입니다.
  현재 시간은 19시 00분입니다. 빨리 퇴근하세요!

  맵을 돌아다니면서 퇴근을 도와줄 무기를 수집하세요!
  무기를 이용해서 퇴근을 방해하는 업무와 직장 상사를 처리하세요!
  업무를 처리했을 때 나오는 경험치로 레벨업해서 무기를 강화하세요!

  업무와 직장상사와 닿지않도록 주의 하세요! 닿을시 퇴근시간이 10분씩 증가합니다.
  퇴근시간이 20시 00분이 되면 당신은 퇴근할수 없습니다! 야근 확정입니다!
  
  레벨 15에 도달하여 거래처 김대리와 대화하세요!
  김대리와의 대화가 끝나면 거래처 사장이 나타납니다. 그를 처치하세요!
  김대리와의 대화 내용에 따라 거래처 사장의 기분이 달라집니다.
  거래처 사장의 기분이 나쁠수록 거래처 사장은 더 강력해집니다!
      `;
  
      const howToText = this.add.text(width / 2, 100, instructions, {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        wordWrap: { width: width - 100 },
        align: 'left'
      }).setOrigin(0.5, 0);
  
      // [뒤로가기] 버튼
      const backBtn = this.add.text(width / 2, height - 50, '[🔙 뒤로가기]', {
        fontSize: '20px',
        fill: '#00ffff',
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setInteractive();
  
      backBtn.on('pointerdown', () => {
        this.scene.start('MenuScene');
      });
    }
  }