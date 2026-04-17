const Phaser = window.Phaser;
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';
import HowToPlayScene from './scenes/HowToPlayScene';
import UsernameScene from './scenes/UsernameScene';
import UpgradeScene from './scenes/UpgradeScene';
import { isMobile } from './utils/deviceDetect';

export function initGame(containerId) {
  const mobile = isMobile();

  const config = {
    type: Phaser.AUTO,
    parent: containerId,
    backgroundColor: '#0a0a1a',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 600,
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    input: {
      activePointers: mobile ? 3 : 1,
    },
    // Store platform on game registry so scenes can read it
    callbacks: {
      postBoot: (game) => {
        game.registry.set('isMobile', mobile);
        game.registry.set('platform', mobile ? 'mobile' : 'pc');
      },
    },
    scene: [BootScene, UsernameScene, MenuScene, HowToPlayScene, GameScene, GameOverScene, UpgradeScene],
  };

  return new Phaser.Game(config);
}