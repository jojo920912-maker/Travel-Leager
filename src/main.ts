import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 啟動前先從 localStorage 恢復登入狀態
useAuthStore().restore()

app.use(router)
app.mount('#app')
