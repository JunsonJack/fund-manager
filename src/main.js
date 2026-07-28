import { createSSRApp } from 'vue'
import App from './App.vue'
import store from './store'

export function createApp() {
  const app = createSSRApp(App)
  
  // 使用Vuex状态管理
  app.use(store)
  
  return {
    app
  }
}
