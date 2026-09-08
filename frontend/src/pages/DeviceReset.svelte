<script>
  import { onMount } from 'svelte';
  import { navigate } from '../lib/navigate';
  import { deviceApi } from '../lib/api';
  import { getDeviceFingerprint } from '../lib/fingerprint';

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  let step = 'processing'; // processing | success | error
  let message = '';
  let studentEmail = '';

  onMount(async () => {
    if (!token) { step = 'error'; message = 'No reset token found in the link.'; return; }
    try {
      const fingerprint = await getDeviceFingerprint();
      const data = await deviceApi.executeReset({
        reset_token: token,
        device_fingerprint: fingerprint
      });
      studentEmail = data.student_email;
      step = 'success';
    } catch (e) {
      step = 'error';
      message = e.message || 'Device reset failed.';
    }
  });
</script>

<div class="page">
  <div class="card-wrap">
    <div class="logo">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="11" stroke="white" stroke-width="2.5"/>
        <path d="M16 8v8l5 3" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
    <h2>Punctuality Checker</h2>

    {#if step === 'processing'}
      <div class="state">
        <div class="spinner" style="width:48px;height:48px;border-width:4px;"></div>
        <p>Resetting your device, please wait…</p>
      </div>

    {:else if step === 'success'}
      <div class="state success">
        <div class="icon">✅</div>
        <h3>Device Reset Successful</h3>
        <p>This device is now registered to your account. You can log in with your Clock-In ID and password.</p>
        <a href="/login" class="btn btn-primary btn-lg mt-6" style="display:inline-flex;">Go to Login</a>
      </div>

    {:else}
      <div class="state error">
        <div class="icon">❌</div>
        <h3>Reset Failed</h3>
        <p>{message}</p>
        <a href="/login" class="btn btn-ghost mt-6" style="display:inline-flex;">Back to Login</a>
      </div>
    {/if}
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary) 0%, #0f3460 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .card-wrap {
    background: var(--white);
    border-radius: var(--radius-xl);
    padding: 48px 40px;
    max-width: 420px;
    width: 100%;
    text-align: center;
    box-shadow: var(--shadow-xl);
    animation: slideUp .3s ease;
  }
  .logo {
    background: var(--accent);
    width: 64px; height: 64px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  h2 { font-size: var(--fs-xl); margin-bottom: 32px; color: var(--primary); }
  .state { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .icon { font-size: 3.5rem; }
  h3 { font-size: var(--fs-xl); color: var(--primary); }
  p { color: var(--gray-600); font-size: var(--fs-sm); line-height: 1.6; max-width: 300px; }
</style>
