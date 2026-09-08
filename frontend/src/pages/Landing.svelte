<script>
  import { onMount } from 'svelte';
  import { navigate } from '../lib/navigate';
  import { authStore } from '../stores/auth';

  onMount(() => {
    const auth = $authStore;
    if (auth?.user?.role === 'admin')        navigate('/admin/dashboard');
    else if (auth?.user?.role === 'student') navigate('/student/dashboard');
  });
</script>

<div class="landing">
  <div class="hero">
    <div class="hero-icon">
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="11" stroke="white" stroke-width="2"/>
        <path d="M16 8v8l5 3" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
    <h1>Punctuality Checker</h1>
    <p>A smart, secure clock-in system for students.</p>
    <div class="cta-group">
      <a href="/login" class="btn btn-primary btn-lg">Student Login</a>
      <a href="/admin/login" class="btn btn-secondary btn-lg">Admin Login</a>
    </div>
  </div>

  <div class="features">
    <div class="feature">
      <div class="feature-icon">🔐</div>
      <h3>Device Locked</h3>
      <p>Your account is tied to your device for security.</p>
    </div>
    <div class="feature">
      <div class="feature-icon">📍</div>
      <h3>Location Tracked</h3>
      <p>Clock-in records your location automatically.</p>
    </div>
    <div class="feature">
      <div class="feature-icon">📋</div>
      <h3>QR Registration</h3>
      <p>Scan the admin QR code to register instantly.</p>
    </div>
    <div class="feature">
      <div class="feature-icon">⏰</div>
      <h3>Auto Clock-Out</h3>
      <p>Missed clock-out? System handles it at 5:30 PM.</p>
    </div>
  </div>
</div>

<style>
  .landing {
    min-height: 100vh;
    background: var(--primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }
  .hero {
    text-align: center;
    margin-bottom: 60px;
    max-width: 560px;
  }
  .hero-icon {
    background: var(--accent);
    width: 96px; height: 96px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 0 40px rgba(233,69,96,.4);
  }
  .hero h1 {
    color: var(--white);
    font-size: clamp(2rem, 5vw, 2.8rem);
    margin-bottom: 12px;
  }
  .hero p {
    color: rgba(255,255,255,.6);
    font-size: var(--fs-lg);
    margin-bottom: 36px;
  }
  .cta-group {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .btn-secondary {
    border-color: rgba(255,255,255,.4);
    color: white;
  }
  .btn-secondary:hover {
    background: rgba(255,255,255,.1);
    color: white;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    max-width: 860px;
    width: 100%;
  }
  .feature {
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: var(--radius-lg);
    padding: 24px;
    text-align: center;
  }
  .feature-icon { font-size: 2rem; margin-bottom: 12px; }
  .feature h3 { color: var(--white); font-size: var(--fs-base); margin-bottom: 8px; }
  .feature p  { color: rgba(255,255,255,.5); font-size: var(--fs-sm); }
</style>
