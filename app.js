'use strict';
const wedding = {
  names: '李有为 & 谢妍',
  welcome: '20270130T073000Z',
  banquet: '20270130T101800Z',
  address: '江苏省泰州市泰兴市国庆中路130号 金陵国际大酒店 四楼水晶厅',
};
let toastTimer;
function toast(message) {
  const box = document.getElementById('toast');
  box.textContent = message;
  box.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove('visible'), 4200);
}
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* Fall back for embedded browsers. */ }
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('aria-label', '待复制的内容');
  input.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.append(input);
  const focused = document.activeElement;
  input.select();
  let success = false;
  try { success = document.execCommand('copy'); } catch { /* Show the manual-copy instruction. */ }
  input.remove();
  focused?.focus();
  return success;
}
document.getElementById('copy-address').addEventListener('click', async () => {
  toast(await copyText(wedding.address) ? '完整地址已复制，期待与你在水晶厅相见。' : '请长按页面上的酒店地址进行复制。');
});
function calendarText() {
  const escape = value => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const event = (id, start, title) => [
    'BEGIN:VEVENT', `UID:${id}@youweili-yanxie.github.io`, `DTSTAMP:${stamp}`,
    `DTSTART:${start}`, `SUMMARY:${escape(title)}`, `LOCATION:${escape(wedding.address)}`,
    'DESCRIPTION:2027年1月30日（丙午年腊月廿三），15:30迎宾，18:18开席。金陵国际大酒店四楼水晶厅，期待与你相见。', 'END:VEVENT',
  ];
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Youwei and Yan//Wedding//CN', 'CALSCALE:GREGORIAN',
    ...event('welcome-20270130', wedding.welcome, `${wedding.names}的婚礼 · 迎宾`),
    ...event('banquet-20270130', wedding.banquet, `${wedding.names}的婚礼 · 开席`),
    'END:VCALENDAR', '',
  ].join('\r\n');
}
document.getElementById('calendar').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([calendarText()], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = '李有为与谢妍-婚礼日程.ics';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  toast('婚礼日历已生成；若微信限制下载，请在系统浏览器中打开。');
});
const musicTrack = document.getElementById('wedding-music');
musicTrack.volume = .35;
let musicBusy = false;
let musicWanted = false;
function updateMusicState(playing) {
  const button = document.getElementById('music');
  button.setAttribute('aria-pressed', String(playing));
  button.setAttribute('aria-label', playing ? '暂停 Love Story' : '播放 Love Story');
  button.title = 'Love Story · Taylor Swift';
  document.getElementById('music-label').textContent = playing ? 'Love Story' : '开启音乐';
}
function stopMusic() {
  musicWanted = false;
  musicTrack.pause();
  updateMusicState(false);
}
async function startMusic() {
  if (musicBusy || !musicTrack.paused) return;
  musicBusy = true;
  musicWanted = true;
  try {
    await musicTrack.play();
    if (!musicWanted || document.hidden) {
      musicTrack.pause();
      return;
    }
    updateMusicState(true);
  } catch {
    if (musicWanted) {
      stopMusic();
      toast('音乐未能开启，请再点击一次，或在系统浏览器中打开。');
    }
  } finally { musicBusy = false; }
}
document.getElementById('music').addEventListener('click', () => {
  if (!musicTrack.paused || musicBusy) stopMusic();
  else startMusic();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); });
