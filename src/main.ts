import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import mstore from './store/mindex';

createApp(App).use(store).use(mstore).mount('#app')
