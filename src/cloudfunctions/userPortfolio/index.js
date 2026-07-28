// 云函数：用户持仓服务
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取用户持仓列表
 */
async function getPortfolios(event) {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const res = await db.collection('portfolios')
      .where({ _openid: OPENID })
      .orderBy('createdAt', 'desc')
      .get()
    
    return {
      code: 0,
      data: res.data
    }
  } catch (e) {
    console.error('获取持仓列表失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

/**
 * 添加持仓
 */
async function addPortfolio(event) {
  const { OPENID } = cloud.getWXContext()
  const { fundCode, fundName, fundType, shares, cost, buyDate } = event
  
  try {
    const totalCost = shares * cost
    
    const data = {
      _openid: OPENID,
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
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
    
    const res = await db.collection('portfolios').add({ data })
    
    return {
      code: 0,
      data: { _id: res._id },
      message: '添加成功'
    }
  } catch (e) {
    console.error('添加持仓失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

/**
 * 更新持仓
 */
async function updatePortfolio(event) {
  const { OPENID } = cloud.getWXContext()
  const { fundCode, data } = event
  
  try {
    const res = await db.collection('portfolios')
      .where({ fundCode, _openid: OPENID })
      .update({
        data: {
          ...data,
          updatedAt: db.serverDate()
        }
      })
    
    return {
      code: 0,
      data: { updated: res.stats.updated },
      message: '更新成功'
    }
  } catch (e) {
    console.error('更新持仓失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

/**
 * 删除持仓
 */
async function removePortfolio(event) {
  const { OPENID } = cloud.getWXContext()
  const { fundCode } = event
  
  try {
    const res = await db.collection('portfolios')
      .where({ fundCode, _openid: OPENID })
      .remove()
    
    return {
      code: 0,
      data: { removed: res.stats.removed },
      message: '删除成功'
    }
  } catch (e) {
    console.error('删除持仓失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

/**
 * 更新基金净值和盈亏
 */
async function updateFundNav(event) {
  const { OPENID } = cloud.getWXContext()
  const { fundCode, nav } = event
  
  try {
    // 获取持仓记录
    const portfolioRes = await db.collection('portfolios')
      .where({ fundCode, _openid: OPENID })
      .get()
    
    if (portfolioRes.data.length === 0) {
      return {
        code: -1,
        message: '未找到持仓记录'
      }
    }
    
    const portfolio = portfolioRes.data[0]
    const currentValue = portfolio.shares * nav
    const profit = currentValue - portfolio.totalCost
    const profitRate = portfolio.totalCost > 0 ? (profit / portfolio.totalCost * 100) : 0
    
    // 计算今日盈亏
    const lastNav = portfolio.nav || portfolio.cost
    const todayProfit = portfolio.shares * (nav - lastNav)
    
    await db.collection('portfolios')
      .where({ fundCode, _openid: OPENID })
      .update({
        data: {
          nav,
          currentValue,
          profit,
          profitRate,
          todayProfit,
          updatedAt: db.serverDate()
        }
      })
    
    return {
      code: 0,
      data: {
        currentValue,
        profit,
        profitRate,
        todayProfit
      },
      message: '更新成功'
    }
  } catch (e) {
    console.error('更新净值失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

/**
 * 获取持仓统计
 */
async function getPortfolioStats(event) {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const res = await db.collection('portfolios')
      .where({ _openid: OPENID })
      .get()
    
    const portfolios = res.data
    
    let totalAssets = 0
    let totalCost = 0
    let todayProfit = 0
    
    const typeMap = {}
    
    portfolios.forEach(item => {
      totalAssets += item.currentValue || 0
      totalCost += item.totalCost || 0
      todayProfit += item.todayProfit || 0
      
      if (!typeMap[item.fundType]) {
        typeMap[item.fundType] = { count: 0, amount: 0 }
      }
      typeMap[item.fundType].count++
      typeMap[item.fundType].amount += item.currentValue || 0
    })
    
    return {
      code: 0,
      data: {
        totalAssets,
        totalCost,
        totalProfit: totalAssets - totalCost,
        totalReturnRate: totalCost > 0 ? ((totalAssets - totalCost) / totalCost * 100).toFixed(2) : 0,
        todayProfit,
        portfolioByType: typeMap,
        count: portfolios.length
      }
    }
  } catch (e) {
    console.error('获取持仓统计失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

// 云函数入口
exports.main = async (event, context) => {
  const { action, ...params } = event
  
  try {
    let result
    
    switch (action) {
      case 'getPortfolios':
        result = await getPortfolios(event)
        break
      case 'addPortfolio':
        result = await addPortfolio(event)
        break
      case 'updatePortfolio':
        result = await updatePortfolio(event)
        break
      case 'removePortfolio':
        result = await removePortfolio(event)
        break
      case 'updateFundNav':
        result = await updateFundNav(event)
        break
      case 'getPortfolioStats':
        result = await getPortfolioStats(event)
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
