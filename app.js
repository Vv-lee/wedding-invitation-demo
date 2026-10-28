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
    'DESCRIPTION:2027年1月30日，15:30迎宾，18:18开席。金陵国际大酒店四楼水晶厅，期待与你相见。', 'END:VEVENT',
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
/* An original eight-bar instrumental, rendered locally; no remote audio or recording rights required. */
function makeMusicBuffer(context) {
  const rate = 22050;
  const beat = 60 / 72;
  const duration = 32 * beat;
  const buffer = context.createBuffer(1, Math.ceil(rate * duration), rate);
  const data = buffer.getChannelData(0);
  function note(midi, at, length, volume) {
    const hz = 440 * Math.pow(2, (midi - 69) / 12);
    const start = Math.round(at * rate);
    const count = Math.min(Math.round(length * rate), data.length - start);
    for (let i = 0; i < count; i++) {
      const t = i / rate;
      const attack = Math.min(1, t / .018);
      const release = Math.min(1, (count - i) / (rate * .16));
      const envelope = attack * release * Math.exp(-t * 2.2);
      const phase = 2 * Math.PI * hz * t;
      data[start + i] += volume * envelope * (Math.sin(phase) + .22 * Math.sin(phase * 2) * Math.exp(-t * 2) + .07 * Math.sin(phase * 3));
    }
  }
  const chords = [[48,55,60,64],[43,55,59,62],[45,52,57,60],[40,52,55,59],[41,53,57,60],[48,55,60,64],[41,53,57,60],[43,55,59,62]];
  const melody = [[76,79,77,76],[74,71,74,79],[76,72,74,76],[71,67,71,74],[72,77,76,74],[76,79,76,72],[74,77,76,72],[71,74,72,72]];
  chords.forEach((chord, bar) => {
    for (let step = 0; step < 8; step++) note(chord[[0,2,1,3,0,2,1,3][step]], (bar * 4 + step / 2) * beat, 1.4 * beat, .09);
    melody[bar].forEach((pitch, step) => note(pitch, (bar * 4 + step) * beat, 1.65 * beat, .125));
  });
  const fade = Math.round(rate * .16);
  for (let i = 0; i < fade; i++) { data[i] *= i / fade; data[data.length - 1 - i] *= i / fade; }
  return buffer;
}
let audioContext;
let musicBuffer;
let musicSource;
let musicBusy = false;
let musicWanted = false;
function updateMusicState(playing) {
  const button = document.getElementById('music');
  button.setAttribute('aria-pressed', String(playing));
  button.setAttribute('aria-label', playing ? '暂停婚礼轻音乐' : '播放婚礼轻音乐');
  document.getElementById('music-label').textContent = playing ? '音乐播放中' : '开启音乐';
}
function stopMusic() {
  musicWanted = false;
  if (musicSource) { musicSource.stop(); musicSource.disconnect(); musicSource = null; }
  updateMusicState(false);
}
async function startMusic() {
  if (musicBusy || musicSource) return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) { toast('当前浏览器暂不支持轻音乐播放，可尝试在系统浏览器中打开。'); return; }
  musicBusy = true;
  musicWanted = true;
  try {
    audioContext ||= new Audio();
    await audioContext.resume();
    if (!musicWanted || document.hidden) return;
    if (audioContext.state !== 'running') throw new Error('Audio is blocked');
    musicBuffer ||= makeMusicBuffer(audioContext);
    const source = audioContext.createBufferSource();
    source.buffer = musicBuffer;
    source.loop = true;
    source.connect(audioContext.destination);
    source.start();
    musicSource = source;
    updateMusicState(true);
  } catch {
    stopMusic();
    toast('音乐未能开启，请再点击一次，或在系统浏览器中打开。');
  } finally { musicBusy = false; }
}
document.getElementById('music').addEventListener('click', () => {
  if (musicSource || musicBusy) stopMusic();
  else startMusic();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); });
