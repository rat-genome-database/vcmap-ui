import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Main from '../views/Main.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/main',
    name: 'Main',
    component: Main
  },
  {
    path: '/',
    name: 'Configuration',
    // route level code-splitting
    // this generates a separate chunk (configuration.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "configuration" */ '../views/Configuration.vue')
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
