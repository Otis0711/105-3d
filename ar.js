// 現場 AR：手機鏡頭疊合模型
// 會自動判斷手機：
//   Android（Chrome 支援 WebXR）→ immersive-ar：手機自己追蹤移動，校正一次後可以走動。
//   iPhone／不支援 WebXR 的手機 → 相機畫面 + 陀螺儀：站在原地轉動手機看。
// 兩種校正方式：
//   ① 對準兩根樁：站在已知點（stations.json points）正上方，十字對準另一個已知點按「確定」→ 求出方向。
//      高程（自動）= 對準點地面高程 + 兩點距離 × tan(俯角)：十字對準對準點樁的入土處，同一次「確定」求出方向與高程。
//      高程（手動）= 站立點地面高程 + 手機離地高度。不使用手機 GPS（GPS 高程誤差太大）。
//   ② 掃描 QR 標記：QR 牌位置已測量（stations.json markers），手機看到 QR 的四個角 → 推算手機位置、高程與方向（qrpose.js）。
//      俯仰／側滾用陀螺儀（量重力最準），QR 只解水平方向與位置；連續偵測 10 次取平均。一律使用相機模式。
//      可再「對準遠方樁修正方向」：位置／高程沿用 QR，方向改用遠方樁（較準）。
// 座標：x = E − E0，y = 高程，z = −(N − N0)。
const { t, tc } = window;
let C, THREE, A, QP;
const LS = {
  get(k, d) { try { const v = localStorage.getItem('w3d.ar.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('w3d.ar.' + k, JSON.stringify(v)); } catch { } },
};
const DEG = Math.PI / 180;
const fmt = (v, d = 1) => Number(v).toFixed(d);
const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error(src)); document.head.appendChild(s); });

export async function startAR(ctx) {
  C = ctx; THREE = ctx.THREE;
  const { S, $ } = C;
  QP = await import('./qrpose.js?v=' + Date.now());
  document.body.classList.add('ar');
  // AR 介面放在 #arui；構件資訊視窗移進 #ar（Android WebXR 只會顯示 #ar 裡面的東西）
  $('ar').innerHTML = '<div id="arui"></div>'; $('ar').appendChild($('info'));
  // 打開構件資訊時，下方面板自動收合，讓畫面留給模型
  new MutationObserver(() => {
    if ($('info').classList.contains('hide') || A?.step !== 'view') return;
    $('ar').classList.add('min'); const b = $('armin'); if (b) b.textContent = t('展開');
  }).observe($('info'), { attributes: true, attributeFilter: ['class'] });
  C.scene.background = null;
  C.renderer.setClearColor(0x000000, 0);
  C.controls.enabled = false;
  C.solidMat.clippingPlanes = null; C.solidMat.needsUpdate = true;

  let pts = [], markers = [];
  try { const j = await (await fetch('stations.json?t=' + Date.now(), { cache: 'no-store' })).json(); pts = j.points || []; markers = j.markers || []; } catch (e) { console.error(e); }
  if (pts.length < 2) { C.toast(t('stations.json 至少需要兩個已知點'), 8000); }
  for (const m of markers) { try { m.F = QP.markerFrame(m, C.MAN.E0, C.MAN.N0); } catch (e) { console.warn('QR 標記資料有誤', m, e); } }
  let xrOK = false;
  try { xrOK = !!(window.isSecureContext && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')); } catch { }

  const qs = new URLSearchParams(location.search), qrWant = qs.get('qr');
  const phName = LS.get('phase', '');
  A = S.ar = {
    pts, markers: markers.filter(m => m.F), xrOK, kind: null, step: 'setup', update,
    method: qrWant ? 'qr' : LS.get('method', 'stake'), qrWant,
    st: pts.some(p => p.name === LS.get('st')) ? LS.get('st') : pts[0]?.name,
    tg: pts.some(p => p.name === LS.get('tg')) ? LS.get('tg') : pts[1]?.name,
    eye: LS.get('eye', 1.5), autoH: LS.get('autoH', true), fov: LS.get('fov', 66), opa: LS.get('opa', 0.85),
    phase: C.PH.indexOf(phName),      // -1 = 全部完成
    nud: 0, dh: 0, calib: null, hist: [], samples: [], zoom: 1, wp: [], hits: [], ck: LS.get('ck', ''), chk: null,
    dragYaw: 0, dragPitch: 0, devQ: null, smQ: null,
  };
  if (A.method === 'walk' && !xrOK) A.method = 'stake';
  if (A.st === A.tg) A.tg = pts.find(p => p.name !== A.st)?.name;
  window.W3D_AR = { A, C, QP }; // 方便除錯（瀏覽器主控台）

  // 已知點標桿（校正後用來檢查：紅色標桿應落在真的樁上）
  A.marks = new THREE.Group(); C.overlay.add(A.marks);
  for (const p of pts) {
    const g = new THREE.Group(); g.userData.name = p.name;
    const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15, depthTest: false, transparent: true, opacity: 0.95 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 12), mat); pole.position.y = 1.5;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat); ball.position.y = 3.1;
    pole.renderOrder = ball.renderOrder = 10;
    g.add(pole, ball); g.position.copy(pos(p, 0)); A.marks.add(g);
  }
  // QR 標記位置（紅框）：QR 定位後應疊在真的 QR 牌上
  for (const m of A.markers) {
    const F = m.F, v = [F.TL, F.TR, F.BR, F.BL].map(p => new THREE.Vector3(...p));
    const mat = new THREE.LineBasicMaterial({ color: 0xff2d2d, depthTest: false });
    const loop = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(v), mat);
    const x1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([v[0], v[2]]), mat), x2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([v[1], v[3]]), mat);
    loop.renderOrder = x1.renderOrder = x2.renderOrder = 11; A.marks.add(loop, x1, x2);
  }

  // 走點校正：地面上的瞄準圈（WebXR hit-test 打到地面的位置）
  A.reticle = new THREE.Group(); A.reticle.visible = false;
  { const m = new THREE.MeshBasicMaterial({ color: 0x22d3ee, depthTest: false, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.1, 32), m); ring.rotation.x = -Math.PI / 2;
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.015, 12), m); dot.rotation.x = -Math.PI / 2;
    ring.renderOrder = dot.renderOrder = 12; A.reticle.add(ring, dot); }
  C.scene.add(A.reticle);

  // 沒有陀螺儀或相機時（電腦測試）：拖曳畫面轉向
  let drag = null;
  C.renderer.domElement.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; });
  addEventListener('pointerup', () => drag = null);
  addEventListener('pointermove', e => {
    if (!drag || A.devQ) return;
    A.dragYaw += (e.clientX - drag.x) * 0.12 * DEG; A.dragPitch = Math.max(-1.4, Math.min(1.4, A.dragPitch + (e.clientY - drag.y) * 0.12 * DEG));
    drag = { x: e.clientX, y: e.clientY };
  });

  applyLook(); applyMarks(); findInside();
  // 設定畫面：先從站立點朝對準點看，讓使用者知道會看到什麼
  A.dragYaw = bearing(); A.dragPitch = -5 * DEG;
  renderUI();
  window.onLangChange = () => renderUI();
}

// ---------- 座標 ----------
const pt = name => A.pts.find(p => p.name === name);
function pos(p, up) { return new THREE.Vector3(p.E - C.MAN.E0, p.H + up, -(p.N - C.MAN.N0)); }
// 站立點→對準點的方位（three.js 的 yaw：相機朝 −Z 為 0，逆時針為正）
function bearing() { const a = pt(A.st), b = pt(A.tg); if (!a || !b) return 0; return Math.atan2(-(b.E - a.E), (b.N - a.N)); }
function yawOf(q) { const f = new THREE.Vector3(0, 0, -1).applyQuaternion(q); return Math.atan2(-f.x, -f.z); }
function pitchOf(q) { const f = new THREE.Vector3(0, 0, -1).applyQuaternion(q); return Math.asin(Math.max(-1, Math.min(1, f.y))); }
const isQR = () => A.calib?.kind === 'qr';
const isWalk = () => A.calib?.kind === 'walk';
// A.dh = 模型上移量（眼睛相對下降）；A.nud = 模型逆時針旋轉量（畫面上往左），單位度
function eyeY() {
  if (isQR()) return A.calib.c.y;
  if (A.calib && A.autoH && A.calib.pitch != null) return pt(A.tg).H + dist() * Math.tan(-A.calib.pitch); // 俯角推算
  return pt(A.st).H + A.eye;
}
const eyePos = () => { const p = isQR() ? A.calib.c.clone() : pos(pt(A.st), 0); p.y = eyeY() - A.dh; return p; };
const phoneH = () => eyeY() - A.dh - pt(A.st).H; // 推算的手機離地高度（對樁法）
const dist = () => { const a = pt(A.st), b = pt(A.tg); return a && b ? Math.hypot(b.E - a.E, b.N - a.N) : 0; };

// 站在樁上時，人會在未來的橋墩「裡面」：把包住站立點的構件隱藏，否則鏡頭會被擋住
function findInside() {
  const eyes = (A.method === 'walk' || isWalk()) && pt(A.st) && pt(A.tg) ? [pos(pt(A.st), 1.5), pos(pt(A.tg), 1.5)] : [eyePos()], set = new Set(), m = 0.3;
  for (const cat of C.S.cats) {
    const P = cat.pos;
    for (let k = 0; k < cat.n; k++) {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let i = cat.v0[k] * 3, j = cat.v1[k] * 3; i < j; i += 3) {
        const x = P[i], y = P[i + 1], z = P[i + 2];
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
      }
      if (eyes.some(e => e.x > x0 - m && e.x < x1 + m && e.z > z0 - m && e.z < z1 + m && e.y > y0 - 1 && e.y < y1 + 1)) set.add(cat.ci + ':' + k);
    }
  }
  A.inside = set; C.applyState();
}

function applyLook() {
  const m = C.solidMat; m.transparent = A.opa < 0.999; m.opacity = A.opa; m.needsUpdate = true;
}
function applyMarks() {
  for (const g of A.marks.children) {
    if (!g.userData.name) continue;
    const on = g.userData.name === A.tg, mine = !isQR() && A.method === 'stake' && g.userData.name === A.st;
    const ck = g.userData.name === A.ck && (A.step === 'check' || A.chk);
    g.visible = !mine; g.children.forEach(c => c.material.color.setHex(ck ? 0x22c55e : on ? 0xef4444 : 0xfacc15));
  }
}

// 校正結果套用到畫面
function applyCalib() {
  if (isWalk()) {
    // 走點校正：兩個地面點（XR 座標 h1、h2）對應兩根樁（模型座標 w1、w2）。以第二點為轉軸套用 ◀ ▶ 微調
    const c = A.calib, a = c.a + A.nud * DEG;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
    const p = c.h2.clone().sub(c.w2.clone().applyQuaternion(q)); p.y = c.dy + A.dh;
    C.renderer.xr.setReferenceSpace(A.base.getOffsetReferenceSpace(new XRRigidTransform({ x: p.x, y: p.y, z: p.z, w: 1 }, { x: q.x, y: q.y, z: q.z, w: q.w })));
  } else if (A.kind === 'xr') {
    // XR 參考空間 → 模型座標：X_xr = R(a)·X_w + p，使站立點眼睛高度落在校正當下的手機位置
    const a = A.calib.psi - bearing() + A.nud * DEG;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
    const p = A.calib.p.clone().sub(eyePos().applyQuaternion(q));
    const off = A.base.getOffsetReferenceSpace(new XRRigidTransform({ x: p.x, y: p.y, z: p.z, w: 1 }, { x: q.x, y: q.y, z: q.z, w: q.w }));
    C.renderer.xr.setReferenceSpace(off);
  } else if (isQR()) {
    A.alpha = A.calib.alpha - A.nud * DEG;
  } else {
    A.alpha = bearing() - A.calib.psi - A.nud * DEG;
  }
  C.world.visible = A.marks.visible = true;
  applyMarks();
}

// ---------- 開始：自動選擇模式 ----------
function go() {
  if (!window.isSecureContext) C.toast(t('AR 需要 https 網址才能使用相機，目前只能預覽。'), 6000);
  LS.set('st', A.st); LS.set('tg', A.tg); LS.set('eye', A.eye); LS.set('method', A.method);
  if (A.method === 'qr') { if (!A.markers.length) { C.toast(t('stations.json 沒有 QR 標記資料（markers）'), 6000); return; } startCam(); return; }
  if (A.method === 'walk') { startXR().catch(e => { console.warn(e); C.toast(t('WebXR 無法啟動：這支手機不能用走點校正，請改用對準兩根樁'), 6000); }); return; }
  if (A.xrOK) startXR().catch(e => { console.warn('WebXR 失敗，改用相機模式', e); C.toast(t('WebXR 無法啟動，改用相機模式'), 4000); startCam(); });
  else startCam();
}

async function startXR() {
  const r = C.renderer;
  r.xr.enabled = true;
  r.xr.setReferenceSpaceType('local');
  // 點在按鈕、資訊視窗上時不要當成點選模型
  if (!A.bxs) { A.bxs = true; C.$('ar').addEventListener('beforexrselect', e => { if (e.target.closest && e.target.closest('#arbar,#arpanel,#info')) e.preventDefault(); }); }
  const session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local'], optionalFeatures: ['dom-overlay', 'hit-test'], domOverlay: { root: C.$('ar') } });
  await r.xr.setSession(session);
  A.base = r.xr.getReferenceSpace();
  A.kind = 'xr'; A.session = session; A.hts = null;
  // 走點校正用：從畫面中心（十字）往前打到地面的位置
  try { const vs = await session.requestReferenceSpace('viewer'); A.hts = await session.requestHitTestSource({ space: vs }); } catch (e) { console.warn('hit-test 不支援', e); }
  // 點畫面（非按鈕處）→ 由手機位置往點擊方向打射線，選取構件
  session.addEventListener('select', e => {
    if (A.step !== 'view') return;
    const pose = e.frame.getPose(e.inputSource.targetRaySpace, r.xr.getReferenceSpace()); // 校正後的參考空間＝模型座標
    if (!pose) return;
    const m = new THREE.Matrix4().fromArray(pose.transform.matrix);
    const o = new THREE.Vector3().setFromMatrixPosition(m), d = new THREE.Vector3(0, 0, -1).transformDirection(m);
    const h = C.castRay(o, d); C.select(h ? { ci: h.cat.ci, k: h.k } : null);
  });
  session.addEventListener('end', () => {
    r.xr.setReferenceSpace(null); A.kind = null; A.session = null; A.hts = null; A.calib = null; A.step = 'setup'; A.reticle.visible = false;
    C.world.visible = A.marks.visible = true; renderUI();
  });
  toAim();
}

function startCam() {
  // iPhone 的陀螺儀與相機權限都必須在按鈕點擊當下要求
  const perm = (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) ? DeviceOrientationEvent.requestPermission().catch(() => 'denied') : Promise.resolve('granted');
  const media = navigator.mediaDevices?.getUserMedia ? navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } }) : Promise.reject(new Error('no mediaDevices'));
  A.kind = 'cam';
  if (!A.onOri) {
    A.onOri = e => {
      if (e.alpha == null) return;
      const ang = ((screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0) * DEG;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(e.beta * DEG, e.alpha * DEG, -e.gamma * DEG, 'YXZ'));
      q.multiply(new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2));
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -ang));
      A.devQ = q;
    };
    addEventListener('deviceorientation', A.onOri);
  }
  perm.then(p => { if (p !== 'granted') C.toast(t('沒有取得陀螺儀權限，請重新整理後按「允許」'), 6000); });
  media.then(stream => {
    A.stream = stream;
    const v = C.$('arvid'); v.srcObject = stream; v.classList.remove('hide'); v.play().catch(() => { });
  }).catch(e => { console.warn(e); C.toast(t('無法開啟相機（{msg}），改為模擬畫面：拖曳轉向', { msg: e.name || e.message }), 6000); });
  toAim();
}

// 進入校正畫面。refine = QR 定位後，只用遠方樁修正方向（模型保持顯示）
function toAim(refine = false) {
  C.select(null);
  A.refine = refine && isQR(); A.hist = [];
  if (!A.refine) {
    A.calib = null;
    C.world.visible = A.marks.visible = false; // 校正前方向未知，先不顯示模型
  }
  A.step = !A.refine && A.method === 'qr' ? 'scan' : !A.refine && A.method === 'walk' && A.kind === 'xr' ? 'walk' : 'aim';
  A.wp = []; A.hits = [];
  renderUI();
  if (A.step === 'scan') startScan();
}

function confirmAim() {
  if (A.refine) {
    // 位置／高程沿用 QR，方向改為「手機 → 對準點」的方位
    const c = A.calib.c, b = pos(pt(A.tg), 0);
    A.calib.alpha = Math.atan2(-(b.x - c.x), -(b.z - c.z)) - yawOf(A.rawQ);
    A.calib.refined = A.tg; A.refine = false; A.nud = 0; A.step = 'view';
    applyCalib(); renderUI();
    C.toast(t('方向已用 {name} 修正：請檢查紅色標桿是否落在 {name} 樁上', { name: A.tg }), 5000);
    return;
  }
  if (A.kind === 'xr') { A.pending = true; return; } // 在下一個 XR 畫格取得手機姿態
  A.calib = { kind: 'stake', psi: yawOf(A.rawQ), pitch: pitchOf(A.rawQ) };
  afterCalib();
}
function afterCalib() {
  A.chk = null; A.nud = 0; A.dh = 0; A.step = 'view'; setZoom(1); A.reticle.visible = false;
  applyCalib(); findInside(); renderUI();
  if (isWalk()) { const c = A.calib, e = Math.abs(c.dm - c.dw); C.toast(walkText() + String.fromCharCode(10) + (e > 0.3 ? t('距離差超過 30 cm：可能記錄時十字沒對準樁，或手機追蹤漂移，建議重新校正。') : t('請檢查兩根紅色標桿是否落在樁上')), 8000); return; }
  if (isQR()) { C.toast(t('QR 定位完成：請檢查紅框是否疊在真的 QR 牌上'), 5000); return; }
  const h = phoneH();
  if (A.autoH && (h < 0.5 || h > 2.5)) C.toast(t('推算的手機離地高度 {h} m 不合理：請確認十字對準 {name} 樁的入土處，或在設定改用手動高度。', { h: fmt(h, 2), name: A.tg }), 9000);
  else C.toast(t('校正完成：請檢查紅色標桿是否落在 {name} 樁上', { name: A.tg }) + (A.autoH ? String.fromCharCode(10) + t('推算手機離地 {h} m', { h: fmt(h, 2) }) : ''), 5000);
}

// ---------- 走點校正（Android WebXR）：在第一根樁記錄地面點 → 走到第二根樁再記錄 ----------
// 兩點連線同時決定方向、位置與高程；不用看清楚遠方的樁。方向誤差 ≈ 橫向誤差 ÷ 兩點距離
function hitStat() {
  const H = A.hits; if (H.length < 6) return null;
  const m = H.reduce((s, h) => s.add(h.p), new THREE.Vector3()).multiplyScalar(1 / H.length);
  return { m, spread: Math.max(...H.map(h => h.p.distanceTo(m))) };
}
function recordWalk() {
  let p;
  if (A.hts) {
    const st = hitStat();
    if (!st) { C.toast(t('十字還沒有對到地面：請把十字對準樁頂，稍等一下'), 4000); return; }
    if (st.spread > 0.05) { C.toast(t('晃動中，請拿穩再按'), 3000); return; }
    p = st.m;
  } else {
    // 不支援 hit-test：手機拿在樁正上方，地面 = 手機高度 − 手機離地高度
    if (!A.viewerP) return; p = A.viewerP.clone(); p.y -= A.eye;
  }
  A.wp.push(p); A.hits = [];
  if (A.wp.length < 2) { C.toast(t('已記錄 {name}，請走到 {b}', { name: A.st, b: A.tg }), 4000); renderUI(); return; }
  const [h1, h2] = A.wp, w1 = pos(pt(A.st), 0), w2 = pos(pt(A.tg), 0);
  const a = Math.atan2(h2.x - h1.x, h2.z - h1.z) - Math.atan2(w2.x - w1.x, w2.z - w1.z);
  A.calib = { kind: 'walk', h1, h2, w1, w2, a, dy: ((h1.y - w1.y) + (h2.y - w2.y)) / 2,
    dm: Math.hypot(h2.x - h1.x, h2.z - h1.z), dw: Math.hypot(w2.x - w1.x, w2.z - w1.z), dz: (h2.y - h1.y) - (w2.y - w1.y) };
  afterCalib();
}
function walkText() {
  const c = A.calib;
  return t('走點校正：實際走了 {m} m，圖面 {w} m（差 {e} cm），高差誤差 {z} cm', { m: fmt(c.dm, 2), w: fmt(c.dw, 2), e: fmt((c.dm - c.dw) * 100, 0), z: fmt(c.dz * 100, 0) });
}

// ---------- 檢核第三點：校正後十字對準第三根樁，算出模型偏多少 ----------
// 有地面偵測（Android，離樁 15 m 內）時直接用地面點；否則用十字方向的射線，取與圖面點相同水平距離的位置。
function bestCheck() {
  const e = A.camP || eyePos(); let best = '', bs = Infinity;
  for (const p of A.pts) {
    if (p.name === A.st || p.name === A.tg || p.H == null) continue;
    const q = pos(p, 0), d = Math.hypot(q.x - e.x, q.z - e.z), sc = d < 10 ? 1e6 + (10 - d) : Math.abs(d - 30);
    if (sc < bs) { bs = sc; best = p.name; }
  }
  return best;
}
function toCheck() {
  if (!A.ck || !pt(A.ck) || A.ck === A.st || A.ck === A.tg) A.ck = bestCheck();
  if (!A.ck) { C.toast(t('沒有第三個已知點可以檢核'), 4000); return; }
  C.select(null); A.step = 'check'; A.hist = []; A.hits = []; A.chk = null; applyMarks(); renderUI();
}
function checkHit() {
  if (A.kind !== 'xr' || !A.hts || !A.camP) return null;
  const st = hitStat(); if (!st || st.spread > 0.05) return null;
  return Math.hypot(st.m.x - A.camP.x, st.m.z - A.camP.z) < 15 ? st.m.clone() : null;
}
function measureCheck() {
  const c = pt(A.ck); if (!c || !A.camP || !A.camQ) return;
  const W = pos(c, 0), E = A.camP, f = new THREE.Vector3(0, 0, -1).applyQuaternion(A.camQ);
  const d = Math.hypot(W.x - E.x, W.z - E.z);
  let G = checkHit(); const hit = !!G;
  if (!G) {
    const fh = Math.hypot(f.x, f.z); if (fh < 0.1) { C.toast(t('手機太朝下：請對準遠一點的樁'), 4000); return; }
    const k = d / fh; G = new THREE.Vector3(E.x + f.x * k, E.y + f.y * k, E.z + f.z * k);
  }
  const u = new THREE.Vector3(W.x - E.x, 0, W.z - E.z).normalize(), r = new THREE.Vector3(-u.z, 0, u.x), o = W.clone().sub(G);
  const pv = isWalk() ? A.calib.w2 : eyePos(), ang = v => Math.atan2(-v.x, -v.z);
  let dl = ang(G.clone().sub(pv)) - ang(W.clone().sub(pv)); dl = Math.atan2(Math.sin(dl), Math.cos(dl));
  A.chk = { name: A.ck, d, hit, lat: o.dot(r), along: hit ? o.dot(u) : null, dz: G.y - W.y, dl: dl / DEG };
  A.step = 'view'; setZoom(1); A.reticle.visible = false; applyMarks(); renderUI();
  C.toast(checkText(), 9000);
}
function checkText() {
  const k = A.chk, cm = v => fmt(Math.abs(v) * 100, 0), parts = [];
  parts.push(t(k.lat >= 0 ? '偏右 {v} cm' : '偏左 {v} cm', { v: cm(k.lat) }));
  parts.push(t(-k.dz >= 0 ? '偏高 {v} cm' : '偏低 {v} cm', { v: cm(k.dz) }));
  if (k.along != null) parts.push(t(k.along >= 0 ? '偏遠 {v} cm' : '偏近 {v} cm', { v: cm(k.along) }));
  const bad = Math.max(Math.abs(k.lat), Math.abs(k.dz), Math.abs(k.along || 0)) > 0.1;
  return t('檢核 {name}（距離 {d} m）：模型標桿', { name: k.name, d: fmt(k.d, 1) }) + parts.join('、') + '。'
    + (bad ? t('超過 10 cm：可按「用 {name} 修正」，或重新校正。', { name: k.name }) : t('誤差在 10 cm 內，可以使用。'));
}
function applyCheck() {
  const k = A.chk; if (!k) return;
  A.nud = Math.round((A.nud + k.dl) * 100) / 100; A.dh = Math.round((A.dh + k.dz) * 100) / 100;
  A.chk = null; applyCalib(); renderUI();
  C.toast(t('已用 {name} 修正：方向 {a}°、高度 {h} m。請再檢查標桿。', { name: k.name, a: fmt(k.dl, 2), h: fmt(k.dz, 2) }), 6000);
}

// 相機模式放大（對準遠方樁時看得比較清楚）：只放大畫面，十字中心的方向不變
function setZoom(z) {
  A.zoom = z; const v = C.$('arvid'); if (v) v.style.transform = z > 1 ? `scale(${z})` : '';
}

// ---------- QR 掃描定位 ----------
const NEED = 10;           // 需要幾次穩定偵測
function qrId(text) {
  try { const u = new URL(text); const q = u.searchParams.get('qr'); if (q) return q; } catch { }
  const m = /^W3D:(.+)$/.exec(text || ''); return m ? m[1] : null;
}
async function startScan() {
  A.samples = []; A.scanMsg = t('尋找 QR 標記…');
  if (!window.jsQR) { try { await loadScript('vendor/jsQR.js'); } catch (e) { A.scanMsg = t('QR 辨識程式載入失敗'); return; } }
  if (A.scanning) return; A.scanning = true;
  const cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
  const tick = () => {
    if (A.step !== 'scan') { A.scanning = false; return; }
    try { scanOnce(cv, g); } catch (e) { console.warn(e); }
    setTimeout(tick, 50);
  };
  tick();
}
function scanOnce(cv, g) {
  const src = A.scanSource || C.$('arvid');              // A.scanSource：測試用畫布
  const vw = src.videoWidth || src.width, vh = src.videoHeight || src.height;
  if (!vw || !vh || !A.rawQ) return;
  const k = Math.min(1, 1600 / Math.max(vw, vh)), w = Math.round(vw * k), h = Math.round(vh * k);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const qDev = A.rawQ.clone();                            // 拍到這張畫面時的陀螺儀姿態
  g.drawImage(src, 0, 0, w, h);
  const r = window.jsQR(g.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
  const now = performance.now();
  A.samples = A.samples.filter(s => now - s.t < 2500);
  if (!r) { if (!A.samples.length) A.scanMsg = t('尋找 QR 標記…'); return; }
  const id = qrId(r.data), m = A.markers.find(x => x.id === id);
  if (!id) { A.scanMsg = t('這個 QR 不是定位標記'); return; }
  if (!m) { A.scanMsg = t('stations.json 找不到標記 {id}', { id }); return; }
  const L = r.location, corners = [L.topLeftCorner, L.topRightCorner, L.bottomRightCorner, L.bottomLeftCorner].map(p => [p.x, p.y]);
  const f = (Math.max(w, h) / 2) / Math.tan(A.fov * DEG / 2), cx = w / 2, cy = h / 2, F = m.F;
  const P = QP.poseFromCorners(corners, F.size, f, cx, cy);
  const pos6 = QP.toWorld(F, P.C), fwd6 = QP.dirToWorld(F, P.fwd);
  const e = new THREE.Matrix4().makeRotationFromQuaternion(qDev).elements, Rdev = [[e[0], e[1], e[2]], [e[4], e[5], e[6]], [e[8], e[9], e[10]]];
  const R = QP.refinePose(corners, [F.TL, F.TR, F.BR, F.BL], f, cx, cy, Rdev, { alpha: Math.atan2(-fwd6[0], -fwd6[2]) - yawOf(qDev), c: pos6 });
  const d = Math.hypot(R.c[0] - (F.TL[0] + F.BR[0]) / 2, R.c[1] - (F.TL[1] + F.BR[1]) / 2, R.c[2] - (F.TL[2] + F.BR[2]) / 2);
  if (!isFinite(R.alpha) || R.rms > 8) { A.scanMsg = t('偵測到 {id}，但角點誤差太大（{e} px），請靠近一點、正對 QR', { id, e: fmt(R.rms) }); return; }
  if (A.samples.length && A.samples[0].id !== id) A.samples = [];
  A.samples.push({ t: now, id, c: R.c, alpha: R.alpha, rms: R.rms, d });
  // 平均：位置取平均、方向取圓平均；全部樣本要彼此接近才採用
  const S = A.samples, n = S.length;
  const mc = [0, 1, 2].map(i => S.reduce((s, x) => s + x.c[i], 0) / n);
  const ma = Math.atan2(S.reduce((s, x) => s + Math.sin(x.alpha), 0), S.reduce((s, x) => s + Math.cos(x.alpha), 0));
  const spreadC = Math.max(...S.map(x => Math.hypot(x.c[0] - mc[0], x.c[1] - mc[1], x.c[2] - mc[2])));
  const spreadA = Math.max(...S.map(x => Math.abs(((x.alpha - ma) / DEG + 540) % 360 - 180)));
  A.scanMsg = t('偵測到 {id}：距離 {d} m，收集中 {n}/{N}', { id, d: fmt(d, 2), n: Math.min(n, NEED), N: NEED }) + (n >= 3 ? `（±${fmt(spreadC * 100, 0)} cm／±${fmt(spreadA, 1)}°）` : '');
  if (n < NEED) return;
  if (spreadC > 0.08 || spreadA > 1.5) { A.samples.shift(); A.scanMsg += ' ' + t('晃動中，請拿穩'); return; }
  A.calib = { kind: 'qr', id, c: new THREE.Vector3(...mc), alpha: ma, d: S.reduce((s, x) => s + x.d, 0) / n, rms: S.reduce((s, x) => s + x.rms, 0) / n, sc: spreadC, sa: spreadA };
  A.samples = [];
  afterCalib();
}

// ---------- 每個畫格 ----------
function update(dt, frame) {
  const cam = C.camera;
  let q = null;
  if (A.kind === 'xr') {
    if (frame && A.base) {
      const pose = frame.getViewerPose(A.base);
      if (pose) {
        const o = pose.transform.orientation, p = pose.transform.position;
        q = new THREE.Quaternion(o.x, o.y, o.z, o.w);
        if (A.pending) { A.pending = false; A.calib = { kind: 'stake', p: new THREE.Vector3(p.x, p.y, p.z), psi: yawOf(q), pitch: pitchOf(q) }; afterCalib(); }
        A.viewerP = new THREE.Vector3(p.x, p.y, p.z);
      }
      if (A.step === 'walk') {
        const now = performance.now(), res = A.hts ? frame.getHitTestResults(A.hts) : [];
        const hp = res.length ? res[0].getPose(A.base) : null;
        if (hp) { const v = hp.transform.position; A.hits.push({ t: now, p: new THREE.Vector3(v.x, v.y, v.z) }); }
        A.hits = A.hits.filter(h => now - h.t < 700);
        A.reticle.visible = !!hp; if (hp) A.reticle.position.copy(A.hits[A.hits.length - 1].p);
        if (!A.roT || now - A.roT > 150) {
          A.roT = now; const el = C.$('arro'), st = hitStat(), ok = st && st.spread < 0.05;
          if (el) el.innerHTML = !A.hts ? t('這支手機不支援地面偵測：手機拿在樁正上方再按記錄（手機離地 {h} m）', { h: fmt(A.eye, 1) })
            : !hp ? t('尋找地面中…請慢慢左右移動手機')
            : `${t('距離')} ${fmt(A.viewerP ? Math.hypot(A.viewerP.x - hp.transform.position.x, A.viewerP.z - hp.transform.position.z) : 0, 1)} m　<b class="${ok ? 'ok' : 'no'}">● ${ok ? t('穩定') : t('晃動中')}</b>`;
        }
      }
      if (A.step === 'check') {
        const ref = C.renderer.xr.getReferenceSpace(), vp = frame.getViewerPose(ref); // 校正後的參考空間＝模型座標
        if (vp) { const o = vp.transform.orientation, p = vp.transform.position; A.camQ = new THREE.Quaternion(o.x, o.y, o.z, o.w); A.camP = new THREE.Vector3(p.x, p.y, p.z); }
        const now = performance.now(), res = A.hts ? frame.getHitTestResults(A.hts) : [], hp = res.length ? res[0].getPose(ref) : null;
        if (hp) { const v = hp.transform.position; A.hits.push({ t: now, p: new THREE.Vector3(v.x, v.y, v.z) }); }
        A.hits = A.hits.filter(h => now - h.t < 700);
        A.reticle.visible = !!hp; if (hp) A.reticle.position.copy(A.hits[A.hits.length - 1].p);
      }
    }
  } else {
    // 相機模式／設定畫面：位置固定，方向來自陀螺儀（電腦上用拖曳）
    if (A.devQ && A.kind === 'cam') {
      A.smQ = A.smQ ? A.smQ.slerp(A.devQ, 0.5) : A.devQ.clone(); q = A.smQ.clone();
    } else {
      q = new THREE.Quaternion().setFromEuler(new THREE.Euler(A.dragPitch, A.dragYaw, 0, 'YXZ'));
    }
    A.rawQ = q.clone();
    const shown = q.clone();
    if (A.calib) shown.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), A.alpha));
    cam.quaternion.copy(shown); cam.position.copy(eyePos()); cam.updateMatrixWorld();
    A.camP = cam.position.clone(); A.camQ = shown.clone();
    setFov();
  }
  const now = performance.now();
  // 對準時的即時角度與穩定度
  if ((A.step === 'aim' || A.step === 'check') && q) {
    const y = yawOf(q) / DEG, pch = pitchOf(q) / DEG;
    A.hist.push([now, y]); while (A.hist.length && now - A.hist[0][0] > 600) A.hist.shift();
    let lo = Infinity, hi = -Infinity; for (const [, v] of A.hist) { const d = ((v - y + 540) % 360) - 180; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const steady = A.hist.length > 5 && hi - lo < 0.15;
    if (!A.roT || now - A.roT > 120) {
      A.roT = now; const el = C.$('arro');
      const badge = `<b class="${steady ? 'ok' : 'no'}">● ${steady ? t('穩定') : t('晃動中')}</b>`;
      if (el && A.step === 'check') {
        const c = pt(A.ck), w = c && pos(c, 0), g = checkHit();
        el.innerHTML = (w && A.camP ? `${t('距離')} ${fmt(Math.hypot(w.x - A.camP.x, w.z - A.camP.z), 1)} m　` : '')
          + (g ? t('地面點離 {name} {v} cm', { name: A.ck, v: fmt(Math.hypot(g.x - w.x, g.z - w.z) * 100, 0) }) + '　' : '') + badge;
      } else if (el) { el.innerHTML = `${t('轉向')} ${fmt((360 - y) % 360)}°　${t('俯仰')} ${fmt(pch)}°　<b class="${steady ? 'ok' : 'no'}">● ${steady ? t('穩定') : t('晃動中')}</b>`; }
    }
  }
  if (A.step === 'scan' && (!A.roT || now - A.roT > 150)) { A.roT = now; const el = C.$('arro'); if (el) el.textContent = A.scanMsg || ''; }
}

// 相機模式：依相機畫面大小與鏡頭視角算出 three.js 的垂直視角（畫面以 cover 方式填滿）
function setFov() {
  const cam = C.camera, v = C.$('arvid'), W = innerWidth, H = innerHeight;
  let fovV;
  if (A.kind === 'cam' && v && v.videoWidth) {
    const s = Math.max(W / v.videoWidth, H / v.videoHeight), longPx = Math.max(v.videoWidth, v.videoHeight) * s;
    const f = (longPx / 2) / Math.tan(A.fov * DEG / 2) * (A.zoom || 1);
    fovV = 2 * Math.atan((H / 2) / f) / DEG;
  } else fovV = 60;
  if (Math.abs(cam.fov - fovV) > 0.01 || cam.aspect !== W / H) { cam.fov = fovV; cam.aspect = W / H; cam.updateProjectionMatrix(); }
}

// ---------- 介面 ----------
// 點位選單：分「實測點」「模型橋墩中心」兩組；from 有值時顯示與站立點的距離（對準點用）
function stOpts(sel, except, from) {
  const a = from && pt(from);
  const opt = p => {
    const d = a ? Math.hypot(p.E - a.E, p.N - a.N) : null;
    const lab = p.name + (d !== null && p.name !== from ? `（${d < 1000 ? fmt(d, 0) : fmt(d / 1000, 2) + ' k'} m${d < 15 ? '，' + t('太近') : ''}）` : '');
    return `<option value="${C.esc(p.name)}" ${p.name === sel ? 'selected' : ''} ${p.name === except ? 'disabled' : ''}>${C.esc(lab)}</option>`;
  };
  const sv = A.pts.filter(p => p.src !== 'model'), md = A.pts.filter(p => p.src === 'model');
  if (!sv.length || !md.length) return A.pts.map(opt).join('');
  return `<optgroup label="${t('實測點')}">${sv.map(opt).join('')}</optgroup><optgroup label="${t('模型橋墩中心')}">${md.map(opt).join('')}</optgroup>`;
}
// 換站立點時自動挑對準點：距離最接近 50 m（至少 20 m）的點
function bestTarget(st) {
  const a = pt(st); if (!a) return A.tg;
  let best = null, bs = Infinity;
  for (const p of A.pts) { if (p.name === st || p.H == null) continue; const d = Math.hypot(p.E - a.E, p.N - a.N), sc = d < 20 ? 1e6 + (20 - d) : Math.abs(d - 50); if (sc < bs) { bs = sc; best = p.name; } }
  return best || A.tg;
}
function phOpts() {
  return `<option value="-1" ${A.phase < 0 ? 'selected' : ''}>${t('全部完成')}</option>` + C.PH.map((p, i) => `<option value="${i}" ${i === A.phase ? 'selected' : ''}>${C.esc(tc(p))}</option>`).join('');
}
function modeText() {
  if (A.kind === 'xr' || (!A.kind && A.xrOK && A.method !== 'qr')) return `<span class="badge g">${t('Android WebXR：校正後可以走動')}</span>`;
  return `<span class="badge y">${t('相機模式：請站在原地轉動手機')}</span>`;
}
function hold(btn, fn) {
  let tm = null, iv = null;
  const stop = () => { clearTimeout(tm); clearInterval(iv); tm = iv = null; };
  btn.onpointerdown = e => { e.preventDefault(); fn(); tm = setTimeout(() => iv = setInterval(fn, 70), 400); };
  btn.onpointerup = btn.onpointerleave = btn.onpointercancel = stop;
}
function calibText() {
  if (isQR()) {
    const c = A.calib, ref = c.refined ? '　' + t('方向已用 {name} 修正', { name: c.refined }) : '';
    return t('QR 定位（{id}）：距牌 {d} m，手機高程 {h} m', { id: c.id, d: fmt(c.d, 2), h: fmt(eyeY() - A.dh, 2) }) + ref;
  }
  if (isWalk()) return walkText();
  return A.autoH && A.calib?.pitch != null ? t('高程：自動（俯角 {a}°），手機離地 {h} m', { a: fmt(-A.calib.pitch / DEG, 2), h: fmt(phoneH(), 2) }) : t('高程：手動，手機離地 {h} m', { h: fmt(phoneH(), 2) });
}

const nudTxt = () => A.nud === 0 ? '0.0°' : (A.nud > 0 ? '◀ ' : '▶ ') + fmt(Math.abs(A.nud)) + '°';
const dhTxt = () => (A.dh > 0 ? '+' : '') + fmt(A.dh) + ' m';
function renderUI() {
  const $ = C.$, el = $('ar'); const P = pt(A.st);
  const head = `<div id="arbar"><b>📷 ${t('現場 AR')}</b>${modeText()}<button class="btn sm" id="arexit">${t('離開')}</button></div>`;
  let body = '';
  if (A.step === 'setup') {
    const seg = `<div class="seg"><button data-m="stake" class="${A.method === 'stake' ? 'on' : ''}">${t('對準兩根樁')}</button>${A.xrOK ? `<button data-m="walk" class="${A.method === 'walk' ? 'on' : ''}">${t('走到兩根樁')}</button>` : ''}<button data-m="qr" class="${A.method === 'qr' ? 'on' : ''}">${t('掃描 QR 標記')}</button></div>`;
    if (A.method === 'walk') {
      body = `<div id="arpanel">${seg}
      <div class="r2"><label>${t('第一點（先站這裡）')}<select id="arst">${stOpts(A.st)}</select></label>
      <label>${t('第二點（走過去）')}<select id="artg">${stOpts(A.tg, A.st, A.st)}</select></label></div>
      <p class="mut">${t('兩點距離 {d} m（20～60 m 最好：太近方向不準，太遠手機追蹤會漂移）', { d: fmt(dist()) })}</p>
      <div class="r2"><label>${t('顯示到階段')}<select id="arph">${phOpts()}</select></label></div>
      <button class="btn pri big1" id="argo">${t('開始 AR')}</button>
      <p class="mut">${t('步驟：① 站在 {a} 樁旁 1～2 m，按「開始 AR」② 十字對準 {a} 樁頂，藍色圈出現且「穩定」時按「記錄」③ 拿著手機走到 {b}（鏡頭朝前、不要遮住），同樣對準 {b} 樁頂按「記錄」。', { a: A.st, b: A.tg })}<br>
      ${t('不用看清楚遠方的樁，方向、位置、高程一次求出；完成後可以繼續走動。')}</p>
    </div>`;
    } else if (A.method === 'qr') {
      body = `<div id="arpanel">${seg}
      <p class="mut">${t('已設定 {n} 個 QR 標記：', { n: A.markers.length })}${A.markers.map(m => `<b>${C.esc(m.id)}</b>${m.desc ? '（' + C.esc(m.desc) + '）' : ''}`).join('、') || '—'}</p>
      <div class="r2"><label>${t('顯示到階段')}<select id="arph">${phOpts()}</select></label></div>
      <button class="btn pri big1" id="argo">${t('開始 AR')}</button>
      <p class="mut">${t('步驟：① 站在 QR 牌前約 1 m（越近越準）② 按「開始 AR」，允許使用相機 ③ 讓整個 QR 出現在畫面框內，拿穩約 1 秒會自動定位。')}<br>
      ${t('QR 定位的高程與位置很準，方向誤差約 0.5～1°；看遠處時可再用「對準遠方樁修正方向」。')}</p>
    </div>`;
    } else {
      body = `<div id="arpanel">${seg}
      <div class="r2"><label>${t('站立點（手機在樁正上方）')}<select id="arst">${stOpts(A.st)}</select></label>
      <label>${t('對準點（遠方另一根樁）')}<select id="artg">${stOpts(A.tg, A.st, A.st)}</select></label></div>
      <p class="mut">${t('兩點距離 {d} m（越遠方向越準，建議 30 m 以上）', { d: fmt(dist()) })}<br>
      ${P ? `${C.esc(P.desc || P.name)}<br>E ${P.E.toFixed(3)}　N ${P.N.toFixed(3)}　H ${P.H == null ? '—' : P.H.toFixed(2)}` : ''}</p>
      <label class="chk"><input type="checkbox" id="arauto" ${A.autoH ? 'checked' : ''}> ${t('高程自動校正（十字對準樁的入土處，用俯角推算）')}</label>
      <div class="r2">${A.autoH ? '' : `<label>${t('手機離地高度 (m)')}<input type="number" id="areye" step="0.1" min="0" max="5" value="${A.eye}"></label>`}
      <label>${t('顯示到階段')}<select id="arph">${phOpts()}</select></label></div>
      <button class="btn pri big1" id="argo">${t('開始 AR')}</button>
      <p class="mut">${t('步驟：① 站在 {a} 樁正上方 ② 按「開始 AR」，允許使用相機 ③ 十字對準 {b} 樁（或立在樁上的標桿）按「確定」。', { a: A.st, b: A.tg })}</p>
    </div>`;
    }
  } else if (A.step === 'scan') {
    body = `<div id="arqrf"></div>
    <div id="arpanel">
      <p id="arro" class="mut">${C.esc(A.scanMsg || '')}</p>
      <p class="mut">${t('讓整個 QR 出現在框內，距離約 1 m，拿穩不動。')}</p>
      <div class="r2"><button class="btn" id="arsw">${t('改用對準兩根樁')}</button></div>
    </div>`;
  } else if (A.step === 'walk') {
    const nm = A.wp.length ? A.tg : A.st;
    body = `<div id="arx"><i></i><i></i><span></span></div>
    <div id="arpanel">
      <p class="mut"><b>${A.wp.length ? t('② 走到 {b}，十字對準 {b} 樁頂', { b: A.tg }) : t('① 十字對準 {a} 樁頂', { a: A.st })}</b>${A.wp.length ? '　✓ ' + C.esc(A.st) : ''}</p>
      <p id="arro" class="mut">…</p>
      <button class="btn pri big1" id="arrec">${t('記錄 {name}', { name: nm })}</button>
      <div class="r2"><button class="btn" id="arwr">${t('重來')}</button></div>
      <p class="mut">${t('站在樁旁 1～2 m 斜看樁比較準。走路時鏡頭朝前、慢慢走，手機會一路追蹤位置。')}</p>
    </div>`;
  } else if (A.step === 'check') {
    body = `<div id="arx"><i></i><i></i><span></span></div>
    <div id="arpanel">
      <div class="r2"><label>${t('檢核點（第三根樁）')}<select id="arck">${stOpts(A.ck, A.st, A.st)}</select></label></div>
      <p id="arro" class="mut">…</p>
      ${A.kind === 'cam' ? `<div class="seg zm">${[1, 2, 4].map(z => `<button data-z="${z}" class="${A.zoom === z ? 'on' : ''}">${t('放大')} ${z}×</button>`).join('')}</div>` : ''}
      <button class="btn pri big1" id="arckm">${t('十字對準 {c} 入土處 → 量測', { c: A.ck })}</button>
      <div class="r2"><button class="btn" id="arcan">${t('取消')}</button></div>
      <p class="mut">${t('綠色標桿 = {c} 的圖面位置。十字對準真的 {c} 樁與地面交接處，顯示「穩定」再按量測，會算出模型偏多少。', { c: A.ck })}</p>
    </div>`;
  } else if (A.step === 'aim') {
    body = `<div id="arx"><i></i><i></i><span></span></div>
    <div id="arpanel">
      ${A.refine ? `<div class="r2"><label>${t('對準點')}<select id="artg">${stOpts(A.tg)}</select></label></div>`
        : `<div class="r2"><label>${t('站立點')}<select id="arst">${stOpts(A.st)}</select></label><label>${t('對準點')}<select id="artg">${stOpts(A.tg, A.st, A.st)}</select></label></div>`}
      <p id="arro" class="mut">…</p>
      ${A.kind === 'cam' ? `<div class="seg zm">${[1, 2, 4].map(z => `<button data-z="${z}" class="${A.zoom === z ? 'on' : ''}">${t('放大')} ${z}×</button>`).join('')}</div>` : ''}
      <button class="btn pri big1" id="aron">${A.refine ? t('十字對準 {b} → 修正方向', { b: A.tg }) : A.autoH ? t('十字對準 {b} 入土處 → 確定', { b: A.tg }) : t('十字對準 {b} → 確定', { b: A.tg })}</button>
      ${A.refine ? `<div class="r2"><button class="btn" id="arcan">${t('取消')}</button></div>` : ''}
      <p class="mut">${t('手肘靠緊身體，等顯示「穩定」再按。看不清楚樁時，請人在樁上立標桿。')}${!A.refine && A.autoH ? '<br>' + t('高程自動校正：十字中心要對在樁（或標桿）與地面交接處。') : ''}</p>
    </div>`;
  } else {
    body = `<div id="arpanel">
      <div class="nud"><span>${t('方向')}</span><button class="btn" id="nl">◀</button><b id="arnud">${nudTxt()}</b><button class="btn" id="nr">▶</button>
      <span>${t('高度')}</span><button class="btn" id="hu">▲</button><b id="ardh">${dhTxt()}</b><button class="btn" id="hd">▼</button></div>
      <p class="mut" style="margin:4px 0 0">${calibText()}</p>
      ${A.chk ? `<p class="mut ckr">${checkText()}</p><div class="r2"><button class="btn" id="arcka">${t('用 {name} 修正', { name: A.chk.name })}</button><button class="btn" id="arckx">${t('清除')}</button></div>` : ''}
      <div class="r2"><label>${t('顯示到階段')}<select id="arph">${phOpts()}</select></label>
      <label>${t('不透明度')}<input type="range" id="aropa" min="0.2" max="1" step="0.05" value="${A.opa}"></label></div>
      ${A.kind === 'cam' ? `<label class="one">${t('鏡頭視角 {v}°（模型大小和實景不同時調整）', { v: A.fov })}<input type="range" id="arfov" min="40" max="95" step="1" value="${A.fov}"></label>` : ''}
      <div class="r2"><button class="btn" id="archk">${t('檢核第三點')}</button>${isQR() ? `<button class="btn" id="arref">${t('對準遠方樁修正方向')}</button>` : ''}</div>
      <div class="r2 btns"><button class="btn" id="arre">${isQR() ? t('重新掃描 QR') : t('重新校正')}</button><button class="btn" id="armin">${t(el.classList.contains('min') ? '展開' : '收合')}</button></div>
      <p class="mut">${isWalk() ? t('紅色／黃色標桿 = {a}、{b}，應落在真的樁上；偏左右按 ◀ ▶，高低不對按 ▲ ▼。', { a: A.st, b: A.tg }) : isQR() ? t('紅框 = QR 牌的測量位置，應疊在真的 QR 牌上；黃色／紅色標桿 = 已知樁。') : t('紅色標桿 = {b}，應落在真的 {b} 樁上；偏左右按 ◀ ▶（每次 0.1°，按住連續），高低不對按 ▲ ▼。', { b: A.tg })}
      ${A.kind === 'cam' ? '<br>' + t('相機模式不會追蹤走動：移動位置後請回到樁上重新校正。') : ''}<br>${t('點畫面上的構件可查看資訊（再點空白處關閉）。')}</p>
    </div>`;
  }
  $('arui').innerHTML = head + body; el.classList.remove('hide');

  $('arexit').onclick = () => {
    if (A.session) A.session.end().catch(() => { });
    A.stream?.getTracks().forEach(tr => tr.stop());
    location.href = '?m=check';
  };
  const setSt = (st, tg) => {
    A.st = st; A.tg = tg && tg !== st ? tg : bestTarget(st);
    LS.set('st', A.st); LS.set('tg', A.tg); applyMarks(); if (!isQR()) findInside();
    if (A.step === 'setup') A.dragYaw = bearing();
    if (A.calib && !A.refine) applyCalib();
    renderUI();
  };
  $('arui').querySelectorAll('.seg [data-m]').forEach(b => b.onclick = () => { A.method = b.dataset.m; LS.set('method', A.method); applyMarks(); findInside(); renderUI(); });
  if ($('arst')) $('arst').onchange = e => setSt(e.target.value);
  if ($('artg')) $('artg').onchange = e => A.refine ? (A.tg = e.target.value, LS.set('tg', A.tg), applyMarks(), renderUI()) : setSt(A.st, e.target.value);
  if ($('arauto')) $('arauto').onchange = e => { A.autoH = e.target.checked; LS.set('autoH', A.autoH); renderUI(); };
  if ($('areye')) $('areye').onchange = e => { A.eye = Math.max(0, +e.target.value || 0); LS.set('eye', A.eye); findInside(); };
  if ($('arph')) $('arph').onchange = e => { A.phase = +e.target.value; LS.set('phase', A.phase >= 0 ? C.PH[A.phase] : ''); C.applyState(); };
  if ($('argo')) $('argo').onclick = go;
  if ($('aron')) $('aron').onclick = confirmAim;
  if ($('arrec')) $('arrec').onclick = recordWalk;
  if ($('arwr')) $('arwr').onclick = () => { A.wp = []; A.hits = []; renderUI(); };
  $('arui').querySelectorAll('.zm [data-z]').forEach(b => b.onclick = () => { setZoom(+b.dataset.z); renderUI(); });
  if ($('arcan')) $('arcan').onclick = () => { A.refine = false; A.step = 'view'; setZoom(1); A.reticle.visible = false; applyMarks(); renderUI(); };
  if ($('archk')) $('archk').onclick = toCheck;
  if ($('arck')) $('arck').onchange = e => { A.ck = e.target.value; LS.set('ck', A.ck); A.hits = []; applyMarks(); renderUI(); };
  if ($('arckm')) $('arckm').onclick = measureCheck;
  if ($('arcka')) $('arcka').onclick = applyCheck;
  if ($('arckx')) $('arckx').onclick = () => { A.chk = null; applyMarks(); renderUI(); };
  if ($('arsw')) $('arsw').onclick = () => { A.method = 'stake'; LS.set('method', 'stake'); toAim(); };
  if ($('arref')) $('arref').onclick = () => toAim(true);
  if ($('aropa')) $('aropa').oninput = e => { A.opa = +e.target.value; LS.set('opa', A.opa); applyLook(); };
  if ($('arfov')) $('arfov').oninput = e => { A.fov = +e.target.value; LS.set('fov', A.fov); e.target.parentElement.firstChild.textContent = t('鏡頭視角 {v}°（模型大小和實景不同時調整）', { v: A.fov }); };
  if ($('arre')) $('arre').onclick = () => toAim();
  if ($('armin')) $('armin').onclick = e => { el.classList.toggle('min'); e.target.textContent = t(el.classList.contains('min') ? '展開' : '收合'); };
  const nud = d => { A.nud = Math.round((A.nud + d) * 10) / 10; $('arnud').textContent = nudTxt(); applyCalib(); };
  const dh = d => { A.dh = Math.round((A.dh + d) * 10) / 10; $('ardh').textContent = dhTxt(); applyCalib(); };
  if ($('nl')) { hold($('nl'), () => nud(0.1)); hold($('nr'), () => nud(-0.1)); hold($('hu'), () => dh(0.1)); hold($('hd'), () => dh(-0.1)); }
}
