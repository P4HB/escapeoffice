import { GUEST_MODE } from '../services/gameMode.js';
import { saveGuestRecord } from '../services/guestGame.js';
import { apiRequest } from '../services/api.js';
import { RULES_VERSION } from '../config/balance.js';

export default class ClearScene extends Phaser.Scene {
  constructor() { super({ key: 'ClearScene' }); }
  create(data) {
    const { width, height } = this.scale;
    const totalTime = data.clearTime;
    this.add.text(width / 2, height / 2 - 100, '퇴근 성공!', { fontSize: '40px', color: '#77ff99' }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 - 35,
      `전투 시간: ${Math.floor(totalTime / 60)}분 ${(totalTime % 60).toFixed(1)}초`,
      { fontSize: '24px', color: '#fff' }).setOrigin(0.5);
    const status = this.add.text(width / 2, height / 2 + 20, '', { fontSize: '18px', color: '#ccc' }).setOrigin(0.5);
    if (GUEST_MODE) {
      status.setText(saveGuestRecord(totalTime) ? '이 브라우저에 기록을 저장했습니다.' : '브라우저 저장 공간에 기록을 저장하지 못했습니다.');
    } else {
      status.setText('기록을 저장하고 있습니다…');
      apiRequest('/score', { method: 'POST', body: { score: totalTime, rules_version: RULES_VERSION } })
        .then(() => { if (this.sys.isActive()) status.setText('개인 최고 기록을 저장했습니다.'); })
        .catch(error => { if (this.sys.isActive()) status.setText(error.message); });
    }
    this.add.text(width / 2, height / 2 + 90, '[스페이스바] 메뉴로 돌아가기',
      { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
  }
}
