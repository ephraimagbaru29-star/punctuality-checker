<script>
  import { onMount } from 'svelte';
  import { navigate } from '../lib/navigate';
  import { authApi, qrApi } from '../lib/api';
  import { getDeviceFingerprint } from '../lib/fingerprint';

  // Parse QR token from URL
  const params = new URLSearchParams(window.location.search);
  const qrToken = params.get('token') || '';

  let step = 'validating'; // validating | form | success | invalid
  let qrLabel = '';
  let error = '';
  let loading = false;

  let fullName = '', email = '', phone = '', password = '', confirmPassword = '';
  let profileFile = null;
  let profilePreview = '';

  onMount(async () => {
    if (!qrToken) { 
      error = 'No QR token found in the URL. Please scan the QR code again.';
      step = 'invalid'; 
      return; 
    }
    try {
      const data = await qrApi.validate(qrToken);
      if (data.valid) {
        qrLabel = data.label || 'Registration';
        step = 'form';
      } else {
        error = data.error || 'Invalid QR code.';
        step = 'invalid';
      }
    } catch(e) {
      error = e.message || 'Could not validate QR code. Make sure the backend is running.';
      step = 'invalid';
    }
  });

  const handleFileChange = (e) => {
    profileFile = e.target.files[0];
    if (profileFile) {
      const reader = new FileReader();
      reader.onload = (ev) => profilePreview = ev.target.result;
      reader.readAsDataURL(profileFile);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password) { error = 'Please fill in all required fields.'; return; }
    if (password !== confirmPassword) { error = 'Passwords do not match.'; return; }
    if (password.length < 6) { error = 'Password must be at least 6 characters.'; return; }
    error = ''; loading = true;

    try {
      // Upload profile picture if provided (base64 for now — backend can store in Supabase Storage)
      let profilePicture = null;
      if (profileFile) {
        profilePicture = profilePreview; // Pass as base64; backend handles Supabase Storage upload
      }

      const data = await authApi.studentRegister({
        full_name: fullName,
        email,
        phone,
        password,
        qr_token: qrToken,
        profile_picture: profilePicture,
        device_fingerprint: await getDeviceFingerprint()
      });

      step = 'success';
    } catch (e) {
      error = e.message;
    }
    loading = false;
  };
</script>

<div class="reg-page">
  <div class="reg-card">
    <div class="auth-logo">
      <div class="logo-icon">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="11" stroke="white" stroke-width="2.5"/>
          <path d="M16 8v8l5 3" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <h1>Punctuality Checker</h1>
        <p>Student Registration</p>
      </div>
    </div>

    {#if step === 'validating'}
      <div class="flex-center" style="padding: 40px 0;">
        <div class="spinner" style="width:36px;height:36px;border-width:4px;"></div>
      </div>

    {:else if step === 'invalid'}
      <div class="invalid-qr">
        <div style="font-size:3rem;">❌</div>
        <h3>Invalid QR Code</h3>
        <p>{error || 'This registration link is invalid, expired, or has been deactivated. Please get a new QR code from your admin.'}</p>
        <a href="/login" class="btn btn-ghost btn-full mt-4">Back to Login</a>
      </div>

    {:else if step === 'success'}
      <div class="success-screen">
        <div class="success-icon">✅</div>
        <h2>Registration Complete!</h2>
        <p>Your account is <strong>pending approval</strong> from the admin. You'll be notified once approved.</p>
        <p class="mt-4 text-muted" style="font-size:var(--fs-sm);">Once approved, use your <strong>Clock-In ID</strong> (sent via notification) and your password to log in.</p>
        <a href="/login" class="btn btn-primary btn-full mt-6">Go to Login</a>
      </div>

    {:else}
      <h2>Create Your Account</h2>
      <p class="subtitle">Registering for: <strong>{qrLabel}</strong></p>

      {#if error}
        <div class="alert alert-error">{error}</div>
      {/if}

      <!-- Profile picture -->
      <div class="profile-upload">
        <label for="pic" class="profile-label" title="Click to upload photo">
          {#if profilePreview}
            <img src={profilePreview} alt="Preview" class="profile-img" />
          {:else}
            <div class="profile-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <span>Add Photo</span>
            </div>
          {/if}
        </label>
        <input id="pic" type="file" accept="image/*" on:change={handleFileChange} style="display:none" />
      </div>

      <div class="form-group">
        <label class="form-label" for="fn">Full Name <span class="text-accent">*</span></label>
        <input id="fn" class="form-control" type="text" placeholder="John Doe" bind:value={fullName} />
      </div>
      <div class="form-group">
        <label class="form-label" for="em">Email Address <span class="text-accent">*</span></label>
        <input id="em" class="form-control" type="email" placeholder="john@example.com" bind:value={email} />
      </div>
      <div class="form-group">
        <label class="form-label" for="ph">Phone Number</label>
        <input id="ph" class="form-control" type="tel" placeholder="+1 234 567 8900" bind:value={phone} />
      </div>
      <div class="form-group">
        <label class="form-label" for="pw">Password <span class="text-accent">*</span></label>
        <input id="pw" class="form-control" type="password" placeholder="Min. 6 characters" bind:value={password} />
      </div>
      <div class="form-group">
        <label class="form-label" for="cpw">Confirm Password <span class="text-accent">*</span></label>
        <input id="cpw" class="form-control" type="password" placeholder="Repeat password" bind:value={confirmPassword} />
      </div>

      <button class="btn btn-primary btn-full btn-lg" on:click={handleRegister} disabled={loading}>
        {#if loading}<span class="spinner"></span>{:else}Register{/if}
      </button>

      <p class="switch-link">Already registered? <a href="/login">Login</a></p>
    {/if}
  </div>
</div>

<style>
  .reg-page {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary) 0%, #0f3460 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px 20px;
  }
  .reg-card {
    background: var(--white);
    border-radius: var(--radius-xl);
    padding: 40px;
    width: 100%;
    max-width: 480px;
    box-shadow: var(--shadow-xl);
    animation: slideUp .3s ease;
  }
  .auth-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }
  .logo-icon {
    background: var(--accent);
    width: 52px; height: 52px;
    border-radius: var(--radius-lg);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .auth-logo h1 { font-size: var(--fs-base); margin: 0; }
  .auth-logo p  { font-size: var(--fs-xs); color: var(--accent); font-weight: 600; margin: 0; text-transform: uppercase; }
  h2 { font-size: var(--fs-2xl); margin-bottom: 4px; }
  .subtitle { color: var(--gray-500); font-size: var(--fs-sm); margin-bottom: 20px; }
  .switch-link { text-align: center; margin-top: 14px; font-size: var(--fs-sm); color: var(--gray-500); }

  .profile-upload { display: flex; justify-content: center; margin-bottom: 20px; }
  .profile-label { cursor: pointer; }
  .profile-img {
    width: 90px; height: 90px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--accent);
  }
  .profile-placeholder {
    width: 90px; height: 90px;
    border-radius: 50%;
    border: 2px dashed var(--gray-300);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: var(--gray-400);
    font-size: var(--fs-xs);
    gap: 4px;
    transition: border-color var(--transition);
  }
  .profile-placeholder:hover { border-color: var(--accent); color: var(--accent); }

  .invalid-qr, .success-screen { text-align: center; padding: 16px 0; }
  .invalid-qr h3, .success-screen h2 { margin: 12px 0 8px; }
  .invalid-qr p, .success-screen p { color: var(--gray-600); font-size: var(--fs-sm); line-height: 1.6; }
  .success-icon { font-size: 3rem; margin-bottom: 8px; }
</style>
