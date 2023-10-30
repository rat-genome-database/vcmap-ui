import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Main from '../views/Main.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/main',
    name: 'Main',
    component: Main,
    meta: {
      title: 'VCMap | Viewer',
    },
  },
  {
    path: '/',
    name: 'Configuration',
    // route level code-splitting
    // this generates a separate chunk (configuration.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "configuration" */ '../views/Configuration.vue'),
    meta: {
      title: 'VCMap | Configuration',
    },
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  
  next();
});

export default router;
