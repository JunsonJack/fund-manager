// 自选基金管理
const watchlist = {
  namespaced: true,
  
  state() {
    return {
      // 自选基金列表
      list: [],
      
      // 分组列表
      groups: ['默认分组'],
      
      // 当前选中的分组
      currentGroup: '全部',
      
      // 加载状态
      loading: false
    }
  },
  
  getters: {
    // 获取自选列表
    getWatchlist(state) {
      if (state.currentGroup === '全部') {
        return state.list
      }
      return state.list.filter(item => item.groupName === state.currentGroup)
    },
    
    // 获取分组列表
    getGroups(state) {
      return ['全部', ...state.groups]
    },
    
    // 获取当前分组
    getCurrentGroup(state) {
      return state.currentGroup
    },
    
    // 检查基金是否在自选中
    isInWatchlist: (state) => (fundCode) => {
      return state.list.some(item => item.fundCode === fundCode)
    },
    
    // 获取自选基金数量
    getWatchlistCount(state) {
      return state.list.length
    },
    
    // 加载状态
    isLoading(state) {
      return state.loading
    }
  },
  
  mutations: {
    // 设置自选列表
    SET_LIST(state, list) {
      state.list = list
    },
    
    // 添加自选
    ADD_ITEM(state, item) {
      state.list.push(item)
    },
    
    // 移除自选
    REMOVE_ITEM(state, fundCode) {
      state.list = state.list.filter(item => item.fundCode !== fundCode)
    },
    
    // 设置分组列表
    SET_GROUPS(state, groups) {
      state.groups = groups
    },
    
    // 添加分组
    ADD_GROUP(state, group) {
      if (!state.groups.includes(group)) {
        state.groups.push(group)
      }
    },
    
    // 删除分组
    REMOVE_GROUP(state, group) {
      state.groups = state.groups.filter(g => g !== group)
      // 移除该分组下的基金
      state.list = state.list.filter(item => item.groupName !== group)
    },
    
    // 设置当前分组
    SET_CURRENT_GROUP(state, group) {
      state.currentGroup = group
    },
    
    // 更新基金数据
    UPDATE_FUND_DATA(state, { fundCode, data }) {
      const item = state.list.find(item => item.fundCode === fundCode)
      if (item) {
        Object.assign(item, data)
      }
    },
    
    // 设置加载状态
    SET_LOADING(state, loading) {
      state.loading = loading
    }
  },
  
  actions: {
    // 加载自选列表
    async loadWatchlist({ commit, rootState }) {
      commit('SET_LOADING', true)
      
      try {
        const openid = rootState.user.openid
        if (!openid) return
        
        // 从云数据库加载
        // const db = uni.cloud.database()
        // const res = await db.collection('watchlists')
        //   .where({ _openid: openid })
        //   .orderBy('sortOrder', 'asc')
        //   .get()
        
        // 从本地存储加载
        const list = uni.getStorageSync('watchlist') || []
        const groups = uni.getStorageSync('watchlistGroups') || ['默认分组']
        
        commit('SET_LIST', JSON.parse(list))
        commit('SET_GROUPS', JSON.parse(groups))
      } catch (e) {
        console.error('加载自选列表失败:', e)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 添加自选
    async addToWatchlist({ commit, state, rootState, dispatch }, { fundCode, fundName, groupName = '默认分组' }) {
      // 检查是否已存在
      if (state.list.some(item => item.fundCode === fundCode)) {
        uni.showToast({ title: '已在自选中', icon: 'none' })
        return false
      }
      
      const item = {
        fundCode,
        fundName,
        groupName,
        sortOrder: state.list.length + 1,
        addedAt: new Date().toISOString()
      }
      
      commit('ADD_ITEM', item)
      
      // 保存到本地
      uni.setStorageSync('watchlist', JSON.stringify(state.list))
      
      // 同步到云数据库
      // const db = uni.cloud.database()
      // await db.collection('watchlists').add({ data: item })
      
      uni.showToast({ title: '已添加到自选', icon: 'success' })
      return true
    },
    
    // 移除自选
    async removeFromWatchlist({ commit, state, rootState }, fundCode) {
      commit('REMOVE_ITEM', fundCode)
      
      // 保存到本地
      uni.setStorageSync('watchlist', JSON.stringify(state.list))
      
      // 从云数据库删除
      // const db = uni.cloud.database()
      // await db.collection('watchlists')
      //   .where({ fundCode, _openid: rootState.user.openid })
      //   .remove()
      
      uni.showToast({ title: '已移除自选', icon: 'success' })
      return true
    },
    
    // 添加分组
    async addGroup({ commit, state }, group) {
      if (state.groups.includes(group)) {
        uni.showToast({ title: '分组已存在', icon: 'none' })
        return false
      }
      
      commit('ADD_GROUP', group)
      uni.setStorageSync('watchlistGroups', JSON.stringify(state.groups))
      
      return true
    },
    
    // 删除分组
    async removeGroup({ commit, state }, group) {
      if (group === '默认分组') {
        uni.showToast({ title: '默认分组不可删除', icon: 'none' })
        return false
      }
      
      uni.showModal({
        title: '确认删除',
        content: `确定要删除分组"${group}"吗？该分组下的所有基金将被移除。`,
        success: async (res) => {
          if (res.confirm) {
            commit('REMOVE_GROUP', group)
            uni.setStorageSync('watchlistGroups', JSON.stringify(state.groups))
            uni.setStorageSync('watchlist', JSON.stringify(state.list))
            uni.showToast({ title: '删除成功', icon: 'success' })
          }
        }
      })
      
      return true
    },
    
    // 移动基金到其他分组
    async moveToGroup({ commit, state }, { fundCode, targetGroup }) {
      const item = state.list.find(item => item.fundCode === fundCode)
      if (item) {
        item.groupName = targetGroup
        commit('SET_LIST', [...state.list])
        uni.setStorageSync('watchlist', JSON.stringify(state.list))
        uni.showToast({ title: '移动成功', icon: 'success' })
      }
      return true
    },
    
    // 设置当前分组
    setCurrentGroup({ commit }, group) {
      commit('SET_CURRENT_GROUP', group)
    },
    
    // 更新基金数据
    updateFundData({ commit, state }, { fundCode, data }) {
      commit('UPDATE_FUND_DATA', { fundCode, data })
    },
    
    // 刷新自选基金数据
    async refreshWatchlist({ commit, state, dispatch }) {
      if (state.list.length === 0) return
      
      commit('SET_LOADING', true)
      
      try {
        // 批量获取基金最新数据
        const fundCodes = state.list.map(item => item.fundCode)
        
        // 调用云函数批量获取
        // const res = await uni.cloud.callFunction({
        //   name: 'fundData',
        //   data: { action: 'getFundBatch', fundCodes }
        // })
        
        // 模拟更新
        for (const code of fundCodes) {
          const mockData = {
            nav: (1 + Math.random() * 0.5).toFixed(4),
            dayChange: (Math.random() * 4 - 2).toFixed(2)
          }
          commit('UPDATE_FUND_DATA', { fundCode: code, data: mockData })
        }
      } catch (e) {
        console.error('刷新自选数据失败:', e)
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
}

export default watchlist
