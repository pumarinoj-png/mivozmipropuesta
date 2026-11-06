export function countWords(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

export function estimateSeconds(words, wpm) {
  return Math.round((words / Math.max(wpm, 1)) * 60);
}

export function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m} min ${String(r).padStart(2, '0')} s` : `${r} s`;
}

export function composePresentation(s4) {
  return [s4.proposal, s4.foundation, s4.impact, s4.ask]
    .map((t) => (t || '').trim())
    .filter(Boolean)
    .join(' ');
}

export function getPresentation(s4) {
  return s4.finalEdited ? s4.final : composePresentation(s4);
}

export function minLen(text, n = 10) {
  return (text || '').trim().length >= n;
}

// Datos de la ficha final, solo con lo que escribió la persona.
export function buildFicha(state) {
  const { profile, s1, s2, s3, s4 } = state;
  return {
    name: profile.name.trim(),
    company: profile.company.trim(),
    idea: s1.oneLine.trim() || s1.idea.trim(),
    problem: s1.situation.trim(),
    args: [s2.arg1.trim(), s2.arg2.trim()].filter(Boolean),
    impact: s4.impact.trim() || s2.benefits.trim(),
    ask: s4.ask.trim(),
    objection: s3.objection.trim() || s3.disagree.trim(),
    response: s3.response.trim(),
    presentation: getPresentation(s4).trim(),
  };
}

export function fichaToText(f) {
  const lines = ['MI VOZ, MI PROPUESTA'];
  if (f.name) lines.push(f.name + (f.company ? ` · ${f.company}` : ''));
  const add = (t, v) => lines.push('', t.toUpperCase(), v || '—');
  add('Mi idea en una frase', f.idea);
  add('Problema u oportunidad que quiero abordar', f.problem);
  lines.push('', 'MIS DOS ARGUMENTOS PRINCIPALES');
  if (f.args.length) f.args.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  else lines.push('—');
  add('Impacto esperado', f.impact);
  add('Mi petición u oferta', f.ask);
  add('Principal objeción que anticipo', f.objection);
  add('Cómo respondería a esa objeción', f.response);
  add('Mi presentación de 60 segundos', f.presentation);
  return lines.join('\n');
}
