// Guarda el trabajo de cada participante (solo lo lee el administrador vía /api/admin).
// - Cada participante tiene un id aleatorio (UUID) generado en su navegador.
// - Solo se acepta un estado con consentimiento explícito y se limpia campo por campo.
import { cmd, pipeline, redisEnabled } from './_lib/redis.js';
import { over, clientIp, isPid } from './_lib/limits.js';

const RETENTION_DAYS = Number(process.env.RETENTION_DAYS) || 90;
const MAX_BODY = 60000;

const SCHEMA = {
  profile: { name: 80, company: 100 },
  s1: { situation: 700, difference: 600, idea: 600, oneLine: 280 },
  s2: { importance: 700, evidence: 800, benefits: 600, arg1: 350, arg2: 350 },
  s3: { who: 300, cares: 500, disagree: 500, objection: 700, response: 700 },
  s4: { proposal: 400, foundation: 400, impact: 400, ask: 400, final: 1200 },
  s5: { question: 500, answer: 800 },
};

const int = (v, min, max) => Math.min(max, Math.max(min, Number.isFinite(+v) ? Math.trunc(+v) : min));

function sanitize(st) {
  const out = { step: int(st.step, 0, 6), maxStep: int(st.maxStep, 0, 6), consent: true };
  for (const [sec, fields] of Object.entries(SCHEMA)) {
    out[sec] = {};
    for (const [k, max] of Object.entries(fields)) {
      const v = st?.[sec]?.[k];
      out[sec][k] = typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max) : '';
    }
  }
  out.s4.wpm = int(st?.s4?.wpm, 120, 140);
  out.s4.finalEdited = st?.s4?.finalEdited === true;
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ enabled: redisEnabled() });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  if (!redisEnabled()) return res.status(503).json({ error: 'Almacenamiento no configurado.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const id = body?.id;
  if (!isPid(id)) return res.status(400).json({ error: 'Solicitud no válida.' });

  const ip = clientIp(req);
  if ((await over(`mvmp:rl:save:ip:${ip}`, 3000, 600)) || (await over(`mvmp:rl:save:id:${id}`, 400, 600))) {
    return res.status(429).json({ error: 'Demasiados guardados seguidos. Reintentando en un momento.' });
  }

  try {
    if (body.action === 'delete') {
      await pipeline([['DEL', `mvmp:p:${id}`], ['ZREM', 'mvmp:idx', id]]);
      return res.status(200).json({ ok: true });
    }

    if (body.state?.consent !== true) return res.status(400).json({ error: 'Falta consentimiento.' });
    if (JSON.stringify(body.state).length > MAX_BODY) return res.status(413).json({ error: 'Contenido demasiado grande.' });

    const now = Date.now();
    const record = JSON.stringify({ id, updatedAt: now, state: sanitize(body.state) });
    await pipeline([
      ['SET', `mvmp:p:${id}`, record, 'EX', RETENTION_DAYS * 86400],
      ['ZADD', 'mvmp:idx', now, id],
    ]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('save error:', e.message);
    return res.status(502).json({ error: 'No se pudo guardar ahora.' });
  }
}
// cmd importado por si se necesita ampliar; evita warning de lint
void cmd;
