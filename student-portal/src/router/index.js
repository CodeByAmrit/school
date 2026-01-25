import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

// Lazy load views
const Login = () => import('../views/Login.vue');
const Dashboard = () => import('../views/Dashboard.vue');
const Profile = () => import('../views/Profile.vue');
const Results = () => import('../views/Results.vue');
const Documents = () => import('../views/Documents.vue');
const Settings = () => import('../views/Settings.vue');
const ChangePassword = () => import('../views/ChangePassword.vue');
const NotFound = () => import('../views/NotFound.vue');

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: ChangePassword,
    meta: { requiresAuth: true } // Technically they are logged in (have token), but restricted
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/results',
    name: 'Results',
    component: Results,
    meta: { requiresAuth: true }
  },
  {
    path: '/documents',
    name: 'Documents',
    component: Documents,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHistory(), // Uses HTML5 history mode
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.guest && isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
