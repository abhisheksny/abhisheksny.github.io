const CFG = {
  particlesDesktop: 42000, particlesLowEnd: 24000, particlesMobile: 12000,
  bloom: 0.55, bloomRadius: 0.4,
  spring: 5.0, damping: 3.2,
  fieldRadius: 2.7, fieldPush: 55, fieldSwirl: 0.35,
  rotateSpeed: 0.12,
  netNodesDesktop: 150, netNodesMobile: 70
};

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = x => x * x * (3 - 2 * x);

/* ---------- Scroll reveal + card spotlight ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => reduce ? el.classList.add("in") : io.observe(el));
document.querySelectorAll(".card, .link-grid a").forEach(el => {
  el.addEventListener("pointermove", e => {
    const b = el.getBoundingClientRect();
    el.style.setProperty("--mx", (e.clientX - b.left) + "px");
    el.style.setProperty("--my", (e.clientY - b.top) + "px");
  });
});

/* ---------- Scroll HUD: progress bar + section rail ---------- */
const bar = document.createElement("div"); bar.className = "progress"; document.body.appendChild(bar);
const rail = document.createElement("nav"); rail.className = "rail"; rail.setAttribute("aria-label", "Section navigation");
[["top", "Hero"], ["about", "About"], ["research", "Research"], ["projects", "Projects"], ["publications", "Publications"], ["links", "Links"]].forEach(([id, t]) => {
  const a = document.createElement("a"); a.href = "#" + id; a.dataset.id = id; a.innerHTML = `<span>${t}</span><i></i>`; rail.appendChild(a);
});
document.body.appendChild(rail);
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) rail.querySelectorAll("a").forEach(a => a.classList.toggle("on", a.dataset.id === e.target.dataset.rail));
}), { rootMargin: "-45% 0px -50% 0px" });
[[document.querySelector(".hero"), "top"], ...["about", "research", "projects", "publications", "links"].map(i => [document.getElementById(i), i])]
  .forEach(([el, id]) => { if (el) { el.dataset.rail = id; spy.observe(el); } });
addEventListener("scroll", () => {
  bar.style.transform = `scaleX(${clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1)})`;
}, { passive: true });

/* ---------- Page-wide particle scene ---------- */
async function initHero() {
  const hero = document.querySelector(".hero");
  const canvas = document.getElementById("hero-canvas");
  const cursorEl = document.querySelector(".cursor-field");
  const navEl = document.querySelector(".nav");

  let THREE, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
  try {
    THREE = await import("three");
    ({ EffectComposer } = await import("three/addons/postprocessing/EffectComposer.js"));
    ({ RenderPass } = await import("three/addons/postprocessing/RenderPass.js"));
    ({ UnrealBloomPass } = await import("three/addons/postprocessing/UnrealBloomPass.js"));
    ({ OutputPass } = await import("three/addons/postprocessing/OutputPass.js"));
  } catch (err) { document.body.classList.add("no-webgl"); console.warn("Three.js failed to load", err); return; }

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" }); }
  catch (err) { document.body.classList.add("no-webgl"); return; }

  const small = innerWidth < 760;
  const lowEnd = (navigator.hardwareConcurrency || 4) <= 4;
  const override = Number(new URLSearchParams(location.search).get("particles"));
  const N = override > 0 ? override : (coarse || small) ? CFG.particlesMobile : lowEnd ? CFG.particlesLowEnd : CFG.particlesDesktop;
  const countEl = document.getElementById("hud-count");
  if (countEl) countEl.textContent = N.toLocaleString("en-US");

  const dpr = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x050403, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
  camera.position.z = 20;

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), CFG.bloom, CFG.bloomRadius, 0.12);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const vertexShader = `
    uniform float uTime, uPx, uDim;
    attribute float aSize, aSeed, aEnergy;
    attribute vec3 aColor;
    varying vec3 vC; varying float vA;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float tw = 0.75 + 0.25 * sin(uTime * 1.3 + aSeed * 40.0);
      gl_PointSize = aSize * uPx * (24.0 / -mv.z) * (1.0 + aEnergy * 0.8);
      vC = mix(aColor, vec3(1.0), aEnergy * 0.45) * (1.0 + aEnergy * 0.8);
      vA = tw * (0.55 + aEnergy * 0.45) * clamp(1.0 - (-mv.z - 14.0) / 40.0, 0.2, 1.0) * uDim;
      gl_Position = projectionMatrix * mv;
    }`;
  const fragmentShader = `
    varying vec3 vC; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d); a *= a;
      gl_FragColor = vec4(vC, a * vA);
    }`;
  const uTime = { value: 0 }, uPx = { value: dpr };
  const mkMat = dim => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader, fragmentShader,
    uniforms: { uTime, uPx, uDim: { value: dim } }
  });
  const material = mkMat(1), netMat = mkMat(0);

  /* ----- DNA ----- */
  const R = 1.7, H = 20, TURNS = 5, RUNGS = 70, TILT = 0.32;
  // amber palette (key names kept so the rest of the code is unchanged)
  const PAL = { cyan: [1, 0.72, 0.3], blue: [1, 0.5, 0.18], white: [1, 0.94, 0.85], gold: [1, 0.85, 0.5] };
  const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;
  const strand = (t, ph) => { const a = t * TURNS * Math.PI * 2 + ph; return [R * Math.cos(a), (t - 0.5) * H, R * Math.sin(a)]; };

  const rest = new Float32Array(N * 3), pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
  const spd = new Float32Array(N), size = new Float32Array(N), seed = new Float32Array(N);
  const col = new Float32Array(N * 3), energy = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const k = Math.random(); let p, c, s = 0.6 + Math.random() * 0.8;
    if (k < 0.7) {
      const ph = Math.random() < 0.5 ? 0 : Math.PI;
      if (Math.random() < 0.07) {
        const t = (Math.floor(Math.random() * RUNGS) + 0.5) / RUNGS, q = strand(t, ph);
        p = [q[0] + g() * 0.28, q[1] + g() * 0.28, q[2] + g() * 0.28]; s *= 1.5;
      } else { const q = strand(Math.random(), ph); p = [q[0] + g() * 0.09, q[1] + g() * 0.09, q[2] + g() * 0.09]; }
      const r = Math.random(); c = r < 0.62 ? PAL.cyan : r < 0.85 ? PAL.blue : r < 0.95 ? PAL.white : PAL.gold;
    } else if (k < 0.9) {
      const t = (Math.floor(Math.random() * RUNGS) + 0.5) / RUNGS, a = strand(t, 0), b = strand(t, Math.PI), u = Math.random();
      p = [a[0] + (b[0] - a[0]) * u + g() * 0.05, a[1] + (b[1] - a[1]) * u + g() * 0.05, a[2] + (b[2] - a[2]) * u + g() * 0.05];
      c = u < 0.5 ? (Math.random() < 0.5 ? PAL.gold : PAL.white) : PAL.cyan; s *= 0.85;
    } else {
      const rad = 2.6 + Math.random() * 2.4, ang = Math.random() * 6.283;
      p = [rad * Math.cos(ang), (Math.random() - 0.5) * H, rad * Math.sin(ang)];
      spd[i] = (Math.random() < 0.5 ? -1 : 1) * (0.15 + Math.random() * 0.35);
      c = Math.random() < 0.6 ? PAL.white : PAL.cyan; s *= 0.6;
    }
    if (Math.random() < 0.03) s *= 2.2;
    rest.set(p, i * 3); col.set(c, i * 3); size[i] = s; seed[i] = Math.random();
    pos[i * 3] = (Math.random() - 0.5) * 60; pos[i * 3 + 1] = (Math.random() - 0.5) * 40; pos[i * 3 + 2] = -40 + Math.random() * 50;
  }

  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const enAttr = new THREE.BufferAttribute(energy, 1).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", posAttr); geo.setAttribute("aEnergy", enAttr);
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(geo, material); points.frustumCulled = false; scene.add(points);

  /* ----- starfield + dust ----- */
  const SN = 1600, T = SN + 90;
  const sp = new Float32Array(T * 3), ss = new Float32Array(T), sd = new Float32Array(T), se = new Float32Array(T), sc = new Float32Array(T * 3);
  for (let i = 0; i < T; i++) {
    const dust = i >= SN, rad = 45 + Math.random() * 70, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
    sp.set([rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th) * 0.7, -Math.abs(rad * Math.cos(ph)) - 10], i * 3);
    ss[i] = dust ? 26 + Math.random() * 20 : 0.5 + Math.random() * 0.9; sd[i] = Math.random();
    const b = dust ? 0.05 : 0.35 + Math.random() * 0.4; sc.set([b, b * 0.85, b * 0.65], i * 3);
  }
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  sgeo.setAttribute("aSize", new THREE.BufferAttribute(ss, 1));
  sgeo.setAttribute("aSeed", new THREE.BufferAttribute(sd, 1));
  sgeo.setAttribute("aEnergy", new THREE.BufferAttribute(se, 1));
  sgeo.setAttribute("aColor", new THREE.BufferAttribute(sc, 3));
  const stars = new THREE.Points(sgeo, material); stars.frustumCulled = false; scene.add(stars);

  /* ----- neural graph + holographic rings (fade in as you scroll) ----- */
  const NN = coarse || small ? CFG.netNodesMobile : CFG.netNodesDesktop;
  const net = new THREE.Group(); net.position.z = -8; scene.add(net);
  const np = [], nPos = new Float32Array(NN * 3), nCol = new Float32Array(NN * 3), nSize = new Float32Array(NN), nSeed = new Float32Array(NN);
  const isHub = i => i % 11 === 0;
  for (let i = 0; i < NN; i++) {
    const r = 5 + Math.random() * 8, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
    const p = [r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th) * 0.8, r * Math.cos(ph)];
    np.push(p); nPos.set(p, i * 3);
    nCol.set(isHub(i) ? PAL.gold : Math.random() < 0.7 ? PAL.cyan : PAL.white, i * 3);
    nSize[i] = isHub(i) ? 5 : 1.6 + Math.random() * 1.4; nSeed[i] = Math.random();
  }
  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.BufferAttribute(nPos, 3));
  ng.setAttribute("aSize", new THREE.BufferAttribute(nSize, 1));
  ng.setAttribute("aSeed", new THREE.BufferAttribute(nSeed, 1));
  ng.setAttribute("aEnergy", new THREE.BufferAttribute(new Float32Array(NN), 1));
  ng.setAttribute("aColor", new THREE.BufferAttribute(nCol, 3));
  const nodes = new THREE.Points(ng, netMat); nodes.frustumCulled = false; net.add(nodes);

  const ev = [], ec = [];
  for (let i = 0; i < NN; i++) {
    const d = np.map((q, j) => [j, (q[0] - np[i][0]) ** 2 + (q[1] - np[i][1]) ** 2 + (q[2] - np[i][2]) ** 2]).sort((a, b) => a[1] - b[1]);
    for (let k = 1; k <= (isHub(i) ? 5 : 2); k++) {
      const j = d[k][0], c = isHub(i) || isHub(j) ? PAL.gold : PAL.cyan;
      ev.push(...np[i], ...np[j]); ec.push(...c, ...c);
    }
  }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute("position", new THREE.Float32BufferAttribute(ev, 3));
  eg.setAttribute("color", new THREE.Float32BufferAttribute(ec, 3));
  const lineOpts = { transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending };
  const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true, ...lineOpts });
  net.add(new THREE.LineSegments(eg, edgeMat));

  const ringMat = new THREE.LineBasicMaterial({ color: 0xffb347, ...lineOpts });
  const rings = [], ringGeos = [];
  for (let k = 0; k < 3; k++) {
    const pts = [], rr = 9 + k * 2.2;
    for (let a = 0; a < 128; a++) { const t = (a / 128) * 6.283; pts.push(new THREE.Vector3(Math.cos(t) * rr, 0, Math.sin(t) * rr)); }
    const rg = new THREE.BufferGeometry().setFromPoints(pts); ringGeos.push(rg);
    const ring = new THREE.LineLoop(rg, ringMat); ring.rotation.set(0.9 + k * 0.6, k * 1.1, 0);
    net.add(ring); rings.push(ring);
  }

  /* ----- state ----- */
  const ndc = { x: 0, y: 0 };
  const mouse = new THREE.Vector3(), prevMouse = new THREE.Vector3(), mVel = new THREE.Vector3(), ray = new THREE.Vector3();
  let active = false, scrollP = 0, page = 0, netAmt = 0, rot = 0, time = 0, last = performance.now(), raf = 0;
  let live = N, slowFrames = 0, baseOx = 3.6, ox = 3.6, cx = innerWidth / 2, cy = innerHeight / 2, speed = 0;

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    baseOx = camera.aspect > 1.15 ? 3.6 : 0;
    updateScroll();
    if (reduce) frame(performance.now());
  }

  function updateScroll() {
    scrollP = clamp(scrollY / (innerHeight * 0.9), 0, 1);
    page = clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1);
    hero.style.setProperty("--p", scrollP.toFixed(3));
    canvas.style.opacity = String(1 - scrollP * 0.1);
    camera.position.z = 20 + scrollP * 4;
    material.uniforms.uDim.value = 1 - scrollP * 0.2;
    netAmt = smooth(clamp((scrollY / innerHeight - 0.35) / 0.9, 0, 1));
    if (navEl) navEl.classList.toggle("scrolled", scrollY > 40);
  }

  function updateNet() {
    net.visible = netAmt > 0.01;
    netMat.uniforms.uDim.value = netAmt; edgeMat.opacity = netAmt * 0.28; ringMat.opacity = netAmt * 0.35;
    net.rotation.y += (time * 0.05 + page * 3 + ndc.x * 0.25 - net.rotation.y) * 0.04;
    net.rotation.x += (ndc.y * 0.12 + 0.2 - net.rotation.x) * 0.04;
    net.position.x = Math.sin(page * 5) * 2.5;
    rings.forEach((r, i) => { r.rotation.z = time * (0.08 + i * 0.03); });
  }

  function mouseWorld() {
    ray.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(camera.position).normalize();
    mouse.copy(camera.position).addScaledVector(ray, -camera.position.z / ray.z);
  }

  function step(dt) {
    const K = reduce ? 0 : 1.4 + 3.6 * Math.min(1, time / 3) * (CFG.spring / 5);
    const C = CFG.damping, R2 = CFG.fieldRadius * CFG.fieldRadius;
    const breathe = reduce ? 1 : 1 + 0.025 * Math.sin(time * 0.6);
    const ct = Math.cos(TILT), st = Math.sin(TILT);
    const oy = scrollP * 3, baseRot = rot + page * 6;
    const bc = Math.cos(baseRot), bs = Math.sin(baseRot);
    const push = active ? CFG.fieldPush * clamp(speed * 0.3, 0, 1) : 0, swirl = push * CFG.fieldSwirl;
    const mx = mouse.x, my = mouse.y, mz = mouse.z, vx0 = mVel.x * 2.5, vy0 = mVel.y * 2.5;

    for (let i = 0; i < live; i++) {
      const j = i * 3;
      let cc = bc, ss2 = bs;
      if (spd[i] !== 0) { const a = baseRot + spd[i] * time; cc = Math.cos(a); ss2 = Math.sin(a); }
      const x = rest[j] * breathe, y = rest[j + 1], z = rest[j + 2] * breathe;
      const rx = x * cc + z * ss2, rz = -x * ss2 + z * cc;
      const tx = rx * ct - y * st + ox, ty = rx * st + y * ct + oy, tz = rz;
      if (reduce) { pos[j] = tx; pos[j + 1] = ty; pos[j + 2] = tz; energy[i] = 0; continue; }
      let X = pos[j], Y = pos[j + 1], Z = pos[j + 2];
      let ax = (tx - X) * K - vel[j] * C, ay = (ty - Y) * K - vel[j + 1] * C, az = (tz - Z) * K - vel[j + 2] * C;
      if (push > 0) {
        const dx = X - mx, dy = Y - my, dz = (Z - mz) * 0.6, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < R2 * 4) {
          const f = Math.exp(-d2 / R2), inv = 1 / (Math.sqrt(d2) + 0.001);
          ax += dx * inv * f * push - dy * inv * f * swirl + vx0 * f;
          ay += dy * inv * f * push + dx * inv * f * swirl + vy0 * f;
          az += dz * inv * f * push * 0.5;
        }
      }
      vel[j] += ax * dt; vel[j + 1] += ay * dt; vel[j + 2] += az * dt;
      X += vel[j] * dt; Y += vel[j + 1] * dt; Z += vel[j + 2] * dt;
      pos[j] = X; pos[j + 1] = Y; pos[j + 2] = Z;
      energy[i] += (Math.min(1, Math.hypot(tx - X, ty - Y, tz - Z) * 0.6) - energy[i]) * 0.18;
    }
    posAttr.needsUpdate = true; enAttr.needsUpdate = true;
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now;
    if (!reduce) { time += dt; rot += dt * CFG.rotateSpeed; }
    uTime.value = time;
    stars.rotation.y = time * 0.01 + page * 0.8;
    ox = baseOx * Math.cos(page * 6.5);
    updateNet();

    if (active) {
      mouseWorld();
      mVel.copy(mouse).sub(prevMouse).multiplyScalar(1 / Math.max(dt, 0.001));
      speed += (mVel.length() - speed) * 0.2; prevMouse.copy(mouse);
    } else { speed *= 0.85; mVel.multiplyScalar(0.85); }

    step(dt);
    geo.setDrawRange(0, live);
    composer.render();

    if (cursorEl && !coarse) {
      cx += (((ndc.x + 1) / 2) * innerWidth - cx) * 0.2; cy += (((1 - ndc.y) / 2) * innerHeight - cy) * 0.2;
      cursorEl.style.transform = `translate(${cx}px,${cy}px) scale(${1 + clamp(speed * 0.08, 0, 0.5)})`;
    }
    if (!reduce && time > 3) {
      slowFrames = dt > 1 / 38 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 90 && live > 8000) { live = Math.max(8000, Math.floor(live * 0.7)); slowFrames = 0; }
    }
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  /* ----- events ----- */
  const onMove = e => {
    if (reduce) return;
    ndc.x = (e.clientX / innerWidth) * 2 - 1; ndc.y = -((e.clientY / innerHeight) * 2 - 1);
    if (!active) { mouseWorld(); prevMouse.copy(mouse); cx = e.clientX; cy = e.clientY; }
    active = true; cursorEl && cursorEl.classList.add("on");
  };
  const onLeave = () => { active = false; cursorEl && cursorEl.classList.remove("on"); };
  const onUp = e => { if (e.pointerType === "touch") onLeave(); };
  const onScroll = () => { updateScroll(); if (reduce) frame(performance.now()); };

  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerup", onUp, { passive: true });
  document.documentElement.addEventListener("mouseleave", onLeave);
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", resize);
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); cancelAnimationFrame(raf); document.body.classList.add("no-webgl"); });

  function dispose() {
    cancelAnimationFrame(raf);
    removeEventListener("pointermove", onMove); removeEventListener("pointerup", onUp);
    removeEventListener("scroll", onScroll); removeEventListener("resize", resize);
    [geo, sgeo, ng, eg, ...ringGeos, material, netMat, edgeMat, ringMat].forEach(o => o.dispose());
    composer.dispose(); renderer.dispose();
  }
  addEventListener("pagehide", dispose, { once: true });

  resize();
  if (reduce) frame(performance.now()); else start();
}

const boot = () => initHero().catch(err => { document.body.classList.add("no-webgl"); console.warn(err); });
document.readyState === "complete" ? boot() : addEventListener("load", boot, { once: true });

/* ---------- Light / night toggle ---------- */
(function () {
  const root = document.documentElement, nav = document.querySelector(".nav");
  const meta = document.querySelector('meta[name="theme-color"]');
  const get = () => { try { return localStorage.getItem("theme"); } catch { return null; } };
  const put = v => { try { localStorage.setItem("theme", v); } catch {} };
  const btn = document.createElement("button");
  btn.className = "theme-toggle"; btn.type = "button";
  function apply(t) {
    root.dataset.theme = t;
    btn.textContent = t === "light" ? "☾ Night" : "☀ Light";
    btn.setAttribute("aria-label", t === "light" ? "Switch to night mode" : "Switch to light mode");
    if (meta) meta.content = t === "light" ? "#f6f1ea" : "#050403";
  }
  apply(get() === "light" ? "light" : "dark");
  btn.addEventListener("click", () => {
    const n = root.dataset.theme === "light" ? "dark" : "light";
    apply(n); put(n);
  });
  if (nav) nav.appendChild(btn);
})();
