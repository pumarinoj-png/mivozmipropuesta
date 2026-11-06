import { useState, useCallback } from 'react';
import { getPid } from './sync.js';

export async function checkAvailability() {
  try {
    const r = await fetch('/api/coach', { cache: 'no-store' });
    if (!r.ok) return false;
    const j = await r.json();
    return Boolean(j.available);
  } catch {
    return false;
  }
}

export async function callCoach(task, context) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-participant-id': getPid() },
      body: JSON.stringify({ task, context }),
      signal: ctrl.signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'El coach no está disponible ahora. Puedes continuar sin él.');
    return j.result;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('El coach tardó demasiado en responder. Intenta de nuevo.');
    if (e instanceof TypeError) throw new Error('No pude conectar con el coach. Revisa tu conexión e intenta de nuevo.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Hook: ejecuta una tarea del coach con estado de carga y error.
export function useCoach() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const run = useCallback(async (task, context) => {
    setLoading(true);
    setError('');
    try {
      return await callCoach(task, context);
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  return { loading, error, run, clearError: () => setError('') };
}
