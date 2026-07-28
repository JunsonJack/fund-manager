/**
 * 天天基金API封装
 * 用于获取基金数据
 */

// 天天基金API基础URL
const BASE_URL = 'http://fund.eastmoney.com'
const API_URL = 'http://api.fund.eastmoney.com'

/**
 * 封装请求方法
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Referer': 'http://fund.eastmoney.com/',
        ...options.header
      },
      timeout: options.timeout || 10000,
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

/**
 * 获取基金排行
 * @param {Object} params - 查询参数
 * @param {String} params.type - 基金类型 (all/gp/hh/zq/zs)
 * @param {String} params.sort - 排序方式 (1nzf 收益率)
 * @param {Number} params.page - 页码
 * @param {Number} params.pageSize - 每页数量
 */
export async function getFundRank(params = {}) {
  const defaultParams = {
    op: 'ph',
    dt: 'kf',
    ft: params.type || 'all',
    rs: '',
    gs: 0,
    sc: params.sort || '1nzf',
    st: 'desc',
    sd: params.startDate || '',
    ed: params.endDate || '',
    qdii: '',
    tabSubtype: ',,,,,',
    pi: params.page || 1,
    pn: params.pageSize || 20,
    dx: 1
  }
  
  try {
    const res = await request(`${BASE_URL}/data/rankhandler.aspx`, { data: defaultParams })
    // 解析返回数据
    return parseFundRankData(res)
  } catch (e) {
    console.error('获取基金排行失败:', e)
    return []
  }
}

/**
 * 解析基金排行数据
 */
function parseFundRankData(data) {
  if (!data || !data.datas) return []
  
  return data.datas.map(item => {
    const fields = item.split(',')
    return {
      code: fields[0],
      name: fields[1],
      type: fields[3],
      nav: parseFloat(fields[4]) || 0,
      dayChange: parseFloat(fields[5]) || 0,
      weekChange: parseFloat(fields[6]) || 0,
      monthChange: parseFloat(fields[7]) || 0,
      threeMonthChange: parseFloat(fields[8]) || 0,
      halfYearChange: parseFloat(fields[9]) || 0,
      yearChange: parseFloat(fields[10]) || 0,
      twoYearChange: parseFloat(fields[11]) || 0,
      threeYearChange: parseFloat(fields[12]) || 0,
      thisYearChange: parseFloat(fields[13]) || 0,
      sinceInception: parseFloat(fields[14]) || 0,
      handFee: parseFloat(fields[15]) || 0
    }
  })
}

/**
 * 获取基金详情
 * @param {String} fundCode - 基金代码
 */
export async function getFundDetail(fundCode) {
  try {
    const res = await request(`${BASE_URL}/pingzhongdata/${fundCode}.js`)
    // 解析JS返回的数据
    return parseFundDetailData(res, fundCode)
  } catch (e) {
    console.error('获取基金详情失败:', e)
    return null
  }
}

/**
 * 解析基金详情数据
 */
function parseFundDetailData(data, fundCode) {
  // 这里需要解析JavaScript格式的返回数据
  // 实际实现时需要更复杂的解析逻辑
  return {
    code: fundCode,
    name: '',
    type: '',
    nav: 0,
    navDate: '',
    dayChange: 0,
    totalReturn: 0
  }
}

/**
 * 获取基金历史净值
 * @param {String} fundCode - 基金代码
 * @param {Number} page - 页码
 * @param {Number} pageSize - 每页数量
 */
export async function getNavHistory(fundCode, page = 1, pageSize = 30) {
  try {
    const res = await request(`${API_URL}/f10/lsjz`, {
      data: {
        fundCode,
        pageIndex: page,
        pageSize
      }
    })
    
    return parseNavHistoryData(res)
  } catch (e) {
    console.error('获取历史净值失败:', e)
    return []
  }
}

/**
 * 解析历史净值数据
 */
function parseNavHistoryData(data) {
  if (!data || !data.Data || !data.Data.LSJZList) return []
  
  return data.Data.LSJZList.map(item => ({
    date: item.FSRQ,
    nav: parseFloat(item.DWJZ) || 0,
    totalNav: parseFloat(item.LJJZ) || 0,
    dayChange: parseFloat(item.JZZZL) || 0,
    dividend: item.FHSP || ''
  }))
}

/**
 * 获取基金实时估值
 * @param {String} fundCode - 基金代码
 */
export async function getFundEstimate(fundCode) {
  try {
    // 使用JRJ的估值接口
    const res = await request(`http://fundgz.jrj.com.cn/js/${fundCode}.js`)
    
    // 解析返回的JSONP数据
    const match = res.match(/jsonpgz\((.*?)\)/)
    if (match && match[1]) {
      return JSON.parse(match[1])
    }
    
    return null
  } catch (e) {
    console.error('获取基金估值失败:', e)
    return null
  }
}

/**
 * 搜索基金
 * @param {String} keyword - 搜索关键词
 */
export async function searchFund(keyword) {
  if (!keyword) return []
  
  try {
    const res = await request(`${BASE_URL}/data/FundGuideapi.aspx`, {
      data: {
        mt: '0',
        st: 'desc',
        sc: '1nzf',
        pi: 1,
        pn: 20,
        cp: '',
        ct: '',
        cd: '',
        ms: '',
        fr: '',
       plevel: '',
        fst: '',
        ft: '',
        fd: keyword,
        key: keyword
      }
    })
    
    return parseSearchData(res)
  } catch (e) {
    console.error('搜索基金失败:', e)
    return []
  }
}

/**
 * 解析搜索结果
 */
function parseSearchData(data) {
  if (!data || !data.datas) return []
  
  return data.datas.map(item => {
    const fields = item.split(',')
    return {
      code: fields[0],
      name: fields[1],
      type: fields[3]
    }
  })
}

/**
 * 获取大盘指数
 */
export async function getIndices() {
  try {
    // 模拟数据 - 实际应调用指数API
    return [
      { code: '000001', name: '上证指数', value: 3256.78, change: 1.25, changePercent: 0.04 },
      { code: '399001', name: '深证成指', value: 10856.32, change: -15.68, changePercent: -0.14 },
      { code: '399006', name: '创业板指', value: 2156.45, change: 8.92, changePercent: 0.42 }
    ]
  } catch (e) {
    console.error('获取指数失败:', e)
    return []
  }
}

/**
 * 获取板块行情
 */
export async function getSectors() {
  try {
    // 模拟数据
    return [
      { name: '半导体', change: 3.56, funds: 25 },
      { name: '新能源', change: 2.34, funds: 18 },
      { name: '医药生物', change: -1.23, funds: 32 },
      { name: '消费', change: 0.89, funds: 28 }
    ]
  } catch (e) {
    console.error('获取板块行情失败:', e)
    return []
  }
}

/**
 * 获取基金PE/PB数据
 * @param {String} fundCode - 基金代码
 */
export async function getFundValuation(fundCode) {
  try {
    // 模拟数据 - 实际应调用估值API
    return {
      pe: 25.6,
      pb: 3.2,
      pePercentile: 65.5,
      pbPercentile: 45.2
    }
  } catch (e) {
    console.error('获取估值数据失败:', e)
    return null
  }
}

export default {
  getFundRank,
  getFundDetail,
  getNavHistory,
  getFundEstimate,
  searchFund,
  getIndices,
  getSectors,
  getFundValuation
}
