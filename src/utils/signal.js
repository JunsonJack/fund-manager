/**
 * 波段信号生成逻辑
 * 综合技术指标和估值数据生成买卖信号
 */

import { calcMA, calcMACD, calcRSI, isGoldenCross, isDeathCross } from './indicators'

/**
 * 信号类型
 */
export const SIGNAL_TYPES = {
  STRONG_BUY: 'strong_buy',
  BUY: 'buy',
  HOLD: 'hold',
  SELL: 'sell',
  STRONG_SELL: 'strong_sell'
}

/**
 * 信号颜色
 */
export const SIGNAL_COLORS = {
  [SIGNAL_TYPES.STRONG_BUY]: '#ff4d4f',
  [SIGNAL_TYPES.BUY]: '#faad14',
  [SIGNAL_TYPES.HOLD]: '#52c41a',
  [SIGNAL_TYPES.SELL]: '#faad14',
  [SIGNAL_TYPES.STRONG_SELL]: '#ff4d4f'
}

/**
 * 信号文本
 */
export const SIGNAL_TEXTS = {
  [SIGNAL_TYPES.STRONG_BUY]: '强烈买入',
  [SIGNAL_TYPES.BUY]: '建议买入',
  [SIGNAL_TYPES.HOLD]: '继续持有',
  [SIGNAL_TYPES.SELL]: '建议卖出',
  [SIGNAL_TYPES.STRONG_SELL]: '强烈卖出'
}

/**
 * 计算MA信号
 * @param {Array} prices - 价格数据
 * @returns {Object} MA信号
 */
export function calcMASignal(prices) {
  const ma5 = calcMA(prices, 5)
  const ma10 = calcMA(prices, 10)
  const ma20 = calcMA(prices, 20)
  
  const latest = prices[prices.length - 1]
  const ma5Latest = ma5[ma5.length - 1]
  const ma10Latest = ma10[ma10.length - 1]
  const ma20Latest = ma20[ma20.length - 1]
  
  // 判断金叉死叉
  const goldenCross5_10 = isGoldenCross(ma5, ma10)
  const deathCross5_10 = isDeathCross(ma5, ma10)
  const goldenCross10_20 = isGoldenCross(ma10, ma20)
  const deathCross10_20 = isDeathCross(ma10, ma20)
  
  // 计算信号得分 (-100 到 100)
  let score = 0
  
  // 价格与均线关系
  if (latest > ma5Latest) score += 20
  if (latest > ma10Latest) score += 20
  if (latest > ma20Latest) score += 20
  
  // 均线多头排列
  if (ma5Latest > ma10Latest && ma10Latest > ma20Latest) score += 30
  
  // 金叉死叉
  if (goldenCross5_10) score += 25
  if (deathCross5_10) score -= 25
  if (goldenCross10_20) score += 15
  if (deathCross10_20) score -= 15
  
  // 均线空头排列
  if (ma5Latest < ma10Latest && ma10Latest < ma20Latest) score -= 30
  
  return {
    score: Math.max(-100, Math.min(100, score)),
    goldenCross: goldenCross5_10 || goldenCross10_20,
    deathCross: deathCross5_10 || deathCross10_20,
    bullish: ma5Latest > ma10Latest && ma10Latest > ma20Latest,
    bearish: ma5Latest < ma10Latest && ma10Latest < ma20Latest,
    values: { ma5: ma5Latest, ma10: ma10Latest, ma20: ma20Latest }
  }
}

/**
 * 计算MACD信号
 * @param {Array} prices - 价格数据
 * @returns {Object} MACD信号
 */
export function calcMACDSignal(prices) {
  const { dif, dea, macd } = calcMACD(prices)
  
  const difLatest = dif[dif.length - 1]
  const deaLatest = dea[dea.length - 1]
  const macdLatest = macd[macd.length - 1]
  
  // 判断金叉死叉
  const goldenCross = isGoldenCross(dif, dea)
  const deathCross = isDeathCross(dif, dea)
  
  // 计算信号得分
  let score = 0
  
  // DIF与DEA关系
  if (difLatest > deaLatest) score += 30
  if (difLatest < deaLatest) score -= 30
  
  // MACD柱状图
  if (macdLatest > 0) score += 20
  if (macdLatest < 0) score -= 20
  
  // 金叉死叉
  if (goldenCross) score += 30
  if (deathCross) score -= 30
  
  // 零轴上下
  if (difLatest > 0 && deaLatest > 0) score += 20
  if (difLatest < 0 && deaLatest < 0) score -= 20
  
  return {
    score: Math.max(-100, Math.min(100, score)),
    goldenCross,
    deathCross,
    bullish: difLatest > deaLatest,
    bearish: difLatest < deaLatest,
    values: { dif: difLatest, dea: deaLatest, macd: macdLatest }
  }
}

/**
 * 计算RSI信号
 * @param {Array} prices - 价格数据
 * @param {Number} period - 周期 (默认14)
 * @returns {Object} RSI信号
 */
export function calcRSISignal(prices, period = 14) {
  const rsi = calcRSI(prices, period)
  const rsiLatest = rsi[rsi.length - 1]
  
  // 计算信号得分
  let score = 0
  
  // RSI区间判断
  if (rsiLatest < 20) {
    // 极度超卖
    score = 50
  } else if (rsiLatest < 30) {
    // 超卖
    score = 30
  } else if (rsiLatest < 45) {
    // 偏弱
    score = 10
  } else if (rsiLatest < 55) {
    // 中性
    score = 0
  } else if (rsiLatest < 70) {
    // 偏强
    score = -10
  } else if (rsiLatest < 80) {
    // 超买
    score = -30
  } else {
    // 极度超买
    score = -50
  }
  
  return {
    score,
    oversold: rsiLatest < 30,
    overbought: rsiLatest > 70,
    value: rsiLatest
  }
}

/**
 * 计算估值信号
 * @param {Object} valuation - 估值数据 { pe, pb, pePercentile, pbPercentile }
 * @returns {Object} 估值信号
 */
export function calcValuationSignal(valuation) {
  if (!valuation) {
    return { score: 0, level: 'unknown', text: '无数据' }
  }
  
  const { pePercentile = 50, pbPercentile = 50 } = valuation
  
  // 计算信号得分 (-100 到 100)
  let score = 0
  
  // PE百分位
  if (pePercentile < 20) {
    score += 40 // 极度低估
  } else if (pePercentile < 30) {
    score += 30 // 低估
  } else if (pePercentile < 50) {
    score += 10 // 偏低
  } else if (pePercentile < 70) {
    score -= 10 // 偏高
  } else if (pePercentile < 80) {
    score -= 30 // 高估
  } else {
    score -= 40 // 极度高估
  }
  
  // PB百分位
  if (pbPercentile < 30) {
    score += 20
  } else if (pbPercentile > 70) {
    score -= 20
  }
  
  // 判断估值水平
  let level = 'neutral'
  let text = '估值适中'
  
  if (score >= 40) {
    level = 'undervalued'
    text = '极度低估'
  } else if (score >= 20) {
    level = 'undervalued'
    text = '低估'
  } else if (score >= 0) {
    level = 'neutral'
    text = '估值适中'
  } else if (score >= -20) {
    level = 'overvalued'
    text = '高估'
  } else {
    level = 'overvalued'
    text = '极度高估'
  }
  
  return {
    score: Math.max(-100, Math.min(100, score)),
    level,
    text,
    pePercentile,
    pbPercentile
  }
}

/**
 * 计算综合评分
 * @param {Array} prices - 价格数据
 * @param {Object} valuation - 估值数据
 * @returns {Object} 综合评分
 */
export function calcComprehensiveScore(prices, valuation = null) {
  // 计算各指标信号
  const maSignal = calcMASignal(prices)
  const macdSignal = calcMACDSignal(prices)
  const rsiSignal = calcRSISignal(prices)
  const valuationSignal = valuation ? calcValuationSignal(valuation) : { score: 0 }
  
  // 权重配置
  const weights = {
    ma: 0.25,
    macd: 0.25,
    rsi: 0.20,
    valuation: 0.30
  }
  
  // 计算加权得分
  let totalScore = 0
  totalScore += maSignal.score * weights.ma
  totalScore += macdSignal.score * weights.macd
  totalScore += rsiSignal.score * weights.rsi
  totalScore += valuationSignal.score * weights.valuation
  
  // 标准化到 0-100
  const normalizedScore = Math.round((totalScore + 100) / 2)
  
  // 生成信号
  const signal = generateSignal(normalizedScore)
  
  return {
    score: normalizedScore,
    signal,
    indicators: {
      ma: maSignal,
      macd: macdSignal,
      rsi: rsiSignal,
      valuation: valuationSignal
    },
    weights
  }
}

/**
 * 根据评分生成信号
 * @param {Number} score - 评分 (0-100)
 * @returns {Object} 信号
 */
export function generateSignal(score) {
  let type, text, color
  
  if (score >= 80) {
    type = SIGNAL_TYPES.STRONG_BUY
    text = SIGNAL_TEXTS[SIGNAL_TYPES.STRONG_BUY]
    color = SIGNAL_COLORS[SIGNAL_TYPES.STRONG_BUY]
  } else if (score >= 65) {
    type = SIGNAL_TYPES.BUY
    text = SIGNAL_TEXTS[SIGNAL_TYPES.BUY]
    color = SIGNAL_COLORS[SIGNAL_TYPES.BUY]
  } else if (score >= 45) {
    type = SIGNAL_TYPES.HOLD
    text = SIGNAL_TEXTS[SIGNAL_TYPES.HOLD]
    color = SIGNAL_COLORS[SIGNAL_TYPES.HOLD]
  } else if (score >= 30) {
    type = SIGNAL_TYPES.SELL
    text = SIGNAL_TEXTS[SIGNAL_TYPES.SELL]
    color = SIGNAL_COLORS[SIGNAL_TYPES.SELL]
  } else {
    type = SIGNAL_TYPES.STRONG_SELL
    text = SIGNAL_TEXTS[SIGNAL_TYPES.STRONG_SELL]
    color = SIGNAL_COLORS[SIGNAL_TYPES.STRONG_SELL]
  }
  
  return { type, text, color }
}

/**
 * 获取信号历史
 * @param {String} fundCode - 基金代码
 * @param {Number} days - 天数
 * @returns {Array} 信号历史
 */
export async function getSignalHistory(fundCode, days = 30) {
  try {
    // 调用云函数获取
    // const res = await uni.cloud.callFunction({
    //   name: 'signalEngine',
    //   data: { action: 'getHistory', fundCode, days }
    // })
    
    // 模拟数据
    const history = []
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      history.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(Math.random() * 100),
        signal: generateSignal(Math.round(Math.random() * 100))
      })
    }
    
    return history
  } catch (e) {
    console.error('获取信号历史失败:', e)
    return []
  }
}

export default {
  SIGNAL_TYPES,
  SIGNAL_COLORS,
  SIGNAL_TEXTS,
  calcMASignal,
  calcMACDSignal,
  calcRSISignal,
  calcValuationSignal,
  calcComprehensiveScore,
  generateSignal,
  getSignalHistory
}
