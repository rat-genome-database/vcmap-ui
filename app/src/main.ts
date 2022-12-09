// PrimeVue and PrimeFlex styles (must be imported before any components!)
import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.min.css';

import { createApp } from 'vue';
import App from './App.vue';
import { createLogger } from 'vue-logger-plugin';
import router from './router';
import store, { key } from './store';
import { ExternalComponentsHandler } from './utils/ExternalComponentsHandler';

const app = createApp(App)
  .use(createLogger({
    enabled: true,
    level: 'debug',
  }))
  .use(store, key)
  .use(router);

ExternalComponentsHandler.registerAll(app);

app.mount('#app');
