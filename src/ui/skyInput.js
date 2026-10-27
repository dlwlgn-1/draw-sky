/* Touch and mouse on the sky: tap a star, then another to connect; dragging between stars works too.
   A sideways swipe that starts off a star moves to the next constellation. */
import { S } from "../game/state.js";
import { toggleLine, selectConst, stepConst } from "../game/actions.js";
import { sky } from "../sky/projection.js";
import { flyTo, requestDraw, isMoving } from "../sky/motion.js";
import { renderBottom } from "./panels.js";

function pt(ev){ const r = sky.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }

/* nearest star of the chosen constellation within reach of a finger (or a mouse) */
function hit(p, touch){
  let best = null, bd = (touch ? 30 : 20) ** 2;
  S.P.forEach((q, i) => { if (!q) return; const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2; if (d < bd){ bd = d; best = i; } });
  return best;
}
const labelAt = p => S.labels.find(l => p.x >= l.x0 && p.x <= l.x1 && p.y >= l.y0 && p.y <= l.y1);

export function bindSkyInput(){
  let gest = null;
  /* one finger at a time: a second finger is ignored until the first lifts */
  sky.addEventListener("pointerdown", ev => {
    if (isMoving() || gest) return;
    const p = pt(ev), star = S.viewing ? null : hit(p, ev.pointerType !== "mouse");
    S.down = star;
    gest = { id: ev.pointerId, x0: p.x, y0: p.y, t0: performance.now(), star, swiping: false, base: { ...S.cam } };
    try { sky.setPointerCapture(ev.pointerId); } catch {}
  });
  sky.addEventListener("pointermove", ev => {
    if (!gest || ev.pointerId !== gest.id || gest.star != null || isMoving()) return;
    const p = pt(ev), dx = p.x - gest.x0, dy = p.y - gest.y0;
    if (!gest.swiping && Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.3) gest.swiping = true;
    if (gest.swiping){ S.cam = { ...gest.base, ox: gest.base.ox + dx / gest.base.s * .9 }; requestDraw(true); }
  });
  sky.addEventListener("pointercancel", ev => {
    if (!gest || ev.pointerId !== gest.id) return;
    if (gest.swiping) flyTo(S.cid, true);
    gest = null; S.down = null;
  });
  sky.addEventListener("pointerup", ev => {
    if (!gest || ev.pointerId !== gest.id) return;
    const g = gest; gest = null;
    const start = S.down; S.down = null;
    if (isMoving()) return;
    const p = pt(ev), touch = ev.pointerType !== "mouse";
    if (g && g.swiping){
      const dx = p.x - g.x0, v = dx / Math.max(1, performance.now() - g.t0);
      if (Math.abs(dx) > 70 || Math.abs(v) > .5) stepConst(dx < 0 ? 1 : -1);
      else flyTo(S.cid, true);
      return;
    }
    if (S.viewing){ const l = labelAt(p); if (l) selectConst(l.cid); return; }
    const i = hit(p, touch);
    if (i == null){
      const l = start == null && labelAt(p);
      if (l){ selectConst(l.cid); return; }
      if (S.selected != null){ S.selected = null; renderBottom(); requestDraw(); }
      return;
    }
    if (start != null && i !== start){ toggleLine(start, i); S.selected = i; }
    else if (S.selected != null && S.selected !== i){ toggleLine(S.selected, i); S.selected = i; }
    else S.selected = S.selected === i ? null : i;
    renderBottom(); requestDraw();
  });
}
