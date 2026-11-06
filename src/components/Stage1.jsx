import { useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { Field, Examples, CoachButton, AiOffNotice, ErrorNote, Coach } from './ui.jsx';
import { useCoach } from '../lib/coachApi.js';
import { EXAMPLES_S1 } from '../data/content.js';
import { minLen } from '../lib/text.js';

export default function Stage1({ state, set, ai }) {
  const s = state.s1;
  const { loading, error, run } = useCoach();
  const [help, setHelp] = useState(null); // { mensaje, frase }
  const lineRef = useRef(null);
  const ready = minLen(s.situation) && minLen(s.idea);

  const ask = async () => {
    const r = await run('synthesize', {
      empresa: state.profile.company,
      situacion: s.situation,
      diferencia: s.difference,
      idea: s.idea,
      frase: s.oneLine,
    });
    if (r) setHelp(r);
  };

  const accept = () => {
    set('s1', { oneLine: help.frase });
    setHelp({ ...help, frase: null, accepted: true });
  };
  const modify = () => {
    set('s1', { oneLine: help.frase });
    setHelp({ ...help, frase: null });
    setTimeout(() => lineRef.current?.focus(), 50);
  };
  const reject = () => setHelp({ ...help, frase: null });

  return (
    <>
      <p className="intro">
        Piensa en un dolor u oportunidad que observes en tu entorno y que creas que debería mejorar, cambiar o impulsarse en tu trabajo.
        Busca algo que agregue valor precisamente por ser distinto.
      </p>

      <Field label="¿Qué situación, problema u oportunidad has identificado? ¿A quién afecta?" value={s.situation} onChange={(v) => set('s1', { situation: v })} rows={4} max={700} placeholder="Cuéntalo como se lo contarías a un colega de confianza." />
      <Field label="¿Qué te gustaría que fuera diferente?" value={s.difference} onChange={(v) => set('s1', { difference: v })} rows={3} max={600} />
      <Field label="¿Cuál es la idea o propuesta que quisieras impulsar?" value={s.idea} onChange={(v) => set('s1', { idea: v })} rows={3} max={600} />

      <Examples items={EXAMPLES_S1} />

      <div className="card inset">
        <h3>Tu propuesta en una frase</h3>
        <p className="muted">Si no puedes decirla en una frase, probablemente aún no está clara. Escríbela tú; el coach puede ayudarte a afinarla.</p>
        <Field label="Mi propuesta en una frase" value={s.oneLine} onChange={(v) => set('s1', { oneLine: v })} rows={2} max={280} inputRef={lineRef} placeholder="Propongo… para…" />

        <div className="row">
          <CoachButton ai={ai} loading={loading} onClick={ask} disabled={!ready} variant="secondary">Ayúdame a afinarla</CoachButton>
        </div>
        <AiOffNotice ai={ai} />
        <ErrorNote>{error}</ErrorNote>

        {help && (
          <Coach>
            <p>{help.mensaje}</p>
            {help.frase && (
              <div className="suggestion">
                <p className="muted small">Una posible redacción, basada solo en lo que escribiste:</p>
                <blockquote>{help.frase}</blockquote>
                <div className="row">
                  <button type="button" className="btn small" onClick={accept}><Check size={14} aria-hidden="true" /> Usar esta</button>
                  <button type="button" className="btn small ghost" onClick={modify}><Pencil size={14} aria-hidden="true" /> Modificarla</button>
                  <button type="button" className="btn small ghost" onClick={reject}><X size={14} aria-hidden="true" /> Dejar la mía</button>
                </div>
              </div>
            )}
            {help.accepted && <p className="muted small">Quedó en tu campo. Puedes editarla cuando quieras.</p>}
          </Coach>
        )}
      </div>
    </>
  );
}
