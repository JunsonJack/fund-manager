// 市场行情状态管理 - 天天基金真实API数据接入

// ========== API 基础配置 ==========
const BASE_URL = 'https://fund.eastmoney.com'
const API_URL = 'https://api.fund.eastmoney.com'
const PUSH_URL = 'https://push2.eastmoney.com'

// ========== HTTP 请求封装 ==========
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Referer': 'https://fund.eastmoney.com/',
        ...options.header
      },
      timeout: options.timeout || 15000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// ========== API 函数 ==========
async function apiGetIndices() {
  try {
    const codes = '1.000001,0.399001,0.399006'
    const url = `${PUSH_URL}/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f14&secids=${codes}`
    const res = await request(url)
    if (res.data && res.data.diff) {
      return Object.values(res.data.diff).map(item => ({
        code: item.f12, name: item.f14, value: item.f2, change: item.f4, changePercent: item.f3
      }))
    }
    return []
  } catch (e) {
    console.error('获取指数失败:', e)
    return []
  }
}

async function apiGetFundRank(params = {}) {
  const defaultParams = {
    op: 'ph', dt: 'kf', ft: params.type || 'all', rs: '', gs: 0,
    sc: params.sort || '1nzf', st: 'desc', sd: '', ed: '', qdii: '',
    tabSubtype: ',,,,,', pi: params.page || 1, pn: params.pageSize || 20, dx: 1
  }
  try {
    const res = await request(`${BASE_URL}/data/rankhandler.aspx`, { data: defaultParams })
    if (!res || !res.datas) return []
    return res.datas.map(item => {
      const f = item.split(',')
      return {
        code: f[0], name: f[1], type: f[3],
        nav: parseFloat(f[4]) || 0, dayChange: parseFloat(f[5]) || 0,
        weekChange: parseFloat(f[6]) || 0, monthChange: parseFloat(f[7]) || 0,
        threeMonthChange: parseFloat(f[8]) || 0, halfYearChange: parseFloat(f[9]) || 0,
        yearChange: parseFloat(f[10]) || 0, twoYearChange: parseFloat(f[11]) || 0,
        threeYearChange: parseFloat(f[12]) || 0, thisYearChange: parseFloat(f[13]) || 0,
        sinceInception: parseFloat(f[14]) || 0, handFee: parseFloat(f[15]) || 0
      }
    })
  } catch (e) {
    console.error('获取基金排行失败:', e)
    return []
  }
}

async function apiGetHotSectors() {
  try {
    const url = `${PUSH_URL}/api/qt/clist/get?pn=1&pz=10&fs=m:90+t:2&fid=f6&po=1&fields=f2,f3,f4,f6,f12,f14`
    const res = await request(url)
    if (res.data && res.data.diff) {
      return Object.values(res.data.diff).map(item => ({
        code: item.f12, name: item.f14, change: item.f3, value: item.f2, amount: item.f6
      }))
    }
    return []
  } catch (e) {
    console.error('获取热门板块失败:', e)
    return []
  }
}

async function apiGetLeadSectors() {
  try {
    const url = `${PUSH_URL}/api/qt/clist/get?pn=1&pz=10&fs=m:90+t:2&fid=f3&po=1&fields=f2,f3,f4,f6,f12,f14`
    const res = await request(url)
    if (res.data && res.data.diff) {
      return Object.values(res.data.diff).map(item => ({
        code: item.f12, name: item.f14, change: item.f3, value: item.f2, amount: item.f6
      }))
    }
    return []
  } catch (e) {
    console.error('获取领涨板块失败:', e)
    return []
  }
}

async function apiSearchFund(keyword) {
  if (!keyword) return []
  try {
    const res = await request(`${BASE_URL}/data/FundGuideapi.aspx`, {
      data: { mt: '0', st: 'desc', sc: '1nzf', pi: 1, pn: 20, cp: '', ct: '', cd: '', ms: '', fr: '', plevel: '', fst: '', ft: '', fd: keyword, key: keyword }
    })
    if (!res || !res.datas) return []
    return res.datas.map(item => { const f = item.split(','); return { code: f[0], name: f[1], type: f[3] } })
  } catch (e) {
    console.error('搜索基金失败:', e)
    return []
  }
}

async function apiGetFundDetail(fundCode) {
  try {
    await request(`${BASE_URL}/pingzhongdata/${fundCode}.js`)
    return { code: fundCode, name: '', type: '', nav: 0, navDate: '', dayChange: 0, totalReturn: 0 }
  } catch (e) {
    console.error('获取基金详情失败:', e)
    return null
  }
}

async function apiGetNavHistory(fundCode, page = 1, pageSize = 30) {
  try {
    const res = await request(`${API_URL}/f10/lsjz`, { data: { fundCode, pageIndex: page, pageSize } })
    if (!res || !res.Data || !res.Data.LSJZList) return []
    return res.Data.LSJZList.map(item => ({
      date: item.FSRQ, nav: parseFloat(item.DWJZ) || 0, totalNav: parseFloat(item.LJJZ) || 0,
      dayChange: parseFloat(item.JZZZL) || 0, dividend: item.FHSP || ''
    }))
  } catch (e) {
    console.error('获取历史净值失败:', e)
    return []
  }
}

async function apiGetFundEstimate(fundCode) {
  try {
    const res = await request(`https://fundgz.jrj.com.cn/js/${fundCode}.js`)
    const match = res.match(/jsonpgz\((.*?)\)/)
    if (match && match[1]) return JSON.parse(match[1])
    return null
  } catch (e) {
    console.error('获取基金估值失败:', e)
    return null
  }
}

// ========== 云函数调用 ==========
async function callCloud({ action, params = {} }) {
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
    return null
  } catch (e) {
    console.warn(`${action} 云函数调用失败:`, e.message)
    return null
  }
}

// ========== Vuex Store ==========
const market = {
  namespaced: true,

  state() {
    return {
      indices: [],
      fundRank: [],
      sectors: [],
      hotSectors: [],
      leadSectors: [],
      searchResults: [],
      currentFundType: 'all',
      sortBy: '1nzf',
      page: 1,
      hasMore: true,
      loading: false,
      lastRefreshTime: null,
      refreshTimer: null
    }
  },

  getters: {
    getIndices: state => state.indices,
    getFundRank: state => state.fundRank,
    getSectors: state => state.sectors,
    getHotSectors: state => state.hotSectors,
    getLeadSectors: state => state.leadSectors,
    getSearchResults: state => state.searchResults,
    getCurrentFundType: state => state.currentFundType,
    getSortBy: state => state.sortBy,
    hasMore: state => state.hasMore,
    isLoading: state => state.loading,
    getLastRefreshTime: state => state.lastRefreshTime
  },

  mutations: {
    SET_INDICES(state, indices) { state.indices = indices },
    SET_FUND_RANK(state, { list, append = false }) {
      state.fundRank = append ? [...state.fundRank, ...list] : list
    },
    SET_SECTORS(state, sectors) { state.sectors = sectors },
    SET_HOT_SECTORS(state, sectors) { state.hotSectors = sectors },
    SET_LEAD_SECTORS(state, sectors) { state.leadSectors = sectors },
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
    SET_LOADING(state, loading) { state.loading = loading },
    SET_LAST_REFRESH_TIME(state, time) { state.lastRefreshTime = time },
    SET_REFRESH_TIMER(state, timer) { state.refreshTimer = timer }
  },

  actions: {
    async fetchIndices({ commit }) {
      try {
        const data = await apiGetIndices()
        if (data && data.length > 0) { commit('SET_INDICES', data); return data }
      } catch (e) { console.warn('HTTP API获取指数失败:', e.message) }
      const cloudData = await callCloud({ action: 'getIndices' })
      if (cloudData && cloudData.length > 0) { commit('SET_INDICES', cloudData); return cloudData }
      commit('SET_INDICES', [])
      return []
    },

    async fetchFundRank({ commit, state }, { append = false } = {}) {
      if (state.loading) return []
      commit('SET_LOADING', true)
      try {
        try {
          const data = await apiGetFundRank({ type: state.currentFundType, sort: state.sortBy, page: append ? state.page + 1 : 1, pageSize: 20 })
          if (data && data.length > 0) {
            commit('SET_FUND_RANK', { list: data, append })
            commit('SET_HAS_MORE', data.length >= 20)
            commit('SET_PAGE', append ? state.page + 1 : 1)
            return data
          }
        } catch (e) { console.warn('HTTP API获取基金排行失败:', e.message) }
        const cloudData = await callCloud({ action: 'getFundRank', params: { type: state.currentFundType, sort: state.sortBy, page: append ? state.page + 1 : 1, pageSize: 20 } })
        if (cloudData && cloudData.length > 0) {
          commit('SET_FUND_RANK', { list: cloudData, append })
          commit('SET_HAS_MORE', cloudData.length >= 20)
          commit('SET_PAGE', append ? state.page + 1 : 1)
          return cloudData
        }
        if (!append) { commit('SET_FUND_RANK', { list: [], append: false }); commit('SET_HAS_MORE', false) }
        return []
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchHotSectors({ commit }) {
      try {
        const data = await apiGetHotSectors()
        if (data && data.length > 0) { commit('SET_HOT_SECTORS', data); return data }
      } catch (e) { console.warn('HTTP API获取热门板块失败:', e.message) }
      const cloudData = await callCloud({ action: 'getHotSectors' })
      if (cloudData && cloudData.length > 0) { commit('SET_HOT_SECTORS', cloudData); return cloudData }
      commit('SET_HOT_SECTORS', [])
      return []
    },

    async fetchLeadSectors({ commit }) {
      try {
        const data = await apiGetLeadSectors()
        if (data && data.length > 0) { commit('SET_LEAD_SECTORS', data); return data }
      } catch (e) { console.warn('HTTP API获取领涨板块失败:', e.message) }
      const cloudData = await callCloud({ action: 'getLeadSectors' })
      if (cloudData && cloudData.length > 0) { commit('SET_LEAD_SECTORS', cloudData); return cloudData }
      commit('SET_LEAD_SECTORS', [])
      return []
    },

    async searchFund({ commit }, keyword) {
      if (!keyword) { commit('SET_SEARCH_RESULTS', []); return [] }
      try {
        const data = await apiSearchFund(keyword)
        if (data && data.length > 0) { commit('SET_SEARCH_RESULTS', data); return data }
      } catch (e) { console.warn('HTTP API搜索基金失败:', e.message) }
      const cloudData = await callCloud({ action: 'searchFund', params: { keyword } })
      if (cloudData && cloudData.length > 0) { commit('SET_SEARCH_RESULTS', cloudData); return cloudData }
      commit('SET_SEARCH_RESULTS', [])
      return []
    },

    async fetchFundDetail({ dispatch }, fundCode) {
      try {
        const data = await apiGetFundDetail(fundCode)
        if (data) return data
      } catch (e) { console.warn('HTTP API获取基金详情失败:', e.message) }
      const cloudData = await callCloud({ action: 'getFundDetail', params: { fundCode } })
      if (cloudData) return cloudData
      return null
    },

    async fetchNavHistory({ dispatch }, { fundCode, page = 1, pageSize = 30 }) {
      try {
        const data = await apiGetNavHistory(fundCode, page, pageSize)
        if (data && data.length > 0) return data
      } catch (e) { console.warn('HTTP API获取历史净值失败:', e.message) }
      const cloudData = await callCloud({ action: 'getNavHistory', params: { fundCode, page, pageSize } })
      if (cloudData && cloudData.length > 0) return cloudData
      return []
    },

    async fetchFundEstimate({ dispatch }, fundCode) {
      try {
        const data = await apiGetFundEstimate(fundCode)
        if (data) return data
      } catch (e) { console.warn('HTTP API获取实时估值失败:', e.message) }
      const cloudData = await callCloud({ action: 'getFundEstimate', params: { fundCode } })
      if (cloudData) return cloudData
      return null
    },

    clearSearch({ commit }) { commit('SET_SEARCH_RESULTS', []) },

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

    async refresh({ commit, dispatch }) {
      const result = await Promise.all([
        dispatch('fetchIndices'),
        dispatch('fetchFundRank'),
        dispatch('fetchHotSectors'),
        dispatch('fetchLeadSectors')
      ])
      commit('SET_LAST_REFRESH_TIME', new Date().toLocaleTimeString())
      return result
    },

    startAutoRefresh({ commit, dispatch, state }) {
      if (state.refreshTimer) clearInterval(state.refreshTimer)
      const timer = setInterval(() => { dispatch('fetchIndices') }, 60000)
      commit('SET_REFRESH_TIMER', timer)
    },

    stopAutoRefresh({ commit, state }) {
      if (state.refreshTimer) {
        clearInterval(state.refreshTimer)
        commit('SET_REFRESH_TIMER', null)
      }
    }
  }
}

export default market
