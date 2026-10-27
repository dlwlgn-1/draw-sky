/* The claude.ai artifact runtime (window.claude): shared database, who is playing, and saving files.
   The game reaches its backend only through the object returned here, so hosting it elsewhere means
   writing one more file with the same shape (for example on Firebase) and choosing it in game/store.js.

   Backend shape:
     myId, canWrite              who is playing; canWrite null = unknown, let a refused write decide
     hasStore                    false when there is no shared database (then the game is draw-only)
     watchPlayers(onDocs, onErr) onDocs([[id, rawDoc], …]) on every change; returns an unsubscribe
     savePlayer(id, doc)         replace my own document
     names(ids)                  { id: display name or "" }
     saveFile(filename, blob)    offer a file to the player, or null when this view cannot */
export async function openClaudeBackend(){
  const c = window.claude;
  if (!c || typeof c.use !== "function") return null;
  const [db, user, downloads] = await Promise.all([c.use("db"), c.use("user"), c.use("downloads")]);
  return {
    myId: user ? await user.id() : null,
    canWrite: user ? await user.can("data.write") : null,
    hasStore: !!db,
    watchPlayers(onDocs, onErr){
      return db.collection("players").limit(1000).onSnapshot(snap => onDocs(snap.docs.filter(d => d.exists).map(d => [d.id, d.data()])), onErr);
    },
    savePlayer: (id, doc) => db.doc("players/" + id).set(doc),
    async names(ids){
      if (!user || !ids.length) return {};
      try { const ps = await user.profiles(ids); return Object.fromEntries(ids.map(id => [id, (ps[id] && ps[id].name) || ""])); }
      catch { return {}; }
    },
    saveFile: downloads ? (filename, blob) => downloads.save({ filename, data: blob }) : null
  };
}
