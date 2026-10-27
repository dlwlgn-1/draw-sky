import { rng } from "./math.js";

/* a slightly bent, doubled stroke that stops short of each star, like chalk on a chart */
export function chalk(x, P, R, lines, o){
  for (const [a, b] of lines){
    const A = P[a], B = P[b]; if (!A || !B) continue;
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const ga = R[a] + o.gap, gb = R[b] + o.gap; if (len <= ga + gb + 2) continue;
    const p = { x: A.x + ux * ga, y: A.y + uy * ga }, q = { x: B.x - ux * gb, y: B.y - uy * gb };
    const r = rng(a * 977 + b * 131 + 7), bend = (r() - .5) * Math.min(9, len * .07);
    const mx = (p.x + q.x) / 2 - uy * bend, my = (p.y + q.y) / 2 + ux * bend;
    for (let k = 0; k < (o.passes || 1); k++){
      const j = k ? (r() - .5) * 1.4 : 0;
      x.globalAlpha = k ? .4 * (o.alpha || 1) : (o.alpha || .95); x.lineWidth = k ? o.w * .55 : o.w;
      x.beginPath(); x.moveTo(p.x + j, p.y - j); x.quadraticCurveTo(mx + j, my - j, q.x - j, q.y + j); x.stroke();
    }
  }
  x.globalAlpha = 1;
}
