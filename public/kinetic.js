// js/kinetic.js - Brand Motion renderer v3 (fit-to-width, URL end card, per-user handle)
const VK_BRAND = { bg:'#0a0a0a', fg:'#ffffff', highlight:'#FFD400', underline:'#00C853', stripe:'#F43F5E' };

function vkHandle() {
  try {
    const h = localStorage.getItem('vk_handle');
    if (h) return h;
    const u = JSON.parse(localStorage.getItem('vk_user') || 'null');
    if (u && u.name) return '@' + String(u.name).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18);
  } catch(e) {}
  return '@yourbrand';
}

// Greedy wrap by measured width; shrink font until lines fit maxLines
function _kinWrapFit(ctx, words, maxW, maxSize, minSize, maxLines) {
  for (let size = maxSize; size >= minSize; size -= 6) {
    ctx.font = '800 ' + size + 'px Syne, sans-serif';
    const spaceW = ctx.measureText(' ').width;
    const lines = []; let cur = []; let curW = 0;
    for (const w of words) {
      const ww = ctx.measureText(w).width;
      if (cur.length && curW + spaceW + ww > maxW) { lines.push(cur); cur = []; curW = 0; }
      cur.push(w);
      curW += (cur.length > 1 ? spaceW : 0) + ww;
    }
    if (cur.length) lines.push(cur);
    if (lines.length <= maxLines) return { lines: lines, size: size };
  }
  ctx.font = '800 ' + minSize + 'px Syne, sans-serif';
  const lines = [];
  for (let i = 0; i < words.length; i += 4) lines.push(words.slice(i, i + 4));
  return { lines: lines.slice(0, maxLines), size: minSize };
}

function _kinDraw(ctx, W, H, scene, idx, lastIdx, B, opts, tIn, full) {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = B.bg;
  ctx.fillRect(0, 0, W, H);

  if (scene.isUrlCard) {
    ctx.textAlign = 'center';
    ctx.font = '700 40px Syne, sans-serif';
    ctx.fillStyle = B.fg;
    ctx.fillText('FIND ME HERE', W / 2, H / 2 - 130);
    const fit = _kinWrapFit(ctx, String(scene.narration || '').replace(/^https?:\/\//, '').split(/\s+/).filter(Boolean), W - 140, 64, 36, 2);
    ctx.font = '800 ' + fit.size + 'px Syne, sans-serif';
    ctx.fillStyle = B.highlight;
    let uy = H / 2;
    for (const ln of fit.lines) { ctx.fillText(ln.join(' '), W / 2, uy); uy += fit.size + 20; }
    ctx.fillStyle = B.underline;
    ctx.fillRect(W / 2 - 80, uy + 4, 160, 10);
    ctx.textAlign = 'left';
  } else if (scene.isHookFrame) {
    // hazard stripes + dark band + big fitted hook
    ctx.save();
    for (let x = -H; x < W + H; x += 130) {
      ctx.fillStyle = ((x / 130) % 2 === 0) ? B.highlight : '#141414';
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + 65, 0); ctx.lineTo(x + 65 - H, H); ctx.lineTo(x - H, H);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, H * 0.26, W, H * 0.48);
    const hook = (scene.hookText || scene.narration || '').toUpperCase();
    const fit = _kinWrapFit(ctx, hook.split(/\s+/).filter(Boolean), W - 140, 92, 48, 4);
    ctx.font = '800 ' + fit.size + 'px Syne, sans-serif';
    ctx.textAlign = 'center';
    let y = H / 2 - ((fit.lines.length - 1) * (fit.size + 34)) / 2;
    for (const ln of fit.lines) { ctx.fillStyle = B.fg; ctx.fillText(ln.join(' '), W / 2, y); y += fit.size + 34; }
    ctx.textAlign = 'left';
  } else {
    // centered fitted lines, yellow punchline, green underline
    const words = (scene.narration || '').trim().split(/\s+/).filter(Boolean);
    const fit = _kinWrapFit(ctx, words, W - 120, 74, 40, 4);
    const hl = (scene.highlight || '').toLowerCase();
    const lineH = fit.size + 40;
    ctx.font = '800 ' + fit.size + 'px Syne, sans-serif';
    const spaceW = ctx.measureText(' ').width;
    let y = H / 2 - ((fit.lines.length - 1) * lineH) / 2;
    const totalWords = words.length || 1;
    let wSeen = 0;
    for (const ln of fit.lines) {
      const text = ln.join(' ');
      const widths = ln.map(w => ctx.measureText(w).width);
      const lineW = widths.reduce((a, b) => a + b, 0) + spaceW * (ln.length - 1);
      let x = (W - lineW) / 2;
      const isHl = hl && hl.length > 3 && text.toLowerCase().includes(hl.slice(0, 12));
      for (let k = 0; k < ln.length; k++) {
        const t = (wSeen / totalWords) * 1.2;
        ctx.fillStyle = (full || tIn >= t) ? (isHl ? B.highlight : B.fg) : 'rgba(255,255,255,0.13)';
        ctx.fillText(ln[k], x, y);
        x += widths[k] + spaceW;
        wSeen++;
      }
      if (isHl) { ctx.fillStyle = B.underline; ctx.fillRect(W / 2 - Math.min(lineW, 240) / 2, y + lineH / 2 - 6, Math.min(lineW, 240), 10); }
      y += lineH;
    }
  }

  // brand stripe
  ctx.fillStyle = B.stripe;
  ctx.fillRect(0, 0, 26, H);

  // pinned corner URL (channel-bug style)
  if (opts.ctaUrl && (opts.linkMode === 'corner' || opts.linkMode === 'both')) {
    ctx.font = '700 26px Syne, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'right';
    ctx.fillText(String(opts.ctaUrl).replace(/^https?:\/\//, '').slice(0, 34), W - 40, 60);
    ctx.textAlign = 'left';
  }

  // final card: CTA + URL
  if (idx === lastIdx) {
    ctx.textAlign = 'center';
    if (opts.ctaText) {
      ctx.font = '800 44px Syne, sans-serif';
      ctx.fillStyle = B.highlight;
      ctx.fillText(String(opts.ctaText).slice(0, 46), W / 2, H - 210);
    }
    if (opts.ctaUrl) {
      ctx.font = '700 34px Syne, sans-serif';
      ctx.fillStyle = B.fg;
      ctx.fillText(String(opts.ctaUrl).replace(/^https?:\/\//, '').slice(0, 40), W / 2, H - 140);
    }
    ctx.textAlign = 'left';
  }

  // per-user handle + VideoKit mark
  ctx.font = '700 34px Syne, sans-serif';
  ctx.fillStyle = B.fg;
  ctx.fillText(vkHandle(), 44, H - 64);
  ctx.font = '700 22px Syne, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.textAlign = 'right';
  ctx.fillText('VideoKit', W - 24, H - 60);
  ctx.textAlign = 'left';
}

async function renderKineticVideo(scenes, audioBlob, brand, opts) {
  opts = opts || {};
  const B = Object.assign({}, VK_BRAND, brand || {});
  const W = 720, H = 1280, FPS = 30;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const target = (opts.totalLen || 60) + 0.4;
  const charCounts = scenes.map(s => s.isUrlCard ? 0 : Math.max((s.narration || '').length, 10));
  const totalChars = charCounts.reduce((a, b) => a + b, 0) || 1;
  let run = 0;
  const durations = charCounts.map((cnt, i) => {
    if (scenes[i].isUrlCard) { run += 2.5; return 2.5; }
    if (i === charCounts.length - 1) return Math.max(2, Math.round((target - run) * 10) / 10);
    const d = Math.max(2, Math.round((cnt / totalChars) * target));
    run += d; return d;
  });
  const total = durations.reduce((a, b) => a + b, 0);
  const lastIdx = scenes.length - 1;

  let audioEl = null, musicEl = null, actx = null, dest = null;
  if (audioBlob || opts.musicUrl) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    try { if (actx.state === 'suspended') await actx.resume(); } catch(e) {}
    dest = actx.createMediaStreamDestination();
    if (audioBlob) {
      audioEl = new Audio(URL.createObjectURL(audioBlob));
      actx.createMediaElementSource(audioEl).connect(dest);
    }
    if (opts.musicUrl) {
      musicEl = new Audio(opts.musicUrl);
      musicEl.crossOrigin = 'anonymous';
      const g = actx.createGain(); g.gain.value = 0.25;
      actx.createMediaElementSource(musicEl).connect(g); g.connect(dest);
    }
  }

  const stream = canvas.captureStream(FPS);
  if (dest) dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus'
    : (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm');
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5000000 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };

  return new Promise((resolve) => {
    rec.start(500);
    if (audioEl) audioEl.play().catch(() => {});
    if (musicEl) musicEl.play().catch(() => {});
    const t0 = performance.now();
    function frame() {
      const el = (performance.now() - t0) / 1000;
      let acc = 0, idx = lastIdx, tIn = 0;
      for (let i = 0; i < durations.length; i++) {
        if (el < acc + durations[i]) { idx = i; tIn = el - acc; break; }
        acc += durations[i];
      }
      _kinDraw(ctx, W, H, scenes[idx], idx, lastIdx, B, opts, tIn, false);
      if (el >= total) {
        rec.stop();
        if (audioEl) audioEl.pause();
        if (musicEl) musicEl.pause();
        rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

async function exportCarousel(sId) {
  const script = (window._scriptStore || {})[sId];
  if (!script || !script.scenes) { alert('Script not found'); return; }
  const B = VK_BRAND;
  const W = 720, H = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const scenes = script.scenes;
  const lastIdx = scenes.length - 1;
  const ctaScene = scenes.find(s => s.isCta);
  for (let i = 0; i < scenes.length; i++) {
    _kinDraw(ctx, W, H, scenes[i], i, lastIdx, B, { ctaText: (i === lastIdx && ctaScene) ? ctaScene.narration : '', ctaUrl: window._briefLinkLast || '' }, 999, true);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'videokit-card-' + (i + 1) + '.png';
    a.click();
    await new Promise(r => setTimeout(r, 400));
  }
}
