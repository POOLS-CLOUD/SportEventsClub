/* =====================================================================
   POOL ONLINE (modo organizador) · Supabase
   Crear la pool, ver la lista en tiempo real, cerrar/abrir la inscripción,
   quitar jugadores, pasar los apuntados al sorteo y publicar el resultado.
   Usa las funciones de index.html: $, esc, toast, ask, store, state, save, go,
   remember, recall, norm, upcomingTuesday, renderCourts.
   ===================================================================== */
"use strict";
const SUPABASE_URL = "https://nskjnxtdkahuddhaggvl.supabase.co";
const SUPABASE_KEY = "sb_publishable_jcBmfQOnuJ5_258zhnPkdA_dJHojx38";   // clave pública (publishable)
const WEB_URL = "https://pools-cloud.github.io/SportEventsClub/";

// La sesión del organizador se guarda en los mismos archivos de la app (no en el navegador)
const sbStorage = {
  getItem: k => { try { const v = window.Android ? Android.getItem("sb." + k) : localStorage.getItem("sb." + k); return v || null; } catch(e) { return null; } },
  setItem: (k, v) => { try { window.Android ? Android.setItem("sb." + k, v) : localStorage.setItem("sb." + k, v); } catch(e) {} },
  removeItem: k => { try { window.Android ? Android.removeItem("sb." + k) : localStorage.removeItem("sb." + k); } catch(e) {} },
};

const cloud = {
  vista: "menu",   // menu | lista | crear | evento
  sb: null, user: null, organizer: false, pool: null, inscritos: [], pools: [], channel: null, busy: false,
};
const DIAS = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
const MESES_C = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const DAYS_EN = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const poolTitle = iso => { const d = fromIso(iso); return window.APP_LANG === "en" ? `${DAYS_EN[d.getDay()]} POOL` : `POOL DEL ${DIAS[d.getDay()]}`; };
const poolUrl = p => WEB_URL + "?pool=" + p.codigo;
window.poolUrl = poolUrl;
const ESTADOS = {abierta: ["Inscripción abierta", ""], cerrada: ["Inscripción cerrada", "warnp"], sorteada: ["Sorteo realizado · solo reservas", "okp"]};
// Lista y reservas de un evento. Con parejas fijas manda el hueco; si no, el orden de inscripción.
// Los que se apuntan después del sorteo (reserva = true) siempre van a reservas.
function partir(p, inscritos){
  const max = p.max_jugadores;
  if (p.parejas_fijas) return {lista: inscritos.filter(i => i.posicion != null && i.posicion < max), reservas: inscritos.filter(i => i.posicion != null && i.posicion >= max)};
  const normal = inscritos.filter(i => !i.reserva);
  return {lista: normal.slice(0, max), reservas: normal.slice(max).concat(inscritos.filter(i => i.reserva))};
}

/* Cabecera del sorteo (texto) <-> campos de la pool */
function poolToHeader(p){
  return [p.titulo, p.horario && `HORARIO: ${p.horario}`, p.importe && `IMPORTE: ${p.importe}`, p.club && `CLUB: ${p.club}`, p.notas].filter(Boolean).join("\n");
}
function headerToFields(text){
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const f = {titulo: "", horario: "", importe: "", club: "", notas: ""}, extra = [];
  lines.forEach((l, i) => {
    const h = l.match(/^HORARIO:\s*(.+)$/i), m = l.match(/^IMPORTE:\s*(.+)$/i), c = l.match(/^CLUB:\s*(.+)$/i);
    if (h) f.horario = h[1].trim(); else if (m) f.importe = m[1].trim(); else if (c) f.club = c[1].trim();
    else if (!f.titulo && i === 0) f.titulo = l; else extra.push(l);
  });
  f.notas = extra.join("\n");
  return f;
}
/* Deporte y clubes memorizados */
const DEPORTES = {padel: "🎾 Pádel", tenis: "🎾 Tenis"};
const getClubes = () => { const l = store.get("clubes", null); return Array.isArray(l) ? l : ["Club de Raqueta de Benalmádena"]; };
function recordarClub(nombre){
  nombre = clean(nombre || ""); if (!nombre) return;
  const l = getClubes(); if (!l.some(c => norm(c) === norm(nombre))) { l.push(nombre); store.set("clubes", l); }
}
function clubChips(){
  const l = getClubes();
  return l.length ? l.map((c, i) => `<span class="chip" style="display:inline-flex;align-items:center;gap:6px;border-style:solid">
      <span data-club="${i}" style="cursor:pointer">${esc(c)}</span><button type="button" class="x" data-delclub="${i}" title="Quitar de la lista" style="font-size:18px;padding:0 2px">×</button></span>`).join("")
    : `<span class="help">No hay clubes guardados: escribe uno y se guardará al crear el evento.</span>`;
}
function wireClubChips(px){
  const box = $(px + "Clubs"); if (!box) return;
  box.querySelectorAll("[data-club]").forEach(el => el.onclick = () => { $(px + "Club").value = getClubes()[+el.dataset.club]; });
  box.querySelectorAll("[data-delclub]").forEach(b => b.onclick = () => {
    const l = getClubes(); l.splice(+b.dataset.delclub, 1); store.set("clubes", l);
    ["n", "e"].forEach(x => { if ($(x + "Clubs")) { $(x + "Clubs").innerHTML = clubChips(); wireClubChips(x); } });
  });
}
// Emails de otros administradores del evento. Al crear, se proponen los de la última vez (cada uno con su ×).
cloud.adminsForm = {};
const adminsRecordados = () => { const l = store.get("adminsRecordados", []); return Array.isArray(l) ? l : []; };
const listaAdmins = px => cloud.adminsForm[px] || (cloud.adminsForm[px] = px === "n" ? adminsRecordados().slice() : []);
function adminsChips(px){
  const l = listaAdmins(px);
  return l.length ? l.map((e, i) => `<span class="chip" style="display:inline-flex;align-items:center;gap:6px;border-style:solid">${esc(e)}<button type="button" class="x" data-deladm="${i}" title="Quitar" style="font-size:18px;padding:0 2px">×</button></span>`).join("")
    : `<span class="help">Nadie más: solo tú gestionarás este evento.</span>`;
}
function wireAdmins(px){
  const box = $(px + "Adm"); if (!box) return;
  const pinta = () => { box.innerHTML = adminsChips(px); wireAdmins(px); };
  box.querySelectorAll("[data-deladm]").forEach(b => b.onclick = () => {
    const l = listaAdmins(px); l.splice(+b.dataset.deladm, 1);
    if (px === "n") store.set("adminsRecordados", l.slice());   // al crear, también se olvida para la próxima vez
    pinta();
  });
  const add = () => {
    const e = $(px + "AdmIn").value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { toast("Escribe un email válido"); return; }
    if (cloud.user && e === String(cloud.user.email || "").toLowerCase()) { toast("Ese eres tú: ya puedes gestionarlo"); return; }
    const l = listaAdmins(px); if (!l.includes(e)) l.push(e);
    if (px === "n") store.set("adminsRecordados", l.slice());
    $(px + "AdmIn").value = ""; pinta();
  };
  $(px + "AdmAdd").onclick = add;
  $(px + "AdmIn").onkeydown = ev => { if (ev.key === "Enter") { ev.preventDefault(); add(); } };
}
// Al abrir «Editar datos evento» se cargan los administradores actuales
async function cargarAdminsForm(px, p){
  try {
    const r = await cloud.sb.rpc("admins_evento", {p_pool: p.id});
    cloud.adminsForm[px] = r.error ? [] : (r.data || []).map(x => typeof x === "string" ? x : x.admins_evento);
  } catch(e) { cloud.adminsForm[px] = []; }
  if ($(px + "Adm")) { $(px + "Adm").innerHTML = adminsChips(px); wireAdmins(px); }
}
async function guardarAdmins(p, px, nuevo){
  const r = await cloud.sb.rpc("poner_admins", {p_pool: p.id, p_emails: listaAdmins(px)});
  if (r.error) { toast(r.error.code === "PGRST202" ? "Falta ejecutar cambio_20_admins_por_evento.sql en Supabase" : "No se pudieron guardar los administradores: " + cloudError(r.error)); return; }
  const sin = r.data || [];
  if (sin.length) setTimeout(() => toast(`Aviso: ${sin.join(", ")} aún no ${sin.length === 1 ? "es organizador" : "son organizadores"}. Podrá${sin.length === 1 ? "" : "n"} gestionarlo cuando tenga${sin.length === 1 ? "" : "n"} cuenta.`), 1500);
  if (nuevo) cloud.adminsForm.n = null;   // el siguiente evento vuelve a proponer los recordados
}

/* ---------- «Nueva semana»: el mismo evento, 7 días después, con la lista vacía ---------- */
async function nuevaSemana(p){
  const d = fromIso(p.fecha || isoDate(new Date())); d.setDate(d.getDate() + 7);
  const nf = isoDate(d), ini = cuantosIniciales();
  if (!await ask(`🔁 ¿Crear el evento de la semana siguiente?\n\n«${p.titulo}» · 📅 ${fechaCorta(nf)}\n\nMismos datos, administradores y canal de Telegram. La lista empieza vacía y con la inscripción abierta. Este evento se queda como historial.`,
    "Crear", ini ? `Apuntar ya a los jugadores iniciales (${ini})` : null)) return;
  const conIniciales = !!ini && $("modalCheck").checked;
  guard(async () => {
    const campos = ["titulo", "horario", "importe", "club", "notas", "deporte", "tipo_sorteo", "parejas_fijas", "max_jugadores", "max_reservas"];
    const row = {fecha: nf, estado: "abierta"};
    campos.forEach(k => { if (p[k] !== undefined) row[k] = p[k]; });
    const data = await savePool(row);
    // mismos administradores
    try {
      const r = await cloud.sb.rpc("admins_evento", {p_pool: p.id});
      const l = r.error ? [] : (r.data || []).map(x => typeof x === "string" ? x : x.admins_evento);
      if (l.length) await cloud.sb.rpc("poner_admins", {p_pool: data.id, p_emails: l});
    } catch(e) { }
    cloud.pools.unshift(data); await selectPool(data); cloud.vista = "evento";
    state.header = poolToHeader(data); save();
    let n = 0;
    if (conIniciales) {
      const {nombres, numeros, telefonos} = parseNombres(getLista());
      n = nombres.length ? await apuntarFijos(data, nombres, numeros) : 0;
      if (n && telefonos.some(Boolean)) await ponerTelefonos(data, nombres, telefonos);
    }
    // el canal al final: el bot publica un solo anuncio con el evento nuevo
    if (p.telegram_canal) { const rc = await cloud.sb.rpc("poner_canal", {p_pool: data.id, p_canal: p.telegram_canal}); if (!rc.error) await reloadPool(); }
    renderCloud();
    toast(`🔁 Evento del ${fechaCorta(nf)} creado${n ? ` con ${n} jugador(es)` : ""}${p.telegram_canal ? " y anunciado en Telegram" : ""}`);
  });
}

/* ---------- Telegram: cada canal se vincula una vez; cada evento elige el suyo ---------- */
cloud.canales = null;
const TG_FN = SUPABASE_URL + "/functions/v1/telegram";
async function cargarCanales(){
  try { const r = await cloud.sb.rpc("mis_canales"); cloud.canales = r.error ? null : (r.data || []); } catch(e) { cloud.canales = null; }
  return cloud.canales;
}
const nombreCanal = id => ((cloud.canales || []).find(c => c.id === id) || {}).titulo || "";
async function nombreBot(){
  if (cloud.bot !== undefined) return cloud.bot;
  try { const r = await fetch(TG_FN); cloud.bot = (await r.json()).bot || null; } catch(e) { cloud.bot = null; }
  return cloud.bot;
}
// Ventana para vincular un canal nuevo: muestra el código y espera a que se publique en el canal
async function vincularCanal(pool){
  const r = await cloud.sb.rpc("codigo_telegram", {p_pool: pool ? pool.id : null});
  if (r.error) { toast(r.error.code === "PGRST202" ? "Falta ejecutar cambio_21_telegram.sql en Supabase" : "No se pudo crear el código: " + cloudError(r.error)); return null; }
  const codigo = r.data, bot = await nombreBot(), antes = new Set((cloud.canales || []).map(c => c.id));
  return new Promise(res => {
    const m = document.createElement("div"); m.className = "modal";
    m.innerHTML = `<div class="box"><p style="margin:0 0 8px;font-weight:700">📣 Vincular un canal de Telegram</p>
      <ol class="help" style="margin:0 0 10px;padding-left:18px;display:grid;gap:6px">
        <li>En Telegram, abre tu canal → Administradores → Añadir administrador → busca <b>${esc(bot || "el bot de Sport Events")}</b> y dale permiso para <b>publicar mensajes</b>.</li>
        <li>Publica en el canal este código (caduca en 30 minutos):</li></ol>
      <div style="text-align:center;font:800 28px system-ui;letter-spacing:2px;padding:10px;border:2px dashed var(--accent);border-radius:12px;margin-bottom:6px">${esc(codigo)}</div>
      <button class="btn small" id="tgCopiar" style="width:100%;margin-bottom:10px">📋 Copiar código</button>
      <p class="help" id="tgEstado" style="margin:0 0 10px;text-align:center">⏳ Esperando a que publiques el código…</p>
      <button class="btn ghost" id="tgCerrar" style="width:100%">Cerrar</button></div>`;
    document.body.appendChild(m);
    let vivo = true;
    const fin = v => { vivo = false; m.remove(); res(v); };
    m.querySelector("#tgCopiar").onclick = async () => { await copyText(codigo); toast("📋 Código copiado"); };
    m.querySelector("#tgCerrar").onclick = () => fin(null);
    (async function esperar(){
      for (let k = 0; vivo && k < 600; k++) {
        await new Promise(t => setTimeout(t, 3000)); if (!vivo) return;
        const l = await cargarCanales() || [], nuevo = l.find(c => !antes.has(c.id));
        if (pool) { await reloadPool(); if (cloud.pool && cloud.pool.telegram_canal && !antes.has(cloud.pool.telegram_canal)) { toast(`✅ Canal «${nombreCanal(cloud.pool.telegram_canal)}» vinculado`); fin(cloud.pool.telegram_canal); return; } }
        if (nuevo) { toast(`✅ Canal «${nuevo.titulo}» vinculado`); fin(nuevo.id); return; }
      }
    })();
  });
}
// Elegir el canal de un evento ya creado
async function elegirCanal(p){
  await cargarCanales();
  if (cloud.canales === null) { toast("Falta ejecutar cambio_21_telegram.sql en Supabase"); return; }
  const actual = p.telegram_canal || "";
  const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = `<div class="box"><p style="margin:0 0 10px;font-weight:700">📣 Canal de Telegram del evento</p>
    <div style="display:grid;gap:6px;margin-bottom:10px">
      ${cloud.canales.map(c => `<label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="radio" name="tgc" value="${esc(c.id)}"${c.id === actual ? " checked" : ""}> ${esc(c.titulo)}</label>`).join("")}
      <label style="display:flex;gap:8px;align-items:center;color:var(--muted)"><input type="radio" name="tgc" value=""${actual ? "" : " checked"}> Sin canal (no publicar en Telegram)</label>
    </div>
    <button class="btn small" id="tgNuevo" style="width:100%;margin-bottom:10px">＋ Vincular un canal nuevo</button>
    <div class="row"><button class="btn ghost" id="tgNo" type="button">Cancelar</button><button class="btn primary" id="tgSi" type="button">Guardar</button></div></div>`;
  document.body.appendChild(m);
  m.querySelector("#tgNo").onclick = () => m.remove();
  m.querySelector("#tgNuevo").onclick = async () => { m.remove(); if (await vincularCanal(p)) { await reloadPool(); renderCloud(); } };
  m.querySelector("#tgSi").onclick = () => guard(async () => {
    const v = (m.querySelector("input[name=tgc]:checked") || {}).value || null;
    m.remove();
    const r = await cloud.sb.rpc("poner_canal", {p_pool: p.id, p_canal: v});
    if (r.error) throw r.error;
    if (v) store.set("canalRecordado", v);
    await reloadPool(); renderCloud();
    toast(v ? `📣 Las novedades se publicarán en «${nombreCanal(v)}»` : "Este evento ya no publica en Telegram");
  });
}
// Selector de canal en el formulario de crear evento (propone el último usado)
function canalSelectHtml(){
  const rec = store.get("canalRecordado", null), l = cloud.canales || [];
  return `<option value="">Sin canal</option>` + l.map(c => `<option value="${esc(c.id)}"${c.id === rec ? " selected" : ""}>${esc(c.titulo)}</option>`).join("");
}
async function prepararCanalCrear(){
  await cargarCanales();
  const sel = $("nCanal"); if (!sel) return;
  if (cloud.canales === null) { $("nCanalBox").classList.add("hidden"); return; }
  sel.innerHTML = canalSelectHtml();
}

// Desplegable del 1 al 10 (si el evento ya tenía un valor mayor, también aparece)
const opciones1a10 = actual => { const l = [1,2,3,4,5,6,7,8,9,10]; if (actual > 10 && !l.includes(actual)) l.push(actual);
  return l.map(n => `<option value="${n}"${n === actual ? " selected" : ""}>${n}</option>`).join(""); };
// Formulario de pool (crear o editar)
function poolFormHtml(px, v, boton){
  return `<div style="display:grid;gap:8px;margin-top:10px">
      <div class="lbl">Deporte
        <div class="modos" id="${px}Dep" style="margin-top:4px">${["padel", "tenis"].map(d => `<button type="button" class="modo${(v.deporte || "padel") === d ? " on" : ""}" data-dep="${d}">${DEPORTES[d]}</button>`).join("")}</div></div>
      <label class="lbl">Fecha<input type="date" id="${px}Date" value="${esc(v.fecha || "")}"></label>
      <label class="lbl">Título<input type="text" id="${px}Title" value="${esc(v.titulo || "")}"></label>
      <label class="lbl">Horario<input type="text" id="${px}Hor" value="${esc(v.horario || "")}"></label>
      <label class="lbl">Importe<input type="text" id="${px}Imp" value="${esc(v.importe || "")}"></label>
      <div class="lbl">Club
        <input type="text" id="${px}Club" value="${esc(v.club ?? (getClubes()[0] || ""))}" placeholder="Nombre del club" style="margin-top:4px">
        <div class="chips" id="${px}Clubs" style="margin-top:6px">${clubChips()}</div></div>
      <label class="lbl">Notas (opcional, se ven en la web)<textarea id="${px}Notas" style="min-height:60px" placeholder="Ej.: PÁDEL INDOOR · Traed bolas">${esc(v.notas || "")}</textarea></label>
      <div class="lbl">Tipo de sorteo (se ve en la web)
        <div class="modos" id="${px}Tipo" style="margin-top:4px">${Object.entries(MODOS).map(([k, m]) => `<button type="button" class="modo${(v.tipo_sorteo || state.modo || "mixto") === k ? " on" : ""}" data-tipo="${k}">${m.t}<small>${m.d}</small></button>`).join("")}</div></div>
      <label style="display:flex;gap:10px;align-items:center;font-weight:600;font-size:15px;padding:4px 0">
        <input type="checkbox" id="${px}Fijas" ${v.parejas_fijas ? "checked" : ""} style="width:22px;height:22px;margin:0">
        Parejas fijas <span class="help" style="font-weight:400">(se apuntan por parejas y el sorteo solo reparte pistas)</span></label>
      <div class="row"><label class="lbl" style="flex:1">Pistas <span class="help" id="${px}Plazas">(${Math.max(1, Math.round((v.max_jugadores || 20) / 4)) * 4} plazas)</span><select id="${px}Pistas">${opciones1a10(Math.max(1, Math.round((v.max_jugadores || 20) / 4)))}</select></label>
        <label class="lbl" style="flex:1">Reservas<select id="${px}Res">${opciones1a10(v.max_reservas ?? 10)}</select></label></div>
      <div class="lbl">👥 Otros administradores <span class="help" style="font-weight:400">(podrán ver y gestionar este evento)</span>
        <div class="row" style="margin-top:4px"><input type="email" id="${px}AdmIn" placeholder="email@ejemplo.com" autocomplete="off" style="flex:1"><button type="button" class="btn small" id="${px}AdmAdd">Añadir</button></div>
        <div class="chips" id="${px}Adm" style="margin-top:6px">${adminsChips(px)}</div></div>
      <button class="btn primary" id="${px}Save">${boton}</button>
    </div>`;
}
function readPoolForm(px){
  const dep = $(px + "Dep").querySelector(".modo.on"), tipo = $(px + "Tipo").querySelector(".modo.on");
  return {deporte: dep ? dep.dataset.dep : "padel", tipo_sorteo: tipo ? tipo.dataset.tipo : "mixto", club: $(px + "Club").value.trim() || null, parejas_fijas: $(px + "Fijas").checked,
    fecha: $(px + "Date").value, titulo: $(px + "Title").value.trim(), horario: $(px + "Hor").value.trim(), importe: $(px + "Imp").value.trim(),
    notas: $(px + "Notas").value.trim() || null, max_jugadores: Math.max(1, Math.round(+$(px + "Pistas").value) || 5) * 4,   /* 4 plazas por pista */ max_reservas: Math.max(0, +$(px + "Res").value || 0)};
}
function wirePoolForm(px){
  const dep = $(px + "Dep");
  if (dep) dep.querySelectorAll("[data-dep]").forEach(b => b.onclick = () => { dep.querySelectorAll(".modo").forEach(x => x.classList.toggle("on", x === b)); });
  const pistas = $(px + "Pistas");
  if (pistas) pistas.onchange = pistas.oninput = () => { const n = Math.max(1, Math.round(+pistas.value) || 1); $(px + "Plazas").textContent = `(${n * 4} plazas)`; };
  const tipo = $(px + "Tipo");
  if (tipo) tipo.querySelectorAll("[data-tipo]").forEach(b => b.onclick = () => { tipo.querySelectorAll(".modo").forEach(x => x.classList.toggle("on", x === b)); });
  wireClubChips(px);
  const dt = $(px + "Date");
  if (dt) dt.onchange = () => { if (/^POOL\s|\sPOOL$/i.test($(px + "Title").value) && dt.value) $(px + "Title").value = poolTitle(dt.value); };
}
// Guarda (insert/update) y, si la base de datos aún no tiene la columna «notas», reintenta sin ella
// No puede haber dos eventos con el mismo nombre, el mismo día y a la misma hora (con otra hora, sí)
const normTitulo = t => String(t || "").trim().replace(/\s+/g, " ").toLowerCase();
const normHora = h => String(h || "").replace(/\s/g, "").toLowerCase();
async function comprobarDuplicado(row, id){
  const prev = id ? (cloud.pools.find(p => p.id === id) || (cloud.pool && cloud.pool.id === id ? cloud.pool : {})) : {};
  const v = {...prev, ...row};
  if (!v.titulo || !v.fecha) return;
  // al editar, solo si cambia el nombre, la fecha o la hora
  if (id && normTitulo(v.titulo) === normTitulo(prev.titulo) && v.fecha === prev.fecha && normHora(v.horario) === normHora(prev.horario)) return;
  let q = cloud.sb.from("pools").select("id,titulo,horario").eq("fecha", v.fecha);
  if (v.club_id) q = q.eq("club_id", v.club_id);
  const { data, error } = await q;
  if (error) return;   // si no se puede comprobar, lo frena la base de datos
  if (data.some(p => p.id !== id && normTitulo(p.titulo) === normTitulo(v.titulo) && normHora(p.horario) === normHora(v.horario)))
    throw new Error("EVENTO_DUPLICADO");
}
async function savePool(row, id){
  await comprobarDuplicado(row, id);
  const run = r => id ? cloud.sb.from("pools").update(r).eq("id", id).select().single() : cloud.sb.from("pools").insert(r).select().single();
  let r = {...row}, res = await run(r), quitadas = [];
  // columnas que la base de datos aún no tiene (falta ejecutar cambios_pendientes.sql): se quitan y se reintenta
  for (let k = 0; k < 5 && res.error; k++) {
    const col = ["notas", "club", "deporte", "parejas_fijas", "tipo_sorteo"].find(c => c in r && new RegExp(c, "i").test(res.error.message || ""));
    if (!col) break;
    delete r[col]; quitadas.push(col); res = await run(r);
  }
  if (res.error) throw res.error;
  if (row.club) recordarClub(row.club);
  return quitadas.length ? {...res.data, _sinColumnas: quitadas} : res.data;
}
// qué archivo SQL añade cada columna
const SQL_COLUMNA = {tipo_sorteo: "cambio_12_tipo_sorteo.sql", parejas_fijas: "cambio_11_parejas_fijas.sql"};
const avisoGuardado = (d, ok) => toast(d && d._sinColumnas ? `Guardado sin ${d._sinColumnas.join(", ")}: falta ejecutar en Supabase ${[...new Set(d._sinColumnas.map(c => SQL_COLUMNA[c] || "cambios_pendientes.sql"))].join(" y ")}` : ok);

/* ---------- inscribir jugadores desde la APK (al crear la pool o después) ---------- */
// Lista guardada: la última que se usó al crear una pool (o la antigua lista de «fijos»)
const getLista = () => { const l = store.get("jugadoresIniciales", ""); return typeof l === "string" ? l : ""; };
const cuantosIniciales = () => parseNombres(getLista()).nombres.length;
// Solo cuentan las líneas con número de orden delante; se quitan repetidos
function parseNombres(text){
  const nombres = [], numeros = [], telefonos = [], vistos = new Set(); let ignoradas = 0;
  text.split(/\r?\n/).forEach(l => {
    let linea = clean(l.replace(EMOJI, "")); if (!linea) return;
    // teléfono opcional al final de la línea: «Jose 600 123 456» o «Ana +34611223344»
    let tel = null; const mt = linea.match(/\s+(\+?\d[\d\s.-]{6,}\d)$/);
    if (mt) { tel = mt[1].replace(/[^\d+]/g, ""); linea = linea.slice(0, mt.index).trim(); }
    const np = numberedParts(linea);
    const n = np ? np.text : linea.replace(/^[-*•·]+\s*/, "");      // sin número: se acepta y va al siguiente hueco libre
    if (!n || n.length > 40) { ignoradas++; return; }
    if (vistos.has(norm(n))) return;
    vistos.add(norm(n)); const m = state.memory[norm(n)];
    nombres.push(m ? m.name : n); numeros.push(np ? np.num : null); telefonos.push(tel);
  });
  return {nombres, numeros, telefonos, ignoradas};
}
// Guarda los teléfonos escritos al apuntar (privados: solo los ve el organizador)
async function ponerTelefonos(pool, nombres, telefonos){
  let n = 0, falta = false;
  for (let i = 0; i < nombres.length; i++) {
    if (!telefonos || !telefonos[i]) continue;
    const r = await cloud.sb.rpc("poner_telefono_nombre", {p_pool: pool.id, p_nombre: nombres[i], p_tel: telefonos[i]});
    if (r.error) { if (r.error.code === "PGRST202") falta = true; } else if (r.data) n++;
  }
  if (falta) toast("Falta ejecutar cambio_27_telefono_desde_manager.sql en Supabase para guardar teléfonos");
  return n;
}
// Apunta en la pool a los nombres dados, en ese orden, saltando los que ya están
async function apuntarFijos(pool, nombres, numeros = []){
  const ya = new Set(cloud.inscritos.map(i => norm(i.nombre)));
  const cap = pool.max_jugadores + pool.max_reservas;
  const libres = cap - cloud.inscritos.length;
  const nuevos = nombres.map((n, i) => ({n, num: numeros[i] ?? null})).filter(x => !ya.has(norm(x.n))).slice(0, Math.max(0, libres));
  if (!nuevos.length) return 0;
  const t0 = Date.now();   // horas consecutivas para conservar el orden de la lista
  const ocupados = new Set(cloud.inscritos.map(i => i.posicion).filter(x => x != null));
  if (pool.parejas_fijas) {
    // primero los que piden un hueco concreto (si está libre); después, el resto en los siguientes huecos libres
    nuevos.forEach(x => { const k = x.num != null ? x.num - 1 : -1; if (k >= 0 && k < cap && !ocupados.has(k)) { x.pos = k; ocupados.add(k); } });
    let k = 0;
    nuevos.forEach(x => { if (x.pos != null) return; while (k < cap && ocupados.has(k)) k++; if (k < cap) { x.pos = k; ocupados.add(k); } });
  }
  const filas = nuevos.filter(x => !pool.parejas_fijas || x.pos != null)
    .map((x, i) => ({pool_id: pool.id, nombre: x.n, created_at: new Date(t0 + i * 10).toISOString(), ...(pool.parejas_fijas ? {posicion: x.pos} : pool.estado === "sorteada" ? {reserva: true} : {})}));
  const { error } = await cloud.sb.from("inscripciones").insert(filas);
  if (error) throw error;
  await loadInscritos();
  return filas.length;
}

/* Apuntar en un puesto concreto («3 Jose»): pregunta qué hacer con quien ocupa ese puesto ahora.
   - Evento normal: «Sí, eliminarlo» → Jose ocupa su lugar; «No, intercalar» → Jose entra en el 3 y los demás bajan un puesto.
   - Parejas fijas: el número es el hueco; si está ocupado y no se elimina a quien está, Jose va al siguiente hueco libre. */
async function apuntarEnPuesto(pool, nombre, num){
  if (cloud.inscritos.some(i => norm(i.nombre) === norm(nombre))) { toast(`${nombre} ya estaba apuntado`); return 0; }
  const cap = pool.max_jugadores + pool.max_reservas;
  const insertar = async fila => {
    const { error } = await cloud.sb.from("inscripciones").insert({pool_id: pool.id, nombre, ...fila});
    if (error) throw error;
    await loadInscritos(); return 1;
  };
  const quitar = async i => { const { error } = await cloud.sb.from("inscripciones").delete().eq("id", i.id); if (error) throw error; };

  if (pool.parejas_fijas) {
    const k = num - 1;
    if (k < 0 || k >= cap) return apuntarFijos(pool, [nombre]);
    const ocupa = cloud.inscritos.find(i => i.posicion === k);
    if (!ocupa) return insertar({posicion: k, created_at: new Date().toISOString()});
    const sitio = k < pool.max_jugadores ? `pareja ${Math.floor(k / 2) + 1}` : `pareja de reserva ${Math.floor((k - pool.max_jugadores) / 2) + 1}`;
    if (await ask(`El hueco ${num} (${sitio}) lo ocupa ${ocupa.nombre}.\n\n¿Quieres eliminar a ${ocupa.nombre} y poner a ${nombre} en su lugar?\n\nSi no, ${nombre} irá al siguiente hueco libre.`, `Sí, eliminar a ${ocupa.nombre}`, null, "No, siguiente hueco")) {
      await quitar(ocupa); return insertar({posicion: k, created_at: new Date().toISOString()});
    }
    return apuntarFijos(pool, [nombre]);
  }

  // evento normal: el orden es el de inscripción (fecha y hora de apuntarse)
  const orden = cloud.inscritos.slice().sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  if (num < 1 || num > orden.length) return apuntarFijos(pool, [nombre]);   // detrás del último
  const actual = orden[num - 1], anterior = orden[num - 2];
  const eliminar = await ask(`En el puesto ${num} está ${actual.nombre}.\n\n¿Quieres eliminar a ${actual.nombre} y poner a ${nombre} en su lugar?\n\nSi eliges «No, intercalar», ${nombre} entra en el puesto ${num} y ${actual.nombre} pasa al ${num + 1} (los demás bajan un puesto).`,
    `Sí, eliminar a ${actual.nombre}`, null, "No, intercalar");
  if (eliminar) { await quitar(actual); return insertar({created_at: actual.created_at}); }
  if (orden.length >= cap) { toast("La lista y las reservas están completas: para intercalar hay que eliminar a alguien"); return 0; }
  // hora justo entre el puesto anterior y el actual → queda intercalado
  const tAct = Date.parse(actual.created_at), tAnt = anterior ? Date.parse(anterior.created_at) : tAct - 2000;
  let t = Math.floor((tAnt + tAct) / 2); if (t <= tAnt || t >= tAct) t = tAct - 1;
  return insertar({created_at: new Date(t).toISOString()});
}

function cloudError(e){
  const m = String(e && (e.message || e.error_description) || e);
  if (/Invalid login credentials/i.test(m)) return "Email o contraseña incorrectos.";
  if (/EVENTO_DUPLICADO|pools_unico/i.test(m)) return "Ya hay un evento con ese nombre, ese día y a esa hora. Cambia la hora o el nombre.";
  if (/Failed to fetch|NetworkError|network/i.test(m)) return "Sin conexión a internet.";
  if (/row-level security|permission denied/i.test(m)) return "Tu usuario no tiene permiso de organizador.";
  if (/mostrar_sorteo|notas|agenda/i.test(m) && /column|schema|exist|find/i.test(m)) return "Falta ejecutar cambios_pendientes.sql en Supabase.";
  return "Error: " + m;
}

async function cloudInit(){
  if (!window.supabase) { cloud.sb = null; return; }
  cloud.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {storage: sbStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false},
  });
  const { data } = await cloud.sb.auth.getSession();
  await setUser(data.session ? data.session.user : null);
}

/* ---------- un solo móvil activo por administrador ---------- */
// 'ok' | 'libre' | 'otro' | 'no_organizador'. Si la base de datos aún no tiene esta función, se da por buena.
async function sesionEstado(){
  const { data, error } = await cloud.sb.rpc("estado_sesion");
  if (error) return "ok";   // función aún no creada en Supabase o sin conexión: no se bloquea
  return data;
}
async function reclamarSesion(){ try { await cloud.sb.rpc("reclamar_sesion"); } catch(e) {} }
// Otro móvil ha entrado con este usuario: este se desconecta
async function expulsar(){
  if (cloud.channel) { cloud.sb.removeChannel(cloud.channel); cloud.channel = null; }
  try { await cloud.sb.auth.signOut({scope: "local"}); } catch(e) {}
  cloud.user = null; cloud.organizer = false; cloud.pool = null; cloud.pools = []; cloud.inscritos = [];
  cloud.expulsado = true;
  toast("Tu usuario se ha abierto en otro móvil");
  if (state.step === 0) renderCloud();
}
// Comprueba antes de cada acción que este móvil sigue siendo el activo
async function sigoActivo(){
  if (!cloud.user) return false;
  const st = await sesionEstado();
  if (st === "otro") { await expulsar(); return false; }
  if (st === "libre") await reclamarSesion();
  return true;
}

async function setUser(user){
  cloud.user = user; cloud.organizer = false;
  if (user) {
    const st = await sesionEstado();
    if (st === "otro") { await expulsar(); return; }
    if (st === "libre") await reclamarSesion();
    const { data } = await cloud.sb.from("organizadores").select("user_id").eq("user_id", user.id).maybeSingle();
    try { const r = await cloud.sb.rpc("es_superadmin"); cloud.creador = !r.error && r.data === true; } catch(e) { cloud.creador = false; }
    cloud.organizer = !!data || cloud.creador;
    if (cloud.organizer) { await syncAgenda(); await loadPools(); }
  }
}

/* ---------- agenda en la nube: copia del sexo de cada jugador ---------- */
// Al entrar: lo que haya en la nube y no esté en el móvil se recupera; lo del móvil se sube.
async function syncAgenda(){
  try {
    const { data, error } = await cloud.sb.from("agenda").select("clave,nombre,sexo").eq("club_id", clubId());
    if (error) throw error;
    let recuperados = 0;
    data.forEach(r => { if (!state.memory[r.clave]) { state.memory[r.clave] = {name: r.nombre, g: r.sexo}; recuperados++; } });
    if (recuperados) { save(); toast(`☁ Recuperado el sexo de ${recuperados} jugador(es)`); }
    const enNube = new Map(data.map(r => [r.clave, r]));
    const subir = Object.entries(state.memory)
      .filter(([k, m]) => m && (m.g === "H" || m.g === "M") && (!enNube.has(k) || enNube.get(k).sexo !== m.g || enNube.get(k).nombre !== m.name))
      .map(([k, m]) => ({club_id: clubId(), clave: k, nombre: m.name, sexo: m.g, updated_at: new Date().toISOString()}));
    if (subir.length) { const r = await cloud.sb.from("agenda").upsert(subir); if (r.error) throw r.error; }
    cloud.agendaOk = true;
  } catch(e) { cloud.agendaOk = false; }   // si la tabla aún no existe, la app sigue funcionando solo con el móvil
}
// Cada vez que se marca un sexo, se guarda también en la nube (agrupado, 1 s después)
const pendientesAgenda = new Map();
const _remember = remember;
remember = (name, g) => {
  _remember(name, g);
  if (!cloud.organizer || !cloud.agendaOk || !(g === "H" || g === "M")) return;
  const k = norm(name); pendientesAgenda.set(k, {club_id: clubId(), clave: k, nombre: state.memory[k].name, sexo: g, updated_at: new Date().toISOString()});
  clearTimeout(remember.t);
  remember.t = setTimeout(async () => {
    const filas = [...pendientesAgenda.values()]; pendientesAgenda.clear();
    try { const r = await cloud.sb.from("agenda").upsert(filas); if (r.error) throw r.error; } catch(e) { filas.forEach(f => pendientesAgenda.set(f.clave, f)); }
  }, 1000);
};
// «Reset» con «borrar también la agenda»: se borra también la copia de la nube
window.clearCloudAgenda = async () => {
  if (!cloud.organizer || !cloud.agendaOk) return;
  try { await cloud.sb.from("agenda").delete().eq("club_id", clubId()); } catch(e) {}
};

async function loadPools(){
  const { data, error } = await cloud.sb.from("pools").select("*").order("fecha", {ascending: false}).order("created_at", {ascending: false}).limit(80);
  if (error) throw error;
  cloud.pools = data;
  // solo los eventos que ha creado o en los que figura como administrador (el modo creador los ve todos)
  try {
    const r = await cloud.sb.rpc("mis_eventos");
    if (!r.error) { const mios = new Set((r.data || []).map(x => typeof x === "string" ? x : x.mis_eventos)); cloud.pools = data.filter(p => mios.has(p.id)); }
  } catch(e) { }
  cloud.cuentas = {};
  if (data.length) {
    const r = await cloud.sb.from("inscripciones").select("pool_id").in("pool_id", data.map(x => x.id));
    if (!r.error) (r.data || []).forEach(x => cloud.cuentas[x.pool_id] = (cloud.cuentas[x.pool_id] || 0) + 1);
  }
  const linked = store.get("cloudPool", null);
  const p = data.find(x => x.id === linked) || data[0] || null;
  await selectPool(p);
}

/* ---------- contraseña de cada evento (la comprueba la base de datos) ---------- */
cloud.acceso = {};
// Qué puede hacer este usuario con el evento: {tiene_clave, puede, creador}
async function cargarAcceso(p){
  if (!p) return null;
  try {
    const r = await cloud.sb.rpc("mi_acceso", {p_pool: p.id});
    cloud.acceso[p.id] = r.error ? {puede: true, tiene_clave: false, sinSql: true} : r.data;
  } catch(e) { cloud.acceso[p.id] = {puede: true, tiene_clave: false, sinSql: true}; }
  return cloud.acceso[p.id];
}
const eventoBloqueado = p => !!(p && cloud.acceso[p.id] && !cloud.acceso[p.id].puede);
window.poolBloqueado = () => eventoBloqueado(cloud.pool);
// Ventana para escribir un texto (p. ej. la contraseña). Devuelve el texto o null si se cancela.
function pedirTexto(titulo, ayuda, {clave = false, si = "Aceptar", valor = "", tipo = ""} = {}){
  return new Promise(res => {
    const m = document.createElement("div"); m.className = "modal";
    m.innerHTML = `<div class="box"><p style="margin:0 0 6px;font-weight:700">${esc(titulo)}</p>${ayuda ? `<p class="help" style="margin:0 0 10px">${esc(ayuda)}</p>` : ""}
      <input id="ptTxt" type="${clave ? "password" : tipo || "text"}" autocomplete="off" value="${esc(valor)}" style="margin-bottom:12px">
      <div class="row"><button class="btn ghost" id="ptNo" type="button">Cancelar</button><button class="btn primary" id="ptSi" type="button">${esc(si)}</button></div></div>`;
    document.body.appendChild(m);
    const fin = v => { m.remove(); res(v); };
    m.querySelector("#ptNo").onclick = () => fin(null);
    m.querySelector("#ptSi").onclick = () => fin(m.querySelector("#ptTxt").value);
    m.querySelector("#ptTxt").onkeydown = e => { if (e.key === "Enter") fin(m.querySelector("#ptTxt").value); };
    setTimeout(() => m.querySelector("#ptTxt").focus(), 50);
  });
}
// (la contraseña por evento se quitó: ahora cada evento lo gestionan su creador y sus administradores)
async function asegurarAccesoSinUso(p){
  const a = await cargarAcceso(p);
  if (!a || a.puede) return true;
  for (;;) {
    const clave = await pedirTexto(`🔒 «${p.titulo}» tiene contraseña`, "Escribe la contraseña del evento para poder gestionarlo.", {clave: true, si: "Desbloquear"});
    if (clave === null) return false;
    const r = await cloud.sb.rpc("desbloquear_pool", {p_pool: p.id, p_clave: clave});
    if (r.error) { toast("No se pudo comprobar: " + cloudError(r.error)); return false; }
    if (r.data === "ok") { await cargarAcceso(p); toast("🔓 Evento desbloqueado"); return true; }
    toast(r.data === "bloqueado" ? "Demasiados intentos. Espera 15 minutos" : "Contraseña incorrecta");
    if (r.data === "bloqueado") return false;
  }
}
async function ponerClave(p, nueva){
  const clave = nueva != null ? nueva : await pedirTexto(`🔑 Contraseña de «${p.titulo}»`, "Mínimo 4 caracteres. Otros organizadores la necesitarán para cambiar este evento.", {clave: true, si: "Guardar"});
  if (clave === null) return false;
  if (clave.length < 4) { toast("La contraseña debe tener al menos 4 caracteres"); return false; }
  const r = await cloud.sb.rpc("poner_clave", {p_pool: p.id, p_clave: clave});
  if (r.error) { toast(r.error.code === "PGRST202" ? "Falta ejecutar cambio_18_claves_y_creador.sql en Supabase" : "No se pudo guardar la contraseña: " + cloudError(r.error)); return false; }
  await cargarAcceso(p); toast("🔑 Contraseña del evento guardada");
  return true;
}

async function selectPool(p){
  if (!cloud.pool || !p || cloud.pool.id !== p.id) cloud.borradorAdd = "";   // otro evento: cuadro de apuntar vacío
  cloud.pool = p;
  if (p) store.set("cloudPool", p.id);
  if (p) { state.header = poolToHeader(p); store.set("headerPool", p.id); save(); }   // la cabecera siempre sale de los datos del evento
  if (cloud.channel) { cloud.sb.removeChannel(cloud.channel); cloud.channel = null; }
  if (p) await cargarAcceso(p);
  if (p && cloud.canales === null) cargarCanales().then(() => { if (state.step === 0 && cloud.vista === "evento") renderCloud(); });
  await loadInscritos();
  if (p) {
    let t = null;
    const refresh = () => { clearTimeout(t); t = setTimeout(async () => { await reloadPool(); await loadInscritos(); if (state.step === 0) renderCloud(); }, 250); };
    cloud.channel = cloud.sb.channel("org-" + p.id)
      .on("postgres_changes", {event: "*", schema: "public", table: "inscripciones", filter: "pool_id=eq." + p.id}, refresh)
      .on("postgres_changes", {event: "*", schema: "public", table: "pools", filter: "id=eq." + p.id}, refresh)
      .on("postgres_changes", {event: "INSERT", schema: "public", table: "movimientos", filter: "pool_id=eq." + p.id}, refresh)   // bajas al momento
      .subscribe();
  }
}
async function reloadPool(){
  if (!cloud.pool) return;
  const { data } = await cloud.sb.from("pools").select("*").eq("id", cloud.pool.id).maybeSingle();
  if (data) { cloud.pool = data; cloud.pools = cloud.pools.map(x => x.id === data.id ? data : x); }
}
async function loadInscritos(){
  cloud.inscritos = [];
  if (!cloud.pool) return;
  // columnas nuevas primero; si la base de datos aún no las tiene, se piden sin ellas
  let data, error;
  for (const cols of ["id,nombre,sexo,created_at,posicion,reserva,confirmado,subio", "id,nombre,sexo,created_at,posicion,reserva,confirmado", "id,nombre,sexo,created_at,posicion,reserva", "id,nombre,sexo,created_at,posicion", "id,nombre,sexo,created_at"]) {
    ({ data, error } = await cloud.sb.from("inscripciones").select(cols).eq("pool_id", cloud.pool.id).order("created_at"));
    if (!error || !/reserva|posicion|confirmado|subio/.test(error.message || "")) break;
  }
  if (error) throw error;
  // parejas fijas: se ordenan por hueco (pareja 1 = huecos 0 y 1, pareja 2 = 2 y 3…)
  cloud.inscritos = cloud.pool.parejas_fijas ? data.slice().sort((a, b) => (a.posicion ?? 1e6) - (b.posicion ?? 1e6)) : data;
  // teléfonos de contacto (privados: solo los ve el organizador)
  try {
    const t = await cloud.sb.from("inscripcion_contacto").select("inscripcion_id,telefono").eq("pool_id", cloud.pool.id);
    cloud.telefonos = t.error ? {} : Object.fromEntries(t.data.map(x => [x.inscripcion_id, x.telefono]));
  } catch(e) { cloud.telefonos = {}; }
  try {
    const r = await cloud.sb.from("resultados").select("pool_id", {count: "exact", head: true}).eq("pool_id", cloud.pool.id);
    cloud.sorteado = !r.error && (r.count || 0) > 0;
  } catch(e) { cloud.sorteado = false; }
  syncPlayers();
}
// Los jugadores del sorteo son los apuntados en la web (la lista, sin reservas), por orden de inscripción
function syncPlayers(){
  const p = cloud.pool; if (!p) return;
  state.parejasFijas = !!p.parejas_fijas;
  if (p.tipo_sorteo && MODOS[p.tipo_sorteo]) state.modo = p.tipo_sorteo;   // el tipo de sorteo del evento manda
  const lista = partir(p, cloud.inscritos).lista;
  state.players = lista.map((i, k) => { const m = state.memory[norm(i.nombre)];
    return {id: i.id, num: p.parejas_fijas ? i.posicion + 1 : k + 1, name: m ? m.name : i.nombre, g: m ? m.g : "H", conf: !!i.confirmado}; });   // sin dato: hombre
  detectarSubidas(p);
  save();
  if (state.step === 2) renderPlayers();
  if (state.step === 4) renderPre();
  if (window.Android && Android.revisarAvisos) Android.revisarAvisos();
}
// Compara la lista con la última vista de este evento: quien estaba en reservas y ahora está en la lista, ha subido.
// Usa la misma «foto» que la revisión automática de Android (padel.subidas), así no se avisa dos veces.
function detectarSubidas(p){
  const {lista, reservas} = partir(p, cloud.inscritos);
  const fotos = store.get("subidas", {}) || {}, antes = fotos[p.id];
  fotos[p.id] = {l: lista.map(i => i.id), r: reservas.map(i => i.id)};
  store.set("subidas", fotos);
  if (!antes || !Array.isArray(antes.r)) return;   // primera vez que se ve este evento
  const eranReserva = new Set(antes.r), avisos = getAvisos(), ya = new Set(avisos.map(a => a.id)), sub = store.get("subidos", []) || [];
  const nuevos = lista.filter(i => eranReserva.has(i.id) && !ya.has(i.id));
  if (!nuevos.length) return;
  nuevos.forEach(i => {
    avisos.push({pool: p.id, titulo: p.titulo, id: i.id, nombre: i.nombre, t: Date.now()});
    sub.push(i.id);
    if (window.Android && Android.notificar) Android.notificar(i.nombre, p.titulo);
  });
  store.set("avisos", avisos); store.set("subidos", sub.slice(-300));
  toast(`⬆️ ${nuevos.map(i => i.nombre).join(", ")} ha pasado de reservas a la lista`);
  if (state.step === 0 && window.renderCloud) setTimeout(renderCloud, 0);
}
window.renderCloudPlayersInfo = () => {
  const box = $("cloudPlayersInfo"); if (!box) return;
  const p = cloud.pool;
  if (!cloud.organizer || !p) {
    if ($("cloudReservas")) $("cloudReservas").innerHTML = "";
    box.innerHTML = `<div class="note warn" style="margin-bottom:12px">Ve a <b>🏠 Inicio</b> y crea o elige un evento: los jugadores son los que se apuntan en la web.${state.players.length ? " Mientras, se muestra la última lista descargada." : ""}</div>`;
    return;
  }
  const res = partir(p, cloud.inscritos).reservas.length;
  const apuntar = `<div class="card" style="margin-bottom:12px">
      <button class="btn primary" id="cAdd" style="width:100%">➕ Apuntar jugadores</button>
      <div id="cAddBox" class="${cloud.addAbierto ? "" : "hidden"}" style="margin-top:10px">
        <p class="help" style="margin:0 0 6px">Uno por línea. Con número delante (p. ej. «3 Jose») entra en ese puesto y te pregunta si eliminar a quien está ahora o intercalarlo. Sin número, se apunta detrás de los que ya están (si la lista está llena, a reservas). Puedes poner el teléfono al final: «Jose 600123456».</p>
        <textarea id="aLista" style="min-height:110px" placeholder="3 Jose&#10;Ana">${esc(cloud.borradorAdd || "")}</textarea>
        <button class="btn primary small" id="aSave" style="margin-top:6px">Apuntar</button>
      </div></div>`;
  // reservas: no entran en el sorteo, pero se pueden quitar desde aquí
  const reservas = partir(p, cloud.inscritos).reservas;
  $("cloudReservas").innerHTML = reservas.length ? `<div class="card"><div style="font-weight:700;margin-bottom:6px">Reservas <span class="help">(no entran en el sorteo)</span></div>
    <ul class="plist">${reservas.map((i, k) => `<li><span class="num">R${p.parejas_fijas ? Math.floor((i.posicion - p.max_jugadores) / 2) + 1 : k + 1}.</span><span class="nm" style="cursor:default">${esc(i.nombre)}${(cloud.telefonos || {})[i.id] ? `<a class="tel" href="#" data-tel="${esc(cloud.telefonos[i.id])}" data-id="${esc(i.id)}">📞 ${esc(cloud.telefonos[i.id])}</a>` : `<button type="button" class="tagbtn addtel" data-addtel="${esc(i.id)}" data-nombre="${esc(i.nombre)}">＋📞</button>`}</span>
      <button class="x" data-quitar="${esc(i.id)}" title="Quitar del evento">×</button></li>`).join("")}</ul></div>` : "";
  $("cloudReservas").querySelectorAll("[data-quitar]").forEach(b => b.onclick = () => quitarInscrito(b.dataset.quitar));
  $("cloudReservas").querySelectorAll("[data-addtel]").forEach(b => b.onclick = () => editarTelefono(b.dataset.addtel, b.dataset.nombre));
  box.innerHTML = avisosHtml(p.id) + `<div class="note ok" style="margin-bottom:12px">☁ <b>${esc(p.titulo)}</b>: ${state.players.length} de ${p.max_jugadores} plazas${res ? ` · ${res} en reservas (no entran)` : ""}. Se actualiza solo.${p.parejas_fijas ? "<br>👫 <b>Parejas fijas</b>: se respetan las parejas; el sorteo solo reparte las pistas." : ""}</div>` + apuntar;
  wireApuntar(p); wireAvisos();
};

// «Apuntar jugadores» (pestaña Jugadores)
function wireApuntar(p){
  $("aLista").oninput = () => { cloud.borradorAdd = $("aLista").value; };
  $("cAdd").onclick = () => { cloud.addAbierto = !cloud.addAbierto; $("cAddBox").classList.toggle("hidden", !cloud.addAbierto); if (cloud.addAbierto) $("aLista").focus(); };
  $("aSave").onclick = () => guard(async () => {
    const {nombres, numeros, telefonos} = parseNombres($("aLista").value);
    if (!nombres.length) { toast("Escribe al menos un nombre"); return; }
    let n = 0;
    const sinNumero = nombres.filter((x, i) => numeros[i] == null);
    for (let i = 0; i < nombres.length; i++) if (numeros[i] != null) n += await apuntarEnPuesto(p, nombres[i], numeros[i]);
    if (sinNumero.length) n += await apuntarFijos(p, sinNumero);
    if (telefonos.some(Boolean)) { await ponerTelefonos(p, nombres, telefonos); await loadInscritos(); }
    cloud.borradorAdd = ""; cloud.addAbierto = false;
    toast(n ? `${n} jugador(es) apuntados` : "Ya estaban todos apuntados (o no quedan plazas)");
  }).then(() => { if (state.step === 2) renderPlayers(); });
}

// «Sorteo visible en la web» (pestaña Sorteo)
window.renderCloudSorteo = () => {
  const box = $("cloudSorteo"); if (!box) return;
  const p = cloud.pool;
  if (!cloud.organizer || !p) { box.innerHTML = ""; return; }
  const oculto = p.mostrar_sorteo === false;
  box.innerHTML = `<div class="card">
      <div style="font-weight:700;margin-bottom:8px">Sorteo en la web</div>
      <button class="btn ${oculto ? "danger" : ""}" id="cVis" style="width:100%">${oculto ? "🙈 Sorteo oculto en la web" : "👁 Sorteo visible en la web"}</button>
      <p class="help" style="margin:6px 0 0">${oculto ? "Los jugadores no ven el resultado. Pulsa para mostrarlo." : "Los jugadores ven el resultado en cuanto sorteas. Pulsa para ocultarlo."}</p>
    </div>`;
  $("cVis").onclick = () => guard(async () => {
    const mostrar = p.mostrar_sorteo === false;
    const { error } = await cloud.sb.from("pools").update({mostrar_sorteo: mostrar}).eq("id", p.id);
    if (error) throw error;
    await reloadPool();
    toast(mostrar ? "👁 El sorteo ya se ve en la web" : "🙈 El sorteo queda oculto en la web");
  }).then(() => window.renderCloudSorteo());
};

/* ---------- pantalla ---------- */
/* ---------- navegación: login → menú → (eventos activos | crear evento) → evento ---------- */
const hoyIso = () => isoDate(new Date());
const fechaCorta = window.fechaCorta = iso => iso ? fromIso(iso).toLocaleDateString("es-ES", {day: "2-digit", month: "2-digit", year: "numeric"}) : "";
// Pestañas y barra inferior solo dentro de un evento (o sin conexión, para usar lo guardado)
window.actualizarMarco = () => {
  const dentro = (cloud.user && cloud.organizer && cloud.vista === "evento" && cloud.pool) || !cloud.sb || cloud.initError;
  $("steps").style.display = dentro ? "" : "none";
  document.querySelector(".bar").style.display = dentro ? "" : "none";
  $("cloudTab").style.display = cloud.user && cloud.organizer ? "" : "none";
};
window.irAlMenu = () => { cloud.vista = "menu"; go(0); };
function irA(vista){ cloud.vista = vista; go(0); }
// botón «atrás» de Android en las pantallas online
window.cloudAtras = () => {
  if (state.step !== 0 || !cloud.user) return 0;
  if (cloud.vista === "lista" || cloud.vista === "crear" || cloud.vista === "panel") { irA("menu"); return 1; }
  if (cloud.vista === "evento") { irA("lista"); return 1; }
  return 0;
};
/* ---------- Panel del creador: qué canales de Telegram ve cada administrador ---------- */
async function renderPanel(box){
  titulos("👑 Panel del creador", "Cada administrador solo verá los canales de Telegram que tenga asignados. Quítalos con × o añade otros con el desplegable.");
  box.innerHTML = `<button class="btn small ghost" id="pVolver" style="margin-bottom:10px">‹ Menú</button><div class="card help">Cargando…</div>`;
  $("pVolver").onclick = () => irA("menu");
  if (!cloud.creador) { box.innerHTML += `<div class="card">Solo para el creador.</div>`; return; }
  const [ra, rc] = await Promise.all([cloud.sb.rpc("panel_admins"), cloud.sb.rpc("panel_canales")]);
  if (cloud.vista !== "panel") return;
  if (ra.error || rc.error) {
    const e = ra.error || rc.error;
    box.innerHTML = `<button class="btn small ghost" id="pVolver" style="margin-bottom:10px">‹ Menú</button><div class="card">${e.code === "PGRST202" ? "Falta ejecutar cambio_25_panel_creador.sql en Supabase" : esc("No se pudo cargar: " + cloudError(e))}</div>`;
    $("pVolver").onclick = () => irA("menu"); return;
  }
  const admins = ra.data || [], canales = rc.data || [];
  const fecha = t => t ? new Date(t).toLocaleDateString("es-ES", {day: "2-digit", month: "2-digit", year: "numeric"}) : "nunca";
  // canales de cada administrador: solo los que tiene (con ×) y un desplegable para añadir otro
  const suyos = a => canales.filter(c => (c.emails || []).includes(a.email));
  const tarjeta = a => {
    const tiene = suyos(a), resto = canales.filter(c => !tiene.includes(c));
    return `<div class="card" data-admin="${esc(a.email)}">
      <div style="font-weight:700;word-break:break-all">👤 ${esc(a.email)}</div>
      <div class="help" style="margin:2px 0 8px">${a.eventos} evento(s) · último acceso: ${esc(fecha(a.ultimo_acceso))}</div>
      <div class="chips" style="margin-bottom:8px">${tiene.length ? tiene.map(c => `<span class="chip" style="display:inline-flex;align-items:center;gap:6px;border-style:solid">📣 ${esc(c.titulo)}<button type="button" class="x" data-quitarcanal="${esc(c.id)}" title="Quitar canal" style="font-size:18px;padding:0 2px">×</button></span>`).join("")
        : `<span class="help">Sin canales asignados.</span>`}</div>
      ${resto.length ? `<select data-anadircanal="1"><option value="">＋ Añadir canal…</option>${resto.map(c => `<option value="${esc(c.id)}">📣 ${esc(c.titulo)}</option>`).join("")}</select>`
        : canales.length ? "" : `<p class="help" style="margin:0">Todavía no hay canales vinculados.</p>`}
    </div>`;
  };
  box.innerHTML = `<button class="btn small ghost" id="pVolver" style="margin-bottom:10px">‹ Menú</button>
    <div style="font-weight:700;margin:4px 2px 8px">Administradores (${admins.length})</div>
    ${admins.length ? admins.map(tarjeta).join("") : `<div class="card help">No hay más administradores registrados. Se crean en Supabase (Authentication → Users) y se les da acceso de organizador.</div>`}
    <div style="font-weight:700;margin:16px 2px 8px">Canales de Telegram (${canales.length})</div>
    ${canales.length ? canales.map(c => `<div class="card"><div style="font-weight:700">📣 ${esc(c.titulo)}</div>
        <div class="help" style="margin:2px 0 0">${(c.emails || []).length ? "Lo pueden usar: " + c.emails.map(esc).join(", ") : "Solo tú (y quien lo vinculó)"}</div>
        <div class="help" style="margin:4px 0 0;word-break:break-all">🔗 ${c.enlace ? esc(c.enlace) : "Sin enlace: no saldrá el botón «Seguir en Telegram» en la web"}</div>
        <button class="btn small ghost" data-enlace="${esc(c.id)}" style="margin-top:6px">🔗 ${c.enlace ? "Cambiar enlace" : "Poner enlace"}</button></div>`).join("")
      : `<div class="card help">Ninguno. Se vinculan desde un evento con «📣 Telegram».</div>`}`;
  $("pVolver").onclick = () => irA("menu");
  // guardar al momento: quitar con × o añadir desde el desplegable
  const guardar = (email, ids) => guard(async () => {
    const r = await cloud.sb.rpc("asignar_canales", {p_email: email, p_canales: ids});
    if (r.error) throw r.error;
    toast(`💾 ${email}: ${ids.length ? ids.length + " canal(es)" : "sin canales"}`);
    renderPanel(box);
  });
  box.querySelectorAll("[data-enlace]").forEach(b => b.onclick = async () => {
    const c = canales.find(x => x.id === b.dataset.enlace);
    const v = await pedirTexto(`🔗 Enlace de «${c.titulo}»`, "Pega el enlace de invitación del canal (Telegram → canal → Administrar canal → Enlaces de invitación). Déjalo vacío para quitarlo.", {si: "Guardar", valor: c.enlace || ""});
    if (v === null) return;
    guard(async () => {
      const r = await cloud.sb.rpc("poner_enlace_canal", {p_canal: c.id, p_enlace: v});
      if (r.error) { toast(/ENLACE_NO_VALIDO/.test(r.error.message || "") ? "Ese enlace no es de Telegram (debe empezar por https://t.me/)" : r.error.code === "PGRST202" ? "Falta ejecutar cambio_29_enlace_telegram_web.sql en Supabase" : "No se pudo guardar: " + cloudError(r.error)); return; }
      toast("🔗 Enlace guardado"); renderPanel(box);
    });
  });
  box.querySelectorAll("[data-admin]").forEach(card => {
    const email = card.dataset.admin, actuales = () => canales.filter(c => (c.emails || []).includes(email)).map(c => c.id);
    card.querySelectorAll("[data-quitarcanal]").forEach(b => b.onclick = () => guardar(email, actuales().filter(id => id !== b.dataset.quitarcanal)));
    const sel = card.querySelector("[data-anadircanal]");
    if (sel) sel.onchange = () => { if (sel.value) guardar(email, [...actuales(), sel.value]); };
  });
}

function titulos(t, ayuda){ $("cloudTitle").textContent = t; $("cloudHelp").textContent = ayuda || ""; $("cloudHelp").style.display = ayuda ? "" : "none"; }

function renderMenu(box){
  titulos("🏠 Inicio", "");
  const activos = cloud.pools.filter(x => x.fecha >= hoyIso());
  const p = cloud.pool, seguir = p && p.fecha >= hoyIso();
  box.innerHTML = avisosHtml(null) + `
    <button class="btn primary bigbtn" id="mEventos">📋 Gestionar un evento activo<small>${activos.length ? `${activos.length} evento${activos.length === 1 ? "" : "s"} activo${activos.length === 1 ? "" : "s"}` : "No hay eventos activos"}</small></button>
    ${cloud.creador ? `<button class="btn bigbtn" id="mPanel" style="border-color:#c9a227">👑 Panel del creador<small>Administradores y canales de Telegram</small></button>` : ""}
    <button class="btn bigbtn" id="mCrear">＋ Crear un nuevo evento<small>Fecha, horario, club, plazas y jugadores ya inscritos</small></button>
    ${seguir ? `<button class="btn ghost bigbtn" id="mSeguir" style="font-size:16px">↪ Continuar con «${esc(p.titulo)}»<small>📅 ${fechaCorta(p.fecha)}</small></button>` : ""}
    <p class="help" style="text-align:center;margin-top:18px">Conectado como ${esc(cloud.user.email || "")} · <a href="#" id="cLogout">Salir</a></p>
    ${cloud.creador ? `<p class="help" style="text-align:center;margin-top:4px">👑 Modo creador: puedes gestionar todos los eventos</p>` : ""}
    ${estadoAvisosHtml()}`;
  wireAvisos();
  $("mEventos").onclick = () => irA("lista");
  $("mCrear").onclick = () => irA("crear");
  if ($("mPanel")) $("mPanel").onclick = () => irA("panel");
  if ($("mSeguir")) $("mSeguir").onclick = () => irA("evento");
  $("cLogout").onclick = logout;
}

function renderLista(box){
  titulos("📋 Eventos activos", "Toca un evento para gestionarlo.");
  const hoy = hoyIso();
  const activos = cloud.pools.filter(x => x.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const pasados = cloud.pools.filter(x => x.fecha < hoy);
  const fila = x => {
    const est = ESTADOS[x.estado] || ["", ""], n = (cloud.cuentas || {})[x.id] || 0;
    return `<div class="card evrow">
      <div class="info" data-open="${x.id}">
        <div class="tt">${esc(x.titulo)}</div>
        <div class="help" style="margin:2px 0 0">📅 ${fechaCorta(x.fecha)}${x.horario ? " · " + esc(x.horario) : ""} · ${n}/${x.max_jugadores} apuntados</div>
        <div style="margin-top:6px"><span class="pill ${est[1]}">${est[0]}</span>${x.parejas_fijas ? ` <span class="pill">👫 Parejas fijas</span>` : x.tipo_sorteo && MODOS[x.tipo_sorteo] ? ` <span class="pill">${MODOS[x.tipo_sorteo].t}</span>` : ""}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;flex:none">
        <button class="btn small" data-compartir="${x.id}" title="Compartir enlace" style="font-size:18px;padding:10px 12px">📤</button>
        <button class="btn danger small" data-borrar="${x.id}" title="Eliminar evento" style="font-size:18px;padding:10px 12px">🗑</button>
      </div>
    </div>`;
  };
  box.innerHTML = `<button class="btn small ghost" id="lVolver" style="margin-bottom:10px">‹ Menú</button>
    <div class="card"><div style="font-weight:700">🌐 Web de inscripción</div>
      <p class="help" style="margin:2px 0 8px;word-break:break-all">${esc(clubWebUrl())}</p>
      <div class="row wrap"><button class="btn small primary" id="lWebShare">📤 Compartir enlace</button><button class="btn small" id="lWebCopy">📋 Copiar enlace</button></div></div>
    ${activos.length ? activos.map(fila).join("") : `<div class="card">No hay eventos activos. <a href="#" id="lCrear">Crear uno</a></div>`}
    ${pasados.length ? `<details class="card" ${cloud.verPasados ? "open" : ""} id="lPas"><summary>Eventos pasados (${pasados.length})</summary><div style="margin-top:10px">${pasados.map(fila).join("")}</div></details>` : ""}`;
  $("lVolver").onclick = () => irA("menu");
  // enlace general: la web con todos los eventos, donde la gente se apunta
  const textoWeb = `🎾 Próximas competiciones: elige la tuya y apúntate 👉 ${clubWebUrl()}`;
  $("lWebShare").onclick = () => { if (window.Android && Android.share) Android.share(textoWeb); else if (navigator.share) navigator.share({text: textoWeb}).catch(() => {}); else copyText(textoWeb).then(ok => toast(ok ? "Enlace copiado" : WEB_URL)); };
  $("lWebCopy").onclick = () => copyText(clubWebUrl()).then(ok => toast(ok ? "Enlace copiado" : clubWebUrl()));
  if ($("lCrear")) $("lCrear").onclick = e => { e.preventDefault(); irA("crear"); };
  if ($("lPas")) $("lPas").ontoggle = () => cloud.verPasados = $("lPas").open;
  box.querySelectorAll("[data-open]").forEach(el => el.onclick = async () => {
    const x = cloud.pools.find(y => y.id === el.dataset.open);
    await guard(async () => { await selectPool(x); cloud.vista = "evento"; });
    go(0);
  });
  box.querySelectorAll("[data-compartir]").forEach(b => b.onclick = () => compartirEvento(cloud.pools.find(y => y.id === b.dataset.compartir)));
  box.querySelectorAll("[data-borrar]").forEach(b => b.onclick = async () => {
    const x = cloud.pools.find(y => y.id === b.dataset.borrar);
    if (!await ask(`¿Quieres eliminar el evento «${x.titulo}» (${fechaCorta(x.fecha)})?\n\nSe borrarán también sus apuntados y su sorteo, y desaparecerá de la web. No se puede deshacer.`, "Eliminar")) return;
    guard(async () => {
      const { error } = await cloud.sb.from("pools").delete().eq("id", x.id); if (error) throw error;
      if (cloud.pool && cloud.pool.id === x.id) { cloud.pool = null; store.set("cloudPool", null); }
      await loadPools(); toast("Evento eliminado");
    });
  });
}

function renderCrear(box){
  titulos("＋ Nuevo evento", "Al crearlo se abre la inscripción y se publica en la web.");
  const d = isoDate(upcomingTuesday()), hf = headerToFields(state.header);
  box.innerHTML = `<button class="btn small ghost" id="crVolver" style="margin-bottom:10px">‹ Menú</button>
    <div class="card">
      <button class="btn" type="button" id="crIni" style="width:100%;text-align:left">👥 Jugadores iniciales <span id="crIniN">${cuantosIniciales() ? `(${cuantosIniciales()})` : "(vacía)"}</span></button>
      <div id="crIniBox" class="hidden" style="margin-top:8px">
      <p class="help" style="margin:4px 0 6px">Uno por línea, con o sin número delante (sin número van al siguiente hueco libre). Al crear el evento quedan apuntados en este orden; los demás se apuntan después en la web. Se guarda para el próximo evento.</p>
      <textarea id="nLista" style="min-height:140px" placeholder="1. Juan&#10;2. Ana&#10;3. Luis">${esc(getLista())}</textarea>
      </div>
      <div class="lbl" id="nCanalBox" style="margin-top:10px">📣 Canal de Telegram <span class="help" style="font-weight:400">(se publicarán las novedades del evento)</span>
        <div class="row" style="margin-top:4px"><select id="nCanal" style="flex:1">${canalSelectHtml()}</select><button type="button" class="btn small" id="nCanalNuevo">＋ Vincular</button></div></div>
      ${poolFormHtml("n", {fecha: d, titulo: poolTitle(d), horario: hf.horario || "21:30-23:00", importe: hf.importe || "6€ PERSONA", notas: hf.notas, max_jugadores: 20, max_reservas: 10}, "Crear y abrir inscripción")}
    </div>`;
  $("crVolver").onclick = () => irA("menu");
  prepararCanalCrear();
  $("nCanalNuevo").onclick = async () => { const id = await vincularCanal(null); if (id) { store.set("canalRecordado", id); $("nCanal").innerHTML = canalSelectHtml(); } };
  wireCloud();
}

function renderCloud(){
  const box = $("cloudBox");
  actualizarMarco();
  if (!cloud.user || !cloud.organizer || cloud.initError || !cloud.sb) titulos("☁ Evento online", "Entra con tu usuario de organizador para gestionar los eventos.");
  if (cloud.initError) {
    box.innerHTML = `<div class="card"><b>No se ha podido conectar.</b><p class="help" style="margin:6px 0 0">${esc(cloud.initError)}</p>
      <button class="btn small" id="cRetry" style="margin-top:8px">Reintentar</button></div>`;
    $("cRetry").onclick = cloudStart; return;
  }
  if (!cloud.sb) { box.innerHTML = `<div class="card">No se ha podido cargar la conexión online.</div>`; return; }
  if (!cloud.user) { renderLogin(box); return; }
  if (!cloud.organizer) {
    box.innerHTML = `<div class="card"><p>El usuario <b>${esc(cloud.user.email || "")}</b> no está autorizado como organizador.</p>
      <p class="help">En Supabase, ejecuta la línea de <i>organizadores</i> con este email.</p>
      <button class="btn ghost" id="cLogout">Salir</button></div>`;
    $("cLogout").onclick = logout; return;
  }
  if (cloud.vista === "menu") { renderMenu(box); return; }
  if (cloud.vista === "lista") { renderLista(box); return; }
  if (cloud.vista === "crear") { renderCrear(box); return; }
  if (cloud.vista === "panel") { renderPanel(box); return; }
  if (!cloud.pool) { cloud.vista = "menu"; renderMenu(box); return; }
  titulos("📍 Evento", "");
  if (eventoBloqueado(cloud.pool)) {
    const p = cloud.pool;
    box.innerHTML = `<button class="btn small ghost" id="cVolver" style="margin-bottom:10px">‹ Eventos activos</button>
      <div class="card"><div style="font-weight:700;font-size:17px">🔒 ${esc(p.titulo)}</div>
      <p class="help" style="margin:6px 0 0">Este evento es de otro organizador y no figuras como administrador. Pídele que añada tu email en el evento.</p></div>`;
    $("cVolver").onclick = () => irA("lista");
    return;
  }
  const p = cloud.pool, html = [`<button class="btn small ghost" id="cVolver" style="margin-bottom:10px">‹ Eventos activos</button>`, avisosHtml(p.id)];
  const ordenInscripcion = new Map(cloud.inscritos.slice().sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || ""))).map((i, k) => [i.id, k + 1]));
  if (p) {
    const max = p.max_jugadores, {lista, reservas} = partir(p, cloud.inscritos);
    // el sexo lo marca el organizador y lo guarda la agenda de la app
    const sx = i => recall(i.nombre) || "H";   // por defecto, hombre: solo hay que marcar a las chicas
    const H = lista.filter(i => sx(i) === "H").length, M = lista.filter(i => sx(i) === "M").length, est = ESTADOS[p.estado] || ["", ""];
    const sinMarcar = lista.filter(i => !sx(i));
    html.push(`<div class="card">
      <div class="row" style="justify-content:space-between;align-items:flex-start"><div><div style="font-weight:700;font-size:17px">${esc(p.titulo)}</div>
      ${p.fecha ? `<div style="font-weight:600;font-size:14px;margin-top:2px">📅 ${esc(fromIso(p.fecha).toLocaleDateString("es-ES", {day: "2-digit", month: "2-digit", year: "numeric"}))}</div>` : ""}
      <div class="help" style="margin:2px 0 0">${esc([DEPORTES[p.deporte || "padel"], p.horario, p.importe].filter(Boolean).join(" · "))} · código ${esc(p.codigo)}</div>
      ${p.club ? `<div class="help" style="margin:2px 0 0">📍 ${esc(p.club)}</div>` : ""}</div>
      <span class="pill ${est[1]}">${est[0]}</span>${cloud.sorteado ? `<span class="pill okp" style="margin-left:4px">🎲 Sorteo realizado</span>` : ""}</div>
      <div class="stats"><span class="pill">${lista.length} / ${max} jugadores</span>${reservas.length ? `<span class="pill">${reservas.length} en reservas</span>` : ""}
        <span class="pill h">♂ ${H}</span><span class="pill m">♀ ${M}</span>${sinMarcar.length ? `<span class="pill warnp">${sinMarcar.length} sin marcar</span>` : ""}${lista.length >= max ? `<span class="pill okp">🟢 Completa</span>` : ""}</div>
      <div class="help" style="margin:10px 0 0;word-break:break-all">${esc(poolUrl(p))}</div>
      <div class="row wrap" style="margin-top:10px">
        <button class="btn primary small" id="cShare">📤 Compartir enlace</button>
        ${p.estado === "abierta" ? `<button class="btn small" id="cClose">🔒 Cerrar inscripción</button>`
          : p.estado === "sorteada" ? `<button class="btn small" id="cOpen">🔓 Reabrir inscripción</button><button class="btn small" id="cClose">🔒 Cerrar también reservas</button>`
          : `<button class="btn small" id="cOpen">🔓 Abrir inscripción</button>`}
        <button class="btn small ghost" id="cEdit">✏️ Editar datos evento</button>
        <button class="btn small ghost" id="cSemana">🔁 Nueva semana</button>
        <button class="btn small ghost" id="cTelegram">📣 Telegram${p.telegram_canal && nombreCanal(p.telegram_canal) ? ": " + esc(nombreCanal(p.telegram_canal)) : ""}</button>
        <button class="btn small danger" id="cDelPool">🗑 Borrar</button>
      </div>
      ${p.notas ? `<div class="help" style="margin:8px 0 0;white-space:pre-line">${esc(p.notas)}</div>` : ""}
      <div id="cEditBox" class="hidden">${poolFormHtml("e", p, "💾 Guardar y publicar en la web")}</div>
      ${sinMarcar.length ? `<div class="help" style="margin:6px 0 0">Marca H o M de cada jugador en la pestaña «Jugadores» para poder sortear. La app lo recordará para las siguientes pools.</div>` : ""}
    </div>`);
  } else {
    html.push(`<div class="card"><b>No hay ningún evento creado.</b><p class="help" style="margin:4px 0 0">Crea el primero aquí abajo.</p></div>`);
  }
  html.push(`<p class="help" style="text-align:center">Conectado como ${esc(cloud.user.email || "")} · <a href="#" id="cLogout">Salir</a></p>`);
  box.innerHTML = html.join("");
  wireCloud();
}

function renderLogin(box){
  box.innerHTML = `<div class="card">
    ${cloud.expulsado ? `<div class="note warn" style="margin-bottom:10px">Tu usuario se ha abierto en otro móvil y este se ha desconectado. Si eras tú, vuelve a entrar: el otro móvil quedará desconectado.</div>` : ""}
    <div style="font-weight:700;margin-bottom:4px">Entrar como organizador</div>
    <p class="help">Usa el email y la contraseña del usuario que creaste en Supabase. Solo hay que hacerlo una vez: la sesión queda guardada en el móvil.</p>
    <div style="display:grid;gap:8px">
      <input type="email" id="cEmail" placeholder="Email" autocomplete="username">
      <div style="position:relative">
        <input type="password" id="cPass" placeholder="Contraseña" autocomplete="current-password" style="padding-right:48px">
        <button type="button" id="cVer" title="Mostrar contraseña" aria-label="Mostrar contraseña"
          style="position:absolute;right:4px;top:50%;transform:translateY(-50%);border:0;background:transparent;font-size:20px;padding:6px 10px;cursor:pointer;color:var(--muted)">👁</button>
      </div>
      <button class="btn primary" id="cLogin">Entrar</button>
    </div></div>`;
  const go_ = async () => {
    const email = $("cEmail").value.trim(), password = $("cPass").value;
    if (!email || !password) { toast("Escribe email y contraseña"); return; }
    $("cLogin").disabled = true; $("cLogin").textContent = "Entrando…";
    try {
      const { data, error } = await cloud.sb.auth.signInWithPassword({email, password});
      if (error) throw error;
      await reclamarSesion();                                   // este móvil pasa a ser el único activo
      // y se cierran las sesiones de otros móviles (salvo al creador del sistema, que no tiene límite de dispositivos)
      if (String(email).toLowerCase() !== "vgonzalom@gmail.com") { try { await cloud.sb.auth.signOut({scope: "others"}); } catch(e) {} }
      cloud.expulsado = false; cloud.vista = "menu";
      await setUser(data.user); renderCloud();
    } catch(e) { toast(cloudError(e)); $("cLogin").disabled = false; $("cLogin").textContent = "Entrar"; }
  };
  $("cLogin").onclick = go_;
  // ojo: ver u ocultar la contraseña mientras se escribe
  $("cVer").onclick = () => {
    const i = $("cPass"), ver = i.type === "password";
    i.type = ver ? "text" : "password"; $("cVer").textContent = ver ? "🙈" : "👁";
    $("cVer").title = ver ? "Ocultar contraseña" : "Mostrar contraseña"; i.focus();
  };
  $("cPass").onkeydown = e => { if (e.key === "Enter") go_(); };
}

async function logout(e){
  if (e) e.preventDefault();
  if (cloud.channel) { cloud.sb.removeChannel(cloud.channel); cloud.channel = null; }
  await cloud.sb.auth.signOut();
  cloud.user = null; cloud.organizer = false; cloud.pool = null; cloud.pools = []; cloud.inscritos = []; cloud.vista = "menu";
  renderCloud();
}

async function guard(fn){
  if (cloud.busy) return; cloud.busy = true;
  try { if (await sigoActivo()) await fn(); } catch(e) { toast(cloudError(e)); }
  cloud.busy = false; if (state.step === 0) renderCloud();
}

function compartirEvento(p){
  if (!p) return;
  const t = shareText(p);
  if (window.Android && Android.share) Android.share(t); else copyText(t).then(ok => toast(ok ? "Enlace copiado" : t));
}
function shareText(p){
  const h = poolToHeader(p).split(String.fromCharCode(10));
  const L = [h[0], p.fecha ? `📅 ${fechaCorta(p.fecha)}` : null, ...h.slice(1)].filter(Boolean);
  L.push("", `🎾 Apúntate aquí 👉 ${poolUrl(p)}`);
  return L.join("\n");
}

function wireCloud(){
  const p = cloud.pool;
  const on = (id, f) => { const el = $(id); if (el) el.onclick = f; };
  wireAvisos();
  on("cLogout", logout);
  on("cVolver", () => irA("lista"));
  on("cShare", () => compartirEvento(p));
  on("cClose", () => guard(async () => { const { error } = await cloud.sb.from("pools").update({estado: "cerrada"}).eq("id", p.id); if (error) throw error; await reloadPool(); toast("Inscripción cerrada"); }));
  on("cOpen", async () => {
    // con el sorteo hecho, reabrir permite que alguien se borre (o se apunte); el sorteo publicado se queda como está
    if (p.estado === "sorteada" && !await ask("Se reabre la inscripción: los jugadores podrán borrarse y apuntarse otra vez (también como reservas) desde la web.\n\nEl sorteo publicado se mantiene tal cual. Si hay cambios, vuelve a sortear o usa «Modificar parejas» y se publicará de nuevo.", "Reabrir")) return;
    guard(async () => { const { error } = await cloud.sb.from("pools").update({estado: "abierta"}).eq("id", p.id); if (error) throw error; await reloadPool(); toast("Inscripción abierta"); });
  });
  on("cDelPool", async () => {
    if (!await ask(`¿Quieres eliminar el evento «${p.titulo}»?\n\nSe borrarán también sus apuntados y su sorteo, y desaparecerá de la web. No se puede deshacer.`, "Eliminar")) return;
    guard(async () => { const { error } = await cloud.sb.from("pools").delete().eq("id", p.id); if (error) throw error; store.set("cloudPool", null); cloud.pool = null; await loadPools(); cloud.vista = "lista"; toast("Evento eliminado"); });
  });
  document.querySelectorAll("#cloudBox [data-sx]").forEach(g => g.querySelectorAll("input").forEach(inp => inp.onchange = () => {
    remember(g.dataset.sx, inp.value); save(); renderCloud();
  }));
  document.querySelectorAll("#cloudBox [data-pick]").forEach(el => el.onclick = () => guard(async () => { await selectPool(cloud.pools.find(x => x.id === el.dataset.pick)); }));
  wirePoolForm("n"); wirePoolForm("e"); wireAdmins("n"); wireAdmins("e");
  on("cTelegram", () => elegirCanal(p));
  on("cSemana", () => nuevaSemana(p));
  on("cEdit", () => { $("cEditBox").classList.toggle("hidden"); if (!$("cEditBox").classList.contains("hidden")) cargarAdminsForm("e", p); });
  on("nSave", () => guard(async () => {
    const row = readPoolForm("n");
    if (!row.fecha || !row.titulo) { toast("Pon fecha y título"); return; }
    const {nombres, numeros, telefonos} = parseNombres($("nLista").value);
    store.set("jugadoresIniciales", $("nLista").value);   // se recuerda para los siguientes eventos
    const data = await savePool(row);
    await guardarAdmins(data, "n", true);
    const canal = $("nCanal") ? $("nCanal").value : "";
    cloud.pools.unshift(data); await selectPool(data); cloud.vista = "evento";
    state.header = poolToHeader(data); save();
    const n = nombres.length ? await apuntarFijos(data, nombres, numeros) : 0;
    if (n && telefonos.some(Boolean)) await ponerTelefonos(data, nombres, telefonos);
    if (canal) { const rc = await cloud.sb.rpc("poner_canal", {p_pool: data.id, p_canal: canal}); if (!rc.error) { store.set("canalRecordado", canal); await reloadPool(); } }
    avisoGuardado(data, n ? `Evento creado con ${n} jugador(es) ya inscritos. Comparte el enlace en el grupo` : "Evento creado. Comparte el enlace en el grupo");
  }));
  // lo escrito en los cuadros se guarda al momento (no se pierde si la pantalla se refresca)
  if ($("nLista")) $("nLista").oninput = () => {
    store.set("jugadoresIniciales", $("nLista").value);
    const n = cuantosIniciales(); if ($("crIniN")) $("crIniN").textContent = n ? `(${n})` : "(vacía)";
  };
  on("crIni", () => $("crIniBox").classList.toggle("hidden"));
  on("eSave", () => guard(async () => {
    const row = readPoolForm("e");
    if (!row.fecha || !row.titulo) { toast("Pon fecha y título"); return; }
    const data = await savePool(row, p.id);
    await guardarAdmins(data, "e", false);
    cloud.pool = data; cloud.pools = cloud.pools.map(x => x.id === data.id ? data : x);
    state.header = poolToHeader(data); save();
    avisoGuardado(data, "☁ Evento actualizado en la web");
  }));
}

window.telefonoDe = id => (cloud.telefonos || {})[id] || "";
window.editarTelefono = async (id, nombre) => {
  const actual = telefonoDe(id);
  const t = await pedirTexto(`📞 Teléfono de ${nombre}`, "Solo lo verán los administradores del evento. Déjalo vacío para quitarlo.", {si: "Guardar", valor: actual, tipo: "tel"});
  if (t === null) return;
  const r = await cloud.sb.rpc("poner_telefono", {p_id: id, p_tel: t});
  if (r.error) { toast(r.error.code === "PGRST202" ? "Falta ejecutar cambio_27_telefono_desde_manager.sql en Supabase" : "No se pudo guardar: " + cloudError(r.error)); return; }
  await loadInscritos(); toast(t.replace(/[^\d+]/g, "").length >= 6 ? `📞 Teléfono de ${nombre} guardado` : `Teléfono de ${nombre} quitado`);
};

/* ---------- avisos: reservas que han subido a la lista (los detecta la app Android, también con la app cerrada) ---------- */
function estadoAvisosHtml(){
  let e = null; try { e = window.Android && Android.estadoAvisos ? JSON.parse(Android.estadoAvisos() || "null") : null; } catch(x) { }
  if (!e) return "";
  const h = new Date(e.t).toLocaleString("es-ES", {day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"});
  return `<p class="help" style="text-align:center;font-size:11px;margin-top:4px">🔔 Avisos de reservas · última revisión ${esc(h)} · ${/^ok/.test(e.r) ? "✓" : "⚠ " + esc(e.r)}</p>`;
}
const getAvisos = () => { const a = store.get("avisos", []); return Array.isArray(a) ? a : []; };
const getAvisados = () => { const l = store.get("avisados", []); return new Set(Array.isArray(l) ? l : []); };
function avisosVigentes(poolId){
  const p = cloud.pool, l = getAvisos().filter(a => !poolId || a.pool === poolId);
  if (p && (!poolId || poolId === p.id)) {
    // los confirmados ya no necesitan aviso; los que la base de datos marca como «subió» y no están, se añaden
    const conf = new Set(cloud.inscritos.filter(i => i.confirmado).map(i => i.id)), ya = new Set(l.map(a => a.id));
    const sigue = new Set(cloud.inscritos.map(i => i.id));
    for (let k = l.length - 1; k >= 0; k--) if (l[k].pool === p.id && (conf.has(l[k].id) || !sigue.has(l[k].id))) l.splice(k, 1);
    cloud.inscritos.filter(i => i.subio && !i.confirmado && !ya.has(i.id)).forEach(i => l.push({pool: p.id, titulo: p.titulo, id: i.id, nombre: i.nombre, t: Date.now()}));
    // se quitan de la memoria los avisos ya resueltos de este evento
    const guardados = getAvisos(), limpios = guardados.filter(a => !(a.pool === p.id && (conf.has(a.id) || !sigue.has(a.id))));
    if (limpios.length !== guardados.length) store.set("avisos", limpios);
  }
  return l;
}
// Telegram: ventana de compartir con el mensaje ya escrito (se elige al jugador como destinatario)
function tgCompartir(msg, pool){
  const url = pool && pool.codigo ? poolUrl(pool) : WEB_URL;
  const texto = msg.split("\n").filter(l => !l.includes(url)).join("\n").trim();   // el enlace ya va aparte
  return "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(texto);
}
// Avisos descartados con la × (no vuelven a salir aunque la base de datos siga marcando «subió»)
const getDescartados = () => { const l = store.get("avisosDescartados", []); return new Set(Array.isArray(l) ? l : []); };
function avisosHtml(poolId){
  const desc = getDescartados(), l = avisosVigentes(poolId).filter(a => !desc.has(a.id)), avisados = getAvisados();
  if (!l.length) return "";
  return `<div class="card avisos">${l.map(a => {
    const delEvento = a.pool === (cloud.pool && cloud.pool.id), tel = delEvento ? telefonoDe(a.id) : "";
    const pool = (cloud.pools || []).find(x => x.id === a.pool) || cloud.pool || null;
    const msg = typeof rellenar === "function" && typeof plantilla === "function" ? rellenar(plantilla("subida"), a.nombre, pool) : "";
    const n = tel && typeof numeroInternacional === "function" ? numeroInternacional(tel) : "";
    const contacto = tel
      ? `<div class="avbtns">
           <a class="btn small" href="tel:+${esc(n)}">📞 ${esc(tel)}</a>
           <a class="btn small" href="https://wa.me/${esc(n)}?text=${encodeURIComponent(msg)}" data-wa="1">💬 WhatsApp</a>
           <a class="btn small" href="${esc(tgCompartir(msg, pool))}" data-wa="1">✈️ Telegram</a>
           <a class="tel" href="#" data-tel="${esc(tel)}" data-nombre="${esc(a.nombre)}" data-tipo="subida" data-pool="${esc(a.pool)}" data-id="${esc(a.id)}" style="align-self:center;font-size:12px">✏️ mensaje / más</a>
         </div>`
      : delEvento ? `<p class="avsin">⚠️ No hay teléfono de contacto para avisarle.</p>`
      : `<p class="avsin">Abre el evento para ver si dejó teléfono.</p>`;
    return `<div class="aviso">
      <div class="txt">⬆️ <b>${esc(a.nombre)}</b> ha pasado de reservas a la lista${poolId ? "" : ` de «${esc(a.titulo)}»`}. Avísale para confirmar que sabe que juega.</div>
      ${contacto}
      <div class="avbtns">
        ${avisados.has(a.id) ? `<span class="avok">📣 Avisado · esperando confirmación</span>` : `<button class="btn small" data-avisar="${esc(a.id)}">📣 Avisado</button>`}
        <button class="btn small primary" data-confirmar="${esc(a.id)}" data-pool="${esc(a.pool)}">✓ Confirmado</button>
        <button class="btn small ghost" data-avisado="${esc(a.id)}" title="Quitar aviso">✕ Quitar</button>
      </div></div>`; }).join("")}</div>`;
}
// Reserva que ha subido: etiqueta «Subió de reservas» y botón para marcarlo como confirmado (se guarda en la base de datos)
const subidos = () => { const l = store.get("subidos", []); return new Set(Array.isArray(l) ? l : []); };
window.estadoSubida = id => { const i = cloud.inscritos.find(x => x.id === id) || {}; return {subio: !!i.subio || subidos().has(id), conf: !!i.confirmado, avisado: getAvisados().has(id)}; };
window.confirmarReserva = (id, valor, poolId) => guard(async () => {
  const { error } = await cloud.sb.from("inscripciones").update({confirmado: valor}).eq("id", id);
  if (error) { toast(/confirmado/i.test(error.message || "") ? "Falta ejecutar cambio_16_confirmado.sql en Supabase" : "No se pudo guardar: " + cloudError(error)); return; }
  if (valor) store.set("avisos", getAvisos().filter(a => a.id !== id));
  if (!poolId || (cloud.pool && poolId === cloud.pool.id)) await loadInscritos();
  toast(valor ? "✓ Marcado como confirmado" : "Confirmación quitada");
  window.avisosActualizados();
});
function wireAvisos(){
  document.querySelectorAll("[data-confirmar]").forEach(b => b.onclick = () => confirmarReserva(b.dataset.confirmar, true, b.dataset.pool));
  document.querySelectorAll("[data-avisar]").forEach(b => b.onclick = () => {
    const s = getAvisados(); s.add(b.dataset.avisar); store.set("avisados", [...s].slice(-300));
    toast("📣 Marcado como avisado: el aviso se quitará cuando confirme en la web"); window.avisosActualizados();
  });
  document.querySelectorAll("[data-avisado]").forEach(b => b.onclick = () => {
    const d = getDescartados(); d.add(b.dataset.avisado); store.set("avisosDescartados", [...d].slice(-300));
    store.set("avisos", getAvisos().filter(a => a.id !== b.dataset.avisado));
    window.avisosActualizados();
  });
  // en la Manager web, WhatsApp se abre en otra pestaña
  document.querySelectorAll(".avisos [data-wa]").forEach(b => b.onclick = e => { if (!window.Android) { e.preventDefault(); window.open(b.href, "_blank", "noopener"); } });
}
window.avisosActualizados = () => {
  if (state.step === 0 && window.renderCloud) renderCloud();
  if (state.step === 2) renderPlayers();
};
// Quitar a un apuntado del evento (botón × de la pestaña Jugadores)
window.quitarInscrito = async id => {
  const i = cloud.inscritos.find(x => x.id === id); if (!i || !cloud.organizer) return;
  if (!await ask(`¿Quitar a ${i.nombre} del evento?`, "Quitar")) return;
  guard(async () => { const { error } = await cloud.sb.from("inscripciones").delete().eq("id", i.id); if (error) throw error; await loadInscritos(); toast(`${i.nombre} quitado`); });
};

// Al cambiar el tipo en la pestaña Sorteo se guarda también en el evento, para que la web lo muestre
window.guardarTipoCloud = async k => {
  const p = cloud.pool; if (!cloud.organizer || !p || p.tipo_sorteo === k) return;
  const r = await cloud.sb.from("pools").update({tipo_sorteo: k}).eq("id", p.id).select().single();
  if (r.error) { toast(/tipo_sorteo/i.test(r.error.message || "") ? "Falta ejecutar cambio_12_tipo_sorteo.sql en Supabase" : "No se pudo guardar el tipo en la web"); return; }
  cloud.pool = r.data; cloud.pools = cloud.pools.map(x => x.id === r.data.id ? r.data : x);
  toast("☁ Tipo de sorteo actualizado en la web");
};

/* ---------- paso 3: publicar la cabecera en la pool online ---------- */
window.renderCloudHeader = () => {
  const box = $("cloudHeader"); if (!box) return;
  const p = cloud.pool;
  if (!cloud.organizer || !p) { box.innerHTML = ""; return; }
  box.innerHTML = `<button class="btn primary" id="hPublish" style="width:100%">☁ Publicar esta cabecera en la web</button>
    <p class="help" style="margin-top:6px">Se actualiza «${esc(p.titulo)}». La 1.ª línea es el título; «HORARIO:» e «IMPORTE:» van a sus campos y el resto de líneas, a las notas.</p>`;
  $("hPublish").onclick = () => guard(async () => {
    const f = headerToFields(state.header);
    if (!f.titulo) { toast("La primera línea (título) está vacía"); return; }
    const data = await savePool({titulo: f.titulo, horario: f.horario, importe: f.importe, notas: f.notas || null}, p.id);
    cloud.pool = data; cloud.pools = cloud.pools.map(x => x.id === data.id ? data : x);
    window.renderCloudHeader(); avisoGuardado(data, "☁ Cabecera actualizada en la web");
  });
};

/* ---------- semana pasada automática: el último sorteo publicado antes de esta pool ---------- */
async function previousPool(){
  const p = cloud.pool; if (!cloud.organizer || !p) return null;
  const { data, error } = await cloud.sb.from("pools").select("id,titulo,fecha").neq("id", p.id)
    .lte("fecha", p.fecha).order("fecha", {ascending: false}).order("created_at", {ascending: false}).limit(10);
  if (error) throw error;
  if (!data.length) return null;
  const r = await cloud.sb.from("resultados").select("pool_id").in("pool_id", data.map(x => x.id));
  if (r.error) throw r.error;
  const con = new Set(r.data.map(x => x.pool_id));
  return data.find(x => con.has(x.id)) || null;
}
window.prepareCloudDraw = async () => {
  try {
    if (!cloud.organizer || !cloud.pool) return;
    const prev = await previousPool();
    if (!prev) { state.last = []; cloud.lastTitle = null; save(); return; }
    const { data: rs, error } = await cloud.sb.from("resultados").select("pista,pareja,nombre").eq("pool_id", prev.id).order("pista").order("pareja");
    if (error) throw error;
    const courts = [];
    rs.forEach(r => { const c = courts[r.pista - 1] ||= {pairs: [[], []]}; (c.pairs[r.pareja - 1] ||= []).push(r.nombre); });
    state.last = courts.filter(Boolean).map(c => ({pairs: c.pairs.map(pr => [pr[0] || "", pr[1] || ""])}));
    cloud.lastTitle = prev.titulo; save();
  } catch(e) { /* sin conexión: se usa el último sorteo anterior descargado */ }
};
window.renderLastInfo = async () => {
  const box = $("lastInfo"); if (!box) return;
  if (!cloud.organizer || !cloud.pool) { box.textContent = ""; return; }
  try {
    const prev = await previousPool();
    box.textContent = prev ? `Se evitará repetir parejas y pistas de «${prev.titulo}».` : "No hay un sorteo anterior publicado: no hay parejas ni pistas que evitar.";
  } catch(e) { box.textContent = ""; }
};

/* ---------- publicar el sorteo en la web ---------- */
window.onDrawn = async res => {
  const p = cloud.pool;
  if (!cloud.organizer || !p) return;
  if (!await sigoActivo()) { toast("No se ha publicado: tu usuario está abierto en otro móvil"); return; }
  const rows = [];
  res.courts.forEach((c, ci) => c.forEach((pr, pi) => pr.forEach(pl => { if (pl && pl.name) rows.push({pool_id: p.id, pista: ci + 1, pareja: pi + 1, nombre: pl.name, sexo: pl.g || null}); })));
  try {
    let r = await cloud.sb.from("resultados").delete().eq("pool_id", p.id); if (r.error) throw r.error;
    r = await cloud.sb.from("resultados").insert(rows); if (r.error) throw r.error;
    cloud.sorteado = true;
    // con el sorteo hecho la inscripción se cierra: solo se pueden apuntar reservas (si estaba cerrada, sigue cerrada)
    if (p.estado === "abierta") { r = await cloud.sb.from("pools").update({estado: "sorteada"}).eq("id", p.id); if (r.error) throw r.error; }
    await reloadPool();
    // el texto para WhatsApp («Compartir») lleva también el enlace a la web
    lastText += `\n\n🌐 Ver en la web 👉 ${poolUrl(p)}`;
    const lr = store.get("lastResult", null); if (lr) { lr.text = lastText; store.set("lastResult", lr); }
    toast(`☁ Sorteo publicado en la web. Pulsa «Compartir» para enviarlo por WhatsApp`);
  } catch(e) { toast("No se pudo publicar el sorteo: " + cloudError(e)); }
};

/* ---------- deshacer el sorteo: se borra de la web y la inscripción vuelve a como estaba ---------- */
window.undoCloudDraw = async () => {
  const p = cloud.pool;
  if (!cloud.organizer || !p) return true;   // sin evento online: solo se borra en el móvil
  if (!await sigoActivo()) { toast("No se ha deshecho: tu usuario está abierto en otro móvil"); return false; }
  try {
    let r = await cloud.sb.from("resultados").delete().eq("pool_id", p.id); if (r.error) throw r.error;
    if (p.estado === "sorteada") { r = await cloud.sb.from("pools").update({estado: "abierta"}).eq("id", p.id); if (r.error) throw r.error; }
    // los que se apuntaron como reserva después del sorteo vuelven a la cola normal, por orden de inscripción
    r = await cloud.sb.from("inscripciones").update({reserva: false}).eq("pool_id", p.id).eq("reserva", true);
    if (r.error && !/reserva/.test(r.error.message || "")) throw r.error;
    cloud.sorteado = false;
    await reloadPool();
    return true;
  } catch(e) { toast("No se pudo deshacer el sorteo: " + cloudError(e)); return false; }
};

/* ---------- semana pasada desde la nube (paso 1) ---------- */
window.renderCloudLast = async () => {
  const box = $("cloudLast"); if (!box) return;
  box.innerHTML = "";
  if (!cloud.organizer) return;
  // el último sorteo publicado que no sea el de la pool actual
  const { data } = await cloud.sb.from("pools").select("id,titulo,fecha").eq("estado", "sorteada").order("fecha", {ascending: false}).limit(2);
  const prev = (data || []).find(x => !cloud.pool || x.id !== cloud.pool.id) || null;
  if (!prev) return;
  const b = document.createElement("button");
  b.className = "btn saved"; b.innerHTML = `☁ Usar el sorteo publicado de ${esc(prev.titulo)}<small>Descarga las pistas y parejas desde la base de datos</small>`;
  b.onclick = async () => {
    const { data: rs, error } = await cloud.sb.from("resultados").select("pista,pareja,nombre").eq("pool_id", prev.id).order("pista").order("pareja");
    if (error) { toast(cloudError(error)); return; }
    const courts = [];
    rs.forEach(r => { const c = courts[r.pista - 1] ||= {pairs: [[], []]}; (c.pairs[r.pareja - 1] ||= []).push(r.nombre); });
    state.last = courts.filter(Boolean).map(c => ({pairs: c.pairs.map(pr => [pr[0] || "", pr[1] || ""])}));
    save(); renderCourts(); toast(`Cargado el sorteo de ${prev.titulo}`);
  };
  box.appendChild(b);
};

window.renderCloud = renderCloud;
// al volver a la app, comprobar que este móvil sigue siendo el activo
document.addEventListener("visibilitychange", () => { if (!document.hidden && cloud.organizer) sigoActivo().catch(() => {}); });
// Arranque con tiempo máximo: si no conecta en 15 s se muestra el motivo y un botón para reintentar
function cloudStart(){
  cloud.initError = null; cloud.ready = false;
  if (state.step === 0) $("cloudBox").innerHTML = `<div class="card">Conectando…</div>`;
  const limite = new Promise((_, rej) => setTimeout(() => rej(new Error("La conexión tarda demasiado (más de 15 s)")), 15000));
  Promise.race([cloudInit(), limite])
    .then(() => { cloud.ready = true; if (state.step === 0) renderCloud(); if (state.step === 1) window.renderCloudLast(); })
    .catch(e => { cloud.initError = cloudError(e); if (state.step === 0) renderCloud(); });
}
