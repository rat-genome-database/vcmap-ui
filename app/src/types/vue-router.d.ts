import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    // must be declared by every route
    title: string
  }
}