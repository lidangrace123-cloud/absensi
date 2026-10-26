# Balole Billiard Sport & Cafe - Sistem Presensi Karyawan

Aplikasi web presensi karyawan Balole Billiard Sport & Cafe dengan kamera *streamer* langsung, validasi jam shift, serta fitur rekapitulasi bulanan.

## 🚀 Fitur Utama

1. **Halaman Utama (Presensi Harian)**:
   - **Tampilan Clean Dominasi Putih**: Desain minimalis elegan dengan font *Plus Jakarta Sans*, kartu putih bersih, dan bayangan halus.
   - **Live Clock**: Jam digital realtime dengan detak detik dan indikator status aktif.
   - **Statistik Cepat**: Kartu ringkasan total absen masuk, jumlah hadir, tidak hadir, dan persentase kehadiran harian.
   - **Daftar Presensi Lengkap**:
     - Preview thumbnail kecil foto karyawan.
     - **Lightbox Preview Foto**: Klik foto atau tombol kaca pembesar untuk melihat foto ukuran besar beserta watermark waktu pengambilan dan detail kehadiran.
     - Nama Karyawan & Role (*Kasir*, *Barista*, *Racker*).
     - Tanggal & jam upload otomatis saat foto diambil.
     - Status Absensi (**Hadir** / **Tidak Hadir**).
     - Keterangan hasil validasi sistem.
   - **Pencarian & Filter Fleksibel**:
     - Filter per hari / tanggal dengan date picker (bisa tombol cepat *Hari Ini* atau *Semua Tanggal*).
     - Filter berdasarkan Role (*Kasir*, *Barista*, *Racker*).
     - Filter berdasarkan Status (*Hadir*, *Tidak Hadir*).
     - Pencarian teks nama karyawan.
     - Fitur **Export CSV** untuk data harian.

2. **Form Tambah Absen (Kamera Streamer Langsung)**:
   - Menggunakan `navigator.mediaDevices.getUserMedia` untuk streaming kamera webcam langsung.
   - Tampilan *viewfinder* dengan panduan posisi wajah dan indikator *Live Streamer*.
   - Tombol **Ambil Foto (Snapshot)**: Mengambil foto secara instan ke canvas dengan penambahan cap waktu (*watermark*) otomatis di bawah foto.
   - Tombol **Foto Ulang** dan opsi **Upload File** manual jika kamera tidak tersedia di perangkat uji.
   - Pilihan Role (*Kasir*, *Barista*, *Racker*).
   - Pilihan Shift khusus Kasir (*Shift Siang* / *Shift Malam*).
   - Kotak ringkasan aturan jam shift yang update otomatis.
   - **Mode Simulasi Jam Uji Coba**: Fitur khusus untuk pengujian dan demonstrasi skripsi, memungkinkan dosen/penguji mencoba berbagai jam absensi untuk membuktikan kalkulasi logika.
   - Prediksi status absensi *realtime* di dalam form sebelum submit.

3. **Aturan Shift & Validasi Status (Hadir / Tidak Hadir)**:
   - **Kasir**:
     - *Shift Siang* (11:00 AM - 18:00 PM): Masih diterima toleransi hingga 2 jam setelah jam shift berakhir (**sampai 20:00**) dengan status **Hadir**. Di luar jam tersebut status **Tidak Hadir**.
     - *Shift Malam* (18:00 PM - 01:00 AM): Masih diterima toleransi hingga 2 jam setelah jam shift (**sampai 03:00 dini hari**) dengan status **Hadir**. Di luar jam tersebut status **Tidak Hadir**.
   - **Barista**:
     - Jam Shift: 13:00 (1 PM) - 01:00 (1 AM), toleransi +2 jam hingga 03:00. Di luar jam tersebut status **Tidak Hadir**.
   - **Racker**:
     - Jam Shift: 18:00 (6 PM) - 01:00 (1 AM), toleransi +2 jam hingga 03:00. Di luar jam tersebut status **Tidak Hadir**.

4. **Halaman Rekapitulasi Bulanan**:
   - Tab navigasi khusus rekapitulasi.
   - Filter pilihan **Bulan** (Januari s.d. Desember) dan **Tahun**.
   - Filter Role dan pencarian nama.
   - Kartu metrik: Total Kehadiran Bulan Ini, Tidak Hadir, Karyawan Terdata, dan Rata-rata Presensi.
   - Tabel Rekap:
     - No & Avatar Foto Terbaru
     - Nama Karyawan & Role
     - **Jumlah Hadir** (kolom utama terhitung berdasarkan akumulasi form absensi per bulan)
     - Jumlah Tidak Hadir
     - Total Input Absen
     - Persentase Kehadiran dengan progress bar visual
     - Status Evaluasi Kedisiplinan
   - Fitur **Cetak / Print Rekap** dan **Export CSV Rekap Bulanan**.

5. **Penyimpanan Data**:
   - Disimpan di `localStorage` peramban, data aman dan tetap tersimpan saat halaman di-refresh.
   - Dilengkapi tombol **Reset Data Demo** untuk memuat ulang data contoh absensi simulasi kapan saja.

---

## 💻 Cara Menjalankan Proyek

1. Buka terminal di folder proyek:
   ```bash
   cd "d:\Program Skripsi Grace\absesnsi"
   ```
2. Jalankan development server:
   ```bash
   npm run dev
   ```
3. Buka browser di alamat:
   ```
   http://localhost:5173/
   ```
