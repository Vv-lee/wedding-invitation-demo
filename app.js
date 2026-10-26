'use strict';
const wedding = {
  names: '林予安 & 周知夏',
  start: '20270520T073000Z', // 北京时间 15:30
  end: '20270520T130000Z',
  address: '杭州 · 花园酒店，西湖区草坪仪式区（演示地址）',
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
    try { await navigator.clipboard.writeText(text); return true; } catch { /* 使用兼容复制。 */ }
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('aria-label', '待复制的内容');
  input.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.append(input);
  const previousFocus = document.activeElement;
  input.select();
  let success = false;
  try { success = document.execCommand('copy'); } catch { /* 提示用户手动复制。 */ }
  input.remove();
  previousFocus?.focus();
  return success;
}
document.getElementById('copy-address').addEventListener('click', async () => {
  toast(await copyText(wedding.address) ? '示例地址已复制；正式版会换成真实婚礼地址。' : '复制未成功，请长按页面上的地址复制。');
});
document.getElementById('calendar').addEventListener('click', () => {
  const escape = value => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const calendar = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation Demo//CN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', 'UID:wedding-demo-20270520@invitation.example',
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${wedding.start}`, `DTEND:${wedding.end}`,
    `SUMMARY:${escape(wedding.names)}的婚礼（演示）`, `LOCATION:${escape(wedding.address)}`,
    'DESCRIPTION:此为示例日程，并非真实婚礼邀请。', 'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = '婚礼邀请-演示日程.ics';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  toast('已生成示例日程。若微信限制下载，请在系统浏览器中打开。');
});
document.getElementById('share').addEventListener('click', async () => {
  if (location.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
    toast('当前是本地预览。发布到国内托管后，就能复制链接发给朋友。');
    return;
  }
  const url = new URL(location.href);
  url.hash = '';
  if (navigator.share) {
    try { await navigator.share({ title: document.title, text: '一封关于爱与相聚的邀请（设计示例）', url: url.href }); return; }
    catch (error) { if (error.name === 'AbortError') return; }
  }
  toast(await copyText(url.href) ? '邀请链接已复制，快把这份欢喜分享出去吧。' : '请使用浏览器菜单分享，或复制地址栏链接。');
});
