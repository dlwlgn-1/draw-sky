/* Stereographic camera: where a point of the sky lands on the screen. */
import { $ } from "../ui/dom.js";
import { S } from "../game/state.js";
import { BYID } from "../data/constellations.js";

export const sky = $("#sky");

/* projected coordinates around (ra0, dec0); floor limits how far the far side is pushed out */
export function rawXY(o, ra0, sd0, cd0, floor = -0.95){
  const da = o.ra - ra0, cda = Math.cos(da), cosc = sd0 * o.sd + cd0 * o.cd * cda, k = 2 / (1 + Math.max(cosc, floor));
  return [k * o.cd * Math.sin(da), k * (cd0 * o.sd - sd0 * o.cd * cda), cosc];
}

/* the band of screen between the title (with today's topic) and the bottom controls, where a constellation is framed */
function region(){
  const h = sky.clientHeight;
  const top = Math.min($("#topUI").getBoundingClientRect().bottom + 8, h * .4);
  const pane = S.viewing ? $("#vcard") : $("#drawUI");
  const bot = Math.max(pane.getBoundingClientRect().top - 8, h * .5);
  return { top, bot };
}

/* camera state that frames constellation cid */
export function fit(cid){
  const c = BYID[cid], w = sky.clientWidth, { top, bot } = region();
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const o of c.sv){ const [X, Y] = rawXY(o, c.cra, c.cpt.sd, c.cpt.cd); minX = Math.min(minX, X); maxX = Math.max(maxX, X); minY = Math.min(minY, Y); maxY = Math.max(maxY, Y); }
  const bw = Math.max(maxX - minX, .36), bh = Math.max(maxY - minY, .36);
  const s = Math.min(w * .8 / bw, Math.max(140, bot - top) * .84 / bh);
  return { ra: c.cra, dec: c.cdec, s, ox: (minX + maxX) / 2, oy: (minY + maxY) / 2, cy: (top + bot) / 2 };
}

export function camera(st){
  return { ra: st.ra, sd: Math.sin(st.dec), cd: Math.cos(st.dec), s: st.s, ox: st.ox, oy: st.oy, cx: sky.clientWidth / 2, cy: st.cy };
}

/* screen position of a sky point, or null when it is too far round the back */
export function proj(o, V, limit = -0.15){
  const [X, Y, cosc] = rawXY(o, V.ra, V.sd, V.cd);
  if (cosc < limit) return null;
  return { x: V.cx - (X - V.ox) * V.s, y: V.cy - (Y - V.oy) * V.s, cosc };
}

export const starR = (mag, unit) => Math.min(5.6, Math.max(1.25, (5 - mag) * 1.05)) * unit;
