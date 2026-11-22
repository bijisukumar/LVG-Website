/* ============================================================
   PRICE CHAT — "Get a price" bubble
   A short guided chat: dates → guests → contact → approximate price.
   Prices and availability come from the same booking-system calls as
   estimate.html, so the two never disagree:
     getPublicEstimate  - every price check, logged with the visitor's
                          location (stayvibe_web_leads), even if they leave
     submitQuoteRequest - name / phone / email → an enquiry + owner email
   Include with: <script src="js/price-chat.js" defer></script>
   ============================================================ */
(function () {
  'use strict';
  if (window.__lvgPriceChat) return;
  window.__lvgPriceChat = true;

  var API_BASE = 'https://dwarka.stayvibe360.com/api';
  var WA_NUMBER = '918547141401';
  var MAX_GUESTS = 16;

  var css = '' +
    '.pc-launch{position:fixed;left:20px;bottom:26px;z-index:750;display:flex;align-items:center;gap:8px;padding:13px 20px;border:1.5px solid #D4A017;border-radius:9999px;background:#1A1A1A;color:#F0D080;font:600 .9rem Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.35);transition:transform .2s,background .2s}' +
    '.pc-launch:hover{background:#2A2A2A;transform:translateY(-2px)}' +
    '.pc-panel{position:fixed;left:20px;bottom:26px;z-index:760;width:360px;max-width:calc(100vw - 32px);height:540px;max-height:calc(100vh - 52px);display:none;flex-direction:column;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.25);font-family:Inter,system-ui,sans-serif;color:#1C1917}' +
    '.pc-panel.open{display:flex;animation:pcIn .22s ease}' +
    '@keyframes pcIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}' +
    '.pc-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#1A1A1A;color:#fff}' +
    '.pc-head-ico{width:34px;height:34px;border-radius:50%;background:#D97706;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}' +
    '.pc-head-t{font-weight:700;font-size:.92rem;line-height:1.2}' +
    '.pc-head-s{font-size:.74rem;color:rgba(255,255,255,.6)}' +
    '.pc-x{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.75);font-size:1.4rem;cursor:pointer;width:40px;height:40px;line-height:1}' +
    '.pc-body{flex:1;overflow-y:auto;padding:16px;background:#F5F4F0;display:flex;flex-direction:column;gap:10px}' +
    '.pc-msg{max-width:86%;padding:10px 13px;border-radius:14px;font-size:.9rem;line-height:1.5}' +
    '.pc-bot{background:#fff;border-top-left-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.07);align-self:flex-start}' +
    '.pc-me{background:#D97706;color:#fff;border-top-right-radius:4px;align-self:flex-end}' +
    '.pc-price{font-size:1.9rem;font-weight:800;color:#B45309;display:block;margin:6px 0 0;line-height:1.15}' +
    '.pc-price small{font-size:.9rem;font-weight:700;color:#78716C}' +
    '.pc-total{display:block;font-size:.95rem;margin-top:4px}' +
    '.pc-small{font-size:.78rem;color:#78716C;display:block;margin-top:4px}' +
    '.pc-foot{padding:12px 14px;border-top:1px solid #E7E5E4;background:#fff}' +
    '.pc-chips{display:flex;flex-wrap:wrap;gap:8px}' +
    '.pc-chip{padding:10px 14px;min-height:42px;border-radius:9999px;border:1.5px solid #D97706;background:#fff;color:#B45309;font:600 .85rem Inter,system-ui,sans-serif;cursor:pointer}' +
    '.pc-chip:hover{background:#FEF3C7}' +
    '.pc-chip.solid{background:#D97706;color:#fff}' +
    '.pc-chip.wa{background:#25D366;border-color:#25D366;color:#fff}' +
    '.pc-row{display:flex;gap:8px;align-items:center}' +
    '.pc-date{flex:1;min-width:0;padding:11px 12px;border:1.5px solid #E7E5E4;border-radius:10px;font:16px Inter,system-ui,sans-serif;color:#1C1917;background:#fff}' +
    '.pc-step{display:flex;align-items:center;gap:14px}' +
    '.pc-step button{width:44px;height:44px;border-radius:50%;border:1.5px solid #D97706;background:#fff;color:#B45309;font-size:1.3rem;cursor:pointer}' +
    '.pc-step span{font-size:1.3rem;font-weight:700;min-width:28px;text-align:center}' +
    '.pc-form{display:flex;flex-direction:column;gap:8px}' +
    '.pc-form .pc-date{flex:none;width:100%;box-sizing:border-box}' +
    '.pc-err{font-size:.78rem;color:#B91C1C;display:none}' +
    '.pc-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
    '.pc-note{font-size:.72rem;color:#A8A29E;text-align:center;margin-top:8px}' +
    '.pc-dots span{display:inline-block;width:7px;height:7px;margin:0 2px;border-radius:50%;background:#A8A29E;animation:pcDot 1s infinite}' +
    '.pc-dots span:nth-child(2){animation-delay:.15s}.pc-dots span:nth-child(3){animation-delay:.3s}' +
    '@keyframes pcDot{0%,100%{opacity:.3}50%{opacity:1}}' +
    '@media(max-width:640px){.pc-launch{left:16px;bottom:26px;padding:10px 15px;font-size:.84rem}' +
    '.pc-panel{left:8px;right:8px;bottom:8px;width:auto;max-width:none;height:78vh;max-height:none}}';

  // asked: the dates first typed, kept when the guest moves to a free stretch, so the
  // enquiry tells the owner what they really wanted (submitQuoteRequest's "alternatives").
  var state = { checkIn: '', checkOut: '', guests: 2, asked: null };
  var panel, body, foot, launcher;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(s, n) { var d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); }
  function nice(s) { return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function nightsOf(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function visitorId() {
    try {
      var v = localStorage.getItem('lvg_vid');
      if (!v) { v = (String(Math.random()).slice(2) + Date.now()).slice(0, 24); localStorage.setItem('lvg_vid', v); }
      return v;
    } catch (e) { return ''; }
  }
  function api(action, payload) {
    return fetch(API_BASE + '/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ visitorId: visitorId() }, payload)),
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res || !res.success) throw new Error((res && res.error) || 'Something went wrong');
      return res.data;
    });
  }
  // The guest's details, remembered in this browser so a second price check needs no retyping.
  function savedContact() { try { return JSON.parse(localStorage.getItem('lvg_contact') || '{}') || {}; } catch (e) { return {}; } }
  function saveContact(c) { try { localStorage.setItem('lvg_contact', JSON.stringify(c)); } catch (e) {} }
  function track(name) { try { if (window.gtag) window.gtag('event', name, { event_category: 'price_chat' }); } catch (e) {} }

  function say(html, who) {
    var m = el('div', 'pc-msg ' + (who === 'me' ? 'pc-me' : 'pc-bot'), html);
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
    return m;
  }
  function setFoot(node) { foot.innerHTML = ''; foot.appendChild(node); body.scrollTop = body.scrollHeight; }
  function chip(label, onClick, extra) {
    var b = el('button', 'pc-chip' + (extra ? ' ' + extra : ''), label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }
  function waHref(est) {
    var n = nightsOf(state.checkIn, state.checkOut);
    var c = savedContact();
    var priced = est && est.quotable && est.approxTotal;
    var msg = '🌐 *Web Enquiry: Request to book Dwarka Villa*\n\n' +
      (c.name ? '🙋 Name: ' + c.name + '\n' : '') +
      (c.phone ? '📞 Phone: ' + c.phone + '\n' : '') +
      (c.email ? '✉️ Email: ' + c.email + '\n' : '') +
      '📅 Check-in: ' + nice(state.checkIn) + '\n' +
      '📅 Check-out: ' + nice(state.checkOut) + ' (' + plural(n, 'night') + ')\n' +
      '👥 Guests: ' + state.guests + '\n' +
      (priced ? '💰 Approx. ' + inr(est.approxPerNight) + ' / night · total ' + inr(est.approxTotal) + '\n' : '') +
      '\nI would like to book these dates. Please confirm the final rate.';
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  // ── Steps ──────────────────────────────────────────────────
  function start() {
    body.innerHTML = '';
    state.asked = null;
    say('Namaste 🙏 Let me get you an approximate price for <b>Dwarka Villa</b>. Just 3 quick questions.');
    say('When would you like to <b>check in</b>? <span class="pc-small">Please note: we don\'t take same-day bookings. The earliest check-in is tomorrow.</span>');
    askCheckIn();
  }

  function askCheckIn() {
    // No same-day bookings: the earliest check-in is tomorrow.
    var today = addDays(ymd(new Date()), 1);
    var input = el('input', 'pc-date'); input.type = 'date'; input.min = today;
    input.value = state.checkIn && state.checkIn >= today ? state.checkIn : '';
    input.setAttribute('aria-label', 'Check-in date');
    var go = chip('Next', function () {
      if (!input.value) { input.focus(); return; }
      if (input.value < today) { say('Sorry, we don\'t take same-day bookings. Please pick tomorrow or a later date.'); input.value = ''; input.focus(); return; }
      state.checkIn = input.value;
      say(nice(state.checkIn), 'me');
      say('And how many <b>nights</b>?');
      askNights();
    }, 'solid');
    var row = el('div', 'pc-row'); row.appendChild(input); row.appendChild(go);
    setFoot(row);
  }

  function askNights() {
    var box = el('div', 'pc-chips');
    [1, 2, 3, 4, 5].forEach(function (n) {
      box.appendChild(chip(plural(n, 'night'), function () { pickNights(n); }));
    });
    box.appendChild(chip('More…', function () {
      var input = el('input', 'pc-date'); input.type = 'date'; input.min = addDays(state.checkIn, 1);
      input.setAttribute('aria-label', 'Check-out date');
      var go = chip('Next', function () {
        if (!input.value) { input.focus(); return; }
        pickNights(nightsOf(state.checkIn, input.value));
      }, 'solid');
      var row = el('div', 'pc-row'); row.appendChild(input); row.appendChild(go);
      setFoot(row);
    }));
    setFoot(box);
  }

  function pickNights(n) {
    state.checkOut = addDays(state.checkIn, n);
    say(plural(n, 'night') + ' — check out ' + nice(state.checkOut), 'me');
    say('How many <b>guests</b>? <span class="pc-small">Count adults and children. Infants under 2 stay free.</span>');
    askGuests();
  }

  function askGuests() {
    var wrap = el('div', 'pc-row');
    var step = el('div', 'pc-step');
    var minus = el('button', '', '−'), plus = el('button', '', '+'), val = el('span', '', String(state.guests));
    minus.type = plus.type = 'button';
    minus.setAttribute('aria-label', 'Fewer guests'); plus.setAttribute('aria-label', 'More guests');
    minus.addEventListener('click', function () { if (state.guests > 1) val.textContent = --state.guests; });
    plus.addEventListener('click', function () { if (state.guests < MAX_GUESTS) val.textContent = ++state.guests; });
    step.appendChild(minus); step.appendChild(val); step.appendChild(plus);
    var go = chip('Get price', function () {
      say(plural(state.guests, 'guest'), 'me');
      quote();
    }, 'solid');
    go.style.marginLeft = 'auto';
    wrap.appendChild(step); wrap.appendChild(go);
    setFoot(wrap);
  }

  function quote() {
    setFoot(el('div', 'pc-note', 'Checking the calendar…'));
    var wait = say('<span class="pc-dots"><span></span><span></span><span></span></span>');
    track('price_chat_request');
    api('getPublicEstimate', { checkIn: state.checkIn, checkOut: state.checkOut, adults: state.guests, children: 0 })
      .then(function (data) {
        wait.remove();
        if (!data) throw new Error('no data');
        show(data);
      })
      .catch(function () {
        wait.remove();
        say('Sorry, I couldn\'t reach our booking calendar just now. Message us on WhatsApp and we\'ll reply with the price within hours.');
        endButtons(null);
      });
  }

  function show(est) {
    var span = nice(est.checkIn) + ' → ' + nice(est.checkOut);
    if (!est.available) {
      track('price_chat_unavailable');
      say('😔 Sorry, the villa is already booked for some of those nights (' + span + ').');
      var alts = [].concat(est.alternatives ? est.alternatives.before || [] : [], est.alternatives ? est.alternatives.after || [] : []);
      if (alts.length) {
        say('These dates are free for the same length of stay. Tap one to see its price:');
        var box = el('div', 'pc-chips');
        alts.slice(0, 5).forEach(function (a) {
          box.appendChild(chip(nice(a.checkIn).replace(/^\w+, /, '') + ' → ' + nice(a.checkOut).replace(/^\w+, /, ''), function () {
            if (!state.asked) state.asked = { checkIn: state.checkIn, checkOut: state.checkOut };
            state.checkIn = a.checkIn; state.checkOut = a.checkOut;
            say(nice(a.checkIn) + ' → ' + nice(a.checkOut), 'me');
            quote();
          }));
        });
        box.appendChild(chip('Other dates', start));
        setFoot(box);
      } else {
        endButtons(null);
      }
      return;
    }

    say('✅ Good news, the villa is free for <b>' + span + '</b>.');
    askContact(est);
  }

  // ── Contact: who the price is for. Sent as a quote request, so the owner gets an
  //    enquiry with the visitor's location and earlier price checks attached. ──
  function askContact(est) {
    var c = savedContact();
    say(est.quotable
      ? 'Your price is ready. Who shall I prepare it for? <span class="pc-small">We\'ll also WhatsApp you the confirmed rate. Your details stay with us.</span>'
      : 'A group of ' + state.guests + ' gets a personal quote. Who shall we send it to?');
    var form = el('form', 'pc-form');
    form.noValidate = true;
    function field(type, ph, val, auto) {
      var i = el('input', 'pc-date'); i.type = type; i.placeholder = ph; i.value = val || '';
      i.setAttribute('aria-label', ph); if (auto) i.autocomplete = auto;
      form.appendChild(i); return i;
    }
    var name = field('text', 'Your name', c.name, 'name');
    var phone = field('tel', 'WhatsApp / phone number', c.phone, 'tel');
    var email = field('email', 'Email address', c.email, 'email');
    var hp = el('input', 'pc-hp'); hp.type = 'text'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true');
    form.appendChild(hp);
    var errBox = el('div', 'pc-err');
    form.appendChild(errBox);
    var go = el('button', 'pc-chip solid', est.quotable ? 'Show my price' : 'Send my request');
    go.type = 'submit';
    form.appendChild(go);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = { name: name.value.trim(), phone: phone.value.trim(), email: email.value.trim() };
      var digits = d.phone.replace(/\D/g, '').length;
      var bad = d.name.length < 2 ? 'Please tell us your name.'
        : (digits < 10 || digits > 15) ? 'Please enter a phone / WhatsApp number we can reach you on.'
        : !d.email ? 'Please enter your email address.'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) ? 'That email address does not look right.' : '';
      if (bad) { errBox.textContent = bad; errBox.style.display = 'block'; return; }
      saveContact(d);
      say(esc(d.name) + ' · ' + esc(d.phone) + (d.email ? ' · ' + esc(d.email) : ''), 'me');
      setFoot(el('div', 'pc-note', 'One moment…'));
      track('price_chat_contact');
      // Typed dates + the free stretch they moved to: the server quotes the stretch and tells
      // the owner which dates were wanted. The price is shown whether or not this succeeds.
      var dates = state.asked
        ? { checkIn: state.asked.checkIn, checkOut: state.asked.checkOut, alternatives: [{ checkIn: state.checkIn, checkOut: state.checkOut }] }
        : { checkIn: state.checkIn, checkOut: state.checkOut, alternatives: [] };
      api('submitQuoteRequest', Object.assign(dates, {
        guestName: d.name, phone: d.phone, email: d.email, website: hp.value,
        message: 'Price checked in the website chat (' + location.pathname + ')',
        adults: state.guests, children: 0, infants: 0,
      }))
        .then(function () { reveal(est, d, true); })
        .catch(function () { reveal(est, d, false); });
    });
    setFoot(form);
    (!name.value ? name : !phone.value ? phone : email).focus();
  }

  function reveal(est, d, sent) {
    var first = esc(d.name.split(' ')[0]);
    track('price_chat_quote');
    if (est.quotable) {
      var extra = [];
      if (est.seasons && est.seasons.length) extra.push('Includes ' + est.seasons.map(function (s) { return esc(s.name); }).join(', ') + ' pricing.');
      if (est.extraGuests > 0) extra.push('Includes an extra-guest charge for ' + plural(est.extraGuests, 'guest') + '.');
      (est.minNightsNotes || []).forEach(function (n) { extra.push(esc(n)); });
      say('Thank you, ' + first + '. Here\'s your approximate price for <b>' + nice(est.checkIn) + ' → ' + nice(est.checkOut) + '</b>:' +
        '<span class="pc-price">≈ ' + inr(est.approxPerNight) + ' <small>/ night</small></span>' +
        '<span class="pc-total">Total <b>' + inr(est.approxTotal) + '</b> for ' + plural(est.nights, 'night') + ' · ' + plural(est.billableGuests, 'guest') + '</span>' +
        (extra.length ? '<span class="pc-small">' + extra.join(' ') + '</span>' : ''));
      say(sent
        ? 'This is the direct-booking price. We have your details and will confirm your final rate shortly. Ready to go ahead? Tap <b>Send a request to book</b>.'
        : 'This is the direct-booking price. Ready to go ahead? Tap <b>Send a request to book</b> and we\'ll confirm your final rate.');
    } else {
      say(sent
        ? 'Thank you, ' + first + '. We have your request and will come back with your personal quote shortly.'
        : 'Thank you, ' + first + '. Tap <b>Send a request to book</b> and we\'ll come straight back with your personal quote.');
    }
    endButtons(est);
  }

  function endButtons(est) {
    var wrap = el('div');
    var box = el('div', 'pc-chips');
    var wa = el('a', 'pc-chip solid', '📩 Send a request to book');
    wa.href = waHref(est); wa.target = '_blank'; wa.rel = 'noopener';
    wa.style.textDecoration = 'none'; wa.style.display = 'inline-flex'; wa.style.alignItems = 'center';
    wa.addEventListener('click', function () { track('price_chat_request_to_book'); });
    box.appendChild(wa);
    box.appendChild(chip('Change details', start));
    wrap.appendChild(box);
    wrap.appendChild(el('div', 'pc-note', 'Approximate price · final rate confirmed on WhatsApp'));
    setFoot(wrap);
  }

  // ── Mount ──────────────────────────────────────────────────
  function open() {
    panel.classList.add('open');
    launcher.style.display = 'none';
    if (!body.children.length) start();
    track('price_chat_open');
  }
  function close() {
    panel.classList.remove('open');
    launcher.style.display = '';
  }

  function mount() {
    var style = el('style'); style.textContent = css; document.head.appendChild(style);

    launcher = el('button', 'pc-launch', '<span aria-hidden="true">💬</span> Get a price');
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Get an approximate price');
    launcher.addEventListener('click', open);

    panel = el('div', 'pc-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Get a price');
    var head = el('div', 'pc-head',
      '<div class="pc-head-ico" aria-hidden="true">🏡</div>' +
      '<div><div class="pc-head-t">Dwarka Villa</div><div class="pc-head-s">Instant price check</div></div>');
    var x = el('button', 'pc-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', close);
    head.appendChild(x);
    body = el('div', 'pc-body');
    foot = el('div', 'pc-foot');
    panel.appendChild(head); panel.appendChild(body); panel.appendChild(foot);

    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
