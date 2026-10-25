/**
 * main.js
 * Balole Biliard Sport & Cafe - Sistem Presensi Karyawan
 * Dengan Desain Icon Seragam Minimalis 1 Warna & Logo Resmi
 */

import './style.css';
import { ROLES, evaluateAttendance } from './rules.js';
import {
  getAllRecords,
  addAttendanceRecord,
  deleteAttendanceRecord,
  getAdminPassword,
  setAdminPassword
} from './storage.js';
import { startCameraStream, stopCameraStream, captureSnapshot } from './camera.js';
import logoUrl from './assets/logo.jpg';

// State Autentikasi ('karyawan' | 'admin' | null)
let currentAuthRole = sessionStorage.getItem('grace_auth_role') || null;
let loginSelectedTab = 'karyawan'; // 'karyawan' | 'admin'

// State Aplikasi
let currentTab = 'daily'; // 'daily' | 'monthly'
let currentRecords = getAllRecords();

// Filter State Harian
const todayStr = new Date().toISOString().split('T')[0];
let dailyFilter = {
  date: todayStr,
  role: 'all',
  status: 'all',
  search: ''
};

// Filter State Bulanan
const now = new Date();
let monthlyFilter = {
  month: now.getMonth(), // 0-11
  year: now.getFullYear(),
  role: 'all',
  search: ''
};

// Form Absen State
let formState = {
  name: '',
  role: ROLES.KASIR,
  shiftKey: 'siang',
  capturedPhoto: null,
  capturedTime: new Date()
};

// Element references
const appEl = document.getElementById('app');

/**
 * Controller Tampilan Utama
 */
function initAppView() {
  if (!currentAuthRole) {
    renderLoginPage();
  } else {
    renderApp();
  }
}

/**
 * Render Halaman Login dengan Logo Balole Biliard Sport & Cafe
 */
function renderLoginPage() {
  appEl.innerHTML = `
    <div class="login-page-wrapper">
      <div class="login-card">
        <div class="login-header">
          <img src="${logoUrl}" alt="Balole Biliard Sport & Cafe" class="login-logo-img" />
          <h2>Balole Biliard Sport & Cafe</h2>
          <p>Sistem Presensi & Absensi Karyawan</p>
        </div>

        <!-- Pilihan Role Login -->
        <div class="login-role-selector">
          <button type="button" class="role-tab-btn ${loginSelectedTab === 'karyawan' ? 'active' : ''}" id="tabSelectKaryawan">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Karyawan</span>
          </button>
          <button type="button" class="role-tab-btn ${loginSelectedTab === 'admin' ? 'active' : ''}" id="tabSelectAdmin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Admin</span>
          </button>
        </div>

        <div class="login-body">
          ${
            loginSelectedTab === 'karyawan'
              ? `
            <div class="login-info-box">
              <strong>Masuk sebagai Karyawan</strong><br />
              Karyawan dapat langsung masuk untuk melakukan absensi
            </div>

            <button type="button" class="btn btn-primary" id="btnEnterKaryawan" style="width: 100%; padding: 12px; font-size: 0.95rem;">
              Masuk sebagai Karyawan →
            </button>
          `
              : `
            <form id="adminLoginForm" style="display: flex; flex-direction: column; gap: 14px;">
              <div id="adminLoginError" class="login-error-alert" style="display: none;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span id="adminErrorMsg">Username atau password salah!</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="adminUsername">Username</label>
                <input
                  type="text"
                  id="adminUsername"
                  class="form-control"
                  placeholder="Masukkan username"
                  required
                  autocomplete="username"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="adminPassword">Password</label>
                <input
                  type="password"
                  id="adminPassword"
                  class="form-control"
                  placeholder="Masukkan password"
                  required
                  autocomplete="current-password"
                />
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 0.95rem; margin-top: 4px;">
                Masuk sebagai Admin
              </button>
            </form>
          `
          }
        </div>
      </div>
    </div>
  `;

  bindLoginEvents();
}

/**
 * Event Listeners Halaman Login
 */
function bindLoginEvents() {
  const tabSelectKaryawan = document.getElementById('tabSelectKaryawan');
  const tabSelectAdmin = document.getElementById('tabSelectAdmin');
  const btnEnterKaryawan = document.getElementById('btnEnterKaryawan');
  const adminLoginForm = document.getElementById('adminLoginForm');

  tabSelectKaryawan?.addEventListener('click', () => {
    loginSelectedTab = 'karyawan';
    renderLoginPage();
  });

  tabSelectAdmin?.addEventListener('click', () => {
    loginSelectedTab = 'admin';
    renderLoginPage();
  });

  // Karyawan: Langsung masuk tanpa username & password
  btnEnterKaryawan?.addEventListener('click', () => {
    currentAuthRole = 'karyawan';
    sessionStorage.setItem('grace_auth_role', 'karyawan');
    currentRecords = getAllRecords();
    renderApp();
  });

  // Admin: Login dengan username admin & password dari storage
  adminLoginForm?.addEventListener('submit', e => {
    e.preventDefault();
    const usernameInput = document.getElementById('adminUsername');
    const passwordInput = document.getElementById('adminPassword');
    const errorBox = document.getElementById('adminLoginError');
    const errorMsg = document.getElementById('adminErrorMsg');

    const username = usernameInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (username === 'admin' && password === getAdminPassword()) {
      currentAuthRole = 'admin';
      sessionStorage.setItem('grace_auth_role', 'admin');
      currentRecords = getAllRecords();
      renderApp();
    } else {
      if (errorBox && errorMsg) {
        errorMsg.textContent = 'Username atau password salah!';
        errorBox.style.display = 'flex';
      }
    }
  });
}

/**
 * Render Utama Seluruh Aplikasi Presensi
 */
function renderApp() {
  appEl.innerHTML = `
    <!-- Top Navigation Bar -->
    <header class="navbar">
      <div class="nav-inner">
        <div class="brand">
          <div class="brand-icon">
            <img src="${logoUrl}" alt="Balole Biliard Sport & Cafe" class="brand-logo-img" />
          </div>
          <div class="brand-text">
            <h1>Balole Biliard Sport & Cafe</h1>
            <p>Sistem Presensi Karyawan & Rekapitulasi</p>
          </div>
        </div>

        <div class="nav-actions">
          <div class="live-clock-badge" id="liveClockBadge">
            <span class="live-pulse"></span>
            <span id="liveClockText">Memuat waktu...</span>
          </div>

          <!-- Role Indicator Badge -->
          <div class="nav-role-badge ${currentAuthRole === 'admin' ? 'nav-role-admin' : 'nav-role-karyawan'}">
            <span>
              ${
                currentAuthRole === 'admin'
                  ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
                  : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
              }
            </span>
            <span>${currentAuthRole === 'admin' ? 'Admin' : 'Karyawan'}</span>
          </div>

          ${
            currentAuthRole === 'karyawan'
              ? `
            <button class="btn btn-primary" id="btnOpenAddModal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Tambahkan Absen
            </button>
          `
              : `
            <button class="btn btn-primary" id="btnOpenAdminAddModal" title="Tambah Absen / Izin / Sakit (Admin)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Tambahkan Absen
            </button>
          `
          }

          ${
            currentAuthRole === 'admin'
              ? `
            <button class="btn btn-outline btn-sm" id="btnOpenChangePassword" title="Ganti Password Admin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Ganti Password
            </button>
          `
              : ''
          }

          <button class="btn btn-outline btn-sm" id="btnLogoutBtn" title="Keluar / Ganti Akun">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Keluar
          </button>
        </div>
      </div>
    </header>

    <!-- Nav Tabs Switcher -->
    <div class="tabs-wrapper">
      <div class="tabs-container">
        <button class="tab-btn ${currentTab === 'daily' ? 'active' : ''}" id="tabDailyBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Daftar Absensi Harian
          <span class="tab-badge" id="tabDailyBadge">0</span>
        </button>

        <button class="tab-btn ${currentTab === 'monthly' ? 'active' : ''}" id="tabMonthlyBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          Halaman Rekapitulasi Bulanan
        </button>
      </div>
    </div>

    <!-- Main Container Content -->
    <main class="container">
      <div id="mainContentArea"></div>
    </main>

    <!-- Modal Form Tambah Absen (Kamera Langsung) -->
    <div class="modal-backdrop" id="modalAddAttendance">
      <div class="modal-dialog">
        <div class="modal-header">
          <h2 class="modal-title">Form Tambah Absensi Karyawan</h2>
          <button class="modal-close-btn" id="btnCloseAddModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <!-- Area Streamer Kamera Langsung -->
          <div class="camera-container" id="cameraBox">
            <video id="webcamVideo" class="camera-video" autoplay playsinline muted></video>
            <img id="snapshotPreviewImg" class="camera-preview-img" style="display: none;" alt="Preview Foto Absen" />
            
            <div class="camera-viewfinder" id="cameraViewfinder">
              <span class="camera-corner tl"></span>
              <span class="camera-corner tr"></span>
              <span class="camera-corner bl"></span>
              <span class="camera-corner br"></span>
            </div>

            <div class="camera-live-badge" id="cameraLiveBadge">
              <span class="live-pulse"></span>
              <span>KAMERA STREAMER AKTIF</span>
            </div>
          </div>

          <!-- Tombol Aksi Kamera -->
          <div class="camera-actions-bar">
            <button type="button" class="btn btn-primary" id="btnSnapPhoto">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Ambil Foto Sekarang
            </button>
            <button type="button" class="btn btn-outline" id="btnRetakePhoto" style="display: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>
              Foto Ulang
            </button>
          </div>

          <form id="attendanceForm">
            <!-- Nama Karyawan -->
            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label" for="formEmpName">Nama Karyawan *</label>
              <input
                type="text"
                id="formEmpName"
                class="form-control"
                placeholder="Masukkan nama lengkap karyawan..."
                required
                autocomplete="off"
              />
            </div>

            <!-- Role Karyawan -->
            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label" for="formRole">Role Karyawan *</label>
              <select id="formRole" class="form-control" required>
                <option value="${ROLES.KASIR}">${ROLES.KASIR}</option>
                <option value="${ROLES.BARISTA}">${ROLES.BARISTA}</option>
                <option value="${ROLES.RACKER}">${ROLES.RACKER}</option>
              </select>
            </div>

            <!-- Pilihan Shift -->
            <div class="form-group" id="kasirShiftGroup" style="margin-top: 14px;">
              <label class="form-label" for="formKasirShift">Pilihan Shift *</label>
              <select id="formKasirShift" class="form-control">
                <option value="siang">Shift Siang</option>
                <option value="malam">Shift Malam</option>
              </select>
            </div>

            <!-- Status Absensi Card yang Responsif dan Menyesuaikan Lebar -->
            <div id="liveStatusPreview" class="live-status-card">
              <div class="live-status-header">
                <span class="live-status-label">Status Absensi Terdeteksi:</span>
                <span id="predictedStatusBadge" class="badge badge-hadir">Hadir</span>
              </div>
              <div id="predictedReasonText" class="live-status-reason">
                Tepat Waktu (Dalam batas toleransi shift)
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="btnCancelAdd">Batal</button>
          <button type="button" class="btn btn-primary" id="btnSubmitAttendance">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Submit & Simpan Absen
          </button>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal untuk Preview Foto Besar -->
    <div class="modal-backdrop" id="modalPhotoLightbox">
      <div class="modal-dialog lightbox-dialog">
        <div class="modal-header">
          <h2 class="modal-title" id="lightboxName">Preview Foto Karyawan</h2>
          <button class="modal-close-btn" id="btnCloseLightbox">&times;</button>
        </div>
        <div class="modal-body" style="padding: 0;">
          <div class="lightbox-img-wrapper">
            <img id="lightboxImg" class="lightbox-img" src="" alt="Foto Absen" />
          </div>
          <div class="lightbox-details">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <h3 id="lbEmpName" style="font-size: 1.15rem; font-weight: 700;">Nama Karyawan</h3>
                <span id="lbRoleBadge" class="badge">Role</span>
              </div>
              <div id="lbStatusBadge" class="badge" style="font-size: 0.85rem; padding: 6px 14px;">Hadir</div>
            </div>

            <div class="lightbox-details-grid">
              <div>
                <div class="detail-item-label">Waktu Ambil Foto</div>
                <div class="detail-item-val" id="lbCaptureTime">-</div>
              </div>
              <div>
                <div class="detail-item-label">Shift Kerja</div>
                <div class="detail-item-val" id="lbShiftName">-</div>
              </div>
              <div>
                <div class="detail-item-label">Status Verifikasi</div>
                <div class="detail-item-val" id="lbStatusDesc">-</div>
              </div>
              <div>
                <div class="detail-item-label">Ketentuan Jam</div>
                <div class="detail-item-val" id="lbToleranceNote">Maks. +2 Jam Awal Masuk</div>
              </div>
            </div>

            <div style="margin-top: 14px; background: #f8fafc; border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
              <strong>Keterangan Sistem:</strong>
              <div id="lbReasonText" style="margin-top: 3px;">-</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="btnCloseLightboxBtn">Tutup</button>
        </div>
      </div>
    </div>

    <!-- Modal Ganti Password Admin -->
    <div class="modal-backdrop" id="modalChangePassword">
      <div class="modal-dialog" style="max-width: 440px;">
        <div class="modal-header">
          <h2 class="modal-title">Ganti Password Admin</h2>
          <button class="modal-close-btn" id="btnCloseChangePassword">&times;</button>
        </div>
        <form id="formChangePassword">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
            <div id="changePassAlert" class="login-error-alert" style="display: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span id="changePassAlertMsg"></span>
            </div>

            <div class="form-group">
              <label class="form-label" for="currAdminPass">Password Saat Ini *</label>
              <input
                type="password"
                id="currAdminPass"
                class="form-control"
                placeholder="Masukkan password saat ini"
                required
                autocomplete="current-password"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="newAdminPass">Password Baru *</label>
              <input
                type="password"
                id="newAdminPass"
                class="form-control"
                placeholder="Masukkan password baru (min. 4 karakter)"
                required
                minlength="4"
                autocomplete="new-password"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="confirmAdminPass">Konfirmasi Password Baru *</label>
              <input
                type="password"
                id="confirmAdminPass"
                class="form-control"
                placeholder="Ulangi password baru"
                required
                minlength="4"
                autocomplete="new-password"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btnCancelChangePassword">Batal</button>
            <button type="submit" class="btn btn-primary" id="btnSubmitChangePassword">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Simpan Password
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Form Tambah Absen Khusus Admin (Tanpa Kamera, Nama, Role, Keterangan Izin/Sakit) -->
    <div class="modal-backdrop" id="modalAdminAddAttendance">
      <div class="modal-dialog" style="max-width: 480px;">
        <div class="modal-header">
          <h2 class="modal-title">Pencatatan Absensi Karyawan (Admin)</h2>
          <button class="modal-close-btn" id="btnCloseAdminAddModal">&times;</button>
        </div>
        <form id="adminAttendanceForm">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
            <div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 4px; font-size: 0.82rem; color: #1e40af;">
              Input manual khusus Admin tanpa kamera foto. Status kehadiran otomatis ditetapkan sesuai keterangan yang Anda pilih (bebas waktu submit).
            </div>

            <!-- Nama Karyawan -->
            <div class="form-group">
              <label class="form-label" for="adminEmpName">Nama Karyawan *</label>
              <input
                type="text"
                id="adminEmpName"
                class="form-control"
                placeholder="Masukkan nama lengkap karyawan..."
                required
                autocomplete="off"
              />
            </div>

            <!-- Role Karyawan -->
            <div class="form-group">
              <label class="form-label" for="adminEmpRole">Role Karyawan *</label>
              <select id="adminEmpRole" class="form-control" required>
                <option value="${ROLES.KASIR}">${ROLES.KASIR}</option>
                <option value="${ROLES.BARISTA}">${ROLES.BARISTA}</option>
                <option value="${ROLES.RACKER}">${ROLES.RACKER}</option>
              </select>
            </div>

            <!-- Status Keterangan (Izin Khusus, Izin Pribadi, Sakit) -->
            <div class="form-group">
              <label class="form-label" for="adminKeteranganType">Status Keterangan *</label>
              <select id="adminKeteranganType" class="form-control" required>
                <option value="Izin (Khusus)">Izin (Khusus)</option>
                <option value="Izin (Pribadi)">Izin (Pribadi)</option>
                <option value="Sakit">Sakit</option>
              </select>
            </div>

            <!-- Catatan Tambahan (Opsional) -->
            <div class="form-group">
              <label class="form-label" for="adminNotes">Catatan / Alasan (Opsional)</label>
              <input
                type="text"
                id="adminNotes"
                class="form-control"
                placeholder="Misal: Keperluan keluarga, demam berdarah, dll..."
                autocomplete="off"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btnCancelAdminAdd">Batal</button>
            <button type="submit" class="btn btn-primary" id="btnSubmitAdminAttendance">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Simpan Absen
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast Notifications Area -->
    <div class="toast-container" id="toastContainer"></div>
  `;

  bindCoreEvents();
  renderCurrentTab();
  startClockTicker();
}

/**
 * Update jam digital realtime di navbar
 */
function startClockTicker() {
  const clockTextEl = document.getElementById('liveClockText');
  const updateClock = () => {
    if (!clockTextEl) return;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB';

    clockTextEl.textContent = `${dateFormatted} • ${timeFormatted}`;
  };

  updateClock();
  setInterval(updateClock, 1000);
}

/**
 * Render konten tab yang aktif
 */
function renderCurrentTab() {
  const container = document.getElementById('mainContentArea');
  if (!container) return;

  if (currentTab === 'daily') {
    renderDailyPage(container);
  } else {
    renderMonthlyPage(container);
  }

  const dailyBadge = document.getElementById('tabDailyBadge');
  if (dailyBadge) {
    const todayRecords = currentRecords.filter(r => r.timestamp.startsWith(todayStr));
    dailyBadge.textContent = todayRecords.length;
  }
}

/**
 * Halaman 1: Daftar Absensi Harian (Page Utama)
 * Dengan Icon Minimalis Seragam 1 Warna
 */
function renderDailyPage(container) {
  let filtered = currentRecords.filter(item => {
    if (dailyFilter.date && !item.timestamp.startsWith(dailyFilter.date)) {
      return false;
    }
    if (dailyFilter.role !== 'all' && item.role !== dailyFilter.role) {
      return false;
    }
    if (dailyFilter.status !== 'all' && item.status !== dailyFilter.status) {
      return false;
    }
    if (dailyFilter.search) {
      const q = dailyFilter.search.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.role.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const totalRecords = filtered.length;
  const totalHadir = filtered.filter(r => r.status === 'Hadir').length;
  const totalTidakHadir = filtered.filter(r => r.status === 'Tidak Hadir').length;
  const presencePct = totalRecords > 0 ? Math.round((totalHadir / totalRecords) * 100) : 0;

  const selectedDateFormatted = dailyFilter.date
    ? new Date(dailyFilter.date + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Semua Tanggal';

  container.innerHTML = `
    <!-- Stat Cards Header: Icon Seragam Minimalis 1 Warna -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-label">Total Absen Masuk</div>
          <div class="stat-value">${totalRecords}</div>
          <div class="stat-sub">${selectedDateFormatted}</div>
        </div>
        <div class="stat-icon">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-label">Status Hadir</div>
          <div class="stat-value" style="color: #059669;">${totalHadir}</div>
          <div class="stat-sub">Maksimal +2 jam awal masuk</div>
        </div>
        <div class="stat-icon">
          <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-label">Tidak Hadir</div>
          <div class="stat-value" style="color: #dc2626;">${totalTidakHadir}</div>
          <div class="stat-sub">Lewat +2 jam awal masuk</div>
        </div>
        <div class="stat-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-label">Persentase Kehadiran</div>
          <div class="stat-value">${presencePct}%</div>
          <div class="stat-sub">Rasio hadir vs total absen</div>
        </div>
        <div class="stat-icon">
          <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
      </div>
    </div>

    <!-- Filter Card -->
    <div class="filter-card">
      <div class="filter-grid">
        <div class="form-group">
          <label class="form-label" for="dailySearchInput">Cari Nama Karyawan</label>
          <input
            type="text"
            id="dailySearchInput"
            class="form-control"
            placeholder="Ketik nama karyawan..."
            value="${dailyFilter.search}"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="dailyDateInput">Filter Tanggal (Per Hari)</label>
          <div style="display: flex; gap: 6px;">
            <input
              type="date"
              id="dailyDateInput"
              class="form-control"
              value="${dailyFilter.date}"
            />
            <button class="btn btn-outline btn-sm" id="btnFilterToday" title="Pilih Hari Ini">Hari Ini</button>
            <button class="btn btn-outline btn-sm" id="btnFilterAllDates" title="Tampilkan Semua Tanggal">Semua</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="dailyRoleFilter">Filter Role</label>
          <select id="dailyRoleFilter" class="form-control">
            <option value="all" ${dailyFilter.role === 'all' ? 'selected' : ''}>Semua Role</option>
            <option value="${ROLES.KASIR}" ${dailyFilter.role === ROLES.KASIR ? 'selected' : ''}>Kasir</option>
            <option value="${ROLES.BARISTA}" ${dailyFilter.role === ROLES.BARISTA ? 'selected' : ''}>Barista</option>
            <option value="${ROLES.RACKER}" ${dailyFilter.role === ROLES.RACKER ? 'selected' : ''}>Racker</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="dailyStatusFilter">Filter Status Absensi</label>
          <select id="dailyStatusFilter" class="form-control">
            <option value="all" ${dailyFilter.status === 'all' ? 'selected' : ''}>Semua Status</option>
            <option value="Hadir" ${dailyFilter.status === 'Hadir' ? 'selected' : ''}>Hadir</option>
            <option value="Tidak Hadir" ${dailyFilter.status === 'Tidak Hadir' ? 'selected' : ''}>Tidak Hadir</option>
            <option value="Izin (Khusus)" ${dailyFilter.status === 'Izin (Khusus)' ? 'selected' : ''}>Izin (Khusus)</option>
            <option value="Izin (Pribadi)" ${dailyFilter.status === 'Izin (Pribadi)' ? 'selected' : ''}>Izin (Pribadi)</option>
            <option value="Sakit" ${dailyFilter.status === 'Sakit' ? 'selected' : ''}>Sakit</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table Section Box -->
    <div class="content-box">
      <div class="box-header">
        <div class="box-title">
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            Daftar Karyawan yang Sudah Absen
          </span>
          <span class="box-count">(${totalRecords} Data Ditemukan)</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline btn-sm" id="btnExportDailyCsv">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">No</th>
              <th style="width: 80px;">Foto</th>
              <th>Nama Karyawan</th>
              <th>Role</th>
              <th>Shift</th>
              <th>Waktu Upload Foto</th>
              <th>Status Absensi</th>
              <th>Keterangan</th>
              <th style="text-align: right; width: ${currentAuthRole === 'admin' ? '96px' : '56px'};">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${
              filtered.length === 0
                ? `
              <tr>
                <td colspan="9">
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <h3>Belum Ada Data Absensi</h3>
                    <p>Belum ada karyawan yang melakukan absensi pada kriteria filter ini.</p>
                    ${
                      currentAuthRole === 'karyawan'
                        ? `
                      <button class="btn btn-primary btn-sm" style="margin-top: 14px;" id="btnEmptyAdd">
                        + Tambahkan Absen Sekarang
                      </button>
                    `
                        : `
                      <button class="btn btn-primary btn-sm" style="margin-top: 14px;" id="btnEmptyAdminAdd">
                        + Tambahkan Absen Sekarang
                      </button>
                    `
                    }
                  </div>
                </td>
              </tr>
            `
                : filtered
                    .map((item, index) => {
                      const recordDate = new Date(item.timestamp);
                      const formattedDate = recordDate.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      const formattedTime = recordDate.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) + ' WIB';

                      const roleBadgeClass =
                        item.role === ROLES.KASIR
                          ? 'badge-role-kasir'
                          : item.role === ROLES.BARISTA
                          ? 'badge-role-barista'
                          : 'badge-role-racker';

                      let statusBadgeClass = 'badge-hadir';
                      let statusIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

                      if (item.status === 'Tidak Hadir') {
                        statusBadgeClass = 'badge-tidak-hadir';
                        statusIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
                      } else if (item.status.includes('Izin')) {
                        statusBadgeClass = 'badge-izin';
                        statusIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
                      } else if (item.status === 'Sakit') {
                        statusBadgeClass = 'badge-sakit';
                        statusIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
                      }

                      return `
                  <tr>
                    <td style="color: var(--text-muted); font-weight: 600;">${index + 1}</td>
                    <td>
                      <!-- Preview Kecil Foto / Placeholder Tanpa Foto -->
                      ${
                        item.photoData
                          ? `
                        <div class="photo-thumb-wrapper view-photo-btn" data-id="${item.id}" title="Klik untuk memperbesar preview foto">
                          <img src="${item.photoData}" class="photo-thumb" alt="${item.name}" loading="lazy" />
                          <div class="photo-zoom-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          </div>
                        </div>
                      `
                          : `
                        <div class="photo-thumb-wrapper" style="cursor: default; background: #f8fafc; display: flex; align-items: center; justify-content: center; border: 1px dashed #cbd5e1;" title="Tanpa Foto (Input Admin)">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                      `
                      }
                    </td>
                    <td>
                      <div class="emp-cell">
                        <span class="emp-name">${escapeHtml(item.name)}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${roleBadgeClass}">${item.role}</span>
                    </td>
                    <td>
                      <span style="font-weight: 600; color: var(--text-main); font-size: 0.85rem;">${item.shiftName || '-'}</span>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--text-main); font-size: 0.86rem;">${formattedTime}</div>
                      <div style="font-size: 0.74rem; color: var(--text-muted);">${formattedDate}</div>
                    </td>
                    <td>
                      <span class="badge ${statusBadgeClass}">
                        <span>${statusIconSvg}</span>
                        <span>${item.status}</span>
                      </span>
                    </td>
                    <td>
                      <div class="reason-text">${escapeHtml(item.reason || '-')}</div>
                    </td>
                    <td style="text-align: right;">
                      <div style="display: flex; justify-content: flex-end; gap: 6px;">
                        ${
                          item.photoData
                            ? `
                          <button class="btn btn-outline btn-sm view-photo-btn" data-id="${item.id}" title="Preview Foto">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          </button>
                        `
                            : ''
                        }
                        ${
                          currentAuthRole === 'admin'
                            ? `
                          <button class="btn btn-danger-outline btn-sm delete-record-btn" data-id="${item.id}" title="Hapus Data (Khusus Admin)">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        `
                            : ''
                        }
                      </div>
                    </td>
                  </tr>
                `;
                    })
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  bindDailyEvents();
}

/**
 * Halaman 2: Rekapitulasi Bulanan
 * Dengan Icon Minimalis Seragam 1 Warna
 */
function renderMonthlyPage(container) {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const monthlyRecords = currentRecords.filter(item => {
    const d = new Date(item.timestamp);
    return d.getMonth() === monthlyFilter.month && d.getFullYear() === monthlyFilter.year;
  });

  const employeeStatsMap = new Map();

  monthlyRecords.forEach(rec => {
    if (!employeeStatsMap.has(rec.name)) {
      employeeStatsMap.set(rec.name, {
        name: rec.name,
        role: rec.role,
        hadirCount: 0,
        izinKhususCount: 0,
        izinPribadiCount: 0,
        sakitCount: 0,
        tidakHadirCount: 0,
        latestPhoto: rec.photoData,
        latestDate: rec.timestamp
      });
    }

    const stat = employeeStatsMap.get(rec.name);
    if (rec.status === 'Hadir') {
      stat.hadirCount += 1;
    } else if (rec.status === 'Izin (Khusus)') {
      stat.izinKhususCount += 1;
    } else if (rec.status === 'Izin (Pribadi)') {
      stat.izinPribadiCount += 1;
    } else if (rec.status === 'Sakit') {
      stat.sakitCount += 1;
    } else if (rec.status === 'Tidak Hadir') {
      stat.tidakHadirCount += 1;
    } else {
      // Toleransi status varian izin lama
      if (rec.status.includes('Khusus')) {
        stat.izinKhususCount += 1;
      } else if (rec.status.includes('Pribadi')) {
        stat.izinPribadiCount += 1;
      } else if (rec.status.includes('Izin')) {
        stat.izinKhususCount += 1;
      } else {
        stat.tidakHadirCount += 1;
      }
    }

    if (new Date(rec.timestamp) >= new Date(stat.latestDate)) {
      stat.latestDate = rec.timestamp;
      stat.latestPhoto = rec.photoData;
      stat.role = rec.role;
    }
  });

  let recapList = Array.from(employeeStatsMap.values());

  if (monthlyFilter.role !== 'all') {
    recapList = recapList.filter(r => r.role === monthlyFilter.role);
  }
  if (monthlyFilter.search) {
    const q = monthlyFilter.search.toLowerCase();
    recapList = recapList.filter(r => r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q));
  }

  const totalMonthlyHadir = monthlyRecords.filter(r => r.status === 'Hadir').length;
  const totalMonthlyTidakHadir = monthlyRecords.filter(r => r.status === 'Tidak Hadir').length;
  const totalMonthlySubmissions = monthlyRecords.length;
  const overallAvgPresence =
    totalMonthlySubmissions > 0 ? Math.round((totalMonthlyHadir / totalMonthlySubmissions) * 100) : 0;

  const availableYears = [2026, 2025, 2024];

  container.innerHTML = `
    <!-- Top Stat Metrics Rekap: Icon Seragam Minimalis 1 Warna -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-label">Total Kehadiran Bulan Ini</div>
          <div class="stat-value" style="color: #059669;">${totalMonthlyHadir}</div>
          <div class="stat-sub">${monthNames[monthlyFilter.month]} ${monthlyFilter.year}</div>
        </div>
        <div class="stat-icon">
          <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-label">Tidak Hadir (Melewati Jam)</div>
          <div class="stat-value" style="color: #dc2626;">${totalMonthlyTidakHadir}</div>
          <div class="stat-sub">Lewat +2 jam awal masuk</div>
        </div>
        <div class="stat-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-label">Karyawan Terabsen</div>
          <div class="stat-value">${recapList.length}</div>
          <div class="stat-sub">Berdasarkan data riil masuk</div>
        </div>
        <div class="stat-icon">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-label">Rata-rata Presensi</div>
          <div class="stat-value">${overallAvgPresence}%</div>
          <div class="stat-sub">Tingkat kehadiran toko</div>
        </div>
        <div class="stat-icon">
          <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
      </div>
    </div>

    <!-- Filter Bar Rekap Bulanan & Tahun -->
    <div class="filter-card">
      <div class="filter-grid">
        <div class="form-group">
          <label class="form-label" for="monthlyMonthSelect">Pilih Bulan</label>
          <select id="monthlyMonthSelect" class="form-control">
            ${monthNames.map((m, idx) => `
              <option value="${idx}" ${idx === monthlyFilter.month ? 'selected' : ''}>${m}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="monthlyYearSelect">Pilih Tahun</label>
          <select id="monthlyYearSelect" class="form-control">
            ${availableYears.map(yr => `
              <option value="${yr}" ${yr === monthlyFilter.year ? 'selected' : ''}>${yr}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="monthlySearchInput">Cari Nama Karyawan</label>
          <input
            type="text"
            id="monthlySearchInput"
            class="form-control"
            placeholder="Cari nama karyawan..."
            value="${monthlyFilter.search}"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="monthlyRoleSelect">Filter Role</label>
          <select id="monthlyRoleSelect" class="form-control">
            <option value="all" ${monthlyFilter.role === 'all' ? 'selected' : ''}>Semua Role</option>
            <option value="${ROLES.KASIR}" ${monthlyFilter.role === ROLES.KASIR ? 'selected' : ''}>Kasir</option>
            <option value="${ROLES.BARISTA}" ${monthlyFilter.role === ROLES.BARISTA ? 'selected' : ''}>Barista</option>
            <option value="${ROLES.RACKER}" ${monthlyFilter.role === ROLES.RACKER ? 'selected' : ''}>Racker</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table Rekap Bulanan -->
    <div class="content-box">
      <div class="box-header">
        <div class="box-title">
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
            Rekapitulasi Presensi Karyawan: ${monthNames[monthlyFilter.month]} ${monthlyFilter.year}
          </span>
          <span class="box-count">(${recapList.length} Karyawan)</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline btn-sm" id="btnPrintRecap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Cetak / Print Rekap
          </button>
          <button class="btn btn-outline btn-sm" id="btnExportMonthlyCsv">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px;">No</th>
              <th style="width: 70px;">Avatar</th>
              <th>Nama Karyawan</th>
              <th>Role</th>
              <th style="background: #ecfdf5; color: #065f46; font-weight: 700;">Jumlah Hadir</th>
              <th style="background: #eff6ff; color: #1d4ed8; font-weight: 700;">Izin (Khusus)</th>
              <th style="background: #f0f9ff; color: #0284c7; font-weight: 700;">Izin (Pribadi)</th>
              <th style="background: #fffbeb; color: #b45309; font-weight: 700;">Sakit</th>
              <th style="color: #991b1b;">Jumlah Tidak Hadir</th>
              <th>Total Input Absen</th>
              <th style="width: 170px;">Persentase Kehadiran</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              recapList.length === 0
                ? `
              <tr>
                <td colspan="12">
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.7"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                    </div>
                    <h3>Belum Ada Data Rekap</h3>
                    <p>Belum ada rekaman absensi yang masuk pada bulan ${monthNames[monthlyFilter.month]} ${monthlyFilter.year}.</p>
                  </div>
                </td>
              </tr>
            `
                : recapList
                    .map((item, index) => {
                      const total =
                        item.hadirCount +
                        item.izinKhususCount +
                        item.izinPribadiCount +
                        item.sakitCount +
                        item.tidakHadirCount;
                      const percentage = total > 0 ? Math.round((item.hadirCount / total) * 100) : 0;

                      let progressClass = 'progress-green';
                      let evalBadge = '<span class="badge badge-hadir">Sangat Disiplin</span>';

                      if (total === 0) {
                        evalBadge = '<span class="badge" style="background: #f1f5f9; color: #64748b;">Belum Ada Absen</span>';
                      } else if (percentage < 50) {
                        progressClass = 'progress-red';
                        evalBadge = '<span class="badge badge-tidak-hadir">Perlu Evaluasi</span>';
                      } else if (percentage < 80) {
                        progressClass = 'progress-amber';
                        evalBadge = '<span class="badge" style="background: #fffbeb; color: #92400e; border: 1px solid #fde68a;">Cukup Baik</span>';
                      }

                      const roleBadgeClass =
                        item.role === ROLES.KASIR
                          ? 'badge-role-kasir'
                          : item.role === ROLES.BARISTA
                          ? 'badge-role-barista'
                          : 'badge-role-racker';

                      return `
                  <tr>
                    <td style="color: var(--text-muted); font-weight: 600;">${index + 1}</td>
                    <td>
                      <div class="photo-thumb-wrapper" style="cursor: default;">
                        <img
                          src="${item.latestPhoto || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23e2e8f0%22/></svg>'}"
                          class="photo-thumb"
                          alt="${item.name}"
                        />
                      </div>
                    </td>
                    <td>
                      <div class="emp-cell">
                        <span class="emp-name">${escapeHtml(item.name)}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${roleBadgeClass}">${item.role}</span>
                    </td>
                    <td style="background: #f0fdf4;">
                      <span style="font-size: 1.15rem; font-weight: 800; color: #059669;">
                        ${item.hadirCount}
                      </span>
                      <span style="font-size: 0.75rem; color: #15803d; font-weight: 600;"> Hari</span>
                    </td>
                    <td style="background: #eff6ff;">
                      <span style="font-size: 1.05rem; font-weight: 700; color: #1d4ed8;">
                        ${item.izinKhususCount}
                      </span>
                      <span style="font-size: 0.75rem; color: #2563eb; font-weight: 600;"> Hari</span>
                    </td>
                    <td style="background: #f0f9ff;">
                      <span style="font-size: 1.05rem; font-weight: 700; color: #0284c7;">
                        ${item.izinPribadiCount}
                      </span>
                      <span style="font-size: 0.75rem; color: #0369a1; font-weight: 600;"> Hari</span>
                    </td>
                    <td style="background: #fffbeb;">
                      <span style="font-size: 1.05rem; font-weight: 700; color: #b45309;">
                        ${item.sakitCount}
                      </span>
                      <span style="font-size: 0.75rem; color: #92400e; font-weight: 600;"> Hari</span>
                    </td>
                    <td>
                      <span style="font-size: 1.05rem; font-weight: 700; color: #dc2626;">
                        ${item.tidakHadirCount}
                      </span>
                      <span style="font-size: 0.75rem; color: #b91c1c;"> Hari</span>
                    </td>
                    <td>
                      <span style="font-weight: 600;">${total}</span> Kali
                    </td>
                    <td>
                      <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; margin-bottom: 2px;">
                        <span>${percentage}%</span>
                        <span style="color: var(--text-muted); font-size: 0.7rem;">${item.hadirCount}/${total}</span>
                      </div>
                      <div class="progress-bar-bg">
                        <div class="progress-bar-fill ${progressClass}" style="width: ${percentage}%;"></div>
                      </div>
                    </td>
                    <td>
                      ${evalBadge}
                    </td>
                  </tr>
                `;
                    })
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  bindMonthlyEvents();
}

/**
 * Event Listeners Inti Aplikasi
 */
function bindCoreEvents() {
  const tabDailyBtn = document.getElementById('tabDailyBtn');
  const tabMonthlyBtn = document.getElementById('tabMonthlyBtn');
  const btnLogoutBtn = document.getElementById('btnLogoutBtn');

  tabDailyBtn?.addEventListener('click', () => {
    currentTab = 'daily';
    renderApp();
  });

  tabMonthlyBtn?.addEventListener('click', () => {
    currentTab = 'monthly';
    renderApp();
  });

  // Tombol Logout / Ganti Akun
  btnLogoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem('grace_auth_role');
    currentAuthRole = null;
    showToast('Berhasil keluar dari akun.', 'success');
    renderLoginPage();
  });

  const btnOpenAddModal = document.getElementById('btnOpenAddModal');
  btnOpenAddModal?.addEventListener('click', openAddModal);

  const modalAddAttendance = document.getElementById('modalAddAttendance');
  const btnCloseAddModal = document.getElementById('btnCloseAddModal');
  const btnCancelAdd = document.getElementById('btnCancelAdd');

  const closeModal = () => {
    modalAddAttendance?.classList.remove('open');
    const video = document.getElementById('webcamVideo');
    if (video) stopCameraStream(video);
  };

  btnCloseAddModal?.addEventListener('click', closeModal);
  btnCancelAdd?.addEventListener('click', closeModal);

  const modalPhotoLightbox = document.getElementById('modalPhotoLightbox');
  const btnCloseLightbox = document.getElementById('btnCloseLightbox');
  const btnCloseLightboxBtn = document.getElementById('btnCloseLightboxBtn');

  const closeLightbox = () => {
    modalPhotoLightbox?.classList.remove('open');
  };

  btnCloseLightbox?.addEventListener('click', closeLightbox);
  btnCloseLightboxBtn?.addEventListener('click', closeLightbox);
  modalPhotoLightbox?.addEventListener('click', e => {
    if (e.target === modalPhotoLightbox) closeLightbox();
  });

  // Event Listeners Modal Ganti Password Admin
  const modalChangePassword = document.getElementById('modalChangePassword');
  const btnOpenChangePassword = document.getElementById('btnOpenChangePassword');
  const btnCloseChangePassword = document.getElementById('btnCloseChangePassword');
  const btnCancelChangePassword = document.getElementById('btnCancelChangePassword');
  const formChangePassword = document.getElementById('formChangePassword');
  const changePassAlert = document.getElementById('changePassAlert');
  const changePassAlertMsg = document.getElementById('changePassAlertMsg');

  const closeChangePassModal = () => {
    modalChangePassword?.classList.remove('open');
    if (formChangePassword) formChangePassword.reset();
    if (changePassAlert) changePassAlert.style.display = 'none';
  };

  btnOpenChangePassword?.addEventListener('click', () => {
    if (formChangePassword) formChangePassword.reset();
    if (changePassAlert) changePassAlert.style.display = 'none';
    modalChangePassword?.classList.add('open');
    setTimeout(() => {
      document.getElementById('currAdminPass')?.focus();
    }, 100);
  });

  btnCloseChangePassword?.addEventListener('click', closeChangePassModal);
  btnCancelChangePassword?.addEventListener('click', closeChangePassModal);
  modalChangePassword?.addEventListener('click', e => {
    if (e.target === modalChangePassword) closeChangePassModal();
  });

  formChangePassword?.addEventListener('submit', e => {
    e.preventDefault();
    const currPass = document.getElementById('currAdminPass')?.value || '';
    const newPass = document.getElementById('newAdminPass')?.value || '';
    const confirmPass = document.getElementById('confirmAdminPass')?.value || '';

    if (currPass !== getAdminPassword()) {
      if (changePassAlert && changePassAlertMsg) {
        changePassAlertMsg.textContent = 'Password saat ini tidak sesuai!';
        changePassAlert.style.display = 'flex';
      }
      return;
    }

    if (newPass.length < 4) {
      if (changePassAlert && changePassAlertMsg) {
        changePassAlertMsg.textContent = 'Password baru minimal 4 karakter!';
        changePassAlert.style.display = 'flex';
      }
      return;
    }

    if (newPass !== confirmPass) {
      if (changePassAlert && changePassAlertMsg) {
        changePassAlertMsg.textContent = 'Konfirmasi password baru tidak cocok!';
        changePassAlert.style.display = 'flex';
      }
      return;
    }

    setAdminPassword(newPass);
    closeChangePassModal();
    showToast('Password admin berhasil diubah!', 'success');
  });

  // Event Listeners Modal Tambah Absen Khusus Admin
  const modalAdminAddAttendance = document.getElementById('modalAdminAddAttendance');
  const btnOpenAdminAddModal = document.getElementById('btnOpenAdminAddModal');
  const btnEmptyAdminAdd = document.getElementById('btnEmptyAdminAdd');
  const btnCloseAdminAddModal = document.getElementById('btnCloseAdminAddModal');
  const btnCancelAdminAdd = document.getElementById('btnCancelAdminAdd');
  const adminAttendanceForm = document.getElementById('adminAttendanceForm');

  const closeAdminAddModal = () => {
    modalAdminAddAttendance?.classList.remove('open');
    if (adminAttendanceForm) adminAttendanceForm.reset();
  };

  const openAdminAddModal = () => {
    if (adminAttendanceForm) adminAttendanceForm.reset();
    modalAdminAddAttendance?.classList.add('open');
    setTimeout(() => {
      document.getElementById('adminEmpName')?.focus();
    }, 100);
  };

  btnOpenAdminAddModal?.addEventListener('click', openAdminAddModal);
  btnEmptyAdminAdd?.addEventListener('click', openAdminAddModal);
  btnCloseAdminAddModal?.addEventListener('click', closeAdminAddModal);
  btnCancelAdminAdd?.addEventListener('click', closeAdminAddModal);
  modalAdminAddAttendance?.addEventListener('click', e => {
    if (e.target === modalAdminAddAttendance) closeAdminAddModal();
  });

  adminAttendanceForm?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('adminEmpName')?.value.trim();
    const role = document.getElementById('adminEmpRole')?.value;
    const keteranganType = document.getElementById('adminKeteranganType')?.value || 'Izin (Khusus)';
    const notes = document.getElementById('adminNotes')?.value.trim();

    if (!name) {
      showToast('Harap masukkan nama karyawan!', 'danger');
      return;
    }

    const fullReason = notes ? `${keteranganType} (${notes})` : `Pencatatan ${keteranganType} oleh Admin`;

    addAttendanceRecord({
      name,
      role,
      shiftKey: '-',
      photoData: null,
      status: keteranganType,
      reason: fullReason
    });

    closeAdminAddModal();
    currentRecords = getAllRecords();
    renderCurrentTab();
    showToast(`Absensi ${name} (${keteranganType}) berhasil disimpan!`, 'success');
  });

  bindFormModalLogic();
}

/**
 * Event Listeners Khusus Form Modal Tambah Absen & Kamera
 */
function bindFormModalLogic() {
  const formEmpName = document.getElementById('formEmpName');
  const formRole = document.getElementById('formRole');
  const kasirShiftGroup = document.getElementById('kasirShiftGroup');
  const formKasirShift = document.getElementById('formKasirShift');

  const btnSnapPhoto = document.getElementById('btnSnapPhoto');
  const btnRetakePhoto = document.getElementById('btnRetakePhoto');

  const webcamVideo = document.getElementById('webcamVideo');
  const snapshotPreviewImg = document.getElementById('snapshotPreviewImg');
  const cameraViewfinder = document.getElementById('cameraViewfinder');
  const cameraLiveBadge = document.getElementById('cameraLiveBadge');

  const btnSubmitAttendance = document.getElementById('btnSubmitAttendance');

  formRole?.addEventListener('change', () => {
    const selectedRole = formRole.value;
    if (selectedRole === ROLES.KASIR) {
      if (kasirShiftGroup) kasirShiftGroup.style.display = 'block';
    } else {
      if (kasirShiftGroup) kasirShiftGroup.style.display = 'none';
    }
    updateFormPreview();
  });

  formKasirShift?.addEventListener('change', () => {
    updateFormPreview();
  });

  formEmpName?.addEventListener('input', updateFormPreview);

  // Update status absensi realtime dengan layout yang pas di dalam card
  function updateFormPreview() {
    const role = formRole?.value || ROLES.KASIR;
    const shiftKey = formKasirShift?.value || 'siang';
    const effectiveDate = formState.capturedPhoto ? formState.capturedTime : new Date();

    const evalResult = evaluateAttendance(role, shiftKey, effectiveDate);
    const badge = document.getElementById('predictedStatusBadge');
    const reasonText = document.getElementById('predictedReasonText');

    if (badge) {
      badge.textContent = evalResult.status;
      badge.className = `badge ${evalResult.status === 'Hadir' ? 'badge-hadir' : 'badge-tidak-hadir'}`;
    }

    if (reasonText) {
      reasonText.textContent = evalResult.reason || '-';
    }
  }

  // Tombol Ambil Foto
  btnSnapPhoto?.addEventListener('click', () => {
    if (!webcamVideo || webcamVideo.readyState < 2) {
      showToast('Kamera belum aktif. Silakan izinkan akses kamera pada perangkat.', 'danger');
      return;
    }

    const effectiveDate = new Date();
    const name = formEmpName?.value || 'Karyawan';

    const photoDataUrl = captureSnapshot(webcamVideo, effectiveDate, name);
    formState.capturedPhoto = photoDataUrl;
    formState.capturedTime = effectiveDate;

    if (snapshotPreviewImg) {
      snapshotPreviewImg.src = photoDataUrl;
      snapshotPreviewImg.style.display = 'block';
    }
    if (webcamVideo) webcamVideo.style.display = 'none';
    if (cameraViewfinder) cameraViewfinder.style.display = 'none';
    if (cameraLiveBadge) cameraLiveBadge.style.display = 'none';

    if (btnSnapPhoto) btnSnapPhoto.style.display = 'none';
    if (btnRetakePhoto) btnRetakePhoto.style.display = 'inline-flex';

    showToast('Foto berhasil diambil!', 'success');
    updateFormPreview();
  });

  // Tombol Foto Ulang
  btnRetakePhoto?.addEventListener('click', () => {
    formState.capturedPhoto = null;
    formState.capturedTime = new Date();

    if (snapshotPreviewImg) snapshotPreviewImg.style.display = 'none';
    if (webcamVideo) webcamVideo.style.display = 'block';
    if (cameraViewfinder) cameraViewfinder.style.display = 'block';
    if (cameraLiveBadge) cameraLiveBadge.style.display = 'flex';

    if (btnSnapPhoto) btnSnapPhoto.style.display = 'inline-flex';
    if (btnRetakePhoto) btnRetakePhoto.style.display = 'none';
    updateFormPreview();
  });


  // Submit Absensi
  btnSubmitAttendance?.addEventListener('click', () => {
    const name = formEmpName?.value.trim();
    if (!name) {
      showToast('Harap masukkan nama karyawan!', 'danger');
      formEmpName?.focus();
      return;
    }

    if (!formState.capturedPhoto) {
      if (webcamVideo && webcamVideo.readyState >= 2) {
        btnSnapPhoto?.click();
      } else {
        showToast('Harap ambil foto absensi terlebih dahulu!', 'danger');
        return;
      }
    }

    const role = formRole?.value || ROLES.KASIR;
    const shiftKey = role === ROLES.KASIR ? (formKasirShift?.value || 'siang') : 'default';
    const effectiveDate = formState.capturedTime || new Date();

    const newRecord = addAttendanceRecord({
      name,
      role,
      shiftKey,
      photoData: formState.capturedPhoto,
      customDate: effectiveDate
    });

    currentRecords = getAllRecords();

    const modalAddAttendance = document.getElementById('modalAddAttendance');
    modalAddAttendance?.classList.remove('open');
    if (webcamVideo) stopCameraStream(webcamVideo);

    const statusMsg =
      newRecord.status === 'Hadir'
        ? `Absensi ${newRecord.name} berhasil! Status: HADIR`
        : `Absensi ${newRecord.name} tersimpan. Status: TIDAK HADIR (${newRecord.reason})`;

    showToast(statusMsg, newRecord.status === 'Hadir' ? 'success' : 'danger');

    if (formEmpName) formEmpName.value = '';

    dailyFilter.date = newRecord.timestamp.split('T')[0];
    renderCurrentTab();
  });
}

/**
 * Buka Modal Tambah Absen dan Nyalakan Kamera
 */
async function openAddModal() {
  const modalAddAttendance = document.getElementById('modalAddAttendance');
  const webcamVideo = document.getElementById('webcamVideo');
  const snapshotPreviewImg = document.getElementById('snapshotPreviewImg');
  const cameraViewfinder = document.getElementById('cameraViewfinder');
  const cameraLiveBadge = document.getElementById('cameraLiveBadge');
  const btnSnapPhoto = document.getElementById('btnSnapPhoto');
  const btnRetakePhoto = document.getElementById('btnRetakePhoto');

  formState.capturedPhoto = null;
  formState.capturedTime = new Date();

  if (snapshotPreviewImg) snapshotPreviewImg.style.display = 'none';
  if (webcamVideo) webcamVideo.style.display = 'block';
  if (cameraViewfinder) cameraViewfinder.style.display = 'block';
  if (cameraLiveBadge) cameraLiveBadge.style.display = 'flex';

  if (btnSnapPhoto) btnSnapPhoto.style.display = 'inline-flex';
  if (btnRetakePhoto) btnRetakePhoto.style.display = 'none';

  modalAddAttendance?.classList.add('open');

  const formRole = document.getElementById('formRole');
  const formKasirShift = document.getElementById('formKasirShift');
  const evalResult = evaluateAttendance(formRole?.value || ROLES.KASIR, formKasirShift?.value || 'siang', new Date());
  const badge = document.getElementById('predictedStatusBadge');
  const reasonText = document.getElementById('predictedReasonText');

  if (badge) {
    badge.textContent = evalResult.status;
    badge.className = `badge ${evalResult.status === 'Hadir' ? 'badge-hadir' : 'badge-tidak-hadir'}`;
  }
  if (reasonText) {
    reasonText.textContent = evalResult.reason || '-';
  }

  if (webcamVideo) {
    try {
      await startCameraStream(webcamVideo);
    } catch (err) {
      console.warn('Tidak dapat membuka kamera web secara otomatis:', err);
      showToast(
        'Izin kamera tidak aktif atau perangkat kamera tidak terdeteksi. Anda tetap dapat menggunakan tombol "Upload File".',
        'danger'
      );
    }
  }
}

/**
 * Event Listeners untuk Filter Harian dan Aksi Baris Tabel
 */
function bindDailyEvents() {
  const searchInput = document.getElementById('dailySearchInput');
  const dateInput = document.getElementById('dailyDateInput');
  const roleFilter = document.getElementById('dailyRoleFilter');
  const statusFilter = document.getElementById('dailyStatusFilter');
  const btnFilterToday = document.getElementById('btnFilterToday');
  const btnFilterAllDates = document.getElementById('btnFilterAllDates');
  const btnExportDailyCsv = document.getElementById('btnExportDailyCsv');
  const btnEmptyAdd = document.getElementById('btnEmptyAdd');

  searchInput?.addEventListener('input', e => {
    dailyFilter.search = e.target.value;
    renderCurrentTab();
  });

  dateInput?.addEventListener('change', e => {
    dailyFilter.date = e.target.value;
    renderCurrentTab();
  });

  roleFilter?.addEventListener('change', e => {
    dailyFilter.role = e.target.value;
    renderCurrentTab();
  });

  statusFilter?.addEventListener('change', e => {
    dailyFilter.status = e.target.value;
    renderCurrentTab();
  });

  btnFilterToday?.addEventListener('click', () => {
    dailyFilter.date = todayStr;
    renderCurrentTab();
  });

  btnFilterAllDates?.addEventListener('click', () => {
    dailyFilter.date = '';
    renderCurrentTab();
  });

  btnEmptyAdd?.addEventListener('click', openAddModal);

  btnExportDailyCsv?.addEventListener('click', () => {
    exportToCsv(
      currentRecords.filter(r => (!dailyFilter.date || r.timestamp.startsWith(dailyFilter.date))),
      `Presensi_Balole_Biliard_${dailyFilter.date || 'Semua'}.csv`
    );
  });

  document.querySelectorAll('.view-photo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = currentRecords.find(r => r.id === id);
      if (item) openPhotoLightbox(item);
    });
  });

  if (currentAuthRole === 'admin') {
    document.querySelectorAll('.delete-record-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = currentRecords.find(r => r.id === id);
        if (confirm(`Hapus data absensi atas nama "${item?.name}"?`)) {
          currentRecords = deleteAttendanceRecord(id);
          showToast('Data absensi berhasil dihapus!', 'success');
          renderCurrentTab();
        }
      });
    });
  }
}

/**
 * Event Listeners untuk Filter Halaman Rekapitulasi Bulanan
 */
function bindMonthlyEvents() {
  const monthSelect = document.getElementById('monthlyMonthSelect');
  const yearSelect = document.getElementById('monthlyYearSelect');
  const searchInput = document.getElementById('monthlySearchInput');
  const roleSelect = document.getElementById('monthlyRoleSelect');
  const btnPrintRecap = document.getElementById('btnPrintRecap');
  const btnExportMonthlyCsv = document.getElementById('btnExportMonthlyCsv');

  monthSelect?.addEventListener('change', e => {
    monthlyFilter.month = parseInt(e.target.value, 10);
    renderCurrentTab();
  });

  yearSelect?.addEventListener('change', e => {
    monthlyFilter.year = parseInt(e.target.value, 10);
    renderCurrentTab();
  });

  searchInput?.addEventListener('input', e => {
    monthlyFilter.search = e.target.value;
    renderCurrentTab();
  });

  roleSelect?.addEventListener('change', e => {
    monthlyFilter.role = e.target.value;
    renderCurrentTab();
  });

  btnPrintRecap?.addEventListener('click', () => {
    window.print();
  });

  btnExportMonthlyCsv?.addEventListener('click', () => {
    const monthlyRecords = currentRecords.filter(item => {
      const d = new Date(item.timestamp);
      return d.getMonth() === monthlyFilter.month && d.getFullYear() === monthlyFilter.year;
    });

    const recapMap = new Map();
    monthlyRecords.forEach(r => {
      if (!recapMap.has(r.name)) {
        recapMap.set(r.name, {
          name: r.name,
          role: r.role,
          hadir: 0,
          izinKhusus: 0,
          izinPribadi: 0,
          sakit: 0,
          tidakHadir: 0
        });
      }
      const item = recapMap.get(r.name);
      if (r.status === 'Hadir') item.hadir += 1;
      else if (r.status === 'Izin (Khusus)') item.izinKhusus += 1;
      else if (r.status === 'Izin (Pribadi)') item.izinPribadi += 1;
      else if (r.status === 'Sakit') item.sakit += 1;
      else if (r.status === 'Tidak Hadir') item.tidakHadir += 1;
      else {
        if (r.status.includes('Khusus')) item.izinKhusus += 1;
        else if (r.status.includes('Pribadi')) item.izinPribadi += 1;
        else if (r.status.includes('Izin')) item.izinKhusus += 1;
        else item.tidakHadir += 1;
      }
    });

    const csvRows = [
      ['No', 'Nama Karyawan', 'Role', 'Jumlah Hadir', 'Izin (Khusus)', 'Izin (Pribadi)', 'Sakit', 'Jumlah Tidak Hadir', 'Total Absen', 'Persentase Hadir']
    ];

    let idx = 1;
    recapMap.forEach(row => {
      const tot = row.hadir + row.izinKhusus + row.izinPribadi + row.sakit + row.tidakHadir;
      const pct = tot > 0 ? Math.round((row.hadir / tot) * 100) + '%' : '0%';
      csvRows.push([idx++, row.name, row.role, row.hadir, row.izinKhusus, row.izinPribadi, row.sakit, row.tidakHadir, tot, pct]);
    });

    downloadCsvFile(csvRows, `Rekap_Bulanan_Balole_Biliard_${monthlyFilter.month + 1}_${monthlyFilter.year}.csv`);
  });
}

/**
 * Buka Lightbox Modal Preview Foto Karyawan
 */
function openPhotoLightbox(record) {
  const modal = document.getElementById('modalPhotoLightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbName = document.getElementById('lbEmpName');
  const lbRoleBadge = document.getElementById('lbRoleBadge');
  const lbStatusBadge = document.getElementById('lbStatusBadge');
  const lbCaptureTime = document.getElementById('lbCaptureTime');
  const lbShiftName = document.getElementById('lbShiftName');
  const lbToleranceNote = document.getElementById('lbToleranceNote');
  const lbStatusDesc = document.getElementById('lbStatusDesc');
  const lbReasonText = document.getElementById('lbReasonText');

  if (!modal) return;

  const dateObj = new Date(record.timestamp);
  const timeFormatted = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ' • ' + dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' WIB';

  if (lbImg) lbImg.src = record.photoData;
  if (lbName) lbName.textContent = record.name;

  if (lbRoleBadge) {
    lbRoleBadge.textContent = record.role;
    lbRoleBadge.className = `badge ${
      record.role === ROLES.KASIR
        ? 'badge-role-kasir'
        : record.role === ROLES.BARISTA
        ? 'badge-role-barista'
        : 'badge-role-racker'
    }`;
  }

  if (lbStatusBadge) {
    lbStatusBadge.textContent = record.status;
    lbStatusBadge.className = `badge ${record.status === 'Hadir' ? 'badge-hadir' : 'badge-tidak-hadir'}`;
  }

  if (lbCaptureTime) lbCaptureTime.textContent = timeFormatted;
  if (lbShiftName) lbShiftName.textContent = record.shiftName || 'Shift';
  if (lbToleranceNote) lbToleranceNote.textContent = 'Maksimal +2 Jam Awal Masuk';
  if (lbStatusDesc) {
    lbStatusDesc.textContent = record.status === 'Hadir' ? 'Diterima (Hadir)' : 'Ditolak (Tidak Hadir)';
    lbStatusDesc.style.color = record.status === 'Hadir' ? '#059669' : '#dc2626';
  }
  if (lbReasonText) lbReasonText.textContent = record.reason || '-';

  modal.classList.add('open');
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${
      type === 'success'
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    }</span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Helper Export CSV
 */
function exportToCsv(records, filename) {
  const headers = ['No', 'Nama Karyawan', 'Role', 'Shift', 'Status', 'Tanggal Upload', 'Waktu Upload', 'Keterangan'];
  const rows = [headers];

  records.forEach((r, i) => {
    const d = new Date(r.timestamp);
    const dateStr = d.toLocaleDateString('id-ID');
    const timeStr = d.toLocaleTimeString('id-ID');
    rows.push([
      i + 1,
      r.name,
      r.role,
      r.shiftName || '',
      r.status,
      dateStr,
      timeStr,
      r.reason || ''
    ]);
  });

  downloadCsvFile(rows, filename);
}

function downloadCsvFile(rows, filename) {
  const csvContent = rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  initAppView();
});
