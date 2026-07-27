/* ============================================================================
   Civik-ia — Bandeau de consentement cookies (CNIL / art. 82 loi I&L)
   ----------------------------------------------------------------------------
   - Google Tag Manager / Google Analytics 4 est BLOQUÉ tant que le visiteur
     n'a pas donné son consentement explicite (pas de chargement, pas de cookie).
   - « Refuser » est aussi simple et visible que « Accepter ».
   - Le choix est mémorisé (localStorage) ; un lien « Cookies » discret permet
     de revenir sur sa décision à tout moment (retrait aussi simple que l'accord).
   - Aucune dépendance externe, ~4 Ko, n'alourdit pas le site.
   ========================================================================== */
(function () {
  'use strict';

  var GTM_ID = 'GTM-55JF49WB';
  var KEY = 'civik-cookie-consent';        // 'granted' | 'denied'
  var KEY_DATE = 'civik-cookie-consent-date';
  var POLICY_URL = '/legal/politique-confidentialite.html';

  function readConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function writeConsent(value) {
    try {
      localStorage.setItem(KEY, value);
      localStorage.setItem(KEY_DATE, new Date().toISOString());
    } catch (e) { /* mode privé : non bloquant */ }
  }

  /* Charge GTM uniquement après consentement explicite */
  function loadGTM() {
    if (window.__civikGtmLoaded) return;
    window.__civikGtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = document.getElementsByTagName('script')[0];
    var j = document.createElement('script');
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    f.parentNode.insertBefore(j, f);
  }

  /* --- Styles (injectés une seule fois) --- */
  function injectStyles() {
    if (document.getElementById('cc-styles')) return;
    var css = ''
      + '.cc-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;'
      + 'max-width:680px;margin:0 auto;background:#fff;color:#1E1E1E;'
      + 'border:1px solid rgba(0,0,145,.12);border-radius:16px;'
      + 'box-shadow:0 12px 40px rgba(0,0,145,.18);padding:18px 20px;'
      + 'display:flex;flex-wrap:wrap;align-items:center;gap:14px 18px;'
      + 'font-family:inherit;font-size:14px;line-height:1.5;'
      + 'opacity:0;transform:translateY(12px);transition:opacity .3s ease,transform .3s ease;}'
      + '.cc-banner.cc-show{opacity:1;transform:translateY(0);}'
      + '.cc-text{flex:1 1 280px;min-width:240px;color:#333;}'
      + '.cc-text strong{color:#000091;font-weight:700;}'
      + '.cc-text a{color:#0E7C72;text-decoration:underline;font-weight:600;}'
      + '.cc-actions{display:flex;gap:10px;flex:0 0 auto;}'
      + '.cc-btn{appearance:none;border:0;cursor:pointer;border-radius:9999px;'
      + 'padding:11px 24px;font-size:14px;font-weight:600;font-family:inherit;'
      + 'transition:transform .12s ease,box-shadow .2s ease,background .2s ease;}'
      + '.cc-btn:hover{transform:translateY(-1px);}'
      + '.cc-refuse{background:#f1f1f4;color:#1E1E1E;border:1px solid rgba(0,0,0,.08);}'
      + '.cc-refuse:hover{background:#e7e7ee;}'
      + '.cc-accept{background:#000091;color:#fff;box-shadow:0 4px 14px rgba(0,0,145,.28);}'
      + '.cc-accept:hover{background:#0a0aa8;}'
      + '.cc-reopen{position:fixed;left:16px;bottom:16px;z-index:2147482000;'
      + 'background:#fff;color:#000091;border:1px solid rgba(0,0,145,.15);'
      + 'border-radius:9999px;padding:8px 14px;font-size:12.5px;font-weight:600;'
      + 'font-family:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.10);'
      + 'display:none;align-items:center;gap:6px;}'
      + '.cc-reopen:hover{border-color:#0E7C72;color:#0E7C72;}'
      + '@media (max-width:560px){.cc-banner{left:10px;right:10px;bottom:10px;padding:16px;}'
      + '.cc-actions{width:100%;}.cc-btn{flex:1;text-align:center;}}'
      + '@media (prefers-reduced-motion:reduce){.cc-banner{transition:none;}.cc-btn{transition:none;}}';
    var s = document.createElement('style');
    s.id = 'cc-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  var bannerEl = null, reopenEl = null;

  function showReopener() {
    if (reopenEl) { reopenEl.style.display = 'inline-flex'; return; }
    reopenEl = document.createElement('button');
    reopenEl.className = 'cc-reopen';
    reopenEl.type = 'button';
    reopenEl.setAttribute('aria-label', 'Gérer mes préférences cookies');
    reopenEl.textContent = 'Cookies';
    reopenEl.addEventListener('click', openBanner);
    document.body.appendChild(reopenEl);
    reopenEl.style.display = 'inline-flex';
  }

  function removeBanner() {
    if (!bannerEl) return;
    bannerEl.classList.remove('cc-show');
    var el = bannerEl;
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 320);
    bannerEl = null;
  }

  function decide(value) {
    writeConsent(value);
    if (value === 'granted') loadGTM();
    removeBanner();
    showReopener();
  }

  function openBanner() {
    if (bannerEl) return;
    injectStyles();
    bannerEl = document.createElement('div');
    bannerEl.className = 'cc-banner';
    bannerEl.setAttribute('role', 'dialog');
    bannerEl.setAttribute('aria-label', 'Gestion des cookies');
    bannerEl.setAttribute('aria-live', 'polite');
    bannerEl.innerHTML =
        '<div class="cc-text"><strong>Cookies et mesure d\u2019audience.</strong> '
      + 'Nous utilisons Google Analytics pour mesurer l\u2019audience du site et l\u2019am\u00e9liorer. '
      + 'Vous pouvez accepter ou refuser : le site fonctionne identiquement dans les deux cas. '
      + '<a href="' + POLICY_URL + '">En savoir plus</a>.</div>'
      + '<div class="cc-actions">'
      + '<button type="button" class="cc-btn cc-refuse">Refuser</button>'
      + '<button type="button" class="cc-btn cc-accept">Accepter</button>'
      + '</div>';
    document.body.appendChild(bannerEl);
    bannerEl.querySelector('.cc-refuse').addEventListener('click', function () { decide('denied'); });
    bannerEl.querySelector('.cc-accept').addEventListener('click', function () { decide('granted'); });
    requestAnimationFrame(function () { if (bannerEl) bannerEl.classList.add('cc-show'); });
  }

  function init() {
    var consent = readConsent();
    if (consent === 'granted') { loadGTM(); showReopener(); }
    else if (consent === 'denied') { showReopener(); }
    else { openBanner(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
