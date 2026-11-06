import { useState } from 'react';
import { ArrowRight, ShieldCheck, Clock, Mic } from 'lucide-react';

export default function Welcome({ state, setProfile, setConsent, onStart, onContinue, hasProgress, ai, storage }) {
  const p = state.profile;
  const [error, setError] = useState('');
  const shared = storage === 'on';

  const check = () => {
    if (shared && p.name.trim().length < 2) return 'Escribe tu nombre para que quien facilita pueda identificar tu trabajo.';
    if (shared && !state.consent) return 'Para continuar, marca que estás de acuerdo con el guardado de tus respuestas.';
    return '';
  };
  const go = (fn) => {
    const msg = check();
    setError(msg);
    if (!msg) fn();
  };

  return (
    <section className="welcome">
      <div className="welcome-hero">
        <p className="eyebrow">Preparación para tu presentación ante el comité</p>
        <h1>Mi voz, mi propuesta</h1>
        <p className="subtitle">Prepárate para hacer que tus ideas sean escuchadas.</p>
        <p className="lead">
          En unos 8 minutos vas a elegir una idea de tu trabajo, construir argumentos que la sostengan, anticipar objeciones y ensayar una presentación de 60 segundos.
          El coach te hace preguntas y te desafía; las ideas y las palabras son tuyas.
        </p>
        <ul className="facts">
          <li><Clock size={16} aria-hidden="true" /> 5 etapas, de 1 a 2 minutos cada una</li>
          <li><Mic size={16} aria-hidden="true" /> Terminas con una ficha de preparación en A4</li>
          <li><ShieldCheck size={16} aria-hidden="true" /> {shared ? 'Tu avance se guarda solo y puedes retomarlo' : 'Tus respuestas quedan en tu navegador'}</li>
        </ul>
      </div>

      <div className="card welcome-form">
        <h2>Antes de partir</h2>
        <p className="muted">
          {shared
            ? 'Tu nombre es necesario para identificar tu trabajo. El rubro es opcional y ayuda al coach a plantear objeciones realistas para tu contexto.'
            : 'Ambos datos son opcionales. El rubro ayuda al coach a plantear objeciones realistas para tu contexto.'}
        </p>
        <div className="field">
          <label htmlFor="name">¿Cómo te llamas?{shared && ' (nombre y apellido)'}</label>
          <input id="name" type="text" maxLength={80} autoComplete="name" value={p.name} onChange={(e) => { setError(''); setProfile({ name: e.target.value }); }} />
        </div>
        <div className="field">
          <label htmlFor="company">Empresa o rubro en que trabajas</label>
          <input id="company" type="text" maxLength={100} placeholder="Ej.: retail, minería, salud, banca…" value={p.company} onChange={(e) => setProfile({ company: e.target.value })} />
        </div>

        {shared && (
          <label className="consent">
            <input type="checkbox" checked={state.consent} onChange={(e) => { setError(''); setConsent(e.target.checked); }} />
            <span>
              Entiendo que mi nombre y mis respuestas se guardarán en un servidor y que solo podrá verlos la persona que facilita esta actividad.
              Puedo borrarlos cuando quiera desde la app.
            </span>
          </label>
        )}

        {error && <p className="error-note" role="alert">{error}</p>}

        <div className="row">
          <button type="button" className="btn primary large" onClick={() => go(onStart)}>
            {hasProgress ? 'Empezar de nuevo' : 'Comenzar'} <ArrowRight size={18} aria-hidden="true" />
          </button>
          {hasProgress && (
            <button type="button" className="btn secondary large" onClick={() => go(onContinue)}>Continuar donde quedé</button>
          )}
        </div>

        <p className="privacy">
          <ShieldCheck size={15} aria-hidden="true" />
          <span>
            <strong>Confidencialidad:</strong> no escribas información sensible de tu empresa, clientes o personas.{' '}
            {shared
              ? 'Tus respuestas se guardan en este navegador y, con tu acuerdo, en un servidor al que solo accede quien facilita la actividad; se eliminan automáticamente pasado un tiempo.'
              : 'Lo que escribas se guarda solo en este navegador.'}{' '}
            Cuando pides ayuda al coach, se envía a un servicio de IA únicamente el texto necesario para esa consulta (nunca tu nombre).
          </span>
        </p>
        {ai === 'off' && <p className="ai-off">El coach de IA no está disponible por ahora; puedes hacer el recorrido completo por tu cuenta.</p>}
      </div>
    </section>
  );
}
