import ChoiceModal from './ChoiceModal.js';
import { GAME, WEAPONS, weaponStats } from '../config/balance.js';

export default class WeaponUpgradeModal extends ChoiceModal {
  constructor(scene, player, onComplete) {
    const options = Object.entries(player.obtainedWeapons)
      .filter(([, weapon]) => weapon.level < GAME.maxWeaponLevel)
      .map(([key, weapon]) => ({
        label: `${WEAPONS[key].name} Lv.${weapon.level} → ${weapon.level + 1} · 공격력 ${weapon.damage} → ${weaponStats(key, weapon.level + 1).damage}\n${WEAPONS[key].upgradeText}`,
        action: () => weapon.upgrade(),
      }));
    super(scene, '레벨업! 무기 선택 · ↑↓ / Enter', options, onComplete);
  }
}
