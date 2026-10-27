/* 다시 그린 하늘 — entry point. Wires the modules together and opens the page. */
import { DATA, BYID } from "./data/constellations.js";
import { S } from "./game/state.js";
import { cleanLines, str, NAME_MAX, STORY_MAX } from "./game/rules.js";
import { connect } from "./game/store.js";
import { loadSky } from "./sky/catalog.js";
import { sky, fit } from "./sky/projection.js";
import { draw } from "./sky/render.js";
import { startReveal, isMoving } from "./sky/motion.js";
import { renderTop, renderBottom, renderSpin } from "./ui/panels.js";
import { bindControls } from "./ui/controls.js";
import { bindSkyInput } from "./ui/skyInput.js";
import { bindIntro, runIntro } from "./ui/intro.js";
import { startClock } from "./ui/clock.js";
import { $, load } from "./ui/dom.js";

/* reframe the current constellation unless the camera is mid-flight */
const refit = () => { if (!isMoving()){ S.cam = fit(S.cid); draw(); } };

/* data: what an open view handed over when the page was republished (empty on a fresh visit) */
function start(data){
  const drafts = data.drafts;
  if (drafts && typeof drafts === "object"){
    for (const c of DATA){
      const d = drafts[c.id];
      if (d && typeof d === "object") S.drafts[c.id] = { lines: cleanLines(d.lines, c.stars.length), name: str(d.name, NAME_MAX), story: typeof d.story === "string" ? d.story.slice(0, STORY_MAX) : "", touched: !!d.touched };
    }
  }
  const cid = data.cid || load("rs-cid"); if (typeof cid === "string" && Object.hasOwn(BYID, cid)) S.cid = cid;
  if (data.ghost) S.ghost = true;
  S.spin = load("rs-spin") !== false; renderSpin();

  bindControls(); bindSkyInput(); bindIntro();
  startClock();
  renderTop(); renderBottom();
  S.cam = fit(S.cid); draw();

  let rT;
  new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(refit, 80); }).observe(sky);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);

  const skyLoaded = fetch("sky.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => { loadSky(d); refit(); }).catch(() => {});
  /* a republish lands straight on the sky; a fresh visit starts at the entrance */
  const entered = data.cid ? ($("#intro").hidden = true, Promise.resolve()) : runIntro();
  Promise.all([skyLoaded, entered]).then(() => { if (!isMoving()){ S.cam = fit(S.cid); startReveal(); } });
  connect();
}

const hot = window.claude && window.claude.hot;
if (hot && hot.snapshot) hot.snapshot(() => ({ drafts: S.drafts, cid: S.cid, ghost: S.ghost }));
hot && hot.ready ? hot.ready(start) : start((hot && hot.data) || {});
