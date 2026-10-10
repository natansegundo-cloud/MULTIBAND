import type { RhythmDefinition } from "./types";

export const RHYTHMS: RhythmDefinition[] = [
  {
    id: "forro",
    name: "Forró",
    description: "Levada tradicional de forró",
    steps: 16,
    drum: {
      kick: [0, 6, 8, 14],
      snare: [4, 12],
      hat: [2, 6, 10, 14],
      openHat: [7, 15],
    },
    bass: [
      { step: 0, note: "root", duration: 2 },
      { step: 6, note: "fifth", duration: 2 },
      { step: 8, note: "root", duration: 2 },
      { step: 14, note: "fifth", duration: 2 },
    ],
    chord: [{ step: 0, duration: 4 }, { step: 8, duration: 4 }],
  },
  {
    id: "baiao",
    name: "Baião",
    description: "Baião marcado para testar a banda",
    steps: 16,
    drum: {
      kick: [0, 3, 6, 8, 11, 14],
      snare: [4, 12],
      hat: [2, 6, 10, 14],
    },
    bass: [
      { step: 0, note: "root", duration: 2 },
      { step: 3, note: "fifth", duration: 2 },
      { step: 6, note: "root", duration: 2 },
      { step: 8, note: "root", duration: 2 },
      { step: 11, note: "fifth", duration: 2 },
      { step: 14, note: "root", duration: 2 },
    ],
    chord: [{ step: 0, duration: 3 }, { step: 6, duration: 2 }, { step: 8, duration: 3 }, { step: 14, duration: 2 }],
  },
  {
    id: "seresta",
    name: "Seresta",
    description: "Acompanhamento lento e cantado",
    steps: 16,
    drum: {
      kick: [0, 8],
      snare: [4, 12],
      hat: [0, 4, 8, 12],
    },
    bass: [
      { step: 0, note: "root", duration: 6 },
      { step: 8, note: "fifth", duration: 6 },
    ],
    chord: [{ step: 0, duration: 8 }, { step: 8, duration: 8 }],
  },
  {
    id: "reggae",
    name: "Reggae",
    description: "Contratempo leve e marcado",
    steps: 16,
    drum: {
      kick: [0, 10],
      snare: [8],
      hat: [2, 6, 10, 14],
    },
    bass: [
      { step: 0, note: "root", duration: 3 },
      { step: 6, note: "fifth", duration: 2 },
      { step: 10, note: "root", duration: 3 },
    ],
    chord: [{ step: 4, duration: 2 }, { step: 12, duration: 2 }],
  },
  {
    id: "sertanejo",
    name: "Sertanejo",
    description: "Levada simples de sertanejo",
    steps: 16,
    drum: {
      kick: [0, 6, 8, 14],
      snare: [4, 12],
      hat: [0, 2, 4, 6, 8, 10, 12, 14],
      openHat: [14],
    },
    bass: [
      { step: 0, note: "root", duration: 2 },
      { step: 6, note: "fifth", duration: 2 },
      { step: 8, note: "root", duration: 2 },
      { step: 14, note: "fifth", duration: 2 },
    ],
    chord: [{ step: 0, duration: 4 }, { step: 4, duration: 4 }, { step: 8, duration: 4 }, { step: 12, duration: 4 }],
  },
];
