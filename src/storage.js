/**
 * storage.js
 * Manajemen Data Absensi Murni (Tanpa Data Contoh/Dummy)
 */
import { evaluateAttendance } from './rules.js';

// Kunci penyimpanan khusus data riil absensi
const STORAGE_KEY = 'grace_absensi_records_real';

// Bersihkan data contoh lama dari browser jika ada
try {
  localStorage.removeItem('grace_absensi_records_v1');
  localStorage.removeItem('grace_absensi_records_v2');
} catch (e) {}

/**
 * Ambil semua data absensi riil
 */
export function getAllRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Tambah rekaman absensi baru dari form upload/kamera
 */
export function addAttendanceRecord({ name, role, shiftKey, photoData, customDate }) {
  const records = getAllRecords();
  const dateObj = customDate ? new Date(customDate) : new Date();

  const evalResult = evaluateAttendance(role, shiftKey, dateObj);

  const newRecord = {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    role,
    shiftKey: evalResult.shiftKey,
    shiftName: evalResult.shiftName,
    timestamp: dateObj.toISOString(),
    photoData,
    status: evalResult.status,
    reason: evalResult.reason
  };

  records.unshift(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return newRecord;
}

/**
 * Hapus satu rekaman absensi
 */
export function deleteAttendanceRecord(id) {
  const records = getAllRecords().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return records;
}

/**
 * Kosongkan semua data absensi
 */
export function clearAllRecords() {
  localStorage.removeItem(STORAGE_KEY);
  return [];
}

const ADMIN_PASSWORD_KEY = 'balole_admin_password_v1';

/**
 * Mengambil password admin (default: 'admin123')
 */
export function getAdminPassword() {
  try {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || 'admin123';
  } catch (e) {
    return 'admin123';
  }
}

/**
 * Mengubah password admin
 */
export function setAdminPassword(newPassword) {
  localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
  return true;
}

