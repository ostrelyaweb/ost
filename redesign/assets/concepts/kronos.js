const video = document.getElementById('kr-video');
const play = document.getElementById('kr-play');
const playLabel = document.getElementById('kr-play-label');
const playIcon = document.getElementById('kr-play-icon');
const seek = document.getElementById('kr-seek');
const clock = document.getElementById('kr-time');
const wave = document.getElementById('kr-wave');
const waveGraphic = document.getElementById('kr-wave-svg');
const status = document.getElementById('kr-status');
const mixes = [...document.querySelectorAll('[data-mix]')];
const samples = [...document.querySelectorAll('.kr-recording audio')];
const AudioEngine = window.AudioContext || window.webkitAudioContext;
const prompt = status.textContent;
let context;
let gains;
let waveforms;
let activeMix = 0;
let frame = 0;

function connectAudio() {
  if (context) return;
  context = new AudioEngine();
  const source = context.createMediaElementSource(video);
  const splitter = context.createChannelSplitter(2);
  source.connect(splitter);
  // Each channel holds a different mono mix on the same media clock.
  gains = mixes.map((button, index) => {
    const gain = context.createGain();
    gain.gain.value = index === activeMix ? 1 : 0;
    splitter.connect(gain, index, 0);
    gain.connect(context.destination);
    return gain;
  });
}

function drawWave() {
  wave.dataset.mix = activeMix;
  if (!waveforms) return;
  const bars = waveforms[activeMix].map((amplitude, index) => {
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const height = Math.max(1, amplitude * .45);
    bar.setAttribute('x', index * 3);
    bar.setAttribute('y', (48 - height) / 2);
    bar.setAttribute('width', 2);
    bar.setAttribute('height', height);
    return bar;
  });
  waveGraphic.replaceChildren(...bars);
}

function setMix(index) {
  activeMix = index;
  if (context && gains) {
    const now = context.currentTime;
    gains.forEach(({ gain }, position) => {
      gain.cancelScheduledValues(now);
      gain.setTargetAtTime(position === index ? 1 : 0, now, .015);
    });
  }
  mixes.forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
  drawWave();
}

function updateTime() {
  if (!Number.isFinite(video.duration)) return;
  seek.max = video.duration;
  seek.value = video.currentTime;
  seek.setAttribute('aria-valuetext', video.currentTime.toFixed(1) + ' seconds');
  clock.textContent = video.currentTime.toFixed(1).padStart(4, '0') + ' / ' + video.duration.toFixed(1);
  wave.style.setProperty('--progress', 100 * video.currentTime / video.duration + '%');
}

function tick() {
  updateTime();
  frame = video.paused ? 0 : requestAnimationFrame(tick);
}

function updatePlay() {
  const playing = !video.paused && !video.ended;
  playLabel.textContent = playing ? 'Pause' : video.ended ? 'Replay with sound' : 'Play with sound';
  playIcon.textContent = playing ? 'Ⅱ' : '▶';
  if (playing && !frame) frame = requestAnimationFrame(tick);
  if (!playing) {
    cancelAnimationFrame(frame);
    frame = 0;
    updateTime();
  }
}

function enableControls() {
  play.disabled = !AudioEngine || !Number.isFinite(video.duration) || Boolean(video.error);
  seek.disabled = play.disabled || !Number.isFinite(video.duration);
  mixes.forEach((button) => { button.disabled = play.disabled; });
}

play.addEventListener('click', async () => {
  if (!video.paused) {
    video.pause();
    return;
  }
  try {
    connectAudio();
    if (!gains) throw new Error('Audio routing unavailable');
    samples.forEach((sample) => sample.pause());
    const resume = context.resume();
    if (video.ended) video.currentTime = 0;
    await Promise.all([resume, video.play()]);
    status.textContent = prompt;
  } catch {
    video.pause();
    status.textContent = 'The comparison could not start. You can still play the WAV cuts below.';
  }
});

mixes.forEach((button, index) => button.addEventListener('click', () => setMix(index)));
seek.addEventListener('input', () => {
  video.currentTime = seek.valueAsNumber;
  updateTime();
});
samples.forEach((sample) => sample.addEventListener('play', () => {
  video.pause();
  samples.filter((other) => other !== sample).forEach((other) => other.pause());
}));
video.addEventListener('loadedmetadata', () => {
  enableControls();
  updateTime();
});
video.addEventListener('seeked', updateTime);
['play', 'pause', 'ended'].forEach((event) => video.addEventListener(event, updatePlay));
video.addEventListener('error', () => {
  enableControls();
  status.textContent = 'The scene could not load. You can still play the WAV cuts below.';
});

enableControls();
if (AudioEngine) {
  status.textContent = 'Loading the scene…';
  // A local Blob also supports seeking on static hosts without byte-range requests.
  fetch(video.dataset.source)
    .then((response) => {
      if (!response.ok) throw new Error('Scene unavailable');
      return response.blob();
    })
    .then((media) => {
      video.src = URL.createObjectURL(media);
      status.textContent = prompt;
    })
    .catch(() => { status.textContent = 'The scene could not load. You can still play the WAV cuts below.'; });
} else {
  status.textContent = 'This browser can play the WAV cuts below.';
}
updateTime();
fetch('kronos-media/waves.json')
  .then((response) => {
    if (!response.ok) throw new Error('Waveforms unavailable');
    return response.json();
  })
  .then((data) => { waveforms = data; drawWave(); })
  .catch(() => wave.classList.add('kr-wave-fallback'));
