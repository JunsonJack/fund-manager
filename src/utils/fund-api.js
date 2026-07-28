/**
 * 天天基金API封装
 * 用于获取基金数据
 */

// 天天基金API基础URL（HTTPS）
const BASE_URL = 'https://fund.eastmoney.com'
const API_URL = 'https://api.fund.eastmoney.com'
const PUSH_URL = 'https://push2.eastmoney.com'

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
    const res = await request(`https://fundgz.jrj.com.cn/js/${fundCode}.js`)

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
 * 东方财富行情接口
 */
export async function getIndices() {
  try {
    // 上证指数(1.000001)、深证成指(0.399001)、创业板指(0.399006)
    const codes = '1.000001,0.399001,0.399006'
    const url = `${PUSH_URL}/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f14&secids=${codes}`

    const res = await request(url)
    if (res.data && res.data.diff) {
      return Object.values(res.data.diff).map(item => ({
        code: item.f12,
        name: item.f14,
        value: item.f2,
        change: item.f4,
        changePercent: item.f3
      }))
    }
    return []
  } catch (e) {
    console.error('获取指数失败:', e)
    return []
  }
}

/**
 * 获取板块行情
 * 东方财富板块行情接口
 */
export async function getSectors() {
  try {
    const url = `${PUSH_URL}/api/qt/clist/get?pn=1&pz=20&fs=m:90+t:2&fields=f2,f3,f4,f6,f12,f14`

    const res = await request(url)
    if (res.data && res.data.diff) {
      return Object.values(res.data.diff).map(item => ({
        code: item.f12,
        name: item.f14,
        change: item.f3,
        value: item.f2,
        amount: item.f6
      }))
    }
    return []
  } catch (e) {
    console.error('获取板块行情失败:', e)
    return []
  }
}

/**
 * 获取热门板块（按成交额降序）
 * 东方财富板块行情接口
 */
export async function getHotSectors() {
  try {
    const url = `${PUSH_URL}/api/qt/clist/get?pn=1&pz=10&fs=m:90+t:2&fid=f6&po=1&fields=f2,f3,f4,f6,f12,f14`

    const res = await request(url)
    if (res.data && res.data.diff) {
      return Object.values(res.data.diff).map(item => ({
        code: item.f12,
        name: item.f14,
        change: item.f3,
        value: item.f2,
        amount: item.f6
      }))
    }
    return []
  } catch (e) {
    console.error('获取热门板块失败:', e)
    return []
  }
}

/**
 * 获取领涨板块（按涨跌幅降序）
 * 东方财富板块行情接口
 */
export async function getLeadSectors() {
  try {
    const url = `${PUSH_URL}/api/qt/clist/get?pn=1&pz=10&fs=m:90+t:2&fid=f3&po=1&fields=f2,f3,f4,f6,f12,f14`

    const res = await request(url)
    if (res.data && res.data.diff) {
      return Object.values(res.data.diff).map(item => ({
        code: item.f12,
        name: item.f14,
        change: item.f3,
        value: item.f2,
        amount: item.f6
      }))
    }
    return []
  } catch (e) {
    console.error('获取领涨板块失败:', e)
    return []
  }
}

/**
 * 获取基金PE/PB数据
 * @param {String} fundCode - 基金代码
 */
export async function getFundValuation(fundCode) {
  try {
    const res = await request(`https://fundgz.jrj.com.cn/js/${fundCode}.js`)
    const match = res.match(/jsonpgz\((.*?)\)/)
    if (match && match[1]) {
      const json = JSON.parse(match[1])
      return {
        pe: parseFloat(json.pe) || 0,
        pb: parseFloat(json.pb) || 0,
        pePercentile: parseFloat(json.pe_percentile) || 0,
        pbPercentile: parseFloat(json.pb_percentile) || 0
      }
    }
    return null
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
  getHotSectors,
  getLeadSectors,
  getFundValuation
}
