<script>
  import { onMount, onDestroy } from 'svelte';
  import { studentApi } from '../lib/api';

  let unread = 0;
  let notifications = [];
  let open = false;
  let loading = false;
  let interval;

  const loadUnread = async () => {
    try {
      const data = await studentApi.unreadCount();
      unread = data.unread;
    } catch {}
  };

  const loadNotifications = async () => {
    loading = true;
    try {
      const data = await studentApi.notifications();
      notifications = data.notifications;
    } catch {}
    loading = false;
  };

  const toggle = async () => {
    open = !open;
    if (open) {
      await loadNotifications();
      // mark all read after viewing
      if (unread > 0) {
        await studentApi.markAllRead();
        unread = 0;
      }
    }
  };

  const typeIcon = (type) => {
    if (type === 'warning')  return '⚠️';
    if (type === 'reminder') return '⏰';
    if (type === 'system')   return '✅';
    return 'ℹ️';
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString();
  };

  onMount(() => {
    loadUnread();
    interval = setInterval(loadUnread, 30000); // poll every 30s
  });
  onDestroy(() => clearInterval(interval));
</script>

<div class="bell-wrap">
  <button class="bell-btn" on:click={toggle} aria-label="Notifications">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {#if unread > 0}
      <span class="badge-dot">{unread > 9 ? '9+' : unread}</span>
    {/if}
  </button>

  {#if open}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="backdrop" on:click={() => open = false}></div>
    <div class="dropdown">
      <div class="dropdown-header">
        <span>Notifications</span>
        <button class="close-btn" on:click={() => open = false}>✕</button>
      </div>

      {#if loading}
        <div class="empty">Loading…</div>
      {:else if notifications.length === 0}
        <div class="empty">No notifications</div>
      {:else}
        <div class="notif-list">
          {#each notifications as n}
            <div class="notif-item {n.is_read ? 'read' : 'unread'}">
              <span class="notif-icon">{typeIcon(n.type)}</span>
              <div class="notif-body">
                <p class="notif-msg">{n.message}</p>
                <p class="notif-time">{formatTime(n.created_at)}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .bell-wrap { position: relative; }
  .bell-btn {
    position: relative;
    background: rgba(255,255,255,.1);
    border: none;
    border-radius: var(--radius);
    width: 38px; height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--white);
    transition: background var(--transition);
  }
  .bell-btn:hover { background: rgba(255,255,255,.18); }
  .badge-dot {
    position: absolute;
    top: 3px; right: 3px;
    background: var(--accent);
    color: white;
    font-size: 10px;
    font-weight: 700;
    border-radius: var(--radius-full);
    min-width: 16px; height: 16px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 3px;
  }
  .backdrop {
    position: fixed; inset: 0; z-index: 200;
  }
  .dropdown {
    position: absolute;
    top: 48px; right: 0;
    width: 320px;
    background: var(--white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    z-index: 300;
    overflow: hidden;
    animation: slideUp .15s ease;
  }
  .dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: var(--primary);
    color: white;
    font-weight: 600;
    font-size: var(--fs-sm);
  }
  .close-btn {
    background: none; border: none;
    color: rgba(255,255,255,.7);
    cursor: pointer; font-size: 14px;
  }
  .empty {
    padding: 24px;
    text-align: center;
    color: var(--gray-400);
    font-size: var(--fs-sm);
  }
  .notif-list { max-height: 360px; overflow-y: auto; }
  .notif-item {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--gray-100);
  }
  .notif-item.unread { background: #fff5f6; }
  .notif-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
  .notif-body { flex: 1; }
  .notif-msg  { font-size: var(--fs-xs); color: var(--gray-700); line-height: 1.5; }
  .notif-time { font-size: 11px; color: var(--gray-400); margin-top: 4px; }

  @media (max-width: 400px) {
    .dropdown { width: 290px; right: -40px; }
  }
</style>
