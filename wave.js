// Hero: a moving band of light seen through ribbed (reeded) glass, drawn live in WebGL, with film grain.
// Pauses off screen / in a hidden tab; draws one still frame for visitors who prefer reduced motion.
(() => {
  const canvas = document.querySelector('.wave');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return; // the dark hero background still looks right without it

  const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const fs = `
precision highp float;
uniform vec2 R; uniform float T;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float band(float y, float c, float w){ float d = (y - c) / w; return exp(-d * d); }
float wave(float x, float y, float t){
  float c1 = 0.30 + 0.40 * x + 0.09 * sin(x * 5.0 - t * 0.45) + 0.04 * sin(x * 11.0 + t * 0.8);
  float b1 = band(y, c1, 0.075 + 0.04 * sin(x * 3.0 + t * 0.35));
  float b2 = band(y, c1 - 0.09 + 0.05 * sin(x * 4.0 - t * 0.3), 0.20) * 0.62;
  float b3 = band(y, 0.86 - 0.14 * x + 0.06 * sin(x * 6.0 + t * 0.6), 0.09) * 0.22;
  return b1 * 1.05 + b2 + b3;
}
void main(){
  vec2 uv = gl_FragCoord.xy / R;
  float W = max(6.0, R.x / 90.0);                 // rib width in device pixels
  float cell = floor(gl_FragCoord.x / W);
  float u = fract(gl_FragCoord.x / W);
  float xs = (cell + 0.5 + (u - 0.5) * 0.3) * W / R.x;           // each rib samples a narrow strip
  float y = uv.y + (u - 0.5) * 0.17 * (0.6 + 0.4 * sin(xs * 8.0 - T * 0.4)); // shear inside the rib: the saw-tooth edges
  float v = wave(xs, y, T);
  v *= 0.58 + 0.42 * pow(sin(u * 3.14159), 0.7);                 // bright rib centre, dark rib edge
  v *= mix(0.22, 1.0, smoothstep(0.02, 0.5, uv.y));              // keep the lower third dark so the name stays readable
  v += (hash(gl_FragCoord.xy + floor(T * 24.0)) - 0.5) * 0.11;   // film grain
  vec2 q = uv - 0.5; v *= 1.0 - dot(q, q) * 0.85;
  v = pow(clamp(v, 0.0, 1.0), 1.12);
  gl_FragColor = vec4(vec3(v) * vec3(1.0, 0.99, 0.97), 1.0);
}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'R'), uT = gl.getUniformLocation(prog, 'T');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, visible = true, t0 = performance.now();
  const size = () => {
    const s = Math.min(devicePixelRatio || 1, 1.5) * 0.8; // lower than full resolution: the grain hides it, the GPU stays cool
    canvas.width = Math.round(canvas.clientWidth * s); canvas.height = Math.round(canvas.clientHeight * s);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const draw = (t) => { gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, t); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  const frame = (now) => { draw((now - t0) / 1000 + 4); raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0; };
  const start = () => { if (!raf && !reduce) raf = requestAnimationFrame(frame); };

  size(); draw(6.0);
  addEventListener('resize', () => { size(); draw(6.0); });
  if (reduce) return;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(canvas);
  document.addEventListener('visibilitychange', start);
  start();
})();
