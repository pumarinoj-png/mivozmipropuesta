import { useState } from 'react';
import { Field, Collapsible, CoachButton, AiOffNotice, ErrorNote, Coach, Reference } from './ui.jsx';
import { useCoach } from '../lib/coachApi.js';
import { EXAMPLE_PITCH, PITCH_FIELDS } from '../data/content.js';
import { countWords, estimateSeconds, formatSeconds, getPresentation } from '../lib/text.js';

export function PitchClock({ text, wpm }) {
  const words = countWords(text);
  const secs = estimateSeconds(words, wpm);
  const pct = Math.min(100, Math.round((secs / 60) * 100));
  const over = secs > 60;
  return (
    <div className={`clock ${over ? 'over' : ''}`}>
      <div className="clock-bar" role="img" aria-label={`Duración estimada ${formatSeconds(secs)} de 60 segundos`}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p>
        <strong>{words}</strong> palabras · <strong>≈ {formatSeconds(secs)}</strong> a {wpm} palabras por minuto
        {over && ' · te pasas de los 60 segundos'}
      </p>
    </div>
  );
}

export default function Stage4({ state, set, ai }) {
  const s = state.s4;
  const { loading, error, run } = useCoach();
  const [tips, setTips] = useState(null);
  const text = getPresentation(s);

  const ask = async () => {
    const r = await run('simplify', { empresa: state.profile.company, presentacion: text });
    if (r) setTips(r);
  };

  const rebuild = () => set('s4', { finalEdited: false, final: '' });

  return (
    <>
      <p className="intro">Una buena presentación corta tiene cuatro piezas. Escribe una frase o dos para cada una, con tus propias palabras.</p>

      <Collapsible title="Ver un ejemplo (coordinación entre áreas)">
        <ul className="pitch-example">
          {EXAMPLE_PITCH.map((p) => (
            <li key={p.key}>
              <span className="pitch-label">{p.label}</span>
              <span>{p.text}</span>
            </li>
          ))}
        </ul>
        <p className="examples-note">Ejemplo ilustrativo, no tu propuesta. Fíjate en la estructura, no en las palabras.</p>
      </Collapsible>

      <Collapsible title="Lo que escribiste antes (de referencia)">
        <Reference label="Mi propuesta">{state.s1.oneLine || state.s1.idea}</Reference>
        <Reference label="Argumento 1">{state.s2.arg1}</Reference>
        <Reference label="Argumento 2">{state.s2.arg2}</Reference>
        <Reference label="Beneficios">{state.s2.benefits}</Reference>
        <Reference label="Mi respuesta a la objeción">{state.s3.response}</Reference>
      </Collapsible>

      {PITCH_FIELDS.map((f) => (
        <Field key={f.key} label={`${f.label}: ${f.question}`} placeholder={f.placeholder} value={s[f.key]} onChange={(v) => set('s4', { [f.key]: v })} rows={3} max={400} />
      ))}

      <div className="card inset">
        <h3>Tu presentación completa</h3>
        <p className="muted">Se arma con tus cuatro piezas. Puedes editarla directamente para que suene natural al decirla en voz alta.</p>

        <div className="field">
          <label htmlFor="pitch-final">Presentación integrada</label>
          <textarea
            id="pitch-final"
            rows={7}
            maxLength={1200}
            value={text}
            onChange={(e) => set('s4', { final: e.target.value, finalEdited: true })}
          />
        </div>

        {s.finalEdited && (
          <p className="muted small">
            Estás editando el texto integrado, por eso los cambios en los cuatro campos ya no se reflejan aquí.{' '}
            <button type="button" className="link" onClick={rebuild}>Volver a armarlo desde los cuatro campos</button>
          </p>
        )}

        <div className="wpm">
          <label htmlFor="wpm">Mi ritmo al hablar: <strong>{s.wpm}</strong> palabras por minuto</label>
          <input id="wpm" type="range" min="120" max="140" step="5" value={s.wpm} onChange={(e) => set('s4', { wpm: Number(e.target.value) })} />
        </div>
        <PitchClock text={text} wpm={s.wpm} />

        <div className="row">
          <CoachButton ai={ai} loading={loading} onClick={ask} disabled={text.trim().length < 30} variant="secondary">
            Sugerir qué simplificar
          </CoachButton>
        </div>
        <AiOffNotice ai={ai} />
        <ErrorNote>{error}</ErrorNote>

        {tips && (
          <Coach>
            <p>{tips.mensaje}</p>
            {tips.sugerencias.length > 0 && (
              <ul className="tips">
                {tips.sugerencias.map((t, i) => (
                  <li key={i}>
                    <p className="claim-text">“{t.fragmento}”</p>
                    <p className="claim-q">{t.motivo}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="muted small">No se cambió nada de tu texto. Tú decides qué recortar.</p>
          </Coach>
        )}
      </div>
    </>
  );
}

