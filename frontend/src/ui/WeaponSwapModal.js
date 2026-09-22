import ChoiceModal from './ChoiceModal.js';
import { WEAPONS } from '../config/balance.js';

export default class WeaponSwapModal extends ChoiceModal {
  constructor(scene, player, newKey, drop, onComplete) {
    const options = Object.entries(player.obtainedWeapons).map(([key, weapon]) => ({
      label: `${WEAPONS[key].name} Lv.${weapon.level} → ${WEAPONS[newKey].name} Lv.1`,
      action: () => { player.removeWeapon(key); player.obtainWeapon(newKey); drop.destroy(); },
    }));
    options.push({ label: '교체하지 않기', action: () => drop.destroy() });
    super(scene, `${WEAPONS[newKey].name} 획득 · 교체할 무기 선택`, options, onComplete);
  }
}
