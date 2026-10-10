import { RHYTHMS } from "../music/rhythms";
import { TIMBRES } from "../music/timbres";
import type {
  ChordDefinition,
  ChordDuration,
  EngineState,
  MixerVolumes,
  RhythmDefinition,
  TimbreName,
} from "../music/types";

type EngineListener = (state: EngineState) => void;

const LOOK_AHEAD_SECONDS = 0.12;
const SCHEDULER_INTERVAL_MS = 25;

function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private drumsGain: GainNode | null = null;
  private bassGain: GainNode | null = null;
  private chordsGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private schedulerHandle: number | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  private listeners = new Set<EngineListener>();
  private rhythm: RhythmDefinition = RHYTHMS[0];
  private state: EngineState;

  constructor(initialChord: ChordDefinition) {
    this.state = {
      playing: false,
      currentStep: -1,
      tempo: 100,
      rhythmId: this.rhythm.id,
      chord: initialChord,
      volumes: { master: 0.8, drums: 0.8, bass: 0.7, chords: 0.65 },
      bassTimbre: "bass",
      chordTimbre: "piano",
      chordDuration: "auto",
    };
  }

  subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  getState(): EngineState {
    return {
      ...this.state,
      volumes: { ...this.state.volumes },
    };
  }

  setTempo(tempo: number): void {
    this.state.tempo = Math.max(40, Math.min(220, tempo));
    this.notify();
  }

  setRhythm(rhythm: RhythmDefinition): void {
    this.rhythm = rhythm;
    this.state.rhythmId = rhythm.id;
    this.currentStep %= rhythm.steps;
    this.notify();
  }

  setChord(chord: ChordDefinition): void {
    this.state.chord = chord;
    this.notify();
  }

  setTimbre(kind: "bassTimbre" | "chordTimbre", timbre: TimbreName): void {
    this.state[kind] = timbre;
    this.notify();
  }

  setChordDuration(duration: ChordDuration): void {
    this.state.chordDuration = duration;
    this.notify();
  }

  setVolume(kind: keyof MixerVolumes, value: number): void {
    this.state.volumes[kind] = Math.max(0, Math.min(1, value));
    const gain = {
      master: this.masterGain,
      drums: this.drumsGain,
      bass: this.bassGain,
      chords: this.chordsGain,
    }[kind];
    if (gain && this.context) {
      gain.gain.setTargetAtTime(this.state.volumes[kind], this.context.currentTime, 0.01);
    }
    this.notify();
  }

  async start(): Promise<void> {
    await this.ensureAudio();
    if (!this.context || this.state.playing) return;
    await this.context.resume();
    this.state.playing = true;
    this.currentStep = 0;
    this.nextNoteTime = this.context.currentTime + 0.05;
    this.notify();
    this.schedulerHandle = window.setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
    this.schedule();
  }

  stop(): void {
    if (this.schedulerHandle !== null) {
      window.clearInterval(this.schedulerHandle);
      this.schedulerHandle = null;
    }
    this.state.playing = false;
    this.state.currentStep = -1;
    this.notify();
  }

  async toggle(): Promise<void> {
    if (this.state.playing) this.stop();
    else await this.start();
  }

  async triggerChord(): Promise<void> {
    await this.ensureAudio();
    if (!this.context) return;
    await this.context.resume();
    this.playChord(this.state.chord, this.context.currentTime + 0.01, 0.8);
  }

  private async ensureAudio(): Promise<void> {
    if (this.context) return;
    const AudioContextConstructor = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) throw new Error("Este navegador não suporta Web Audio API.");

    this.context = new AudioContextConstructor();
    this.masterGain = this.context.createGain();
    this.drumsGain = this.context.createGain();
    this.bassGain = this.context.createGain();
    this.chordsGain = this.context.createGain();
    this.masterGain.gain.value = this.state.volumes.master;
    this.drumsGain.gain.value = this.state.volumes.drums;
    this.bassGain.gain.value = this.state.volumes.bass;
    this.chordsGain.gain.value = this.state.volumes.chords;
    this.drumsGain.connect(this.masterGain);
    this.bassGain.connect(this.masterGain);
    this.chordsGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
    this.noiseBuffer = this.createNoiseBuffer();
  }

  private schedule(): void {
    if (!this.context || !this.state.playing) return;
    while (this.nextNoteTime < this.context.currentTime + LOOK_AHEAD_SECONDS) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += this.stepDuration;
      this.currentStep = (this.currentStep + 1) % this.rhythm.steps;
    }
  }

  private get stepDuration(): number {
    return 60 / this.state.tempo / 4;
  }

  private scheduleStep(step: number, when: number): void {
    this.state.currentStep = step;
    this.notify();
    const drum = this.rhythm.drum;
    if (drum.kick?.includes(step)) this.playKick(when);
    if (drum.snare?.includes(step)) this.playSnare(when);
    if (drum.hat?.includes(step)) this.playHat(when, false);
    if (drum.openHat?.includes(step)) this.playHat(when, true);

    for (const hit of this.rhythm.bass) {
      if (hit.step === step) {
        const semitone = hit.note === "root" ? 0 : hit.note === "fifth" ? 7 : 12;
        const midi = 36 + this.state.chord.root + semitone;
        this.playBass(midiToFrequency(midi), when, hit.duration * this.stepDuration * 0.9);
      }
    }

    for (const hit of this.rhythm.chord) {
      if (hit.step === step) {
        this.playChord(this.state.chord, when, this.getChordDuration(hit.duration));
      }
    }
  }

  private getChordDuration(patternDuration: number): number {
    if (this.state.chordDuration === "auto") return patternDuration * this.stepDuration;
    if (this.state.chordDuration === "beat") return 4 * this.stepDuration;
    if (this.state.chordDuration === "halfBar") return (this.rhythm.steps / 2) * this.stepDuration;
    return this.rhythm.steps * this.stepDuration;
  }

  private playBass(frequency: number, when: number, duration: number): void {
    const timbre = TIMBRES[this.state.bassTimbre];
    this.playTone(frequency, when, duration, timbre, this.bassGain, 0.22);
  }

  private playChord(chord: ChordDefinition, when: number, duration: number): void {
    const timbre = TIMBRES[this.state.chordTimbre];
    const intervals = chord.quality === "major"
      ? [0, 4, 7]
      : chord.quality === "minor"
        ? [0, 3, 7]
        : [0, 3, 6];
    intervals.forEach((interval, index) => {
      const midi = 48 + chord.root + interval + (index === 2 ? 12 : 0);
      this.playTone(
        midiToFrequency(midi),
        when + index * 0.012,
        duration,
        timbre,
        this.chordsGain,
        0.12,
      );
    });
  }

  private playTone(
    frequency: number,
    when: number,
    duration: number,
    timbre: typeof TIMBRES[keyof typeof TIMBRES],
    output: GainNode | null,
    level: number,
  ): void {
    if (!this.context || !output) return;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const safeWhen = Math.max(when, this.context.currentTime + 0.002);
    const safeDuration = Math.max(0.04, duration);
    const end = safeWhen + safeDuration;
    const attack = Math.min(timbre.attack, safeDuration * 0.5);
    const peak = level * timbre.brightness;

    oscillator.type = timbre.waveform;
    oscillator.frequency.setValueAtTime(frequency, safeWhen);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(timbre.lowpass, safeWhen);
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, safeWhen);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), safeWhen + attack);
    gain.gain.setValueAtTime(Math.max(0.001, peak), end);
    gain.gain.exponentialRampToValueAtTime(0.0001, end + timbre.release);

    oscillator.connect(filter).connect(gain).connect(output);
    oscillator.start(safeWhen);
    oscillator.stop(end + timbre.release + 0.02);
  }

  private playKick(when: number): void {
    if (!this.context || !this.drumsGain) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const safeWhen = Math.max(when, this.context.currentTime + 0.002);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(145, safeWhen);
    oscillator.frequency.exponentialRampToValueAtTime(48, safeWhen + 0.12);
    gain.gain.setValueAtTime(0.0001, safeWhen);
    gain.gain.exponentialRampToValueAtTime(0.7, safeWhen + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, safeWhen + 0.22);
    oscillator.connect(gain).connect(this.drumsGain);
    oscillator.start(safeWhen);
    oscillator.stop(safeWhen + 0.24);
  }

  private playSnare(when: number): void {
    if (!this.context || !this.drumsGain || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const safeWhen = Math.max(when, this.context.currentTime + 0.002);
    source.buffer = this.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    gain.gain.setValueAtTime(0.0001, safeWhen);
    gain.gain.exponentialRampToValueAtTime(0.35, safeWhen + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, safeWhen + 0.14);
    source.connect(filter).connect(gain).connect(this.drumsGain);
    source.start(safeWhen);
    source.stop(safeWhen + 0.16);
  }

  private playHat(when: number, open: boolean): void {
    if (!this.context || !this.drumsGain || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const safeWhen = Math.max(when, this.context.currentTime + 0.002);
    const duration = open ? 0.2 : 0.055;
    source.buffer = this.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = 5000;
    gain.gain.setValueAtTime(0.0001, safeWhen);
    gain.gain.exponentialRampToValueAtTime(open ? 0.13 : 0.08, safeWhen + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, safeWhen + duration);
    source.connect(filter).connect(gain).connect(this.drumsGain);
    source.start(safeWhen);
    source.stop(safeWhen + duration + 0.02);
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.context) throw new Error("AudioContext ainda não foi criado.");
    const buffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private notify(): void {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
