'use strict';
// Add {src, alt, caption} entries to a collection when the photos are ready.
const photoCollections = [
  {id:'daily',title:'日常',english:'EVERYDAY',group:'我们的生活',description:'把普通的一天，记成喜欢的一天。',photos:[]},
  {id:'engagement',title:'订婚',english:'ENGAGEMENT',group:'人生的仪式',description:'认真约定，慢慢相伴。',photos:[]},
  {id:'certificate',title:'领证',english:'OUR PROMISE',group:'人生的仪式',description:'从这一天起，我们有了共同的名字。',photos:[]},
  {id:'garden',title:'园林',english:'IN THE GARDEN',group:'婚纱照',description:'一方园林，一起入画。',photos:[]},
  {id:'tang',title:'唐服',english:'TIMELESS LOVE',group:'婚纱照',description:'把相逢，写进古意里。',photos:[]},
  {id:'wedding-portrait',title:'大婚肖像',english:'THE PORTRAITS',group:'婚纱照',description:'郑重定格，属于我们的模样。',photos:[]},
  {id:'oil-painting',title:'油画',english:'LOVE ON CANVAS',group:'婚纱照',description:'让爱意，落在温柔的光里。',photos:[]},
  {id:'castle',title:'城堡',english:'OUR FAIRYTALE',group:'婚纱照',description:'故事的这一页，刚好是我们。',photos:[]},
];

const memoryCloud = document.getElementById('memory-cloud');
const photoDialog = document.getElementById('photo-dialog');
const photoImage = document.getElementById('gallery-photo');
const photoEmpty = document.getElementById('gallery-empty');
const photoPrevious = document.getElementById('gallery-previous');
const photoNext = document.getElementById('gallery-next');
const photoClose = document.getElementById('close-gallery');
const photoCount = document.getElementById('gallery-count');
const photoCaption = document.getElementById('gallery-caption');
let activeCollection;
let activePhoto = 0;
let lastBubble;
const memoryField = document.getElementById('memory-field');
const memoryButtons = new Map();
const floatingHearts = [];
let seenCollections = [];
try {
  const saved = JSON.parse(localStorage.getItem('wedding-gallery-seen') || '[]');
  if (Array.isArray(saved)) seenCollections = [...new Set(saved.filter(id => photoCollections.some(item => item.id === id)))];
} catch { /* Browsing still works when local storage is unavailable. */ }
const reducedHeartMotion = matchMedia('(prefers-reduced-motion: reduce)');
let heartBounds = {width:0,height:0};
let heartVisible = !('IntersectionObserver' in window);
let heartFocused = false;
let heartTouched = false;
let heartFrame = 0;
let heartTime = 0;

photoCollections.forEach(collection => {
  const bubble = document.createElement('button');
  bubble.type = 'button';
  bubble.className = 'memory-bubble';
  bubble.dataset.collection = collection.id;
  bubble.setAttribute('aria-label',`查看${collection.group} · ${collection.title}相册`);
  bubble.setAttribute('aria-haspopup','dialog');
  bubble.setAttribute('aria-controls','photo-dialog');
  const material = document.createElement('span');
  material.className = 'heart-material';
  material.setAttribute('aria-hidden','true');
  const glass = document.createElement('img');
  glass.className = 'heart-glass';
  glass.src = './assets/glass-heart.svg';
  glass.alt = '';
  glass.width = 120;
  glass.height = 112;
  const copy = document.createElement('span');
  copy.className = 'bubble-copy';
  const title = document.createElement('span');
  title.className = 'bubble-title';
  title.textContent = collection.title;
  const group = document.createElement('small');
  group.className = 'bubble-group';
  group.textContent = collection.group;
  copy.append(title,group);
  const seenMark = document.createElement('span');
  seenMark.className = 'heart-seen-mark';
  seenMark.textContent = '✓';
  seenMark.setAttribute('aria-hidden','true');
  bubble.append(material,glass,copy,seenMark);
  bubble.addEventListener('click',() => openPhotoCollection(collection.id,bubble));
  memoryButtons.set(collection.id,{button:bubble,group,seenMark,collection});
  memoryCloud.append(bubble);
  floatingHearts.push({button:bubble,x:0,y:0,vx:(Math.random()<.5?-1:1)*(18+Math.random()*12),vy:(Math.random()<.5?-1:1)*(15+Math.random()*12),phase:Math.random()*Math.PI*2,size:62,radius:37});
  updateViewedHeart(collection.id);
});

function updateViewedHeart(id) {
  const {button,group,seenMark,collection} = memoryButtons.get(id);
  const viewed = seenCollections.includes(id);
  button.classList.toggle('is-viewed',viewed);
  group.textContent = viewed ? '已看过' : collection.group;
  seenMark.hidden = !viewed;
  button.setAttribute('aria-label',`查看${collection.group} · ${collection.title}相册${viewed ? '，已看过，可再次查看' : ''}`);
}

function markMemoryHeart(button) {
  if (!button || seenCollections.includes(button.dataset.collection)) return;
  seenCollections.push(button.dataset.collection);
  updateViewedHeart(button.dataset.collection);
  try { localStorage.setItem('wedding-gallery-seen',JSON.stringify(seenCollections)); } catch { /* Keep the current session usable. */ }
}

function advanceMemoryHearts(hearts,bounds,seconds) {
  for (const heart of hearts) {
    heart.x += heart.vx*seconds;
    heart.y += heart.vy*seconds;
    heart.phase += seconds*.38;
    if (heart.x < heart.radius) { heart.x=heart.radius;heart.vx=Math.abs(heart.vx); }
    if (heart.x > bounds.width-heart.radius) { heart.x=bounds.width-heart.radius;heart.vx=-Math.abs(heart.vx); }
    if (heart.y < heart.radius) { heart.y=heart.radius;heart.vy=Math.abs(heart.vy); }
    if (heart.y > bounds.height-heart.radius) { heart.y=bounds.height-heart.radius;heart.vy=-Math.abs(heart.vy); }
  }
  for (let i=0;i<hearts.length;i++) for (let j=i+1;j<hearts.length;j++) {
    const a=hearts[i],b=hearts[j],dx=b.x-a.x,dy=b.y-a.y;
    const distance=Math.hypot(dx,dy),gap=a.radius+b.radius+3;
    if (distance >= gap) continue;
    const nx=distance?dx/distance:1,ny=distance?dy/distance:0,overlap=(gap-distance)/2;
    a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
    const approach=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if (approach<0) {a.vx+=approach*nx;a.vy+=approach*ny;b.vx-=approach*nx;b.vy-=approach*ny;}
  }
  for (const heart of hearts) {
    heart.x=Math.max(heart.radius,Math.min(bounds.width-heart.radius,heart.x));
    heart.y=Math.max(heart.radius,Math.min(bounds.height-heart.radius,heart.y));
  }
}

function paintMemoryHearts() {
  for (const heart of floatingHearts) heart.button.style.transform=`translate3d(${heart.x-heart.size/2}px,${heart.y-heart.size*.46665}px,0) rotate(${Math.sin(heart.phase)*16}deg)`;
}

function sizeMemoryHearts() {
  const width=memoryCloud.clientWidth,height=memoryCloud.clientHeight;
  if (!width || !height) return;
  const previous=heartBounds;
  heartBounds={width,height};
  const slots=Array.from({length:9},(_,i)=>i);
  for (let i=slots.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]];}
  floatingHearts.forEach((heart,index)=>{
    heart.size=heart.button.offsetWidth;
    heart.radius=Math.min(heart.size*.6,width/2-1,height/2-1);
    heart.x=previous.width?heart.x*width/previous.width:((slots[index]%3)+.5)*width/3;
    heart.y=previous.height?heart.y*height/previous.height:(Math.floor(slots[index]/3)+.5)*height/3;
  });
  advanceMemoryHearts(floatingHearts,heartBounds,0);
  paintMemoryHearts();
  syncHeartMotion();
}

function canMoveHearts() {return !reducedHeartMotion.matches && !document.hidden && !photoDialog.open && heartVisible && !heartFocused && !heartTouched && !!floatingHearts.length && heartBounds.width>0;}
function tickMemoryHearts(time) {
  heartFrame=0;
  if (!canMoveHearts()) {heartTime=0;return;}
  advanceMemoryHearts(floatingHearts,heartBounds,heartTime?Math.min((time-heartTime)/1000,.04):0);
  heartTime=time;
  paintMemoryHearts();
  heartFrame=requestAnimationFrame(tickMemoryHearts);
}
function syncHeartMotion() {
  if (canMoveHearts() && !heartFrame) {heartTime=0;heartFrame=requestAnimationFrame(tickMemoryHearts);}
  else if (!canMoveHearts() && heartFrame) {cancelAnimationFrame(heartFrame);heartFrame=0;heartTime=0;}
}

function renderPhotoCollection() {
  const photos = activeCollection.photos;
  const photo = photos[activePhoto];
  document.getElementById('gallery-title').textContent = activeCollection.title;
  document.getElementById('gallery-group').textContent = `${activeCollection.group} / ${activeCollection.english}`;
  document.getElementById('gallery-description').textContent = activeCollection.description;
  photoDialog.dataset.collection = activeCollection.id;
  photoImage.hidden = !photo;
  photoEmpty.hidden = !!photo;
  if (photo) {
    photoImage.src = photo.src;
    photoImage.alt = photo.alt || `${activeCollection.title} · 第${activePhoto+1}张照片`;
  } else {
    photoImage.removeAttribute('src');
    photoImage.alt = '';
  }
  photoCount.textContent = photo ? `${String(activePhoto+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}` : '照片待续';
  photoCaption.textContent = photo ? (photo.caption || activeCollection.title) : '这一册，先为我们的故事留白。';
  photoPrevious.disabled = !photo || activePhoto === 0;
  photoNext.disabled = !photo || activePhoto === photos.length-1;
}

function openPhotoCollection(id,bubble) {
  const collection = photoCollections.find(item => item.id === id);
  if (!collection) return;
  activeCollection = collection;
  activePhoto = 0;
  lastBubble = bubble;
  renderPhotoCollection();
  markMemoryHeart(bubble);
  document.body.classList.add('gallery-open');
  photoDialog.showModal();
  syncHeartMotion();
  photoClose.focus({preventScroll:true});
}

function moveCollectionPhoto(step) {
  if (!activeCollection?.photos.length) return;
  activePhoto = Math.max(0,Math.min(activeCollection.photos.length-1,activePhoto+step));
  renderPhotoCollection();
}

photoPrevious.addEventListener('click',() => moveCollectionPhoto(-1));
photoNext.addEventListener('click',() => moveCollectionPhoto(1));
photoClose.addEventListener('click',() => photoDialog.close());
photoDialog.addEventListener('close',() => {
  document.body.classList.remove('gallery-open');
  lastBubble?.focus({preventScroll:true});
  syncHeartMotion();
});
photoDialog.addEventListener('keydown',event => {
  if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  moveCollectionPhoto(event.key === 'ArrowRight' ? 1 : -1);
});
photoDialog.addEventListener('click',event => {
  if (event.target !== photoDialog) return;
  const bounds = photoDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) photoDialog.close();
});
let photoTouchX;
document.getElementById('gallery-stage').addEventListener('touchstart',event => {photoTouchX=event.touches[0].clientX;},{passive:true});
document.getElementById('gallery-stage').addEventListener('touchend',event => {
  if (photoTouchX === undefined) return;
  const distance = event.changedTouches[0].clientX-photoTouchX;
  if (Math.abs(distance)>40) moveCollectionPhoto(distance<0?1:-1);
  photoTouchX=undefined;
},{passive:true});
document.getElementById('gallery-stage').addEventListener('touchcancel',() => {photoTouchX=undefined;},{passive:true});

memoryCloud.addEventListener('pointerdown',()=>{heartTouched=true;syncHeartMotion();});
document.addEventListener('pointerup',()=>{heartTouched=false;syncHeartMotion();});
document.addEventListener('pointercancel',()=>{heartTouched=false;syncHeartMotion();});
memoryCloud.addEventListener('focusin',event=>{heartFocused=event.target.matches(':focus-visible');syncHeartMotion();});
memoryCloud.addEventListener('focusout',event=>{if(!memoryCloud.contains(event.relatedTarget)){heartFocused=false;syncHeartMotion();}});
document.addEventListener('visibilitychange',syncHeartMotion);
document.getElementById('enter-invitation').addEventListener('click',sizeMemoryHearts);
if (reducedHeartMotion.addEventListener) reducedHeartMotion.addEventListener('change',syncHeartMotion);
else reducedHeartMotion.addListener(syncHeartMotion);
if ('ResizeObserver' in window) new ResizeObserver(sizeMemoryHearts).observe(memoryCloud);
else window.addEventListener('resize',sizeMemoryHearts);
if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{heartVisible=entries[0].isIntersecting;syncHeartMotion();},{threshold:0}).observe(memoryField);
sizeMemoryHearts();
