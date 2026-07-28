// 用户状态管理
const user = {
  namespaced: true,
  
  state() {
    return {
      // 用户信息
      userInfo: null,
      
      // 登录状态
      isLoggedIn: false,
      
      // openid
      openid: '',
      
      // 用户设置
      settings: {
        notifyEnabled: true,
        riskLevel: 'medium',
        theme: 'light'
      }
    }
  },
  
  getters: {
    // 获取用户信息
    getUserInfo(state) {
      return state.userInfo
    },
    
    // 获取登录状态
    isLoggedIn(state) {
      return state.isLoggedIn
    },
    
    // 获取openid
    getOpenid(state) {
      return state.openid
    },
    
    // 获取用户设置
    getSettings(state) {
      return state.settings
    }
  },
  
  mutations: {
    // 设置用户信息
    SET_USER_INFO(state, info) {
      state.userInfo = info
      state.isLoggedIn = !!info
    },
    
    // 设置openid
    SET_OPENID(state, openid) {
      state.openid = openid
    },
    
    // 设置用户设置
    SET_SETTINGS(state, settings) {
      state.settings = { ...state.settings, ...settings }
    },
    
    // 清除用户信息
    CLEAR_USER(state) {
      state.userInfo = null
      state.isLoggedIn = false
      state.openid = ''
    }
  },
  
  actions: {
    // 初始化用户信息
    async initUserInfo({ commit }) {
      try {
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo) {
          commit('SET_USER_INFO', JSON.parse(userInfo))
        }
        
        const openid = uni.getStorageSync('openid')
        if (openid) {
          commit('SET_OPENID', openid)
        }
        
        const settings = uni.getStorageSync('userSettings')
        if (settings) {
          commit('SET_SETTINGS', JSON.parse(settings))
        }
      } catch (e) {
        console.error('初始化用户信息失败:', e)
      }
    },
    
    // 微信登录
    async login({ commit, dispatch }) {
      try {
        // #ifdef MP-WEIXIN
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: resolve,
            fail: reject
          })
        })
        
        // 这里应该调用云函数获取openid
        // const cloudRes = await uni.cloud.callFunction({ name: 'login', data: { code: loginRes.code } })
        // const openid = cloudRes.result.openid
        
        // 模拟openid（实际应从云函数获取）
        const openid = 'mock_openid_' + Date.now()
        
        commit('SET_OPENID', openid)
        uni.setStorageSync('openid', openid)
        
        return openid
        // #endif
        
        // #ifndef MP-WEIXIN
        console.log('非微信环境，跳过登录')
        return null
        // #endif
      } catch (e) {
        console.error('登录失败:', e)
        throw e
      }
    },
    
    // 更新用户信息
    updateUserInfo({ commit, state }, info) {
      const newInfo = { ...state.userInfo, ...info }
      commit('SET_USER_INFO', newInfo)
      uni.setStorageSync('userInfo', JSON.stringify(newInfo))
    },
    
    // 更新设置
    updateSettings({ commit, state }, settings) {
      const newSettings = { ...state.settings, ...settings }
      commit('SET_SETTINGS', newSettings)
      uni.setStorageSync('userSettings', JSON.stringify(newSettings))
    },
    
    // 退出登录
    logout({ commit }) {
      commit('CLEAR_USER')
      uni.removeStorageSync('userInfo')
      uni.removeStorageSync('openid')
      uni.removeStorageSync('userSettings')
    }
  }
}

export default user
