import { useState } from 'react';
import { Field, Collapsible, CoachButton, AiOffNotice, ErrorNote, Coach, Reference } from './ui.jsx';
import { useCoach } from '../lib/coachApi.js';
import { CLAIM_TYPES } from '../data/content.js';
import { minLen } from '../lib/text.js';

export default function Stage2({ state, set, ai }) {
  const s = state.s2;
  const idea = state.s1.oneLine || state.s1.idea;
  const { loading, error, run } = useCoach();
  const [review, setReview] = useState(null);
  const ready = minLen(s.importance) && minLen(s.evidence);

  const ask = async () => {
    const r = await run('claims', {
      empresa: state.profile.company,
      frase: idea,
      importancia: s.importance,
      evidencia: s.evidence,
      beneficios: s.benefits,
      arg1: s.arg1,
      arg2: s.arg2,
    });
    if (r) setReview(r);
  };

  return (
    <>
      <p className="intro">Una idea puede parecerte evidente a ti, pero otros necesitan comprender por qué tiene sentido y qué diferencia podría generar.</p>
      <Reference label="Tu propuesta">{idea}</Reference>

      <Field label="¿Por qué consideras importante esta propuesta?" value={s.importance} onChange={(v) => set('s2', { importance: v })} rows={3} max={700} />
      <Field label="¿Qué datos, experiencias, ejemplos o hechos respaldan tu idea?" hint="Si no tienes datos, cuenta lo que has visto o vivido. No hace falta inventar cifras." value={s.evidence} onChange={(v) => set('s2', { evidence: v })} rows={4} max={800} />
      <Field label="¿Qué beneficios podría generar?" value={s.benefits} onChange={(v) => set('s2', { benefits: v })} rows={3} max={600} />

      <Collapsible title="Hechos, supuestos y opiniones: cómo distinguirlos">
        <ul className="plain">
          <li><strong>Hecho:</strong> se puede verificar. “El mes pasado rehicimos 12 informes por datos desactualizados”.</li>
          <li><strong>Supuesto:</strong> lo damos por cierto sin haberlo comprobado. “El cliente prefiere que le respondamos por WhatsApp”.</li>
          <li><strong>Opinión:</strong> una valoración personal. “El proceso actual es muy engorroso”.</li>
        </ul>
        <p className="muted small">Las tres sirven, pero cada una pesa distinto ante un comité.</p>
      </Collapsible>

      <div className="card inset">
        <h3>Tus dos argumentos más sólidos</h3>
        <p className="muted">Mira lo que escribiste arriba y elige los dos que mejor se sostendrían frente a alguien escéptico.</p>
        <Field label="Argumento 1" value={s.arg1} onChange={(v) => set('s2', { arg1: v })} rows={2} max={350} />
        <Field label="Argumento 2" value={s.arg2} onChange={(v) => set('s2', { arg2: v })} rows={2} max={350} />

        <div className="row">
          <CoachButton ai={ai} loading={loading} onClick={ask} disabled={!ready} variant="secondary">Revisar mis argumentos</CoachButton>
        </div>
        <AiOffNotice ai={ai} />
        <ErrorNote>{error}</ErrorNote>

        {review && (
          <Coach>
            <p>{review.mensaje}</p>
            {review.afirmaciones.length > 0 && (
              <ul className="claims">
                {review.afirmaciones.map((a, i) => (
                  <li key={i}>
                    <span className={`tag tag-${a.tipo}`} title={CLAIM_TYPES[a.tipo].hint}>{CLAIM_TYPES[a.tipo].label}</span>
                    <div>
                      <p className="claim-text">“{a.texto}”</p>
                      {a.pregunta && <p className="claim-q">{a.pregunta}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="muted small">Ajusta tus argumentos si algo cambió después de esta revisión.</p>
          </Coach>
        )}
      </div>
    </>
  );
}
