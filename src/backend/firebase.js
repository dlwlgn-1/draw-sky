/* Firebase backend: the same shape as backend/claude.js, for running the game as an ordinary website.
   Players sign in anonymously (one id per browser), documents live in Firestore under players/<uid>,
   and "who is here now" is a presence/<uid> document refreshed every 2 minutes (slow on purpose: every refresh
   is read by everyone watching, and Firestore's free plan counts reads).
   Configure with VITE_FIREBASE_* in .env.local (see .env.example). */
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from "firebase/auth";
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp, query, limit, connectFirestoreEmulator } from "firebase/firestore";

const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
};
const BEAT = 120e3, FRESH = 300e3;   // refresh my presence this often; one older than FRESH means the page has gone

/* Firestore cannot store arrays inside arrays, so each entry's lines [[a, b], …] are kept flat as [a, b, a, b, …] */
function mapLines(d, f){
  if (!d) return d;
  const out = { ...d };
  for (const part of ["entries", "hall"]) if (d[part] && typeof d[part] === "object"){
    out[part] = {};
    for (const [k, e] of Object.entries(d[part])) out[part][k] = e && Array.isArray(e.lines) ? { ...e, lines: f(e.lines) } : e;
  }
  return out;
}
const flatLines = lines => lines.flat();
const pairLines = v => v.every(x => !Array.isArray(x)) ? Array.from({ length: Math.floor(v.length / 2) }, (_, i) => [v[2 * i], v[2 * i + 1]]) : v;
const fromStore = d => mapLines(d, pairLines);

/* Firestore's error codes, in the words the rest of the game already understands (see game/store.js writeError) */
const CODES = { "permission-denied": "invalid_argument", "resource-exhausted": "resource_exhausted", unauthenticated: "invalid_argument" };
const translate = err => { throw { code: CODES[err && err.code] || (err && err.code) || "unavailable", message: String(err && err.message) }; };

export async function openBackend(){
  if (!config.projectId) return null;
  const app = initializeApp(config), auth = getAuth(app), db = getFirestore(app);
  if (env.VITE_FIREBASE_EMULATOR){   // local testing against `firebase emulators:start`
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  const user = await new Promise((resolve, reject) => {
    const stop = onAuthStateChanged(auth, u => { if (u){ stop(); resolve(u); } });
    signInAnonymously(auth).catch(err => { stop(); reject(err); });
  });
  const uid = user.uid;

  /* presence: my document, written on change and every BEAT; removed when the page goes away */
  const mine = doc(db, "presence", uid);
  let state = null, beat = 0;
  const send = () => state && setDoc(mine, { ...state, at: serverTimestamp() }).catch(() => {});
  addEventListener("pagehide", () => { deleteDoc(mine).catch(() => {}); });

  return {
    myId: uid, canWrite: true, hasStore: true,
    needsNick: true,   // no account names here: players pick a nickname, kept in their own document
    watchPlayers(onDocs, onErr){
      return onSnapshot(query(collection(db, "players"), limit(1000)), snap => onDocs(snap.docs.map(d => [d.id, fromStore(d.data())])), onErr);
    },
    watchPlayer(id, onDoc, onErr){
      return onSnapshot(doc(db, "players", id), snap => onDoc(snap.exists() ? fromStore(snap.data()) : null), onErr);
    },
    savePlayer: (id, data) => setDoc(doc(db, "players", id), mapLines(data, flatLines)).catch(translate),
    names: async () => ({}),
    async saveFile(filename, blob){
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      return { status: "saved" };
    },
    setPresence(next){
      state = next; send();
      if (!beat) beat = setInterval(send, BEAT);
    },
    watchPeers(onPeers){
      let docs = [];
      const report = () => {
        const now = Date.now();
        onPeers(docs.filter(d => d.at && now - d.at < FRESH).map(d => ({ kind: "viewer", isMe: d.id === uid, by: d.id, peer: d.id, presence: { cid: d.cid, drawing: d.drawing } })));
      };
      const stop = onSnapshot(collection(db, "presence"), snap => {
        docs = snap.docs.map(d => { const v = d.data(); return { id: d.id, cid: v.cid, drawing: v.drawing === true, at: v.at && v.at.toMillis ? v.at.toMillis() : Date.now() }; });
        report();
      }, () => {});
      const tick = setInterval(report, 60e3);   // drop pages that went quiet without saying goodbye
      return () => { stop(); clearInterval(tick); };
    }
  };
}
