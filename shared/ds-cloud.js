/* daily space: вход, проверка доступа и хранение записей для проектов заказчиков.
   Подключение: <script src="../shared/ds-cloud.js" data-project="uyutnye-budni" data-title="уютные будни"></script>
   Трекер ждёт window.DS_CLOUD.ready() и сохраняет через window.DS_CLOUD.save(json).
   Доступ: projects/<проект>/access/<почта> (открывает Леся в /admin/).
   Записи: projects/<проект>/users/<uid>, поле json со всем состоянием. */
(function(){
  const me = document.currentScript;
  const PROJECT = me.dataset.project;
  const TITLE = me.dataset.title || "daily space";
  const CFG = window.FIREBASE_CONFIG;
  const EMAIL_KEY = "ds-email-for-link";
  if (!CFG || !window.firebase || !PROJECT) return;

  firebase.initializeApp(CFG);
  const auth = firebase.auth();
  const db = firebase.firestore();
  auth.languageCode = "ru";
  const base = db.collection("projects").doc(PROJECT);

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  /* ---------- экран входа ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .gate{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;overflow:auto;
    background:repeating-linear-gradient(90deg, transparent 0 52px, rgba(0,0,0,.035) 52px 55px, transparent 55px 120px), var(--bg, #f6ece5)}
  .gate[hidden]{display:none}
  .gate-card{position:relative;width:min(440px,100%);background:var(--milk,#fbf4ea);padding:54px 30px 30px;box-shadow:0 18px 40px rgba(60,20,20,.16);text-align:center}
  .gate-card::before{content:"";position:absolute;left:0;right:0;top:0;height:16px;background:var(--pat-tartan, #7d1f2d)}
  .gate h2{margin:0;font-family:var(--f-disp, Georgia, serif);font-weight:400;font-size:42px;line-height:1.05;color:var(--bord,#7d1f2d)}
  .gate .g-hand{font-family:var(--f-hand, cursive);font-size:21px;color:var(--pink-dk,#d0708a);margin:8px 0 18px}
  .gate p{margin:0 0 16px;color:var(--ink-soft,#7a5a4e);font-size:15px;line-height:1.45}
  .gate .g-btn{display:flex;width:100%;align-items:center;justify-content:center;border:0;border-radius:999px;padding:13px 18px;font-weight:600;font-size:15px;
    background:var(--choc,#4b2a20);color:var(--milk,#fbf4ea);cursor:pointer;text-decoration:none;font-family:inherit}
  .gate .g-btn.ghost{background:transparent;color:var(--choc,#4b2a20);border:1.5px solid var(--choc,#4b2a20)}
  .gate .g-or{display:flex;align-items:center;gap:10px;margin:16px 0;color:var(--ink-soft,#7a5a4e);font-size:13px}
  .gate .g-or::before,.gate .g-or::after{content:"";flex:1;border-top:1.5px dashed rgba(0,0,0,.15)}
  .gate input{width:100%;border:0;border-bottom:1.5px solid rgba(0,0,0,.3);background:transparent;padding:8px 2px;font-size:16px;margin-bottom:12px;text-align:center;color:inherit;font-family:inherit}
  .gate input:focus{outline:none;border-bottom-color:var(--pink-dk,#d0708a)}
  .gate .g-err{color:#a8432f;font-size:13px;min-height:18px;margin-top:10px}
  .gate .g-small{margin-top:14px;font-size:13px}
  .gate .g-small button{border:0;background:none;padding:0;color:var(--ink-soft,#7a5a4e);text-decoration:underline;cursor:pointer;font:inherit}
  .cloud-user{display:inline-flex;gap:8px;align-items:center}
  .cloud-user button{border:0;background:none;padding:0;text-decoration:underline;cursor:pointer;font:inherit;color:inherit}`;
  document.head.appendChild(css);

  const gate = document.createElement("div");
  gate.className = "gate";
  gate.innerHTML = '<div class="gate-card" id="gateCard"></div>';
  document.body.appendChild(gate);
  const card = gate.querySelector("#gateCard");
  const head = '<h2>' + esc(TITLE) + '</h2><div class="g-hand">твой личный трекер</div>';

  function show(html){ gate.hidden = false; card.innerHTML = head + html; }
  function showLoading(text){ show('<p>' + esc(text || "открываю…") + '</p>'); }
  function showLogin(err){
    show('<p>войди, чтобы открыть свой трекер. используй ту почту, для которой открыт доступ.</p>' +
      '<button class="g-btn" id="gGoogle">войти через Google</button>' +
      '<div class="g-or">или по ссылке на почту</div>' +
      '<form id="gMailForm"><input id="gMail" type="email" required placeholder="твоя почта" autocomplete="email"><button class="g-btn ghost" type="submit">прислать ссылку для входа</button></form>' +
      '<div class="g-err">' + esc(err || "") + '</div>');
    card.querySelector("#gGoogle").onclick = google;
    card.querySelector("#gMailForm").onsubmit = sendLink;
  }
  function showSent(email){
    show('<p>письмо со ссылкой отправлено на <b>' + esc(email) + '</b>.</p><p>открой ссылку из письма на этом же устройстве. если письма нет пару минут, загляни в «спам».</p>' +
      '<div class="g-small"><button id="gBack">ввести другую почту</button></div>');
    card.querySelector("#gBack").onclick = () => showLogin();
  }
  function showNoAccess(email){
    show('<p>для почты <b>' + esc(email) + '</b> доступ к этому трекеру не открыт.</p><p>проверь, что входишь с той почтой, которую указывала. если всё верно, напиши тому, кто прислал тебе ссылку.</p>' +
      '<button class="g-btn ghost" id="gOut">выйти и войти с другой почтой</button>');
    card.querySelector("#gOut").onclick = () => auth.signOut();
  }

  async function google(){
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try { await auth.signInWithPopup(provider); }
    catch (e) {
      if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) {
        try { await auth.signInWithRedirect(provider); } catch (e2) { showLogin("не получилось войти: " + (e2.code || e2.message)); }
      } else if (!(e && (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request"))) showLogin("не получилось войти (" + (e.code || e.message) + "). попробуй вход по ссылке на почту или напиши тому, кто прислал ссылку.");
    }
  }
  async function sendLink(ev){
    ev.preventDefault();
    const email = card.querySelector("#gMail").value.trim().toLowerCase();
    if (!email) return;
    try {
      await auth.sendSignInLinkToEmail(email, { url: location.origin + location.pathname, handleCodeInApp: true });
      try { localStorage.setItem(EMAIL_KEY, email); } catch (e) {}
      showSent(email);
    } catch (e) { showLogin("не получилось отправить письмо: " + (e.code || e.message)); }
  }
  async function finishLink(){
    if (!auth.isSignInWithEmailLink(location.href)) return;
    let email = "";
    try { email = localStorage.getItem(EMAIL_KEY) || ""; } catch (e) {}
    if (!email) email = (prompt("подтверди почту, на которую пришла ссылка") || "").trim().toLowerCase();
    try {
      await auth.signInWithEmailLink(email, location.href);
      try { localStorage.removeItem(EMAIL_KEY); } catch (e) {}
    } catch (e) { showLogin("ссылка не сработала, возможно, она устарела. запроси новую."); }
    history.replaceState(null, "", location.pathname);
  }

  /* ---------- данные ---------- */
  let resolveReady, uid = null, busy = Promise.resolve(), started = false;
  const ready = new Promise(r => { resolveReady = r; });

  auth.onAuthStateChanged(async user => {
    if (!user) { if (!started) showLogin(); else location.reload(); return; }
    if (started) return;
    showLoading();
    const email = (user.email || "").toLowerCase();
    try {
      const acc = await base.collection("access").doc(email).get();
      if (!acc.exists) { showNoAccess(email); return; }
    } catch (e) { showNoAccess(email); return; }
    try {
      const snap = await base.collection("users").doc(user.uid).get();
      uid = user.uid; started = true;
      gate.hidden = true;
      resolveReady(snap.exists ? (snap.data().json || null) : null);
      addUserLine(email);
    } catch (e) { show('<p>не получилось загрузить записи: ' + esc(e.code || e.message) + '</p><p>почта: <b>' + esc(email) + '</b></p><button class="g-btn" onclick="location.reload()">попробовать ещё раз</button><div class="g-small"><button id="gOut2">выйти</button></div>'); const o = card.querySelector("#gOut2"); if (o) o.onclick = () => auth.signOut(); }
  });

  function addUserLine(email){
    const foot = document.querySelector(".foot");
    if (!foot) return;
    const el = document.createElement("span");
    el.className = "cloud-user";
    el.innerHTML = esc(email) + ' · <button type="button">выйти</button>';
    el.querySelector("button").onclick = () => auth.signOut();
    foot.appendChild(el);
  }

  window.DS_CLOUD = {
    ready: () => ready,
    // сохранения идут по очереди, чтобы более старое не перезаписало новое
    save: json => {
      if (!uid) return Promise.resolve();
      const p = busy.then(() => base.collection("users").doc(uid).set({
        json, email: (auth.currentUser && auth.currentUser.email) || "", updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
      busy = p.catch(() => {});
      return p;
    }
  };

  showLoading();
  finishLink();
})();
