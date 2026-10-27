/* The black entrance screen: push the small star up; it grows and brightens until the sky opens. */
import { $, el, COL } from "./dom.js";
import { shortDay } from "../game/time.js";

const I = { on: false, p: 0, drag: null, doneT: 0, resolve: null };
const icv = $("#introSky"), ictx = icv.getContext("2d");
function introGeo(){ const w = icv.clientWidth, h = icv.clientHeight; return { w, h, x: w / 2, y0: h - Math.max(130, h * .17), y1: Math.max(70, h * .1) }; }
function drawIntro(now){
  if (!I.on) return;
  const G = introGeo(), { w, h } = G, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (icv.width !== Math.round(w * dpr) || icv.height !== Math.round(h * dpr)){ icv.width = Math.round(w * dpr); icv.height = Math.round(h * dpr); }
  const x = ictx; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
  if (!I.drag && !I.doneT && I.p > 0) I.p = Math.max(0, I.p - .05);   /* falls back if let go too early */
  const p = I.p, sx = G.x, sy = G.y0 + (G.y1 - G.y0) * p + (p === 0 && !I.drag ? Math.sin(now / 600) * 4 : 0);

  /* chevrons hinting upward while the star waits */
  if (p < .15 && !I.doneT){
    x.strokeStyle = COL.chalk; x.lineWidth = 1.6; x.lineCap = "round"; x.lineJoin = "round";
    for (let i = 0; i < 3; i++){
      const ph = ((now / 900) + i / 3) % 1, cy = sy - 34 - ph * 60;
      x.globalAlpha = Math.sin(Math.PI * ph) * .7 * (1 - p / .15);
      x.beginPath(); x.moveTo(sx - 8, cy + 5); x.lineTo(sx, cy - 3); x.lineTo(sx + 8, cy + 5); x.stroke();
    }
    x.globalAlpha = 1;
  }

  /* the star itself: a point of light with a soft halo that twinkles, the way a bright star looks to the eye */
  if (p > 0){
    const amb = x.createRadialGradient(sx, sy, 0, sx, sy, Math.hypot(w, h) * .8);
    amb.addColorStop(0, `rgba(215,226,255,${.09 * p * p})`); amb.addColorStop(1, "rgba(215,226,255,0)");
    x.fillStyle = amb; x.fillRect(0, 0, w, h);
  }
  const tw = 1 + .1 * Math.sin(now / 83) + .07 * Math.sin(now / 37 + 1.7) + .05 * Math.sin(now / 151 + .4);
  const core = 1.1 + 2.6 * p, halo = (9 + 60 * Math.pow(p, 1.3)) * tw;
  const g = x.createRadialGradient(sx, sy, 0, sx, sy, halo);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(.06, `rgba(236,242,255,${.55 + .35 * p})`);
  g.addColorStop(.22, `rgba(205,218,255,${.12 + .2 * p})`);
  g.addColorStop(1, "rgba(180,198,255,0)");
  x.fillStyle = g; x.beginPath(); x.arc(sx, sy, halo, 0, 7); x.fill();
  x.fillStyle = "#fff"; x.beginPath(); x.arc(sx, sy, core, 0, 7); x.fill();

  /* once it arrives, its light floods the screen */
  if (I.doneT){
    const k = Math.min(1, (now - I.doneT) / 650), R = Math.hypot(w, h) * k * 1.1;
    const b = x.createRadialGradient(sx, sy, 0, sx, sy, Math.max(1, R));
    b.addColorStop(0, `rgba(255,252,240,${.85 * k})`); b.addColorStop(1, "rgba(255,252,240,0)");
    x.fillStyle = b; x.fillRect(0, 0, w, h);
  }
  $("#introTitle").style.opacity = String(.18 + .82 * p);
  $("#introHint").style.opacity = String(Math.max(0, 1 - p * 2.5));
  requestAnimationFrame(drawIntro);
}
function openSky(){
  if (I.doneT || !I.on) return;
  I.doneT = performance.now(); I.p = 1; I.drag = null;
  setTimeout(() => {
    $("#intro").classList.add("gone");
    setTimeout(() => { I.on = false; $("#intro").hidden = true; if (I.resolve) I.resolve(); }, 900);
  }, 600);
}
export function runIntro(){
  I.on = true; $("#intro").hidden = false;
  requestAnimationFrame(drawIntro);
  return new Promise(r => { I.resolve = r; });
}
/* topic: today's { theme, place, event, next } shown under the title; event: today's special night or null,
   next: a special night coming within the week (game/topic.js nextEvent) or null */
export function bindIntro(topic){
  const t = $("#introTopic"); t.textContent = "";
  if (topic.event){
    const where = topic.event.title.includes(topic.place) ? "" : ` · ${topic.place}`;
    t.append(document.createTextNode("오늘은 "), el("b", null, `${topic.event.title} 특집`), document.createTextNode(where), el("span", "ev-note", topic.event.note));
  } else {
    t.append(document.createTextNode("오늘의 주제 "), el("b", null, topic.theme), document.createTextNode(` · ${topic.place}`));
    if (topic.next) t.append(el("span", "ev-note", `${shortDay(topic.next.day)}은 ${topic.next.title} 특집이에요 · D-${topic.next.inDays}`));
  }
  const ipt = ev => { const r = icv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
  icv.addEventListener("pointerdown", ev => {
    if (I.doneT) return;
    const p = ipt(ev), G = introGeo();
    if (p.y < G.h * .45) return;   /* start the push anywhere in the lower part of the screen */
    I.drag = { y0: p.y, p0: I.p };
    try { icv.setPointerCapture(ev.pointerId); } catch {}
  });
  icv.addEventListener("pointermove", ev => {
    if (!I.drag) return;
    const G = introGeo();
    I.p = Math.max(0, Math.min(1, I.drag.p0 + (I.drag.y0 - ipt(ev).y) / (G.y0 - G.y1)));
    if (I.p >= .97) openSky();
  });
  const endPush = () => { if (!I.drag) return; I.drag = null; if (I.p > .55) openSky(); };
  icv.addEventListener("pointerup", endPush);
  icv.addEventListener("pointercancel", endPush);
  $("#introOpen").addEventListener("click", openSky);
}
