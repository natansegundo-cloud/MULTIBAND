import type { ChordDefinition } from "./types";

export interface MusicalKey {
  name: string;
  shortName: string;
  semitone: number;
}

export const MUSICAL_KEYS: MusicalKey[] = [
  { name: "Dó", shortName: "C", semitone: 0 },
  { name: "Dó sustenido", shortName: "C#", semitone: 1 },
  { name: "Ré", shortName: "D", semitone: 2 },
  { name: "Ré sustenido", shortName: "D#", semitone: 3 },
  { name: "Mi", shortName: "E", semitone: 4 },
  { name: "Fá", shortName: "F", semitone: 5 },
  { name: "Fá sustenido", shortName: "F#", semitone: 6 },
  { name: "Sol", shortName: "G", semitone: 7 },
  { name: "Sol sustenido", shortName: "G#", semitone: 8 },
  { name: "Lá", shortName: "A", semitone: 9 },
  { name: "Lá sustenido", shortName: "A#", semitone: 10 },
  { name: "Si", shortName: "B", semitone: 11 },
];

const SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];
const SCALE_QUALITIES = ["major", "minor", "minor", "major", "major", "minor", "diminished"] as const;

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function buildChords(keySemitone: number): ChordDefinition[] {
  return SCALE_STEPS.map((step, index) => {
    const root = (keySemitone + step) % 12;
    const quality = SCALE_QUALITIES[index];
    const suffix = quality === "minor" ? "m" : quality === "diminished" ? "dim" : "";
    return {
      symbol: `${NOTE_NAMES[root]}${suffix}`,
      name: `${NOTE_NAMES[root]} ${quality === "major" ? "maior" : quality === "minor" ? "menor" : "diminuto"}`,
      root,
      quality,
      degree: index,
    };
  });
}
