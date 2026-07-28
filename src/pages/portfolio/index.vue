<template>
  <view class="page-container">
    <!-- 资产概览 -->
    <view class="overview-card">
      <view class="overview-header">
        <text class="overview-title">总资产(元)</text>
        <text class="eye-icon" @click="toggleShowAmount">
          {{ showAmount ? '👁' : '👁‍🗨' }}
        </text>
      </view>
      <text class="total-assets">{{ showAmount ? formatMoney(totalAssets) : '****' }}</text>
      
      <view class="overview-data">
        <view class="data-item">
          <text class="data-label">今日盈亏</text>
          <text class="data-value" :class="getChangeClass(todayProfit)">
            {{ showAmount ? (todayProfit > 0 ? '+' : '') + formatMoney(todayProfit) : '****' }}
          </text>
        </view>
        <view class="data-item">
          <text class="data-label">累计收益</text>
          <text class="data-value" :class="getChangeClass(totalProfit)">
            {{ showAmount ? (totalProfit > 0 ? '+' : '') + formatMoney(totalProfit) : '****' }}
          </text>
        </view>
        <view class="data-item">
          <text class="data-label">收益率</text>
          <text class="data-value" :class="getChangeClass(totalReturnRate)">
            {{ showAmount ? (totalReturnRate > 0 ? '+' : '') + totalReturnRate + '%' : '****' }}
          </text>
        </view>
      </view>
    </view>
    
    <!-- 持仓列表 -->
    <view class="portfolio-section">
      <view class="section-header">
        <text class="section-title">持仓明细</text>
        <text class="section-action" @click="showAddDialog">+ 添加</text>
      </view>
      
      <view class="portfolio-list" v-if="portfolios.length > 0">
        <view 
          class="portfolio-item" 
          v-for="item in portfolios" 
          :key="item.fundCode"
          @click="goToFundDetail(item)"
        >
          <view class="fund-info">
            <text class="fund-name">{{ item.fundName }}</text>
            <text class="fund-code">{{ item.fundCode }}</text>
          </view>
          
          <view class="fund-data">
            <view class="data-row">
              <text class="data-label">持有份额</text>
              <text class="data-value">{{ item.shares.toFixed(2) }}</text>
            </view>
            <view class="data-row">
              <text class="data-label">成本价</text>
              <text class="data-value">{{ item.cost.toFixed(4) }}</text>
            </view>
            <view class="data-row">
              <text class="data-label">现价</text>
              <text class="data-value">{{ item.nav.toFixed(4) }}</text>
            </view>
          </view>
          
          <view class="profit-info">
            <text class="profit-value" :class="getChangeClass(item.profit)">
              {{ item.profit > 0 ? '+' : '' }}{{ formatMoney(item.profit) }}
            </text>
            <text class="profit-rate" :class="getChangeClass(item.profitRate)">
              {{ item.profitRate > 0 ? '+' : '' }}{{ item.profitRate.toFixed(2) }}%
            </text>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-else>
        <text class="empty-text">暂无持仓</text>
        <text class="empty-hint">点击右上角添加持仓基金</text>
      </view>
    </view>
    
    <!-- 持仓分析 -->
    <view class="analysis-section" v-if="portfolios.length > 0">
      <view class="section-header">
        <text class="section-title">持仓分析</text>
      </view>
      
      <view class="analysis-card">
        <view class="analysis-item" v-for="(data, type) in portfolioByType" :key="type">
          <view class="type-info">
            <text class="type-name">{{ type }}</text>
            <text class="type-count">{{ data.count }}只</text>
          </view>
          <view class="type-bar">
            <view class="bar-fill" :style="{ width: (data.amount / totalAssets * 100) + '%' }"></view>
          </view>
          <text class="type-amount">{{ formatMoney(data.amount) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  data() {
    return {
      showAmount: true
    }
  },
  
  computed: {
    ...mapGetters('portfolio', [
      'getPortfolios',
      'getTotalAssets',
      'getTotalProfit',
      'getTotalReturnRate',
      'getTodayProfit',
      'getPortfolioByType'
    ]),
    
    portfolios() {
      return this.getPortfolios
    },
    
    totalAssets() {
      return this.getTotalAssets
    },
    
    totalProfit() {
      return this.getTotalProfit
    },
    
    totalReturnRate() {
      return this.getTotalReturnRate
    },
    
    todayProfit() {
      return this.getTodayProfit
    },
    
    portfolioByType() {
      return this.getPortfolioByType
    }
  },
  
  onLoad() {
    this.initData()
  },
  
  onPullDownRefresh() {
    this.refreshPortfolios().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  methods: {
    ...mapActions('portfolio', [
      'loadPortfolios',
      'refreshPortfolios'
    ]),
    
    async initData() {
      await this.loadPortfolios()
    },
    
    toggleShowAmount() {
      this.showAmount = !this.showAmount
    },
    
    formatMoney(value) {
      if (typeof value !== 'number') return '0.00'
      return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },
    
    getChangeClass(value) {
      if (!value || value === 0) return 'color-flat'
      if (value > 0) return 'color-up'
      return 'color-down'
    },
    
    goToFundDetail(fund) {
      uni.navigateTo({
        url: `/pages/fund-detail/index?code=${fund.fundCode}&name=${fund.fundName}`
      })
    },
    
    showAddDialog() {
      uni.navigateTo({
        url: '/pages/portfolio/add'
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

.overview-card {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 16rpx;
  padding: 32rpx;
  color: #ffffff;
  margin-bottom: 20rpx;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  
  .overview-title {
    font-size: 26rpx;
    opacity: 0.8;
  }
  
  .eye-icon {
    font-size: 32rpx;
  }
}

.total-assets {
  font-size: 56rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 32rpx;
}

.overview-data {
  display: flex;
  justify-content: space-between;
  
  .data-item {
    text-align: center;
    
    .data-label {
      font-size: 24rpx;
      opacity: 0.8;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .data-value {
      font-size: 28rpx;
      font-weight: 500;
    }
  }
}

.portfolio-section {
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
  
  .section-action {
    font-size: 26rpx;
    color: #1890ff;
  }
}

.portfolio-list {
  .portfolio-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .fund-info {
      width: 200rpx;
      
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
    
    .fund-data {
      flex: 1;
      padding: 0 20rpx;
      
      .data-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .data-label {
          font-size: 24rpx;
          color: #999999;
        }
        
        .data-value {
          font-size: 24rpx;
          color: #333333;
        }
      }
    }
    
    .profit-info {
      text-align: right;
      width: 180rpx;
      
      .profit-value {
        font-size: 28rpx;
        font-weight: 500;
        display: block;
      }
      
      .profit-rate {
        font-size: 24rpx;
        display: block;
        margin-top: 4rpx;
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  
  .empty-text {
    font-size: 30rpx;
    color: #999999;
    margin-bottom: 8rpx;
  }
  
  .empty-hint {
    font-size: 24rpx;
    color: #cccccc;
  }
}

.analysis-section {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.analysis-card {
  .analysis-item {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .type-info {
      width: 150rpx;
      
      .type-name {
        font-size: 26rpx;
        color: #333333;
        display: block;
      }
      
      .type-count {
        font-size: 22rpx;
        color: #999999;
        display: block;
      }
    }
    
    .type-bar {
      flex: 1;
      height: 16rpx;
      background-color: #f5f5f5;
      border-radius: 8rpx;
      margin: 0 20rpx;
      overflow: hidden;
      
      .bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #1890ff, #36cfc9);
        border-radius: 8rpx;
      }
    }
    
    .type-amount {
      width: 150rpx;
      text-align: right;
      font-size: 26rpx;
      color: #333333;
    }
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
