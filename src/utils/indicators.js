/**
 * 技术指标计算库
 * 包含MA、MACD、RSI、KDJ等常用技术指标
 */

/**
 * 计算移动平均线 (MA)
 * @param {Array} data - 价格数据
 * @param {Number} period - 周期
 * @returns {Array} MA值数组
 */
export function calcMA(data, period) {
  const result = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      const slice = data.slice(i - period + 1, i + 1)
      const sum = slice.reduce((acc, val) => acc + val, 0)
      result.push(parseFloat((sum / period).toFixed(4)))
    }
  }
  
  return result
}

/**
 * 计算指数移动平均线 (EMA)
 * @param {Array} data - 价格数据
 * @param {Number} period - 周期
 * @returns {Array} EMA值数组
 */
export function calcEMA(data, period) {
  const result = []
  const multiplier = 2 / (period + 1)
  
  // 第一个值使用SMA
  let ema = data.slice(0, period).reduce((acc, val) => acc + val, 0) / period
  result.push(parseFloat(ema.toFixed(4)))
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema
    result.push(parseFloat(ema.toFixed(4)))
  }
  
  return result
}

/**
 * 计算MACD指标
 * @param {Array} data - 价格数据
 * @param {Number} short - 短期周期 (默认12)
 * @param {Number} long - 长期周期 (默认26)
 * @param {Number} signal - 信号线周期 (默认9)
 * @returns {Object} { dif, dea, macd }
 */
export function calcMACD(data, short = 12, long = 26, signal = 9) {
  const emaShort = calcEMA(data, short)
  const emaLong = calcEMA(data, long)
  
  // 对齐数据长度
  const offset = long - short
  const dif = []
  
  for (let i = 0; i < emaLong.length; i++) {
    dif.push(parseFloat((emaShort[i + offset] - emaLong[i]).toFixed(4)))
  }
  
  // 计算DEA (DIF的EMA)
  const dea = calcEMA(dif, signal)
  
  // 对齐DIF数据
  const alignedDif = dif.slice(signal - 1)
  
  // 计算MACD柱状图
  const macd = alignedDif.map((v, i) => parseFloat(((v - dea[i]) * 2).toFixed(4)))
  
  return {
    dif: alignedDif,
    dea,
    macd
  }
}

/**
 * 计算RSI指标
 * @param {Array} data - 价格数据
 * @param {Number} period - 周期 (默认14)
 * @returns {Array} RSI值数组
 */
export function calcRSI(data, period = 14) {
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
      result.push(parseFloat((100 - (100 / (1 + rs))).toFixed(2)))
    }
  }
  
  return result
}

/**
 * 计算KDJ指标
 * @param {Array} high - 最高价数据
 * @param {Array} low - 最低价数据
 * @param {Array} close - 收盘价数据
 * @param {Number} period - 周期 (默认9)
 * @returns {Object} { k, d, j }
 */
export function calcKDJ(high, low, close, period = 9) {
  const k = []
  const d = []
  const j = []
  
  let prevK = 50
  let prevD = 50
  
  for (let i = 0; i < close.length; i++) {
    if (i < period - 1) {
      k.push(50)
      d.push(50)
      j.push(50)
      continue
    }
    
    const periodHigh = Math.max(...high.slice(i - period + 1, i + 1))
    const periodLow = Math.min(...low.slice(i - period + 1, i + 1))
    
    let rsv = 50
    if (periodHigh !== periodLow) {
      rsv = ((close[i] - periodLow) / (periodHigh - periodLow)) * 100
    }
    
    const curK = (2 / 3) * prevK + (1 / 3) * rsv
    const curD = (2 / 3) * prevD + (1 / 3) * curK
    const curJ = 3 * curK - 2 * curD
    
    k.push(parseFloat(curK.toFixed(2)))
    d.push(parseFloat(curD.toFixed(2)))
    j.push(parseFloat(curJ.toFixed(2)))
    
    prevK = curK
    prevD = curD
  }
  
  return { k, d, j }
}

/**
 * 计算布林带 (BOLL)
 * @param {Array} data - 价格数据
 * @param {Number} period - 周期 (默认20)
 * @param {Number} multiplier - 标准差倍数 (默认2)
 * @returns {Object} { upper, middle, lower }
 */
export function calcBOLL(data, period = 20, multiplier = 2) {
  const middle = calcMA(data, period)
  const upper = []
  const lower = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null)
      lower.push(null)
      continue
    }
    
    const slice = data.slice(i - period + 1, i + 1)
    const mean = middle[i]
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period
    const stdDev = Math.sqrt(variance)
    
    upper.push(parseFloat((mean + multiplier * stdDev).toFixed(4)))
    lower.push(parseFloat((mean - multiplier * stdDev).toFixed(4)))
  }
  
  return { upper, middle, lower }
}

/**
 * 计算ATR (平均真实波幅)
 * @param {Array} high - 最高价
 * @param {Array} low - 最低价
 * @param {Array} close - 收盘价
 * @param {Number} period - 周期 (默认14)
 * @returns {Array} ATR值数组
 */
export function calcATR(high, low, close, period = 14) {
  const trueRange = []
  
  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      trueRange.push(high[i] - low[i])
    } else {
      const tr = Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      )
      trueRange.push(tr)
    }
  }
  
  return calcMA(trueRange, period)
}

/**
 * 判断金叉
 * @param {Array} fast - 快线数据
 * @param {Array} slow - 慢线数据
 * @returns {Boolean} 是否发生金叉
 */
export function isGoldenCross(fast, slow) {
  if (fast.length < 2 || slow.length < 2) return false
  
  const fastLen = Math.min(fast.length, slow.length)
  const i = fastLen - 1
  
  return fast[i] > slow[i] && fast[i - 1] <= slow[i - 1]
}

/**
 * 判断死叉
 * @param {Array} fast - 快线数据
 * @param {Array} slow - 慢线数据
 * @returns {Boolean} 是否发生死叉
 */
export function isDeathCross(fast, slow) {
  if (fast.length < 2 || slow.length < 2) return false
  
  const fastLen = Math.min(fast.length, slow.length)
  const i = fastLen - 1
  
  return fast[i] < slow[i] && fast[i - 1] >= slow[i - 1]
}

/**
 * 计算所有指标
 * @param {Array} prices - 价格数据
 * @returns {Object} 所有指标结果
 */
export function calcAllIndicators(prices) {
  const ma5 = calcMA(prices, 5)
  const ma10 = calcMA(prices, 10)
  const ma20 = calcMA(prices, 20)
  const ma60 = calcMA(prices, 60)
  
  const { dif, dea, macd } = calcMACD(prices)
  const rsi = calcRSI(prices)
  const { upper, middle, lower } = calcBOLL(prices)
  
  // KDJ需要high/low/close，这里简化处理
  const { k, d, j } = calcKDJ(prices, prices, prices)
  
  return {
    ma: { ma5, ma10, ma20, ma60 },
    macd: { dif, dea, macd },
    rsi,
    kdj: { k, d, j },
    boll: { upper, middle, lower }
  }
}

export default {
  calcMA,
  calcEMA,
  calcMACD,
  calcRSI,
  calcKDJ,
  calcBOLL,
  calcATR,
  isGoldenCross,
  isDeathCross,
  calcAllIndicators
}
