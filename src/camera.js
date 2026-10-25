/**
 * camera.js
 * Webcam Streamer, Canvas Snapshot, dan Watermark
 */

let activeStream = null;

/**
 * Membuka kamera streamer
 * @param {HTMLVideoElement} videoElement
 * @returns {Promise<boolean>}
 */
export async function startCameraStream(videoElement) {
  // Matikan stream lama jika ada
  stopCameraStream(videoElement);

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser Anda tidak mendukung Web MediaDevices Camera.');
    }

    const constraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    };

    activeStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = activeStream;
    await videoElement.play();
    return true;
  } catch (err) {
    console.error('Error saat menyalakan kamera:', err);
    throw err;
  }
}

/**
 * Menghentikan stream kamera
 * @param {HTMLVideoElement} videoElement
 */
export function stopCameraStream(videoElement) {
  if (activeStream) {
    activeStream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch (e) {}
    });
    activeStream = null;
  }
  if (videoElement) {
    videoElement.srcObject = null;
  }
}

/**
 * Mengambil foto dari video stream dan menambahkan cap waktu (watermark)
 * @param {HTMLVideoElement} videoElement
 * @param {Date} captureTime
 * @param {string} employeeName
 * @returns {string} base64 dataURL (image/jpeg)
 */
export function captureSnapshot(videoElement, captureTime = new Date(), employeeName = '') {
  const canvas = document.createElement('canvas');
  const width = videoElement.videoWidth || 640;
  const height = videoElement.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  // Gambar video ke canvas (mirroring horizontal agar natural seperti cermin selfie)
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoElement, 0, 0, width, height);
  ctx.restore();

  // Tambahkan strip watermark di bagian bawah foto
  const barHeight = Math.max(38, Math.round(height * 0.1));
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(0, height - barHeight, width, barHeight);

  // Garis aksen hijau/biru di atas bar watermark
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, height - barHeight, width, 3);

  // Teks waktu & watermark
  const formattedDate = captureTime.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = captureTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' WIB';

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${Math.max(12, Math.round(barHeight * 0.35))}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  
  const textLeft = employeeName ? `${employeeName} • Balole Biliard` : `Balole Biliard Sport & Cafe`;
  ctx.fillText(textLeft, 14, height - barHeight / 2 + 1);

  ctx.textAlign = 'right';
  ctx.fillText(`${formattedDate} • ${formattedTime}`, width - 14, height - barHeight / 2 + 1);

  return canvas.toDataURL('image/jpeg', 0.88);
}
