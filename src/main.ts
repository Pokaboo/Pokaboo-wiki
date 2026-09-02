import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

// Local hosted Inter Variable font (no external CDN dependency)
import '@fontsource-variable/inter';

// Import ByteMD CSS
import 'bytemd/dist/index.css';

// Import RemixIcon
import 'remixicon/fonts/remixicon.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount('#app');
