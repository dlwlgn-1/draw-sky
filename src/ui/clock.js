/* Countdown to the KST midnight close; when the day turns, everything re-renders for the new day. */
import { S } from "../game/state.js";
import { today, untilMidnight } from "../game/time.js";
import { renderUI } from "./panels.js";
import { $ } from "./dom.js";

function tick(){
  const left = Math.max(0, untilMidnight());
  const h = Math.floor(left / 36e5), m = Math.floor(left / 6e4) % 60, s = Math.floor(left / 1e3) % 60;
  $("#countdown").textContent = [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
  if (today() !== S.day){ S.day = today(); S.viewing = null; renderUI(); }
}

export function startClock(){ tick(); setInterval(tick, 1000); }
