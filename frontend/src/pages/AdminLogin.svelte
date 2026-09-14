<script>
  import { navigate } from '../lib/navigate';
  import { authApi } from '../lib/api';
  import { login, authStore } from '../stores/auth';
  import { onMount } from 'svelte';

  let email = '', password = '', error = '', loading = false;

  onMount(() => {
    if ($authStore?.user?.role === 'admin') navigate('/admin/dashboard');
  });

  const handleLogin = async () => {
    if (!email || !password) { error = 'Please fill in all fields.'; return; }
    error = ''; loading = true;
    try {
      const result = await authApi.adminLogin({ email, password });
      if (!result || !result.token) {
        error = 'Login failed. Please try again.';
        loading = false;
        return;
      }
      login(result.token, result.user);
      window.location.href = '/admin/dashboard';
    } catch (e) {
      error = e.message || 'Login failed. Please try again.';
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
        <p>Admin Portal</p>
      </div>
    </div>

    <h2>Welcome back</h2>
    <p class="subtitle">Sign in to your admin account</p>

    {#if error}
      <div class="alert alert-error">{error}</div>
    {/if}

    <div class="form-group">
      <label class="form-label" for="email">Email Address</label>
      <input id="email" class="form-control" type="email" placeholder="admin@example.com"
        bind:value={email} on:keydown={handleKey} />
    </div>
    <div class="form-group">
      <label class="form-label" for="password">Password</label>
      <input id="password" class="form-control" type="password" placeholder="Enter password"
        bind:value={password} on:keydown={handleKey} />
    </div>

    <button class="btn btn-primary btn-full btn-lg" on:click={handleLogin} disabled={loading}>
      {#if loading}<span class="spinner"></span>{:else}Sign In{/if}
    </button>

    <p class="switch-link">Student? <a href="/login">Login here</a></p>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary) 0%, #0f3460 100%);
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
  .switch-link { text-align: center; margin-top: 20px; font-size: var(--fs-sm); color: var(--gray-500); }
</style>
