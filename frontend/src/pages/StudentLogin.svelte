<script>
  import { navigate } from '../lib/navigate';
  import { authApi, deviceApi } from '../lib/api';
  import { login, authStore } from '../stores/auth';
  import { getDeviceFingerprint } from '../lib/fingerprint';
  import { onMount } from 'svelte';
  import QRScanner from '../components/QRScanner.svelte';

  let clockInId = '', password = '', error = '', loading = false;
  let showDeviceMismatch = false;
  let showScanner = false;

  // Device reset form
  let showResetForm = false;
  let resetClockInId = '', resetEmail = '', resetReason = '';
  let resetLoading = false, resetMsg = '', resetError = '';

  onMount(() => {
    if ($authStore?.user?.role === 'student') navigate('/student/dashboard');
  });

  const handleLogin = async () => {
    if (!clockInId || !password) { error = 'Please fill in all fields.'; return; }

    const idPattern = /^PC-[A-Z0-9]{6}$/;
    if (!idPattern.test(clockInId.trim().toUpperCase())) {
      error = 'Invalid Clock-In ID. It must be in the format PC-XXXXXX (e.g. PC-4F2A8B).';
      return;
    }

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

  const handleScanned = (e) => {
    showScanner = false;
    const { token } = e.detail;
    window.location.href = `/register?token=${token}`;
  };

  const openResetForm = () => {
    showResetForm = true;
    showDeviceMismatch = false;
    resetClockInId = clockInId || '';
    resetEmail = '';
    resetReason = '';
    resetMsg = '';
    resetError = '';
  };

  const submitResetRequest = async () => {
    if (!resetClockInId || !resetEmail || !resetReason) {
      resetError = 'Please fill in all fields.';
      return;
    }
    resetLoading = true; resetError = ''; resetMsg = '';
    try {
      const result = await deviceApi.requestResetPublic({
        clock_in_id: resetClockInId.trim().toUpperCase(),
        email: resetEmail.trim(),
        reason: resetReason
      });
      resetMsg = result.message;
    } catch (e) {
      resetError = e.message || 'Request failed. Please try again.';
    }
    resetLoading = false;
  };
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

    <!-- ── DEVICE RESET FORM ── -->
    {#if showResetForm}
      <h2>Request Device Reset</h2>
      <p class="subtitle">Fill in your details and admin will send a reset link to your email.</p>

      {#if resetMsg}
        <div class="alert alert-success">{resetMsg}</div>
        <button class="btn btn-ghost btn-full mt-4" on:click={() => { showResetForm = false; }}>
          Back to Login
        </button>
      {:else}
        {#if resetError}
          <div class="alert alert-error">{resetError}</div>
        {/if}

        <div class="form-group">
          <label class="form-label" for="rid">Clock-In ID</label>
          <input id="rid" class="form-control" type="text" placeholder="e.g. PC-4F2A8B"
            bind:value={resetClockInId}
            style="text-transform:uppercase; letter-spacing:.08em; font-weight:600;" />
        </div>
        <div class="form-group">
          <label class="form-label" for="remail">Email Address</label>
          <input id="remail" class="form-control" type="email" placeholder="your@email.com"
            bind:value={resetEmail} />
        </div>
        <div class="form-group">
          <label class="form-label" for="rreason">Reason for Reset</label>
          <textarea id="rreason" class="form-control" rows="3"
            placeholder="e.g. I got a new phone / My device was stolen..."
            bind:value={resetReason}></textarea>
        </div>

        <button class="btn btn-primary btn-full btn-lg" on:click={submitResetRequest} disabled={resetLoading}>
          {#if resetLoading}<span class="spinner"></span>{:else}Submit Reset Request{/if}
        </button>
        <button class="btn btn-ghost btn-full mt-2" on:click={() => showResetForm = false}>
          Back to Login
        </button>
      {/if}

    <!-- ── DEVICE MISMATCH ── -->
    {:else if showDeviceMismatch}
      <div class="device-mismatch">
        <div class="mismatch-icon">🔒</div>
        <h3>Device Not Recognized</h3>
        <p>This account is locked to a different device. Request a reset and admin will send a link to your email to unlock your account.</p>
        <button class="btn btn-primary btn-full mt-4" on:click={openResetForm}>
          Request Device Reset
        </button>
        <button class="btn btn-ghost btn-full mt-2" on:click={() => showDeviceMismatch = false}>
          Back to Login
        </button>
      </div>

    <!-- ── NORMAL LOGIN ── -->
    {:else}
      <h2>Welcome back</h2>
      <p class="subtitle">Enter your Clock-In ID and password</p>

      {#if error}
        <div class="alert alert-error">{error}</div>
      {/if}

      <div class="form-group">
        <label class="form-label" for="cid">Clock-In ID</label>
        <input id="cid" class="form-control" type="text" placeholder="e.g. PC-4F2A8B"
          bind:value={clockInId} on:keydown={handleKey}
          style="text-transform:uppercase; letter-spacing:.08em; font-weight:600;" />
        <p style="font-size:var(--fs-xs);color:var(--gray-400);margin-top:4px;">
          Your unique ID starting with PC- (given after admin approval)
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

      <!-- QR Scan button -->
      <button class="btn btn-secondary btn-full mt-4" on:click={() => showScanner = true}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/>
        </svg>
        Register with QR Code
      </button>

      <!-- Device Reset link -->
      <p class="reset-link">
        Changed device? <button class="link-btn" on:click={openResetForm}>Request Device Reset</button>
      </p>

      <p class="switch-link">Admin? <a href="/admin/login">Login here</a></p>
    {/if}
  </div>
</div>

<!-- QR Scanner Modal -->
{#if showScanner}
  <QRScanner
    on:scanned={handleScanned}
    on:close={() => showScanner = false}
  />
{/if}

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

  .reset-link {
    text-align: center;
    margin-top: 12px;
    font-size: var(--fs-sm);
    color: var(--gray-500);
  }
  .link-btn {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    font-size: var(--fs-sm);
    font-family: var(--font);
    padding: 0;
    text-decoration: underline;
  }
  .link-btn:hover { color: var(--accent-dark); }

  .device-mismatch { text-align: center; padding: 8px 0; }
  .mismatch-icon { font-size: 3rem; margin-bottom: 12px; }
  .device-mismatch h3 { color: var(--danger); margin-bottom: 12px; }
  .device-mismatch p  { color: var(--gray-600); font-size: var(--fs-sm); line-height: 1.6; }

  textarea.form-control { resize: vertical; min-height: 80px; }
</style>
