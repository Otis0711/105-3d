// QR 標記定位：由 QR 四個角點的影像座標，推算手機鏡頭在世界座標中的位置與朝向。
// 影像座標：像素，x 向右、y 向下；鏡頭座標（OpenCV 慣例）：x 右、y 下、z 往前。
// 標記座標 (u, v, w)：原點在 QR 左上角，u 往右、v 往下（公尺），w = u × v（指向牌子背面）。
// 世界座標（three.js）：x = E − E0，y = 高程，z = −(N − N0)。

// 解 n×n 線性方程（部分選主元高斯消去）
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}

// 四點單應矩陣：src（標記平面 u,v）→ dst（像素 x,y），回傳 3×3（列優先）
export function homography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  const h = solve(A, b);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, s) => a.map(x => x * s);

// corners：[TL, TR, BR, BL] 像素座標；size：QR 邊長（公尺）；f：焦距（像素）；cx, cy：影像中心
// 回傳鏡頭在標記座標的位置 C、光軸方向 fwd、影像下方方向 down
export function poseFromCorners(corners, size, f, cx, cy) {
  const H = homography([[0, 0], [size, 0], [size, size], [0, size]], corners);
  const col = j => [(H[j] - cx * H[6 + j]) / f, (H[3 + j] - cy * H[6 + j]) / f, H[6 + j]]; // K⁻¹·H 的第 j 行
  const m1 = col(0), m2 = col(1), m3 = col(2);
  let l = 2 / (Math.hypot(...m1) + Math.hypot(...m2));
  if (m3[2] * l < 0) l = -l; // 標記必須在鏡頭前方
  let r1 = mul(m1, l), r2 = mul(m2, l); const t = mul(m3, l);
  // 讓 r1、r2 正交（對稱修正）
  const a = norm(r1), b = norm(r2), x = norm(add(a, b)), y = norm(sub(a, b));
  r1 = mul(add(x, y), Math.SQRT1_2); r2 = mul(sub(x, y), Math.SQRT1_2);
  const r3 = cross(r1, r2);
  // R 的行為 r1 r2 r3：X_cam = R·X_marker + t → 鏡頭中心 C = −Rᵀt
  const C = [-dot(r1, t), -dot(r2, t), -dot(r3, t)];
  const fwd = [r1[2], r2[2], r3[2]], down = [r1[1], r2[1], r3[1]];
  return { C, fwd, down, dist: Math.hypot(...t) };
}

// 標記在世界座標的框架。m 可以是：
//   { TL:{E,N,H}, TR:{E,N,H}, BL:{E,N,H} }（量 QR 三個角），或
//   { E, N, H（QR 中心）, facing（QR 正面朝向的方位角，度，順時針自北）, size }（垂直立牌）
export function markerFrame(m, E0, N0) {
  const W = p => [p.E - E0, p.H, -(p.N - N0)];
  let TL, TR, BL;
  if (m.TL && m.TR && m.BL) { TL = W(m.TL); TR = W(m.TR); BL = W(m.BL); }
  else {
    const s = m.size, az = (m.facing - 90) * Math.PI / 180;            // 站在牌前看，右手方向
    const u = [Math.sin(az), 0, -Math.cos(az)], up = [0, 1, 0], c = W(m);
    TL = add(add(c, mul(u, -s / 2)), mul(up, s / 2)); TR = add(TL, mul(u, s)); BL = sub(TL, mul(up, s));
  }
  const size = m.size || Math.hypot(...sub(TR, TL));
  const eu = norm(sub(TR, TL)); let ev = sub(BL, TL); ev = norm(sub(ev, mul(eu, dot(ev, eu)))); const ew = cross(eu, ev);
  return { TL, TR, BL, BR: add(TR, sub(BL, TL)), eu, ev, ew, size };
}

// 以陀螺儀的俯仰／側滾為準，只解「水平旋轉 α + 鏡頭位置 c」（4 個未知數），比完整 6 自由度穩定很多。
// Rdev：陀螺儀給的鏡頭姿態（3×3，行 = three.js 鏡頭 x右、y上、z後 在世界中的方向；水平方向可任意）
// 鏡頭在世界的姿態 = Ry(α)·Rdev。cornersW：四角世界座標；回傳 { alpha, c, rms（像素） }
export function refinePose(cornersPx, cornersW, f, cx, cy, Rdev, init) {
  const proj = (p, X) => {
    const a = p[0], cs = Math.cos(a), sn = Math.sin(a);
    const d = [X[0] - p[1], X[1] - p[2], X[2] - p[3]];
    const dr = [cs * d[0] - sn * d[2], d[1], sn * d[0] + cs * d[2]]; // Ry(α)ᵀ·d
    const x = dot(Rdev[0], dr), y = dot(Rdev[1], dr), z = dot(Rdev[2], dr); // Rdevᵀ·dr（Rdev[i] 為第 i 行）
    return [cx + f * x / -z, cy - f * y / -z];
  };
  const resid = p => { const r = []; cornersW.forEach((X, i) => { const q = proj(p, X); r.push(q[0] - cornersPx[i][0], q[1] - cornersPx[i][1]); }); return r; };
  let p = [init.alpha, ...init.c];
  for (let it = 0; it < 15; it++) {
    const r0 = resid(p), J = r0.map(() => new Array(4));
    for (let j = 0; j < 4; j++) { const e = j ? 1e-5 : 1e-7, q = p.slice(); q[j] += e; const r1 = resid(q); r1.forEach((v, i) => J[i][j] = (v - r0[i]) / e); }
    const A = [0, 1, 2, 3].map(a => [0, 1, 2, 3].map(b => J.reduce((s, row) => s + row[a] * row[b], 0) + (a === b ? 1e-9 : 0)));
    const g = [0, 1, 2, 3].map(a => -J.reduce((s, row, i) => s + row[a] * r0[i], 0));
    const dp = solve(A, g); p = p.map((v, i) => v + dp[i]);
    if (Math.hypot(...dp) < 1e-9) break;
  }
  const r = resid(p);
  return { alpha: p[0], c: p.slice(1), rms: Math.sqrt(r.reduce((s, v) => s + v * v, 0) / r.length) };
}

// 標記座標 → 世界座標
export const toWorld = (F, p) => add(add(add(F.TL, mul(F.eu, p[0])), mul(F.ev, p[1])), mul(F.ew, p[2]));
export const dirToWorld = (F, d) => add(add(mul(F.eu, d[0]), mul(F.ev, d[1])), mul(F.ew, d[2]));
