<script>
  import { currentPath } from './lib/router.js';

  import Landing          from './pages/Landing.svelte';
  import AdminLogin       from './pages/AdminLogin.svelte';
  import StudentLogin     from './pages/StudentLogin.svelte';
  import Register         from './pages/Register.svelte';
  import DeviceReset      from './pages/DeviceReset.svelte';
  import AdminDashboard   from './pages/admin/Dashboard.svelte';
  import AdminStudents    from './pages/admin/Students.svelte';
  import AdminAttendance  from './pages/admin/Attendance.svelte';
  import AdminQR          from './pages/admin/QRCodes.svelte';
  import AdminRequests    from './pages/admin/Requests.svelte';
  import StudentDashboard from './pages/student/Dashboard.svelte';
  import StudentHistory   from './pages/student/History.svelte';

  $: path = $currentPath.split('?')[0];
</script>

{#if path === '/'}
  <Landing />
{:else if path === '/admin/login'}
  <AdminLogin />
{:else if path === '/login'}
  <StudentLogin />
{:else if path === '/register'}
  <Register />
{:else if path === '/device-reset'}
  <DeviceReset />
{:else if path === '/admin/dashboard'}
  <AdminDashboard />
{:else if path === '/admin/students'}
  <AdminStudents />
{:else if path === '/admin/attendance'}
  <AdminAttendance />
{:else if path === '/admin/qr'}
  <AdminQR />
{:else if path === '/admin/requests'}
  <AdminRequests />
{:else if path === '/student/dashboard'}
  <StudentDashboard />
{:else if path === '/student/history'}
  <StudentHistory />
{:else}
  <Landing />
{/if}
