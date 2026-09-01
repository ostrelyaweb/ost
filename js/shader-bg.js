/* ==========================================================================
   OSTRELYA — SHADER BACKGROUND · AGGRESSIVE (copy: ostrelya-site-shader-x)
   STITCH ANIMATION_16 pushed hard: faster motion, denser technical grid,
   loud accent surges, stronger glow, full-screen presence.
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("shader-bg");
  if (!canvas) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  function ok() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }
  if (!ok()) { canvas.style.display = "none"; return; }

  function syncSize() {
    var w = canvas.clientWidth || window.innerWidth || 1280;
    var h = canvas.clientHeight || window.innerHeight || 720;
    var bw = Math.round(w * dpr);
    var bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
  }
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(syncSize).observe(canvas);
  window.addEventListener("resize", syncSize);
  syncSize();

  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) { canvas.style.display = "none"; return; }

  var vs = [
    "attribute vec2 a_position;",
    "varying vec2 v_texCoord;",
    "void main() {",
    "  v_texCoord = a_position * 0.5 + 0.5;",
    "  gl_Position = vec4(a_position, 0.0, 1.0);",
    "}"
  ].join("\n");

  var fs = [
    "precision highp float;",
    "uniform float u_time;",
    "uniform vec2 u_resolution;",
    "uniform vec2 u_mouse;",
    "varying vec2 v_texCoord;",
    "const vec3 COLOR_INK   = vec3(0.051, 0.051, 0.071);   // #0d0d12",
    "const vec3 COLOR_CREAM = vec3(0.925, 0.925, 0.941);   // #ececf0",
    "const vec3 COLOR_GOLD  = vec3(0.69, 0.50, 0.18);      // deep gold",
    "const vec3 COLOR_EMBER = vec3(0.76, 0.36, 0.26);      // soft ember",
    "const float PI = 3.14159265;",
    "float random(vec2 st) {",
    "  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);",
    "}",
    "float noise(vec2 st) {",
    "  vec2 i = floor(st);",
    "  vec2 f = fract(st);",
    "  float a = random(i);",
    "  float b = random(i + vec2(1.0, 0.0));",
    "  float c = random(i + vec2(0.0, 1.0));",
    "  float d = random(i + vec2(1.0, 1.0));",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;",
    "}",
    "float fbm(vec2 p) {",
    "  float v = 0.0;",
    "  float a = 0.5;",
    "  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03 + sin(u_time * 0.1) * 0.12; a *= 0.5; }",
    "  return v;",
    "}",
    "void main() {",
    "  vec2 uv = v_texCoord;",
    "  vec2 p = uv * 2.0 - 1.0;",
    "  p.x *= u_resolution.x / u_resolution.y;",
    "  float t = u_time * 0.42;",
    "  float edge = 1.0 - smoothstep(0.55, 1.35, length(p));",
    // multi-octave noise, slower flow
    "  float n1 = fbm(uv * 3.2 + vec2(t * 0.20, t * -0.12));",
    "  float n2 = fbm(uv * 5.5 + vec2(t * -0.26, t * 0.36));",
    "  float n3 = noise(uv * 9.0 + vec2(t * 0.45, t * -0.28));",
    "  float combinedNoise = (n1 * 0.55 + n2 * 0.35 + n3 * 0.10);",
    // dense animated technical grid
    "  vec2 gridUV = uv * 30.0;",
    "  float gx = step(0.975, fract(gridUV.x + n1 * 0.28));",
    "  float gy = step(0.975, fract(gridUV.y + n2 * 0.20));",
    "  float gridA = (gx + gy) * (0.26 + combinedNoise * 0.26);",
    "  vec2 gridUV2 = (uv + vec2(t * 0.03, -t * 0.02)) * 52.0;",
    "  float g2x = step(0.988, fract(gridUV2.x + n3 * 0.3));",
    "  float g2y = step(0.988, fract(gridUV2.y - n3 * 0.3));",
    "  float gridB = (g2x + g2y) * (0.12 + combinedNoise * 0.20);",
    "  float grid = (gridA + gridB) * edge;",
    // scanlines, softer
    "  float scanline = sin(uv.y * 260.0 + u_time * 6.0) * 0.014;",
    "  scanline += sin(uv.y * 520.0 - u_time * 9.0) * 0.008;",
    "  scanline *= edge;",
    // color + glow
    "  vec3 color = COLOR_INK;",
    "  color = mix(color, COLOR_INK + COLOR_GOLD * 0.30, combinedNoise * 0.7);",
    "  color = mix(color, COLOR_EMBER * 0.20, n2 * smoothstep(0.5, 1.0, combinedNoise) * edge);",
    "  color = mix(color, COLOR_CREAM * 0.28, grid);",
    // hard accent surges - hot bands racing across
    "  float flow = fbm(uv * 2.0 + vec2(0.0, t * 0.35));",
    "  float surge = smoothstep(0.42, 0.52, flow) - smoothstep(0.52, 0.62, flow);",
    "  color = mix(color, COLOR_GOLD, surge * 0.24 * edge);",
    "  float surge2 = smoothstep(0.72, 0.82, flow) - smoothstep(0.82, 0.90, flow);",
    "  color = mix(color, COLOR_EMBER, surge2 * 0.26 * edge);",
    // glitch rails - calmer vertical streaks
    "  float streak = smoothstep(0.94, 1.0, noise(vec2(floor(uv.y * 40.0), t * 0.42))) * (0.4 + 0.6 * sin(t * 4.0));",
    "  float streakBand = step(0.5, streak) * (0.22 + combinedNoise * 0.24);",
    "  color = mix(color, COLOR_CREAM, streakBand * 0.22 * edge);",
    // mouse-reactive blast
    "  vec2 m = u_mouse / u_resolution;",
    "  float dist = length(uv - m);",
    "  float reactive = smoothstep(0.45, 0.0, dist);",
    "  color += COLOR_GOLD * reactive * 0.15;",
    "  color += COLOR_EMBER * reactive * reactive * 0.08;",
    "  color += COLOR_CREAM * scanline;",
    // vignette
    "  color *= 1.0 - length(p * 0.34);",
    "  gl_FragColor = vec4(color, 1.0);",
    "}"
  ].join("\n");

  function cs(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("shader compile error:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  var prog = gl.createProgram();
  var sV = cs(gl.VERTEX_SHADER, vs);
  var sF = cs(gl.FRAGMENT_SHADER, fs);
  if (!sV || !sF) { canvas.style.display = "none"; return; }
  gl.attachShader(prog, sV);
  gl.attachShader(prog, sF);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("shader link error:", gl.getProgramInfoLog(prog));
    canvas.style.display = "none";
    return;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var pos = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  var uTime = gl.getUniformLocation(prog, "u_time");
  var uRes = gl.getUniformLocation(prog, "u_resolution");
  var uMouse = gl.getUniformLocation(prog, "u_mouse");

  var left = 0, top = 0;
  function origin() {
    var r = canvas.getBoundingClientRect();
    left = r.left || 0;
    top = r.top || 0;
  }
  origin();
  window.addEventListener("resize", origin);

  var mouse = { x: canvas.width / 2, y: canvas.height / 2 };
  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("mousemove", function (e) {
      var nx = (e.clientX - left) / (canvas.clientWidth || 1);
      var ny = 1 - (e.clientY - top) / (canvas.clientHeight || 1);
      mouse.x = Math.max(0, Math.min(1, nx)) * canvas.width;
      mouse.y = Math.max(0, Math.min(1, ny)) * canvas.height;
    });
  }

  var running = true;
  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver(function (en) {
      running = en[0].isIntersecting;
    }, { threshold: 0 }).observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false;
    else if (!document.hidden && !reduceMotion) running = true;
  });

  function draw(t) {
    if (running && !document.hidden) {
      if (typeof ResizeObserver === "undefined") syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    if (reduceMotion) return;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();