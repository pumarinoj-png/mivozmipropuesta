import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Trash2, ShieldCheck, Save } from 'lucide-react';
import { loadState, saveState, clearState, initialState } from './lib/storage.js';
import { checkAvailability } from './lib/coachApi.js';
import { storageEnabled, pushState, deleteRemote, resetPid } from './lib/sync.js';
import { minLen } from './lib/text.js';
import { STAGES } from './data/content.js';
import Welcome from './components/Welcome.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import Stage1 from './components/Stage1.jsx';
import Stage2 from './components/Stage2.jsx';
import Stage3 from './components/Stage3.jsx';
import Stage4 from './components/Stage4.jsx';
import Stage5 from './components/Stage5.jsx';
import Ficha from './components/Ficha.jsx';

const TITLES = {
  1: '¿Qué dolor u oportunidad observas en tu entorno?',
  2: '¿Por qué deberían considerar tu idea?',
  3: 'Tu idea también necesita conectar con otros.',
  4: 'Tienes 60 segundos. Haz que cuenten.',
  5: '¿Estás listo para defender tu idea?',
  6: 'Tu ficha de preparación',
};

function validate(step, st) {
  const { s1, s2, s3, s4 } = st;
  if (step === 1 && !(minLen(s1.situation) && minLen(s1.idea) && minLen(s1.oneLine))) {
    return 'Para avanzar, cuenta la situación, tu idea y escribe tu propuesta en una frase.';
  }
  if (step === 2 && !(minLen(s2.importance) && minLen(s2.evidence) && minLen(s2.arg1) && minLen(s2.arg2))) {
    return 'Para avanzar, responde las preguntas y elige tus dos argumentos más sólidos.';
  }
  if (step === 3 && !(minLen(s3.who, 3) && minLen(s3.cares) && minLen(s3.disagree) && minLen(s3.response, 15))) {
    return 'Para avanzar, responde las tres preguntas y escribe cómo responderías a la objeción.';
  }
  if (step === 4) {
    const ok = s4.finalEdited
      ? minLen(s4.final, 30)
      : [s4.proposal, s4.foundation, s4.impact, s4.ask].every((t) => minLen(t));
    if (!ok) return 'Para avanzar, completa las cuatro piezas de tu presentación (o deja el texto integrado con al menos unas frases).';
  }
  return null;
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [ai, setAi] = useState('checking');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(true);
  const [storage, setStorage] = useState('checking'); // checking | on | off
  const [sync, setSync] = useState('idle'); // idle | saving | saved | error
  const [retry, setRetry] = useState(0);
  const latest = useRef(state);
  const dirty = useRef(false);
  const headingRef = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    let alive = true;
    checkAvailability().then((ok) => alive && setAi(ok ? 'on' : 'off'));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setSaved(saveState(state));
    latest.current = state;
  }, [state]);

  useEffect(() => {
    let alive = true;
    storageEnabled().then((ok) => alive && setStorage(ok ? 'on' : 'off'));
    return () => { alive = false; };
  }, []);

  // Guardado en servidor (solo con consentimiento y después de iniciar el recorrido)
  const shouldSync = storage === 'on' && state.consent && state.step >= 1;
  useEffect(() => {
    if (!shouldSync) return undefined;
    dirty.current = true;
    setSync('saving');
    const t = setTimeout(async () => {
      const ok = await pushState(latest.current);
      if (ok) dirty.current = false;
      setSync(ok ? 'saved' : 'error');
    }, 1500);
    return () => clearTimeout(t);
  }, [state, shouldSync, retry]);

  useEffect(() => {
    if (sync !== 'error') return undefined;
    const t = setTimeout(() => setRetry((n) => n + 1), 8000);
    return () => clearTimeout(t);
  }, [sync]);

  // Al cerrar o cambiar de pestaña, intenta guardar lo pendiente
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && dirty.current && latest.current.consent && latest.current.step >= 1) {
        pushState(latest.current, { keepalive: true });
      }
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.step]);

  const set = useCallback((section, patch) => {
    setError('');
    setState((s) => ({ ...s, [section]: { ...s[section], ...patch } }));
  }, []);

  const goTo = useCallback((step) => {
    setError('');
    setState((s) => ({ ...s, step, maxStep: Math.max(s.maxStep, step) }));
  }, []);

  const next = () => {
    const msg = validate(state.step, state);
    if (msg) return setError(msg);
    goTo(state.step + 1);
  };

  const wipe = async () => {
    const where = storage === 'on' ? 'en este navegador y en el servidor' : 'en este navegador';
    if (!window.confirm(`Se borrarán todas tus respuestas guardadas ${where}. ¿Quieres continuar?`)) return;
    if (storage === 'on') {
      const ok = await deleteRemote();
      if (!ok) {
        setError('No pude borrar la copia del servidor. Revisa tu conexión e intenta de nuevo.');
        return;
      }
    }
    dirty.current = false;
    clearState();
    resetPid();
    setSync('idle');
    setState(initialState);
    setError('');
  };

  const start = () => {
    if (state.maxStep > 0 && !window.confirm('Empezarás de cero y se perderá tu avance. ¿Continuar?')) return;
    setState((s) => ({ ...initialState, profile: s.profile, consent: s.consent, step: 1, maxStep: 1 }));
  };

  const { step } = state;
  let savedLabel = saved ? 'Guardado en este navegador' : 'No se pudo guardar localmente';
  if (shouldSync) {
    savedLabel = { saving: 'Guardando…', saved: 'Guardado', error: 'Sin conexión: reintentando…', idle: 'Guardado' }[sync];
  }
  const stage = STAGES[step - 1];

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => goTo(0)} aria-label="Ir al inicio">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          Mi voz, mi propuesta
        </button>
        {step > 0 && (
          <span className={`saved ${saved && sync !== 'error' ? '' : 'warn'}`} role="status">
            <Save size={13} aria-hidden="true" /> {savedLabel}
          </span>
        )}
      </header>

      <main>
        {step === 0 && (
          <Welcome
            state={state}
            ai={ai}
            storage={storage}
            setProfile={(p) => set('profile', p)}
            setConsent={(v) => setState((s) => ({ ...s, consent: v }))}
            hasProgress={state.maxStep > 0}
            onStart={start}
            onContinue={() => goTo(Math.max(1, state.step || state.maxStep))}
          />
        )}

        {step >= 1 && step <= 5 && (
          <>
            <ProgressBar step={step} maxStep={state.maxStep} onJump={goTo} />
            <section className="stage" key={step}>
              <header className="stage-head">
                <p className="stage-meta">Etapa {step} de {STAGES.length} · {stage.minutes}</p>
                <h1 ref={headingRef} tabIndex={-1}>{TITLES[step]}</h1>
                <p className="nudge">{stage.nudge}</p>
              </header>

              {step === 1 && <Stage1 state={state} set={set} ai={ai} />}
              {step === 2 && <Stage2 state={state} set={set} ai={ai} />}
              {step === 3 && <Stage3 state={state} set={set} ai={ai} />}
              {step === 4 && <Stage4 state={state} set={set} ai={ai} />}
              {step === 5 && <Stage5 state={state} set={set} ai={ai} goTo={goTo} />}

              {error && <p className="error-note" role="alert">{error}</p>}
              <div className="nav">
                <button type="button" className="btn ghost" onClick={() => goTo(step - 1)}>
                  <ArrowLeft size={16} aria-hidden="true" /> Atrás
                </button>
                <button type="button" className="btn primary" onClick={step === 5 ? () => goTo(6) : next}>
                  {step === 5 ? 'Ver mi ficha' : 'Siguiente'} <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>
          </>
        )}

        {step === 6 && (
          <>
            <header className="stage-head ficha-head">
              <h1 ref={headingRef} tabIndex={-1}>{TITLES[6]}</h1>
              <p className="nudge">Revísala con calma: es lo que llevas a la sesión.</p>
            </header>
            <Ficha state={state} onEdit={() => goTo(1)} onReset={wipe} />
          </>
        )}
      </main>

      <footer className="foot">
        <p><ShieldCheck size={14} aria-hidden="true" /> {storage === 'on' && state.consent ? 'Evita ingresar información sensible o confidencial. Tus respuestas se guardan en este navegador y en un servidor visible solo para quien facilita la actividad.' : 'Evita ingresar información sensible o confidencial. Tus respuestas se guardan solo en este navegador.'}</p>
        {step > 0 && step < 6 && (
          <button type="button" className="link danger" onClick={wipe}><Trash2 size={13} aria-hidden="true" /> Borrar mis datos</button>
        )}
      </footer>
    </div>
  );
}
