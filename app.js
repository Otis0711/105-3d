// 105市道 3D 模型檢視器
// 座標：three.js x = 東距 - E0，y = 高程，z = -(北距 - N0)，單位公尺（TWD97 TM2，取自 Revit 共用座標）
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { computeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const $ = id => document.getElementById(id);
// 多國語言（i18n.js）：t 介面文字、tc 模型資料用語、tp 參數名稱
const { t, tc, tp } = window;
const cn = c => t(c.name);                                   // 構件類別名稱
const tcx = s => { const r = tc(s); return r === s ? esc(s) : `<span title="${esc(s)}">${esc(r)}</span>`; }; // 翻譯並保留中文原文提示
const fmt = (v, d = 3) => Number(v).toLocaleString('zh-TW', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function toast(msg, ms = 2500) { const t = $('toast'); t.textContent = msg; t.classList.remove('hide'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.add('hide'), ms); }

// ---------------- TWD97 TM2 <-> WGS84 ----------------
const TM2 = (() => {
  const a = 6378137, f = 1 / 298.257222101, e2 = 2 * f - f * f, ep2 = e2 / (1 - e2), k0 = 0.9999, lon0 = 121 * Math.PI / 180, FE = 250000;
  const e4 = e2 * e2, e6 = e4 * e2;
  const Marc = p => a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * p - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * p) + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * p) - (35 * e6 / 3072) * Math.sin(6 * p));
  function fwd(lat, lon) {
    const p = lat * Math.PI / 180, l = lon * Math.PI / 180, s = Math.sin(p), c = Math.cos(p), t = Math.tan(p);
    const N = a / Math.sqrt(1 - e2 * s * s), T = t * t, C = ep2 * c * c, A = (l - lon0) * c;
    const E = FE + k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120);
    const Nn = k0 * (Marc(p) + N * t * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
    return [E, Nn];
  }
  function inv(E, Nn) {
    const mu = Nn / k0 / (a * (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256)), e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
    const s = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1);
    const C1 = ep2 * c * c, T1 = t * t, N1 = a / Math.sqrt(1 - e2 * s * s), R1 = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5), D = (E - FE) / (N1 * k0);
    const lat = p1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
    const lon = lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c;
    return [lat * 180 / Math.PI, lon * 180 / Math.PI];
  }
  return { fwd, inv };
})();

// ---------------- 場景 ----------------
const canvas = $('c');
const EMBED = window.self !== window.top; // 嵌在其他網頁裡（如 claude.ai）：瀏覽器不允許下載檔案、也不給相機
// ★ 現場 AR 開關：自動判斷。相機只能在 https（或 localhost）使用，嵌在其他網頁裡也不行；
//   要強制關閉 AR，把下一行改成 const AR_ON = false;
const AR_ON = window.isSecureContext && !EMBED;
const QM0 = new URLSearchParams(location.search).get('m');      // check / progress / ar
const QM = !AR_ON && QM0 === 'ar' ? 'check' : QM0;              // AR 關閉時，?m=ar 改開模型檢核
// 鋼筋（RB_* 類別，依配筋圖產生、不在 Revit 裡）檔案很大，網址加 ?rebar=1 才下載；「更多」面板有按鈕
const REBAR = new URLSearchParams(location.search).get('rebar') === '1';
const isRB = c => c.key.startsWith('RB_');
if (!AR_ON) document.querySelector('#start [data-mode=ar]')?.remove();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, logarithmicDepthBuffer: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
const BG = [0x1e2430, 0xdfe6ee];
scene.background = new THREE.Color(BG[0]);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.12; controls.maxPolarAngle = Math.PI * 0.98;
scene.add(new THREE.HemisphereLight(0xffffff, 0x50586a, 1.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(0.5, 1, 0.35); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-0.6, 0.4, -0.5); scene.add(fill);

const clipPlanes = [0, 1, 2, 3, 4, 5].map(() => new THREE.Plane());
const solidMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
const ghostMat = new THREE.MeshLambertMaterial({ color: 0x9fb4cc, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
const world = new THREE.Group(); scene.add(world);     // 模型本體
const overlay = new THREE.Group(); scene.add(overlay); // 測量、GPS 等（不受剖面影響）

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---------------- 狀態 ----------------
const S = {
  mode: null, tool: 'select', cats: [], sel: null, hidden: new Set(), isolate: null,
  phase: 0, showFuture: true, useMat: true, clip: { on: false, box: new THREE.Box3() }, xray: REBAR,
  bbox: new THREE.Box3(), measures: [], mpt: null, walk: false, gps: null, bgLight: false,
};
let MAN = null, PH = [];
const rgb = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const C_SEL = rgb(0x22d3ee), C_NEW = rgb(0xf59e0b), C_DEMO = rgb(0xef4444), C_DIM = rgb(0xc4cad3);
Object.assign(S, { schemes: [], scheme: null, legShow: [], dimOthers: true, hideMode: 2, views: [], view: null });

// Base64 文字（Uint8Array 的 ASCII 位元組）→ ArrayBuffer；忽略換行等非 Base64 字元
const B64T = (() => { const a = new Int16Array(256).fill(-1); 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('').forEach((c, i) => a[c.charCodeAt(0)] = i); return a; })();
function b64decode(src) {
  const out = new Uint8Array(Math.floor(src.length * 3 / 4)); let o = 0, acc = 0, bits = 0;
  for (let i = 0; i < src.length; i++) {
    const v = B64T[src[i]]; if (v < 0) continue;
    acc = (acc << 6) | v; bits += 6;
    if (bits >= 8) { bits -= 8; out[o++] = (acc >> bits) & 255; }
  }
  return out.buffer.slice(0, o);
}

// ---------------- 載入 ----------------
async function load() {
  MAN = await (await fetch('data/manifest.json?t=' + Date.now(), { cache: 'no-store' })).json();
  if (MAN.busy) throw new Error('BUSY'); // Revit 外掛正在匯出
  PH = MAN.phases;
  const V = '?v=' + encodeURIComponent(MAN.exported); // 重新匯出後避免讀到瀏覽器快取的舊資料
  S.ver = V;
  showVersion();
  const phIdx = new Map(PH.map((p, i) => [p, i]));
  // AR（手機現場）不需要地形：現場就是真實地面，也省下約 20 MB 下載與記憶體
  const CATS = (QM === 'ar' ? MAN.cats.filter(c => c.key !== 'OST_Toposolid') : MAN.cats).filter(c => REBAR || !isRB(c));
  // 幾何檔可用 Base64 文字存放（manifest.binEnc = 'b64'，給只接受文字／媒體檔的主機，如 claude.ai 公開分享）
  const B64 = MAN.binEnc === 'b64';
  const total = CATS.reduce((s, c) => s + c.bytes, 0) * (B64 ? 4 / 3 : 1); let got = 0;
  const prog = () => { $('loadbar').firstElementChild.style.width = Math.min(100, got / total * 100).toFixed(1) + '%'; $('loadtxt').textContent = t('載入模型中… {a} / {b} MB', { a: (Math.min(got, total) / 1048576).toFixed(1), b: (total / 1048576).toFixed(1) }); };
  async function fetchBuf(url) {
    const r = await fetch(url); if (!r.ok) throw new Error('MISMATCH'); const reader = r.body.getReader(); const parts = []; let n = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); n += value.length; got += value.length; prog(); }
    const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
    return B64 ? b64decode(out) : out.buffer;
  }
  // GitHub Pages 上的幾何檔是 meshopt 無損壓縮（manifest.binFmt = 'meshopt'，publish.bat 產生 data/<key>.m.bin），下載量約少 40%
  const MO = MAN.binFmt === 'meshopt' ? (await import('./vendor/meshopt_decoder.module.js')).MeshoptDecoder : null;
  if (MO) await MO.ready;
  await Promise.all(CATS.map(async (cm, ci) => {
    // 幾何檔副檔名：預設 .bin；放在只接受特定檔案類型的主機（如 claude.ai）時改名（manifest.binExt）
    const BX = MO ? 'm.bin' : MAN.binExt || 'bin';
    // 大檔可分段放置（cm.parts：data/<key>.0.bin、.1.bin…，給有單檔大小限制的主機用），讀進來再接回一個檔
    const binP = cm.parts > 1
      ? Promise.all(Array.from({ length: cm.parts }, (_, i) => fetchBuf(`data/${cm.key}.${i}.${BX}${V}`))).then(bs => {
        const out = new Uint8Array(bs.reduce((s, b) => s + b.byteLength, 0)); let o = 0; for (const b of bs) { out.set(new Uint8Array(b), o); o += b.byteLength; } return out.buffer; })
      : fetchBuf(`data/${cm.key}.${BX}${V}`);
    let [buf, meta] = await Promise.all([binP, fetch(`data/${cm.key}.meta.json${V}`).then(r => r.json())]);
    const nv = meta.nv, ni = meta.ni;
    if (MO) {
      const src = new Uint8Array(buf), out = new Uint8Array(nv * 12 + ni * 4);
      MO.decodeVertexBuffer(out.subarray(0, nv * 12), nv, 12, src.subarray(0, cm.vb));
      MO.decodeIndexBuffer(out.subarray(nv * 12), ni, 4, src.subarray(cm.vb));
      buf = out.buffer;
    }
    // 幾何檔與構件清單必須是同一次匯出（匯出進行中讀取會不一致）
    if (buf.byteLength !== nv * 12 + ni * 4 || meta.els.length !== cm.n) throw new Error('MISMATCH');
    const pos = new Float32Array(buf, 0, nv * 3), idx = new Uint32Array(buf, nv * 12, ni);
    const els = meta.els, n = els.length;
    const v0 = new Uint32Array(n), v1 = new Uint32Array(n), phi = new Int16Array(n), pdi = new Int16Array(n), base = new Float32Array(n * 3);
    const crgb = rgb(cm.color);
    els.forEach((e, k) => {
      let lo = Infinity, hi = 0; for (let i = e.i0, j = e.i0 + e.ic; i < j; i++) { const v = idx[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
      v0[k] = lo; v1[k] = hi + 1;
      phi[k] = phIdx.has(e.ph) ? phIdx.get(e.ph) : 0; pdi[k] = phIdx.has(e.pd) ? phIdx.get(e.pd) : -1;
      const c = e.c >= 0 ? rgb(e.c) : crgb; base.set(c, k * 3);
    });
    const geom = new THREE.BufferGeometry();
    const pa = new THREE.BufferAttribute(pos, 3), ca = new THREE.BufferAttribute(new Float32Array(nv * 3), 3);
    geom.setAttribute('position', pa); geom.setAttribute('color', ca); geom.setIndex(new THREE.BufferAttribute(idx, 1));
    geom.computeVertexNormals(); geom.computeBoundingSphere(); geom.computeBoundingBox();
    const ggeom = new THREE.BufferGeometry(); ggeom.setAttribute('position', pa); ggeom.setAttribute('normal', geom.getAttribute('normal'));
    ggeom.boundingSphere = geom.boundingSphere; ggeom.boundingBox = geom.boundingBox;
    const pgeom = new THREE.BufferGeometry(); pgeom.setAttribute('position', pa); pgeom.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
    pgeom.computeBoundsTree();
    const mesh = new THREE.Mesh(geom, solidMat), ghost = new THREE.Mesh(ggeom, ghostMat), pick = new THREE.Mesh(pgeom, solidMat);
    ghost.renderOrder = 2; pick.updateMatrixWorld();
    world.add(mesh, ghost);
    S.cats[ci] = { ...cm, ci, els, idx, pos, v0, v1, phi, pdi, base, crgb, n, geom, ggeom, mesh, ghost, pick, ca, vis: new Uint8Array(n), on: cm.on !== false, props: null,
      idIdx: new Map(els.map((e, k) => [e.id, k])), sc: new Int16Array(n).fill(-1), sh: new Int16Array(n).fill(-1) };
    S.bbox.union(geom.boundingBox);
  }));
  S.cats = S.cats.filter(Boolean);
  S.cats.forEach((c, i) => c.ci = i);
  S.clip.box.copy(S.bbox);
  await loadSchemes(V);
  await loadViews(V);
  applyState(); fitAll(false);
  if (S.xray) setXray(true, false), fitAll(false);
  S.loadedN = S.cats.reduce((s, c) => s + c.n, 0);
  $('loadtxt').textContent = t('載入完成：{n} 個構件', { n: S.loadedN.toLocaleString() });
}

// ---------------- 模型更新時間 ----------------
function showVersion() {
  const time = MAN.exported || '';
  const days = (Date.now() - new Date(time.replace(' ', 'T'))) / 864e5;
  const ago = !isFinite(days) ? '' : days < 1 / 24 ? t('剛剛') : days < 1 ? t('{n} 小時前', { n: Math.floor(days * 24) }) : t('{n} 天前', { n: Math.floor(days) });
  const v = $('ver');
  v.innerHTML = `${t('模型更新：')}<b>${esc(time)}</b>${ago ? ` (${ago})` : ''}`;
  v.classList.toggle('old', days > 7);
  v.title = t('點擊查看各類別匯出時間') + (days > 7 ? t('｜已超過 7 天未更新') : '');
  v.onclick = () => setTool('more');
  $('startver').textContent = t('模型資料：{src}｜{t} 匯出', { src: MAN.source, t: time });
}

// ---------------- 顏色方案（Revit 視圖樣版） ----------------
async function loadSchemes(V) {
  try {
    const r = await fetch('data/schemes.json' + V); if (!r.ok) throw 0;
    S.schemes = (await r.json()).schemes || [];
  } catch { S.schemes = []; }
  const sel = $('schsel');
  schemeOptions();
  sel.onchange = () => setScheme(sel.value);
  $('legbtn').onclick = () => { const L = $('legend'); L.classList.toggle('hide'); $('legbtn').classList.toggle('on', !L.classList.contains('hide')); };
  $('scheme').classList.remove('hide');
  let saved = null, extra = []; try { saved = localStorage.getItem('w3d.scheme'); extra = JSON.parse(localStorage.getItem('w3d.schemeX') || '[]'); } catch {}
  if (saved != null) {
    const i = S.schemes.findIndex(s => s.name === saved);
    if (i >= 0) { sel.value = String(i); setScheme(String(i), false, extra.map(n => S.schemes.findIndex(s => s.name === n)).filter(j => j >= 0 && j !== i)); }
    else if (saved === 'cat') { sel.value = 'cat'; setScheme('cat', false); }
  }
}
function schemeOptions() {
  const sel = $('schsel'), v = sel.value;
  sel.innerHTML = `<option value="mat">${t('材料色')}</option><option value="cat">${t('類別色')}</option>` +
    (S.schemes.some(s => !s.view) ? `<optgroup label="${t('Revit 視圖樣版')}">${S.schemes.map((s, i) => s.view ? '' : `<option value="${i}">${esc(tc(s.name))}</option>`).join('')}</optgroup>` : '');
  if (v) sel.value = v;
}
// 顏色方案可以多選疊加（例如大樑分色＋小樑分色）：val 是主要樣版，extra 是疊加的其他樣版（索引）。
// 合併規則：顏色以先選的樣版優先；構件只有在「沒有任何已選樣版替它上色」時才套用樣版的隱藏；類別要所有樣版都關閉才隱藏。
function setScheme(val, apply = true, extra = []) {
  for (const c of S.cats) { c.sc.fill(-1); c.sh.fill(-1); }
  S.scheme = null;
  if (val === 'mat' || val === 'cat') {
    S.useMat = val === 'mat';
    try { localStorage.setItem('w3d.scheme', val); localStorage.removeItem('w3d.schemeX'); } catch {}
  } else {
    const list = [+val, ...extra.filter(i => i !== +val && S.schemes[i])];
    const byKey = new Map(S.cats.map(c => [c.key, c]));
    const legend = [], catColor = {}; let hiddenCats = null;
    for (const si of list) {
      const s = S.schemes[si], off = legend.length;
      legend.push(...s.legend.map(l => ({ ...l, g: si })));
      for (const [key, g] of Object.entries(s.els)) {
        const c = byKey.get(key); if (!c) continue;
        for (const [id, li] of Object.entries(g.c || {})) { const k = c.idIdx.get(+id); if (k !== undefined && c.sc[k] < 0) c.sc[k] = li + off; }
      }
      for (const [k, li] of Object.entries(s.catColor || {})) if (catColor[k] === undefined) catColor[k] = li + off;
      const hc = new Set(s.hiddenCats); hiddenCats = hiddenCats ? new Set([...hiddenCats].filter(k => hc.has(k))) : hc;
    }
    for (const si of list) {
      const s = S.schemes[si], off = legend.findIndex(l => l.g === si);
      for (const [key, g] of Object.entries(s.els)) {
        const c = byKey.get(key); if (!c) continue;
        for (const [id, li] of Object.entries(g.h || {})) { const k = c.idIdx.get(+id); if (k !== undefined && c.sc[k] < 0 && c.sh[k] < 0) c.sh[k] = li + off; }
      }
    }
    const name = list.map(i => S.schemes[i].name).join(' ＋ ');
    S.useMat = true;
    S.scheme = { name, list, legend, catColor, idx: +val, hiddenCats, rgb: legend.map(l => l.color >= 0 ? rgb(l.color) : null) };
    S.legShow = legend.map(l => !l.hide);
    try { localStorage.setItem('w3d.scheme', S.schemes[+val].name); localStorage.setItem('w3d.schemeX', JSON.stringify(list.slice(1).map(i => S.schemes[i].name))); } catch {}
  }
  renderLegend();
  // 使用者手動切換時才自動打開圖例（開網頁時沿用上次的方案則不打開，避免手機上蓋住畫面）
  if (S.scheme && apply) { $('legend').classList.remove('hide'); $('legbtn').classList.add('on'); }
  else if (!apply) { $('legend').classList.add('hide'); $('legbtn').classList.remove('on'); }
  if (apply) applyState();
}
function renderLegend() {
  const L = $('legend'), s = S.scheme;
  $('legbtn').disabled = !s;
  if (!s) { L.classList.add('hide'); $('legbtn').classList.remove('on'); return; }
  const hidCats = [...s.hiddenCats].map(k => S.cats.find(c => c.key === k)).filter(Boolean).map(cn);
  const multi = s.list.length > 1;
  L.innerHTML = `<header><span title="${esc(s.name)}">${esc(s.list.map(i => tc(S.schemes[i].name)).join(' ＋ '))}</span><button class="x">×</button></header><div class="body">
    <p class="mut" style="margin:0 0 6px">${t('點選項目可切換顯示。上方的篩選器優先權較高（同 Revit）。')}</p>
    ${s.legend.map((l, i) => `${multi && (i === 0 || s.legend[i - 1].g !== l.g) ? `<div class="lgh">${esc(tc(S.schemes[l.g].name))}</div>` : ''}<div class="lg ${S.legShow[i] ? '' : 'off'}" data-i="${i}">
      <span class="sw" style="background:${l.color >= 0 ? '#' + l.color.toString(16).padStart(6, '0') : 'transparent'}"></span>
      <span class="nm" title="${esc(l.name)}">${esc(tc(l.name))}</span>${l.hide ? `<span class="tag" title="${t('Revit 樣版中此篩選器設為不可見')}">${t('樣版隱藏')}</span>` : ''}<span class="cnt">${l.n ? l.n.toLocaleString() : ''}</span></div>`).join('')}
    ${S.schemes.filter(x => !x.view).length > 1 ? `<details class="lgx" ${multi ? 'open' : ''}><summary>${t('疊加其他樣版')}${multi ? ` (${s.list.length - 1})` : ''}</summary>
      ${S.schemes.map((x, i) => i === s.idx || x.view ? '' : `<label class="chk"><input type="checkbox" data-x="${i}" ${s.list.includes(i) ? 'checked' : ''}> ${esc(tc(x.name))}</label>`).join('')}</details>` : ''}
    <div class="row" style="margin-top:8px"><button class="btn sm" id="lgall">${t('全部顯示')}</button><button class="btn sm" id="lgreset">${t('還原樣版設定')}</button></div>
    <div class="row"><label><input type="checkbox" id="lgdim" ${S.dimOthers ? 'checked' : ''}> ${t('其他構件以淺灰顯示')}</label></div>
    <div class="row"><label>${t('樣版隱藏的構件：')}<select id="lghide"><option value="2" ${S.hideMode === 2 ? 'selected' : ''}>${t('半透明')}</option><option value="0" ${S.hideMode === 0 ? 'selected' : ''}>${t('不顯示')}</option></select></label></div>
    ${hidCats.length ? `<p class="mut">${t('樣版關閉的類別：')}${esc(hidCats.join(', '))}</p>` : ''}</div>`;
  L.querySelector('.x').onclick = () => { L.classList.add('hide'); $('legbtn').classList.remove('on'); };
  L.querySelectorAll('[data-x]').forEach(cb => cb.onchange = () => {
    const i = +cb.dataset.x, ex = s.list.slice(1).filter(j => j !== i); if (cb.checked) ex.push(i);
    const open = !L.classList.contains('hide'); setScheme(String(s.idx), true, ex); if (!open) L.classList.add('hide');
  });
  L.querySelectorAll('.lg').forEach(d => d.onclick = () => { const i = +d.dataset.i; S.legShow[i] = !S.legShow[i]; renderLegend(); applyState(); });
  $('lgall').onclick = () => { S.legShow = s.legend.map(() => true); renderLegend(); applyState(); };
  $('lgreset').onclick = () => { S.legShow = s.legend.map(l => !l.hide); renderLegend(); applyState(); };
  $('lgdim').onchange = e => { S.dimOthers = e.target.checked; applyState(); };
  $('lghide').onchange = e => { S.hideMode = +e.target.value; applyState(); };
  dragWin(L);
}
function schemeInfo(cat, k) {
  const s = S.scheme; if (!s) return '';
  const parts = [];
  if (cat.sc[k] >= 0) parts.push(tc(s.legend[cat.sc[k]].name));
  if (cat.sh[k] >= 0 && cat.sh[k] !== cat.sc[k]) parts.push(tc(s.legend[cat.sh[k]].name) + t('（隱藏）'));
  if (!parts.length && s.catColor[cat.key] !== undefined) parts.push(tc(s.legend[s.catColor[cat.key]].name));
  return `<tr><td>${esc(s.list.map(i => tc(S.schemes[i].name)).join(' ＋ '))}</td><td>${esc(parts.join(', ') || '—')}</td></tr>`;
}

// ---------------- Revit 已發布的 3D 視圖（data/views.json，來自 Revit「發布設定」） ----------------
// 切換後：視角、剖面框、視圖中隱藏的構件與顏色（視圖樣版）都和 Revit 一致。
async function loadViews(V) {
  try { const r = await fetch('data/views.json' + V); if (!r.ok) throw 0; S.views = (await r.json()).views || []; } catch { S.views = []; }
  $('vbtn').classList.toggle('hide', !S.views.length);
  $('vbtn').onclick = () => { const L = $('vlist'); if (L.classList.contains('hide')) renderViews(); L.classList.toggle('hide'); $('vbtn').classList.toggle('on', !L.classList.contains('hide')); };
}
function renderViews() {
  const L = $('vlist');
  L.innerHTML = `<header><span>${t('Revit 視圖')}</span><button class="x">×</button></header><div class="body">
    <div class="vi ${S.view ? '' : 'on'}" data-i="-1">${t('（不套用視圖，顯示全部）')}</div>
    ${S.views.map((v, i) => `<div class="vi ${S.view?.i === i ? 'on' : ''}" data-i="${i}">${esc(tc(v.name))}${v.box ? `<span class="tag">${t('剖面框')}</span>` : ''}</div>`).join('')}</div>`;
  L.querySelector('.x').onclick = () => { L.classList.add('hide'); $('vbtn').classList.remove('on'); };
  L.querySelectorAll('.vi').forEach(d => d.onclick = () => { applyView(+d.dataset.i); renderViews(); if (innerWidth < 700) { L.classList.add('hide'); $('vbtn').classList.remove('on'); } });
}
function applyView(i) {
  const v = S.views[i];
  if (!v) {
    if (S.view?.prev) Object.assign(S, S.view.prev);
    S.view = null; updateClip(); applyState(); fitAll(); $('vbtn').classList.remove('act'); return;
  }
  const mask = new Map();
  for (const [key, g] of Object.entries(v.els || {})) {
    const c = S.cats.find(x => x.key === key); if (!c) continue;
    const m = new Uint8Array(c.n);
    if (g.s) { m.fill(1); for (const id of g.s) { const k = c.idIdx.get(id); if (k !== undefined) m[k] = 0; } }
    else for (const id of g.h || []) { const k = c.idIdx.get(id); if (k !== undefined) m[k] = 1; }
    mask.set(key, m);
  }
  let planes = null;
  if (v.box) {
    const o = new THREE.Vector3(...v.box.o);
    planes = [v.box.a, v.box.b, v.box.c].flatMap(e => {
      const ev = new THREE.Vector3(...e), n = ev.clone().normalize();
      return [new THREE.Plane(n, -n.dot(o)), new THREE.Plane(n.clone().negate(), n.dot(o.clone().add(ev)))];
    });
  }
  // Revit 視圖中樣版隱藏的構件就是看不到、其他構件維持原色：切換視圖時比照（離開視圖時還原使用者設定）
  const prev = S.view?.prev || { hideMode: S.hideMode, dimOthers: S.dimOthers };
  S.hideMode = 0; S.dimOthers = false;
  S.view = { i, name: v.name, hc: new Set(v.hc || []), mask, planes, prev };
  S.clip.on = false; updateClip();
  // 顏色：視圖樣版（或視圖本身的篩選器）；沒有就用材料色
  const si = v.scheme ? S.schemes.findIndex(s => s.name === v.scheme) : -1;
  const sel = $('schsel');
  if (si >= 0) { sel.value = S.schemes[si].view ? 'mat' : String(si); setScheme(String(si), true); if (S.schemes[si].view) sel.value = 'mat'; }
  else { sel.value = 'mat'; setScheme('mat', true); }
  // 視角：透視圖用 Revit 相機位置；等角圖沿 Revit 的視線方向框住視圖內容
  const dir = new THREE.Vector3(...v.dir).normalize();
  const fit = v.fit ? new THREE.Box3(new THREE.Vector3(...v.fit[0]), new THREE.Vector3(...v.fit[1])) : S.bbox;
  if (v.persp) { const eye = new THREE.Vector3(...v.eye); const d = Math.max(fit.getCenter(new THREE.Vector3()).sub(eye).dot(dir), 10); flyTo(eye.clone().addScaledVector(dir, d), eye); }
  else frame(fit, dir.clone().negate());
  $('vbtn').classList.add('act');
  toast(t('視圖：{n}', { n: tc(v.name) }));
}

// ---------------- 顯示狀態（可見、顏色、透明） ----------------
// 鋼筋透視時，只留「有鋼筋的構件類別」當半透明外殼
const XRAY_HOST = { RB_Caissons: /^OST_BridgeFoundations$/, RB_Piers: /^OST_StructuralColumns$/, RB_Abutments: /^OST_StructuralColumns$/ };
const xrayGhost = key => Object.entries(XRAY_HOST).some(([rb, re]) => re.test(key) && S.cats.some(c => c.key === rb));
function setXray(on, zoom = true) {
  S.xray = on; applyState();
  if (zoom) { const b = new THREE.Box3(); S.cats.forEach(c => { if (isRB(c)) b.union(c.geom.boundingBox); }); if (on && !b.isEmpty()) frame(b); else fitAll(); }
}
function applyState() {
  for (const cat of S.cats) {
    const col = cat.ca.array, { n, v0, v1, base, phi, pdi, vis } = cat;
    for (let k = 0; k < n; k++) {
      let v = cat.on ? 1 : 0, c = null;
      if (v) {
        const key = cat.ci + ':' + k;
        if (S.hidden.has(key)) v = 0;
        else if (S.view && (S.view.hc.has(cat.key) || S.view.mask.get(cat.key)?.[k])) v = 0;
        else if (S.isolate && !S.isolate.has(key)) v = 2;
        const sch = S.scheme;
        if (v === 1 && sch) {
          if (sch.hiddenCats.has(cat.key)) v = S.hideMode;
          else {
            const lh = cat.sh[k], lc = cat.sc[k] >= 0 ? cat.sc[k] : (sch.catColor[cat.key] ?? -1);
            if (lh >= 0 && !S.legShow[lh]) v = S.hideMode;
            else if (lc >= 0) { if (S.legShow[lc]) c = sch.rgb[lc]; else v = 2; }
            else if (S.dimOthers) c = C_DIM;
          }
        }
        if (v && S.mode === 'progress') {
          const p = phi[k], d = pdi[k], cur = S.phase;
          if (p > cur) v = S.showFuture ? 2 : 0;
          else if (d >= 0 && d < cur) v = 0;
          else if (d === cur) c = C_DEMO;
          else if (p === cur) c = C_NEW;
        }
        if (v && S.ar) { // AR：只顯示「完成到指定階段」時存在的構件，不顯示半透明
          const ap = S.ar.phase;
          if (S.ar.inside?.has(key)) v = 0;
          if (ap >= 0 && (phi[k] > ap || (pdi[k] >= 0 && pdi[k] <= ap))) v = 0;
          if (v === 2) v = 0;
        }
        // 鋼筋透視：鋼筋類別（RB_*）照常顯示，有鋼筋的混凝土類別改半透明，其餘隱藏
        if (v === 1 && S.xray && !isRB(cat)) v = xrayGhost(cat.key) ? 2 : 0;
        if (v && S.sel && S.sel.ci === cat.ci && S.sel.k === k) { v = 1; c = C_SEL; }
      }
      vis[k] = v;
      const r = c ? c[0] : S.useMat ? base[k * 3] : cat.crgb[0], g = c ? c[1] : S.useMat ? base[k * 3 + 1] : cat.crgb[1], b = c ? c[2] : S.useMat ? base[k * 3 + 2] : cat.crgb[2];
      for (let i = v0[k] * 3, j = v1[k] * 3; i < j; i += 3) { col[i] = r; col[i + 1] = g; col[i + 2] = b; }
    }
    cat.ca.needsUpdate = true;
    let ns = 0, ng = 0; const { els, idx } = cat;
    for (let k = 0; k < n; k++) { if (vis[k] === 1) ns += els[k].ic; else if (vis[k] === 2) ng += els[k].ic; }
    const s = new Uint32Array(ns), g = new Uint32Array(ng); let os = 0, og = 0;
    for (let k = 0; k < n; k++) {
      const e = els[k]; if (!vis[k]) continue; const sub = idx.subarray(e.i0, e.i0 + e.ic);
      if (vis[k] === 1) { s.set(sub, os); os += e.ic; } else { g.set(sub, og); og += e.ic; }
    }
    cat.geom.setIndex(new THREE.BufferAttribute(s, 1)); cat.ggeom.setIndex(new THREE.BufferAttribute(g, 1));
    cat.mesh.visible = ns > 0; cat.ghost.visible = ng > 0;
  }
}

// ---------------- 選取 / 射線 ----------------
const ray = new THREE.Raycaster(); ray.firstHitOnly = false;
const ndc = new THREE.Vector2();
function elOf(cat, v) { let lo = 0, hi = cat.n - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (cat.v0[m] <= v) lo = m; else hi = m - 1; } return lo; }
function inClip(p) { if (S.view?.planes && S.view.planes.some(P => P.distanceToPoint(p) < -1e-3)) return false; if (!S.clip.on) return true; const b = S.clip.box; return p.x >= b.min.x - 1e-3 && p.x <= b.max.x + 1e-3 && p.y >= b.min.y - 1e-3 && p.y <= b.max.y + 1e-3 && p.z >= b.min.z - 1e-3 && p.z <= b.max.z + 1e-3; }
function castRay(origin, dir) {
  ray.set(origin, dir); let best = null;
  for (const cat of S.cats) {
    if (!cat.on) continue;
    for (const h of ray.intersectObject(cat.pick, false)) {
      if (best && h.distance >= best.distance) break;
      const k = elOf(cat, h.face.a); if (cat.vis[k] !== 1 || !inClip(h.point)) continue;
      best = { cat, k, point: h.point.clone(), distance: h.distance }; break;
    }
  }
  return best;
}
function pickAt(x, y) {
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  return castRay(ray.ray.origin.clone(), ray.ray.direction.clone());
}

// ---------------- 座標顯示 ----------------
const toEN = p => [p.x + MAN.E0, MAN.N0 - p.z];
const fromEN = (E, N, H = 0) => new THREE.Vector3(E - MAN.E0, H, MAN.N0 - N);
function hudPoint(p) {
  if (!p) { $('hudxyz').textContent = t('X Y Z 模型座標'); return; }
  const [E, N] = toEN(p), [lat, lon] = TM2.inv(E, N);
  $('hudxyz').textContent = `E ${fmt(E)}  N ${fmt(N)}  H ${fmt(p.y)}　(${lat.toFixed(6)}, ${lon.toFixed(6)})`;
}

// ---------------- 視角 ----------------
function frame(box, dir = new THREE.Vector3(-0.55, 0.65, 0.75), animate = true) {
  const c = box.getCenter(new THREE.Vector3()), r = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 2);
  const dist = r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.9;
  flyTo(c, c.clone().add(dir.clone().normalize().multiplyScalar(dist)), animate);
}
function fitAll(a = true) { frame(S.clip.on ? S.clip.box : S.bbox, undefined, a); }
let fly = null;
function flyTo(target, pos, animate = true) {
  if (S.walk) exitWalk();
  if (!animate) { controls.target.copy(target); camera.position.copy(pos); controls.update(); return; }
  fly = { t0: performance.now(), dur: 700, ft: controls.target.clone(), fp: camera.position.clone(), tt: target, tp: pos };
}
function setView(v) {
  const box = S.clip.on ? S.clip.box : S.bbox;
  const d = { top: [0, 1, 0.0001], n: [0, 0.35, -1], s: [0, 0.35, 1], e: [1, 0.35, 0], w: [-1, 0.35, 0], iso: [-0.55, 0.65, 0.75] }[v];
  frame(box, new THREE.Vector3(...d));
}
document.querySelectorAll('#views button').forEach(b => b.onclick = () => setView(b.dataset.view));
$('compass').onclick = () => setView('top');

// 平移縮放按鈕
let panMode = false;
$('nvpan').onclick = () => {
  panMode = !panMode; $('nvpan').classList.toggle('on', panMode);
  controls.mouseButtons.LEFT = panMode ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
  controls.touches.ONE = panMode ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
};
function dolly(f) {
  if (S.walk) { const d = new THREE.Vector3(); camera.getWorldDirection(d); camera.position.addScaledVector(d, f > 1 ? -10 : 10); return; }
  const off = camera.position.clone().sub(controls.target).multiplyScalar(f); camera.position.copy(controls.target).add(off);
}
function lift(s) { const d = S.walk ? 3 : camera.position.distanceTo(controls.target) * 0.08; camera.position.y += s * d; controls.target.y += s * d; }
$('nvin').onclick = () => dolly(0.75); $('nvout').onclick = () => dolly(1 / 0.75);
$('nvup').onclick = () => lift(1); $('nvdn').onclick = () => lift(-1);

// ---------------- 漫遊 ----------------
const keys = new Set(); let yaw = 0, pitch = 0;
function enterWalk() {
  S.walk = true; controls.enabled = false;
  const d = new THREE.Vector3(); camera.getWorldDirection(d);
  yaw = Math.atan2(-d.x, -d.z); pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
  // 若在高空，降到視點附近
  const h = castRay(new THREE.Vector3(controls.target.x, S.bbox.max.y + 50, controls.target.z), new THREE.Vector3(0, -1, 0));
  if (camera.position.distanceTo(controls.target) > 150) {
    const gy = h ? h.point.y : controls.target.y;
    camera.position.set(controls.target.x, gy + 1.7, controls.target.z); pitch = 0;
  }
  toast(t('漫遊：拖曳轉向，W A S D／方向鍵移動，Q E 升降，Shift 加速，滾輪前後'), 4500);
}
function exitWalk() {
  S.walk = false; const d = new THREE.Vector3(); camera.getWorldDirection(d);
  controls.target.copy(camera.position).addScaledVector(d, 30); controls.enabled = true; controls.update();
  setToolBtn('walk', false);
}
function walkStep(dt) {
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
  const sp = (keys.has('shift') ? 60 : 12) * dt;
  const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), r = new THREE.Vector3(-f.z, 0, f.x);
  if (keys.has('w') || keys.has('arrowup')) camera.position.addScaledVector(f, sp);
  if (keys.has('s') || keys.has('arrowdown')) camera.position.addScaledVector(f, -sp);
  if (keys.has('d') || keys.has('arrowright')) camera.position.addScaledVector(r, sp);
  if (keys.has('a') || keys.has('arrowleft')) camera.position.addScaledVector(r, -sp);
  if (keys.has('e')) camera.position.y += sp; if (keys.has('q')) camera.position.y -= sp;
}
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; keys.add(e.key.toLowerCase()); if (e.key === 'Escape') { if (S.walk) exitWalk(); else select(null); } });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
canvas.addEventListener('wheel', e => { if (S.walk) { e.preventDefault(); const d = new THREE.Vector3(); camera.getWorldDirection(d); camera.position.addScaledVector(d, -Math.sign(e.deltaY) * 4); } }, { passive: false });

// ---------------- 滑鼠 / 觸控 ----------------
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, id: e.pointerId }; if (S.walk) canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (S.walk && down && e.pointerId === down.id) {
    yaw -= (e.clientX - down.lx) * 0.004; pitch = THREE.MathUtils.clamp(pitch - (e.clientY - down.ly) * 0.004, -1.5, 1.5);
    down.lx = e.clientX; down.ly = e.clientY;
  }
  if (e.pointerType === 'mouse' && !down) { hoverXY = [e.clientX, e.clientY]; }
});
canvas.addEventListener('pointerup', e => {
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
  if (moved > 5) return;
  if (S.ar && S.ar.step !== 'view') return; // AR 校正前模型是隱藏的
  const h = pickAt(e.clientX, e.clientY);
  if (S.tool === 'measure') { if (h) addMeasurePoint(h.point); return; }
  if (S.tool === 'locate' && h) { showPointInfo(h.point); return; }
  select(h ? { ci: h.cat.ci, k: h.k } : null);
});
let hoverXY = null, hoverT = 0;

// ---------------- 選取與資訊視窗 ----------------
async function select(s) {
  S.sel = s; applyState();
  if (!s) { $('info').classList.add('hide'); return; }
  const cat = S.cats[s.ci], e = cat.els[s.k];
  const box = elBox(cat, s.k), c = box.getCenter(new THREE.Vector3()), [E, N] = toEN(c);
  const w = $('info'); w.classList.remove('hide');
  w.innerHTML = `<header><span title="${esc((e.f || cat.name) + (e.t ? '：' + e.t : ''))}">${esc(e.f ? tc(e.f) : cn(cat))}${e.t ? t('：') + esc(tc(e.t)) : ''}</span><button class="x">×</button></header>
  <div class="body">
   <div class="row"><button class="btn sm" data-a="zoom">${t('縮放至')}</button><button class="btn sm" data-a="iso">${t('隔離')}</button><button class="btn sm" data-a="hide">${t('隱藏')}</button><button class="btn sm" data-a="clip">${t('剖切此處')}</button><button class="btn sm" data-a="all">${t('全部顯示')}</button></div>
   <table class="kv"><tr><td>${t('類別')}</td><td>${esc(cn(cat))}</td></tr><tr><td>${t('元素 ID')}</td><td>${e.id}</td></tr>
   <tr><td>${t('建立階段')}</td><td>${e.ph ? tcx(e.ph) : '—'}</td></tr><tr><td>${t('拆除階段')}</td><td>${e.pd ? tcx(e.pd) : t('無')}</td></tr>
   <tr><td>${t('中心座標')}</td><td>E ${fmt(E)}<br>N ${fmt(N)}<br>H ${fmt(c.y)}</td></tr>
   <tr><td>${t('頂／底高程')}</td><td>${fmt(box.max.y)} / ${fmt(box.min.y)}</td></tr>${schemeInfo(cat, s.k)}</table>
   <h3>${t('Revit 參數')} <input id="pf" type="text" placeholder="${t('篩選…')}" style="float:right;width:120px;padding:1px 6px"></h3>
   <table class="kv" id="ptab"><tr><td colspan="2" class="mut">${t('讀取中…')}</td></tr></table>
  </div>`;
  w.querySelector('.x').onclick = () => select(null);
  w.querySelectorAll('[data-a]').forEach(b => b.onclick = () => elAction(b.dataset.a, s));
  dragWin(w);
  if (!cat.props) { const j = await (await fetch(`data/${cat.key}.json${S.ver}`)).json(); cat.props = new Map(j.els.map(x => [x.id, x.p])); }
  if (S.sel !== s) return;
  const p = cat.props.get(e.id) || {};
  const draw = q => { $('ptab').innerHTML = Object.entries(p).filter(([k, v]) => !q || (k + tp(k) + v).toLowerCase().includes(q)).map(([k, v]) => `<tr><td title="${esc(k)}">${esc(tp(k))}</td><td>${tcx(v)}</td></tr>`).join('') || `<tr><td class="mut">${t('無')}</td></tr>`; };
  draw(''); $('pf').oninput = ev => draw(ev.target.value.trim().toLowerCase());
}
function elBox(cat, k) {
  const b = new THREE.Box3(), v = new THREE.Vector3(), p = cat.pos;
  for (let i = cat.v0[k]; i < cat.v1[k]; i++) b.expandByPoint(v.set(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]));
  return b;
}
function elAction(a, s) {
  const cat = S.cats[s.ci], key = s.ci + ':' + s.k;
  if (a === 'zoom') frame(elBox(cat, s.k));
  if (a === 'iso') { S.isolate = new Set([key]); applyState(); frame(elBox(cat, s.k)); }
  if (a === 'hide') { S.hidden.add(key); select(null); }
  if (a === 'all') { S.hidden.clear(); S.isolate = null; applyState(); }
  if (a === 'clip') { const b = elBox(cat, s.k).expandByScalar(5); S.clip.box.copy(b).intersect(S.bbox); S.clip.on = true; updateClip(); setTool('section'); frame(S.clip.box); }
}
function dragWin(w) {
  const h = w.querySelector('header'); if (!h || innerWidth < 700) return;
  h.onpointerdown = e => {
    if (e.target.closest('button,input')) return;
    const r = w.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
    const mv = ev => { w.style.left = (ev.clientX - ox) + 'px'; w.style.top = (ev.clientY - oy) + 'px'; w.style.right = 'auto'; };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  };
}

// ---------------- 測量 ----------------
const mkDot = (p, color = 0x22d3ee) => {
  const g = new THREE.BufferGeometry().setFromPoints([p]);
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 9, sizeAttenuation: false, depthTest: false }));
  m.renderOrder = 10; overlay.add(m); return m;
};
function addLabel(cls = '') { const d = document.createElement('div'); d.className = 'lbl ' + cls; $('labels').appendChild(d); return d; }
function addMeasurePoint(p) {
  if (!S.mpt) { S.mpt = { p, dot: mkDot(p) }; toast(t('再點第二點')); return; }
  const a = S.mpt.p, b = p;
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: 0x22d3ee, depthTest: false }));
  line.renderOrder = 10; overlay.add(line);
  const m = { a, b, objs: [S.mpt.dot, mkDot(b), line], lbl: addLabel(), d: a.distanceTo(b), dh: Math.hypot(b.x - a.x, b.z - a.z), dz: b.y - a.y };
  m.lbl.textContent = `${fmt(m.d)} m`; S.measures.push(m); S.mpt = null;
  if (S.tool === 'measure') openPanel('measure');
}
function clearMeasures() {
  for (const m of S.measures) { m.objs.forEach(o => { overlay.remove(o); o.geometry.dispose(); }); m.lbl.remove(); }
  if (S.mpt) { overlay.remove(S.mpt.dot); S.mpt = null; }
  S.measures = [];
}

// ---------------- 剖面 ----------------
const clipHelper = new THREE.Box3Helper(S.clip.box, 0xf59e0b); clipHelper.visible = false; overlay.add(clipHelper);
function updateClip() {
  const b = S.clip.box, P = clipPlanes;
  P[0].set(new THREE.Vector3(1, 0, 0), -b.min.x); P[1].set(new THREE.Vector3(-1, 0, 0), b.max.x);
  P[2].set(new THREE.Vector3(0, 1, 0), -b.min.y); P[3].set(new THREE.Vector3(0, -1, 0), b.max.y);
  P[4].set(new THREE.Vector3(0, 0, 1), -b.min.z); P[5].set(new THREE.Vector3(0, 0, -1), b.max.z);
  const all = [...(S.clip.on ? P : []), ...(S.view?.planes || [])];
  solidMat.clippingPlanes = ghostMat.clippingPlanes = all.length ? all : null;
  solidMat.needsUpdate = ghostMat.needsUpdate = true;
  clipHelper.visible = S.clip.on && S.tool === 'section';
}

// ---------------- GPS / 位置 ----------------
const gpsMark = new THREE.Group(); gpsMark.visible = false; overlay.add(gpsMark);
{
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4, 16), new THREE.MeshBasicMaterial({ color: 0xef4444, depthTest: false }));
  cone.rotation.x = Math.PI; cone.position.y = 2; cone.renderOrder = 11; gpsMark.add(cone);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 48), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthTest: false }));
  ring.rotation.x = -Math.PI / 2; ring.renderOrder = 11; ring.name = 'acc'; gpsMark.add(ring);
}
const gpsLbl = addLabel('gps hide');
function groundY(x, z) { const h = castRay(new THREE.Vector3(x, S.bbox.max.y + 100, z), new THREE.Vector3(0, -1, 0)); return h ? h.point.y : null; }
function placeMarker(E, N, acc, text) {
  const p = fromEN(E, N); const gy = groundY(p.x, p.z); p.y = gy ?? S.bbox.min.y;
  gpsMark.position.copy(p); gpsMark.visible = true;
  const r = Math.max(acc || 3, 2); gpsMark.getObjectByName('acc').scale.set(r, r, r);
  gpsLbl.classList.remove('hide'); gpsLbl.textContent = text; gpsLbl._p = p.clone().add(new THREE.Vector3(0, 4.5, 0));
  return p;
}
function goTo(p) { const off = camera.position.clone().sub(controls.target); const d = Math.min(Math.max(off.length(), 60), 400); flyTo(p.clone(), p.clone().add(off.normalize().multiplyScalar(d))); }
function startGPS() {
  if (!navigator.geolocation) { toast(t('此瀏覽器不支援定位')); return; }
  if (!isSecureContext) { toast(t('GPS 需在 https 或 localhost 下才能使用')); return; }
  if (S.gps) { navigator.geolocation.clearWatch(S.gps); S.gps = null; gpsMark.visible = false; gpsLbl.classList.add('hide'); openPanel('locate'); return; }
  let first = true;
  S.gps = navigator.geolocation.watchPosition(pos => {
    const { latitude: la, longitude: lo, accuracy } = pos.coords; const [E, N] = TM2.fwd(la, lo);
    const p = placeMarker(E, N, accuracy, t('我的位置 ±{n} m', { n: Math.round(accuracy) }));
    S.lastGps = { la, lo, E, N, accuracy };
    if (first) { first = false; goTo(p); const inside = p.x > S.bbox.min.x - 500 && p.x < S.bbox.max.x + 500 && p.z > S.bbox.min.z - 500 && p.z < S.bbox.max.z + 500; if (!inside) toast(t('目前位置不在模型範圍附近'), 4000); }
    if (S.tool === 'locate') openPanel('locate');
  }, err => { toast(t('定位失敗：') + err.message, 4000); S.gps = null; }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
  openPanel('locate');
}
function showPointInfo(p) {
  const [E, N] = toEN(p), [la, lo] = TM2.inv(E, N);
  placeMarker(E, N, 0.5, `E ${fmt(E, 2)} N ${fmt(N, 2)} H ${fmt(p.y, 2)}`);
  gpsMark.position.y = p.y; gpsLbl._p = p.clone().add(new THREE.Vector3(0, 4.5, 0));
  S.lastPick = { E, N, H: p.y, la, lo }; openPanel('locate');
}

// ---------------- 工具列與面板 ----------------
function setToolBtn(t, on) { document.querySelector(`#toolbar [data-tool=${t}]`)?.classList.toggle('on', on); }
function setTool(t) {
  if (t === 'walk') { if (S.walk) exitWalk(); else { enterWalk(); setToolBtn('walk', true); } return; }
  if (S.tool === t && !$('panel').classList.contains('hide') && t !== 'select') { $('panel').classList.add('hide'); setToolBtn(t, false); S.tool = 'select'; setToolBtn('select', true); updateClip(); return; }
  ['locate', 'select', 'measure', 'section', 'more'].forEach(x => setToolBtn(x, x === t));
  S.tool = t; if (t !== 'measure' && S.mpt) { overlay.remove(S.mpt.dot); S.mpt = null; }
  if (t === 'select') $('panel').classList.add('hide'); else openPanel(t);
  updateClip();
}
document.querySelectorAll('#toolbar button').forEach(b => b.onclick = () => setTool(b.dataset.tool));

function sliderRow(label, lo, hi, a, b, fmtv, on) {
  const id = 'r' + Math.random().toString(36).slice(2, 7);
  const html = `<div class="mut" id="${id}l">${label}：${fmtv(a)} ～ ${fmtv(b)}</div><div class="dual"><input type="range" id="${id}a" min="0" max="1000" value="${Math.round((a - lo) / (hi - lo) * 1000)}"><input type="range" id="${id}b" min="0" max="1000" value="${Math.round((b - lo) / (hi - lo) * 1000)}"></div>`;
  const bind = () => {
    const A = $(id + 'a'), B = $(id + 'b');
    const f = () => { let x = +A.value, y = +B.value; if (x > y - 1) { if (document.activeElement === A) x = A.value = y - 1; else y = B.value = x + 1; } const va = lo + (hi - lo) * x / 1000, vb = lo + (hi - lo) * y / 1000; $(id + 'l').textContent = `${label}：${fmtv(va)} ～ ${fmtv(vb)}`; on(va, vb); };
    A.oninput = B.oninput = f;
  };
  return { html, bind };
}

function openPanel(tool) {
  const P = $('panel'); P.classList.remove('hide'); let h = '', after = () => {};
  const head = (title) => `<header><span>${title}</span><button class="x">×</button></header>`;
  if (tool === 'measure') {
    h = head(t('測量')) + `<div class="body"><p class="mut">${t('在模型上依序點兩點，量測距離、水平距與高差。')}</p>
      <table><tr><th>#</th><th class="n">${t('距離')}</th><th class="n">${t('水平距')}</th><th class="n">${t('高差')}</th></tr>
      ${S.measures.map((m, i) => `<tr><td>${i + 1}</td><td class="n">${fmt(m.d)}</td><td class="n">${fmt(m.dh)}</td><td class="n">${fmt(m.dz)}</td></tr>`).join('') || `<tr><td colspan="4" class="mut">${t('尚無量測')}</td></tr>`}</table>
      <p class="mut">${t('單位：公尺')}</p><div class="row"><button class="btn" id="mclr">${t('清除全部')}</button></div></div>`;
    after = () => $('mclr').onclick = () => { clearMeasures(); openPanel('measure'); };
  }
  if (tool === 'section') {
    if (!S.clip.on) { S.clip.on = true; updateClip(); }
    const B = S.bbox, C = S.clip.box;
    const ew = sliderRow(t('東西 E'), B.min.x, B.max.x, C.min.x, C.max.x, v => fmt(v + MAN.E0, 1), (a, b) => { C.min.x = a; C.max.x = b; updateClip(); });
    const ns = sliderRow(t('南北 N'), B.min.z, B.max.z, C.min.z, C.max.z, v => fmt(MAN.N0 - v, 1), (a, b) => { C.min.z = a; C.max.z = b; updateClip(); });
    const el = sliderRow(t('高程 H'), B.min.y, B.max.y, C.min.y, C.max.y, v => fmt(v, 1), (a, b) => { C.min.y = a; C.max.y = b; updateClip(); });
    h = head(t('剖面')) + `<div class="body">
      <div class="row"><label><input type="checkbox" id="con" ${S.clip.on ? 'checked' : ''}> ${t('啟用剖面框')}</label></div>
      ${ew.html}${ns.html}${el.html}
      <p class="mut">${t('南北滑桿：左側為北、右側為南。')}</p>
      <div class="row"><button class="btn" id="crst">${t('重設')}</button><button class="btn" id="cfit">${t('縮放至剖面框')}</button></div>
      <p class="mut">${t('提示：選取構件後按「剖切此處」，可快速以該構件為中心剖切。')}</p></div>`;
    after = () => {
      ew.bind(); ns.bind(); el.bind();
      $('con').onchange = e => { S.clip.on = e.target.checked; updateClip(); };
      $('crst').onclick = () => { S.clip.box.copy(S.bbox); updateClip(); openPanel('section'); };
      $('cfit').onclick = () => frame(S.clip.box);
    };
  }
  if (tool === 'locate') {
    const g = S.lastGps, k = S.lastPick;
    h = head(t('位置')) + `<div class="body">
      <div class="row"><button class="btn ${S.gps ? '' : 'pri'}" id="gps">${S.gps ? t('停止 GPS 定位') : t('開啟 GPS 定位')}</button>${g ? `<button class="btn" id="gme">${t('前往我的位置')}</button>` : ''}</div>
      ${g ? `<table class="kv"><tr><td>${t('經緯度')}</td><td>${g.la.toFixed(7)}, ${g.lo.toFixed(7)}</td></tr><tr><td>TWD97</td><td>E ${fmt(g.E, 2)}<br>N ${fmt(g.N, 2)}</td></tr><tr><td>${t('精度')}</td><td>±${Math.round(g.accuracy)} m</td></tr></table>` : `<p class="mut">${t('手機在工地現場開啟後，紅色標記會顯示你在模型中的位置。')}</p>`}
      ${AR_ON ? `<div class="row"><button class="btn" id="goar">${t('📷 現場 AR（鏡頭疊合模型）')}</button></div>` : ''}
      <h3>${t('點選模型查座標')}</h3>
      ${k ? `<table class="kv"><tr><td>TWD97</td><td>E ${fmt(k.E)}<br>N ${fmt(k.N)}</td></tr><tr><td>${t('高程')}</td><td>${fmt(k.H)}</td></tr><tr><td>${t('經緯度')}</td><td>${k.la.toFixed(7)}, ${k.lo.toFixed(7)}</td></tr></table>` : `<p class="mut">${t('開啟此面板時，點模型任一處即顯示該點座標。')}</p>`}
      <h3>${t('前往座標')}</h3>
      <div class="row"><select id="ctype"><option value="tw">TWD97 E, N</option><option value="ll">${t('緯度, 經度')}</option></select></div>
      <div class="row"><input type="text" id="cin" placeholder="${t('例：288900, 2778150')}" style="flex:1"><button class="btn" id="cgo">${t('前往')}</button></div>
      <p class="mut">${t('座標系統：TWD97 TM2（取自 Revit 共用座標），高程單位公尺。')}</p></div>`;
    after = () => {
      $('gps').onclick = startGPS;
      if ($('goar')) $('goar').onclick = () => startMode('ar');
      if (g) $('gme').onclick = () => goTo(gpsMark.position);
      $('cgo').onclick = () => {
        const v = $('cin').value.split(/[,\s]+/).map(Number).filter(x => !isNaN(x));
        if (v.length < 2) { toast(t('請輸入兩個數字')); return; }
        let [E, N] = v; if ($('ctype').value === 'll') [E, N] = TM2.fwd(v[0], v[1]);
        goTo(placeMarker(E, N, 2, `E ${fmt(E, 2)} N ${fmt(N, 2)}`));
      };
    };
  }
  if (tool === 'more') {
    h = head(t('更多')) + `<div class="body">
      <h3>${t('語言')} / Bahasa / Ngôn ngữ</h3>
      <div class="langs" style="justify-content:flex-start;margin:0 0 4px"><button data-lang="zh">中文</button><button data-lang="id">Bahasa Indonesia</button><button data-lang="vi">Tiếng Việt</button></div>
      <h3>${t('構件類別')}</h3>
      ${S.cats.map(c => `<div class="cat"><label title="${esc(c.name)}"><input type="checkbox" data-c="${c.ci}" ${c.on ? 'checked' : ''}><span class="sw" style="background:#${c.color.toString(16).padStart(6, '0')}"></span>${esc(cn(c))}</label><span class="mut" title="${t('匯出時間')}">${esc((c.exported || '').slice(5))}</span><span class="mut" style="min-width:42px;text-align:right">${c.n.toLocaleString()}</span></div>`).join('')}
      <p class="mut">${t('右欄為各類別最後匯出時間（月-日 時:分）與件數。模型更新請在 Revit「3D網站」頁籤按「更新 3D 網站」。')}</p>
      <div class="row"><button class="btn sm" id="call">${t('全選')}</button><button class="btn sm" id="cnone">${t('全不選')}</button><button class="btn sm" id="cshow">${t('取消隱藏／隔離')}</button></div>
      ${S.cats.some(isRB) ? `<div class="row"><label><input type="checkbox" id="xray" ${S.xray ? 'checked' : ''}> ${t('鋼筋透視（混凝土半透明，只看鋼筋）')}</label></div>`
        : MAN.cats.some(isRB) ? `<div class="row"><button class="btn" id="rbload">${t('載入鋼筋（另外下載約 {mb} MB）', { mb: (MAN.cats.filter(isRB).reduce((s, c) => s + c.bytes, 0) / 1048576).toFixed(0) })}</button></div>` : ''}
      <h3>${t('顯示')}</h3>
      <div class="row"><label><input type="checkbox" id="umat" ${S.useMat ? 'checked' : ''}> ${t('使用 Revit 材料顏色（取消則依類別上色）')}</label></div>
      <div class="row"><label><input type="checkbox" id="bgl" ${S.bgLight ? 'checked' : ''}> ${t('淺色背景')}</label></div>
      <div class="row"><button class="btn" id="vfit">${t('全部縮放')}</button>${EMBED ? '' : `<button class="btn" id="shot">${t('截圖下載')}</button>`}</div>
      <h3>${t('操作說明')}</h3>
      <p class="mut">${t('左鍵拖曳：旋轉｜右鍵拖曳：平移｜滾輪：縮放<br>手機：單指旋轉、雙指縮放平移；「平移」鈕可切換單指平移。<br>Esc：取消選取／離開漫遊')}</p>
      <p class="mut">${t('資料來源：')}${esc(MAN.source)}<br>${t('匯出時間：')}${esc(MAN.exported)}</p></div>`;
    after = () => {
      P.querySelectorAll('[data-c]').forEach(i => i.onchange = () => { S.cats[+i.dataset.c].on = i.checked; applyState(); });
      $('call').onclick = () => { S.cats.forEach(c => c.on = true); applyState(); openPanel('more'); };
      $('cnone').onclick = () => { S.cats.forEach(c => c.on = false); applyState(); openPanel('more'); };
      $('cshow').onclick = () => { S.hidden.clear(); S.isolate = null; applyState(); };
      $('umat').onchange = e => { $('schsel').value = e.target.checked ? 'mat' : 'cat'; setScheme($('schsel').value); };
      $('bgl').onchange = e => { S.bgLight = e.target.checked; scene.background.setHex(BG[S.bgLight ? 1 : 0]); };
      $('vfit').onclick = () => fitAll();
      if ($('xray')) $('xray').onchange = e => setXray(e.target.checked);
      if ($('rbload')) $('rbload').onclick = () => { const u = new URL(location.href); u.searchParams.set('rebar', '1'); location.href = u.href; };
      if ($('shot')) $('shot').onclick = () => { const a = document.createElement('a'); a.download = `105市道模型_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '')}.png`; a.href = canvas.toDataURL('image/png'); a.click(); };
      P.querySelectorAll('[data-lang]').forEach(b => { b.classList.toggle('on', b.dataset.lang === window.getLang()); b.onclick = () => window.setLang(b.dataset.lang); });
    };
  }
  P.innerHTML = h; P.querySelector('.x').onclick = () => setTool(tool); after(); dragWin(P);
}

// ---------------- 進度檢核側欄 ----------------
let sideTab = 'list', playT = null;
function phaseStats() {
  const st = PH.map(() => ({ n: 0, vol: 0, demo: 0 }));
  for (const c of S.cats) c.els.forEach((e, k) => { const s = st[c.phi[k]]; s.n++; s.vol += e.vol || 0; if (c.pdi[k] >= 0) st[c.pdi[k]].demo++; });
  return st;
}
function renderSide() {
  const st = phaseStats(), tot = st.reduce((s, x) => s + x.vol, 0);
  let cum = 0; const cumv = st.map(x => (cum += x.vol));
  const cur = S.phase;
  let body = '';
  if (sideTab === 'list') {
    body = PH.map((p, i) => `<div class="ph ${i === cur ? 'cur' : i < cur ? 'done' : ''}" data-i="${i}"><span>${tcx(p)}</span><span class="cnt">${st[i].n || ''}</span></div>`).join('');
  } else if (sideTab === 'legend') {
    body = `<div class="leg"><span class="sw" style="background:#9aa3b0"></span>${t('已完成（之前階段，顯示材料原色）')}</div>
      <div class="leg"><span class="sw" style="background:#f59e0b"></span>${t('本階段施作')}</div>
      <div class="leg"><span class="sw" style="background:#ef4444"></span>${t('本階段拆除（如臨時構台）')}</div>
      <div class="leg"><span class="sw" style="background:#9fb4cc55;border:1px dashed #9fb4cc"></span>${t('尚未施作（半透明）')}</div>
      <div class="leg"><span class="sw" style="background:#22d3ee"></span>${t('目前選取')}</div>
      <p class="mut">${t('階段依 Revit「建立階段／拆除階段」參數判斷，順序同 Revit 階段設定。')}</p>`;
  } else {
    body = `<table><tr><th>${t('階段')}</th><th class="n">${t('構件')}</th><th class="n">${t('體積 m³')}</th><th class="n">${t('累計')}</th></tr>
      ${PH.map((p, i) => `<tr ${i === cur ? 'style="background:#f59e0b22"' : ''}><td>${tcx(p)}</td><td class="n">${st[i].n || ''}</td><td class="n">${st[i].vol ? fmt(st[i].vol, 1) : ''}</td><td class="n">${tot ? (cumv[i] / tot * 100).toFixed(1) + '%' : ''}</td></tr>`).join('')}
      <tr><th>${t('合計')}</th><th class="n">${st.reduce((s, x) => s + x.n, 0)}</th><th class="n">${fmt(tot, 1)}</th><th></th></tr></table>
      <p class="mut">${t('體積取自 Revit「體積」參數；無體積的構件（如欄杆）只計數量。')}</p>`;
  }
  $('side').innerHTML = `<div class="tabs"><button data-t="list">${t('工項清單')}</button><button data-t="legend">${t('狀態圖例')}</button><button data-t="data">${t('數據')}</button></div>
    <div class="ctl"><div class="row" style="margin:0 0 6px"><b style="flex:1">${tcx(PH[cur])}</b><span class="mut">${cur + 1} / ${PH.length}</span></div>
    <input type="range" id="phr" min="0" max="${PH.length - 1}" value="${cur}">
    <div class="row"><button class="btn sm" id="pprev">${t('◀ 上一階段')}</button><button class="btn sm ${playT ? 'pri' : ''}" id="pplay">${playT ? t('■ 停止') : t('▶ 播放')}</button><button class="btn sm" id="pnext">${t('下一階段 ▶')}</button>
    <label class="mut"><input type="checkbox" id="pfut" ${S.showFuture ? 'checked' : ''}> ${t('顯示未施作')}</label></div>
    <div class="mut">${t('本階段：施作 {a} 件、拆除 {b} 件　累計完成 {c}%（依體積）', { a: st[cur].n, b: st[cur].demo, c: tot ? (cumv[cur] / tot * 100).toFixed(1) : 0 })}</div></div>
    <div class="body">${body}</div>`;
  $('side').querySelectorAll('.tabs button').forEach(b => { b.classList.toggle('on', b.dataset.t === sideTab); b.onclick = () => { sideTab = b.dataset.t; renderSide(); }; });
  $('side').querySelectorAll('.ph').forEach(d => d.onclick = () => setPhase(+d.dataset.i));
  $('phr').oninput = e => setPhase(+e.target.value);
  $('pprev').onclick = () => setPhase(Math.max(0, cur - 1));
  $('pnext').onclick = () => setPhase(Math.min(PH.length - 1, cur + 1));
  $('pfut').onchange = e => { S.showFuture = e.target.checked; applyState(); };
  $('pplay').onclick = () => {
    if (playT) { clearInterval(playT); playT = null; renderSide(); return; }
    if (S.phase >= PH.length - 1) setPhase(0);
    playT = setInterval(() => { if (S.phase >= PH.length - 1) { clearInterval(playT); playT = null; renderSide(); return; } setPhase(S.phase + 1); }, 1500);
    renderSide();
  };
  $('side').querySelector('.ph.cur')?.scrollIntoView({ block: 'nearest' });
}
function setPhase(i) { S.phase = i; applyState(); renderSide(); }

// ---------------- 開頭選模式 ----------------
const loaded = load().catch(err => {
  console.error(err);
  const lt = $('loadtxt');
  let tries = 0; try { tries = +sessionStorage.getItem('w3d.retry') || 0; sessionStorage.setItem('w3d.retry', tries + 1); } catch {}
  if (err.message === 'MISMATCH' && tries >= 5) {
    lt.textContent = t('模型資料不一致（可能匯出中斷）。請在 Revit 重新按「更新 3D 網站」後再按 F5。'); lt.style.color = '#fbbf24';
  } else if (err.message === 'BUSY' || err.message === 'MISMATCH') {
    // 等 Revit 匯出完成（manifest 不再標記 busy）後自動重新載入
    lt.textContent = t('Revit 正在更新模型資料，完成後會自動重新載入…'); lt.style.color = '#fbbf24';
    const poll = async () => {
      try {
        const m = await (await fetch('data/manifest.json?t=' + Date.now(), { cache: 'no-store' })).json();
        if (!m.busy) { location.reload(); return; }
      } catch {}
      setTimeout(poll, 4000);
    };
    setTimeout(poll, err.message === 'MISMATCH' ? 6000 : 3000);
  } else {
    lt.textContent = t('載入失敗：{msg}。請按 F5 重新整理；若仍失敗，請重新執行 start.bat 或 Revit「開啟網站」。', { msg: err.message }); lt.style.color = '#fbbf24';
  }
  throw err;
});
loaded.then(() => { try { sessionStorage.removeItem('w3d.retry'); } catch {} offlinePrep(); }, () => {});

// ---------------- 離線模式：載入完成後把程式與模型存進手機（sw.js） ----------------
function offlinePrep() {
  if (!('serviceWorker' in navigator) || EMBED || !window.isSecureContext || /^(localhost|127\.)/.test(location.hostname)) return;
  navigator.serviceWorker.register('sw.js').then(async () => {
    const reg = await navigator.serviceWorker.ready;
    const V = S.ver, MO = MAN.binFmt === 'meshopt', BX = MO ? 'm.bin' : MAN.binExt || 'bin';
    const urls = ['./', 'index.html', 'app.js', 'i18n.js', 'style.css', 'vendor/three.module.min.js', 'vendor/OrbitControls.js', 'vendor/three-mesh-bvh.module.js',
      'data/manifest.json', 'data/schemes.json' + V, 'data/views.json' + V];
    if (MO) urls.push('vendor/meshopt_decoder.module.js');
    if (AR_ON) urls.push('ar.js', 'qrpose.js', 'stations.json', 'vendor/jsQR.js');
    for (const c of MAN.cats.filter(c => REBAR || !isRB(c))) {
      urls.push(`data/${c.key}.meta.json${V}`, `data/${c.key}.json${V}`);
      if (c.parts > 1) for (let i = 0; i < c.parts; i++) urls.push(`data/${c.key}.${i}.${BX}${V}`); else urls.push(`data/${c.key}.${BX}${V}`);
    }
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type !== 'precached' || e.data.fail) return;
      let seen = null; try { seen = localStorage.getItem('w3d.offline'); localStorage.setItem('w3d.offline', MAN.exported); } catch { }
      if (seen !== MAN.exported) toast(t('已可離線使用：之後沒有網路也能開啟（模型更新時需連網開一次）'), 5000);
    });
    reg.active?.postMessage({ type: 'precache', urls, v: S.ver.slice(3) && decodeURIComponent(S.ver.slice(3)) });
  }).catch(e => console.warn('離線模式未啟用', e));
}
function startMode(m) {
  // AR 要用不含地形的精簡載入，所以重新開啟頁面
  if (m === 'ar' && !AR_ON) m = 'check';
  if (m === 'ar' && QM !== 'ar') { location.href = '?m=ar'; return; }
  S.mode = m; document.body.classList.toggle('progress', m === 'progress');
  $('start').querySelectorAll('.big').forEach(b => b.disabled = true);
  loaded.then(() => {
    $('start').classList.add('hide');
    if (m === 'ar') {
      import('./ar.js?v=' + Date.now()).then(mod => mod.startAR({ THREE, renderer, scene, camera, controls, world, overlay, S, solidMat, applyState, toast, $, esc, PH, MAN, castRay, select }))
        .catch(e => { console.error(e); toast(t('AR 載入失敗：{msg}', { msg: e.message }), 6000); });
      return; // 網址保留 ?qr= 等參數（掃 QR 牌開啟時會帶標記編號）
    }
    if (m === 'progress') {
      $('side').classList.remove('hide');
      const st = phaseStats(); let last = 0; st.forEach((s, i) => { if (s.n) last = i; });
      S.phase = last; applyState(); renderSide();
    }
    try { history.replaceState(null, '', '?m=' + m); } catch { } // 部分主機（如 claude.ai）不允許改網址
  });
}
$('start').querySelectorAll('.big').forEach(b => b.onclick = () => startMode(b.dataset.mode));
if (QM === 'check' || QM === 'progress' || QM === 'ar') startMode(QM);

// ---------------- 切換語言：重畫所有已開啟的畫面 ----------------
window.onLangChange = () => {
  if (MAN && !MAN.busy) showVersion();
  if (S.loadedN) $('loadtxt').textContent = t('載入完成：{n} 個構件', { n: S.loadedN.toLocaleString() });
  if (S.cats.length) { schemeOptions(); renderLegend(); }
  if (!$('panel').classList.contains('hide') && S.tool !== 'select') openPanel(S.tool);
  if (!$('side').classList.contains('hide')) renderSide();
  if (S.sel) select(S.sel);
  hudPoint(null);
};

// ---------------- 迴圈 ----------------
const clock = new THREE.Clock(); const tmp = new THREE.Vector3();
function placeLbl(el, p) {
  tmp.copy(p).project(camera);
  if (tmp.z > 1 || tmp.z < -1) { el.style.display = 'none'; return; }
  el.style.display = ''; el.style.left = ((tmp.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - tmp.y) / 2 * innerHeight) + 'px';
}
renderer.setAnimationLoop((time, xrFrame) => {
  const dt = Math.min(clock.getDelta(), 0.1), now = performance.now();
  if (S.ar) { S.ar.update(dt, xrFrame); renderer.render(scene, camera); return; } // AR：相機姿態由 ar.js 控制
  if (fly) {
    const t = Math.min((now - fly.t0) / fly.dur, 1), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    controls.target.lerpVectors(fly.ft, fly.tt, e); camera.position.lerpVectors(fly.fp, fly.tp, e); if (t >= 1) fly = null;
  }
  if (S.walk) walkStep(dt); else controls.update();
  // 指北針
  const d = new THREE.Vector3(); camera.getWorldDirection(d);
  const az = Math.atan2(d.x, -d.z); $('needle').style.transform = `rotate(${-az}rad)`;
  $('hudn').textContent = t('N 真北｜視向 {d}°', { d: ((az * 180 / Math.PI + 360) % 360).toFixed(0) });
  if (hoverXY && now - hoverT > 90 && MAN && S.cats.length) { hoverT = now; const h = pickAt(...hoverXY); hudPoint(h?.point); hoverXY = null; }
  for (const m of S.measures) placeLbl(m.lbl, tmp.copy(m.a).add(m.b).multiplyScalar(0.5).clone());
  if (gpsMark.visible && gpsLbl._p) placeLbl(gpsLbl, gpsLbl._p);
  if (gpsMark.visible) { const s = Math.max(camera.position.distanceTo(gpsMark.position) / 120, 0.5); gpsMark.children[0].scale.setScalar(s); gpsMark.children[0].position.y = 2 * s; }
  renderer.render(scene, camera);
});
