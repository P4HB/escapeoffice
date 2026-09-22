export default class ChoiceModal {
  constructor(scene, title, options, onComplete) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.options = options;
    this.selected = 0;
    this.nodes = [];
    this.closed = false;
    const { width, height } = scene.scale;
    const panelWidth = Math.min(580, width - 30);
    const panelHeight = 100 + options.length * 70;
    const top = (height - panelHeight) / 2;
    this.nodes.push(scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(1000).setInteractive());
    this.nodes.push(scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x242424)
      .setScrollFactor(0).setDepth(1001));
    this.nodes.push(scene.add.text(width / 2, top + 24, title, { fontSize: '22px', color: '#ffe477' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(1002));
    this.rows = options.map((option, i) => {
      const y = top + 85 + i * 70;
      const box = scene.add.rectangle(width / 2, y, panelWidth - 30, 58, 0x3a3a3a)
        .setScrollFactor(0).setDepth(1002).setInteractive({ useHandCursor: true });
      const label = scene.add.text(width / 2, y, option.label, {
        fontSize: '16px', color: '#fff', align: 'center', wordWrap: { width: panelWidth - 45 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);
      box.on('pointerover', () => { this.selected = i; this.highlight(); });
      box.on('pointerdown', () => this.choose(i));
      this.nodes.push(box, label);
      return box;
    });
    this.onKey = event => {
      if (event.repeat) return;
      if (event.code === 'ArrowDown') this.selected = (this.selected + 1) % options.length;
      if (event.code === 'ArrowUp') this.selected = (this.selected + options.length - 1) % options.length;
      if (event.code === 'Enter') this.choose(this.selected);
      this.highlight();
    };
    scene.input.keyboard.on('keydown', this.onKey);
    this.highlight();
  }
  highlight() { if (!this.closed) this.rows.forEach((row, i) => row.setStrokeStyle(i === this.selected ? 3 : 1, i === this.selected ? 0xffdd55 : 0x777777)); }
  choose(index) {
    if (this.closed) return;
    this.options[index].action();
    this.destroy();
    this.onComplete();
  }
  destroy() {
    if (this.closed) return;
    this.closed = true;
    this.scene.input.keyboard.off('keydown', this.onKey);
    this.nodes.forEach(node => node.destroy());
    this.nodes = [];
  }
}
