// Nav scroll effect
(function(){
  const nav = document.getElementById('mainNav');
  if(!nav) return;
  function upd(){ nav.classList.toggle('solid', window.scrollY > 55); }
  window.addEventListener('scroll', upd, {passive:true});
  upd();
})();

// Mobile menu
(function(){
  const ham  = document.querySelector('.hamburger');
  const menu = document.getElementById('mobMenu');
  const cls  = document.getElementById('mobClose');
  if(!ham||!menu) return;
  ham.addEventListener('click', ()=>menu.classList.add('open'));
  if(cls) cls.addEventListener('click', ()=>menu.classList.remove('open'));
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.classList.remove('open')));
})();

// Active nav link
(function(){
  const page = window.location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-links a, #mobMenu a').forEach(a=>{
    const h = a.getAttribute('href')||'';
    if(h===page||(page===''&&h==='index.html')) a.classList.add('active');
  });
})();

// Fade-in on scroll
(function(){
  const els = document.querySelectorAll('.fade-in');
  if(!els.length) return;
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  },{threshold:.08});
  els.forEach(el=>obs.observe(el));
})();

// Enquiry form — WhatsApp + EmailJS
(function(){
  const form = document.getElementById('enquiryForm');
  if(!form) return;
  const WA      = '918547141401';
  const EJS_KEY = 'YOUR_PUBLIC_KEY';   // replace after emailjs.com signup
  const EJS_SVC = 'YOUR_SERVICE_ID';
  const EJS_TPL = 'YOUR_TEMPLATE_ID';

  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  s.onload = ()=>{ if(EJS_KEY!=='YOUR_PUBLIC_KEY') emailjs.init(EJS_KEY); };
  document.head.appendChild(s);

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const btn = document.getElementById('fBtn');
    const st  = document.getElementById('fStatus');
    btn.disabled=true; btn.textContent='Sending…';
    const d = {
      name:     this.name.value.trim(),
      email:    this.email.value.trim(),
      phone:    this.phone.value.trim(),
      checkin:  this.checkin?.value||'',
      checkout: this.checkout?.value||'',
      guests:   this.guests?.value||'',
      message:  this.message?.value?.trim()||''
    };
    if(EJS_KEY!=='YOUR_PUBLIC_KEY'&&typeof emailjs!=='undefined'){
      try{ await emailjs.send(EJS_SVC,EJS_TPL,d); }catch(err){ console.warn(err); }
    }
    const msg = encodeURIComponent(
      `🏡 *Dwarka Villa Enquiry*\n\n👤 ${d.name}\n📧 ${d.email}\n📱 ${d.phone}`+
      (d.checkin?`\n📅 ${d.checkin} → ${d.checkout}`:'')+
      (d.guests?`\n👨‍👩‍👧 ${d.guests}`:'')+
      (d.message?`\n💬 ${d.message}`:'')
    );
    window.open(`https://wa.me/${WA}?text=${msg}`,'_blank');
    if(st){ st.className='fstatus ok'; st.textContent='✓ Sent! We\'ll reply within a few hours.'; }
    form.reset(); btn.disabled=false; btn.textContent='Send Enquiry';
  });
})();
