<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import jsQR from 'jsqr';

  const dispatch = createEventDispatcher();

  let videoEl;
  let canvasEl;
  let stream = null;
  let scanning = false;
  let error = '';
  let animFrame;

  onMount(async () => {
    await startCamera();
  });

  onDestroy(() => {
    stopCamera();
  });

  const startCamera = async () => {
    error = '';
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // use back camera on phones
      });
      videoEl.srcObject = stream;
      await videoEl.play();
      scanning = true;
      scanFrame();
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        error = 'Camera access denied. Please allow camera access and try again.';
      } else if (e.name === 'NotFoundError') {
        error = 'No camera found on this device.';
      } else {
        error = 'Could not access camera: ' + e.message;
      }
    }
  };

  const stopCamera = () => {
    scanning = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  };

  const scanFrame = () => {
    if (!scanning) return;

    if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
      const ctx = canvasEl.getContext('2d');
      canvasEl.width  = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code) {
        // QR code found — extract token from URL
        const url = code.data;
        try {
          const urlObj = new URL(url);
          const token = urlObj.searchParams.get('token');
          if (token) {
            stopCamera();
            dispatch('scanned', { token, url });
            return;
          } else {
            error = 'QR code found but no registration token detected. Use the admin-generated QR code.';
          }
        } catch {
          error = 'Invalid QR code. Please scan the Punctuality Checker registration QR code.';
        }
      }
    }

    animFrame = requestAnimationFrame(scanFrame);
  };

  const close = () => {
    stopCamera();
    dispatch('close');
  };
</script>

<div class="scanner-overlay">
  <div class="scanner-box">
    <div class="scanner-header">
      <h3>Scan QR Code</h3>
      <button class="close-btn" on:click={close}>✕</button>
    </div>

    {#if error}
      <div class="scanner-error">
        <p>⚠️ {error}</p>
        <button class="btn btn-primary btn-sm" on:click={startCamera}>Try Again</button>
      </div>
    {:else}
      <div class="video-wrap">
        <!-- svelte-ignore a11y-media-has-caption -->
        <video bind:this={videoEl} class="camera-feed" playsinline></video>
        <canvas bind:this={canvasEl} class="scan-canvas"></canvas>
        <div class="scan-frame">
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>
        </div>
        <p class="scan-hint">Point your camera at the admin's QR code</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .scanner-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    animation: fadeIn .2s ease;
  }
  .scanner-box {
    background: var(--white);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 420px;
    overflow: hidden;
    box-shadow: var(--shadow-xl);
    animation: slideUp .2s ease;
  }
  .scanner-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: var(--primary);
    color: white;
  }
  .scanner-header h3 { margin: 0; font-size: var(--fs-base); color: white; }
  .close-btn {
    background: none; border: none;
    color: rgba(255,255,255,.7);
    font-size: 18px; cursor: pointer;
    padding: 0; line-height: 1;
  }
  .close-btn:hover { color: white; }

  .video-wrap {
    position: relative;
    background: #000;
  }
  .camera-feed {
    width: 100%;
    display: block;
    max-height: 380px;
    object-fit: cover;
  }
  .scan-canvas {
    display: none; /* hidden — used only for processing */
  }
  .scan-frame {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .corner {
    position: absolute;
    width: 28px; height: 28px;
    border-color: var(--accent);
    border-style: solid;
  }
  .tl { top: 30px; left: 30px;  border-width: 4px 0 0 4px; border-radius: 4px 0 0 0; }
  .tr { top: 30px; right: 30px; border-width: 4px 4px 0 0; border-radius: 0 4px 0 0; }
  .bl { bottom: 50px; left: 30px;  border-width: 0 0 4px 4px; border-radius: 0 0 0 4px; }
  .br { bottom: 50px; right: 30px; border-width: 0 4px 4px 0; border-radius: 0 0 4px 0; }

  .scan-hint {
    position: absolute;
    bottom: 14px;
    left: 0; right: 0;
    text-align: center;
    color: rgba(255,255,255,.8);
    font-size: var(--fs-xs);
    font-weight: 500;
    text-shadow: 0 1px 3px rgba(0,0,0,.5);
  }

  .scanner-error {
    padding: 32px 24px;
    text-align: center;
  }
  .scanner-error p {
    color: var(--danger);
    font-size: var(--fs-sm);
    margin-bottom: 16px;
  }
</style>
