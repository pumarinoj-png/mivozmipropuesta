// Cliente mínimo para Redis vía REST (Upstash). Sin dependencias.
// Acepta los nombres de variables de Upstash directo o de la integración de Vercel (KV_*).
const url = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const redisEnabled = () => Boolean(url() && token());

async function call(path, body) {
  const r = await fetch(url() + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `redis ${r.status}`);
  return j;
}

export async function cmd(args) {
  const j = await call('', args);
  if (j.error) throw new Error(j.error);
  return j.result;
}

// Devuelve un arreglo de resultados; lanza si algún comando falla.
export async function pipeline(cmds) {
  const arr = await call('/pipeline', cmds);
  return arr.map((x) => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}
