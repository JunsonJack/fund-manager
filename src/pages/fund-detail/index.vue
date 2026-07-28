<template>
  <view class="page-container">
    <!-- 基金信息头部 -->
    <view class="fund-header">
      <view class="fund-info">
        <text class="fund-name">{{ fundName }}</text>
        <text class="fund-code">{{ fundCode }}</text>
        <text class="fund-type">{{ fundType }}</text>
      </view>
      
      <view class="fund-nav">
        <text class="nav-label">最新净值</text>
        <text class="nav-value">{{ nav.toFixed(4) }}</text>
        <text class="nav-change" :class="getChangeClass(dayChange)">
          {{ dayChange > 0 ? '+' : '' }}{{ dayChange }}%
        </text>
      </view>
    </view>
    
    <!-- 操作按钮 -->
    <view class="action-bar">
      <view class="action-btn" @click="toggleWatchlist">
        <text class="action-icon">{{ isWatched ? '★' : '☆' }}</text>
        <text class="action-text">{{ isWatched ? '已自选' : '加自选' }}</text>
      </view>
      <view class="action-btn primary" @click="showAddPortfolio">
        <text class="action-icon">+</text>
        <text class="action-text">买基金</text>
      </view>
    </view>
    
    <!-- 信号评分 -->
    <view class="signal-section">
      <view class="section-header">
        <text class="section-title">波段信号</text>
      </view>
      
      <view class="signal-card">
        <view class="signal-score">
          <text class="score-value" :style="{ color: signal.color }">{{ signalScore }}</text>
          <text class="score-label">综合评分</text>
        </view>
        
        <view class="signal-info">
          <text class="signal-text" :style="{ color: signal.color }">{{ signal.text }}</text>
          <text class="signal-desc">{{ signalDesc }}</text>
        </view>
      </view>
      
      <!-- 指标详情 -->
      <view class="indicators">
        <view class="indicator-item">
          <text class="indicator-label">MA信号</text>
          <text class="indicator-value" :class="indicators.ma.bullish ? 'color-up' : 'color-down'">
            {{ indicators.ma.bullish ? '多头' : '空头' }}
          </text>
        </view>
        <view class="indicator-item">
          <text class="indicator-label">MACD信号</text>
          <text class="indicator-value" :class="indicators.macd.bullish ? 'color-up' : 'color-down'">
            {{ indicators.macd.bullish ? '看涨' : '看跌' }}
          </text>
        </view>
        <view class="indicator-item">
          <text class="indicator-label">RSI信号</text>
          <text class="indicator-value" :class="indicators.rsi.oversold ? 'color-up' : indicators.rsi.overbought ? 'color-down' : 'color-flat'">
            {{ indicators.rsi.oversold ? '超卖' : indicators.rsi.overbought ? '超买' : '中性' }}
          </text>
        </view>
        <view class="indicator-item">
          <text class="indicator-label">估值信号</text>
          <text class="indicator-value" :class="indicators.valuation.level === 'undervalued' ? 'color-up' : 'color-down'">
            {{ indicators.valuation.text }}
          </text>
        </view>
      </view>
    </view>
    
    <!-- 基金详情 -->
    <view class="detail-section">
      <view class="section-header">
        <text class="section-title">基金信息</text>
      </view>
      
      <view class="detail-card">
        <view class="detail-row">
          <text class="detail-label">基金类型</text>
          <text class="detail-value">{{ fundType }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">成立日期</text>
          <text class="detail-value">{{ establishDate }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">基金规模</text>
          <text class="detail-value">{{ fundSize }}亿</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">基金经理</text>
          <text class="detail-value">{{ manager }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">管理费率</text>
          <text class="detail-value">{{ managementFee }}%</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">托管费率</text>
          <text class="detail-value">{{ custodyFee }}%</text>
        </view>
      </view>
    </view>
    
    <!-- 历史净值 -->
    <view class="history-section">
      <view class="section-header">
        <text class="section-title">历史净值</text>
      </view>
      
      <view class="history-list">
        <view class="history-header">
          <text class="history-date">日期</text>
          <text class="history-nav">单位净值</text>
          <text class="history-total">累计净值</text>
          <text class="history-change">日增长率</text>
        </view>
        <view 
          class="history-item" 
          v-for="item in navHistory" 
          :key="item.date"
        >
          <text class="history-date">{{ item.date }}</text>
          <text class="history-nav">{{ item.nav.toFixed(4) }}</text>
          <text class="history-total">{{ item.totalNav.toFixed(4) }}</text>
          <text class="history-change" :class="getChangeClass(item.dayChange)">
            {{ item.dayChange > 0 ? '+' : '' }}{{ item.dayChange }}%
          </text>
        </view>
      </view>
    </view>
    
    <!-- 免责声明 -->
    <view class="disclaimer">
      <text class="disclaimer-text">* 本页面数据仅供参考，不构成投资建议。基金投资有风险，入市需谨慎。</text>
    </view>
  </view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { generateSignal } from '@/utils/signal'

export default {
  data() {
    return {
      fundCode: '',
      fundName: '',
      fundType: '股票型',
      nav: 1.5678,
      dayChange: 1.25,
      establishDate: '2003-01-15',
      fundSize: 125.6,
      manager: '张三',
      managementFee: 1.50,
      custodyFee: 0.25,
      signalScore: 72,
      indicators: {
        ma: { bullish: true },
        macd: { bullish: true },
        rsi: { oversold: false, overbought: false, value: 45 },
        valuation: { level: 'neutral', text: '估值适中' }
      },
      navHistory: [
        { date: '2024-01-15', nav: 1.5678, totalNav: 3.2456, dayChange: 1.25 },
        { date: '2024-01-14', nav: 1.5485, totalNav: 3.2263, dayChange: -0.56 },
        { date: '2024-01-13', nav: 1.5572, totalNav: 3.2350, dayChange: 0.89 },
        { date: '2024-01-12', nav: 1.5434, totalNav: 3.2212, dayChange: 0.32 },
        { date: '2024-01-11', nav: 1.5385, totalNav: 3.2163, dayChange: -1.12 }
      ]
    }
  },
  
  computed: {
    ...mapGetters('watchlist', ['isInWatchlist']),
    
    isWatched() {
      return this.isInWatchlist(this.fundCode)
    },
    
    signal() {
      return generateSignal(this.signalScore)
    },
    
    signalDesc() {
      if (this.signalScore >= 80) return '建议积极建仓'
      if (this.signalScore >= 65) return '建议适当买入'
      if (this.signalScore >= 45) return '建议继续持有'
      if (this.signalScore >= 30) return '建议适当减仓'
      return '建议尽快离场'
    }
  },
  
  onLoad(options) {
    this.fundCode = options.code || ''
    this.fundName = options.name || ''
    this.initData()
  },
  
  methods: {
    ...mapActions('watchlist', ['addToWatchlist', 'removeFromWatchlist']),
    
    async initData() {
      // 加载基金详情
      await this.loadFundDetail()
    },
    
    async loadFundDetail() {
      // 调用云函数获取基金详情
    },
    
    getChangeClass(change) {
      if (!change || change === 0) return 'color-flat'
      if (change > 0) return 'color-up'
      return 'color-down'
    },
    
    async toggleWatchlist() {
      if (this.isWatched) {
        await this.removeFromWatchlist(this.fundCode)
      } else {
        await this.addToWatchlist({
          fundCode: this.fundCode,
          fundName: this.fundName
        })
      }
    },
    
    showAddPortfolio() {
      uni.navigateTo({
        url: `/pages/portfolio/add?code=${this.fundCode}&name=${this.fundName}`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
}

.fund-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 16rpx;
  padding: 32rpx;
  color: #ffffff;
  margin-bottom: 20rpx;
  
  .fund-info {
    margin-bottom: 24rpx;
    
    .fund-name {
      font-size: 36rpx;
      font-weight: 600;
      display: block;
    }
    
    .fund-code {
      font-size: 26rpx;
      opacity: 0.8;
      display: block;
      margin-top: 8rpx;
    }
    
    .fund-type {
      font-size: 24rpx;
      background-color: rgba(255, 255, 255, 0.2);
      padding: 4rpx 16rpx;
      border-radius: 4rpx;
      display: inline-block;
      margin-top: 12rpx;
    }
  }
  
  .fund-nav {
    .nav-label {
      font-size: 24rpx;
      opacity: 0.8;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .nav-value {
      font-size: 48rpx;
      font-weight: 600;
      display: block;
    }
    
    .nav-change {
      font-size: 28rpx;
      display: block;
      margin-top: 8rpx;
    }
  }
}

.action-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
  
  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
    border-radius: 12rpx;
    padding: 20rpx;
    
    .action-icon {
      font-size: 32rpx;
      margin-right: 8rpx;
    }
    
    .action-text {
      font-size: 28rpx;
      color: #333333;
    }
    
    &.primary {
      background-color: #1890ff;
      
      .action-text {
        color: #ffffff;
      }
    }
  }
}

.signal-section {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.section-header {
  margin-bottom: 20rpx;
  
  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333333;
  }
}

.signal-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
  
  .signal-score {
    text-align: center;
    margin-right: 32rpx;
    
    .score-value {
      font-size: 56rpx;
      font-weight: 600;
      display: block;
    }
    
    .score-label {
      font-size: 22rpx;
      color: #999999;
      display: block;
    }
  }
  
  .signal-info {
    flex: 1;
    
    .signal-text {
      font-size: 32rpx;
      font-weight: 500;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .signal-desc {
      font-size: 24rpx;
      color: #666666;
    }
  }
}

.indicators {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  
  .indicator-item {
    background-color: #f8f8f8;
    border-radius: 8rpx;
    padding: 16rpx;
    
    .indicator-label {
      font-size: 22rpx;
      color: #999999;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .indicator-value {
      font-size: 26rpx;
      font-weight: 500;
    }
  }
}

.detail-section {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.detail-card {
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-size: 26rpx;
      color: #999999;
    }
    
    .detail-value {
      font-size: 26rpx;
      color: #333333;
    }
  }
}

.history-section {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.history-list {
  .history-header {
    display: flex;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #eeeeee;
    
    text {
      flex: 1;
      font-size: 24rpx;
      color: #999999;
      text-align: center;
    }
  }
  
  .history-item {
    display: flex;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    text {
      flex: 1;
      font-size: 24rpx;
      color: #333333;
      text-align: center;
    }
  }
}

.disclaimer {
  padding: 24rpx;
  
  .disclaimer-text {
    font-size: 22rpx;
    color: #999999;
    line-height: 1.6;
  }
}

.color-up {
  color: #ff4d4f;
}

.color-down {
  color: #52c41a;
}

.color-flat {
  color: #999999;
}
</style>
