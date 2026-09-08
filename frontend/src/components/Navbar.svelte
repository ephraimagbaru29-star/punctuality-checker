<script>
  import { currentUser, isAdmin, logout } from '../stores/auth';
  import { navigate } from '../lib/navigate.js';

  export let role = 'student'; // 'admin' | 'student'

  let menuOpen = false;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = role === 'admin'
    ? [
        { href: '/admin/dashboard',  label: 'Dashboard' },
        { href: '/admin/students',   label: 'Students' },
        { href: '/admin/attendance', label: 'Attendance' },
        { href: '/admin/qr',         label: 'QR Codes' },
        { href: '/admin/requests',   label: 'Requests' },
      ]
    : [
        { href: '/student/dashboard', label: 'Dashboard' },
        { href: '/student/history',   label: 'History' },
      ];
</script>

<nav class="navbar">
  <div class="navbar-inner">
    <a href="{role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}" class="brand">
      <div class="brand-icon">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="11" stroke="currentColor" stroke-width="2.5"/>
          <path d="M16 8v8l5 3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <span>Punctuality Checker</span>
    </a>

    <div class="nav-links desktop-only">
      {#each navLinks as link}
        <a href={link.href} class="nav-link">{link.label}</a>
      {/each}
    </div>

    <div class="nav-right">
      <span class="user-name desktop-only">{$currentUser?.name || $currentUser?.full_name || ''}</span>
      <button class="btn btn-ghost btn-sm" on:click={handleLogout}>Logout</button>
      <button class="hamburger" on:click={() => menuOpen = !menuOpen} aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>

  {#if menuOpen}
    <div class="mobile-menu">
      {#each navLinks as link}
        <a href={link.href} class="mobile-link" on:click={() => menuOpen = false}>{link.label}</a>
      {/each}
      <button class="btn btn-ghost btn-sm mobile-logout" on:click={handleLogout}>Logout</button>
    </div>
  {/if}
</nav>

<style>
  .navbar {
    background: var(--primary);
    box-shadow: var(--shadow);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .navbar-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    height: 64px;
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--white);
    font-weight: 700;
    font-size: var(--fs-base);
    text-decoration: none;
    white-space: nowrap;
  }
  .brand-icon {
    background: var(--accent);
    border-radius: var(--radius);
    width: 36px; height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }
  .nav-links {
    display: flex;
    gap: 4px;
    flex: 1;
  }
  .nav-link {
    color: rgba(255,255,255,.7);
    padding: 6px 12px;
    border-radius: var(--radius);
    font-size: var(--fs-sm);
    font-weight: 500;
    transition: all var(--transition);
    text-decoration: none;
  }
  .nav-link:hover { color: var(--white); background: rgba(255,255,255,.1); }
  .nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
  }
  .user-name {
    color: rgba(255,255,255,.7);
    font-size: var(--fs-sm);
  }
  .hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
  }
  .hamburger span {
    display: block;
    width: 22px; height: 2px;
    background: var(--white);
    border-radius: 2px;
  }
  .desktop-only { display: flex; }
  .mobile-menu {
    display: none;
    flex-direction: column;
    background: var(--primary-light);
    padding: 12px 20px;
    border-top: 1px solid rgba(255,255,255,.08);
  }
  .mobile-link {
    color: rgba(255,255,255,.8);
    padding: 10px 0;
    font-size: var(--fs-sm);
    font-weight: 500;
    border-bottom: 1px solid rgba(255,255,255,.06);
    text-decoration: none;
  }
  .mobile-logout { margin-top: 12px; color: var(--white); border-color: rgba(255,255,255,.3); }

  @media (max-width: 768px) {
    .desktop-only { display: none !important; }
    .hamburger { display: flex; }
    .mobile-menu { display: flex; }
    .navbar-inner { gap: 12px; }
  }
</style>
