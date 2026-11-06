import { useId, useState } from 'react';
import { ChevronDown, Sparkles, AlertCircle, Loader2, WifiOff } from 'lucide-react';

export function Field({ label, hint, value, onChange, max = 600, rows = 3, placeholder, id: idProp, inputRef }) {
  const auto = useId();
  const id = idProp || auto;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <p className="field-hint" id={`${id}-h`}>{hint}</p>}
      <textarea
        id={id}
        ref={inputRef}
        rows={rows}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-h` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className={`counter ${value.length > max * 0.9 ? 'near' : ''}`} aria-hidden="true">
        {value.length}/{max}
      </span>
    </div>
  );
}

export function Examples({ title = 'Ver ejemplos para inspirarte', items, note }) {
  return (
    <details className="examples">
      <summary>
        <ChevronDown size={16} aria-hidden="true" />
        {title}
      </summary>
      <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>
      <p className="examples-note">{note || 'Son solo puntos de partida. Tu situación es otra: usa tus propias palabras.'}</p>
    </details>
  );
}

export function Collapsible({ title, children, defaultOpen = false }) {
  return (
    <details className="examples" open={defaultOpen}>
      <summary>
        <ChevronDown size={16} aria-hidden="true" />
        {title}
      </summary>
      <div className="collapsible-body">{children}</div>
    </details>
  );
}

// Botón que dispara una función del coach; se deshabilita si la IA no está disponible.
export function CoachButton({ ai, loading, onClick, children, disabled, variant = 'primary' }) {
  const off = ai !== 'on';
  return (
    <button
      type="button"
      className={`btn ${variant}`}
      onClick={onClick}
      disabled={off || loading || disabled}
      aria-busy={loading}
    >
      {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
      {loading ? 'Pensando…' : children}
    </button>
  );
}

export function AiOffNotice({ ai }) {
  if (ai === 'on') return null;
  return (
    <p className="ai-off" role="status">
      <WifiOff size={15} aria-hidden="true" />
      {ai === 'checking'
        ? 'Conectando con el coach…'
        : 'El coach no está disponible ahora. Puedes completar esta etapa por tu cuenta y avanzar igual.'}
    </p>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p className="error-note" role="alert">
      <AlertCircle size={16} aria-hidden="true" />
      {children}
    </p>
  );
}

export function Coach({ title = 'Coach', children }) {
  return (
    <aside className="coach" aria-live="polite">
      <p className="coach-title"><Sparkles size={14} aria-hidden="true" /> {title}</p>
      {children}
    </aside>
  );
}

export function Reference({ label, children }) {
  if (!children) return null;
  return (
    <div className="reference">
      <span>{label}</span>
      <p>{children}</p>
    </div>
  );
}
