/**
 * rules.js
 * Aturan Shift dan Validasi Status Absensi (Hadir / Tidak Hadir)
 * 
 * Aturan baru:
 * Toleransi hanya berlaku maksimal +2 jam dari jam awal masuk shift.
 * Melewati +2 jam dari jam awal masuk -> TIDAK HADIR.
 * Contoh: Jam 11 masuk, jika jam 1 (13:00) lewat sudah tidak hadir.
 */

export const ROLES = {
  KASIR: 'Kasir',
  BARISTA: 'Barista',
  RACKER: 'Racker'
};

export const SHIFT_DEFINITIONS = {
  [ROLES.KASIR]: {
    siang: {
      label: 'Shift Siang',
      startHour: 11.0,      // Jam 11:00
      maxLateHour: 13.0,    // Jam 13:00 (Jam 1 siang = 11:00 + 2 jam)
      earliestAllowed: 7.0, // Bisa absen mulai jam 07:00 pagi
      toleranceNote: 'Batas maks. jam 13:00'
    },
    malam: {
      label: 'Shift Malam',
      startHour: 18.0,      // Jam 18:00 (6 PM)
      maxLateHour: 20.0,    // Jam 20:00 (8 PM = 18:00 + 2 jam)
      earliestAllowed: 15.0,// Bisa absen mulai jam 15:00
      toleranceNote: 'Batas maks. jam 20:00'
    }
  },
  [ROLES.BARISTA]: {
    default: {
      label: 'Shift Barista',
      startHour: 13.0,      // Jam 13:00 (1 PM)
      maxLateHour: 15.0,    // Jam 15:00 (3 PM = 13:00 + 2 jam)
      earliestAllowed: 9.0, // Bisa absen mulai jam 09:00
      toleranceNote: 'Batas maks. jam 15:00'
    }
  },
  [ROLES.RACKER]: {
    default: {
      label: 'Shift Racker',
      startHour: 18.0,      // Jam 18:00 (6 PM)
      maxLateHour: 20.0,    // Jam 20:00 (8 PM = 18:00 + 2 jam)
      earliestAllowed: 15.0,// Bisa absen mulai jam 15:00
      toleranceNote: 'Batas maks. jam 20:00'
    }
  }
};

/**
 * Validasi status kehadiran berdasarkan Role, Shift, dan Waktu Foto Upload
 * @param {string} role - 'Kasir' | 'Barista' | 'Racker'
 * @param {string} shiftKey - 'siang' | 'malam' (untuk Kasir) atau 'default'
 * @param {Date|string} timeInput - Waktu foto diambil
 * @returns {Object} status, isPresent, reason, shiftName
 */
export function evaluateAttendance(role, shiftKey, timeInput) {
  const dateObj = timeInput instanceof Date ? timeInput : new Date(timeInput);
  const hour = dateObj.getHours();
  const minute = dateObj.getMinutes();
  const decimalTime = hour + minute / 60;

  const formattedTime = dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  let shiftConfig;
  let effectiveShiftKey = shiftKey;

  if (role === ROLES.KASIR) {
    effectiveShiftKey = shiftKey === 'malam' ? 'malam' : 'siang';
    shiftConfig = SHIFT_DEFINITIONS[ROLES.KASIR][effectiveShiftKey];
  } else if (role === ROLES.BARISTA) {
    effectiveShiftKey = 'default';
    shiftConfig = SHIFT_DEFINITIONS[ROLES.BARISTA].default;
  } else if (role === ROLES.RACKER) {
    effectiveShiftKey = 'default';
    shiftConfig = SHIFT_DEFINITIONS[ROLES.RACKER].default;
  } else {
    return {
      status: 'Tidak Hadir',
      isPresent: false,
      reason: 'Role tidak dikenal',
      shiftName: 'Tidak Diketahui'
    };
  }

  let isPresent = false;
  let reason = '';

  if (role === ROLES.KASIR && effectiveShiftKey === 'siang') {
    // Shift Siang: Masuk jam 11:00, batas toleransi jam 13:00 (jam 1 siang)
    if (decimalTime >= shiftConfig.earliestAllowed && decimalTime <= shiftConfig.maxLateHour) {
      isPresent = true;
      if (decimalTime <= shiftConfig.startHour + 0.25) {
        reason = `Tepat Waktu (Hadir sebelum jam 11:15)`;
      } else {
        reason = `Hadir (Dalam toleransi keterlambatan maks. jam 13:00)`;
      }
    } else if (decimalTime > shiftConfig.maxLateHour) {
      isPresent = false;
      reason = `Tidak Hadir: Jam upload (${formattedTime}) lewat dari batas toleransi jam 13:00 (+2 jam awal masuk)`;
    } else {
      isPresent = false;
      reason = `Tidak Hadir: Foto diupload di luar jam operasional shift siang`;
    }
  } else if (role === ROLES.KASIR && effectiveShiftKey === 'malam') {
    // Shift Malam: Masuk jam 18:00, batas toleransi jam 20:00 (jam 8 malam)
    if (decimalTime >= shiftConfig.earliestAllowed && decimalTime <= shiftConfig.maxLateHour) {
      isPresent = true;
      if (decimalTime <= shiftConfig.startHour + 0.25) {
        reason = `Tepat Waktu (Hadir sebelum jam 18:15)`;
      } else {
        reason = `Hadir (Dalam toleransi keterlambatan maks. jam 20:00)`;
      }
    } else if (decimalTime > shiftConfig.maxLateHour || decimalTime < shiftConfig.earliestAllowed) {
      isPresent = false;
      reason = `Tidak Hadir: Jam upload (${formattedTime}) lewat dari batas toleransi jam 20:00 (+2 jam awal masuk)`;
    }
  } else if (role === ROLES.BARISTA) {
    // Shift Barista: Masuk jam 13:00, batas toleransi jam 15:00
    if (decimalTime >= shiftConfig.earliestAllowed && decimalTime <= shiftConfig.maxLateHour) {
      isPresent = true;
      if (decimalTime <= shiftConfig.startHour + 0.25) {
        reason = `Tepat Waktu (Hadir sebelum jam 13:15)`;
      } else {
        reason = `Hadir (Dalam toleransi keterlambatan maks. jam 15:00)`;
      }
    } else {
      isPresent = false;
      reason = `Tidak Hadir: Jam upload (${formattedTime}) lewat dari batas toleransi jam 15:00 (+2 jam awal masuk)`;
    }
  } else if (role === ROLES.RACKER) {
    // Shift Racker: Masuk jam 18:00, batas toleransi jam 20:00
    if (decimalTime >= shiftConfig.earliestAllowed && decimalTime <= shiftConfig.maxLateHour) {
      isPresent = true;
      if (decimalTime <= shiftConfig.startHour + 0.25) {
        reason = `Tepat Waktu (Hadir sebelum jam 18:15)`;
      } else {
        reason = `Hadir (Dalam toleransi keterlambatan maks. jam 20:00)`;
      }
    } else {
      isPresent = false;
      reason = `Tidak Hadir: Jam upload (${formattedTime}) lewat dari batas toleransi jam 20:00 (+2 jam awal masuk)`;
    }
  }

  return {
    status: isPresent ? 'Hadir' : 'Tidak Hadir',
    isPresent,
    reason,
    shiftName: shiftConfig.label,
    toleranceNote: shiftConfig.toleranceNote,
    shiftKey: effectiveShiftKey
  };
}
