<script>
  import { navigate } from '../lib/navigate';
  import { authApi } from '../lib/api';
  import { login, authStore } from '../stores/auth';
  import { getDeviceFingerprint } from '../lib/fingerprint';
  import { onMount } from 'svelte';

  let clockInId = '', password = '', error = '', loading = false;
  let showDeviceMismatch = false;

  onMount(() => {
    if ($authStore?.user?.role === 'student') navigate('/student/dashboard');
  });

  const handleLogin = async () => {
    if (!clockInId || !password) { error = 'Please fill in all fields.'; return; }
    error = ''; loading = true;
    try {
      const device_fingerprint = await getDeviceFingerprint();
      const result = await authApi.studentLogin({
        clock_in_id: clockInId.trim().toUpperCase(),
        password,
        device_fingerprint
      });
      if (!result || !result.token) {
        error = 'Login failed. Please try again.';
        loading = false;
        return;
      }
      login(result.token, result.user);
      window.location.href = '/student/dashboard';
    } catch (e) {
      if (e.message?.includes('Device not recognized') || e.message?.includes('device_mismatch')) {
        showDeviceMismatch = true;
      } else {
        error = e.message || 'Login failed. Please try again.';
      }
    }
    loading = false;
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleLogin(); };
</script>

<div class="auth-page">
  <div class="auth-card">
    <div class="auth-logo">
      <div class="logo-icon">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="11" stroke="white" stroke-width="2.5"/>
          <path d="M16 8v8l5 3" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <h1>Punctuality Checker</h1>
        <p>Student Portal</p>
      </div>
    </div>

    {#if showDeviceMismatch}
      <div class="device-mismatch">
        <div class="mismatch-icon">🔒</div>
        <h3>Device Not Recognized</h3>
        <p>This account is locked to a different device. If you lost your device or are using a new one, request a device reset from admin.</p>
        <a href="/student/dashboard" class="btn btn-primary btn-full mt-4"
           on:click|preventDefault={() => { showDeviceMismatch = false; navigate('/student/dashboard'); }}>
          Go to Dashboard to Request Reset
        </a>
        <button class="btn btn-ghost btn-full mt-2" on:click={() => showDeviceMismatch = false}>
          Back to Login
        </button>
      </div>
    {:else}
      <h2>Welcome back</h2>
      <p class="subtitle">Enter your Clock-In ID and password</p>

      {#if error}
        <div class="alert alert-error">{error}</div>
      {/if}

      <div class="form-group">
        <label class="form-label" for="cid">Clock-In ID</label>
        <input id="cid" class="form-control" type="text" placeholder="e.g. PC-4F2A8B — check your approval email or ask admin"
          bind:value={clockInId} on:keydown={handleKey}
          style="text-transform:uppercase; letter-spacing:.08em; font-weight:600;" />
        <p style="font-size:var(--fs-xs);color:var(--gray-400);margin-top:4px;">
          ⚠️ This is your unique Clock-In ID (starts with PC-), not your email address.
        </p>
      </div>
      <div class="form-group">
        <label class="form-label" for="pwd">Password</label>
        <input id="pwd" class="form-control" type="password" placeholder="Enter password"
          bind:value={password} on:keydown={handleKey} />
      </div>

      <button class="btn btn-primary btn-full btn-lg" on:click={handleLogin} disabled={loading}>
        {#if loading}<span class="spinner"></span>{:else}Sign In{/if}
      </button>

      <p class="switch-link">Don't have an account? <a href="/register">Register with QR code</a></p>
      <p class="switch-link">Admin? <a href="/admin/login">Login here</a></p>
    {/if}
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f3460 0%, var(--primary) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .auth-card {
    background: var(--white);
    border-radius: var(--radius-xl);
    padding: 40px;
    width: 100%;
    max-width: 440px;
    box-shadow: var(--shadow-xl);
    animation: slideUp .3s ease;
  }
  .auth-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
  }
  .logo-icon {
    background: var(--accent);
    width: 52px; height: 52px;
    border-radius: var(--radius-lg);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .auth-logo h1 { font-size: var(--fs-base); margin: 0; color: var(--primary); }
  .auth-logo p  { font-size: var(--fs-xs); color: var(--accent); font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: .05em; }
  h2 { font-size: var(--fs-2xl); margin-bottom: 4px; }
  .subtitle { color: var(--gray-500); font-size: var(--fs-sm); margin-bottom: 28px; }
  .switch-link { text-align: center; margin-top: 12px; font-size: var(--fs-sm); color: var(--gray-500); }

  .device-mismatch { text-align: center; }
  .mismatch-icon { font-size: 3rem; margin-bottom: 12px; }
  .device-mismatch h3 { color: var(--danger); margin-bottom: 12px; }
  .device-mismatch p  { color: var(--gray-600); font-size: var(--fs-sm); line-height: 1.6; }
</style>
