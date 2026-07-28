// 云函数：信号计算引擎
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 计算移动平均线
 */
function calcMA(data, period) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(sum / period)
    }
  }
  return result
}

/**
 * 计算EMA
 */
function calcEMA(data, period) {
  const result = []
  const multiplier = 2 / (period + 1)
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(ema)
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema
    result.push(ema)
  }
  return result
}

/**
 * 计算MACD
 */
function calcMACD(data, short = 12, long = 26, signal = 9) {
  const emaShort = calcEMA(data, short)
  const emaLong = calcEMA(data, long)
  const offset = long - short
  const dif = []
  
  for (let i = 0; i < emaLong.length; i++) {
    dif.push(emaShort[i + offset] - emaLong[i])
  }
  
  const dea = calcEMA(dif, signal)
  const alignedDif = dif.slice(signal - 1)
  const macd = alignedDif.map((v, i) => (v - dea[i]) * 2)
  
  return { dif: alignedDif, dea, macd }
}

/**
 * 计算RSI
 */
function calcRSI(data, period = 14) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null)
      continue
    }
    
    const changes = []
    for (let j = i - period + 1; j <= i; j++) {
      changes.push(data[j] - data[j - 1])
    }
    
    const gains = changes.filter(v => v > 0)
    const losses = changes.filter(v => v < 0).map(v => Math.abs(v))
    
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0
    
    if (avgLoss === 0) {
      result.push(100)
    } else {
      const rs = avgGain / avgLoss
      result.push(100 - (100 / (1 + rs)))
    }
  }
  return result
}

/**
 * 判断金叉死叉
 */
function isGoldenCross(fast, slow) {
  if (fast.length < 2 || slow.length < 2) return false
  const i = Math.min(fast.length, slow.length) - 1
  return fast[i] > slow[i] && fast[i - 1] <= slow[i - 1]
}

function isDeathCross(fast, slow) {
  if (fast.length < 2 || slow.length < 2) return false
  const i = Math.min(fast.length, slow.length) - 1
  return fast[i] < slow[i] && fast[i - 1] >= slow[i - 1]
}

/**
 * 计算单只基金的综合信号
 */
async function calcFundSignal(fundCode) {
  try {
    // 获取历史净值
    const navRes = await db.collection('nav_history')
      .where({ fundCode })
      .orderBy('date', 'desc')
      .limit(60)
      .get()
    
    if (navRes.data.length < 20) {
      return { code: -1, message: '数据不足' }
    }
    
    const prices = navRes.data.map(item => item.nav).reverse()
    
    // 计算MA
    const ma5 = calcMA(prices, 5)
    const ma10 = calcMA(prices, 10)
    const ma20 = calcMA(prices, 20)
    
    // 计算MACD
    const { dif, dea, macd } = calcMACD(prices)
    
    // 计算RSI
    const rsi = calcRSI(prices)
    
    // 获取估值数据
    const valuationRes = await db.collection('fund_cache')
      .where({ _id: fundCode })
      .get()
    
    const valuation = valuationRes.data[0] || {}
    
    // 计算各项信号得分
    let maScore = 0
    const latestPrice = prices[prices.length - 1]
    const ma5Latest = ma5[ma5.length - 1]
    const ma10Latest = ma10[ma10.length - 1]
    const ma20Latest = ma20[ma20.length - 1]
    
    if (latestPrice > ma5Latest) maScore += 20
    if (latestPrice > ma10Latest) maScore += 20
    if (latestPrice > ma20Latest) maScore += 20
    if (ma5Latest > ma10Latest && ma10Latest > ma20Latest) maScore += 30
    if (isGoldenCross(ma5, ma10)) maScore += 25
    if (isDeathCross(ma5, ma10)) maScore -= 25
    if (ma5Latest < ma10Latest && ma10Latest < ma20Latest) maScore -= 30
    maScore = Math.max(-100, Math.min(100, maScore))
    
    let macdScore = 0
    const difLatest = dif[dif.length - 1]
    const deaLatest = dea[dea.length - 1]
    const macdLatest = macd[macd.length - 1]
    
    if (difLatest > deaLatest) macdScore += 30
    if (difLatest < deaLatest) macdScore -= 30
    if (macdLatest > 0) macdScore += 20
    if (macdLatest < 0) macdScore -= 20
    if (isGoldenCross(dif, dea)) macdScore += 30
    if (isDeathCross(dif, dea)) macdScore -= 30
    if (difLatest > 0 && deaLatest > 0) macdScore += 20
    if (difLatest < 0 && deaLatest < 0) macdScore -= 20
    macdScore = Math.max(-100, Math.min(100, macdScore))
    
    let rsiScore = 0
    const rsiLatest = rsi[rsi.length - 1]
    if (rsiLatest < 20) rsiScore = 50
    else if (rsiLatest < 30) rsiScore = 30
    else if (rsiLatest < 45) rsiScore = 10
    else if (rsiLatest < 55) rsiScore = 0
    else if (rsiLatest < 70) rsiScore = -10
    else if (rsiLatest < 80) rsiScore = -30
    else rsiScore = -50
    
    let valuationScore = 0
    const pePercentile = valuation.pePercentile || 50
    const pbPercentile = valuation.pbPercentile || 50
    
    if (pePercentile < 20) valuationScore += 40
    else if (pePercentile < 30) valuationScore += 30
    else if (pePercentile < 50) valuationScore += 10
    else if (pePercentile < 70) valuationScore -= 10
    else if (pePercentile < 80) valuationScore -= 30
    else valuationScore -= 40
    
    if (pbPercentile < 30) valuationScore += 20
    else if (pbPercentile > 70) valuationScore -= 20
    valuationScore = Math.max(-100, Math.min(100, valuationScore))
    
    // 计算综合评分
    const totalScore = Math.round(
      (maScore * 0.25 + macdScore * 0.25 + rsiScore * 0.20 + valuationScore * 0.30 + 100) / 2
    )
    
    // 生成信号
    let signalType, signalText, signalColor
    if (totalScore >= 80) {
      signalType = 'strong_buy'
      signalText = '强烈买入'
      signalColor = '#ff4d4f'
    } else if (totalScore >= 65) {
      signalType = 'buy'
      signalText = '建议买入'
      signalColor = '#faad14'
    } else if (totalScore >= 45) {
      signalType = 'hold'
      signalText = '继续持有'
      signalColor = '#52c41a'
    } else if (totalScore >= 30) {
      signalType = 'sell'
      signalText = '建议卖出'
      signalColor = '#faad14'
    } else {
      signalType = 'strong_sell'
      signalText = '强烈卖出'
      signalColor = '#ff4d4f'
    }
    
    return {
      code: 0,
      data: {
        fundCode,
        score: totalScore,
        signalType,
        signalText,
        signalColor,
        indicators: {
          ma: { score: maScore, bullish: ma5Latest > ma10Latest && ma10Latest > ma20Latest },
          macd: { score: macdScore, bullish: difLatest > deaLatest },
          rsi: { score: rsiScore, value: rsiLatest, oversold: rsiLatest < 30, overbought: rsiLatest > 70 },
          valuation: { score: valuationScore, pePercentile, pbPercentile }
        }
      }
    }
  } catch (e) {
    console.error('计算信号失败:', e)
    return { code: -1, message: e.message }
  }
}

/**
 * 批量计算信号
 */
async function batchCalcSignals() {
  try {
    // 获取所有需要计算信号的基金
    const fundsRes = await db.collection('fund_cache')
      .limit(100)
      .get()
    
    const results = []
    
    for (const fund of fundsRes.data) {
      const signal = await calcFundSignal(fund._id)
      if (signal.code === 0) {
        results.push(signal.data)
        
        // 保存到数据库
        await db.collection('signals')
          .add({
            data: {
              ...signal.data,
              createdAt: db.serverDate()
            }
          })
      }
    }
    
    return {
      code: 0,
      data: results,
      message: `成功计算 ${results.length} 只基金信号`
    }
  } catch (e) {
    console.error('批量计算信号失败:', e)
    return {
      code: -1,
      message: e.message
    }
  }
}

/**
 * 获取基金信号历史
 */
async function getSignalHistory(event) {
  const { fundCode, days = 30 } = event
  
  try {
    const res = await db.collection('signals')
      .where({ fundCode })
      .orderBy('createdAt', 'desc')
      .limit(days)
      .get()
    
    return {
      code: 0,
      data: res.data
    }
  } catch (e) {
    console.error('获取信号历史失败:', e)
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
      case 'calcFundSignal':
        result = await calcFundSignal(params.fundCode)
        break
      case 'batchCalcSignals':
        result = await batchCalcSignals()
        break
      case 'getSignalHistory':
        result = await getSignalHistory(event)
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
