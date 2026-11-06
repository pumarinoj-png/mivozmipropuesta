import { useState } from 'react';
import { Users, RotateCcw, ShieldAlert } from 'lucide-react';
import { Field, CoachButton, AiOffNotice, ErrorNote, Coach } from './ui.jsx';
import { useCoach } from '../lib/coachApi.js';
import { getPresentation, minLen } from '../lib/text.js';
import { CLOSING_MESSAGE } from '../data/content.js';
import { PitchClock } from './Stage4.jsx';

const CRITERIA = [
  ['claridad', 'Claridad'],
  ['fundamento', 'Fundamento'],
  ['conviccion', 'Convicción'],
  ['apertura', 'Apertura a otras perspectivas'],
];

export default function Stage5({ state, set, ai, goTo }) {
  const text = getPresentation(state.s4);
  const q = useCoach();
  const f = useCoach();
  const question = state.s5.question;
  const answer = state.s5.answer;
  const setQuestion = (v) => set('s5', { question: v });
  const setAnswer = (v) => set('s5', { answer: v });
  const [feedback, setFeedback] = useState(null);
  const [attempt, setAttempt] = useState(1);
  const hasPitch = text.trim().length >= 30;

  const simulate = async () => {
    const r = await q.run('committee_question', {
      empresa: state.profile.company,
      frase: state.s1.oneLine || state.s1.idea,
      presentacion: text,
      objecion: state.s3.objection || state.s3.disagree,
      pregunta_previa: question,
    });
    if (r) {
      setQuestion(r.pregunta);
      setAnswer('');
      setFeedback(null);
      setAttempt(1);
    }
  };

  const getFeedback = async () => {
    const r = await f.run('committee_feedback', {
      empresa: state.profile.company,
      frase: state.s1.oneLine || state.s1.idea,
      presentacion: text,
      pregunta: question,
      respuesta: answer,
      intento: String(attempt),
    });
    if (r) setFeedback(r);
  };

  return (
    <>
      <p className="intro">
        En la sesión presencial presentarás tu propuesta ante un comité que hará preguntas y podrá cuestionar tus argumentos.
        Aquí puedes ensayar una de esas preguntas.
      </p>

      <div className="card inset">
        <h3>1. Revisa tu presentación</h3>
        {hasPitch ? (
          <>
            <p className="pitch-read">{text}</p>
            <PitchClock text={text} wpm={state.s4.wpm} />
          </>
        ) : (
          <p className="muted">Aún no tienes una presentación escrita. <button type="button" className="link" onClick={() => goTo(4)}>Vuelve a la etapa 4</button> para armarla.</p>
        )}
        {hasPitch && <button type="button" className="link" onClick={() => goTo(4)}>Editar mi presentación</button>}
      </div>

      <div className="card inset">
        <h3>2. Simula al comité</h3>
        <div className="row">
          <CoachButton ai={ai} loading={q.loading} onClick={simulate} disabled={!hasPitch} variant="secondary">
            {question ? 'Otra pregunta' : 'Simular comité'}
          </CoachButton>
        </div>
        <AiOffNotice ai={ai} />
        <ErrorNote>{q.error}</ErrorNote>
        {ai === 'off' && (
          <p className="muted small">Mientras tanto, ensaya en voz alta con un compañero y pídele que te haga la pregunta más incómoda que se le ocurra.</p>
        )}

        {question && (
          <>
            <blockquote className="objection">
              <Users size={16} aria-hidden="true" />
              <span><strong>Comité:</strong> {question}</span>
            </blockquote>
            <Field label="Tu respuesta" value={answer} onChange={setAnswer} rows={5} max={800} hint="Responde como lo harías frente al comité." />
            <div className="row">
              <CoachButton ai={ai} loading={f.loading} onClick={getFeedback} disabled={!minLen(answer, 20)} variant="secondary">
                Pedir feedback
              </CoachButton>
            </div>
            <ErrorNote>{f.error}</ErrorNote>
          </>
        )}

        {feedback && (
          <Coach title="Feedback de tu ensayo">
            <div className="highlight-row">
              <div className="highlight strength">
                <h4>Una fortaleza</h4>
                <p>{feedback.fortaleza}</p>
              </div>
              <div className="highlight improve">
                <h4>Prioridad para mejorar</h4>
                <p>{feedback.mejora}</p>
              </div>
            </div>
            <dl className="criteria">
              {CRITERIA.map(([k, label]) => (
                <div key={k}>
                  <dt>{label}</dt>
                  <dd>{feedback[k]}</dd>
                </div>
              ))}
            </dl>
            <p className="muted small written-note">
              <ShieldAlert size={14} aria-hidden="true" /> Este ensayo es escrito: no evalúa tu voz, tu lenguaje corporal ni cómo lo dirías en vivo.
            </p>
            <div className="row">
              <button
                type="button"
                className="btn small ghost"
                onClick={() => {
                  setFeedback(null);
                  setAttempt((a) => a + 1);
                }}
              >
                <RotateCcw size={14} aria-hidden="true" /> Segundo intento
              </button>
            </div>
          </Coach>
        )}
      </div>

      <p className="closing">{CLOSING_MESSAGE}</p>
    </>
  );
}
