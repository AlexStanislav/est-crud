/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import { createApp } from 'vue';
import App from './App.vue';
import PrimeVue from 'primevue/config';
import router from './router';
import { createPinia } from 'pinia';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import './index.css';
import 'primevue/resources/themes/aura-dark-blue/theme.css';
import 'primeicons/primeicons.css'
import { useAppStore } from './store/app.store';
const pinia = createPinia();
const app = createApp(App);

window.electronAPI.onBikeScraped((bike) => {
  const appStore = useAppStore()
  appStore.addToScrapeLog(`Informatii preluate pentru: ${bike}`)
})

window.electronAPI.onTableScraped((table) => {
  const appStore = useAppStore()
  appStore.addToScrapeLog(`Tabel creat pentru: ${table}`)
})

window.electronAPI.onDataInserted((data) => {
  const appStore = useAppStore()
  appStore.addToScrapeLog(`Informatii inserate in tabel: ${data}`)
})

window.electronAPI.onDataScraped(() => {
  const appStore = useAppStore()
  appStore.addToScrapeLog(`Informatii extrase`)
})

window.electronAPI.onScrapeError((data) => {
  const appStore = useAppStore()
  appStore.addToScrapeLog(`Eroare: ${data}`)  
})

app.use(PrimeVue);
app.use(pinia);
app.use(router);
app.use(ConfirmationService);
app.use(ToastService);
app.mount('#app');
