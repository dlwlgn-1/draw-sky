/* The claude.ai artifact runtime (window.claude): shared database, who is playing, and saving files.
   The game reaches its backend only through the object returned here; backend/firebase.js has the same shape.
   vite.config.js picks one of the two as the "#backend" module.

   Backend shape:
     myId, canWrite              who is playing; canWrite null = unknown, let a refused write decide
     hasStore                    false when there is no shared database (then the game is draw-only)
     watchPlayers(onDocs, onErr) onDocs([[id, rawDoc], …]) on every change; returns an unsubscribe
     watchPlayer(id, onDoc, onErr) onDoc(rawDoc or null) for one document, mine, so it is never missed
     savePlayer(id, doc)         replace my own document
     names(ids)                  { id: display name or "" }
     saveFile(filename, blob)    offer a file to the player, or null when this view cannot
     needsNick                   true when the backend has no names, so players choose a nickname
     account(), signInGoogle(), signOut()   accounts, where the backend has them (Firebase); absent here
     setPresence(state)          share a small object about me with everyone here now (no-op without a room)
     watchPeers(onPeers)         onPeers([{ kind, isMe, by, peer, presence }, …]) when the room changes, or null */
export async function openBackend(){
  const c = window.claude;
  if (!c || typeof c.use !== "function") return null;
  /* each part may be missing in a given view; one missing part must not switch off the others */
  const safe = f => Promise.resolve().then(f).catch(() => null);
  const [db, user, downloads, room] = await Promise.all(["db", "user", "downloads", "room"].map(n => safe(() => c.use(n))));
  return {
    myId: user ? await safe(() => user.id()) : null,
    canWrite: user ? await safe(() => user.can("data.write")) : null,
    hasStore: !!db,
    watchPlayers(onDocs, onErr){
      return db.collection("players").limit(1000).onSnapshot(snap => onDocs(snap.docs.filter(d => d.exists).map(d => [d.id, d.data()])), onErr);
    },
    watchPlayer(id, onDoc, onErr){
      return db.doc("players/" + id).onSnapshot(snap => onDoc(snap.exists ? snap.data() : null), onErr);
    },
    savePlayer: (id, doc) => db.doc("players/" + id).set(doc),
    async names(ids){
      if (!user || !ids.length) return {};
      try { const ps = await user.profiles(ids); return Object.fromEntries(ids.map(id => [id, (ps[id] && ps[id].name) || ""])); }
      catch { return {}; }
    },
    saveFile: downloads ? (filename, blob) => downloads.save({ filename, data: blob }) : null,
    setPresence: room ? state => { room.presence(state).catch(() => {}); } : () => {},
    watchPeers: room ? onPeers => room.onPeers(ch => onPeers(ch.peers), () => {}) : null
  };
}
