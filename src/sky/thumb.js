/* Small pictures of one constellation for lists, using a flat projection of its stars. */
import { starR } from "./projection.js";
import { chalk } from "./chalk.js";
import { COL } from "../ui/dom.js";

/* o: { lines, ghost, ghostAlpha, bare } — bare leaves the background transparent */
export function drawThumb(cv, c, o = {}){
  const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(h * dpr);
  if (cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; }
  const x = cv.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const b = c.box, bw = (b.maxX - b.minX) || 1, bh = (b.maxY - b.minY) || 1, pad = Math.max(5, w * .1);
  const s = Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh), ox = (w - bw * s) / 2 - b.minX * s, oy = (h - bh * s) / 2 - b.minY * s;
  const P = c.pts.map(p => ({ x: p.x * s + ox, y: p.y * s + oy })), unit = Math.max(.42, w / 170), R = c.stars.map(st => starR(st[4], unit) * .9);
  if (o.bare) x.clearRect(0, 0, w, h);
  else { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * .7); g.addColorStop(0, "#18213f"); g.addColorStop(1, "#090d1b"); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  x.lineCap = "round";
  if (o.ghost){ x.save(); x.setLineDash([2, 3]); x.strokeStyle = COL.sub; chalk(x, P, R, c.orig, { w: 1, gap: 1.5, alpha: o.ghostAlpha || .5 }); x.restore(); }
  if (o.lines && o.lines.length){ x.strokeStyle = COL.chalk; chalk(x, P, R, o.lines, { w: 1.2, gap: 1.5 }); }
  x.fillStyle = COL.text;
  P.forEach((p, i) => { x.beginPath(); x.arc(p.x, p.y, R[i], 0, 7); x.fill(); });
}
