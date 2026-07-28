import { createStore } from 'vuex'
import market from './modules/market'
import watchlist from './modules/watchlist'
import portfolio from './modules/portfolio'
import user from './modules/user'

const store = createStore({
  modules: {
    market,
    watchlist,
    portfolio,
    user
  },
  
  // 全局状态
  state() {
    return {
      // 网络状态
      networkType: 'none',
      isConnected: true,
      
      // 加载状态
      loading: false,
      
      // 消息提示
      toast: {
        show: false,
        title: '',
        icon: 'none'
      }
    }
  },
  
  // 全局mutations
  mutations: {
    SET_NETWORK_TYPE(state, type) {
      state.networkType = type
    },
    
    SET_CONNECTED(state, connected) {
      state.isConnected = connected
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    
    SHOW_TOAST(state, { title, icon = 'none' }) {
      state.toast = { show: true, title, icon }
      setTimeout(() => {
        state.toast.show = false
      }, 2000)
    }
  },
  
  // 全局actions
  actions: {
    // 初始化应用
    async initApp({ commit, dispatch }) {
      // 获取网络状态
      uni.getNetworkType({
        success: (res) => {
          commit('SET_NETWORK_TYPE', res.networkType)
          commit('SET_CONNECTED', res.networkType !== 'none')
        }
      })
      
      // 监听网络变化
      uni.onNetworkStatusChange((res) => {
        commit('SET_NETWORK_TYPE', res.networkType)
        commit('SET_CONNECTED', res.isConnected)
      })
      
      // 初始化用户信息
      await dispatch('user/initUserInfo')
      
      // 加载自选基金列表
      await dispatch('watchlist/loadWatchlist')
      
      // 加载持仓列表
      await dispatch('portfolio/loadPortfolios')
    },
    
    // 显示提示
    showToast({ commit }, { title, icon }) {
      commit('SHOW_TOAST', { title, icon })
    }
  }
})

export default store
