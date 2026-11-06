import { jsPDF } from 'jspdf';

// jsPDF usa fuentes estándar (Latin-1). Normalizamos caracteres fuera de ese rango.
function safe(t) {
  return String(t ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '-')
    .replace(/[^\n\u0020-\u007E\u00A0-\u00FF]/g, '');
}

const W = 210;
const H = 297;
const M = 16;
const CW = W - M * 2;
const SIZES = [10.5, 10, 9.5, 9, 8.5];

function render(f, size) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const lh = size * 0.3528 * 1.42;
  let y = 0;

  const ensure = (h) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };

  // Encabezado
  doc.setFillColor(27, 94, 90);
  doc.rect(0, 0, W, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('MI VOZ, MI PROPUESTA', M, 15);
  if (f.name) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const who = safe(f.name + (f.company ? ' - ' + f.company : ''));
    doc.text(doc.splitTextToSize(who, 90)[0], W - M, 15, { align: 'right' });
  }
  y = 33;

  const section = (title, body) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(safe(body || '-'), CW - 4);
    ensure(lh * 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size - 0.5);
    doc.setTextColor(27, 94, 90);
    doc.text(safe(title), M, y);
    y += lh;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(28, 42, 51);
    lines.forEach((ln) => {
      ensure(lh);
      doc.text(ln, M + 4, y);
      y += lh;
    });
    y += lh * 0.6;
  };

  section('MI IDEA EN UNA FRASE', f.idea);
  section('EL PROBLEMA U OPORTUNIDAD QUE QUIERO ABORDAR', f.problem);
  section('MIS DOS ARGUMENTOS PRINCIPALES', f.args.length ? f.args.map((a, i) => `${i + 1}. ${a}`).join('\n') : '-');
  section('EL IMPACTO ESPERADO', f.impact);
  section('MI PETICIÓN U OFERTA', f.ask);
  section('LA PRINCIPAL OBJECIÓN QUE ANTICIPO', f.objection);
  section('CÓMO RESPONDERÍA A ESA OBJECIÓN', f.response);
  section('MI PRESENTACIÓN DE 60 SEGUNDOS', f.presentation);

  ensure(12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text(
    doc.splitTextToSize(
      'Tu idea no necesita ser perfecta para merecer ser escuchada. Prepárate para presentarla, escuchar otras perspectivas y defenderla con claridad y apertura.',
      CW,
    ),
    M,
    y + 2,
  );
  return doc;
}

// Intenta que la ficha quepa en una A4; si no, usa la tipografía menor y pagina sin cortar.
export function buildPdf(f) {
  let doc;
  for (const size of SIZES) {
    doc = render(f, size);
    if (doc.getNumberOfPages() === 1) return doc;
  }
  return doc;
}

export function downloadPdf(f) {
  buildPdf(f).save('mi-voz-mi-propuesta.pdf');
}
