<template>
  <view class="page-container">
    <!-- 信号概览 -->
    <view class="overview-section">
      <view class="overview-card">
        <text class="overview-title">综合信号强度</text>
        <view class="signal-circle" :style="{ borderColor: currentSignal.color }">
          <text class="signal-score">{{ currentScore }}</text>
        </view>
        <text class="signal-text" :style="{ color: currentSignal.color }">
          {{ currentSignal.text }}
        </text>
      </view>
      
      <view class="overview-cards">
        <view class="mini-card">
          <text class="mini-title">买入信号</text>
          <text class="mini-value color-up">{{ buyCount }}</text>
        </view>
        <view class="mini-card">
          <text class="mini-title">持有信号</text>
          <text class="mini-value color-flat">{{ holdCount }}</text>
        </view>
        <view class="mini-card">
          <text class="mini-title">卖出信号</text>
          <text class="mini-value color-down">{{ sellCount }}</text>
        </view>
      </view>
    </view>
    
    <!-- 信号列表 -->
    <view class="signal-section">
      <view class="section-header">
        <text class="section-title">基金信号</text>
        <view class="filter-bar">
          <text 
            class="filter-item" 
            :class="{ active: currentFilter === 'all' }"
            @click="setFilter('all')"
          >全部</text>
          <text 
            class="filter-item" 
            :class="{ active: currentFilter === 'buy' }"
            @click="setFilter('buy')"
          >买入</text>
          <text 
            class="filter-item" 
            :class="{ active: currentFilter === 'hold' }"
            @click="setFilter('hold')"
          >持有</text>
          <text 
            class="filter-item" 
            :class="{ active: currentFilter === 'sell' }"
            @click="setFilter('sell')"
          >卖出</text>
        </view>
      </view>
      
      <view class="signal-list">
        <view 
          class="signal-item" 
          v-for="item in filteredSignals" 
          :key="item.fundCode"
          @click="goToFundDetail(item)"
        >
          <view class="fund-info">
            <text class="fund-name">{{ item.fundName }}</text>
            <text class="fund-code">{{ item.fundCode }}</text>
          </view>
          
          <view class="signal-badge" :style="{ backgroundColor: item.signal.color + '20', color: item.signal.color }">
            <text class="signal-text">{{ item.signal.text }}</text>
          </view>
          
          <view class="signal-score">
            <text class="score-value" :style="{ color: item.signal.color }">{{ item.score }}</text>
            <text class="score-label">综合评分</text>
          </view>
        </view>
        
        <view class="empty-state" v-if="filteredSignals.length === 0">
          <text class="empty-text">暂无信号数据</text>
        </view>
      </view>
    </view>
    
    <!-- 指标说明 -->
    <view class="legend-section">
      <view class="section-header">
        <text class="section-title">指标说明</text>
      </view>
      
      <view class="legend-card">
        <view class="legend-item">
          <view class="legend-color" style="background-color: #ff4d4f"></view>
          <text class="legend-text">强烈买入 (80-100分)</text>
        </view>
        <view class="legend-item">
          <view class="legend-color" style="background-color: #faad14"></view>
          <text class="legend-text">建议买入 (65-79分)</text>
        </view>
        <view class="legend-item">
          <view class="legend-color" style="background-color: #52c41a"></view>
          <text class="legend-text">继续持有 (45-64分)</text>
        </view>
        <view class="legend-item">
          <view class="legend-color" style="background-color: #faad14"></view>
          <text class="legend-text">建议卖出 (30-44分)</text>
        </view>
        <view class="legend-item">
          <view class="legend-color" style="background-color: #ff4d4f"></view>
          <text class="legend-text">强烈卖出 (0-29分)</text>
        </view>
      </view>
      
      <view class="disclaimer">
        <text class="disclaimer-text">* 信号仅供参考，不构成投资建议</text>
      </view>
    </view>
  </view>
</template>

<script>
import { mapGetters } from 'vuex'
import { generateSignal, SIGNAL_TYPES } from '@/utils/signal'

export default {
  data() {
    return {
      currentFilter: 'all',
      signals: [
        { fundCode: '000001', fundName: '华夏成长', score: 85 },
        { fundCode: '000002', fundName: '嘉实增长', score: 68 },
        { fundCode: '000003', fundName: '南方稳健', score: 52 },
        { fundCode: '000004', fundName: '易方达蓝筹', score: 35 },
        { fundCode: '000005', fundName: '招商中证白酒', score: 15 }
      ]
    }
  },
  
  computed: {
    ...mapGetters('watchlist', ['getWatchlist']),
    
    currentScore() {
      if (this.signals.length === 0) return 50
      const sum = this.signals.reduce((acc, item) => acc + item.score, 0)
      return Math.round(sum / this.signals.length)
    },
    
    currentSignal() {
      return generateSignal(this.currentScore)
    },
    
    buyCount() {
      return this.signals.filter(s => s.score >= 65).length
    },
    
    holdCount() {
      return this.signals.filter(s => s.score >= 45 && s.score < 65).length
    },
    
    sellCount() {
      return this.signals.filter(s => s.score < 45).length
    },
    
    filteredSignals() {
      if (this.currentFilter === 'all') {
        return this.signals.map(s => ({
          ...s,
          signal: generateSignal(s.score)
        }))
      }
      
      return this.signals
        .filter(s => {
          if (this.currentFilter === 'buy') return s.score >= 65
          if (this.currentFilter === 'hold') return s.score >= 45 && s.score < 65
          if (this.currentFilter === 'sell') return s.score < 45
          return true
        })
        .map(s => ({
          ...s,
          signal: generateSignal(s.score)
        }))
    }
  },
  
  onLoad() {
    this.initData()
  },
  
  onPullDownRefresh() {
    this.refreshSignals().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  methods: {
    setFilter(filter) {
      this.currentFilter = filter
    },
    
    async initData() {
      // 从自选基金获取信号
      await this.loadSignals()
    },
    
    async loadSignals() {
      // 模拟加载信号数据
      // 实际应调用云函数获取
    },
    
    async refreshSignals() {
      await this.loadSignals()
    },
    
    goToFundDetail(fund) {
      uni.navigateTo({
        url: `/pages/fund-detail/index?code=${fund.fundCode}&name=${fund.fundName}`
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

.overview-section {
  margin-bottom: 20rpx;
}

.overview-card {
  background: linear-gradient(135deg, #E8453C 0%, #CF1322 100%);
  border-radius: 16rpx;
  padding: 32rpx;
  text-align: center;
  color: #ffffff;
  margin-bottom: 16rpx;
  
  .overview-title {
    font-size: 26rpx;
    opacity: 0.8;
    display: block;
    margin-bottom: 24rpx;
  }
  
  .signal-circle {
    width: 200rpx;
    height: 200rpx;
    border-radius: 50%;
    border: 8rpx solid;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24rpx;
    background-color: rgba(255, 255, 255, 0.1);
    
    .signal-score {
      font-size: 64rpx;
      font-weight: 600;
    }
  }
  
  .signal-text {
    font-size: 32rpx;
    font-weight: 500;
  }
}

.overview-cards {
  display: flex;
  gap: 16rpx;
  
  .mini-card {
    flex: 1;
    background-color: #ffffff;
    border-radius: 12rpx;
    padding: 20rpx;
    text-align: center;
    
    .mini-title {
      font-size: 24rpx;
      color: #999999;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .mini-value {
      font-size: 36rpx;
      font-weight: 600;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  
  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333333;
  }
}

.filter-bar {
  display: flex;
  gap: 16rpx;
  
  .filter-item {
    font-size: 24rpx;
    color: #666666;
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    
    &.active {
      color: #E8453C;
      background-color: #FFF1F0;
    }
  }
}

.signal-list {
  .signal-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .fund-info {
      flex: 1;
      
      .fund-name {
        font-size: 28rpx;
        font-weight: 500;
        color: #333333;
        display: block;
      }
      
      .fund-code {
        font-size: 22rpx;
        color: #999999;
        margin-top: 4rpx;
        display: block;
      }
    }
    
    .signal-badge {
      padding: 8rpx 20rpx;
      border-radius: 20rpx;
      margin-right: 20rpx;
      
      .signal-text {
        font-size: 24rpx;
        font-weight: 500;
      }
    }
    
    .signal-score {
      text-align: right;
      
      .score-value {
        font-size: 32rpx;
        font-weight: 600;
        display: block;
      }
      
      .score-label {
        font-size: 20rpx;
        color: #999999;
        display: block;
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 48rpx;
  
  .empty-text {
    font-size: 28rpx;
    color: #999999;
  }
}

.legend-section {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.legend-card {
  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .legend-color {
      width: 24rpx;
      height: 24rpx;
      border-radius: 4rpx;
      margin-right: 16rpx;
    }
    
    .legend-text {
      font-size: 26rpx;
      color: #666666;
    }
  }
}

.disclaimer {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
  
  .disclaimer-text {
    font-size: 22rpx;
    color: #999999;
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
