import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'chrome' : undefined });
for (const seed of [11, 42, 97]) {
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');
 await page.evaluate(async()=>window.testGame=(await import(document.querySelector('script[src*="main.js"]').src)).game);
 await page.waitForFunction(()=>window.testGame.scene.isActive('MenuScene'));
 await page.keyboard.press('Space');
 await page.waitForFunction(()=>!!window.testGame.scene.getScene('GameScene').player?.active);
 const result=await page.evaluate(seed=>{
  const game=window.testGame; game.loop.stop();
  const scene=game.scene.getScene('GameScene');
  let state=seed; const random=Math.random;
  Math.random=()=>((state=(Math.imul(1664525,state)+1013904223)>>>0)/4294967296);
  let bossAt=null, closestEnemy, nextThink=0, heading=0, upgrades=0;
  let t=performance.now();
  for(let frame=0;frame<19000&&!scene.run.ended;frame++) {
   if(scene.weaponUpgradeModalInstance){
    const keys=Object.entries(scene.player.obtainedWeapons).filter(([,w])=>w.level<6);
    const min=Math.min(...keys.map(([,w])=>w.level));
    scene.weaponUpgradeModalInstance.choose(keys.findIndex(([,w])=>w.level===min)); upgrades++;
   }
   if(scene.weaponSwapModalInstance) scene.weaponSwapModalInstance.choose(scene.weaponSwapModalInstance.options.length-1);
   if(scene.isChattingWithKim){bossAt=scene.run.elapsedMs/1000;scene.kimDaeRiMood=24;scene.endChatAndSpawnBoss();}
   if(scene.run.elapsedMs>=nextThink && !scene.run.paused){
    nextThink=scene.run.elapsedMs+120;
    const player=scene.player;
    const enemies=[...scene.monsters.getChildren(),...scene.bossGroup.getChildren()].filter(e=>e.active);
    const targets=[...scene.weapons.getChildren().filter(w=>Object.keys(player.obtainedWeapons).length<3&&!player.obtainedWeapons[w.weaponKey]),...scene.exps.getChildren()];
    let goal=targets.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
    if(!goal) goal=enemies[0]||{x:768,y:512};
    let vx=goal.x-player.x,vy=goal.y-player.y;
    const mag=Math.hypot(vx,vy)||1; vx/=mag;vy/=mag;
    for(const enemy of enemies){
      const dx=player.x-enemy.x,dy=player.y-enemy.y,d=Math.hypot(dx,dy)||1;
      const avoid=enemy.texture.key==='boss'?120:65;
      if(d<avoid){vx+=dx/d*(avoid-d)/18;vy+=dy/d*(avoid-d)/18;}
    }
    if(player.x<60)vx+=2; if(player.x>1476)vx-=2;
    if(player.y<60)vy+=2; if(player.y>964)vy-=2;
    heading=Math.atan2(vy,vx);
    const dx=Math.cos(heading),dy=Math.sin(heading);
    scene.cursors.left.isDown=dx < -0.35; scene.cursors.right.isDown=dx>0.35;
    scene.cursors.up.isDown=dy < -0.35; scene.cursors.down.isDown=dy>0.35;
    if(enemies.some(e=>Math.hypot(e.x-player.x,e.y-player.y)<70))scene.useUsableItem(0);
   }
   game.headlessStep(t+=1000/60,1000/60);
  }
  Math.random=random;
  return {seed,time:scene.run.elapsedMs/1000,bossAt,level:scene.player.level,overtime:scene.remainingMinutes,
    weapons:Object.fromEntries(Object.entries(scene.player.obtainedWeapons).map(([k,w])=>[k,w.level])),
    bossHP:scene.bossGroup.getChildren()[0]?.hp,ended:scene.run.ended,upgrades};
 },seed);
 console.log(JSON.stringify({...result,errors}));
 await page.close();
}
await browser.close();
