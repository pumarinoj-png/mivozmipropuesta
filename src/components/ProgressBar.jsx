import { Check } from 'lucide-react';
import { STAGES } from '../data/content.js';

export default function ProgressBar({ step, maxStep, onJump }) {
  const pct = Math.round(((step - 1) / STAGES.length) * 100 + (step >= 1 ? 100 / STAGES.length / 2 : 0));
  return (
    <nav className="progress" aria-label="Progreso">
      <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(pct, 100)} aria-label={`Etapa ${step} de ${STAGES.length}`}>
        <span style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <ol>
        {STAGES.map((s) => {
          const done = s.n < step;
          const current = s.n === step;
          const reachable = s.n <= maxStep;
          return (
            <li key={s.n} className={`${current ? 'current' : ''} ${done ? 'done' : ''}`}>
              <button type="button" disabled={!reachable} onClick={() => onJump(s.n)} aria-current={current ? 'step' : undefined}>
                <span className="dot">{done ? <Check size={13} aria-hidden="true" /> : s.n}</span>
                <span className="label">{s.short}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
