const soundKey = "gonu-sound-enabled";
const bgmKey = "gonu-bgm-enabled";

function preference(key: string, fallback: boolean) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

function savePreference(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

export class AudioManager {
  private effects = new Map<string, HTMLAudioElement>();
  private bgm: HTMLAudioElement | null = null;
  private soundEnabled = preference(soundKey, true);
  private bgmEnabled = preference(bgmKey, false);
  constructor(
    private readonly makeAudio: (() => HTMLAudioElement) | null =
      typeof Audio !== "undefined" && !navigator.userAgent.includes("jsdom")
        ? () => new Audio()
        : null,
  ) {
    for (const name of ["put.mp3", "road-select.wav", "line-drawing.wav"])
      this.effect(name);
  }

  getSoundEnabled() {
    return this.soundEnabled;
  }

  getBgmEnabled() {
    return this.bgmEnabled;
  }

  setSoundEnabled(value: boolean) {
    this.soundEnabled = value;
    savePreference(soundKey, value);
  }

  setBgmEnabled(value: boolean) {
    this.bgmEnabled = value;
    savePreference(bgmKey, value);
    if (!value) this.bgm?.pause();
    else this.startBgm();
  }

  playStone() {
    this.playEffect("put.mp3");
  }

  playRoadHover() {
    this.playEffect("road-select.wav");
  }

  playRoadDraw() {
    this.playEffect("line-drawing.wav");
  }

  beginFromInteraction() {
    if (this.bgmEnabled) this.startBgm();
  }

  private asset(name: string) {
    return `${(import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL}audio/${name}`;
  }

  private playEffect(name: string) {
    if (!this.soundEnabled || !this.makeAudio) return;
    const effect = this.effect(name);
    if (!effect) return;
    try {
      effect.currentTime = 0;
      void effect.play().catch(() => {});
    } catch {}
  }

  private effect(name: string) {
    if (!this.makeAudio) return null;
    let effect = this.effects.get(name);
    if (!effect) {
      effect = this.makeAudio();
      effect.src = this.asset(name);
      effect.preload = "auto";
      this.effects.set(name, effect);
    }
    return effect;
  }

  private startBgm() {
    if (!this.bgmEnabled || !this.makeAudio) return;
    if (!this.bgm) {
      this.bgm = this.makeAudio();
      this.bgm.src = this.asset("bgm.mp3");
      this.bgm.loop = true;
      this.bgm.preload = "auto";
    }
    try {
      void this.bgm.play().catch(() => {});
    } catch {}
  }
}

export const audio = new AudioManager();
