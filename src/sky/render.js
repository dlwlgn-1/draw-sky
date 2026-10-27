/* Painting the big sky: background, Milky Way, deep-sky glows, stars, and the chosen constellation. */
import { S, cur, draft, viewedEntry } from "../game/state.js";
import { DATA } from "../data/constellations.js";
import { DSO } from "../data/deepSky.js";
import { SKY, FALLBACK } from "./catalog.js";
import { sky, rawXY, camera, proj, starR } from "./projection.js";
import { chalk } from "./chalk.js";
import { COL, UI_FONT } from "../ui/dom.js";

const ctx = sky.getContext("2d");

function paintBackground(x, w, h, cy, alpha){
  const g = x.createRadialGradient(w / 2, cy, 0, w / 2, cy, Math.hypot(w, h) * .62);
  g.addColorStop(0, "#0f162d"); g.addColorStop(.6, "#090e1f"); g.addColorStop(1, "#050812");
  x.globalAlpha = alpha; x.fillStyle = g; x.fillRect(0, 0, w, h); x.globalAlpha = 1;
}
/* the Milky Way is filled at 1/6 size and scaled up, which softens its edges like a long exposure */
const mwCanvas = document.createElement("canvas"), mwCtx = mwCanvas.getContext("2d");
const MW_FILL = [[.058, "150,164,214"], [.072, "168,179,222"], [.086, "194,196,224"], [.1, "218,210,216"], [.115, "236,222,208"]];
function paintMilky(x, V, w, h, k){
  if (!SKY.mw) return;
  const q = 6, cw = Math.ceil(w / q), ch = Math.ceil(h / q);
  if (mwCanvas.width !== cw || mwCanvas.height !== ch){ mwCanvas.width = cw; mwCanvas.height = ch; }
  const m = mwCtx; m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, cw, ch); m.setTransform(1 / q, 0, 0, 1 / q, 0, 0);
  SKY.mw.forEach((rings, lvl) => {
    m.beginPath();
    for (const ring of rings){
      ring.forEach((o, i) => {
        const [X, Y] = rawXY(o, V.ra, V.sd, V.cd, -0.55), px = V.cx - (X - V.ox) * V.s, py = V.cy - (Y - V.oy) * V.s;
        if (i) m.lineTo(px, py); else m.moveTo(px, py);
      });
      m.closePath();
    }
    const [a, rgb] = MW_FILL[lvl] || MW_FILL[4];
    m.fillStyle = `rgba(${rgb},${a})`; m.fill("evenodd");
  });
  x.save(); x.globalAlpha = k; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
  if ("filter" in x) x.filter = `blur(${Math.round(Math.min(w, h) / 60)}px)`;
  x.drawImage(mwCanvas, 0, 0, cw * q, ch * q); x.restore();
}
function paintDSO(x, V, w, h, k){
  x.save(); x.globalCompositeOperation = "lighter";
  for (const o of DSO){
    const p = proj(o, V, .2); if (!p) continue;
    const sc = V.s * 2 / (1 + p.cosc), A = Math.max(2, o.a * sc / 2), B = Math.max(1.5, o.b * sc / 2);
    if (p.x + A < 0 || p.y + A < 0 || p.x - A > w || p.y - A > h) continue;
    const n = proj(o.n, V, -1), north = n ? Math.atan2(n.y - p.y, n.x - p.x) : -Math.PI / 2;
    x.save(); x.translate(p.x, p.y); x.rotate(north - o.pa); x.scale(A, B);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${o.rgb},${o.k * k})`); g.addColorStop(.45, `rgba(${o.rgb},${o.k * .45 * k})`); g.addColorStop(1, `rgba(${o.rgb},0)`);
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore();
  }
  x.restore();
}
/* stars, binned by brightness and colour so each frame fills a few dozen paths */
function paintField(x, V, w, h, unit){
  for (const b of SKY.buckets){
    const r = b.r * unit;
    x.beginPath();
    for (const o of b.list){
      const p = proj(o, V, 0); if (!p || p.x < -2 || p.y < -2 || p.x > w + 2 || p.y > h + 2) continue;
      x.moveTo(p.x + r, p.y); x.arc(p.x, p.y, r, 0, 7);
    }
    x.fillStyle = `rgba(${b.rgb},${b.a})`; x.fill();
  }
  for (const o of SKY.ready ? SKY.bright : FALLBACK){
    const p = proj(o, V, 0); if (!p || p.x < -40 || p.y < -40 || p.x > w + 40 || p.y > h + 40) continue;
    const r = Math.max(1.3, Math.min(4.6, 1.3 + (3 - o.mag) * .75)) * unit;
    const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.4);
    g.addColorStop(0, `rgba(${o.rgb},.32)`); g.addColorStop(1, `rgba(${o.rgb},0)`);
    x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, r * 3.4, 0, 7); x.fill();
    x.fillStyle = `rgb(${o.rgb})`; x.beginPath(); x.arc(p.x, p.y, r * .75, 0, 7); x.fill();
    if (o.mag < 1.2){   /* faint diffraction spikes on the brightest stars, as in telescope photos */
      const L = r * (6 + (1.2 - o.mag) * 4); x.strokeStyle = `rgba(${o.rgb},.2)`; x.lineWidth = .8;
      x.beginPath(); x.moveTo(p.x - L, p.y); x.lineTo(p.x + L, p.y); x.moveTo(p.x, p.y - L); x.lineTo(p.x, p.y + L); x.stroke();
    }
  }
}

export function draw(){
  const w = sky.clientWidth, h = sky.clientHeight; if (!w || !h || !S.cam) return 1;
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(h * dpr);
  if (sky.width !== W || sky.height !== H){ sky.width = W; sky.height = H; }
  const x = ctx; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const V = camera(S.cam), unit = Math.min(1.3, Math.max(.85, Math.min(w, h) / 420));

  paintBackground(x, w, h, V.cy, 1);
  paintMilky(x, V, w, h, 1);
  paintDSO(x, V, w, h, 1);
  paintField(x, V, w, h, unit);
  const rv = S.reveal ? Math.min(1, (performance.now() - S.reveal) / 1000) : 1, rve = rv * rv * (3 - 2 * rv);

  /* other constellations: their stars, and their names as places to fly to */
  S.labels = [];
  x.font = `13px ${UI_FONT}`; x.textAlign = "center";
  for (const c of DATA){
    if (c.id === S.cid) continue;
    const cp = proj(c.cpt, V, .25);
    if (cp && cp.x > 30 && cp.x < w - 30 && cp.y > 40 && cp.y < h - 40){
      const label = `${c.ko}자리`, tw = x.measureText(label).width;
      x.globalAlpha = .6 * rve; x.fillStyle = COL.sub; x.fillText(label, cp.x, cp.y + 22);
      S.labels.push({ cid: c.id, x0: cp.x - tw / 2 - 12, x1: cp.x + tw / 2 + 12, y0: cp.y - 6, y1: cp.y + 34 });
    }
  }
  x.globalAlpha = 1; x.textAlign = "left";

  /* the chosen constellation lights up after the sky stops */
  const c = cur(), v = viewedEntry(), lines = v ? v.lines : draft().lines;
  S.P = c.sv.map(o => proj(o, V, -0.5)); S.R = c.sv.map(o => starR(o.mag, unit));
  x.lineCap = "round";
  if (S.ghost){ x.save(); x.setLineDash([3, 5]); x.strokeStyle = COL.sub; chalk(x, S.P, S.R, c.orig, { w: 1, gap: 4, alpha: .55 * rve }); x.restore(); }
  if (lines.length){ x.save(); x.strokeStyle = COL.chalk; x.shadowColor = "rgba(247,239,198,.5)"; x.shadowBlur = 6 + (1 - rve) * 14; chalk(x, S.P, S.R, lines, { w: 2.1, gap: 5, passes: 2, alpha: .95 * rve }); x.restore(); }
  const swell = 1 + (1 - rve) * 1.6;
  c.sv.forEach((o, i) => {
    const p = S.P[i]; if (!p) return; const r = S.R[i], gr = r * (o.mag < 2.6 ? 4.4 : 3) * swell;
    const gg = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, gr);
    gg.addColorStop(0, `rgba(247,239,198,${.3 * (.4 + .6 * rve)})`); gg.addColorStop(1, "rgba(247,239,198,0)");
    x.fillStyle = gg; x.beginPath(); x.arc(p.x, p.y, gr, 0, 7); x.fill();
    x.fillStyle = COL.text; x.beginPath(); x.arc(p.x, p.y, r, 0, 7); x.fill();
    if (i === S.selected && !v){ x.strokeStyle = COL.chalk; x.lineWidth = 2; x.beginPath(); x.arc(p.x, p.y, r + 7, 0, 7); x.stroke(); }
  });
  if (S.selected != null && !v && S.P[S.selected]){
    const s = c.stars[S.selected], p = S.P[S.selected], label = s[1] || `${s[0]} ${c.ab}`;
    x.font = `13px ${UI_FONT}`; const tw = x.measureText(label).width;
    let lx = p.x + 14, ly = p.y - 12; if (lx + tw > w - 8) lx = p.x - 14 - tw; if (ly < 16) ly = p.y + 24;
    x.fillStyle = "rgba(8,12,25,.82)"; x.beginPath(); if (x.roundRect) x.roundRect(lx - 6, ly - 14, tw + 12, 20, 6); else x.rect(lx - 6, ly - 14, tw + 12, 20); x.fill();
    x.fillStyle = COL.chalk; x.fillText(label, lx, ly);
  }
  return rv;
}
