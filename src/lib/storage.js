const KEY = 'mi-voz-mi-propuesta:v1';

export const initialState = {
  step: 0, // 0 bienvenida, 1-5 etapas, 6 ficha
  maxStep: 0,
  consent: false,
  profile: { name: '', company: '' },
  s1: { situation: '', difference: '', idea: '', oneLine: '' },
  s2: { importance: '', evidence: '', benefits: '', arg1: '', arg2: '' },
  s3: { who: '', cares: '', disagree: '', objection: '', response: '' },
  s4: { proposal: '', foundation: '', impact: '', ask: '', wpm: 130, final: '', finalEdited: false },
  s5: { question: '', answer: '' },
};

function merge(base, saved) {
  const out = { ...base };
  for (const k of Object.keys(base)) {
    if (saved && typeof saved[k] === 'object' && saved[k] !== null && typeof base[k] === 'object') {
      out[k] = { ...base[k], ...saved[k] };
    } else if (saved && saved[k] !== undefined && typeof saved[k] === typeof base[k]) {
      out[k] = saved[k];
    }
  }
  return out;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    return merge(initialState, JSON.parse(raw));
  } catch {
    return initialState;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* sin acceso a almacenamiento */
  }
}
