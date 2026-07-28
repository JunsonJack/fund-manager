// 市场行情状态管理 - 天天基金数据接入（带降级模拟数据）
const market = {
  namespaced: true,

  state() {
    return {
      indices: [],
      fundRank: [],
      sectors: [],
      searchResults: [],
      currentFundType: 'all',
      sortBy: '1nzf',
      page: 1,
      hasMore: true,
      loading: false
    }
  },

  getters: {
    getIndices: state => state.indices,
    getFundRank: state => state.fundRank,
    getSectors: state => state.sectors,
    getSearchResults: state => state.searchResults,
    getCurrentFundType: state => state.currentFundType,
    getSortBy: state => state.sortBy,
    hasMore: state => state.hasMore,
    isLoading: state => state.loading
  },

  mutations: {
    SET_INDICES(state, indices) { state.indices = indices },
    SET_FUND_RANK(state, { list, append = false }) {
      state.fundRank = append ? [...state.fundRank, ...list] : list
    },
    SET_SECTORS(state, sectors) { state.sectors = sectors },
    SET_SEARCH_RESULTS(state, results) { state.searchResults = results },
    SET_CURRENT_FUND_TYPE(state, type) {
      state.currentFundType = type
      state.page = 1
      state.fundRank = []
    },
    SET_SORT_BY(state, sortBy) {
      state.sortBy = sortBy
      state.page = 1
      state.fundRank = []
    },
    SET_PAGE(state, page) { state.page = page },
    SET_HAS_MORE(state, hasMore) { state.hasMore = hasMore },
    SET_LOADING(state, loading) { state.loading = loading }
  },

  actions: {
    /**
     * 调用云函数（带降级）
     */
    async callCloud({ commit }, { action, params = {}, mockData = [] }) {
      try {
        // #ifdef MP-WEIXIN
        if (wx && wx.cloud) {
          const res = await uni.cloud.callFunction({
            name: 'fundData',
            data: { action, ...params }
          })
          if (res.result && res.result.code === 0) {
            return res.result.data
          }
        }
        // #endif
        return mockData
      } catch (e) {
        console.warn(`${action} 云函数调用失败，使用模拟数据:`, e.message)
        return mockData
      }
    },

    /**
     * 获取大盘指数
     */
    async fetchIndices({ commit, dispatch }) {
      const mockIndices = [
        { code: '000001', name: '上证指数', value: 3256.78, change: 1.25, changePercent: 0.04 },
        { code: '399001', name: '深证成指', value: 10856.32, change: -15.68, changePercent: -0.14 },
        { code: '399006', name: '创业板指', value: 2156.45, change: 8.92, changePercent: 0.42 }
      ]

      const data = await dispatch('callCloud', {
        action: 'getIndices',
        mockData: mockIndices
      })

      commit('SET_INDICES', data)
      return data
    },

    /**
     * 获取基金排行
     */
    async fetchFundRank({ commit, state, dispatch }, { append = false } = {}) {
      if (state.loading) return []

      commit('SET_LOADING', true)

      try {
        const mockRank = [
          { code: '000001', name: '华夏成长', type: '股票型', nav: 1.5678, dayChange: 1.25, weekChange: 2.34, monthChange: 5.67, totalReturn: 45.67 },
          { code: '000002', name: '嘉实增长', type: '股票型', nav: 2.3456, dayChange: 0.89, weekChange: 1.56, monthChange: 4.32, totalReturn: 38.92 },
          { code: '000003', name: '南方稳健', type: '混合型', nav: 1.2345, dayChange: -0.56, weekChange: 0.89, monthChange: 3.21, totalReturn: 28.45 },
          { code: '000004', name: '易方达蓝筹', type: '股票型', nav: 1.8765, dayChange: 2.13, weekChange: 3.45, monthChange: 6.78, totalReturn: 52.34 },
          { code: '000005', name: '招商中证白酒', type: '指数型', nav: 1.4321, dayChange: -1.23, weekChange: -0.56, monthChange: 2.34, totalReturn: 35.67 },
          { code: '000006', name: '富国天惠', type: '混合型', nav: 2.1234, dayChange: 0.67, weekChange: 1.23, monthChange: 4.56, totalReturn: 41.23 },
          { code: '000007', name: '兴全合润', type: '混合型', nav: 1.6543, dayChange: 1.45, weekChange: 2.67, monthChange: 5.89, totalReturn: 48.90 },
          { code: '000008', name: '中欧医疗', type: '股票型', nav: 0.9876, dayChange: -2.34, weekChange: -1.89, monthChange: -3.45, totalReturn: -12.34 }
        ]

        const data = await dispatch('callCloud', {
          action: 'getFundRank',
          params: {
            type: state.currentFundType,
            sort: state.sortBy,
            page: append ? state.page + 1 : 1,
            pageSize: 20
          },
          mockData: mockRank
        })

        const list = Array.isArray(data) ? data : []
        commit('SET_FUND_RANK', { list, append })
        commit('SET_HAS_MORE', list.length >= 20)

        if (!append) {
          commit('SET_PAGE', 1)
        } else {
          commit('SET_PAGE', state.page + 1)
        }

        return list
      } catch (e) {
        console.error('获取基金排行失败:', e)
        return []
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 获取板块行情
     */
    async fetchSectors({ commit, dispatch }) {
      const mockSectors = [
        { name: '半导体', change: 3.56, code: 'BK0985' },
        { name: '新能源', change: 2.34, code: 'BK0493' },
        { name: '医药生物', change: -1.23, code: 'BK0465' },
        { name: '消费', change: 0.89, code: 'BK0438' },
        { name: '军工', change: 1.78, code: 'BK0477' },
        { name: '银行', change: 0.45, code: 'BK0475' }
      ]

      const data = await dispatch('callCloud', {
        action: 'getSectors',
        mockData: mockSectors
      })

      commit('SET_SECTORS', data)
      return data
    },

    /**
     * 搜索基金
     */
    async searchFund({ commit, dispatch }, keyword) {
      if (!keyword) {
        commit('SET_SEARCH_RESULTS', [])
        return []
      }

      const mockResults = [
        { code: '000001', name: '华夏成长', type: '股票型' },
        { code: '001001', name: '华夏债券A', type: '债券型' },
        { code: '002001', name: '华夏回报', type: '混合型' },
        { code: '110011', name: '易方达中小盘', type: '股票型' },
        { code: '161725', name: '招商中证白酒', type: '指数型' }
      ].filter(f => f.name.includes(keyword) || f.code.includes(keyword))

      const data = await dispatch('callCloud', {
        action: 'searchFund',
        params: { keyword },
        mockData: mockResults
      })

      commit('SET_SEARCH_RESULTS', data)
      return data
    },

    /**
     * 获取基金详情
     */
    async fetchFundDetail({ dispatch }, fundCode) {
      return await dispatch('callCloud', {
        action: 'getFundDetail',
        params: { fundCode },
        mockData: {
          code: fundCode,
          name: '示例基金',
          type: '股票型',
          nav: 1.5678,
          dayChange: 1.25,
          totalReturn: 45.67,
          manager: '张三',
          establishDate: '2003-01-15',
          fundSize: 125.6
        }
      })
    },

    /**
     * 获取历史净值
     */
    async fetchNavHistory({ dispatch }, { fundCode, page = 1, pageSize = 30 }) {
      const mockHistory = []
      for (let i = 0; i < pageSize; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i - (page - 1) * pageSize)
        mockHistory.push({
          date: date.toISOString().split('T')[0],
          nav: (1 + Math.random() * 0.5).toFixed(4),
          totalNav: (3 + Math.random() * 0.5).toFixed(4),
          dayChange: (Math.random() * 4 - 2).toFixed(2)
        })
      }

      return await dispatch('callCloud', {
        action: 'getNavHistory',
        params: { fundCode, page, pageSize },
        mockData: mockHistory
      })
    },

    /**
     * 获取实时估值
     */
    async fetchFundEstimate({ dispatch }, fundCode) {
      return await dispatch('callCloud', {
        action: 'getFundEstimate',
        params: { fundCode },
        mockData: {
          fundCode,
          name: '示例基金',
          nav: 1.5678,
          estimateNav: 1.5823,
          estimateChange: 0.92,
          estimateTime: new Date().toLocaleString()
        }
      })
    },

    clearSearch({ commit }) {
      commit('SET_SEARCH_RESULTS', [])
    },

    setFundType({ commit, dispatch }, type) {
      commit('SET_CURRENT_FUND_TYPE', type)
      return dispatch('fetchFundRank')
    },

    setSortBy({ commit, dispatch }, sortBy) {
      commit('SET_SORT_BY', sortBy)
      return dispatch('fetchFundRank')
    },

    async loadMore({ dispatch, state }) {
      if (!state.hasMore || state.loading) return
      return dispatch('fetchFundRank', { append: true })
    },

    async refresh({ dispatch }) {
      return Promise.all([
        dispatch('fetchIndices'),
        dispatch('fetchFundRank'),
        dispatch('fetchSectors')
      ])
    }
  }
}

export default market
