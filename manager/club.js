/* =========================================================
   SPORT EVENTS CLUB · lo propio de la versión para clubs
   Se carga después de online.js y adapta la Manager:
   · cada usuario trabaja dentro de su club (eventos, agenda, responsable y gestores de eventos)
   · registro de clubs (quedan pendientes hasta que el creador los aprueba)
   · «Mi club»: el responsable da de alta gestores de eventos, los enciende o apaga y les cambia la contraseña
   · panel del creador: aprobar, suspender o reactivar clubs
   ========================================================= */
"use strict";
const FN_CLUB = SUPABASE_URL + "/functions/v1/club";
const WEB_CLUB = WEB_URL;
cloud.club = null; cloud.clubs = [];
window.clubWebUrl = () => cloud.club ? WEB_CLUB + "?club=" + cloud.club.slug : WEB_CLUB;
const esResponsable = () => cloud.creador || (cloud.club && cloud.club.rol === "responsable");

// Cabecera: logo y nombre del club
function pintarClub(){
  const small = document.querySelector("header h1 small"), ver = $("appVer");
  if (small && ver) { small.firstChild && small.firstChild.nodeType === 3 && (small.firstChild.textContent = (cloud.club ? cloud.club.nombre.toUpperCase() : "CLUB") + " "); }
  let img = $("clubLogo");
  if (cloud.club && cloud.club.logo_url) {
    if (!img) { img = document.createElement("img"); img.id = "clubLogo"; img.alt = ""; img.style.cssText = "width:34px;height:34px;border-radius:50%;object-fit:cover;margin-right:8px;flex:none;background:#fff"; const h1 = document.querySelector("header h1"); h1.parentNode.insertBefore(img, h1); }
    img.src = cloud.club.logo_url;
  } else if (img) img.remove();
}

// Al entrar: clubs del usuario y club con el que trabaja
setUser = async function(user){
  cloud.user = user; cloud.organizer = false; cloud.creador = false; cloud.clubs = []; cloud.club = null;
  if (user) {
    try { const r = await cloud.sb.rpc("es_superadmin"); cloud.creador = !r.error && r.data === true; } catch(e) { }
    try { const r = await cloud.sb.rpc("mis_clubs"); cloud.clubs = r.error ? [] : (r.data || []); } catch(e) { }
    const activos = cloud.clubs.filter(c => c.estado === "activo"), guardado = store.get("clubActual", null);
    cloud.club = activos.find(c => c.id === guardado) || activos[0] || null;
    cloud.organizer = !!cloud.club || cloud.creador;
    if (cloud.club) store.set("clubActual", cloud.club.id);
    if (cloud.club) { await syncAgenda(); await loadPools(); } else { cloud.pools = []; }
  }
  pintarClub();
};
async function cambiarClub(id){
  cloud.club = cloud.clubs.find(c => c.id === id) || cloud.club;
  store.set("clubActual", cloud.club.id); store.set("cloudPool", null); cloud.pool = null;
  await guard(async () => { await syncAgenda(); await loadPools(); });
  pintarClub(); cloud.vista = "menu"; renderCloud();
}

// Club con el que se trabaja (la agenda y los eventos se guardan con él)
function clubId(){ return cloud.club ? cloud.club.id : null; }

// Eventos: todos los del club (el responsable y los gestores del club gestionan todos)
loadPools = async function(){
  if (!cloud.club) { cloud.pools = []; cloud.cuentas = {}; await selectPool(null); return; }
  const { data, error } = await cloud.sb.from("pools").select("*").eq("club_id", cloud.club.id).order("fecha", {ascending: false}).order("created_at", {ascending: false}).limit(80);
  if (error) throw error;
  cloud.pools = data; cloud.cuentas = {};
  if (data.length) {
    const r = await cloud.sb.from("inscripciones").select("pool_id").in("pool_id", data.map(x => x.id));
    if (!r.error) (r.data || []).forEach(x => cloud.cuentas[x.pool_id] = (cloud.cuentas[x.pool_id] || 0) + 1);
  }
  const linked = store.get("cloudPool", null);
  await selectPool(data.find(x => x.id === linked) || data[0] || null);
};

// Los eventos nuevos son del club con el que se trabaja; sin administradores por evento (los del club valen para todos)
const _savePool = savePool;
savePool = (row, id) => _savePool(id ? row : {...row, club_id: cloud.club && cloud.club.id}, id);
guardarAdmins = async () => { };
const _poolFormHtml = poolFormHtml;
poolFormHtml = (px, v, boton) => _poolFormHtml(px, v, boton).replace(/<div class="lbl">👥 Otros administradores[\s\S]*?<\/div><\/div>\s*/, "");

// Login: además, registrar un club
const _renderLogin = renderLogin;
renderLogin = box => {
  if (cloud.vista === "registro") { renderRegistro(box); return; }
  _renderLogin(box);
  const tx = box.querySelector(".card p.help");
  if (tx) tx.textContent = "Entra con el email y la contraseña de tu club (responsable o gestor de eventos). Solo hay que hacerlo una vez: la sesión queda guardada.";
  const c = document.createElement("div"); c.className = "card"; c.style.textAlign = "center";
  c.innerHTML = `<div style="font-weight:700">🏢 ¿Tu club aún no usa Sport Events?</div>
    <p class="help" style="margin:4px 0 10px">Registra tu club de pádel o tenis. Lo revisamos y te avisamos cuando esté activo.</p>
    <button class="btn" id="cRegClub" style="width:100%">Registrar mi club</button>`;
  box.appendChild(c);
  $("cRegClub").onclick = () => { cloud.vista = "registro"; renderCloud(); };
};
function renderRegistro(box){
  titulos("🏢 Registrar mi club", "Quedará pendiente hasta que lo aprobemos. Después podrás dar de alta a tus gestores de eventos.");
  box.innerHTML = `<button class="btn small ghost" id="rVolver" style="margin-bottom:10px">‹ Volver</button>
    <div class="card" style="display:grid;gap:8px">
      <label class="lbl">Nombre del club<input type="text" id="rClub" placeholder="Club de Raqueta de…" maxlength="80"></label>
      <label class="lbl">Ciudad<input type="text" id="rCiudad" maxlength="60"></label>
      <label class="lbl">Email del responsable<input type="email" id="rEmail" autocomplete="username"></label>
      <label class="lbl">Teléfono de contacto<input type="text" inputmode="tel" id="rTel"></label>
      <label class="lbl">Contraseña (mínimo 8 caracteres)<input type="password" id="rPass" autocomplete="new-password"></label>
      <button class="btn primary" id="rEnviar">Registrar club</button>
      <p class="help" style="margin:0">Con este email y contraseña entrarás en la app como responsable del club.</p>
    </div>`;
  $("rVolver").onclick = () => { cloud.vista = "menu"; renderCloud(); };
  $("rEnviar").onclick = async () => {
    const b = {accion: "registrar", club: $("rClub").value.trim(), ciudad: $("rCiudad").value.trim(), email: $("rEmail").value.trim(), telefono: $("rTel").value.trim(), password: $("rPass").value};
    if (!b.club || !b.email || b.password.length < 8) { toast("Rellena el nombre del club, el email y una contraseña de 8 caracteres o más"); return; }
    $("rEnviar").disabled = true;
    try {
      const r = await fetch(FN_CLUB, {method: "POST", headers: {"Content-Type": "application/json", apikey: SUPABASE_KEY}, body: JSON.stringify(b)});
      const j = await r.json();
      if (!j.ok) throw new Error({NOMBRE_CLUB: "Revisa el nombre del club", EMAIL: "Ese email no es válido", PASSWORD_CORTA: "La contraseña debe tener al menos 8 caracteres", DEMASIADOS_PENDIENTES: "Ahora mismo hay muchas solicitudes pendientes. Inténtalo más tarde"}[j.error] || j.error);
      box.innerHTML = `<div class="card"><div style="font-weight:700;font-size:17px">✅ ¡Club registrado!</div>
        <p style="margin:6px 0">«${esc(j.club.nombre)}» queda <b>pendiente de aprobación</b>. Cuando esté activo podrás entrar con <b>${esc(b.email)}</b> y tu contraseña.</p>
        <button class="btn primary" id="rLogin" style="width:100%">Ir a entrar</button></div>`;
      $("rLogin").onclick = () => { cloud.vista = "menu"; renderCloud(); };
    } catch(e) { toast("No se pudo registrar: " + (e.message || e)); $("rEnviar").disabled = false; }
  };
}

// Vista principal: club pendiente, «Mi club» y panel de clubs
const _renderCloud = renderCloud;
renderCloud = () => {
  const box = $("cloudBox");
  if (cloud.user && cloud.sb && !cloud.initError && !cloud.organizer) {
    actualizarMarco();
    const pend = cloud.clubs.filter(c => c.estado === "pendiente"), susp = cloud.clubs.filter(c => c.estado === "suspendido");
    titulos("🏢 Sport Events Club", "");
    box.innerHTML = `<div class="card">${pend.length ? `<div style="font-weight:700">⏳ «${esc(pend[0].nombre)}» está pendiente de aprobación</div><p class="help" style="margin:6px 0 0">Te avisaremos cuando esté activo. Después podrás crear eventos y dar de alta a tus gestores de eventos.</p>`
      : susp.length ? `<div style="font-weight:700">⛔ «${esc(susp[0].nombre)}» está suspendido</div><p class="help" style="margin:6px 0 0">Contacta con Sport Events para reactivarlo.</p>`
      : `<div style="font-weight:700">No perteneces a ningún club</div><p class="help" style="margin:6px 0 0">Pide al responsable de tu club que te dé de alta, o registra tu club.</p>`}</div>
      <p class="help" style="text-align:center">Conectado como ${esc(cloud.user.email || "")} · <a href="#" id="cLogout">Salir</a></p>`;
    $("cLogout").onclick = e => { e.preventDefault(); logout(); };
    return;
  }
  if (cloud.user && cloud.vista === "registro") { actualizarMarco(); renderRegistro(box); return; }
  if (cloud.user && cloud.organizer && cloud.vista === "miclub") { actualizarMarco(); renderMiClub(box); return; }
  _renderCloud();
  if ($("cTelegram")) $("cTelegram").remove();   // Telegram: próximamente en la versión CLUB
  if (cloud.vista === "menu" && cloud.user && cloud.organizer) menuClub(box);
};
const _atras = window.cloudAtras;
window.cloudAtras = () => {
  if (state.step === 0 && (cloud.vista === "miclub" || cloud.vista === "registro")) { cloud.vista = "menu"; renderCloud(); return 1; }
  return _atras();
};

// Inicio: club con el que se trabaja (y selector si hay varios), «Mi club» y «Clubs» (creador)
function menuClub(box){
  const activos = cloud.clubs.filter(c => c.estado === "activo");
  const cab = document.createElement("div"); cab.className = "card";
  cab.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
      ${cloud.club && cloud.club.logo_url ? `<img src="${esc(cloud.club.logo_url)}" alt="" style="width:44px;height:44px;border-radius:50%;object-fit:cover">` : `<div style="font-size:30px">🏢</div>`}
      <div style="flex:1;min-width:0"><div style="font-weight:800">${cloud.club ? esc(cloud.club.nombre) : "Sin club seleccionado"}</div>
      <div class="help" style="margin:0">${cloud.club ? (cloud.club.rol === "responsable" ? "👑 Responsable del club" : cloud.club.rol === "creador" ? "Modo creador" : "🎾 Gestor de eventos") : "Elige un club"}</div></div></div>
    ${activos.length > 1 ? `<div style="margin-top:12px;font-weight:700">Tus clubs (${activos.length})</div>
      <div style="display:grid;gap:6px;margin-top:6px">${activos.map(c => { const yo = cloud.club && c.id === cloud.club.id;
        return `<button type="button" class="btn${yo ? " primary" : ""}" data-club="${esc(c.id)}" style="display:flex;align-items:center;gap:10px;text-align:left;width:100%">
          ${c.logo_url ? `<img src="${esc(c.logo_url)}" alt="" style="width:34px;height:34px;border-radius:50%;object-fit:cover;background:#fff;flex:none">` : `<span style="font-size:24px">🏢</span>`}
          <span style="flex:1;min-width:0"><b>${esc(c.nombre)}</b><br><small style="font-weight:500;opacity:.85">${c.rol === "responsable" ? "👑 Responsable" : c.rol === "creador" ? "Modo creador" : "🎾 Gestor de eventos"}</small></span>
          <span>${yo ? "✓" : "›"}</span></button>`; }).join("")}</div>` : ""}`;
  box.insertBefore(cab, box.firstChild);
  cab.querySelectorAll("[data-club]").forEach(b => b.onclick = () => { if (!cloud.club || b.dataset.club !== cloud.club.id) cambiarClub(b.dataset.club); });
  const crear = $("mCrear");
  if (!cloud.club) {
    // sin club activo (p. ej. el creador antes de aprobar ninguno): solo el panel de clubs
    if (crear) crear.remove();
    if ($("mEventos")) $("mEventos").remove();
    cab.querySelector(".help").textContent = cloud.creador ? "Todavía no hay ningún club activo. Apruébalos en «Clubs registrados»." : "";
  }
  box.querySelectorAll("p.help").forEach(p => { if (/Modo creador/.test(p.textContent)) p.textContent = "👑 Modo creador: ves y gestionas todos los clubs"; });
  if (esResponsable() && cloud.club && crear) {
    const b = document.createElement("button"); b.className = "btn bigbtn"; b.id = "mMiClub";
    b.innerHTML = `🏢 Mi club<small>Responsable, gestores de eventos, logo y datos</small>`;
    crear.after(b); b.onclick = () => { cloud.vista = "miclub"; renderCloud(); };
  }
  if ($("mPanel")) $("mPanel").innerHTML = `👑 Clubs registrados<small>Aprobar, suspender o reactivar clubs</small>`;
  if (cloud.creador && $("mPanel")) {
    const r = document.createElement("button"); r.className = "btn bigbtn"; r.id = "mRegClub";
    r.innerHTML = `＋ Registrar un club<small>Crea el club y la cuenta de su responsable</small>`;
    $("mPanel").after(r); r.onclick = () => { cloud.vista = "registro"; renderCloud(); };
  }
}

// Llamada a la función «club» del servidor con la sesión del usuario (lo que necesita permisos especiales)
async function fnClub(cuerpo){
  const ses = (await cloud.sb.auth.getSession()).data.session;
  const r = await fetch(FN_CLUB, {method: "POST", headers: {"Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: "Bearer " + (ses ? ses.access_token : "")}, body: JSON.stringify(cuerpo)});
  return r.json();
}
const ERR_CLUB = {YA_ES_ADMIN: "Ya es gestor de este club", YA_HAY_RESPONSABLE: "El club ya tiene responsable", SIN_PERMISO: "No tienes permiso para hacer esto",
  PASSWORD_CORTA: "La contraseña debe tener al menos 8 caracteres", EMAIL: "Ese email no es válido", NO_ES_DEL_CLUB: "Ese usuario no es de este club",
  ES_DE_OTRO_CLUB: "Ese usuario también es de otro club: solo el creador puede cambiarle la contraseña", NO_EXISTE: "Esa cuenta no existe",
  SOLO_CREADOR: "Solo el creador puede hacer esto", ACCION: "La función «club» del servidor no está actualizada"};
const errClub = (j, pre) => ERR_CLUB[j.error] || (pre + j.error);
// Pide una contraseña nueva (visible, para poder comprobarla antes de dársela a la persona)
async function pedirPassword(quien){
  const v = await pedirTexto(`🔑 Nueva contraseña`, `Para ${quien}. Mínimo 8 caracteres. Dásela en persona.`, {si: "Cambiar contraseña"});
  if (v === null) return null;
  if (v.length < 8) { toast("La contraseña debe tener al menos 8 caracteres"); return null; }
  return v;
}

// «Mi club» (responsable y creador): datos del club, responsable y gestores de eventos
async function renderMiClub(box){
  const c = cloud.club, yo = String(cloud.user.email || "").toLowerCase();
  titulos("🏢 Mi club", "Datos del club, su responsable y los gestores de eventos.");
  box.innerHTML = `<button class="btn small ghost" id="kVolver" style="margin-bottom:10px">‹ Menú</button><div class="card help">Cargando…</div>`;
  $("kVolver").onclick = () => { cloud.vista = "menu"; renderCloud(); };
  const r = await cloud.sb.rpc("admins_club", {p_club: c.id});
  if (cloud.vista !== "miclub") return;
  const todos = r.error ? [] : (r.data || []);
  const resp = todos.filter(a => a.rol === "responsable"), gestores = todos.filter(a => a.rol !== "responsable");
  const fecha = t => t ? new Date(t).toLocaleDateString("es-ES", {day: "2-digit", month: "2-digit", year: "numeric"}) : "nunca";
  const fila = (a, botones) => `<div style="padding:10px 0;border-top:1px solid var(--line)">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;min-width:0"><div style="font-weight:600;word-break:break-all">${esc(a.email)}${a.email === yo ? " <span class=\"help\">(tú)</span>" : ""}</div>
        <div class="help" style="margin:0">${a.telefono ? "📞 " + esc(a.telefono) + " · " : ""}último acceso: ${esc(fecha(a.ultimo_acceso))}</div></div>
        ${a.rol === "responsable" ? "" : `<label style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:13px;color:${a.activo ? "var(--ok,#2e9e5b)" : "var(--muted)"}">
          <input type="checkbox" data-onoff="${esc(a.email)}"${a.activo ? " checked" : ""} style="width:22px;height:22px;margin:0">${a.activo ? "ON" : "OFF"}</label>`}
      </div>
      <div class="row wrap" style="margin-top:6px">${botones}</div></div>`;
  const bPass = a => a.email === yo ? `<button class="btn small" data-mipass="1">🔑 Cambiar mi contraseña</button>` : `<button class="btn small" data-pass="${esc(a.email)}">🔑 Cambiar contraseña</button>`;
  box.innerHTML = `<button class="btn small ghost" id="kVolver" style="margin-bottom:10px">‹ Menú</button>
    <div class="card" style="display:grid;gap:8px">
      <div style="display:flex;align-items:center;gap:10px"><div style="font-weight:700;flex:1">Datos del club</div>
        <img id="kLogoPrev" alt="Logo del club" style="width:64px;height:64px;border-radius:50%;object-fit:cover;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.2)${c.logo_url ? "" : ";display:none"}" src="${esc(c.logo_url || "")}"></div>
      <label class="lbl">Nombre<input type="text" id="kNombre" value="${esc(c.nombre)}" maxlength="80"></label>
      <label class="lbl">Logo (dirección de la imagen)<input type="text" inputmode="url" id="kLogo" value="${esc(c.logo_url || "")}" placeholder="https://…"></label>
      <div class="help" style="word-break:break-all">🌐 Web del club: ${esc(clubWebUrl())}</div>
      <div class="row wrap"><button class="btn small primary" id="kGuardar">💾 Guardar</button><button class="btn small" id="kWeb">📤 Compartir enlace</button><button class="btn small" id="kCopiar">📋 Copiar enlace</button></div>
    </div>

    <div class="card" style="border-color:#c9a227">
      <div style="font-weight:800">👑 Responsable del club</div>
      <p class="help" style="margin:2px 0 4px">Da de alta a los gestores de eventos y cambia los datos del club. Solo el creador de Sport Events puede quitarlo.</p>
      ${resp.length ? resp.map(a => fila(a, bPass(a) + (cloud.creador ? `<button class="btn small danger" data-quitarresp="${esc(a.email)}">🗑 Quitar responsable</button>` : ""))).join("")
        : `<div class="help" style="padding:8px 0;border-top:1px solid var(--line)">Este club no tiene responsable.</div>`}
      ${cloud.creador && !resp.length ? `<div style="display:grid;gap:8px;margin-top:8px">
        <div style="font-weight:700">＋ Nombrar responsable</div>
        <label class="lbl">Email<input type="email" id="kRespEmail" autocomplete="off"></label>
        <label class="lbl">Contraseña inicial (mínimo 8)<input type="text" id="kRespPass" autocomplete="off"></label>
        <p class="help" style="margin:0">Si ya tiene cuenta (por ejemplo, es gestor del club), deja la contraseña vacía.</p>
        <button class="btn primary" id="kRespAlta">Nombrar responsable</button></div>` : ""}
    </div>

    <div class="card">
      <div style="font-weight:800">🎾 Gestores de eventos (${gestores.length})</div>
      <p class="help" style="margin:2px 0 4px">Crean y gestionan los eventos del club. Apágalos con OFF cuando no deban entrar.</p>
      ${gestores.length ? gestores.map(a => fila(a, bPass(a) + (a.email === yo ? "" : `<button class="btn small danger" data-quitaradm="${esc(a.email)}">🗑 Eliminar gestor</button>`))).join("")
        : `<div class="help" style="padding:8px 0;border-top:1px solid var(--line)">Todavía no hay gestores de eventos.</div>`}
    </div>
    <div class="card" style="display:grid;gap:8px">
      <div style="font-weight:700">＋ Dar de alta un gestor de eventos</div>
      <label class="lbl">Email<input type="email" id="kEmail" autocomplete="off"></label>
      <label class="lbl">Contraseña inicial (mínimo 8)<input type="text" id="kPass" autocomplete="off"></label>
      <p class="help" style="margin:0">Dásela en persona. Si ya tiene cuenta en Sport Events Club, deja la contraseña vacía.</p>
      <button class="btn primary" id="kAlta">Dar de alta</button>
    </div>`;
  $("kVolver").onclick = () => { cloud.vista = "menu"; renderCloud(); };
  const textoWeb = `🎾 ${c.nombre} · eventos y partidos: elige el tuyo y apúntate 👉 ${clubWebUrl()}`;
  $("kWeb").onclick = () => { if (window.Android && Android.share) Android.share(textoWeb); else copyText(textoWeb).then(() => toast("Enlace copiado")); };
  $("kCopiar").onclick = () => copyText(clubWebUrl()).then(() => toast("Enlace copiado"));
  // vista previa del logo al cambiar la dirección (si la imagen no carga, se oculta)
  const prev = $("kLogoPrev");
  prev.onerror = () => { prev.style.display = "none"; };
  prev.onload = () => { prev.style.display = ""; };
  $("kLogo").oninput = () => { const u = $("kLogo").value.trim(); if (/^https:\/\//i.test(u)) prev.src = u; else prev.style.display = "none"; };
  $("kGuardar").onclick = () => guard(async () => {
    const nombre = $("kNombre").value.trim(), logo = $("kLogo").value.trim() || null;
    if (nombre.length < 2) { toast("Escribe el nombre del club"); return; }
    if (logo && !/^https:\/\//i.test(logo)) { toast("El logo debe ser una dirección https://"); return; }
    const u = await cloud.sb.from("clubs").update({nombre, logo_url: logo}).eq("id", c.id).select().single();
    if (u.error) throw u.error;
    Object.assign(c, {nombre: u.data.nombre, logo_url: u.data.logo_url}); pintarClub(); toast("💾 Datos del club guardados");
  });
  // ON / OFF de un gestor
  box.querySelectorAll("[data-onoff]").forEach(ch => ch.onchange = () => guard(async () => {
    const r2 = await cloud.sb.rpc("activar_admin", {p_club: c.id, p_email: ch.dataset.onoff, p_activo: ch.checked});
    if (r2.error) throw r2.error;
    toast(`${ch.dataset.onoff}: ${ch.checked ? "ON" : "OFF"}`); renderMiClub(box);
  }));
  // Eliminar un gestor
  box.querySelectorAll("[data-quitaradm]").forEach(b => b.onclick = async () => {
    if (!await ask(`¿Eliminar a ${b.dataset.quitaradm} como gestor de eventos de «${c.nombre}»?\n\nYa no podrá entrar a gestionar nada de este club.`, "Eliminar")) return;
    guard(async () => { const r2 = await cloud.sb.rpc("quitar_admin", {p_club: c.id, p_email: b.dataset.quitaradm}); if (r2.error) throw r2.error; toast("Gestor eliminado"); renderMiClub(box); });
  });
  // Quitar al responsable (solo el creador)
  box.querySelectorAll("[data-quitarresp]").forEach(b => b.onclick = async () => {
    if (!await ask(`¿Quitar a ${b.dataset.quitarresp} como responsable de «${c.nombre}»?\n\nYa no podrá entrar en el club. Después podrás nombrar a otro responsable.`, "Quitar")) return;
    guard(async () => { const j = await fnClub({accion: "quitar_responsable", club_id: c.id, email: b.dataset.quitarresp}); if (!j.ok) { toast(errClub(j, "No se pudo quitar: ")); return; } toast("Responsable quitado"); renderMiClub(box); });
  });
  // Cambiar la contraseña de otro (gestor; o el responsable, si lo hace el creador)
  box.querySelectorAll("[data-pass]").forEach(b => b.onclick = async () => {
    const password = await pedirPassword(b.dataset.pass); if (!password) return;
    guard(async () => { const j = await fnClub({accion: "cambiar_password", club_id: c.id, email: b.dataset.pass, password}); if (!j.ok) { toast(errClub(j, "No se pudo cambiar: ")); return; } toast(`🔑 Contraseña de ${b.dataset.pass} cambiada. Pásasela en persona.`); });
  });
  // Cambiar la contraseña propia
  box.querySelectorAll("[data-mipass]").forEach(b => b.onclick = async () => {
    const password = await pedirPassword("ti"); if (!password) return;
    guard(async () => { const u = await cloud.sb.auth.updateUser({password}); if (u.error) throw u.error; toast("🔑 Tu contraseña se ha cambiado"); });
  });
  const alta = (email, password, rol) => guard(async () => {
    email = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast("Escribe un email válido"); return; }
    if (password && password.length < 8) { toast("La contraseña debe tener al menos 8 caracteres"); return; }
    const j = await fnClub({accion: "crear_admin", club_id: c.id, email, password, rol});
    if (!j.ok) { toast(errClub(j, "No se pudo dar de alta: ")); return; }
    const que = rol === "responsable" ? "responsable del club" : "gestor de eventos";
    toast(j.cuenta_nueva ? `✅ ${email} es ${que}. Pásale su contraseña en persona.` : `✅ ${email} es ${que} (ya tenía cuenta)`);
    renderMiClub(box);
  });
  $("kAlta").onclick = () => alta($("kEmail").value, $("kPass").value, "admin");
  if ($("kRespAlta")) $("kRespAlta").onclick = () => alta($("kRespEmail").value, $("kRespPass").value, "responsable");
}

// Panel del creador: clubs registrados
renderPanel = async function(box){
  titulos("👑 Clubs registrados", "Aprueba los clubs nuevos, o suspende y reactiva los existentes.");
  box.innerHTML = `<button class="btn small ghost" id="pVolver" style="margin-bottom:10px">‹ Menú</button><div class="card help">Cargando…</div>`;
  $("pVolver").onclick = () => irA("menu");
  const r = await cloud.sb.rpc("panel_clubs");
  if (cloud.vista !== "panel") return;
  if (r.error) { box.innerHTML += `<div class="card">${esc("No se pudo cargar: " + cloudError(r.error))}</div>`; return; }
  const l = r.data || [];
  const ESTADO = {pendiente: ["⏳ Pendiente", "warnp"], activo: ["✅ Activo", "okp"], suspendido: ["⛔ Suspendido", ""]};
  box.innerHTML = `<button class="btn small ghost" id="pVolver" style="margin-bottom:10px">‹ Menú</button>
    ${l.length ? l.map(c => `<div class="card">
      <div style="display:flex;gap:10px;align-items:center">${c.logo_url ? `<img src="${esc(c.logo_url)}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover">` : `<div style="font-size:26px">🏢</div>`}
        <div style="flex:1;min-width:0"><div style="font-weight:800">${esc(c.nombre)}</div>
        <div class="help" style="margin:0">${esc([c.ciudad, c.responsable].filter(Boolean).join(" · "))}</div></div>
        <span class="pill ${ESTADO[c.estado][1]}">${ESTADO[c.estado][0]}</span></div>
      <div class="help" style="margin:6px 0 8px">${c.admins} miembro(s) · ${c.eventos} evento(s) · alta ${esc(fechaCorta(String(c.created_at).slice(0, 10)))}</div>
      <div class="row wrap">
        ${c.estado !== "activo" ? `<button class="btn small primary" data-est="activo" data-club="${esc(c.id)}">${c.estado === "pendiente" ? "✅ Aprobar" : "↩ Reactivar"}</button>` : ""}
        ${c.estado !== "suspendido" ? `<button class="btn small danger" data-est="suspendido" data-club="${esc(c.id)}">⛔ Suspender</button>` : ""}
        <button class="btn small danger" data-borrarclub="${esc(c.id)}" style="margin-left:auto">🗑 Borrar club</button>
      </div></div>`).join("") : `<div class="card help">Todavía no se ha registrado ningún club.</div>`}`;
  $("pVolver").onclick = () => irA("menu");
  box.querySelectorAll("[data-borrarclub]").forEach(b => b.onclick = async () => {
    const c = l.find(x => x.id === b.dataset.borrarclub);
    if (!await ask(`🗑 ¿Borrar «${c.nombre}» para siempre?

Se borran también sus ${c.eventos} evento(s) con sus apuntados y sorteos, su agenda y su responsable y gestores. Su web dejará de existir. No se puede deshacer.

Si solo quieres pararlo, usa «Suspender».`, "Continuar")) return;
    const v = await pedirTexto("Confirmar borrado", `Escribe el nombre del club para borrarlo: ${c.nombre}`, {si: "Borrar club"});
    if (v === null) return;
    if (v.trim().toLowerCase() !== c.nombre.trim().toLowerCase()) { toast("El nombre no coincide: no se ha borrado nada"); return; }
    guard(async () => {
      const r2 = await cloud.sb.rpc("borrar_club", {p_club: c.id, p_nombre: v});
      if (r2.error) throw new Error(r2.error.code === "PGRST202" ? "Falta ejecutar 02_permisos_club.sql en Supabase" : /NOMBRE_NO_COINCIDE/.test(r2.error.message) ? "El nombre no coincide" : cloudError(r2.error));
      toast(`🗑 «${c.nombre}» borrado`);
      const m = await cloud.sb.rpc("mis_clubs"); cloud.clubs = m.error ? cloud.clubs.filter(x => x.id !== c.id) : (m.data || []);
      if (cloud.club && cloud.club.id === c.id) { cloud.club = cloud.clubs.find(x => x.estado === "activo") || null; store.set("clubActual", cloud.club && cloud.club.id); await loadPools(); pintarClub(); }
      renderPanel(box);
    });
  });
  box.querySelectorAll("[data-est]").forEach(b => b.onclick = async () => {
    const c = l.find(x => x.id === b.dataset.club);
    if (b.dataset.est === "suspendido" && !await ask(`¿Suspender «${c.nombre}»?\n\nSu responsable y sus gestores no podrán gestionar nada y su web dejará de admitir inscripciones.`, "Suspender")) return;
    guard(async () => {
      const r2 = await cloud.sb.rpc("estado_club", {p_club: c.id, p_estado: b.dataset.est});
      if (r2.error) throw r2.error;
      toast(b.dataset.est === "activo" ? `✅ «${c.nombre}» activo` : `⛔ «${c.nombre}» suspendido`);
      const m = await cloud.sb.rpc("mis_clubs"); cloud.clubs = m.error ? cloud.clubs : (m.data || []);
      renderPanel(box);
    });
  });
};

// Arranque (online.js lo deja para aquí, para que todo lo anterior ya esté aplicado)
cloudStart();
