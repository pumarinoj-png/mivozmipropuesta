// Panel de administración: lectura y borrado de los trabajos guardados.
// Protegido con ADMIN_PASSWORD (cabecera x-admin-key). Sin la variable, el panel queda deshabilitado.
import { cmd, pipeline, redisEnabled } from './_lib/redis.js';
import { over, clientIp, safeEqual } from './_lib/limits.js';

const MAX_LIST = 500;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass || !redisEnabled()) {
    return res.status(503).json({ error: 'El panel no está configurado (faltan ADMIN_PASSWORD o el almacenamiento).' });
  }

  const ip = clientIp(req);
  if (await over(`mvmp:rl:admin:${ip}`, 60, 600)) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
  }
  const key = String(req.headers?.['x-admin-key'] || '');
  if (!key || !safeEqual(key, pass)) {
    await over(`mvmp:rl:adminfail:${ip}`, 8, 600).then(async (blocked) => {
      if (blocked) await new Promise((r) => setTimeout(r, 1500));
    });
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  try {
    if (req.method === 'GET') {
      const ids = await cmd(['ZRANGE', 'mvmp:idx', 0, MAX_LIST - 1, 'REV']);
      if (!ids.length) return res.status(200).json({ records: [] });
      const raw = await cmd(['MGET', ...ids.map((i) => `mvmp:p:${i}`)]);
      const records = [];
      const stale = [];
      raw.forEach((v, i) => {
        if (!v) return stale.push(ids[i]);
        try { records.push(JSON.parse(v)); } catch { stale.push(ids[i]); }
      });
      if (stale.length) await cmd(['ZREM', 'mvmp:idx', ...stale]).catch(() => {});
      return res.status(200).json({ records });
    }

    if (req.method === 'POST' && body?.action === 'delete' && typeof body.id === 'string') {
      await pipeline([['DEL', `mvmp:p:${body.id}`], ['ZREM', 'mvmp:idx', body.id]]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST' && body?.action === 'purge' && body.confirm === 'BORRAR TODO') {
      const ids = await cmd(['ZRANGE', 'mvmp:idx', 0, -1]);
      const cmds = ids.map((i) => ['DEL', `mvmp:p:${i}`]);
      cmds.push(['DEL', 'mvmp:idx']);
      await pipeline(cmds);
      return res.status(200).json({ ok: true, deleted: ids.length });
    }

    return res.status(400).json({ error: 'Solicitud no válida.' });
  } catch (e) {
    console.error('admin error:', e.message);
    return res.status(502).json({ error: 'No se pudo leer el almacenamiento.' });
  }
}
