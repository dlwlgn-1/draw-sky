/* Buttons, the entry form and keyboard shortcuts. */
import { S, draft, canAct, whyNot } from "../game/state.js";
import { NAME_MAX, STORY_MAX } from "../game/rules.js";
import { writeError } from "../game/store.js";
import { selectConst, stepConst, undoLine, clearLines, closeEntry, stepEntry, vote, postEntry, removeEntry, saveEntryImage } from "../game/actions.js";
import { requestDraw } from "../sky/motion.js";
import { renderBottom, renderSheet, openSheet, closeSheet, renderSpin, updateLens } from "./panels.js";
import { $, toast, store } from "./dom.js";
import { topicOf } from "../game/topic.js";
import { today } from "../game/time.js";

export function bindControls(){
  $("#spinBtn").addEventListener("click", () => {
    S.spin = !S.spin; store("rs-spin", S.spin); renderSpin();
    toast(S.spin ? "별자리를 바꿀 때 하늘이 움직여요" : "별자리가 바로 바뀌어요");
  });
  $("#prevC").addEventListener("click", () => stepConst(-1));
  $("#nextC").addEventListener("click", () => stepConst(1));
  $("#cname").addEventListener("click", () => openSheet("pick"));
  $("#badgeBtn").addEventListener("click", () => openSheet("badges"));
  document.querySelectorAll(".hall-link").forEach(b => b.addEventListener("click", () => openSheet("hall")));
  $("#topicBtn").addEventListener("click", () => {
    const tp = topicOf(today());
    if (tp.cid !== S.cid) selectConst(tp.cid);
    else toast(`오늘의 주제 ‘${tp.theme}’ · 예: ${tp.example}`);
  });
  $("#rankBtn").addEventListener("click", () => openSheet("rank"));
  $("#openForm").addEventListener("click", () => openSheet("form"));
  $("#ghostBtn").addEventListener("click", () => { S.ghost = !S.ghost; renderBottom(); requestDraw(); });
  $("#undoBtn").addEventListener("click", undoLine);
  $("#clearBtn").addEventListener("click", clearLines);

  $("#nameInput").addEventListener("input", e => { const d = draft(); d.name = e.target.value; d.touched = true; updateLens(); });
  $("#storyInput").addEventListener("input", e => { const d = draft(); d.story = e.target.value; d.touched = true; updateLens(); });
  $("#entryForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    if (S.posting) return;
    if (!canAct()){ toast(whyNot(), true); return; }
    const d = draft(), name = d.name.trim().slice(0, NAME_MAX), story = d.story.trim().slice(0, STORY_MAX);
    if (d.lines.length < 2){ toast("선을 두 개 이상 이어 주세요.", true); return; }
    if (!name){ toast("이름을 지어 주세요.", true); $("#nameInput").focus(); return; }
    S.posting = true; renderSheet();
    try {
      const again = await postEntry(name, story);
      S.posting = false; closeSheet();
      toast(again ? "고친 작품으로 바꿨어요" : "하늘에 올렸어요!");
    } catch (err){ S.posting = false; toast(writeError(err), true); renderSheet(); }
  });

  $("#vClose").addEventListener("click", closeEntry);
  $("#vSave").addEventListener("click", saveEntryImage);
  $("#vVote").addEventListener("click", () => { if (S.viewing) vote(S.viewing.author, S.cid, S.viewing.day); });
  $("#vPrev").addEventListener("click", () => stepEntry(-1));
  $("#vNext").addEventListener("click", () => stepEntry(1));
  $("#vRemove").addEventListener("click", () => {
    const b = $("#vRemove");
    if (b.dataset.confirm !== "1"){
      b.dataset.confirm = "1"; b.textContent = "정말 내릴까요? 한 번 더 누르면 내려가요";
      setTimeout(() => { b.dataset.confirm = ""; b.textContent = "내 작품 내리기"; }, 4000);
      return;
    }
    b.dataset.confirm = ""; b.textContent = "내 작품 내리기";
    removeEntry();
  });

  $("#sheetClose").addEventListener("click", closeSheet);
  $("#scrim").addEventListener("click", closeSheet);
  document.addEventListener("keydown", ev => {
    if (ev.key === "Escape"){ if (S.sheet) closeSheet(); else if (S.viewing) closeEntry(); return; }
    if (S.sheet || /INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName || "")) return;
    if (ev.key === "ArrowLeft") stepConst(-1);
    if (ev.key === "ArrowRight") stepConst(1);
  });
}
