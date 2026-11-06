// Sincronización opcional con el servidor (solo si hay almacenamiento configurado
// y la persona dio su consentimiento). El id es un UUID aleatorio por navegador.
const PID_KEY = 'mi-voz-mi-propuesta:pid';

function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

let memoryPid = null;

export function getPid() {
  try {
    let id = localStorage.getItem(PID_KEY);
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      id = uuid();
      localStorage.setItem(PID_KEY, id);
    }
    return id;
  } catch {
    memoryPid = memoryPid || uuid();
    return memoryPid;
  }
}

export function resetPid() {
  try {
    localStorage.removeItem(PID_KEY);
  } catch {
    /* sin almacenamiento */
  }
  memoryPid = null;
  return getPid();
}

export async function storageEnabled() {
  try {
    const r = await fetch('/api/save', { cache: 'no-store' });
    if (!r.ok) return false;
    return Boolean((await r.json()).enabled);
  } catch {
    return false;
  }
}

export async function pushState(state, { keepalive = false } = {}) {
  try {
    const r = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: getPid(), state }),
      keepalive,
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function deleteRemote() {
  try {
    const r = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: getPid(), action: 'delete' }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
