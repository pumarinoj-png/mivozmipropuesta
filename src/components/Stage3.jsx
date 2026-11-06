import { useState } from 'react';
import { Swords, RotateCcw } from 'lucide-react';
import { Field, CoachButton, AiOffNotice, ErrorNote, Coach, Reference } from './ui.jsx';
import { useCoach } from '../lib/coachApi.js';
import { minLen } from '../lib/text.js';

const CRITERIA = [
  ['preocupacion', 'Respondiste a la preocupación'],
  ['argumentos', 'Claridad de tus argumentos'],
  ['perspectiva', 'Reconocimiento de su perspectiva'],
  ['postura', 'Mantener tu postura sin ponerte a la defensiva'],
];

export default function Stage3({ state, set, ai }) {
  const s = state.s3;
  const idea = state.s1.oneLine || state.s1.idea;
  const challenge = useCoach();
  const fb = useCoach();
  const [feedback, setFeedback] = useState(null);
  const [attempt, setAttempt] = useState(1);

  const context = minLen(s.who, 3);
  const shownObjection = s.objection || (minLen(s.disagree) ? s.disagree : '');

  const doChallenge = async () => {
    const r = await challenge.run('objection', {
      empresa: state.profile.company,
      frase: idea,
      importancia: state.s2.importance,
      evidencia: state.s2.evidence,
      beneficios: state.s2.benefits,
      quien: s.who,
      importa: s.cares,
      desacuerdo: s.disagree,
    });
    if (r) {
      set('s3', { objection: r.objecion });
      setFeedback(null);
      setAttempt(1);
    }
  };

  const doFeedback = async () => {
    const r = await fb.run('objection_feedback', {
      empresa: state.profile.company,
      frase: idea,
      quien: s.who,
      objecion: shownObjection,
      respuesta: s.response,
      intento: String(attempt),
    });
    if (r) setFeedback(r);
  };

  const retry = () => {
    setFeedback(null);
    setAttempt((a) => a + 1);
  };

  return (
    <>
      <p className="intro">Para influir no basta con explicar por qué algo es importante para ti. También necesitas comprender qué valor tiene para las personas que deben escucharte.</p>
      <Reference label="Tu propuesta">{idea}</Reference>

      <Field label="¿A quién necesitas convencer o conseguir su apoyo?" value={s.who} onChange={(v) => set('s3', { who: v })} rows={2} max={300} placeholder="Un rol o una persona concreta, por ejemplo: la jefa de operaciones." />
      <Field label="¿Qué le importa o preocupa a esa persona?" value={s.cares} onChange={(v) => set('s3', { cares: v })} rows={3} max={500} />
      <Field label="¿Qué podría hacer que no esté de acuerdo contigo?" value={s.disagree} onChange={(v) => set('s3', { disagree: v })} rows={3} max={500} />

      <div className="card inset">
        <h3>Pon a prueba tu idea</h3>
        <p className="muted">Un interlocutor escéptico, pero respetuoso, te planteará una objeción. Responde con tus palabras.</p>

        <div className="row">
          <CoachButton ai={ai} loading={challenge.loading} onClick={doChallenge} disabled={!context} variant="secondary">
            Desafía mi idea
          </CoachButton>
        </div>
        <AiOffNotice ai={ai} />
        <ErrorNote>{challenge.error}</ErrorNote>
        {!context && ai === 'on' && <p className="muted small">Indica primero a quién necesitas convencer.</p>}

        {shownObjection ? (
          <blockquote className="objection">
            <Swords size={16} aria-hidden="true" />
            <span>
              <strong>{s.objection ? 'Objeción:' : 'Tu objeción anticipada:'}</strong> {shownObjection}
            </span>
          </blockquote>
        ) : (
          <p className="muted small">Cuando tengas una objeción —la tuya o la del coach— aparecerá aquí para que la respondas.</p>
        )}

        {shownObjection && (
          <>
            <Field label="¿Cómo responderías?" hint="Hazte cargo de lo que preocupa, apóyate en un argumento y reconoce lo que sea válido." value={s.response} onChange={(v) => set('s3', { response: v })} rows={4} max={700} />
            <div className="row">
              <CoachButton ai={ai} loading={fb.loading} onClick={doFeedback} disabled={!minLen(s.response, 15)} variant="secondary">
                Pedir feedback
              </CoachButton>
            </div>
            <ErrorNote>{fb.error}</ErrorNote>
          </>
        )}

        {feedback && (
          <Coach title="Feedback sobre tu respuesta">
            <dl className="criteria">
              {CRITERIA.map(([k, label]) => (
                <div key={k}>
                  <dt>{label}</dt>
                  <dd>{feedback[k]}</dd>
                </div>
              ))}
            </dl>
            {feedback.siguiente_paso && <p><strong>Para un nuevo intento:</strong> {feedback.siguiente_paso}</p>}
            <div className="row">
              <button type="button" className="btn small ghost" onClick={retry}><RotateCcw size={14} aria-hidden="true" /> Intentar nuevamente</button>
            </div>
          </Coach>
        )}
      </div>
    </>
  );
}
