export type Waveform = OscillatorType;
export type TimbreName = "piano" | "organ" | "strings" | "synth" | "bass" | "pluck";
export type ChordQuality = "major" | "minor" | "diminished";
export type DrumVoice = "kick" | "snare" | "hat" | "openHat";
export type ChordDuration = "auto" | "beat" | "halfBar" | "bar";

export interface ChordDefinition {
  symbol: string;
  name: string;
  root: number;
  quality: ChordQuality;
  degree: number;
}

export interface BassHit {
  step: number;
  note: "root" | "fifth" | "octave";
  duration: number;
}

export interface ChordHit {
  step: number;
  duration: number;
}

export interface RhythmDefinition {
  id: string;
  name: string;
  description: string;
  steps: number;
  drum: Partial<Record<DrumVoice, number[]>>;
  bass: BassHit[];
  chord: ChordHit[];
}

export interface TimbreDefinition {
  name: TimbreName;
  label: string;
  waveform: Waveform;
  lowpass: number;
  attack: number;
  release: number;
  brightness: number;
}

export interface MixerVolumes {
  master: number;
  drums: number;
  bass: number;
  chords: number;
}

export interface EngineState {
  playing: boolean;
  currentStep: number;
  tempo: number;
  rhythmId: string;
  chord: ChordDefinition;
  volumes: MixerVolumes;
  bassTimbre: TimbreName;
  chordTimbre: TimbreName;
  chordDuration: ChordDuration;
}
