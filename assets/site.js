const header = document.querySelector('.site-header');
const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);

function setActiveSection(id) {
  navLinks.forEach(link => {
    const active = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
}
function updateActiveNav() {
  if (!sections.length) return;
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 3;
  if (atBottom) { setActiveSection('contact'); return; }
  const probe = window.scrollY + (header?.offsetHeight || 0) + 2;
  let current = sections[0];
  for (const section of sections) { if (section.offsetTop <= probe) current = section; else break; }
  setActiveSection(current.id);
}
navLinks.forEach(link => link.addEventListener('click', event => {
  const target = document.querySelector(link.getAttribute('href')); if (!target) return;
  event.preventDefault(); target.scrollIntoView({ behavior:'smooth', block:'start' });
}));
let scrollTicking=false;
window.addEventListener('scroll',()=>{if(scrollTicking)return;scrollTicking=true;requestAnimationFrame(()=>{updateActiveNav();scrollTicking=false;});},{passive:true});
window.addEventListener('resize',updateActiveNav); window.addEventListener('load',updateActiveNav); updateActiveNav();

// Accordion: only one item can be open inside each group.
document.querySelectorAll('[data-accordion]').forEach(group => {
  const items=[...group.querySelectorAll(':scope > .accordion-item')];
  items.forEach(item=>{
    const trigger=item.querySelector(':scope > .accordion-trigger');
    const panel=item.querySelector(':scope > .accordion-panel'); if(!trigger||!panel)return;
    trigger.addEventListener('click',()=>{
      const shouldOpen=!item.classList.contains('open');
      items.forEach(other=>{const t=other.querySelector(':scope > .accordion-trigger');const p=other.querySelector(':scope > .accordion-panel');other.classList.remove('open');if(t)t.setAttribute('aria-expanded','false');if(p)p.hidden=true;});
      if(shouldOpen){item.classList.add('open');trigger.setAttribute('aria-expanded','true');panel.hidden=false;setTimeout(()=>{layoutAllGalleries();const offset=header?.offsetHeight||0;const top=item.getBoundingClientRect().top+window.scrollY-offset-10;window.scrollTo({top,behavior:'smooth'});},35);}
    });
  });
});

// Project images: landscape/square -> width-driven; portrait -> height-driven.
function applyAdaptiveMode(img) {
  const slot=img.closest('.adaptive-media'); if(!slot)return;
  const ratio=img.naturalWidth/img.naturalHeight;
  if(slot.dataset.adaptive==='project'){
    slot.classList.toggle('fit-height',ratio<0.92);
    slot.classList.toggle('fit-width',ratio>=0.92);
  }
}
function markLoaded(img){
  const slot=img.closest('.media-slot'); if(slot)slot.hidden=false; slot?.classList.add('has-image'); img.style.display='block';
  if(img.naturalWidth>0) applyAdaptiveMode(img);
}
function markMissing(img){const slot=img.closest('.media-slot');slot?.classList.remove('has-image');img.style.display='none';if(slot?.closest('[data-photo-strip]')||slot?.classList.contains('optional-media'))slot.hidden=true;}

// Flexible local-image loader. Keep the same basename and use JPG/JPEG/PNG/WebP;
// the page will try alternatives automatically, so users do not need to convert files.
function imageCandidates(src){
  const clean=src.split('?')[0].split('#')[0];
  const match=clean.match(/^(.*)\.([^.\/]+)$/);
  const base=match?match[1]:clean;
  const current=match?match[2].toLowerCase():'';
  const exts=[current,'jpg','jpeg','png','webp','JPG','JPEG','PNG','WEBP'].filter(Boolean);
  return [...new Set(exts)].map(ext=>`${base}.${ext}`);
}
function loadFlexibleImage(img){
  const candidates=imageCandidates(img.getAttribute('src')||'');
  let index=0;
  const tryNext=()=>{
    if(index>=candidates.length){markMissing(img);layoutAllGalleries();return;}
    const candidate=candidates[index++];
    img.onload=()=>{markLoaded(img);layoutAllGalleries();};
    img.onerror=tryNext;
    img.src=candidate;
  };
  // Always run through the candidate list so a missing .jpg can transparently fall back to .png, and vice versa.
  tryNext();
}
document.querySelectorAll('img[data-local-image]').forEach(loadFlexibleImage);

// Photography strip: horizontal swipe/trackpad scrolling with optional arrow controls.
function layoutAllGalleries(){}
document.querySelectorAll('[data-photo-scroll]').forEach(button=>{button.addEventListener('click',()=>{const panel=button.closest('.accordion-panel');const strip=panel?.querySelector('[data-photo-strip]');if(!strip)return;const direction=button.dataset.photoScroll==='prev'?-1:1;strip.scrollBy({left:direction*Math.max(320,strip.clientWidth*.72),behavior:'smooth'});});});
