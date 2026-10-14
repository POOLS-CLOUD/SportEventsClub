/* =========================================================
   Idioma de la app. lang.js fija APP_LANG ("es" o "en").
   En inglés se traducen al vuelo los textos que aparecen en pantalla
   (y los que se copian o comparten), sin tocar el resto del código.
   ========================================================= */
"use strict";
(function(){
  if (window.APP_LANG !== "en") { window.trText = t => t; return; }

  // Textos fijos: español -> inglés
  const D = {
    "Introduce el PIN": "Enter your PIN",
    "MANAGER": "MANAGER",
    "🏠 Inicio": "🏠 Home", "Inicio": "Home",
    "⟲ Reset": "⟲ Reset",
    "Info evento": "Event info", "Jugadores": "Players", "Asignar pistas": "Assign courts",
    "☁ Evento online": "☁ Online event",
    "Crea el evento y comparte el enlace en WhatsApp: los jugadores se apuntan desde su móvil y aquí lo ves en directo.": "Create the event and share the link on WhatsApp: players sign up from their phone and you see it here live.",
    "Conectando…": "Connecting…",
    "Jugadores de la pool": "Players in the pool",
    "Son los apuntados en la web, por orden de inscripción. Marca si es hombre o mujer: la app lo recuerda para las siguientes pools. Para quitar a alguien, pulsa la ×.": "These are the players signed up on the web, in sign-up order. Mark each one as man or woman: the app remembers it for future pools. To remove someone, tap the ×.",
    "♂ Hombre": "♂ Man", "♀ Mujer": "♀ Woman",
    "♂ H": "♂ M", "♀ M": "♀ W",
    "Añadir": "Add", "Añadir lista": "Add list", "Pegar lista de nombres": "Paste a list of names",
    "Todavía no hay jugadores.": "No players yet.", "Vaciar lista": "Clear list", "Vaciar": "Clear",
    "El orden de la lista no influye: se baraja todo con aleatoriedad criptográfica antes de formar parejas y asignar pistas.": "The order of the list doesn't matter: everything is shuffled with cryptographic randomness before forming pairs and assigning courts.",
    "Asignación de pistas": "Court assignment",
    "🎾 Asignar pistas": "🎾 Assign courts",
    "📋 Copiar": "📋 Copy", "📤 Compartir": "📤 Share",
    "🎾 Repetir asignación": "🎾 Reassign courts",
    "✏️ Modificar parejas": "✏️ Edit pairs",
    "Cambia cualquier nombre (por ejemplo, una baja por un reserva) y pulsa guardar. Si hay pool online, las pistas se vuelven a publicar en la web.": "Change any name (for example, a dropout for a reserve) and tap save. If there is an online pool, the courts are published to the web again.",
    "💾 Guardar y publicar": "💾 Save and publish",
    "Cancelar": "Cancel", "Aceptar": "OK",
    "Comprobaciones": "Checks",
    "➡️ Empezar nueva semana con estas pistas": "➡️ Start a new week with these courts",
    "‹ Atrás": "‹ Back", "Siguiente ›": "Next ›",
    "Nombre del jugador": "Player name",
    "No se ha podido cargar la parte online.": "The online part could not be loaded.",
    "Error desconocido": "Unknown error", "Reintentar": "Retry",
    "Entendido": "Got it", "Repartir así": "Split like this",
    "Quitar del evento": "Remove from event",
    "Hacen falta al menos 4 jugadores para una pista.": "At least 4 players are needed for a court.",
    "Mixto": "Mixed", "chico + chica": "man + woman",
    "Masculino": "Men", "dos chicos": "two men",
    "Femenino": "Women", "dos chicas": "two women",
    "Aleatorio": "Random", "sin mirar el sexo": "ignoring gender",
    "🎲 Asignación aleatoria total: las parejas se forman sin mirar el sexo.": "🎲 Fully random assignment: pairs are formed ignoring gender.",
    "✅ Todas las parejas pueden ser chico + chica.": "✅ Every pair can be man + woman.",
    "👫 Evento de": "👫 Event with", "parejas fijas": "fixed pairs",
    ": se respetan las parejas tal como se apuntaron y solo se asignan las pistas.": ": pairs are kept as they signed up and only the courts are assigned.",
    "👫 Parejas fijas: se mantienen tal como se apuntaron": "👫 Fixed pairs: kept as they signed up",
    "Pistas asignadas al azar": "Courts assigned at random",
    "Ningún jugador repite pista de la semana pasada": "No player repeats last week's court",
    "Todos los jugadores aparecen exactamente una vez (ninguno falta ni está duplicado)": "Every player appears exactly once (none missing or duplicated)",
    "Todas las pistas tienen exactamente 2 parejas": "Every court has exactly 2 pairs",
    "Asignación de pistas: 🎲 aleatorio (sin mirar el sexo)": "Court assignment: 🎲 random (ignoring gender)",
    "Ninguna pareja repite de la semana pasada": "No pair repeats from last week",
    "Parejas y pistas asignadas al azar, sin seguir el orden de la lista": "Pairs and courts assigned at random, not following the list order",
    "No hay ningún jugador": "There are no players",
    "Parejas modificadas a mano después de asignar las pistas": "Pairs edited by hand after assigning courts",
    "Parejas guardadas": "Pairs saved",
    "Copiado ✅": "Copied ✅", "No se pudo copiar": "Could not copy",
    "Copiado ✅ (pégalo donde quieras)": "Copied ✅ (paste it wherever you like)",
    "No se pudo compartir": "Could not share",
    "Sí, resetear todo": "Yes, reset everything",
    "Borrar también la agenda de jugadores (el sexo recordado de cada nombre)": "Also delete the player address book (the remembered gender of each name)",
    "Falta ejecutar cambio_13_pin.sql en Supabase": "cambio_13_pin.sql still needs to be run in Supabase",
    "No se ha podido comprobar el PIN. Reintenta": "The PIN could not be checked. Try again",
    "Demasiados intentos. Espera 15 minutos": "Too many attempts. Wait 15 minutes",
    "PIN incorrecto": "Wrong PIN", "Comprobando…": "Checking…",
    "Sin conexión. Revisa internet y reintenta": "No connection. Check your internet and try again",
    "Inscripción abierta": "Registration open", "Inscripción cerrada": "Registration closed", "Sorteada": "Courts assigned",
    "🎾 Pádel": "🎾 Padel", "🎾 Tenis": "🎾 Tennis",
    "No hay clubes guardados: escribe uno y se guardará al crear el evento.": "No saved clubs: type one and it will be saved when you create the event.",
    "Quitar de la lista": "Remove from list",
    "Deporte": "Sport", "Fecha": "Date", "Título": "Title", "Horario": "Time", "Importe": "Price", "Club": "Club",
    "Nombre del club": "Club name",
    "Notas (opcional, se ven en la web)": "Notes (optional, shown on the web)",
    "Tipo de evento": "Event type",
    "Parejas fijas": "Fixed pairs",
    "(se apuntan por parejas y solo se asignan las pistas)": "(players sign up in pairs and only the courts are assigned)",
    "Pistas": "Courts", "Reservas": "Reserves",
    "Sí, eliminar": "Yes, remove", "No, siguiente hueco": "No, next free slot", "No, intercalar": "No, insert",
    "La lista y las reservas están completas: para intercalar hay que eliminar a alguien": "The list and reserves are full: to insert someone you must remove someone",
    "Email o contraseña incorrectos.": "Wrong email or password.",
    "Sin conexión a internet.": "No internet connection.",
    "Tu usuario no tiene permiso de organizador.": "Your user does not have organiser permission.",
    "Falta ejecutar cambios_pendientes.sql en Supabase.": "cambios_pendientes.sql still needs to be run in Supabase.",
    "Tu usuario se ha abierto en otro móvil": "Your user has been opened on another phone",
    "Ve a": "Go to",
    "y crea o elige un evento: los jugadores son los que se apuntan en la web.": "and create or choose an event: the players are those who sign up on the web.",
    "y crea o elige un evento: los jugadores son los que se apuntan en la web. Mientras, se muestra la última lista descargada.": "and create or choose an event: the players are those who sign up on the web. Meanwhile, the last downloaded list is shown.",
    "➕ Apuntar jugadores": "➕ Sign up players",
    "Uno por línea. Con número delante (p. ej. «3 Jose») entra en ese puesto y te pregunta si eliminar a quien está ahora o intercalarlo. Sin número, se apunta detrás de los que ya están (si la lista está llena, a reservas).": "One per line. With a number in front (e.g. “3 Jose”) they take that position and you're asked whether to remove whoever is there now or insert them. Without a number, they're added after the existing players (if the list is full, as reserves).",
    "Apuntar": "Sign up",
    "(no entran en la asignación de pistas)": "(not included in the court assignment)",
    "Escribe al menos un nombre": "Type at least one name",
    "Ya estaban todos apuntados (o no quedan plazas)": "They were all signed up already (or there are no places left)",
    "Pistas en la web": "Courts on the web",
    "🙈 Pistas ocultas en la web": "🙈 Courts hidden on the web",
    "👁 Pistas visibles en la web": "👁 Courts visible on the web",
    "Los jugadores no ven el resultado. Pulsa para mostrarlo.": "Players can't see the result. Tap to show it.",
    "Los jugadores ven el resultado en cuanto asignas las pistas. Pulsa para ocultarlo.": "Players see the result as soon as you assign the courts. Tap to hide it.",
    "👁 Las pistas ya se ven en la web": "👁 The courts are now visible on the web",
    "🙈 Las pistas quedan ocultas en la web": "🙈 The courts are now hidden on the web",
    "📋 Gestionar un evento activo": "📋 Manage an active event",
    "No hay eventos activos": "No active events",
    "＋ Crear un nuevo evento": "＋ Create a new event",
    "Fecha, horario, club, plazas y jugadores ya inscritos": "Date, time, club, places and players already signed up",
    "Salir": "Log out",
    "📋 Eventos activos": "📋 Active events",
    "Toca un evento para gestionarlo.": "Tap an event to manage it.",
    "‹ Menú": "‹ Menu",
    "No hay eventos activos.": "No active events.", "Crear uno": "Create one",
    "Eliminar": "Delete", "Evento eliminado": "Event deleted",
    "＋ Nuevo evento": "＋ New event",
    "Al crearlo se abre la inscripción y se publica en la web.": "When created, registration opens and it is published on the web.",
    "👥 Jugadores iniciales": "👥 Initial players", "(vacía)": "(empty)",
    "Uno por línea, con o sin número delante (sin número van al siguiente hueco libre). Al crear el evento quedan apuntados en este orden; los demás se apuntan después en la web. Se guarda para el próximo evento.": "One per line, with or without a number in front (without a number they go to the next free slot). When the event is created they are signed up in this order; everyone else signs up later on the web. It is saved for the next event.",
    "Crear y abrir inscripción": "Create and open registration",
    "Entra con tu usuario de organizador para gestionar los eventos.": "Log in with your organiser user to manage events.",
    "No se ha podido conectar.": "Could not connect.",
    "No se ha podido cargar la conexión online.": "The online connection could not be loaded.",
    "El usuario": "The user", "no está autorizado como organizador.": "is not authorised as an organiser.",
    "En Supabase, ejecuta la línea de": "In Supabase, run the line for", "con este email.": "with this email.",
    "📍 Evento": "📍 Event", "‹ Eventos activos": "‹ Active events",
    "🎾 Pistas asignadas": "🎾 Courts assigned", "Pistas asignadas · solo reservas": "Courts assigned · waiting list only",
    "🔒 Cerrar también reservas": "🔒 Close the waiting list too",
    "↩️ Deshacer asignación": "↩️ Undo court assignment", "Deshacer": "Undo", "↩️ Asignación deshecha": "↩️ Court assignment undone",
    "Asignando…": "Assigning…",
    "📞 Llamar": "📞 Call", "Actualizar": "Update", "Nueva versión": "New version", "disponible": "available", "Pulsa para guardar el nuevo orden": "Tap to save the new order", "Sí, guardar": "Yes, save",
    "Usa ▲ ▼ para mover parejas o la P para cambiar a un jugador de pareja": "Use ▲ ▼ to move pairs or the P to move a player to another pair",
    "🔀 Colocar chico ♂ izquierda · chica ♀ derecha": "🔀 Put man ♂ on the left · woman ♀ on the right", "🔗 Copiar enlace": "🔗 Copy link", "🔗 Enlace del evento copiado": "🔗 Event link copied", "Este evento no está publicado en la web": "This event is not published on the web", "✏️ Editar jugador": "✏️ Edit player", "✏️ Guardado": "✏️ Saved",
    "(solo lo ven los administradores; vacío para quitarlo)": "(only admins see it; leave empty to remove it)", "🔀 Corregir ahora (♂ izquierda, ♀ derecha)": "🔀 Fix now (♂ left, ♀ right)", "Apuntar así, lo corrijo yo después": "Sign them up like this, I'll fix it later",
    "🔀 Corregido: cada chico en ♂ y cada chica en ♀": "🔀 Fixed: every man on ♂ and every woman on ♀", "¿Qué hago?": "What should I do?", "Sí, apuntar en este orden": "Yes, sign them up in this order", "Sí, ponerlo": "Yes, place them", "Sí, reordenar": "Yes, reorder", "🔀 Reordenar parejas": "🔀 Reorder pairs", "🔀 Parejas reordenadas": "🔀 Pairs reordered",
    "Pulsa para guardar las parejas": "Tap to save the pairs", "Cambia la P de un jugador para moverlo de pareja": "Change a player's P to move them to another pair", "Sí, cambiar a mixto": "Yes, switch to mixed", "👫 Evento cambiado a mixto": "👫 Event switched to mixed", "Parejas de reserva": "Reserve pairs", "🔐 Asignación de pistas 100 % aleatoria (criptográfica)": "🔐 100% random court assignment (cryptographic)",
    "Sin marcar: por orden de inscripción (parejas 1 y 2 en la pista 1, 3 y 4 en la pista 2…). Marcada: se barajan las parejas y las pistas totalmente al azar.": "Unticked: by sign-up order (pairs 1 and 2 on court 1, 3 and 4 on court 2…). Ticked: pairs and courts are shuffled completely at random.",
    "🔐 Pistas asignadas 100 % al azar (criptográfico)": "🔐 Courts assigned 100% at random (cryptographic)",
    "Pistas por orden de inscripción: parejas 1 y 2 en la pista 1, 3 y 4 en la pista 2…": "Courts by sign-up order: pairs 1 and 2 on court 1, 3 and 4 on court 2…",
    "Cada pareja en su orden: primero quien se apuntó a la izquierda": "Each pair in its order: first whoever signed up on the left", "No disponible con parejas fijas": "Not available with fixed pairs", "🔄 Republicar en Telegram": "🔄 Republish on Telegram", "Republicar": "Republish",
    "🔄 Enviado: en unos segundos se actualiza el canal": "🔄 Sent: the channel will update in a few seconds", "🌐 Web de inscripción": "🌐 Sign-up website", "📋 Copiar enlace": "📋 Copy link", "🔗 Enlace guardado": "🔗 Link saved", "🔗 Cambiar enlace": "🔗 Change link", "🔗 Poner enlace": "🔗 Set link",
    "Sin enlace: no saldrá el botón «Seguir en Telegram» en la web": "No link: the “Follow on Telegram” button won't show on the web",
    "Ese enlace no es de Telegram (debe empezar por https://t.me/)": "That is not a Telegram link (it must start with https://t.me/)",
    "Pega el enlace de invitación del canal (Telegram → canal → Administrar canal → Enlaces de invitación). Déjalo vacío para quitarlo.": "Paste the channel invite link (Telegram → channel → Manage channel → Invite links). Leave it empty to remove it.", "Cada administrador solo verá los canales de Telegram que tenga asignados. Quítalos con × o añade otros con el desplegable.": "Each administrator will only see the Telegram channels assigned to them. Remove them with × or add others from the drop-down.", "Sin canales asignados.": "No channels assigned.", "＋ Añadir canal…": "＋ Add channel…", "Quitar canal": "Remove channel", "⚠️ No hay teléfono de contacto para avisarle.": "⚠️ There is no contact phone to let them know.",
    "Abre el evento para ver si dejó teléfono.": "Open the event to see if they left a phone number.", "✏️ mensaje / más": "✏️ message / more",
    "📣 Avisado · esperando confirmación": "📣 Notified · waiting for confirmation", "✕ Quitar": "✕ Dismiss",
    "Uno por línea. Con número delante (p. ej. «3 Jose») entra en ese puesto y te pregunta si eliminar a quien está ahora o intercalarlo. Sin número, se apunta detrás de los que ya están (si la lista está llena, a reservas). Puedes poner el teléfono al final: «Jose 600123456».": "One per line. With a number in front (e.g. “3 Jose”) they take that position and you're asked whether to remove whoever is there now or insert them. Without a number, they're added after the existing players (if the list is full, as reserves). You can add the phone number at the end: “Jose 600123456”.", "✏️ Cambiar teléfono": "✏️ Change phone",
    "Solo lo verán los administradores del evento. Déjalo vacío para quitarlo.": "Only the event administrators will see it. Leave it empty to remove it.",
    "Falta ejecutar cambio_27_telefono_desde_manager.sql en Supabase": "cambio_27_telefono_desde_manager.sql still needs to be run in Supabase",
    "Falta ejecutar cambio_27_telefono_desde_manager.sql en Supabase para guardar teléfonos": "cambio_27_telefono_desde_manager.sql still needs to be run in Supabase to save phone numbers", "👑 Panel del creador": "👑 Creator panel", "Administradores y canales de Telegram": "Administrators and Telegram channels",
    "Marca los canales de Telegram que podrá usar cada administrador al crear o editar sus eventos.": "Tick the Telegram channels each administrator can use when creating or editing their events.",
    "💾 Guardar canales": "💾 Save channels", "Todavía no hay canales vinculados.": "No channels linked yet.", "Cargando…": "Loading…",
    "Solo tú (y quien lo vinculó)": "Only you (and whoever linked it)", "👑 Modo creador: puedes gestionar todos los eventos": "👑 Creator mode: you can manage every event",
    "Ninguno. Se vinculan desde un evento con «📣 Telegram».": "None. Link them from an event with “📣 Telegram”.",
    "No hay más administradores registrados. Se crean en Supabase (Authentication → Users) y se les da acceso de organizador.": "No other administrators registered. Create them in Supabase (Authentication → Users) and give them organiser access.",
    "Falta ejecutar cambio_25_panel_creador.sql en Supabase": "cambio_25_panel_creador.sql still needs to be run in Supabase", "Quién puede usar este canal": "Who can use this channel", "Nadie más: solo tú.": "Nobody else: only you.",
    "Solo estos administradores verán el canal y podrán asignarlo a sus eventos (además de ti).": "Only these administrators will see the channel and be able to assign it to their events (as well as you).",
    "Falta ejecutar cambio_25_telegram_admins_canal.sql en Supabase": "cambio_25_telegram_admins_canal.sql still needs to be run in Supabase", "Mostrar contraseña": "Show password", "Ocultar contraseña": "Hide password", "🔁 Nueva semana": "🔁 Next week", "Crear": "Create", "📣 Telegram": "📣 Telegram", "📣 Canal de Telegram": "📣 Telegram channel",
    "(se publicarán las novedades del evento)": "(event updates will be posted there)", "Sin canal": "No channel", "＋ Vincular": "＋ Link",
    "📣 Vincular un canal de Telegram": "📣 Link a Telegram channel", "📋 Copiar código": "📋 Copy code", "📋 Código copiado": "📋 Code copied",
    "⏳ Esperando a que publiques el código…": "⏳ Waiting for you to post the code…", "Cerrar": "Close",
    "📣 Canal de Telegram del evento": "📣 Event Telegram channel", "Sin canal (no publicar en Telegram)": "No channel (don't post on Telegram)",
    "＋ Vincular un canal nuevo": "＋ Link a new channel", "Este evento ya no publica en Telegram": "This event no longer posts on Telegram",
    "Publica en el canal este código (caduca en 30 minutos):": "Post this code in the channel (it expires in 30 minutes):",
    "Falta ejecutar cambio_21_telegram.sql en Supabase": "cambio_21_telegram.sql still needs to be run in Supabase", "👥 Otros administradores": "👥 Other administrators",
    "(podrán ver y gestionar este evento)": "(they will be able to see and manage this event)",
    "Nadie más: solo tú gestionarás este evento.": "Nobody else: only you will manage this event.",
    "Escribe un email válido": "Enter a valid email", "Ese eres tú: ya puedes gestionarlo": "That's you: you can already manage it",
    "Falta ejecutar cambio_20_admins_por_evento.sql en Supabase": "cambio_20_admins_por_evento.sql still needs to be run in Supabase",
    "Este evento es de otro organizador y no figuras como administrador. Pídele que añada tu email en el evento.": "This event belongs to another organiser and you are not one of its administrators. Ask them to add your email to the event.", "‹ Volver a la web": "‹ Back to the website", "Desbloquear": "Unlock", "🔓 Desbloquear": "🔓 Unlock", "🔓 Evento desbloqueado": "🔓 Event unlocked",
    "Contraseña incorrecta": "Wrong password", "Guardar": "Save", "🔑 Contraseña del evento": "🔑 Event password",
    "Mínimo 4 caracteres": "At least 4 characters", "🔑 Cambiar contraseña": "🔑 Change password", "🔑 Poner contraseña": "🔑 Set password",
    "🔑 Contraseña del evento guardada": "🔑 Event password saved", "La contraseña debe tener al menos 4 caracteres": "The password must be at least 4 characters long",
    "Pon una contraseña para el evento (mínimo 4 caracteres)": "Set a password for the event (at least 4 characters)",
    "Escribe la contraseña del evento para poder gestionarlo.": "Enter the event password to manage it.",
    "Mínimo 4 caracteres. Otros organizadores la necesitarán para cambiar este evento.": "At least 4 characters. Other organisers will need it to change this event.",
    "Otros organizadores la necesitarán para cambiar o borrar este evento. Tú no tendrás que escribirla.": "Other organisers will need it to change or delete this event. You won't have to enter it.",
    "Este evento es de otro organizador y tiene contraseña. Escríbela para poder gestionarlo.": "This event belongs to another organiser and has a password. Enter it to manage the event.",
    "🔒 Desbloquea el evento en «Info evento»": "🔒 Unlock the event in “Event info”",
    "👑 Modo creador: puedes gestionar todos los eventos sin contraseña": "👑 Creator mode: you can manage every event without a password",
    "Falta ejecutar cambio_18_claves_y_creador.sql en Supabase": "cambio_18_claves_y_creador.sql still needs to be run in Supabase", "📣 Avisado": "📣 Notified", "✓ Ha confirmado asistencia": "✓ Attendance confirmed", "✓ Reserva confirmado": "✓ Reserve confirmed",
    "📣 Avisado · esperando a que confirme en la web": "📣 Notified · waiting for them to confirm on the web",
    "📣 Marcado como avisado: el aviso se quitará cuando confirme en la web": "📣 Marked as notified: the alert will go away when they confirm on the web",
    "⏳ Pendiente de confirmar": "⏳ Awaiting confirmation", "⏳ Pendiente de confirmar · 📣 avisado": "⏳ Awaiting confirmation · 📣 notified", "✓ Confirmado": "✓ Confirmed", "✓ Confirmar": "✓ Confirm", "⬆️ Subió de reservas": "⬆️ Moved up from reserves",
    "Quitar aviso": "Dismiss", "✓ Marcado como confirmado": "✓ Marked as confirmed", "Confirmación quitada": "Confirmation removed",
    "Falta ejecutar cambio_16_confirmado.sql en Supabase": "cambio_16_confirmado.sql still needs to be run in Supabase", "Mensaje para WhatsApp / Telegram": "Message for WhatsApp / Telegram",
    "✏️ Cambiar el mensaje predefinido": "✏️ Change the default message", "💾 Guardar mensaje": "💾 Save message",
    "Restaurar el original": "Restore the original", "💾 Mensaje predefinido guardado": "💾 Default message saved",
    "📋 Mensaje copiado: pégalo en el chat de Telegram": "📋 Message copied: paste it into the Telegram chat",
    "Se rellenan solos: {nombre} {evento} {fecha} {horario} {club} {enlace}": "Filled in automatically: {nombre} (name) {evento} (event) {fecha} (date) {horario} (time) {club} {enlace} (link)", "✓ Avisado": "✓ Notified", "Sin teléfono: avísale por el grupo.": "No phone: let them know through the group.",
    ". Avísale para confirmar que sabe que juega.": ". Let them know to confirm they know they're playing.",
    "ha pasado de reservas a la lista": "has moved up from the waiting list to the list",
    "No se ha deshecho: tu usuario está abierto en otro móvil": "Not undone: your user is open on another phone", "🟢 Completa": "🟢 Full",
    "📤 Compartir enlace": "📤 Share link",
    "🔒 Cerrar inscripción": "🔒 Close registration",
    "🔓 Reabrir inscripción": "🔓 Reopen registration", "🔓 Abrir inscripción": "🔓 Open registration",
    "✏️ Editar datos evento": "✏️ Edit event details", "🗑 Borrar": "🗑 Delete",
    "💾 Guardar y publicar en la web": "💾 Save and publish on the web",
    "No hay ningún evento creado.": "No events created yet.", "Crea el primero aquí abajo.": "Create the first one below.",
    "Entrar como organizador": "Log in as organiser",
    "Usa el email y la contraseña del usuario que creaste en Supabase. Solo hay que hacerlo una vez: la sesión queda guardada en el móvil.": "Use the email and password of the user you created in Supabase. You only need to do it once: the session stays saved on the phone.",
    "Tu usuario se ha abierto en otro móvil y este se ha desconectado. Si eras tú, vuelve a entrar: el otro móvil quedará desconectado.": "Your user was opened on another phone and this one has been disconnected. If it was you, log in again: the other phone will be disconnected.",
    "Email": "Email", "Contraseña": "Password", "Entrar": "Log in",
    "Escribe email y contraseña": "Enter email and password",
    "Enlace copiado": "Link copied",
    "Reabrir": "Reopen",
    "Pon fecha y título": "Enter a date and title",
    "Evento creado. Comparte el enlace en el grupo": "Event created. Share the link in the group",
    "☁ Evento actualizado en la web": "☁ Event updated on the web",
    "Quitar": "Remove",
    "Falta ejecutar cambio_12_tipo_sorteo.sql en Supabase": "cambio_12_tipo_sorteo.sql still needs to be run in Supabase",
    "No se pudo guardar el tipo en la web": "The court assignment type could not be saved on the web",
    "☁ Asignación de pistas actualizada en la web": "☁ Court assignment updated on the web",
    "No hay una asignación de pistas anterior publicada: no hay parejas ni pistas que evitar.": "There is no previous published court assignment: no pairs or courts to avoid.",
    "No se ha publicado: tu usuario está abierto en otro móvil": "Not published: your user is open on another phone",
    "☁ Pistas publicadas en la web. Pulsa «Compartir» para enviarlo por WhatsApp": "☁ Courts published on the web. Tap “Share” to send it on WhatsApp",
    "No se pudieron publicar las pistas:": "The courts could not be published:",
    "Descarga las pistas y parejas desde la base de datos": "Downloads the courts and pairs from the database",
    "La conexión tarda demasiado (más de 15 s)": "The connection is taking too long (more than 15 s)",
    "Inscripción cerrada.": "Registration closed.", "Inscripción abierta.": "Registration open.",
    "Eventos pasados": "Past events",
  };

  // Textos con datos variables (expresiones regulares sobre el texto completo o la línea)
  const DIAS = {DOMINGO: "SUNDAY", LUNES: "MONDAY", MARTES: "TUESDAY", "MIÉRCOLES": "WEDNESDAY", JUEVES: "THURSDAY", VIERNES: "FRIDAY", "SÁBADO": "SATURDAY"};
  const MODO = {chicos: "men", chicas: "women", masculina: "Men's", femenina: "Women's", mixto: "mixed", aleatorio: "random"};
  const R = [
    [/^POOL DEL (DOMINGO|LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO)$/, (m, d) => DIAS[d] + " POOL"],
    [/^HORARIO:\s*(.*)$/, "TIME: $1"], [/^IMPORTE:\s*(.*)$/, "PRICE: $1"],
    [/^(.*)€ PERSONA$/i, "$1€ PER PERSON"],
    [/^🎾 PISTA (\d+)$/, "🎾 COURT $1"],
    [/^(.+) Pareja (\d+): (.+) \(sin pareja\)$/, "$1 Pair $2: $3 (no partner)"],
    [/^(👫|👬|👭|👤) Pareja (\d+): (.+)$/, "$1 Pair $2: $3"],
    [/^🎾 Pista (\d+)$/, "🎾 Court $1"], [/^Pareja (\d+)$/, "Pair $1"], [/^Pista (\d+)$/, "Court $1"],
    [/^⏳ Sin pista \(por orden de inscripción\): (.+)$/, "⏳ No court (by sign-up order): $1"],
    [/^⚠️ Excepción: (.+)$/, (m, e) => "⚠️ Exception: " + tr(e)],
    [/^🎾 Apúntate aquí 👉 (.+)$/, "🎾 Sign up here 👉 $1"],
    [/^🌐 Ver en la web 👉 (.+)$/, "🌐 See it on the web 👉 $1"],
    [/^(\d+) jugador\(es\) añadidos$/, "$1 player(s) added"],
    [/^(\d+) jugador\(es\) añadidos · (\d+) línea\(s\) sin número ignoradas$/, "$1 player(s) added · $2 line(s) without a number ignored"],
    [/^(\d+) jugador\(es\) apuntados$/, "$1 player(s) signed up"],
    [/^(\d+) jugadores$/, "$1 players"], [/^(\d+) pista\(s\)$/, "$1 court(s)"],
    [/^(\d+) \/ (\d+) jugadores$/, "$1 / $2 players"],
    [/^(\d+) en reservas$/, "$1 in reserve"], [/^(\d+) sin marcar$/, "$1 not marked"],
    [/^\((\d+) plazas\)$/, "($1 places)"],
    [/^(\d+) eventos? activos?$/, (m, n) => n + (n === "1" ? " active event" : " active events")],
    [/^Eventos pasados \((\d+)\)$/, "Past events ($1)"],
    [/^↪ Continuar con «(.+)»$/, "↪ Continue with “$1”"],
    [/^Conectado como (.*) ·$/, "Logged in as $1 ·"],
    [/^📅 (.+) · (\d+)\/(\d+) apuntados$/, "📅 $1 · $2/$3 signed up"],
    [/^(.*) · código (\w+)$/, (m, a, c) => a.split(" · ").map(tr).join(" · ") + " · code " + c],
    [/^: (\d+) de (\d+) plazas(?: · (\d+) en reservas \(no entran\))?\. Se actualiza solo\.$/, (m, a, b, r) => `: ${a} of ${b} places${r ? ` · ${r} in reserve (not included)` : ""}. Updates automatically.`],
    [/^: se respetan las parejas; solo se asignan las pistas\.$/, ": pairs are kept; only the courts are assigned."],
    [/^«(.+)» ya está en la lista$/, "“$1” is already on the list"],
    [/^Cambiado a (.+) \((mujer|hombre), según la agenda\)$/, (m, n, g) => `Changed to ${n} (${g === "mujer" ? "woman" : "man"}, from the address book)`],
    [/^Cambiado a (.+)$/, "Changed to $1"],
    [/^Solo se asignan pistas completas: entran los (\d+) primeros por orden\. Quedan fuera: (.+)\.$/, "Only full courts are assigned: the first $1 by order are in. Left out: $2."],
    [/^Hay (\d+) chicos y (\d+) chicas: (\d+) pareja\(s\) serán del mismo sexo\.$/, "There are $1 men and $2 women: $3 pair(s) will be same-gender."],
    [/^✅ Todas las parejas pueden ser de dos (chicos|chicas)\.$/, (m, g) => `✅ Every pair can be two ${g === "chicos" ? "men" : "women"}.`],
    [/^Asignación (\w+), pero hay (\d+) (chicas|chicos): se emparejarán entre ellos( y saldrá 1 pareja mixta)?\.$/, (m, mo, n, s, x) => `${MODO[mo] || mo} assignment, but there are ${n} ${s === "chicas" ? "women" : "men"}: they will be paired together${x ? " and there will be 1 mixed pair" : ""}.`],
    [/^Marca H o M en «Jugadores» de: (.+)\.$/, "Mark M (man) or W (woman) in “Players” for: $1."],
    [/^Marca H o M de cada jugador en la pestaña «Jugadores» para poder asignar pistas\. La app lo recordará para las siguientes pools\.$/, "Mark each player as man or woman in the “Players” tab to be able to assign courts. The app will remember it for future pools."],
    [/^Hacen falta al menos 4 apuntados en el evento \(ver pestaña Evento\)\.$/, "At least 4 players need to be signed up for the event."],
    [/^Jugadores que repiten pista \(inevitable\): (\d+)$/, "Players repeating a court (unavoidable): $1"],
    [/^Jugadores que repiten la pista de la semana pasada: (\d+)$/, "Players repeating last week's court: $1"],
    [/^Solo pistas completas: sin pista (.+)$/, "Only full courts: no court for $1"],
    [/^Asignación de pistas (.+): (\d+) de (\d+) parejas posibles de (.+)$/, (m, t, a, b, d) => `Court assignment ${tr(t)}: ${a} of ${b} possible pairs of ${tr(d)}`],
    [/^Parejas repetidas inevitables: (\d+)$/, "Unavoidable repeated pairs: $1"],
    [/^Solo pistas completas: entran los (\d+) primeros por orden de inscripción; sin pista: (.+)$/, "Only full courts: the first $1 by sign-up order are in; no court: $2"],
    [/^hay (\d+) jugadores \(número impar\): (.+) queda sin pareja\.$/, "there are $1 players (odd number): $2 has no partner."],
    [/^(\d+) jugadores no es múltiplo de 4: la Pista (\d+) no tiene 2 parejas completas\.$/, "$1 players is not a multiple of 4: Court $2 does not have 2 full pairs."],
    [/^hay (\d+) hombres y (\d+) mujeres, así que (\d+) pareja\(s\) son del mismo sexo\.$/, "there are $1 men and $2 women, so $3 pair(s) are same-gender."],
    [/^asignación masculina con (\d+) chica\(s\): se han emparejado entre ellas( \(1 pareja mixta\))?\.$/, (m, n, x) => `men's assignment with ${n} woman/women: they were paired together${x ? " (1 mixed pair)" : ""}.`],
    [/^asignación femenina con (\d+) chico\(s\): se han emparejado entre ellos( \(1 pareja mixta\))?\.$/, (m, n, x) => `women's assignment with ${n} man/men: they were paired together${x ? " (1 mixed pair)" : ""}.`],
    [/^no ha sido posible evitar repetir pareja: (.+)\.$/, "it was not possible to avoid repeating pairs: $1."],
    [/^no ha sido posible evitar que repitan pista: (.+)\.$/, "it was not possible to avoid repeated courts: $1."],
    [/^«(.+)» aparece dos veces$/, "“$1” appears twice"],
    [/^Sin sexo guardado \(se toma como hombre\): (.+)$/, "No saved gender (taken as man): $1"],
    [/^(\d+) pista\(s\) no tienen 2 parejas completas$/, "$1 court(s) do not have 2 full pairs"],
    [/^Guardado sin (.+): falta ejecutar en Supabase (.+)$/, "Saved without $1: you still need to run $2 in Supabase"],
    [/^(.+) ya estaba apuntado$/, "$1 was already signed up"],
    [/^(.+) quitado$/, "$1 removed"],
    [/^¿Quitar a (.+) del evento\?$/, "Remove $1 from the event?"],
    [/^Sí, eliminar a (.+)$/, "Yes, remove $1"],
    [/^☁ Recuperado el sexo de (\d+) jugador\(es\)$/, "☁ Recovered the gender of $1 player(s)"],
    [/^Evento creado con (\d+) jugador\(es\) ya inscritos\. Comparte el enlace en el grupo$/, "Event created with $1 player(s) already signed up. Share the link in the group"],
    [/^Se evitará repetir parejas y pistas de «(.+)»\.$/, "Pairs and courts from “$1” will be avoided."],
    [/^☁ Usar las pistas publicadas de (.+)$/, "☁ Use the published courts from $1"],
    [/^Cargadas las pistas de (.+)$/, "Loaded the courts from $1"],
    [/^Plazas$/, "Places"],
    [/^👁 Las pistas ya se ven en la web y en Telegram$/, "👁 The courts are now visible on the web and on Telegram"],
    [/^🙈 Las pistas quedan ocultas en la web y en Telegram$/, "🙈 The courts are now hidden on the web and on Telegram"],
    [/^Ya hay un evento con ese nombre, ese día y a esa hora\. Cambia la hora o el nombre\.$/, "There is already an event with that name, on that day and at that time. Change the time or the name."],
    [/^🎾 Próximas competiciones: elige la tuya y apúntate 👉 (.+)$/, "🎾 Upcoming competitions: pick yours and sign up 👉 $1"],
    [/^📞 Teléfono de (.+) guardado$/, "📞 $1's phone saved"],
    [/^Teléfono de (.+) quitado$/, "$1's phone removed"],
    [/^📞 Teléfono de (.+)$/, "📞 $1's phone"],
    [/^Administradores \((\d+)\)$/, "Administrators ($1)"],
    [/^Canales de Telegram \((\d+)\)$/, "Telegram channels ($1)"],
    [/^(\d+) evento\(s\) · último acceso: (.+)$/, (m, n, f) => `${n} event(s) · last login: ${f === "nunca" ? "never" : f}`],
    [/^Lo pueden usar: (.+)$/, "Can use it: $1"],
    [/^👥 ¿Quién puede usar «(.+)»\?$/, "👥 Who can use “$1”?"],
    [/^👥 Guardado: (.+) (?:puede|pueden) usar «(.+)»$/, "👥 Saved: $1 can use “$2”"],
    [/^🔁 ¿Crear el evento de la semana siguiente\?$/, "🔁 Create next week's event?"],
    [/^Mismos datos, administradores y canal de Telegram\. La lista empieza vacía y con la inscripción abierta\. Este evento se queda como historial\.$/, "Same details, administrators and Telegram channel. The list starts empty with registration open. This event stays as history."],
    [/^Apuntar ya a los jugadores iniciales \((\d+)\)$/, "Sign up the initial players now ($1)"],
    [/^🔁 Evento del (.+) creado(.*)$/, "🔁 Event for $1 created$2"],
    [/^📣 Telegram: (.+)$/, "📣 Telegram: $1"],
    [/^✅ Canal «(.+)» vinculado$/, "✅ Channel “$1” linked"],
    [/^📣 Las novedades se publicarán en «(.+)»$/, "📣 Updates will be posted in “$1”"],
    [/^No se pudo crear el código: (.*)$/, "The code could not be created: $1"],
    [/^Aviso: (.+) aún no (?:es organizador|son organizadores)\. .*$/, "Note: $1 is not an organiser yet. They will be able to manage it once they have an account."],
    [/^No se pudieron guardar los administradores: (.*)$/, "The administrators could not be saved: $1"],
    [/^🔒 «(.+)» tiene contraseña$/, "🔒 “$1” has a password"],
    [/^🔑 Contraseña de «(.+)»$/, "🔑 Password for “$1”"],
    [/^No se pudo guardar la contraseña: (.*)$/, "Could not save the password: $1"],
    [/^No se pudo comprobar: (.*)$/, "Could not check: $1"],
    [/^⬆️ (.+) ha pasado de reservas a la lista$/, "⬆️ $1 has moved up from the waiting list to the list"],
    [/^¿Quitar la confirmación de (.+)\?$/, "Remove the confirmation for $1?"],
    [/^No se pudo guardar: (.*)$/, "Could not save: $1"],
    [/^ha pasado de reservas a la lista de «(.+)»\. Avísale para confirmar que sabe que juega\.$/, "has moved up from the waiting list to the list of “$1”. Let them know to confirm they know they're playing."],
    [/^ha pasado de reservas a la lista\. Avísale para confirmar que sabe que juega\.$/, "has moved up from the waiting list to the list. Let them know to confirm they know they're playing."],
    [/^No se pudo deshacer la asignación de pistas: (.*)$/, "The court assignment could not be undone: $1"],
  ];
  // Mensajes largos de confirmación (varias líneas): se traducen por párrafos
  const P = [
    [/^¿Quieres eliminar el evento «(.+)»(?: \((.+)\))?\?$/, (m, t, f) => `Do you want to delete the event “${t}”${f ? ` (${f})` : ""}?`],
    [/^Se borrarán también sus apuntados y sus pistas asignadas, y desaparecerá de la web\. No se puede deshacer\.$/, "Its sign-ups and courts will also be deleted, and it will disappear from the web. This cannot be undone."],
    [/^El hueco (\d+) \((.+)\) lo ocupa (.+)\.$/, (m, n, s, o) => `Slot ${n} (${s.replace(/^pareja de reserva (\d+)$/, "reserve pair $1").replace(/^pareja (\d+)$/, "pair $1")}) is taken by ${o}.`],
    [/^¿Quieres eliminar a (.+) y poner a (.+) en su lugar\?$/, "Do you want to remove $1 and put $2 in their place?"],
    [/^Si no, (.+) irá al siguiente hueco libre\.$/, "If not, $1 will go to the next free slot."],
    [/^En el puesto (\d+) está (.+)\.$/, "Position $1 is taken by $2."],
    [/^Si eliges «No, intercalar», (.+) entra en el puesto (\d+) y (.+) pasa al (\d+) \(los demás bajan un puesto\)\.$/, "If you choose “No, insert”, $1 takes position $2 and $3 moves to $4 (everyone else moves down one place)."],
    [/^Se reabre la inscripción: los jugadores podrán borrarse y apuntarse otra vez \(también como reservas\) desde la web\.$/, "Registration reopens: players will be able to remove themselves and sign up again (also as reserves) on the web."],
    [/^Las pistas publicadas se mantienen tal cual\. Si hay cambios, vuelve a asignar pistas o usa «Modificar parejas» y se publicará de nuevo\.$/, "The published courts stay as they are. If there are changes, assign courts again or use “Edit pairs” and it will be published again."],
    [/^⚠️ Vas a RESETEAR TODOS LOS DATOS DE LA APLICACIÓN en este móvil\.$/, "⚠️ You are about to RESET ALL THE APP DATA on this phone."],
    [/^Se borrará:$/, "This will delete:"],
    [/^¿Deshacer la asignación de pistas\?$/, "Undo the court assignment?"],
    [/^Se borra el resultado, también de la web, y la inscripción vuelve a quedar abierta como antes de asignar las pistas\.$/, "The result is deleted, also from the web, and registration is open again as it was before assigning courts."],
    [/^• la lista de jugadores y la última asignación de pistas$/, "• the player list and the last court assignment"],
    [/^• la cabecera y los ajustes guardados$/, "• the header and saved settings"],
    [/^• la lista de jugadores iniciales y los clubes memorizados$/, "• the initial players list and the saved clubs"],
    [/^• tu sesión de organizador \(tendrás que volver a entrar\)$/, "• your organiser session (you will have to log in again)"],
    [/^Los eventos publicados en la web NO se borran\.$/, "Events published on the web are NOT deleted."],
    [/^¿Seguro que quieres resetear\? No se puede deshacer\.$/, "Are you sure you want to reset? This cannot be undone."],
  ];

  function tr(t){
    if (!t) return t;
    const k = t.trim();
    if (!k) return t;
    let out = null;
    if (Object.prototype.hasOwnProperty.call(D, k)) out = D[k];
    else for (const [re, rep] of R.concat(P)) { if (re.test(k)) { out = k.replace(re, rep); break; } }
    if (out === null) {   // con icono de estado delante («✅ …», «⚠️ …»)
      const m = k.match(/^(✅|⚠️) (.+)$/s);
      if (m) { const r = tr(m[2]); if (r !== m[2]) out = m[1] + " " + r; }
    }
    if (out === null) return t;
    const lead = t.match(/^\s*/)[0], trail = t.match(/\s*$/)[0];
    return lead + out + trail;
  }
  // Texto de varias líneas (sorteo, mensajes): línea a línea
  function trText(t){
    if (typeof t !== "string") return t;
    return t.includes("\n") ? t.split("\n").map(tr).join("\n") : tr(t);
  }
  window.trText = trText;

  const SKIP = {SCRIPT: 1, STYLE: 1, TEXTAREA: 1};
  function trNode(n){
    if (n.nodeType === 3) {
      if (n.parentNode && SKIP[n.parentNode.nodeName]) return;
      const v = trText(n.data); if (v !== n.data) n.data = v;
    } else if (n.nodeType === 1) {
      if (SKIP[n.nodeName]) return;
      for (const a of ["placeholder", "title", "aria-label"]) { const v = n.getAttribute(a); if (v) { const w = trText(v); if (w !== v) n.setAttribute(a, w); } }
      if (n.nodeName === "INPUT" && (n.type === "button" || n.type === "submit") && n.value) n.value = trText(n.value);
      for (const c of n.childNodes) trNode(c);
    }
  }
  function start(){
    document.documentElement.lang = "en";
    document.title = trText(document.title);
    trNode(document.body);
    new MutationObserver(ms => ms.forEach(m => {
      if (m.type === "characterData") trNode(m.target);
      else if (m.type === "attributes") trNode(m.target.nodeType === 1 ? m.target : m.target.parentNode);
      else m.addedNodes.forEach(trNode);
    })).observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"]});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  // Fechas en formato inglés
  const tld = Date.prototype.toLocaleDateString;
  Date.prototype.toLocaleDateString = function(loc, o){ return tld.call(this, loc === "es-ES" ? "en-GB" : loc, o); };

  // Lo que se copia o comparte (sorteo, enlace) también en inglés
  const A = window.Android;
  if (A) {
    const w = {};
    ["getItem", "setItem", "removeItem", "clearAll", "version", "revisarAvisos", "notificar", "estadoAvisos"].forEach(k => { if (A[k]) w[k] = (...a) => A[k](...a); });
    if (A.copy) w.copy = t => A.copy(trText(t));
    if (A.share) w.share = t => A.share(trText(t));
    try { window.Android = w; } catch (e) { }
  }
})();
