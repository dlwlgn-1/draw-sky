/* DOM helpers, theme colours read from CSS, and small UI utilities. */

export const $ = s => document.querySelector(s);

export function el(tag, cls, text){
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

const css = getComputedStyle(document.documentElement), T = k => css.getPropertyValue(k).trim();
export const COL = { text: T("--text"), chalk: T("--chalk"), sub: T("--sub"), dim: T("--dim") };
export const UI_FONT = T("--ui");
export const reduceMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

export const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.8 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg>';
export const STAR_O_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="m12 3.5 2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.2l-5 2.7 1-5.6-4.1-3.9 5.6-.7z"/></svg>';

let toastT;
export function toast(msg, err){
  const t = $("#toast");
  t.textContent = msg; t.classList.toggle("err", !!err); t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600);
}

/* per-viewer conveniences only; storage may be unavailable */
export function store(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
export function load(k){ try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } }

export function fmtRA(h){ h = ((h % 24) + 24) % 24; let hh = Math.floor(h), mm = Math.round((h - hh) * 60); if (mm === 60){ hh = (hh + 1) % 24; mm = 0; } return `${hh}h ${String(mm).padStart(2, "0")}m`; }
export function fmtDec(d){ const s = d < 0 ? "−" : "+"; const a = Math.abs(d); let dd = Math.floor(a), mm = Math.round((a - dd) * 60); if (mm === 60){ dd++; mm = 0; } return `${s}${dd}° ${String(mm).padStart(2, "0")}′`; }
