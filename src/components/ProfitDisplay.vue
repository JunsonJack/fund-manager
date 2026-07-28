<template>
  <view class="profit-display">
    <view class="profit-header">
      <text class="profit-label">{{ label }}</text>
      <text class="profit-value" :class="valueClass">
        {{ displayValue }}
      </text>
    </view>
    
    <view class="profit-detail" v-if="showDetail">
      <view class="detail-item">
        <text class="detail-label">持有份额</text>
        <text class="detail-value">{{ shares.toFixed(2) }}</text>
      </view>
      <view class="detail-item">
        <text class="detail-label">成本金额</text>
        <text class="detail-value">{{ formatMoney(totalCost) }}</text>
      </view>
      <view class="detail-item">
        <text class="detail-label">当前市值</text>
        <text class="detail-value">{{ formatMoney(currentValue) }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ProfitDisplay',
  
  props: {
    label: {
      type: String,
      default: '盈亏'
    },
    value: {
      type: Number,
      default: 0
    },
    rate: {
      type: Number,
      default: 0
    },
    showDetail: {
      type: Boolean,
      default: false
    },
    shares: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    currentValue: {
      type: Number,
      default: 0
    },
    showAmount: {
      type: Boolean,
      default: true
    }
  },
  
  computed: {
    valueClass() {
      if (this.value > 0) return 'color-up'
      if (this.value < 0) return 'color-down'
      return 'color-flat'
    },
    
    displayValue() {
      if (!this.showAmount) return '****'
      
      const profitText = this.formatMoney(this.value)
      const rateText = (this.rate > 0 ? '+' : '') + this.rate.toFixed(2) + '%'
      
      return profitText + ' (' + rateText + ')'
    }
  },
  
  methods: {
    formatMoney(value) {
      if (typeof value !== 'number') return '0.00'
      const prefix = value > 0 ? '+' : ''
      return prefix + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  }
}
</script>

<style lang="scss" scoped>
.profit-display {
  background-color: #f8f8f8;
  border-radius: 12rpx;
  padding: 24rpx;
}

.profit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .profit-label {
    font-size: 26rpx;
    color: #666666;
  }
  
  .profit-value {
    font-size: 28rpx;
    font-weight: 500;
  }
}

.profit-detail {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eeeeee;
  
  .detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .detail-label {
      font-size: 24rpx;
      color: #999999;
    }
    
    .detail-value {
      font-size: 24rpx;
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
