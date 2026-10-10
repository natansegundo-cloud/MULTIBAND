import { useEffect, useMemo, useRef, useState } from "react";
import { AudioEngine } from "./audio/AudioEngine";
import { buildChords, MUSICAL_KEYS } from "./music/keys";
import { RHYTHMS } from "./music/rhythms";
import { TIMBRES } from "./music/timbres";
import type { ChordDuration, EngineState, TimbreName } from "./music/types";
import "./styles.css";

const CHORD_KEYS = ["a", "s", "d", "f", "g", "h", "j"];

export default function App() {
  const chords = useMemo(() => buildChords(MUSICAL_KEYS[0].semitone), []);
  const engineRef = useRef<AudioEngine | null>(null);
  if (!engineRef.current) engineRef.current = new AudioEngine(chords[0]);
  const engine = engineRef.current;
  const [state, setState] = useState<EngineState>(engine.getState());
  const [keyIndex, setKeyIndex] = useState(0);
  const [activeChordIndex, setActiveChordIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentChords = useMemo(() => buildChords(MUSICAL_KEYS[keyIndex].semitone), [keyIndex]);

  useEffect(() => engine.subscribe(setState), [engine]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isFormControl = target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
      if (isFormControl) return;
      const pressed = event.key.toLowerCase();
      const chordIndex = CHORD_KEYS.indexOf(pressed);
      if (chordIndex >= 0) {
        event.preventDefault();
        void selectChord(chordIndex);
      }
      if (event.code === "Space") {
        event.preventDefault();
        void togglePlayback();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  async function togglePlayback() {
    try {
      setError(null);
      await engine.toggle();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível iniciar o áudio.");
    }
  }

  async function selectChord(index: number) {
    const chord = currentChords[index];
    if (!chord) return;
    try {
      setError(null);
      setActiveChordIndex(index);
      engine.setChord(chord);
      await engine.triggerChord();
      if (!engine.getState().playing) await engine.start();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível tocar o acorde.");
    }
  }

  function changeKey(nextKeyIndex: number) {
    const nextChords = buildChords(MUSICAL_KEYS[nextKeyIndex].semitone);
    setKeyIndex(nextKeyIndex);
    const nextChord = nextChords[activeChordIndex];
    engine.setChord(nextChord);
  }

  function updateTimbre(kind: "bassTimbre" | "chordTimbre", value: string) {
    engine.setTimbre(kind, value as TimbreName);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">MOTOR MUSICAL V1</p>
          <h1>Multiband</h1>
          <p className="subtitle">Teclado de acordes com banda automática.</p>
        </div>
        <div className={`transport-status ${state.playing ? "is-playing" : ""}`}>
          <span className="status-dot" />
          {state.playing ? "tocando" : "parado"}
        </div>
      </header>

      <section className="control-row" aria-label="Controles principais">
        <button className="transport-button" onClick={() => void togglePlayback()}>
          {state.playing ? "Parar" : "Iniciar"}
        </button>
        <label>
          Ritmo
          <select
            value={state.rhythmId}
            onChange={(event) => engine.setRhythm(RHYTHMS.find((item) => item.id === event.target.value) ?? RHYTHMS[0])}
          >
            {RHYTHMS.map((rhythm) => <option value={rhythm.id} key={rhythm.id}>{rhythm.name}</option>)}
          </select>
        </label>
        <label>
          Tom
          <select value={keyIndex} onChange={(event) => changeKey(Number(event.target.value))}>
            {MUSICAL_KEYS.map((key, index) => <option value={index} key={key.shortName}>{key.name} ({key.shortName})</option>)}
          </select>
        </label>
        <label>
          BPM: {state.tempo}
          <input
            type="range"
            min="40"
            max="220"
            value={state.tempo}
            onChange={(event) => engine.setTempo(Number(event.target.value))}
          />
        </label>
        <label>
          Duração do acorde
          <select value={state.chordDuration} onChange={(event) => engine.setChordDuration(event.target.value as ChordDuration)}>
            <option value="auto">Automática do ritmo</option>
            <option value="beat">1 tempo</option>
            <option value="halfBar">Meio compasso</option>
            <option value="bar">1 compasso</option>
          </select>
        </label>
      </section>

      <section className="chord-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">HARMONIA</p>
            <h2>Acordes em {MUSICAL_KEYS[keyIndex].shortName}</h2>
          </div>
          <span>Use A S D F G H J</span>
        </div>
        <div className="chord-grid">
          {currentChords.map((chord, index) => (
            <button
              className={`chord-button ${activeChordIndex === index ? "is-active" : ""}`}
              key={`${chord.symbol}-${index}`}
              onClick={() => void selectChord(index)}
            >
              <span className="keyboard-key">{CHORD_KEYS[index].toUpperCase()}</span>
              <strong>{chord.symbol}</strong>
              <small>{chord.name}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="sound-controls">
        <label>
          Timbre dos acordes
          <select value={state.chordTimbre} onChange={(event) => updateTimbre("chordTimbre", event.target.value)}>
            {(["piano", "organ", "strings", "synth"] as TimbreName[]).map((timbre) => <option value={timbre} key={timbre}>{TIMBRES[timbre].label}</option>)}
          </select>
        </label>
        <label>
          Timbre do baixo
          <select value={state.bassTimbre} onChange={(event) => updateTimbre("bassTimbre", event.target.value)}>
            {(["bass", "pluck"] as TimbreName[]).map((timbre) => <option value={timbre} key={timbre}>{TIMBRES[timbre].label}</option>)}
          </select>
        </label>
        {(["master", "drums", "bass", "chords"] as const).map((channel) => (
          <label key={channel}>
            Volume {channel === "master" ? "geral" : channel}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.volumes[channel]}
              onChange={(event) => engine.setVolume(channel, Number(event.target.value))}
            />
          </label>
        ))}
      </section>

      <section className="step-monitor" aria-label="Monitor do ritmo">
        <div>
          <span className="eyebrow">PASSO ATUAL</span>
          <strong>{state.currentStep < 0 ? "—" : `${state.currentStep + 1} / ${RHYTHMS.find((item) => item.id === state.rhythmId)?.steps ?? 16}`}</strong>
        </div>
        <div className="step-lights">
          {Array.from({ length: RHYTHMS.find((item) => item.id === state.rhythmId)?.steps ?? 16 }, (_, index) => (
            <span className={index === state.currentStep ? "step-light is-on" : "step-light"} key={index} />
          ))}
        </div>
      </section>

      {error && <p className="error-message" role="alert">{error}</p>}
      <p className="help-text">A barra de espaço inicia ou para. A duração controla quanto cada acorde fica soando; a troca continua seguindo o padrão do ritmo.</p>
    </main>
  );
}
