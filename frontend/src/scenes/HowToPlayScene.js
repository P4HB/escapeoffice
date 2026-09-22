import { GAME, MONSTERS, bossStats } from '../config/balance.js';
export default class HowToPlayScene extends Phaser.Scene {
  constructor() { super({ key: 'HowToPlayScene' }); }
  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 50, '탈출 오피스 · 게임 설명', { fontSize: '30px', color: '#ffe477' }).setOrigin(0.5);
    const instructions = [
      `${GAME.durationSeconds / 60}분 안에 레벨 ${GAME.bossLevel}을 달성하고 거래처 사장을 처치하세요.`,
      '방향키로 이동하고 자동으로 공격합니다. 대각선도 같은 속도로 이동합니다.',
      `파일·보고서 접촉 +${MONSTERS.file.damage}분 / 과장 +${MONSTERS.gwajang.damage}분 / 부장 +${MONSTERS.boojang.damage}분`,
      '퇴근 시간이 19:00에서 20:00이 되면 야근 확정입니다.',
      `무기는 최대 ${GAME.maxWeapons}개, 각 ${GAME.maxWeaponLevel}레벨까지 강화합니다. ↑↓ / Enter 또는 클릭으로 선택하세요.`,
      '경험치는 가까이 가면 끌려옵니다. 강한 적일수록 더 많은 경험치를 줍니다.',
      `휴가신청서는 최대 ${GAME.maxItems}개 보관합니다. Space / Q / E로 각각 사용하세요.`,
      `휴가신청서는 주변 일반 적을 ${GAME.itemDurationMs / 1000}초 멈춥니다. 보스에게는 효과가 없습니다.`,
      `김대리에게 예의 바르게 말하면 보스 체력·접촉 피해가 줄어듭니다. 기본 피해는 +${bossStats().damage}분입니다.`,
      '대화는 최대 10번입니다. “가볼게요” 또는 보스 만나기로 바로 진행할 수 있습니다.',
      '강화·교체·대화·ESC 일시정지·다른 창으로 전환한 시간은 제한 시간과 기록에 포함되지 않습니다.',
    ].join('\n\n');
    this.add.text(90, 115, instructions, { fontSize: '19px', color: '#fff', wordWrap: { width: width - 180 } });
    const back = this.add.text(width / 2, height - 35, '[뒤로가기]', { fontSize: '22px', color: '#aaddff' })
      .setOrigin(0.5).setInteractive();
    back.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
