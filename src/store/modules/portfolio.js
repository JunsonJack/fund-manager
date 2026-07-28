// 持仓管理
const portfolio = {
  namespaced: true,
  
  state() {
    return {
      // 持仓列表
      list: [],
      
      // 总资产
      totalAssets: 0,
      
      // 总收益
      totalProfit: 0,
      
      // 总收益率
      totalReturnRate: 0,
      
      // 今日盈亏
      todayProfit: 0,
      
      // 加载状态
      loading: false
    }
  },
  
  getters: {
    // 获取持仓列表
    getPortfolios(state) {
      return state.list
    },
    
    // 获取总资产
    getTotalAssets(state) {
      return state.totalAssets
    },
    
    // 获取总收益
    getTotalProfit(state) {
      return state.totalProfit
    },
    
    // 获取总收益率
    getTotalReturnRate(state) {
      return state.totalReturnRate
    },
    
    // 获取今日盈亏
    getTodayProfit(state) {
      return state.todayProfit
    },
    
    // 获取持仓数量
    getPortfolioCount(state) {
      return state.list.length
    },
    
    // 按类型统计持仓
    getPortfolioByType(state) {
      const typeMap = {}
      state.list.forEach(item => {
        if (!typeMap[item.fundType]) {
          typeMap[item.fundType] = { count: 0, amount: 0 }
        }
        typeMap[item.fundType].count++
        typeMap[item.fundType].amount += item.currentValue
      })
      return typeMap
    },
    
    // 加载状态
    isLoading(state) {
      return state.loading
    }
  },
  
  mutations: {
    // 设置持仓列表
    SET_LIST(state, list) {
      state.list = list
    },
    
    // 添加持仓
    ADD_ITEM(state, item) {
      state.list.push(item)
    },
    
    // 更新持仓
    UPDATE_ITEM(state, { fundCode, data }) {
      const index = state.list.findIndex(item => item.fundCode === fundCode)
      if (index !== -1) {
        state.list[index] = { ...state.list[index], ...data }
      }
    },
    
    // 删除持仓
    REMOVE_ITEM(state, fundCode) {
      state.list = state.list.filter(item => item.fundCode !== fundCode)
    },
    
    // 计算总资产和收益
    CALC_TOTALS(state) {
      let totalAssets = 0
      let totalCost = 0
      let todayProfit = 0
      
      state.list.forEach(item => {
        totalAssets += item.currentValue || 0
        totalCost += item.totalCost || 0
        todayProfit += item.todayProfit || 0
      })
      
      state.totalAssets = totalAssets
      state.totalProfit = totalAssets - totalCost
      state.totalReturnRate = totalCost > 0 ? ((totalAssets - totalCost) / totalCost * 100).toFixed(2) : 0
      state.todayProfit = todayProfit
    },
    
    // 设置加载状态
    SET_LOADING(state, loading) {
      state.loading = loading
    }
  },
  
  actions: {
    // 加载持仓列表
    async loadPortfolios({ commit, rootState }) {
      commit('SET_LOADING', true)
      
      try {
        const openid = rootState.user.openid
        if (!openid) return
        
        // 从云数据库加载
        // const db = uni.cloud.database()
        // const res = await db.collection('portfolios')
        //   .where({ _openid: openid })
        //   .get()
        
        // 从本地存储加载
        const list = uni.getStorageSync('portfolios') || []
        commit('SET_LIST', JSON.parse(list))
        
        // 计算总资产
        commit('CALC_TOTALS')
      } catch (e) {
        console.error('加载持仓列表失败:', e)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 添加持仓
    async addPortfolio({ commit, state, rootState, dispatch }, { 
      fundCode, 
      fundName, 
      fundType,
      shares, 
      cost, 
      buyDate 
    }) {
      const totalCost = shares * cost
      
      const item = {
        fundCode,
        fundName,
        fundType,
        shares,
        cost,
        totalCost,
        buyDate,
        currentValue: totalCost,
        profit: 0,
        profitRate: 0,
        todayProfit: 0,
        nav: cost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      commit('ADD_ITEM', item)
      commit('CALC_TOTALS')
      
      // 保存到本地
      uni.setStorageSync('portfolios', JSON.stringify(state.list))
      
      // 同步到云数据库
      // const db = uni.cloud.database()
      // await db.collection('portfolios').add({ data: item })
      
      uni.showToast({ title: '添加成功', icon: 'success' })
      return true
    },
    
    // 更新持仓
    async updatePortfolio({ commit, state, rootState }, { fundCode, data }) {
      commit('UPDATE_ITEM', { 
        fundCode, 
        data: { ...data, updatedAt: new Date().toISOString() } 
      })
      commit('CALC_TOTALS')
      
      // 保存到本地
      uni.setStorageSync('portfolios', JSON.stringify(state.list))
      
      // 更新云数据库
      // const db = uni.cloud.database()
      // await db.collection('portfolios')
      //   .where({ fundCode, _openid: rootState.user.openid })
      //   .update({ data })
      
      return true
    },
    
    // 删除持仓
    async removePortfolio({ commit, state, rootState }, fundCode) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除该持仓记录吗？',
        success: async (res) => {
          if (res.confirm) {
            commit('REMOVE_ITEM', fundCode)
            commit('CALC_TOTALS')
            
            // 保存到本地
            uni.setStorageSync('portfolios', JSON.stringify(state.list))
            
            // 从云数据库删除
            // const db = uni.cloud.database()
            // await db.collection('portfolios')
            //   .where({ fundCode, _openid: rootState.user.openid })
            //   .remove()
            
            uni.showToast({ title: '删除成功', icon: 'success' })
          }
        }
      })
      
      return true
    },
    
    // 更新基金净值和盈亏
    async updateFundNav({ commit, state, dispatch }, { fundCode, nav }) {
      const item = state.list.find(item => item.fundCode === fundCode)
      if (!item) return
      
      const currentValue = item.shares * nav
      const profit = currentValue - item.totalCost
      const profitRate = item.totalCost > 0 ? (profit / item.totalCost * 100) : 0
      
      commit('UPDATE_ITEM', {
        fundCode,
        data: {
          nav,
          currentValue,
          profit,
          profitRate
        }
      })
      
      commit('CALC_TOTALS')
      
      // 保存到本地
      uni.setStorageSync('portfolios', JSON.stringify(state.list))
    },
    
    // 刷新持仓数据
    async refreshPortfolios({ commit, state, dispatch }) {
      if (state.list.length === 0) return
      
      commit('SET_LOADING', true)
      
      try {
        // 批量获取最新净值
        for (const item of state.list) {
          // 模拟更新净值
          const newNav = item.nav * (1 + (Math.random() * 0.04 - 0.02))
          await dispatch('updateFundNav', { 
            fundCode: item.fundCode, 
            nav: parseFloat(newNav.toFixed(4))
          })
        }
      } catch (e) {
        console.error('刷新持仓数据失败:', e)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 获取收益曲线数据
    async getProfitCurve({ state }, { fundCode, days = 30 }) {
      try {
        // 调用云函数获取历史数据
        // const res = await uni.cloud.callFunction({
        //   name: 'fundData',
        //   data: { action: 'getNavHistory', fundCode, days }
        // })
        
        // 模拟数据
        const data = []
        const baseValue = 1000
        for (let i = days; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          data.push({
            date: date.toISOString().split('T')[0],
            value: baseValue * (1 + Math.random() * 0.1 - 0.05)
          })
        }
        
        return data
      } catch (e) {
        console.error('获取收益曲线失败:', e)
        return []
      }
    }
  }
}

export default portfolio
