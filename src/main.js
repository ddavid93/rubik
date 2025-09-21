import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Steps from 'primevue/steps';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';

import 'primeicons/primeicons.css';

import App from './App.vue';
import './style.css';

const app = createApp(App);
app.use(PrimeVue, { theme: { preset: Aura } });
app.use(ToastService);

// Global registration for p-* tags
app.component('p-button', Button);
app.component('p-card', Card);
app.component('p-steps', Steps);
app.component('p-dialog', Dialog);
app.component('p-tag', Tag);
app.component('Toast', Toast);

app.mount('#app');
