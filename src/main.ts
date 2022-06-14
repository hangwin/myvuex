import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import mstore from './store/mindex';
import 'ant-design-vue/dist/antd.css';
createApp(App).use(store).use(mstore).mount('#app')
