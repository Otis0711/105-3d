// 多國語言：中文（預設）／印尼文／越南文
// t(中文, 變數)：介面文字；tc(中文)：模型資料（階段、篩選器、族群名稱）依工程用語對照表翻譯；tp(參數名)：常見 Revit 參數名稱
// 新增或修改翻譯：在 D 加上「中文: 翻譯」即可；找不到翻譯時顯示中文原文。
(function () {
  const D = {
    id: {
      // 工具列與畫面
      '：': ': ', '漫遊': 'Jelajah', '位置': 'Lokasi', '選取': 'Pilih', '測量': 'Ukur', '剖面': 'Potongan', '更多': 'Lainnya',
      'X Y Z 模型座標': 'Koordinat model X Y Z', 'N 真北': 'N Utara sejati', 'N 真北｜視向 {d}°': 'N Utara sejati | Arah pandang {d}°',
      '點擊切換為俯視（北朝上）': 'Klik untuk tampak atas (utara di atas)',
      '俯': 'Atas', '北': 'U', '東': 'T', '南': 'S', '西': 'B',
      '俯視': 'Tampak atas', '由北側看': 'Lihat dari utara', '由東側看': 'Lihat dari timur', '由南側看': 'Lihat dari selatan', '由西側看': 'Lihat dari barat', '等角': 'Isometrik',
      '平移': 'Geser', '單指／左鍵改為平移': 'Satu jari / klik kiri untuk menggeser', '拉近': 'Perbesar', '拉遠': 'Perkecil', '上升': 'Naik', '下降': 'Turun',
      '新北市105市道改善蜿蜒路段<br>新闢道路工程 3D 模型': 'Model 3D Proyek Jalan Baru<br>Ruas Berkelok Jalan 105, New Taipei',
      '請選擇要檢視的內容': 'Pilih yang ingin dilihat',
      '模型檢核': 'Periksa Model', '完整模型、測量、剖面、GPS 定位': 'Model lengkap, ukur, potongan, posisi GPS',
      '進度檢核': 'Periksa Progres', '依 Revit 施工階段檢視工序與數量': 'Lihat urutan kerja dan jumlah per tahap konstruksi',
      '載入模型中…': 'Memuat model…', '載入模型中… {a} / {b} MB': 'Memuat model… {a} / {b} MB', '載入完成：{n} 個構件': 'Selesai dimuat: {n} elemen',
      '切換顏色方案（Revit 視圖樣版）': 'Ganti skema warna (template tampilan Revit)', '顯示／隱藏圖例': 'Tampilkan/sembunyikan legenda', '圖例': 'Legenda',
      '點擊查看各類別匯出時間': 'Klik untuk melihat waktu ekspor tiap kategori', '語言': 'Bahasa',
      '無法直接開啟 index.html<br>請用以下任一方式開啟網站：<br>① 雙擊資料夾中的 <b>start.bat</b><br>② Revit「3D網站」頁籤 →「開啟網站」<br>③ 伺服器已啟動時，瀏覽器輸入 <b>http://localhost:8765</b>':
        'Tidak bisa membuka index.html langsung<br>Buka situs dengan salah satu cara:<br>① Klik dua kali <b>start.bat</b> di folder<br>② Revit, tab「3D網站」→「開啟網站」<br>③ Jika server sudah berjalan, buka <b>http://localhost:8765</b>',
      '網站程式載入失敗：{msg}<br>請按 F5 重新整理，或重新執行 start.bat': 'Gagal memuat program: {msg}<br>Tekan F5 atau jalankan ulang start.bat',
      // 更新時間
      '剛剛': 'baru saja', '{n} 小時前': '{n} jam lalu', '{n} 天前': '{n} hari lalu', '模型更新：': 'Model diperbarui: ',
      '｜已超過 7 天未更新': ' | Lebih dari 7 hari belum diperbarui', '模型資料：{src}｜{t} 匯出': 'Data model: {src} | diekspor {t}',
      // 顏色方案
      '材料色': 'Warna material', '類別色': 'Warna kategori', 'Revit 視圖樣版': 'Template tampilan Revit',
      '點選項目可切換顯示。上方的篩選器優先權較高（同 Revit）。': 'Klik item untuk menampilkan/menyembunyikan. Filter di atas lebih diutamakan (sama seperti Revit).',
      'Revit 樣版中此篩選器設為不可見': 'Filter ini disembunyikan di template Revit', '樣版隱藏': 'Tersembunyi',
      '全部顯示': 'Tampilkan semua', '還原樣版設定': 'Kembalikan ke template', '疊加其他樣版': 'Gabungkan template lain', '走到兩根樁': 'Jalan ke dua patok', '第一點（先站這裡）': 'Titik 1 (mulai di sini)', '第二點（走過去）': 'Titik 2 (jalan ke sini)', '兩點距離 {d} m（20～60 m 最好：太近方向不準，太遠手機追蹤會漂移）': 'Jarak dua titik {d} m (terbaik 20–60 m: terlalu dekat arah kurang akurat, terlalu jauh pelacakan ponsel bergeser)', '步驟：① 站在 {a} 樁旁 1～2 m，按「開始 AR」② 十字對準 {a} 樁頂，藍色圈出現且「穩定」時按「記錄」③ 拿著手機走到 {b}（鏡頭朝前、不要遮住），同樣對準 {b} 樁頂按「記錄」。': 'Langkah: ① Berdiri 1–2 m dari patok {a}, tekan \"Mulai AR\" ② Arahkan silang ke kepala patok {a}, saat lingkaran biru muncul dan \"Stabil\" tekan \"Catat\" ③ Bawa ponsel berjalan ke {b} (kamera menghadap depan, jangan ditutup), arahkan ke kepala patok {b} dan tekan \"Catat\".', '不用看清楚遠方的樁，方向、位置、高程一次求出；完成後可以繼續走動。': 'Tidak perlu melihat patok yang jauh; arah, posisi, dan elevasi didapat sekaligus; setelah selesai boleh berjalan.', '② 走到 {b}，十字對準 {b} 樁頂': '② Jalan ke {b}, arahkan silang ke kepala patok {b}', '① 十字對準 {a} 樁頂': '① Arahkan silang ke kepala patok {a}', '記錄 {name}': 'Catat {name}', '重來': 'Ulangi', '站在樁旁 1～2 m 斜看樁比較準。走路時鏡頭朝前、慢慢走，手機會一路追蹤位置。': 'Lebih akurat jika berdiri 1–2 m dari patok dan melihat miring. Saat berjalan, kamera menghadap depan dan jalan pelan; ponsel melacak posisi.', '放大': 'Zoom', 'WebXR 無法啟動：這支手機不能用走點校正，請改用對準兩根樁': 'WebXR gagal: ponsel ini tidak bisa kalibrasi jalan, gunakan bidik dua patok', '距離差超過 30 cm：可能記錄時十字沒對準樁，或手機追蹤漂移，建議重新校正。': 'Selisih jarak lebih dari 30 cm: mungkin silang tidak tepat di patok atau pelacakan bergeser, sebaiknya kalibrasi ulang.', '請檢查兩根紅色標桿是否落在樁上': 'Periksa apakah dua tiang merah berada di atas patok', '十字還沒有對到地面：請把十字對準樁頂，稍等一下': 'Silang belum mengenai tanah: arahkan ke kepala patok dan tunggu sebentar', '晃動中，請拿穩再按': 'Masih goyang, pegang stabil lalu tekan', '已記錄 {name}，請走到 {b}': '{name} tercatat, silakan jalan ke {b}', '走點校正：實際走了 {m} m，圖面 {w} m（差 {e} cm），高差誤差 {z} cm': 'Kalibrasi jalan: jarak nyata {m} m, gambar {w} m (selisih {e} cm), selisih beda tinggi {z} cm', '這支手機不支援地面偵測：手機拿在樁正上方再按記錄（手機離地 {h} m）': 'Ponsel ini tidak mendukung deteksi tanah: pegang ponsel tepat di atas patok lalu tekan Catat (tinggi ponsel {h} m)', '尋找地面中…請慢慢左右移動手機': 'Mencari tanah… gerakkan ponsel perlahan ke kiri-kanan', '紅色／黃色標桿 = {a}、{b}，應落在真的樁上；偏左右按 ◀ ▶，高低不對按 ▲ ▼。': 'Tiang merah/kuning = {a}, {b}, harus berada di patok nyata; geser kiri-kanan dengan ◀ ▶, tinggi dengan ▲ ▼.', 'Revit 視圖': 'Tampilan Revit', '（不套用視圖，顯示全部）': '(Tanpa tampilan, tampilkan semua)', '視圖：{n}': 'Tampilan: {n}', '視圖': 'Tampilan', '剖面框': 'Kotak potong', 'Revit 已發布的 3D 視圖': 'Tampilan 3D Revit yang dipublikasikan', '其他構件以淺灰顯示': 'Elemen lain berwarna abu-abu muda',
      '樣版隱藏的構件：': 'Elemen tersembunyi: ', '半透明': 'Transparan', '不顯示': 'Tidak ditampilkan', '樣版關閉的類別：': 'Kategori dimatikan di template: ', '（隱藏）': ' (tersembunyi)',
      // 漫遊與資訊視窗
      '漫遊：拖曳轉向，W A S D／方向鍵移動，Q E 升降，Shift 加速，滾輪前後': 'Jelajah: seret untuk menoleh, W A S D / panah untuk bergerak, Q E naik/turun, Shift lebih cepat, roda mouse maju/mundur',
      '縮放至': 'Perbesar ke', '隔離': 'Isolasi', '隱藏': 'Sembunyikan', '剖切此處': 'Potong di sini',
      '類別': 'Kategori', '元素 ID': 'ID elemen', '建立階段': 'Tahap dibuat', '拆除階段': 'Tahap dibongkar', '無': 'Tidak ada',
      '中心座標': 'Koordinat pusat', '頂／底高程': 'Elevasi atas / bawah', 'Revit 參數': 'Parameter Revit', '篩選…': 'Cari…', '讀取中…': 'Memuat…',
      // 測量
      '再點第二點': 'Klik titik kedua', '在模型上依序點兩點，量測距離、水平距與高差。': 'Klik dua titik pada model untuk mengukur jarak, jarak horizontal, dan beda tinggi.',
      '距離': 'Jarak', '水平距': 'Horizontal', '高差': 'Beda tinggi', '尚無量測': 'Belum ada pengukuran', '單位：公尺': 'Satuan: meter', '清除全部': 'Hapus semua',
      // 剖面
      '東西 E': 'Timur–Barat E', '南北 N': 'Utara–Selatan N', '高程 H': 'Elevasi H', '啟用剖面框': 'Aktifkan kotak potongan',
      '南北滑桿：左側為北、右側為南。': 'Penggeser U–S: kiri = utara, kanan = selatan.', '重設': 'Reset', '縮放至剖面框': 'Perbesar ke kotak',
      '提示：選取構件後按「剖切此處」，可快速以該構件為中心剖切。': 'Tips: pilih elemen lalu tekan "Potong di sini" untuk memotong di sekitar elemen itu.',
      // 位置
      '此瀏覽器不支援定位': 'Browser ini tidak mendukung lokasi', 'GPS 需在 https 或 localhost 下才能使用': 'GPS hanya bisa dipakai di https atau localhost',
      '我的位置 ±{n} m': 'Posisi saya ±{n} m', '目前位置不在模型範圍附近': 'Posisi Anda tidak berada di dekat area model', '定位失敗：': 'Gagal menentukan lokasi: ',
      '停止 GPS 定位': 'Hentikan GPS', '開啟 GPS 定位': 'Nyalakan GPS', '前往我的位置': 'Ke posisi saya', '經緯度': 'Lintang, bujur', '精度': 'Akurasi',
      '手機在工地現場開啟後，紅色標記會顯示你在模型中的位置。': 'Buka di HP saat di lokasi proyek, tanda merah menunjukkan posisi Anda di model.',
      '點選模型查座標': 'Klik model untuk melihat koordinat', '高程': 'Elevasi',
      '開啟此面板時，點模型任一處即顯示該點座標。': 'Saat panel ini terbuka, klik di mana saja pada model untuk melihat koordinatnya.',
      '前往座標': 'Pergi ke koordinat', '緯度, 經度': 'Lintang, bujur', '例：288900, 2778150': 'Contoh: 288900, 2778150', '前往': 'Pergi',
      '座標系統：TWD97 TM2（取自 Revit 共用座標），高程單位公尺。': 'Sistem koordinat: TWD97 TM2 (koordinat bersama Revit), elevasi dalam meter.', '請輸入兩個數字': 'Masukkan dua angka',
      // 更多
      '構件類別': 'Kategori elemen', '匯出時間': 'Waktu ekspor',
      '右欄為各類別最後匯出時間（月-日 時:分）與件數。模型更新請在 Revit「3D網站」頁籤按「更新 3D 網站」。': 'Kolom kanan: waktu ekspor terakhir (bln-tgl jam:menit) dan jumlah elemen.',
      '全選': 'Pilih semua', '全不選': 'Hapus pilihan', '取消隱藏／隔離': 'Batalkan sembunyi/isolasi', '顯示': 'Tampilan',
      '使用 Revit 材料顏色（取消則依類別上色）': 'Pakai warna material Revit (jika tidak, warna per kategori)', '淺色背景': 'Latar terang',
      '全部縮放': 'Lihat semua', '截圖下載': 'Unduh tangkapan layar', '操作說明': 'Cara pakai',
      '左鍵拖曳：旋轉｜右鍵拖曳：平移｜滾輪：縮放<br>手機：單指旋轉、雙指縮放平移；「平移」鈕可切換單指平移。<br>Esc：取消選取／離開漫遊':
        'Seret kiri: putar | Seret kanan: geser | Roda: zoom<br>HP: satu jari putar, dua jari zoom/geser; tombol "Geser" mengubah satu jari jadi geser.<br>Esc: batal pilih / keluar jelajah',
      '資料來源：': 'Sumber data: ', '匯出時間：': 'Waktu ekspor: ',
      // 進度檢核
      '已完成（之前階段，顯示材料原色）': 'Selesai (tahap sebelumnya, warna asli)', '本階段施作': 'Dikerjakan tahap ini',
      '本階段拆除（如臨時構台）': 'Dibongkar tahap ini (mis. panggung sementara)', '尚未施作（半透明）': 'Belum dikerjakan (transparan)', '目前選取': 'Sedang dipilih',
      '階段依 Revit「建立階段／拆除階段」參數判斷，順序同 Revit 階段設定。': 'Tahap berdasarkan parameter Revit "tahap dibuat / dibongkar", urutan sama dengan pengaturan Revit.',
      '階段': 'Tahap', '構件': 'Elemen', '體積 m³': 'Volume m³', '累計': 'Kumulatif', '合計': 'Total',
      '體積取自 Revit「體積」參數；無體積的構件（如欄杆）只計數量。': 'Volume dari parameter Revit; elemen tanpa volume (mis. pagar) hanya dihitung jumlahnya.',
      '工項清單': 'Daftar pekerjaan', '狀態圖例': 'Legenda status', '數據': 'Data',
      '◀ 上一階段': '◀ Sebelumnya', '■ 停止': '■ Berhenti', '▶ 播放': '▶ Putar', '下一階段 ▶': 'Berikutnya ▶', '顯示未施作': 'Tampilkan yang belum',
      '本階段：施作 {a} 件、拆除 {b} 件　累計完成 {c}%（依體積）': 'Tahap ini: dikerjakan {a}, dibongkar {b}　Total selesai {c}% (volume)',
      // 錯誤
      '模型資料不一致（可能匯出中斷）。請在 Revit 重新按「更新 3D 網站」後再按 F5。': 'Data model tidak konsisten. Minta staf memperbarui di Revit, lalu tekan F5.',
      'Revit 正在更新模型資料，完成後會自動重新載入…': 'Model sedang diperbarui, halaman akan dimuat ulang otomatis…',
      '載入失敗：{msg}。請按 F5 重新整理；若仍失敗，請重新執行 start.bat 或 Revit「開啟網站」。': 'Gagal memuat: {msg}. Tekan F5; jika masih gagal, jalankan ulang start.bat.',
      // 構件類別
      '橋墩基礎': 'Pondasi pilar', '結構基礎': 'Pondasi struktur', '結構柱／橋墩': 'Kolom / pilar', '結構構架／鋼箱梁': 'Rangka struktur / gelagar baja',
      '橋面板': 'Pelat lantai jembatan', '樓板／路面': 'Pelat / perkerasan jalan', '牆': 'Dinding', '一般模型': 'Model umum', '機械設備': 'Peralatan mekanikal',
      '欄杆扶手': 'Pagar pengaman', '頂部扶手': 'Pegangan atas', '欄杆柱': 'Tiang pagar', '敷地': 'Tapak', '地形': 'Topografi',
      // 視圖樣版（整句）
      '大樑長度分色': 'Warna panjang balok utama', '小樑長度分色': 'Warna panjang balok anak', '斜撐長度分色': 'Warna panjang bresing', '繫樑長度分色': 'Warna panjang balok pengikat',
      '分區檢核': 'Cek zona', '一區檢核': 'Zona 1', '二區檢核': 'Zona 2', '三區檢核': 'Zona 3', '四區檢核': 'Zona 4', '無分區檢核': 'Tanpa zona',
      '構台顏色': 'Warna panggung kerja', '編號確認': 'Cek penomoran', '路面AC': 'Aspal (AC)', '是': 'Ya', '否': 'Tidak',
    },
    vi: {
      '：': ': ', '漫遊': 'Đi dạo', '位置': 'Vị trí', '選取': 'Chọn', '測量': 'Đo', '剖面': 'Mặt cắt', '更多': 'Thêm',
      'X Y Z 模型座標': 'Tọa độ mô hình X Y Z', 'N 真北': 'N Bắc thực', 'N 真北｜視向 {d}°': 'N Bắc thực | Hướng nhìn {d}°',
      '點擊切換為俯視（北朝上）': 'Nhấn để xem từ trên (hướng bắc lên trên)',
      '俯': 'Trên', '北': 'B', '東': 'Đ', '南': 'N', '西': 'T',
      '俯視': 'Nhìn từ trên', '由北側看': 'Nhìn từ phía bắc', '由東側看': 'Nhìn từ phía đông', '由南側看': 'Nhìn từ phía nam', '由西側看': 'Nhìn từ phía tây', '等角': 'Phối cảnh',
      '平移': 'Kéo', '單指／左鍵改為平移': 'Đổi một ngón / chuột trái thành kéo', '拉近': 'Phóng to', '拉遠': 'Thu nhỏ', '上升': 'Lên', '下降': 'Xuống',
      '新北市105市道改善蜿蜒路段<br>新闢道路工程 3D 模型': 'Mô hình 3D công trình đường mới<br>Đoạn quanh co Đường 105, Tân Bắc',
      '請選擇要檢視的內容': 'Chọn nội dung muốn xem',
      '模型檢核': 'Kiểm tra mô hình', '完整模型、測量、剖面、GPS 定位': 'Toàn bộ mô hình, đo, mặt cắt, định vị GPS',
      '進度檢核': 'Kiểm tra tiến độ', '依 Revit 施工階段檢視工序與數量': 'Xem trình tự và khối lượng theo giai đoạn thi công',
      '載入模型中…': 'Đang tải mô hình…', '載入模型中… {a} / {b} MB': 'Đang tải mô hình… {a} / {b} MB', '載入完成：{n} 個構件': 'Đã tải xong: {n} cấu kiện',
      '切換顏色方案（Revit 視圖樣版）': 'Đổi bảng màu (mẫu khung nhìn Revit)', '顯示／隱藏圖例': 'Hiện/ẩn chú giải', '圖例': 'Chú giải',
      '點擊查看各類別匯出時間': 'Nhấn để xem thời gian xuất của từng loại', '語言': 'Ngôn ngữ',
      '無法直接開啟 index.html<br>請用以下任一方式開啟網站：<br>① 雙擊資料夾中的 <b>start.bat</b><br>② Revit「3D網站」頁籤 →「開啟網站」<br>③ 伺服器已啟動時，瀏覽器輸入 <b>http://localhost:8765</b>':
        'Không thể mở trực tiếp index.html<br>Hãy mở trang web bằng một trong các cách:<br>① Nhấp đúp <b>start.bat</b> trong thư mục<br>② Revit, thẻ「3D網站」→「開啟網站」<br>③ Nếu máy chủ đang chạy, mở <b>http://localhost:8765</b>',
      '網站程式載入失敗：{msg}<br>請按 F5 重新整理，或重新執行 start.bat': 'Không tải được chương trình: {msg}<br>Nhấn F5 hoặc chạy lại start.bat',
      '剛剛': 'vừa xong', '{n} 小時前': '{n} giờ trước', '{n} 天前': '{n} ngày trước', '模型更新：': 'Cập nhật mô hình: ',
      '｜已超過 7 天未更新': ' | Đã hơn 7 ngày chưa cập nhật', '模型資料：{src}｜{t} 匯出': 'Dữ liệu mô hình: {src} | xuất lúc {t}',
      '材料色': 'Màu vật liệu', '類別色': 'Màu theo loại', 'Revit 視圖樣版': 'Mẫu khung nhìn Revit',
      '點選項目可切換顯示。上方的篩選器優先權較高（同 Revit）。': 'Nhấn vào mục để bật/tắt hiển thị. Bộ lọc ở trên được ưu tiên hơn (giống Revit).',
      'Revit 樣版中此篩選器設為不可見': 'Bộ lọc này bị ẩn trong mẫu Revit', '樣版隱藏': 'Ẩn theo mẫu',
      '全部顯示': 'Hiện tất cả', '還原樣版設定': 'Khôi phục theo mẫu', '疊加其他樣版': 'Kết hợp mẫu khác', 'Revit 視圖': 'Khung nhìn Revit', '（不套用視圖，顯示全部）': '(Không áp dụng khung nhìn, hiện tất cả)', '視圖：{n}': 'Khung nhìn: {n}', '視圖': 'Khung nhìn', '剖面框': 'Hộp cắt', 'Revit 已發布的 3D 視圖': 'Khung nhìn 3D Revit đã xuất bản', '其他構件以淺灰顯示': 'Cấu kiện khác hiển thị màu xám nhạt',
      '樣版隱藏的構件：': 'Cấu kiện bị ẩn: ', '半透明': 'Bán trong suốt', '不顯示': 'Không hiển thị', '樣版關閉的類別：': 'Loại bị tắt trong mẫu: ', '（隱藏）': ' (ẩn)',
      '漫遊：拖曳轉向，W A S D／方向鍵移動，Q E 升降，Shift 加速，滾輪前後': 'Đi dạo: kéo để xoay, W A S D / phím mũi tên để di chuyển, Q E lên/xuống, Shift đi nhanh, cuộn chuột tiến/lùi',
      '縮放至': 'Phóng tới', '隔離': 'Cô lập', '隱藏': 'Ẩn', '剖切此處': 'Cắt tại đây',
      '類別': 'Loại', '元素 ID': 'ID cấu kiện', '建立階段': 'Giai đoạn tạo', '拆除階段': 'Giai đoạn tháo dỡ', '無': 'Không',
      '中心座標': 'Tọa độ tâm', '頂／底高程': 'Cao độ đỉnh / đáy', 'Revit 參數': 'Thông số Revit', '篩選…': 'Lọc…', '讀取中…': 'Đang tải…',
      '再點第二點': 'Nhấn điểm thứ hai', '在模型上依序點兩點，量測距離、水平距與高差。': 'Nhấn lần lượt hai điểm trên mô hình để đo khoảng cách, khoảng cách ngang và chênh cao.',
      '距離': 'Khoảng cách', '水平距': 'K/c ngang', '高差': 'Chênh cao', '尚無量測': 'Chưa có phép đo', '單位：公尺': 'Đơn vị: mét', '清除全部': 'Xóa tất cả',
      '東西 E': 'Đông–Tây E', '南北 N': 'Bắc–Nam N', '高程 H': 'Cao độ H', '啟用剖面框': 'Bật hộp mặt cắt',
      '南北滑桿：左側為北、右側為南。': 'Thanh Bắc–Nam: trái = bắc, phải = nam.', '重設': 'Đặt lại', '縮放至剖面框': 'Phóng tới hộp cắt',
      '提示：選取構件後按「剖切此處」，可快速以該構件為中心剖切。': 'Mẹo: chọn cấu kiện rồi nhấn "Cắt tại đây" để cắt quanh cấu kiện đó.',
      '此瀏覽器不支援定位': 'Trình duyệt không hỗ trợ định vị', 'GPS 需在 https 或 localhost 下才能使用': 'GPS chỉ dùng được trên https hoặc localhost',
      '我的位置 ±{n} m': 'Vị trí của tôi ±{n} m', '目前位置不在模型範圍附近': 'Vị trí hiện tại không gần khu vực mô hình', '定位失敗：': 'Định vị thất bại: ',
      '停止 GPS 定位': 'Dừng GPS', '開啟 GPS 定位': 'Bật định vị GPS', '前往我的位置': 'Đến vị trí của tôi', '經緯度': 'Vĩ độ, kinh độ', '精度': 'Độ chính xác',
      '手機在工地現場開啟後，紅色標記會顯示你在模型中的位置。': 'Mở trên điện thoại tại công trường, dấu đỏ sẽ cho thấy vị trí của bạn trong mô hình.',
      '點選模型查座標': 'Nhấn vào mô hình để xem tọa độ', '高程': 'Cao độ',
      '開啟此面板時，點模型任一處即顯示該點座標。': 'Khi bảng này mở, nhấn vào bất kỳ đâu trên mô hình để xem tọa độ.',
      '前往座標': 'Đi tới tọa độ', '緯度, 經度': 'Vĩ độ, kinh độ', '例：288900, 2778150': 'Ví dụ: 288900, 2778150', '前往': 'Đi',
      '座標系統：TWD97 TM2（取自 Revit 共用座標），高程單位公尺。': 'Hệ tọa độ: TWD97 TM2 (tọa độ chung Revit), cao độ tính bằng mét.', '請輸入兩個數字': 'Hãy nhập hai số',
      '構件類別': 'Loại cấu kiện', '匯出時間': 'Thời gian xuất',
      '右欄為各類別最後匯出時間（月-日 時:分）與件數。模型更新請在 Revit「3D網站」頁籤按「更新 3D 網站」。': 'Cột phải: thời gian xuất gần nhất (tháng-ngày giờ:phút) và số lượng.',
      '全選': 'Chọn tất cả', '全不選': 'Bỏ chọn tất cả', '取消隱藏／隔離': 'Bỏ ẩn / cô lập', '顯示': 'Hiển thị',
      '使用 Revit 材料顏色（取消則依類別上色）': 'Dùng màu vật liệu Revit (bỏ chọn để tô màu theo loại)', '淺色背景': 'Nền sáng',
      '全部縮放': 'Xem toàn bộ', '截圖下載': 'Tải ảnh chụp màn hình', '操作說明': 'Hướng dẫn',
      '左鍵拖曳：旋轉｜右鍵拖曳：平移｜滾輪：縮放<br>手機：單指旋轉、雙指縮放平移；「平移」鈕可切換單指平移。<br>Esc：取消選取／離開漫遊':
        'Kéo chuột trái: xoay | Kéo chuột phải: di chuyển | Cuộn: phóng to/nhỏ<br>Điện thoại: một ngón xoay, hai ngón phóng/di chuyển; nút "Kéo" đổi một ngón thành di chuyển.<br>Esc: bỏ chọn / thoát đi dạo',
      '資料來源：': 'Nguồn dữ liệu: ', '匯出時間：': 'Thời gian xuất: ',
      '已完成（之前階段，顯示材料原色）': 'Đã hoàn thành (giai đoạn trước, màu gốc)', '本階段施作': 'Thi công giai đoạn này',
      '本階段拆除（如臨時構台）': 'Tháo dỡ giai đoạn này (vd. sàn tạm)', '尚未施作（半透明）': 'Chưa thi công (bán trong suốt)', '目前選取': 'Đang chọn',
      '階段依 Revit「建立階段／拆除階段」參數判斷，順序同 Revit 階段設定。': 'Giai đoạn dựa trên thông số Revit "giai đoạn tạo / tháo dỡ", thứ tự theo thiết lập Revit.',
      '階段': 'Giai đoạn', '構件': 'Cấu kiện', '體積 m³': 'Thể tích m³', '累計': 'Lũy kế', '合計': 'Tổng',
      '體積取自 Revit「體積」參數；無體積的構件（如欄杆）只計數量。': 'Thể tích lấy từ thông số Revit; cấu kiện không có thể tích (vd. lan can) chỉ đếm số lượng.',
      '工項清單': 'Hạng mục', '狀態圖例': 'Chú giải trạng thái', '數據': 'Số liệu',
      '◀ 上一階段': '◀ Trước', '■ 停止': '■ Dừng', '▶ 播放': '▶ Phát', '下一階段 ▶': 'Tiếp ▶', '顯示未施作': 'Hiện phần chưa thi công',
      '本階段：施作 {a} 件、拆除 {b} 件　累計完成 {c}%（依體積）': 'Giai đoạn này: thi công {a}, tháo dỡ {b}　Hoàn thành lũy kế {c}% (thể tích)',
      '模型資料不一致（可能匯出中斷）。請在 Revit 重新按「更新 3D 網站」後再按 F5。': 'Dữ liệu mô hình không khớp. Hãy nhờ nhân viên cập nhật trong Revit rồi nhấn F5.',
      'Revit 正在更新模型資料，完成後會自動重新載入…': 'Mô hình đang được cập nhật, trang sẽ tự tải lại…',
      '載入失敗：{msg}。請按 F5 重新整理；若仍失敗，請重新執行 start.bat 或 Revit「開啟網站」。': 'Tải thất bại: {msg}. Nhấn F5; nếu vẫn lỗi, chạy lại start.bat.',
      '橋墩基礎': 'Móng trụ cầu', '結構基礎': 'Móng kết cấu', '結構柱／橋墩': 'Cột / trụ cầu', '結構構架／鋼箱梁': 'Khung kết cấu / dầm thép',
      '橋面板': 'Bản mặt cầu', '樓板／路面': 'Sàn / mặt đường', '牆': 'Tường', '一般模型': 'Mô hình chung', '機械設備': 'Thiết bị cơ khí',
      '欄杆扶手': 'Lan can', '頂部扶手': 'Tay vịn trên', '欄杆柱': 'Trụ lan can', '敷地': 'Mặt bằng', '地形': 'Địa hình',
      '大樑長度分色': 'Màu theo chiều dài dầm chính', '小樑長度分色': 'Màu theo chiều dài dầm phụ', '斜撐長度分色': 'Màu theo chiều dài giằng chéo', '繫樑長度分色': 'Màu theo chiều dài dầm giằng',
      '分區檢核': 'Kiểm tra phân khu', '一區檢核': 'Khu 1', '二區檢核': 'Khu 2', '三區檢核': 'Khu 3', '四區檢核': 'Khu 4', '無分區檢核': 'Không phân khu',
      '構台顏色': 'Màu sàn công tác', '編號確認': 'Kiểm tra số hiệu', '路面AC': 'Bê tông nhựa (AC)', '是': 'Có', '否': 'Không',
    },
  };

  // 現場 AR（ar.js）
  Object.assign(D.id, {
    'AR 載入失敗：{msg}': 'Gagal memuat AR: {msg}',
    '📷 現場 AR（鏡頭疊合模型）': '📷 AR Lapangan (model di kamera)',
    '現場 AR': 'AR Lapangan',
    '手機鏡頭疊合未來完成的模型（站在測量樁上校正）': 'Lihat model jadi lewat kamera HP (kalibrasi di patok ukur)',
    'stations.json 至少需要兩個已知點': 'stations.json butuh minimal dua titik yang diketahui',
    'AR 需要 https 網址才能使用相機，目前只能預覽。': 'AR butuh alamat https untuk memakai kamera; sekarang hanya pratinjau.',
    'WebXR 無法啟動，改用相機模式': 'WebXR gagal, pakai mode kamera',
    '沒有取得陀螺儀權限，請重新整理後按「允許」': 'Izin sensor gerak ditolak. Muat ulang lalu tekan "Izinkan"',
    '無法開啟相機（{msg}），改為模擬畫面：拖曳轉向': 'Kamera tidak bisa dibuka ({msg}). Mode simulasi: geser layar untuk memutar',
    '校正完成：請檢查紅色標桿是否落在 {name} 樁上': 'Kalibrasi selesai: pastikan tiang merah tepat di patok {name}',
    '轉向': 'Arah', '俯仰': 'Kemiringan', '穩定': 'Stabil', '晃動中': 'Goyang',
    '全部完成': 'Semua selesai',
    'Android WebXR：校正後可以走動': 'Android WebXR: boleh berjalan setelah kalibrasi',
    '相機模式：請站在原地轉動手機': 'Mode kamera: berdiri di tempat, putar HP',
    '離開': 'Keluar',
    '站立點（手機在樁正上方）': 'Titik berdiri (HP tepat di atas patok)',
    '對準點（遠方另一根樁）': 'Titik bidik (patok lain di kejauhan)',
    '兩點距離 {d} m（越遠方向越準，建議 30 m 以上）': 'Jarak dua titik {d} m (makin jauh makin akurat, sebaiknya lebih dari 30 m)',
    '手機離地高度 (m)': 'Tinggi HP dari tanah (m)',
    '顯示到階段': 'Tampilkan sampai tahap',
    '開始 AR': 'Mulai AR',
    '步驟：① 站在 {a} 樁正上方 ② 按「開始 AR」，允許使用相機 ③ 十字對準 {b} 樁（或立在樁上的標桿）按「確定」。': 'Langkah: ① Berdiri tepat di atas patok {a} ② Tekan "Mulai AR" dan izinkan kamera ③ Arahkan tanda silang ke patok {b} (atau tiang di atasnya), tekan "OK".',
    '站立點': 'Titik berdiri', '對準點': 'Titik bidik',
    '十字對準 {b} → 確定': 'Bidik {b} dengan tanda silang → OK',
    '手肘靠緊身體，等顯示「穩定」再按。看不清楚樁時，請人在樁上立標桿。': 'Rapatkan siku ke badan, tekan setelah muncul "Stabil". Jika patok sulit terlihat, minta orang memegang tiang di atas patok.',
    '方向': 'Arah', '高度': 'Tinggi', '不透明度': 'Opasitas',
    '鏡頭視角 {v}°（模型大小和實景不同時調整）': 'Sudut pandang kamera {v}° (atur jika ukuran model beda dengan aslinya)',
    '重新校正': 'Kalibrasi ulang', '收合': 'Kecilkan', '展開': 'Perbesar',
    '紅色標桿 = {b}，應落在真的 {b} 樁上；偏左右按 ◀ ▶（每次 0.1°，按住連續），高低不對按 ▲ ▼。': 'Tiang merah = {b}, harus tepat di patok {b} asli. Geser kiri/kanan dengan ◀ ▶ (0,1° per tekan, tahan untuk terus), naik/turun dengan ▲ ▼.',
    '相機模式不會追蹤走動：移動位置後請回到樁上重新校正。': 'Mode kamera tidak mengikuti gerakan: setelah pindah, kembali ke patok dan kalibrasi ulang.',
    '點畫面上的構件可查看資訊（再點空白處關閉）。': 'Ketuk komponen di layar untuk melihat info (ketuk area kosong untuk menutup).',
    'stations.json 沒有 QR 標記資料（markers）': 'stations.json tidak punya data penanda QR (markers)',
    '方向已用 {name} 修正：請檢查紅色標桿是否落在 {name} 樁上': 'Arah sudah dikoreksi dengan {name}: pastikan tiang merah tepat di patok {name}',
    'QR 定位完成：請檢查紅框是否疊在真的 QR 牌上': 'Posisi QR selesai: pastikan kotak merah menempel tepat di papan QR asli',
    '尋找 QR 標記…': 'Mencari penanda QR…',
    'QR 辨識程式載入失敗': 'Gagal memuat pembaca QR',
    '這個 QR 不是定位標記': 'QR ini bukan penanda posisi',
    'stations.json 找不到標記 {id}': 'Penanda {id} tidak ada di stations.json',
    '偵測到 {id}，但角點誤差太大（{e} px），請靠近一點、正對 QR': '{id} terdeteksi, tetapi galat sudut terlalu besar ({e} px). Mendekat dan hadap lurus ke QR',
    '偵測到 {id}：距離 {d} m，收集中 {n}/{N}': '{id} terdeteksi: jarak {d} m, mengumpulkan {n}/{N}',
    '晃動中，請拿穩': 'Goyang, pegang dengan stabil',
    '方向已用 {name} 修正': 'Arah dikoreksi dengan {name}',
    'QR 定位（{id}）：距牌 {d} m，手機高程 {h} m': 'Posisi QR ({id}): jarak ke papan {d} m, elevasi HP {h} m',
    '對準兩根樁': 'Bidik dua patok',
    '掃描 QR 標記': 'Pindai penanda QR',
    '已設定 {n} 個 QR 標記：': 'Ada {n} penanda QR: ',
    '步驟：① 站在 QR 牌前約 1 m（越近越準）② 按「開始 AR」，允許使用相機 ③ 讓整個 QR 出現在畫面框內，拿穩約 1 秒會自動定位。': 'Langkah: ① Berdiri sekitar 1 m di depan papan QR (makin dekat makin akurat) ② Tekan "Mulai AR" dan izinkan kamera ③ Masukkan seluruh QR ke dalam bingkai, pegang stabil ± 1 detik, posisi otomatis.',
    'QR 定位的高程與位置很準，方向誤差約 0.5～1°；看遠處時可再用「對準遠方樁修正方向」。': 'Posisi dan elevasi dari QR sangat akurat, galat arah ± 0,5–1°. Untuk melihat jauh, gunakan "Koreksi arah dengan patok jauh".',
    '讓整個 QR 出現在框內，距離約 1 m，拿穩不動。': 'Masukkan seluruh QR ke dalam bingkai, jarak ± 1 m, pegang diam.',
    '改用對準兩根樁': 'Ganti ke bidik dua patok',
    '十字對準 {b} → 修正方向': 'Bidik {b} dengan tanda silang → koreksi arah',
    '取消': 'Batal',
    '已可離線使用：之後沒有網路也能開啟（模型更新時需連網開一次）': 'Siap dipakai offline: bisa dibuka tanpa internet (saat model diperbarui, buka sekali dengan internet)',
    '太近': 'terlalu dekat', '實測點': 'Titik ukur', '模型橋墩中心': 'Pusat pilar (model)',
    '對準遠方樁修正方向': 'Koreksi arah dengan patok jauh',
    '重新掃描 QR': 'Pindai ulang QR',
    '紅框 = QR 牌的測量位置，應疊在真的 QR 牌上；黃色／紅色標桿 = 已知樁。': 'Kotak merah = posisi ukur papan QR, harus menempel di papan QR asli; tiang kuning/merah = patok yang diketahui.',
    '推算的手機離地高度 {h} m 不合理：請確認十字對準 {name} 樁的入土處，或在設定改用手動高度。': 'Tinggi HP hasil hitung {h} m tidak wajar: pastikan tanda silang tepat di dasar patok {name} (tempat masuk tanah), atau pakai tinggi manual di pengaturan.',
    '推算手機離地 {h} m': 'Tinggi HP dari tanah (hitungan) {h} m',
    '高程自動校正（十字對準樁的入土處，用俯角推算）': 'Kalibrasi elevasi otomatis (bidik dasar patok, dihitung dari sudut tunduk)',
    '十字對準 {b} 入土處 → 確定': 'Bidik dasar patok {b} → OK',
    '高程自動校正：十字中心要對在樁（或標桿）與地面交接處。': 'Elevasi otomatis: pusat tanda silang harus tepat di titik patok (atau tiang) bertemu tanah.',
    '高程：自動（俯角 {a}°），手機離地 {h} m': 'Elevasi: otomatis (sudut tunduk {a}°), tinggi HP {h} m',
    '高程：手動，手機離地 {h} m': 'Elevasi: manual, tinggi HP {h} m',
  });
  Object.assign(D.vi, {
    'AR 載入失敗：{msg}': 'Lỗi tải AR: {msg}',
    '📷 現場 AR（鏡頭疊合模型）': '📷 AR hiện trường (mô hình trên camera)',
    '現場 AR': 'AR hiện trường',
    '手機鏡頭疊合未來完成的模型（站在測量樁上校正）': 'Xem mô hình hoàn thành qua camera điện thoại (hiệu chỉnh tại cọc trắc đạc)',
    'stations.json 至少需要兩個已知點': 'stations.json cần ít nhất hai điểm đã biết',
    'AR 需要 https 網址才能使用相機，目前只能預覽。': 'AR cần địa chỉ https để dùng camera; hiện chỉ xem trước.',
    'WebXR 無法啟動，改用相機模式': 'Không khởi động được WebXR, chuyển sang chế độ camera',
    '沒有取得陀螺儀權限，請重新整理後按「允許」': 'Chưa có quyền cảm biến chuyển động. Tải lại trang và chọn "Cho phép"',
    '無法開啟相機（{msg}），改為模擬畫面：拖曳轉向': 'Không mở được camera ({msg}). Chế độ mô phỏng: kéo màn hình để xoay',
    '校正完成：請檢查紅色標桿是否落在 {name} 樁上': 'Đã hiệu chỉnh: kiểm tra cột đỏ có nằm đúng trên cọc {name} không',
    '轉向': 'Hướng', '俯仰': 'Góc nghiêng', '穩定': 'Ổn định', '晃動中': 'Đang rung',
    '全部完成': 'Hoàn thành toàn bộ',
    'Android WebXR：校正後可以走動': 'Android WebXR: có thể đi lại sau khi hiệu chỉnh',
    '相機模式：請站在原地轉動手機': 'Chế độ camera: đứng yên tại chỗ, xoay điện thoại',
    '離開': 'Thoát',
    '站立點（手機在樁正上方）': 'Điểm đứng (điện thoại ngay trên cọc)',
    '對準點（遠方另一根樁）': 'Điểm ngắm (cọc khác ở xa)',
    '兩點距離 {d} m（越遠方向越準，建議 30 m 以上）': 'Khoảng cách hai điểm {d} m (càng xa càng chính xác, nên trên 30 m)',
    '手機離地高度 (m)': 'Độ cao điện thoại so với mặt đất (m)',
    '顯示到階段': 'Hiển thị đến giai đoạn',
    '開始 AR': 'Bắt đầu AR',
    '步驟：① 站在 {a} 樁正上方 ② 按「開始 AR」，允許使用相機 ③ 十字對準 {b} 樁（或立在樁上的標桿）按「確定」。': 'Các bước: ① Đứng ngay trên cọc {a} ② Nhấn "Bắt đầu AR", cho phép dùng camera ③ Ngắm dấu thập vào cọc {b} (hoặc sào dựng trên cọc), nhấn "OK".',
    '站立點': 'Điểm đứng', '對準點': 'Điểm ngắm',
    '十字對準 {b} → 確定': 'Ngắm dấu thập vào {b} → OK',
    '手肘靠緊身體，等顯示「穩定」再按。看不清楚樁時，請人在樁上立標桿。': 'Ép khuỷu tay sát người, chờ hiện "Ổn định" rồi nhấn. Nếu khó thấy cọc, nhờ người dựng sào trên cọc.',
    '方向': 'Hướng', '高度': 'Độ cao', '不透明度': 'Độ đậm',
    '鏡頭視角 {v}°（模型大小和實景不同時調整）': 'Góc nhìn camera {v}° (chỉnh khi kích thước mô hình khác thực tế)',
    '重新校正': 'Hiệu chỉnh lại', '收合': 'Thu gọn', '展開': 'Mở rộng',
    '紅色標桿 = {b}，應落在真的 {b} 樁上；偏左右按 ◀ ▶（每次 0.1°，按住連續），高低不對按 ▲ ▼。': 'Cột đỏ = {b}, phải nằm đúng trên cọc {b} thật. Lệch trái/phải nhấn ◀ ▶ (0,1° mỗi lần, giữ để liên tục), cao/thấp nhấn ▲ ▼.',
    '相機模式不會追蹤走動：移動位置後請回到樁上重新校正。': 'Chế độ camera không theo dõi di chuyển: sau khi đổi vị trí, quay lại cọc và hiệu chỉnh lại.',
    '點畫面上的構件可查看資訊（再點空白處關閉）。': 'Chạm vào cấu kiện trên màn hình để xem thông tin (chạm chỗ trống để đóng).',
    'stations.json 沒有 QR 標記資料（markers）': 'stations.json không có dữ liệu mốc QR (markers)',
    '方向已用 {name} 修正：請檢查紅色標桿是否落在 {name} 樁上': 'Đã hiệu chỉnh hướng theo {name}: kiểm tra cột đỏ có nằm đúng trên cọc {name} không',
    'QR 定位完成：請檢查紅框是否疊在真的 QR 牌上': 'Định vị QR xong: kiểm tra khung đỏ có trùng với bảng QR thật không',
    '尋找 QR 標記…': 'Đang tìm mốc QR…',
    'QR 辨識程式載入失敗': 'Lỗi tải trình đọc QR',
    '這個 QR 不是定位標記': 'Mã QR này không phải mốc định vị',
    'stations.json 找不到標記 {id}': 'Không tìm thấy mốc {id} trong stations.json',
    '偵測到 {id}，但角點誤差太大（{e} px），請靠近一點、正對 QR': 'Đã thấy {id} nhưng sai số góc quá lớn ({e} px). Hãy lại gần và nhìn thẳng vào QR',
    '偵測到 {id}：距離 {d} m，收集中 {n}/{N}': 'Đã thấy {id}: cách {d} m, đang thu {n}/{N}',
    '晃動中，請拿穩': 'Đang rung, hãy cầm chắc',
    '方向已用 {name} 修正': 'Đã chỉnh hướng theo {name}',
    'QR 定位（{id}）：距牌 {d} m，手機高程 {h} m': 'Định vị QR ({id}): cách bảng {d} m, cao độ điện thoại {h} m',
    '對準兩根樁': 'Ngắm hai cọc',
    '掃描 QR 標記': 'Quét mốc QR',
    '已設定 {n} 個 QR 標記：': 'Có {n} mốc QR: ',
    '步驟：① 站在 QR 牌前約 1 m（越近越準）② 按「開始 AR」，允許使用相機 ③ 讓整個 QR 出現在畫面框內，拿穩約 1 秒會自動定位。': 'Các bước: ① Đứng trước bảng QR khoảng 1 m (càng gần càng chính xác) ② Nhấn "Bắt đầu AR", cho phép dùng camera ③ Đưa toàn bộ mã QR vào khung, giữ yên khoảng 1 giây sẽ tự định vị.',
    'QR 定位的高程與位置很準，方向誤差約 0.5～1°；看遠處時可再用「對準遠方樁修正方向」。': 'Vị trí và cao độ từ QR rất chính xác, sai số hướng khoảng 0,5–1°. Khi nhìn xa, dùng thêm "Chỉnh hướng bằng cọc ở xa".',
    '讓整個 QR 出現在框內，距離約 1 m，拿穩不動。': 'Đưa toàn bộ mã QR vào khung, cách khoảng 1 m, giữ yên.',
    '改用對準兩根樁': 'Chuyển sang ngắm hai cọc',
    '十字對準 {b} → 修正方向': 'Ngắm dấu thập vào {b} → chỉnh hướng',
    '取消': 'Hủy',
    '已可離線使用：之後沒有網路也能開啟（模型更新時需連網開一次）': 'Đã sẵn sàng dùng ngoại tuyến: mở được khi không có mạng (khi mô hình cập nhật, cần mở một lần có mạng)',
    '太近': 'quá gần', '實測點': 'Điểm đo thực tế', '模型橋墩中心': 'Tâm trụ cầu (mô hình)',
    '對準遠方樁修正方向': 'Chỉnh hướng bằng cọc ở xa',
    '重新掃描 QR': 'Quét lại QR',
    '紅框 = QR 牌的測量位置，應疊在真的 QR 牌上；黃色／紅色標桿 = 已知樁。': 'Khung đỏ = vị trí đo của bảng QR, phải trùng với bảng QR thật; cột vàng/đỏ = cọc đã biết.',
    '推算的手機離地高度 {h} m 不合理：請確認十字對準 {name} 樁的入土處，或在設定改用手動高度。': 'Độ cao điện thoại tính được {h} m không hợp lý: kiểm tra dấu thập đã ngắm đúng chân cọc {name} (chỗ cắm xuống đất), hoặc chuyển sang nhập độ cao thủ công.',
    '推算手機離地 {h} m': 'Độ cao điện thoại tính được {h} m',
    '高程自動校正（十字對準樁的入土處，用俯角推算）': 'Tự động hiệu chỉnh cao độ (ngắm chân cọc, tính theo góc nhìn xuống)',
    '十字對準 {b} 入土處 → 確定': 'Ngắm chân cọc {b} → OK',
    '高程自動校正：十字中心要對在樁（或標桿）與地面交接處。': 'Cao độ tự động: tâm dấu thập phải đúng chỗ cọc (hoặc sào) tiếp giáp mặt đất.',
    '高程：自動（俯角 {a}°），手機離地 {h} m': 'Cao độ: tự động (góc nhìn xuống {a}°), điện thoại cao {h} m',
    '高程：手動，手機離地 {h} m': 'Cao độ: thủ công, điện thoại cao {h} m',
  });

  // 工程用語對照（模型資料內的詞，長的先比對）
  const G = {
    id: [['井式基礎施工構台', 'Panggung kerja pondasi sumuran'], ['鋼構吊裝施工構台', 'Panggung kerja pengangkatan baja'], ['大圓路面', 'Perkerasan lingkaran besar'], ['小圓路面', 'Perkerasan lingkaran kecil'], ['P1下', 'P1 bawah'], ['既有道路構台', 'Panggung jalan eksisting'],
      ['品類：', 'Kategori:'], ['樓板', 'Pelat'], ['量體', 'Massa'], ['基礎', 'Pondasi'], ['欄杆', 'Pagar'], ['結構構架', 'Rangka struktur'], ['結構柱', 'Kolom struktur'], ['施工構台道路', 'Jalan panggung kerja'], ['施工構台', 'Panggung kerja'], ['施工平台', 'Platform kerja'], ['井式基礎', 'Pondasi sumuran'], ['鋼構吊裝', 'Pengangkatan baja'],
      ['鋼箱梁', 'Gelagar kotak baja'], ['鋼梁支撐', 'Penyangga balok baja'], ['既有道路', 'Jalan eksisting'], ['下構台', 'Panggung bawah'], ['構台大樑', 'Balok utama panggung'],
      ['構台小樑', 'Balok anak panggung'], ['構台繫樑', 'Balok pengikat panggung'], ['構台柱', 'Kolom panggung'], ['構台', 'Panggung'], ['大圓', 'Lingkaran besar'], ['小圓', 'Lingkaran kecil'],
      ['路面', 'Perkerasan'], ['整地', 'Perataan tanah'], ['橋墩', 'Pilar'], ['橋台', 'Abutmen'], ['大樑', 'Balok utama'], ['小樑', 'Balok anak'], ['繫樑', 'Balok pengikat'],
      ['斜撐', 'Bresing'], ['覆工鈑', 'Pelat penutup'], ['長度', 'panjang'], ['現有', 'Eksisting'], ['新營造', 'Konstruksi baru'], ['(上)', '(atas)'], ['(下)', '(bawah)']],
    vi: [['井式基礎施工構台', 'Sàn công tác móng giếng'], ['鋼構吊裝施工構台', 'Sàn công tác cẩu lắp thép'], ['大圓路面', 'Mặt đường vòng lớn'], ['小圓路面', 'Mặt đường vòng nhỏ'], ['P1下', 'P1 dưới'], ['既有道路構台', 'Sàn công tác đường hiện hữu'],
      ['品類：', 'Hạng mục:'], ['樓板', 'Sàn'], ['量體', 'Khối'], ['基礎', 'Móng'], ['欄杆', 'Lan can'], ['結構構架', 'Khung kết cấu'], ['結構柱', 'Cột kết cấu'], ['施工構台道路', 'Đường sàn công tác'], ['施工構台', 'Sàn công tác'], ['施工平台', 'Sàn thi công'], ['井式基礎', 'Móng giếng'], ['鋼構吊裝', 'Cẩu lắp thép'],
      ['鋼箱梁', 'Dầm hộp thép'], ['鋼梁支撐', 'Chống đỡ dầm thép'], ['既有道路', 'Đường hiện hữu'], ['下構台', 'Sàn công tác dưới'], ['構台大樑', 'Dầm chính sàn công tác'],
      ['構台小樑', 'Dầm phụ sàn công tác'], ['構台繫樑', 'Dầm giằng sàn công tác'], ['構台柱', 'Cột sàn công tác'], ['構台', 'Sàn công tác'], ['大圓', 'Vòng lớn'], ['小圓', 'Vòng nhỏ'],
      ['路面', 'Mặt đường'], ['整地', 'San nền'], ['橋墩', 'Trụ cầu'], ['橋台', 'Mố cầu'], ['大樑', 'Dầm chính'], ['小樑', 'Dầm phụ'], ['繫樑', 'Dầm giằng'],
      ['斜撐', 'Giằng chéo'], ['覆工鈑', 'Tấm lát'], ['長度', 'dài'], ['現有', 'Hiện hữu'], ['新營造', 'Xây mới'], ['(上)', '(trên)'], ['(下)', '(dưới)']],
  };

  // 常見 Revit 參數名稱
  const P = {
    id: { '體積': 'Volume', '面積': 'Luas', '長度': 'Panjang', '樓層': 'Level', '族群': 'Famili', '類型': 'Tipe', '品類': 'Kategori', '建立階段': 'Tahap dibuat', '拆除階段': 'Tahap dibongkar', '標記': 'Tanda', '註解': 'Komentar', '材料': 'Material', '寬度': 'Lebar', '高度': 'Tinggi', '厚度': 'Tebal' },
    vi: { '體積': 'Thể tích', '面積': 'Diện tích', '長度': 'Chiều dài', '樓層': 'Cao độ tầng', '族群': 'Họ', '類型': 'Kiểu', '品類': 'Hạng mục', '建立階段': 'Giai đoạn tạo', '拆除階段': 'Giai đoạn tháo dỡ', '標記': 'Ký hiệu', '註解': 'Ghi chú', '材料': 'Vật liệu', '寬度': 'Chiều rộng', '高度': 'Chiều cao', '厚度': 'Độ dày' },
  };

  // 長的詞先比對（例如「井式基礎」要比「基礎」先換）
  for (const k in G) G[k].sort((a, b) => b[0].length - a[0].length);

  const LANGS = ['zh', 'id', 'vi'];
  let lang = 'zh';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    lang = LANGS.includes(q) ? q : (LANGS.includes(localStorage.getItem('w3d.lang')) ? localStorage.getItem('w3d.lang') : 'zh');
  } catch (e) { }

  const fill = (s, v) => v ? s.replace(/\{(\w+)\}/g, (m, k) => v[k] !== undefined ? v[k] : m) : s;
  window.t = (s, v) => fill(lang === 'zh' ? s : (D[lang][s] ?? s), v);
  window.tc = s => {
    if (lang === 'zh' || !s) return s;
    if (D[lang][s]) return D[lang][s];
    let r = String(s);
    for (const [a, b] of G[lang]) r = r.split(a).join(' ' + b + ' ');
    return r.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s*\+\s*/g, ' + ').replace(/\s*-\s*/g, '-').replace(/、/g, ', ').replace(/\s+([:：,，])/g, '$1').trim();
  };
  window.tp = s => lang === 'zh' ? s : (P[lang][s] ?? s);
  window.getLang = () => lang;

  function applyStatic() {
    document.documentElement.lang = { zh: 'zh-Hant', id: 'id', vi: 'vi' }[lang];
    document.querySelectorAll('[data-i18n]').forEach(e => {
      if (e.dataset.zh === undefined) e.dataset.zh = e.innerHTML.trim();
      e.innerHTML = window.t(e.dataset.zh);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(e => {
      if (e.dataset.zhTitle === undefined) e.dataset.zhTitle = e.title;
      e.title = window.t(e.dataset.zhTitle);
    });
    document.querySelectorAll('select.langsel').forEach(s => s.value = lang);
    document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
  }
  window.setLang = l => {
    if (!LANGS.includes(l) || l === lang) return;
    lang = l;
    try { localStorage.setItem('w3d.lang', l); } catch (e) { }
    applyStatic();
    if (window.onLangChange) window.onLangChange();
  };
  window.initI18n = () => {
    applyStatic();
    document.querySelectorAll('select.langsel').forEach(s => s.onchange = () => window.setLang(s.value));
    document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => window.setLang(b.dataset.lang));
  };
})();
