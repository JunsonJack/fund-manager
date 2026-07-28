// 云函数：定时数据同步
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 同步基金净值数据
 */
async function syncNavData() {
  try {
    // 获取需要同步的基金列表
    const fundsRes = await db.collection('fund_cache')
      .limit(100)
      .get()
    
    const results = []
    
    for (const fund of fundsRes.data) {
      // 这里应该调用天天基金API获取最新净值
      // 模拟更新
      const newNav = fund.nav * (1 + (Math.random() * 0.04 - 0.02))
      
      await db.collection('fund_cache')
        .where({ _id: fund._id })
        .update({
          data: {
            nav: parseFloat(newNav.toFixed(4)),
            navDate: new Date().toISOString().split('T')[0],
            dayChange: parseFloat((Math.random() * 4 - 2).toFixed(2)),
            updatedAt: db.serverDate()
          }
        })
      
      results.push(fund._id)
    }
    
    return {
      code: 0,
      data: { updated: results.length },
      message: `成功同步 ${results.length} 只基金净值`
    }
  } catch (e) {
    console.error('同步净值数据失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

/**
 * 同步大盘指数
 */
async function syncIndexData() {
  try {
    // 模拟指数数据
    const indices = [
      { code: '000001', name: '上证指数', value: 3256.78 + (Math.random() * 20 - 10) },
      { code: '399001', name: '深证成指', value: 10856.32 + (Math.random() * 50 - 25) },
      { code: '399006', name: '创业板指', value: 2156.45 + (Math.random() * 30 - 15) }
    ]
    
    for (const index of indices) {
      await db.collection('index_cache')
        .where({ _id: index.code })
        .update({
          data: {
            value: parseFloat(index.value.toFixed(2)),
            change: parseFloat((Math.random() * 30 - 15).toFixed(2)),
            changePercent: parseFloat((Math.random() * 2 - 1).toFixed(2)),
            updatedAt: db.serverDate()
          }
        })
    }
    
    return {
      code: 0,
      data: { updated: indices.length },
      message: '指数数据同步成功'
    }
  } catch (e) {
    console.error('同步指数数据失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

/**
 * 同步板块行情
 */
async function syncSectorData() {
  try {
    const sectors = [
      { name: '半导体', change: Math.random() * 6 - 3 },
      { name: '新能源', change: Math.random() * 6 - 3 },
      { name: '医药生物', change: Math.random() * 6 - 3 },
      { name: '消费', change: Math.random() * 6 - 3 }
    ]
    
    for (const sector of sectors) {
      await db.collection('sector_cache')
        .where({ name: sector.name })
        .update({
          data: {
            change: parseFloat(sector.change.toFixed(2)),
            updatedAt: db.serverDate()
          }
        })
    }
    
    return {
      code: 0,
      data: { updated: sectors.length },
      message: '板块数据同步成功'
    }
  } catch (e) {
    console.error('同步板块数据失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

/**
 * 更新用户持仓盈亏
 */
async function updateUserPortfolio() {
  try {
    // 获取所有用户持仓
    const portfoliosRes = await db.collection('portfolios')
      .limit(100)
      .get()
    
    let updatedCount = 0
    
    for (const portfolio of portfoliosRes.data) {
      // 获取基金最新净值
      const fundRes = await db.collection('fund_cache')
        .where({ _id: portfolio.fundCode })
        .get()
      
      if (fundRes.data.length > 0) {
        const fund = fundRes.data[0]
        const currentValue = portfolio.shares * fund.nav
        const profit = currentValue - portfolio.totalCost
        const profitRate = portfolio.totalCost > 0 ? (profit / portfolio.totalCost * 100) : 0
        
        await db.collection('portfolios')
          .where({ _id: portfolio._id })
          .update({
            data: {
              nav: fund.nav,
              currentValue,
              profit,
              profitRate,
              updatedAt: db.serverDate()
            }
          })
        
        updatedCount++
      }
    }
    
    return {
      code: 0,
      data: { updated: updatedCount },
      message: `成功更新 ${updatedCount} 条持仓记录`
    }
  } catch (e) {
    console.error('更新用户持仓失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

/**
 * 清理过期缓存
 */
async function clearExpiredCache() {
  try {
    const expireTime = new Date()
    expireTime.setDate(expireTime.getDate() - 7) // 7天前的数据
    
    const res = await db.collection('nav_history')
      .where({
        date: db.command.lt(expireTime.toISOString().split('T')[0])
      })
      .limit(100)
      .remove()
    
    return {
      code: 0,
      data: { removed: res.stats.removed },
      message: '清理过期缓存成功'
    }
  } catch (e) {
    console.error('清理过期缓存失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

// 云函数入口
exports.main = async (event, context) => {
  const { action } = event
  
  try {
    let result
    
    switch (action) {
      case 'syncNavData':
        result = await syncNavData()
        break
      case 'syncIndexData':
        result = await syncIndexData()
        break
      case 'syncSectorData':
        result = await syncSectorData()
        break
      case 'updateUserPortfolio':
        result = await updateUserPortfolio()
        break
      case 'clearExpiredCache':
        result = await clearExpiredCache()
        break
      case 'syncAll':
        // 全量同步
        const navResult = await syncNavData()
        const indexResult = await syncIndexData()
        const sectorResult = await syncSectorData()
        const portfolioResult = await updateUserPortfolio()
        result = {
          code: 0,
          data: {
            nav: navResult.data,
            index: indexResult.data,
            sector: sectorResult.data,
            portfolio: portfolioResult.data
          },
          message: '全量同步完成'
        }
        break
      default:
        result = { code: -1, message: '未知操作' }
    }
    
    return result
  } catch (e) {
    console.error('云函数执行失败:', e)
    return {
      code: -1,
      message: e.message || '服务器错误'
    }
  }
}
