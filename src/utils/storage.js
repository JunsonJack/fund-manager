/**
 * 本地存储工具
 * 封装uni storage的常用操作
 */

/**
 * 存储数据
 * @param {String} key - 键名
 * @param {*} value - 值
 */
export function setStorage(key, value) {
  try {
    const data = JSON.stringify(value)
    uni.setStorageSync(key, data)
    return true
  } catch (e) {
    console.error('存储数据失败:', e)
    return false
  }
}

/**
 * 获取数据
 * @param {String} key - 键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 存储的值
 */
export function getStorage(key, defaultValue = null) {
  try {
    const data = uni.getStorageSync(key)
    if (data) {
      return JSON.parse(data)
    }
    return defaultValue
  } catch (e) {
    console.error('获取数据失败:', e)
    return defaultValue
  }
}

/**
 * 删除数据
 * @param {String} key - 键名
 */
export function removeStorage(key) {
  try {
    uni.removeStorageSync(key)
    return true
  } catch (e) {
    console.error('删除数据失败:', e)
    return false
  }
}

/**
 * 清空所有数据
 */
export function clearStorage() {
  try {
    uni.clearStorageSync()
    return true
  } catch (e) {
    console.error('清空数据失败:', e)
    return false
  }
}

/**
 * 获取存储信息
 * @returns {Object} 存储信息
 */
export function getStorageInfo() {
  try {
    const res = uni.getStorageInfoSync()
    return {
      keys: res.keys,
      currentSize: res.currentSize,
      limitSize: res.limitSize
    }
  } catch (e) {
    console.error('获取存储信息失败:', e)
    return null
  }
}

// ==================== 基金相关存储 ====================

/**
 * 存储自选基金列表
 * @param {Array} list - 自选列表
 */
export function setWatchlist(list) {
  return setStorage('watchlist', list)
}

/**
 * 获取自选基金列表
 * @returns {Array} 自选列表
 */
export function getWatchlist() {
  return getStorage('watchlist', [])
}

/**
 * 存储持仓列表
 * @param {Array} list - 持仓列表
 */
export function setPortfolios(list) {
  return setStorage('portfolios', list)
}

/**
 * 获取持仓列表
 * @returns {Array} 持仓列表
 */
export function getPortfolios() {
  return getStorage('portfolios', [])
}

/**
 * 存储用户信息
 * @param {Object} info - 用户信息
 */
export function setUserInfo(info) {
  return setStorage('userInfo', info)
}

/**
 * 获取用户信息
 * @returns {Object} 用户信息
 */
export function getUserInfo() {
  return getStorage('userInfo', null)
}

/**
 * 存储用户设置
 * @param {Object} settings - 用户设置
 */
export function setUserSettings(settings) {
  return setStorage('userSettings', settings)
}

/**
 * 获取用户设置
 * @returns {Object} 用户设置
 */
export function getUserSettings() {
  return getStorage('userSettings', {
    notifyEnabled: true,
    riskLevel: 'medium',
    theme: 'light'
  })
}

/**
 * 存储基金数据缓存
 * @param {String} fundCode - 基金代码
 * @param {Object} data - 基金数据
 * @param {Number} expireTime - 过期时间（毫秒）
 */
export function setFundCache(fundCode, data, expireTime = 5 * 60 * 1000) {
  const cacheData = {
    data,
    expireAt: Date.now() + expireTime
  }
  return setStorage(`fund_${fundCode}`, cacheData)
}

/**
 * 获取基金数据缓存
 * @param {String} fundCode - 基金代码
 * @returns {Object|null} 基金数据
 */
export function getFundCache(fundCode) {
  const cacheData = getStorage(`fund_${fundCode}`)
  
  if (!cacheData) return null
  
  // 检查是否过期
  if (Date.now() > cacheData.expireAt) {
    removeStorage(`fund_${fundCode}`)
    return null
  }
  
  return cacheData.data
}

/**
 * 清除过期缓存
 */
export function clearExpiredCache() {
  const info = getStorageInfo()
  if (!info) return
  
  info.keys.forEach(key => {
    if (key.startsWith('fund_')) {
      const cacheData = getStorage(key)
      if (cacheData && Date.now() > cacheData.expireAt) {
        removeStorage(key)
      }
    }
  })
}

/**
 * 存储搜索历史
 * @param {Array} history - 搜索历史
 */
export function setSearchHistory(history) {
  // 只保留最近20条
  const limitedHistory = history.slice(0, 20)
  return setStorage('searchHistory', limitedHistory)
}

/**
 * 获取搜索历史
 * @returns {Array} 搜索历史
 */
export function getSearchHistory() {
  return getStorage('searchHistory', [])
}

/**
 * 添加搜索记录
 * @param {String} keyword - 搜索关键词
 */
export function addSearchHistory(keyword) {
  const history = getSearchHistory()
  
  // 移除重复项
  const filtered = history.filter(item => item !== keyword)
  
  // 添加到开头
  filtered.unshift(keyword)
  
  // 保存
  setSearchHistory(filtered)
}

/**
 * 清空搜索历史
 */
export function clearSearchHistory() {
  return removeStorage('searchHistory')
}

export default {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage,
  getStorageInfo,
  setWatchlist,
  getWatchlist,
  setPortfolios,
  getPortfolios,
  setUserInfo,
  getUserInfo,
  setUserSettings,
  getUserSettings,
  setFundCache,
  getFundCache,
  clearExpiredCache,
  setSearchHistory,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory
}
