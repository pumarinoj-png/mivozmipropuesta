import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Download, FileJson, Trash2, LogOut, Copy, ArrowLeft, Lock } from 'lucide-react';
import { buildFicha, fichaToText } from '../lib/text.js';

const KEY = 'mvmp:admin-key';

async function adminFetch(key, method, body) {
  const r = await fetch('/api/admin', {
    method,
    headers: { 'x-admin-key': key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j.error || 'No se pudo completar la solicitud.');
    e.status = r.status;
    throw e;
  }
  return j;
}

const when = (t) => new Date(t).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
const stageLabel = (s) => (s.step >= 6 ? 'Ficha lista' : s.step >= 1 ? `Etapa ${s.step}` : 'Inicio');

function answers(st) {
  return [
    ['Etapa 1 · Situación, problema u oportunidad', st.s1.situation],
    ['Etapa 1 · Qué le gustaría que fuera diferente', st.s1.difference],
    ['Etapa 1 · Idea o propuesta', st.s1.idea],
    ['Etapa 1 · Propuesta en una frase', st.s1.oneLine],
    ['Etapa 2 · Por qué es importante', st.s2.importance],
    ['Etapa 2 · Datos, experiencias o hechos', st.s2.evidence],
    ['Etapa 2 · Beneficios', st.s2.benefits],
    ['Etapa 2 · Argumento 1', st.s2.arg1],
    ['Etapa 2 · Argumento 2', st.s2.arg2],
    ['Etapa 3 · A quién necesita convencer', st.s3.who],
    ['Etapa 3 · Qué le importa o preocupa', st.s3.cares],
    ['Etapa 3 · Qué podría generar desacuerdo', st.s3.disagree],
    ['Etapa 3 · Objeción planteada por el coach', st.s3.objection],
    ['Etapa 3 · Su respuesta a la objeción', st.s3.response],
    ['Etapa 4 · Propuesta', st.s4.proposal],
    ['Etapa 4 · Fundamento', st.s4.foundation],
    ['Etapa 4 · Impacto', st.s4.impact],
    ['Etapa 4 · Petición / oferta', st.s4.ask],
    ['Etapa 4 · Presentación final', st.s4.finalEdited ? st.s4.final : ''],
    ['Etapa 5 · Pregunta del comité simulado', st.s5.question],
    ['Etapa 5 · Su respuesta al comité', st.s5.answer],
  ];
}

// Evita que Excel interprete celdas como fórmulas (CSV injection)
function cell(v) {
  let t = String(v ?? '').replace(/\r?\n/g, ' ');
  if (/^[=+\-@\t]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
}

function toCsv(records) {
  const head = ['Nombre', 'Empresa o rubro', 'Avance', 'Actualizado', 'Idea', 'Problema', 'Argumento 1', 'Argumento 2', 'Impacto', 'Petición', 'Objeción', 'Respuesta a objeción', 'Presentación 60 s', 'Pregunta comité', 'Respuesta comité'];
  const rows = records.map((r) => {
    const f = buildFicha(r.state);
    return [f.name, f.company, stageLabel(r.state), when(r.updatedAt), f.idea, f.problem, f.args[0] || '', f.args[1] || '', f.impact, f.ask, f.objection, f.response, f.presentation, r.state.s5.question, r.state.s5.answer];
  });
  return '\ufeff' + [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Admin() {
  const [key, setKey] = useState(() => {
    try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; }
  });
  const [input, setInput] = useState('');
  const [records, setRecords] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [q, setQ] = useState('');

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(KEY); } catch { /* noop */ }
    setKey('');
    setRecords(null);
    setOpenId(null);
  }, []);

  const load = useCallback(async (k, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const j = await adminFetch(k, 'GET');
      setRecords(j.records);
      setError('');
      try { sessionStorage.setItem(KEY, k); } catch { /* noop */ }
    } catch (e) {
      if (e.status === 401) {
        try { sessionStorage.removeItem(KEY); } catch { /* noop */ }
        setKey('');
      }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!key) return undefined;
    load(key);
    const t = setInterval(() => load(key, true), 20000);
    return () => clearInterval(t);
  }, [key, load]);

  const login = (e) => {
    e.preventDefault();
    if (input.trim()) setKey(input.trim());
    setInput('');
  };

  const filtered = useMemo(() => {
    if (!records) return [];
    const t = q.trim().toLowerCase();
    if (!t) return records;
    return records.filter((r) => `${r.state.profile.name} ${r.state.profile.company}`.toLowerCase().includes(t));
  }, [records, q]);

  const open = records?.find((r) => r.id === openId);

  const remove = async (r) => {
    if (!window.confirm(`¿Eliminar definitivamente el trabajo de ${r.state.profile.name || 'esta persona'}?`)) return;
    try {
      await adminFetch(key, 'POST', { action: 'delete', id: r.id });
      setOpenId(null);
      load(key, true);
    } catch (e) { setError(e.message); }
  };

  const purge = async () => {
    const t = window.prompt('Esto elimina el trabajo de TODAS las personas. Escribe BORRAR TODO para confirmar.');
    if (t !== 'BORRAR TODO') return;
    try {
      await adminFetch(key, 'POST', { action: 'purge', confirm: 'BORRAR TODO' });
      setOpenId(null);
      load(key, true);
    } catch (e) { setError(e.message); }
  };

  const pdf = async (r) => {
    try {
      const { downloadPdf } = await import('../lib/pdf.js');
      downloadPdf(buildFicha(r.state));
    } catch { setError('No pude generar el PDF.'); }
  };

  if (!key) {
    return (
      <div className="admin">
        <form className="card admin-login" onSubmit={login}>
          <h1><Lock size={22} aria-hidden="true" /> Panel de facilitación</h1>
          <p className="muted">Acceso solo para quien administra la actividad.</p>
          <div className="field">
            <label htmlFor="pw">Contraseña</label>
            <input id="pw" type="password" autoComplete="current-password" value={input} onChange={(e) => setInput(e.target.value)} />
          </div>
          {error && <p className="error-note" role="alert">{error}</p>}
          <div className="row"><button type="submit" className="btn primary">Entrar</button></div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin">
      <header className="admin-head">
        <div>
          <h1>Panel de facilitación</h1>
          <p className="muted">{records ? `${records.length} ${records.length === 1 ? 'persona' : 'personas'} · se actualiza solo cada 20 s` : 'Cargando…'}</p>
        </div>
        <div className="row">
          <button type="button" className="btn small secondary" onClick={() => load(key)} disabled={loading}><RefreshCw size={14} aria-hidden="true" /> Actualizar</button>
          <button type="button" className="btn small ghost" disabled={!records?.length} onClick={() => download('mi-voz-propuestas.csv', toCsv(records), 'text/csv;charset=utf-8')}><Download size={14} aria-hidden="true" /> CSV</button>
          <button type="button" className="btn small ghost" disabled={!records?.length} onClick={() => download('mi-voz-propuestas.json', JSON.stringify(records, null, 2), 'application/json')}><FileJson size={14} aria-hidden="true" /> JSON</button>
          <button type="button" className="btn small ghost" onClick={logout}><LogOut size={14} aria-hidden="true" /> Salir</button>
        </div>
      </header>

      {error && <p className="error-note" role="alert">{error}</p>}

      {!open && records && (
        <>
          <div className="field admin-search">
            <label htmlFor="q">Buscar por nombre o rubro</label>
            <input id="q" type="text" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {filtered.length === 0 ? (
            <p className="muted">{records.length === 0 ? 'Aún no hay trabajos guardados.' : 'Sin resultados para esa búsqueda.'}</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Nombre</th><th>Empresa o rubro</th><th>Avance</th><th>Actualizado</th><th>Idea</th></tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td><button type="button" className="link" onClick={() => setOpenId(r.id)}>{r.state.profile.name || 'Sin nombre'}</button></td>
                      <td>{r.state.profile.company || '—'}</td>
                      <td>{stageLabel(r.state)}</td>
                      <td>{when(r.updatedAt)}</td>
                      <td className="idea-cell">{buildFicha(r.state).idea || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {records.length > 0 && (
            <p className="danger-zone"><button type="button" className="link danger" onClick={purge}><Trash2 size={14} aria-hidden="true" /> Eliminar el trabajo de todas las personas</button></p>
          )}
        </>
      )}

      {open && (
        <article className="card admin-detail">
          <button type="button" className="link" onClick={() => setOpenId(null)}><ArrowLeft size={14} aria-hidden="true" /> Volver al listado</button>
          <h2>{open.state.profile.name || 'Sin nombre'}</h2>
          <p className="muted">{[open.state.profile.company, stageLabel(open.state), `actualizado ${when(open.updatedAt)}`].filter(Boolean).join(' · ')}</p>
          <div className="row">
            <button type="button" className="btn small secondary" onClick={() => pdf(open)}><Download size={14} aria-hidden="true" /> PDF de la ficha</button>
            <button type="button" className="btn small ghost" onClick={() => navigator.clipboard?.writeText(fichaToText(buildFicha(open.state)))}><Copy size={14} aria-hidden="true" /> Copiar ficha</button>
            <button type="button" className="btn small ghost" onClick={() => remove(open)}><Trash2 size={14} aria-hidden="true" /> Eliminar</button>
          </div>
          <dl className="answers">
            {answers(open.state).map(([label, v]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{v?.trim() ? v : <span className="empty">Sin responder</span>}</dd>
              </div>
            ))}
          </dl>
        </article>
      )}
    </div>
  );
}
