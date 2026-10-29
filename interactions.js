const cover = document.getElementById('cover');
const invitation = document.getElementById('invitation');
let opening = false;
const openLetter = document.getElementById('open-letter');
const enterInvitation = document.getElementById('enter-invitation');
const coverHint = document.querySelector('.cover-hint');
const letterPreview = document.querySelector('.letter-preview');
openLetter.addEventListener('click', () => {
  if (opening) return;
  opening = true;
  startMusic();
  openLetter.disabled = true;
  openLetter.setAttribute('aria-expanded', 'true');
  cover.classList.add('unsealing');
  coverHint.textContent = '这一席，想留给你。';
  letterPreview.setAttribute('aria-hidden', 'false');
  enterInvitation.hidden = false;
  enterInvitation.focus({preventScroll:true});
});
enterInvitation.addEventListener('click', () => {
  cover.hidden = true;
  invitation.hidden = false;
  invitation.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'auto'});
});
document.getElementById('replay').addEventListener('click', () => {
  stopMusic();
  invitation.hidden = true;
  cover.hidden = false;
  cover.classList.remove('unsealing');
  opening = false;
  openLetter.disabled = false;
  openLetter.setAttribute('aria-expanded', 'false');
  enterInvitation.hidden = true;
  letterPreview.setAttribute('aria-hidden', 'true');
  coverHint.replaceChildren('轻触蜡封，拆开这份欢喜 ', Object.assign(document.createElement('span'), {textContent:'↑'}));
  window.scrollTo({top:0,behavior:'auto'});
  openLetter.focus({preventScroll:true});
});
function countdownParts(now) {
  const remaining = Math.max(0, new Date('2027-01-30T15:30:00+08:00').getTime() - now);
  return {days:Math.floor(remaining/86400000),hours:Math.floor(remaining/3600000)%24,minutes:Math.floor(remaining/60000)%60,started:remaining===0};
}
function updateCountdown() {
  const parts = countdownParts(Date.now());
  ['days','hours','minutes'].forEach(id=>{document.getElementById(id).textContent=String(parts[id]).padStart(2,'0');});
  document.getElementById('countdown-label').textContent = parts.started ? '珍藏这一天，感谢你的见证' : '距离这场相聚，还有';
}
updateCountdown();
setInterval(updateCountdown,60000);
if ('IntersectionObserver' in window) {
  const navigation = Array.from(document.querySelectorAll('[data-nav]'));
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){navigation.forEach(link=>{if(link.dataset.nav===entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}});
  },{rootMargin:'-15% 0px -55% 0px',threshold:0});
  document.querySelectorAll('.chapter').forEach(section=>observer.observe(section));
}
const guestInput = document.getElementById('guest-name');
try { guestInput.value = (localStorage.getItem('wedding-guest-name')||'').slice(0,20); } catch { /* Storage may be unavailable in embedded/private browsers. */ }
async function drawInvitationCard(name, blessing) {
  await Promise.all([document.fonts.load('80px InvitationScript'),document.fonts.load('24px InvitationSong'),document.fonts.load('35px InvitationCalligraphy','李有为谢妍')]);
  const logo = new Image();
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">'+document.getElementById('brand-mark').innerHTML+'</svg>';
  const logoReady = new Promise((resolve,reject)=>{logo.onload=resolve;logo.onerror=reject;});
  logo.src = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  await logoReady;
  const canvas=document.createElement('canvas');
  canvas.width=750; canvas.height=1080;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Canvas is unavailable');
  ctx.fillStyle='#f6e8e0';ctx.fillRect(0,0,750,1080);
  ctx.strokeStyle='#b99c76';ctx.lineWidth=1.5;ctx.strokeRect(34,34,682,1012);ctx.strokeStyle='#dec9b5';ctx.strokeRect(46,46,658,988);
  ctx.textAlign='center';ctx.fillStyle='#b49a75';ctx.font='16px Georgia';ctx.fillText('A LETTER, JUST FOR YOU',375,115);
  ctx.drawImage(logo,295,149,160,160);
  ctx.fillStyle='#94665d';ctx.font='94px InvitationScript';ctx.fillText('Youwei & Yan',375,390);
  ctx.font='35px InvitationCalligraphy';ctx.fillText('李有为  &  谢妍',375,446);
  ctx.strokeStyle='#c3a584';ctx.beginPath();ctx.moveTo(170,497);ctx.lineTo(580,497);ctx.stroke();
  ctx.fillStyle='#826456';ctx.font='22px "Microsoft YaHei", sans-serif';ctx.fillText('亲爱的',375,560);
  let size=39;ctx.font=`${size}px "Microsoft YaHei", sans-serif`;
  while(ctx.measureText(name).width>570&&size>17){size--;ctx.font=`${size}px "Microsoft YaHei", sans-serif`;}
  ctx.fillStyle='#98675d';ctx.fillText(name,375,625);
  ctx.fillStyle='#826456';ctx.font='22px "Microsoft YaHei", sans-serif';ctx.fillText('这一席，想留给你。',375,687);
  ctx.font='34px Georgia';ctx.fillText('2027.01.30',375,765);
  ctx.font='22px InvitationSong';ctx.fillText('丙午年 · 腊月廿三',375,801);
  ctx.fillStyle='#b49a75';ctx.font='17px "Microsoft YaHei", sans-serif';ctx.fillText('把今天的欢喜，也送一份给你',375,849);
  ctx.fillStyle='#826456';ctx.font='26px "Microsoft YaHei", sans-serif';
  const lines=blessingLines(blessing,text=>ctx.measureText(text).width,574);
  const firstLine=913-(lines.length-1)*20;
  lines.forEach((line,index)=>ctx.fillText(line,375,firstLine+index*40));
  ctx.fillStyle='#b49a75';ctx.font='19px "Microsoft YaHei", sans-serif';ctx.fillText('有你相伴，岁岁妍好。',375,997);
  return canvas.toDataURL('image/png');
}
const guestDialog=document.getElementById('guest-dialog');
document.getElementById('guest-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const name=guestInput.value.trim().slice(0,20);
  if(!name){guestInput.setCustomValidity('请填写你的名字或昵称。');guestInput.reportValidity();return;}
  try {
    const button=event.currentTarget.querySelector('button[type="submit"]');
    button.disabled=true;
    const blessing=blessingFor(name);
    const url=await drawInvitationCard(name,blessing);
    document.getElementById('card-preview').src=url;
    document.getElementById('card-preview').alt=`致${name}的专属婚礼邀请卡。${blessing}`;
    document.getElementById('download-card').href=url;
    try{localStorage.setItem('wedding-guest-name',name);}catch{/* Card generation still works without storage. */}
    guestDialog.showModal();
  }catch{toast('邀请卡暂时未能生成，请在系统浏览器中重试。');}
  finally{document.querySelector('#guest-form button[type="submit"]').disabled=false;}
});
guestInput.addEventListener('input',()=>guestInput.setCustomValidity(''));
document.getElementById('close-card').addEventListener('click',()=>guestDialog.close());
guestDialog.addEventListener('click',event=>{if(event.target===guestDialog)guestDialog.close();});

const logoDialog = document.getElementById('logo-dialog');
document.querySelectorAll('[data-logo-preview]').forEach(button => {
  button.addEventListener('click', () => logoDialog.showModal());
});
document.getElementById('close-logo').addEventListener('click', () => logoDialog.close());
logoDialog.addEventListener('click', event => { if (event.target === logoDialog) logoDialog.close(); });
