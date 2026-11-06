export const STAGES = [
  { n: 1, short: 'Dolor', minutes: '2 min', nudge: 'Parte por algo que hayas visto con tus propios ojos, no por una teoría.' },
  { n: 2, short: 'Argumento', minutes: '2 min', nudge: 'Que algo te parezca evidente no significa que el resto lo vea igual.' },
  { n: 3, short: 'Otro punto de vista', minutes: '2 min', nudge: 'Convencer empieza por entender qué le importa a quien te escucha.' },
  { n: 4, short: 'Presentación', minutes: '2 min', nudge: 'Sesenta segundos obligan a decidir qué es lo esencial.' },
  { n: 5, short: 'Ensayo', minutes: '2 min', nudge: 'Ensayar una pregunta difícil hoy te quita sorpresas mañana.' },
];

export const EXAMPLES_S1 = [
  'Simplificar un proceso interno que genera reprocesos.',
  'Mejorar la coordinación entre áreas.',
  'Proponer una forma diferente de atender a clientes.',
  'Incorporar una herramienta para reducir tareas manuales.',
  'Cambiar la manera de organizar reuniones o distribuir responsabilidades.',
];

export const EXAMPLE_PITCH = [
  { key: 'proposal', label: 'Propuesta', text: 'Propongo que Ventas y Operaciones se reúnan 15 minutos cada lunes para alinear los pedidos de la semana.' },
  { key: 'foundation', label: 'Fundamento', text: 'Hoy nos enteramos de los cambios cuando el cliente ya reclamó, y eso nos obliga a rehacer trabajo.' },
  { key: 'impact', label: 'Impacto', text: 'Con un espacio breve y fijo podríamos anticiparnos y reducir esos reprocesos.' },
  { key: 'ask', label: 'Petición / oferta', text: 'Les pido probarlo un mes; yo me comprometo a preparar la agenda y a reportar qué pasó.' },
];

export const PITCH_FIELDS = [
  { key: 'proposal', label: 'Propuesta', question: '¿Qué estoy proponiendo?', placeholder: 'Una o dos frases, con tus palabras.' },
  { key: 'foundation', label: 'Fundamento', question: '¿Por qué tiene sentido?', placeholder: 'Tu razón más sólida, con el hecho o ejemplo que la respalda.' },
  { key: 'impact', label: 'Impacto', question: '¿Qué beneficios o resultados podría generar?', placeholder: 'Qué cambiaría, para quién y cómo lo notarían.' },
  { key: 'ask', label: 'Petición / oferta', question: '¿Qué necesito de los demás o qué me comprometo a hacer?', placeholder: 'Algo concreto: una decisión, un recurso, una prueba piloto, tu compromiso.' },
];

export const CLAIM_TYPES = {
  hecho: { label: 'Hecho', hint: 'Se puede verificar' },
  supuesto: { label: 'Supuesto', hint: 'Se da por cierto sin respaldo' },
  opinion: { label: 'Opinión', hint: 'Es una valoración' },
};

export const CLOSING_MESSAGE =
  'Tu idea no necesita ser perfecta para merecer ser escuchada. Prepárate para presentarla, escuchar otras perspectivas y defenderla con claridad y apertura.';
