// 云函数：基金数据服务 - 接入天天基金真实API
const cloud = require('wx-server-sdk')
const http = require('http')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * HTTP请求封装
 */
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    const defaultOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://fund.eastmoney.com/',
        ...options.headers
      },
      timeout: 10000
    }

    const req = client.get(url, defaultOptions, (res) => {
      let data = ''
      res.setEncoding('utf-8')
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

/**
 * 获取基金排行
 * 天天基金排行API: http://fund.eastmoney.com/data/rankhandler.aspx
 */
async function getFundRank(params) {
  const { type = 'all', sort = '1nzf', page = 1, pageSize = 20 } = params

  // type: gp-股票型, hh-混合型, zq-债券型, zs-指数型, all-全部
  // sort: 1nzf-近1月, 3nzf-近3月, 6nzf-近6月, 1nzf-近1年
  const url = `http://fund.eastmoney.com/data/rankhandler.aspx?op=ph&dt=kf&ft=${type}&rs=&gs=0&sc=${sort}&st=desc&sd=&ed=&qdii=&tabSubtype=,,,,,&pi=${page}&pn=${pageSize}&dx=1`

  try {
    const data = await httpRequest(url)

    // 解析返回数据 - 格式: var rankData = {datas:["xxx","xxx"],allRecords:1234,...}
    const match = data.match(/datas:\[(.*?)\]/s)
    if (!match) return { code: 0, data: [] }

    const datasStr = match[1]
    const items = datasStr.split('","').map(item => item.replace(/"/g, ''))

    const fundList = items.filter(item => item).map(item => {
      const fields = item.split(',')
      return {
        code: fields[0],                    // 基金代码
        name: fields[1],                    // 基金名称
        type: fields[4],                    // 基金类型
        nav: parseFloat(fields[3]) || 0,    // 最新净值
        dayChange: parseFloat(fields[5]) || 0,    // 日增长率
        weekChange: parseFloat(fields[6]) || 0,   // 近1周
        monthChange: parseFloat(fields[7]) || 0,  // 近1月
        threeMonthChange: parseFloat(fields[8]) || 0, // 近3月
        halfYearChange: parseFloat(fields[9]) || 0,   // 近6月
        yearChange: parseFloat(fields[10]) || 0,      // 近1年
        twoYearChange: parseFloat(fields[11]) || 0,   // 近2年
        threeYearChange: parseFloat(fields[12]) || 0, // 近3年
        thisYearChange: parseFloat(fields[13]) || 0,  // 近今年
        sinceInception: parseFloat(fields[14]) || 0,  // 成立以来
        handFee: parseFloat(fields[15]) || 0          // 手续费
      }
    })

    return { code: 0, data: fundList }
  } catch (e) {
    console.error('获取基金排行失败:', e)
    return { code: -1, message: e.message }
  }
}

/**
 * 获取基金详情
 * 天天基金详情: http://fund.eastmoney.com/pingzhongdata/{code}.js
 */
async function getFundDetail(params) {
  const { fundCode } = params

  try {
    const url = `http://fund.eastmoney.com/pingzhongdata/${fundCode}.js`
    const data = await httpRequest(url)

    // 解析JS变量
    const result = {
      code: fundCode,
      name: extractValue(data, 'fS_name') || '',
      nav: parseFloat(extractValue(data, 'DWJZ')) || 0,
      totalNav: parseFloat(extractValue(data, 'LJJZ')) || 0,
      dayChange: parseFloat(extractValue(data, 'RZZL')) || 0,
      // 基金经理
      manager: extractArrayValue(data, 'Data_currentFundManager', 'name'),
      // 成立日期
      establishDate: extractValue(data, 'CreationDate') || '',
      // 基金规模(亿)
      fundSize: parseFloat(extractValue(data, 'FundSize')) || 0,
      // 基金类型
      type: extractValue(data, 'Fund_Type') || ''
    }

    return { code: 0, data: result }
  } catch (e) {
    console.error('获取基金详情失败:', e)
    return { code: -1, message: e.message }
  }
}

/**
 * 获取历史净值
 * 天天基金净值API: http://api.fund.eastmoney.com/f10/lsjz
 */
async function getNavHistory(params) {
  const { fundCode, page = 1, pageSize = 30 } = params

  try {
    const url = `http://api.fund.eastmoney.com/f10/lsjz?callback=jQuery&fundCode=${fundCode}&pageIndex=${page}&pageSize=${pageSize}`
    const data = await httpRequest(url)

    // 解析JSONP返回
    const jsonStr = data.replace(/^jQuery\(/, '').replace(/\)$/, '')
    const json = JSON.parse(jsonStr)

    if (json.Data && json.Data.LSJZList) {
      const list = json.Data.LSJZList.map(item => ({
        date: item.FSRQ,                      // 净值日期
        nav: parseFloat(item.DWJZ) || 0,       // 单位净值
        totalNav: parseFloat(item.LJJZ) || 0,  // 累计净值
        dayChange: parseFloat(item.JZZZL) || 0, // 日增长率
        dividend: item.FHSP || ''               // 分红送配
      }))

      return { code: 0, data: list, total: json.Data.TotalCount || 0 }
    }

    return { code: 0, data: [] }
  } catch (e) {
    console.error('获取历史净值失败:', e)
    return { code: -1, message: e.message }
  }
}

/**
 * 搜索基金
 * 天天基金搜索: http://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx
 */
async function searchFund(params) {
  const { keyword } = params

  try {
    const url = `http://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?callback=jQuery&m=1&key=${encodeURIComponent(keyword)}`
    const data = await httpRequest(url)

    const jsonStr = data.replace(/^jQuery\(/, '').replace(/\)$/, '')
    const json = JSON.parse(jsonStr)

    if (json.Datas) {
      const list = json.Datas.map(item => ({
        code: item.CODE,
        name: item.NAME,
        type: item.FundBaseInfo ? item.FundBaseInfo.FTYPE : '',
        pinyin: item.SPELLNAME || ''
      }))

      return { code: 0, data: list }
    }

    return { code: 0, data: [] }
  } catch (e) {
    console.error('搜索基金失败:', e)
    return { code: -1, message: e.message }
  }
}

/**
 * 获取大盘指数
 * 东方财富行情接口
 */
async function getIndices() {
  try {
    // 上证指数(1.000001)、深证成指(0.399001)、创业板指(0.399006)
    const codes = '1.000001,0.399001,0.399006'
    const url = `http://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f14&secids=${codes}`
    const data = await httpRequest(url)
    const json = JSON.parse(data)

    if (json.data && json.data.diff) {
      const indices = json.data.diff.map(item => ({
        code: item.f12,
        name: item.f14,
        value: item.f2,
        change: item.f4,
        changePercent: item.f3
      }))

      return { code: 0, data: indices }
    }

    return { code: 0, data: [] }
  } catch (e) {
    console.error('获取指数失败:', e)
    return { code: -1, message: e.message }
  }
}

/**
 * 获取实时估值
 * 好买基金估值接口
 */
async function getFundEstimate(params) {
  const { fundCode } = params

  try {
    const url = `http://fundgz.jrj.com.cn/js/${fundCode}.js`
    const data = await httpRequest(url)

    const match = data.match(/jsonpgz\((.*?)\)/)
    if (match && match[1]) {
      const json = JSON.parse(match[1])
      return {
        code: 0,
        data: {
          fundCode: json.fundcode,
          name: json.name,
          nav: parseFloat(json.dwjz) || 0,
          estimateNav: parseFloat(json.gsz) || 0,
          estimateChange: parseFloat(json.gszzl) || 0,
          estimateTime: json.gztime
        }
      }
    }

    return { code: 0, data: null }
  } catch (e) {
    console.error('获取估值失败:', e)
    return { code: -1, message: e.message }
  }
}

/**
 * 获取板块行情
 */
async function getSectors() {
  try {
    // 东方财富板块行情
    const url = `http://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&fs=m:90+t:2&fields=f2,f3,f4,f12,f14`
    const data = await httpRequest(url)
    const json = JSON.parse(data)

    if (json.data && json.data.diff) {
      const sectors = json.data.diff.map(item => ({
        code: item.f12,
        name: item.f14,
        change: item.f3,
        value: item.f2
      }))

      return { code: 0, data: sectors }
    }

    return { code: 0, data: [] }
  } catch (e) {
    console.error('获取板块行情失败:', e)
    return { code: -1, message: e.message }
  }
}

// ========== 辅助函数 ==========

function extractValue(data, varName) {
  const regex = new RegExp(`var\\s+${varName}\\s*=\\s*["']?([^"';]+)["']?`)
  const match = data.match(regex)
  return match ? match[1] : ''
}

function extractArrayValue(data, varName, field) {
  const regex = new RegExp(`var\\s+${varName}\\s*=\\s*(\\[.*?\\])`)
  const match = data.match(regex)
  if (match) {
    try {
      const arr = JSON.parse(match[1])
      return arr.length > 0 ? arr[0][field] || '' : ''
    } catch (e) {
      return ''
    }
  }
  return ''
}

// 云函数入口
exports.main = async (event, context) => {
  const { action, ...params } = event

  try {
    let result

    switch (action) {
      case 'getFundRank':
        result = await getFundRank(params)
        break
      case 'getFundDetail':
        result = await getFundDetail(params)
        break
      case 'getNavHistory':
        result = await getNavHistory(params)
        break
      case 'searchFund':
        result = await searchFund(params)
        break
      case 'getIndices':
        result = await getIndices()
        break
      case 'getFundEstimate':
        result = await getFundEstimate(params)
        break
      case 'getSectors':
        result = await getSectors()
        break
      default:
        result = { code: -1, message: '未知操作: ' + action }
    }

    return result
  } catch (e) {
    console.error('云函数执行失败:', e)
    return { code: -1, message: e.message || '服务器错误' }
  }
}
