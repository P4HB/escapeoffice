// @ts-nocheck
import { GUEST_MODE } from '../services/gameMode.js';
import { loadGuestRecords } from '../services/guestGame.js';
import { apiRequest } from '../services/api.js';
export default class RankingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RankingScene' });
  }

  create() {
    const { width } = this.scale;

    this.cameras.main.setBackgroundColor('#1c1c1c');

    this.add.text(width / 2, 50, GUEST_MODE ? '🏆 내 기록 TOP 10 🏆' : '🏆 랭킹 TOP 10 🏆', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial Black',
    }).setOrigin(0.5);

    // 🧠 랭킹 데이터를 서버에서 불러오기
    const records = GUEST_MODE
      ? Promise.resolve(loadGuestRecords().map(record => ({ ...record, nickname: '게스트' })))
      : apiRequest('/ranking');
    if (GUEST_MODE) {
      this.add.text(width / 2, 85, '이 브라우저에 저장된 클리어 기록 · 빠른 순서', {
        fontSize: '16px', fill: '#aaaaaa',
      }).setOrigin(0.5);
    }
    records
      .then(ranking => {
        if (!this.sys.isActive()) return;
        if (!Array.isArray(ranking)) {
          throw new Error('랭킹 데이터가 배열이 아님');
        }
        if (ranking.length === 0) {
          this.add.text(width / 2, 200, '아직 클리어 기록이 없습니다. 첫 퇴근에 도전하세요!', {
            fontSize: '20px', fill: '#ffffff',
          }).setOrigin(0.5);
        }

        // ✨ 순위별로 출력
        ranking.slice(0, 10).forEach((entry, index) => {
          const rankY = 120 + index * 30;
          const nickname = entry.nickname || entry.user_id || '익명';
          const score = entry.score?.toFixed(2) || '-';

          this.add.text(width / 2, rankY, `${index + 1}. ${nickname} - ${score}초`, {
            fontSize: '20px',
            fill: '#ffff66',
            fontFamily: 'Arial',
          }).setOrigin(0.5);
        });
      })
      .catch(err => {
        if (!this.sys.isActive()) return;
        console.error('❌ 랭킹 로딩 실패:', err);
        this.add.text(width / 2, 200, '랭킹 정보를 불러올 수 없습니다 😥', {
          fontSize: '20px',
          fill: '#ff6666',
        }).setOrigin(0.5);
      });

    // ⌨️ 스페이스바로 뒤로가기
    this.add.text(width / 2, 500, '[스페이스바] 누르면 뒤로 가기', {
      fontSize: '18px',
      fill: '#aaa',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
  }
}
