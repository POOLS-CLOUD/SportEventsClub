// Idioma de la app: "es" (español) o "en" (inglés). Se elige con el botón ES · EN de la cabecera
// y se guarda en el móvil. (?lang=en en la dirección solo sirve para probarla en el navegador)
(function(){
  let v = null;
  try { const s = window.Android && Android.getItem ? Android.getItem("padel.lang") : localStorage.getItem("padel.lang"); v = s ? JSON.parse(s) : null; } catch (e) { }
  if (/[?&]lang=en/.test(location.search)) v = "en";
  window.APP_LANG = v === "en" ? "en" : "es";
})();
