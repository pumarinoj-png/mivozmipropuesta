import { useState } from 'react';
import { Download, Copy, Pencil, Trash2, Check } from 'lucide-react';
import { buildFicha, fichaToText } from '../lib/text.js';
import { CLOSING_MESSAGE } from '../data/content.js';

function Block({ title, children, wide }) {
  return (
    <section className={`ficha-block ${wide ? 'wide' : ''}`}>
      <h3>{title}</h3>
      {children || <p className="empty">Sin completar</p>}
    </section>
  );
}

export default function Ficha({ state, onEdit, onReset }) {
  const f = buildFicha(state);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');

  const copy = async () => {
    const text = fichaToText(f);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        setMsg('No pude copiar automáticamente. Selecciona el texto de la ficha y cópialo.');
        document.body.removeChild(ta);
        return;
      }
      document.body.removeChild(ta);
    }
    setMsg('');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const pdf = async () => {
    try {
      const { downloadPdf } = await import('../lib/pdf.js');
      downloadPdf(f);
      setMsg('');
    } catch (e) {
      console.error(e);
      setMsg('No pude generar el PDF. Puedes copiar el contenido y pegarlo en un documento.');
    }
  };

  return (
    <section className="ficha-wrap">
      <div className="ficha-actions">
        <button type="button" className="btn primary" onClick={pdf}><Download size={16} aria-hidden="true" /> Descargar PDF</button>
        <button type="button" className="btn secondary" onClick={copy}>
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied ? 'Copiado' : 'Copiar contenido'}
        </button>
        <button type="button" className="btn ghost" onClick={onEdit}><Pencil size={16} aria-hidden="true" /> Volver a editar</button>
      </div>
      {msg && <p className="error-note" role="alert">{msg}</p>}

      <article className="ficha" aria-label="Ficha de preparación">
        <header>
          <h2>Mi voz, mi propuesta</h2>
          {(f.name || f.company) && <p>{[f.name, f.company].filter(Boolean).join(' · ')}</p>}
        </header>
        <div className="ficha-grid">
          <Block title="Mi idea en una frase" wide>{f.idea && <p className="big">{f.idea}</p>}</Block>
          <Block title="El problema u oportunidad que quiero abordar">{f.problem && <p>{f.problem}</p>}</Block>
          <Block title="El impacto esperado">{f.impact && <p>{f.impact}</p>}</Block>
          <Block title="Mis dos argumentos principales" wide>
            {f.args.length > 0 && (
              <ol>{f.args.map((a, i) => <li key={i}>{a}</li>)}</ol>
            )}
          </Block>
          <Block title="Mi petición u oferta">{f.ask && <p>{f.ask}</p>}</Block>
          <Block title="La principal objeción que anticipo">{f.objection && <p>{f.objection}</p>}</Block>
          <Block title="Cómo respondería a esa objeción" wide>{f.response && <p>{f.response}</p>}</Block>
          <Block title="Mi presentación de 60 segundos" wide>{f.presentation && <p className="pitch-read">{f.presentation}</p>}</Block>
        </div>
        <footer>{CLOSING_MESSAGE}</footer>
      </article>

      <div className="danger-zone">
        <button type="button" className="link danger" onClick={onReset}><Trash2 size={14} aria-hidden="true" /> Borrar mis datos de este navegador</button>
      </div>
    </section>
  );
}
