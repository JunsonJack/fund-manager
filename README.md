# 基金管理小程序

一款类似"小倍养基"的基金管理小程序，采用 uni-app 多端适配 + 微信云开发后端。

## 功能特性

### 1. 市场行情
- 大盘指数实时展示（上证、深证、创业板）
- 基金排行榜（按收益率、规模等排序）
- 板块行情展示
- 热门基金推荐

### 2. 自选基金
- 自选基金列表管理
- 分组管理功能
- 实时估值展示
- 基金对比分析

### 3. 持仓管理
- 添加/编辑持仓记录
- 实时盈亏计算
- 持仓分析（行业分布）
- 收益曲线图表

### 4. 波段信号
- 技术指标分析（MA、MACD、RSI、KDJ）
- 估值信号（PE/PB百分位）
- 综合评分系统
- 买卖信号提示

## 技术栈

- **前端**: uni-app (Vue 3)
- **后端**: 微信云开发
- **数据源**: 天天基金API
- **状态管理**: Vuex
- **样式**: SCSS

## 项目结构

```
fund-manager/
├── cloudfunctions/           # 云函数
│   ├── fundData/            # 基金数据服务
│   ├── userPortfolio/       # 用户持仓服务
│   ├── signalEngine/        # 信号计算引擎
│   └── syncData/            # 定时数据同步
├── pages/                   # 页面
│   ├── index/              # 市场行情
│   ├── watchlist/          # 自选基金
│   ├── portfolio/          # 持仓管理
│   ├── signal/             # 波段信号
│   ├── fund-detail/        # 基金详情
│   └── settings/           # 设置
├── components/              # 公共组件
│   ├── FundCard.vue        # 基金卡片
│   ├── IndexBar.vue        # 指数条
│   ├── ProfitDisplay.vue   # 盈亏展示
│   ├── SignalBadge.vue     # 信号徽章
│   └── SearchBar.vue       # 搜索栏
├── store/                   # Vuex状态管理
│   ├── modules/
│   │   ├── market.js       # 行情状态
│   │   ├── watchlist.js    # 自选状态
│   │   ├── portfolio.js    # 持仓状态
│   │   └── user.js         # 用户状态
├── utils/                   # 工具函数
│   ├── fund-api.js         # 天天基金API封装
│   ├── indicators.js       # 技术指标计算
│   ├── signal.js           # 信号生成逻辑
│   └── storage.js          # 本地存储工具
├── pages.json               # 页面路由配置
├── manifest.json            # uni-app配置
├── App.vue                  # 根组件
├── main.js                  # 入口文件
└── uni.scss                 # 全局样式
```

## 快速开始

### 1. 安装依赖

```bash
cd fund-manager
npm install
```

### 2. 配置微信小程序

1. 在 `manifest.json` 中填入你的微信小程序 AppID
2. 在微信开发者工具中导入项目
3. 开通云开发环境

### 3. 部署云函数

在微信开发者工具中，右键点击 `cloudfunctions` 目录下的每个云函数，选择"上传并部署"。

### 4. 运行项目

```bash
# 开发模式
npm run dev:mp-weixin

# 构建生产版本
npm run build:mp-weixin
```

## 数据库集合

需要在云开发控制台创建以下集合：

| 集合名 | 用途 |
|--------|------|
| users | 用户信息 |
| watchlists | 自选基金列表 |
| portfolios | 用户持仓 |
| fund_cache | 基金数据缓存 |
| signals | 信号记录 |
| nav_history | 历史净值 |
| index_cache | 指数缓存 |
| sector_cache | 板块缓存 |

## 定时任务

在云开发控制台设置定时触发器：

| 触发器 | 时间 | 功能 |
|--------|------|------|
| syncNavData | 每日 18:00 | 同步基金净值 |
| syncIndexData | 每日 15:30 | 同步大盘指数 |
| syncSectorData | 每日 15:30 | 同步板块行情 |
| batchCalcSignals | 每日 19:00 | 批量计算信号 |

## 开发注意事项

1. **数据缓存**: 合理使用本地缓存和云数据库缓存，减少API请求
2. **请求频率**: 天天基金API有反爬机制，需要控制请求频率
3. **信号滞后**: 技术指标信号具有滞后性，需明确告知用户
4. **免责声明**: 必须添加投资风险免责声明

## 免责声明

本应用提供的所有信息、数据和信号仅供参考，不构成任何投资建议或投资决策依据。基金投资有风险，投资需谨慎。过往业绩不代表未来表现。本应用不对因使用本应用信息而导致的任何损失承担责任。

## License

MIT
