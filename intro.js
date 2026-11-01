'use strict';
const invitationUrl = new URL(window.location.href);
if (invitationUrl.searchParams.has('v')) {
  invitationUrl.searchParams.delete('v');
  window.history.replaceState(window.history.state, '', invitationUrl.pathname + invitationUrl.search + invitationUrl.hash);
}
const filmIntro = document.getElementById('film-intro');
const introVideo = document.getElementById('intro-video');
const playIntro = document.getElementById('play-intro');
const introPlayLabel = document.getElementById('intro-play-label');
const introStatus = document.getElementById('intro-status');
let introFinished = false;

function finishIntro() {
  if (introFinished) return;
  introFinished = true;
  introVideo.pause();
  introVideo.controls = false;
  filmIntro.hidden = true;
  document.getElementById('cover').hidden = false;
  window.scrollTo({top:0,behavior:'auto'});
  document.getElementById('open-letter').focus({preventScroll:true});
}

playIntro.addEventListener('click', async () => {
  if (introFinished || playIntro.disabled) return;
  playIntro.disabled = true;
  stopMusic();
  introVideo.controls = true;
  try {
    await introVideo.play();
    if (introFinished || document.hidden) introVideo.pause();
  } catch {
    if (!introFinished) {
      playIntro.hidden = false;
      introStatus.textContent = '轻触播放重试，或直接拆开邀请。';
    }
  } finally { playIntro.disabled = false; }
});

introVideo.addEventListener('play', () => {
  if (introFinished) { introVideo.pause(); return; }
  stopMusic();
  playIntro.hidden = true;
  introStatus.textContent = '把这份欢喜，先讲给你听。';
});
introVideo.addEventListener('pause', () => {
  if (introFinished || introVideo.ended) return;
  playIntro.hidden = false;
  introPlayLabel.textContent = '继续播放';
  playIntro.setAttribute('aria-label','继续播放开场短片');
});
introVideo.addEventListener('error', () => {
  if (introFinished) return;
  playIntro.hidden = false;
  introStatus.textContent = '短片暂时未能播放，可以直接拆开邀请。';
});
// The one-second final-frame hold and complete original dialogue are in the video.
introVideo.addEventListener('ended', finishIntro);
document.getElementById('skip-intro').addEventListener('click', finishIntro);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !introFinished) introVideo.pause();
});
