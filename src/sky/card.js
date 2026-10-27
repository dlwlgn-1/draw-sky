/* A 1080×1350 picture of one entry on the real sky, for saving and sharing. */
import { paintBackdrop } from "./render.js";
import { rawXY, proj, starR } from "./projection.js";
import { chalk } from "./chalk.js";
import { COL, UI_FONT, NAME_FONT } from "../ui/dom.js";

const W = 1080, H = 1350, UNIT = 2.3;

/* lines of at most maxW pixels, breaking between characters (Korean has no spaces to wait for) */
function wrap(x, text, maxW, maxLines){
  const out = []; let line = "";
  for (const ch of text){
    if (x.measureText(line + ch).width > maxW && line){ out.push(line); line = ch.trimStart(); if (out.length === maxLines) break; }
    else line += ch;
  }
  if (out.length < maxLines && line) out.push(line);
  else if (out.length === maxLines && line) out[maxLines - 1] = out[maxLines - 1].slice(0, -1) + "…";
  return out;
}

/* entry: { name, story, lines, d }; c: its constellation; author: display name; theme: today's theme or "" */
export async function entryCard(entry, c, author, theme){
  try { await Promise.all([document.fonts.load(`700 72px ${NAME_FONT}`), document.fonts.load(`32px ${UI_FONT}`)]); } catch {}
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const x = cv.getContext("2d");

  /* frame the constellation in the upper part of the card */
  const top = 200, bot = 960;
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const o of c.sv){ const [X, Y] = rawXY(o, c.cra, c.cpt.sd, c.cpt.cd); minX = Math.min(minX, X); maxX = Math.max(maxX, X); minY = Math.min(minY, Y); maxY = Math.max(maxY, Y); }
  const s = Math.min(W * .78 / Math.max(maxX - minX, .36), (bot - top) * .86 / Math.max(maxY - minY, .36));
  const V = { ra: c.cra, sd: c.cpt.sd, cd: c.cpt.cd, s, ox: (minX + maxX) / 2, oy: (minY + maxY) / 2, cx: W / 2, cy: (top + bot) / 2 };
  paintBackdrop(x, V, W, H, UNIT, false);

  const P = c.sv.map(o => proj(o, V, -0.5)), R = c.sv.map(o => starR(o.mag, UNIT));
  x.lineCap = "round"; x.save(); x.strokeStyle = COL.chalk; x.shadowColor = "rgba(247,239,198,.55)"; x.shadowBlur = 14;
  chalk(x, P, R, entry.lines, { w: 4.6, gap: 11, passes: 2 }); x.restore();
  c.sv.forEach((o, i) => {
    const p = P[i]; if (!p) return; const r = R[i], gr = r * (o.mag < 2.6 ? 4.4 : 3);
    const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, gr);
    g.addColorStop(0, "rgba(247,239,198,.3)"); g.addColorStop(1, "rgba(247,239,198,0)");
    x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, gr, 0, 7); x.fill();
    x.fillStyle = COL.text; x.beginPath(); x.arc(p.x, p.y, r, 0, 7); x.fill();
  });

  /* shade top and bottom so the words read over the stars */
  for (const [y0, y1, a0, a1] of [[0, 190, .8, 0], [H - 470, H, 0, .92]]){
    const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(5,8,18,${a0})`); g.addColorStop(1, `rgba(5,8,18,${a1})`);
    x.fillStyle = g; x.fillRect(0, y0, W, y1 - y0);
  }
  const L = 80;
  x.textBaseline = "alphabetic";
  x.fillStyle = COL.sub; x.font = `30px ${UI_FONT}`; x.textAlign = "left"; x.fillText("다시 그린 하늘", L, 104);
  x.textAlign = "right"; x.fillText(entry.d.replace(/-/g, "."), W - L, 104);
  x.textAlign = "left";
  x.fillStyle = COL.chalk; x.font = `30px ${UI_FONT}`; x.fillText(theme ? `${c.title} · 오늘의 주제 ${theme}` : `${c.title} 위에 새로 그었어요`, L, H - 380);
  x.fillStyle = COL.text; x.font = `700 76px ${NAME_FONT}`;
  wrap(x, entry.name, W - 2 * L, 1).forEach((t, i) => x.fillText(t, L, H - 285 + i * 84));
  x.fillStyle = COL.sub; x.font = `32px ${UI_FONT}`; x.fillText(author, L, H - 225);
  if (entry.story){
    x.fillStyle = COL.text; x.font = `36px ${NAME_FONT}`;
    wrap(x, entry.story, W - 2 * L, 2).forEach((t, i) => x.fillText(t, L, H - 150 + i * 54));
  }
  return new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error("toBlob")), "image/png"));
}
