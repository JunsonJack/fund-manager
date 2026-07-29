<template>
  <view class="fund-card" @click="handleClick">
    <view class="fund-info">
      <text class="fund-name">{{ fund.name }}</text>
      <text class="fund-code">{{ fund.code }}</text>
      <text class="fund-type" v-if="showType">{{ fund.type }}</text>
    </view>
    
    <view class="fund-data">
      <text class="fund-nav">{{ fund.nav ? fund.nav.toFixed(4) : '--' }}</text>
      <text class="fund-change" :class="changeClass">
        {{ changeText }}
      </text>
    </view>
    
    <view class="fund-actions" v-if="showActions">
      <text class="action-btn" @click.stop="handleAdd">
        {{ isInWatchlist ? '已自选' : '+ 自选' }}
      </text>
    </view>
  </view>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'FundCard',
  
  props: {
    fund: {
      type: Object,
      required: true,
      default: () => ({})
    },
    showType: {
      type: Boolean,
      default: false
    },
    showActions: {
      type: Boolean,
      default: false
    }
  },
  
  computed: {
    ...mapGetters('watchlist', ['isInWatchlist']),
    
    changeClass() {
      if (!this.fund.dayChange) return 'color-flat'
      if (this.fund.dayChange > 0) return 'color-up'
      if (this.fund.dayChange < 0) return 'color-down'
      return 'color-flat'
    },
    
    changeText() {
      if (!this.fund.dayChange && this.fund.dayChange !== 0) return '--'
      const change = this.fund.dayChange
      return (change > 0 ? '+' : '') + change.toFixed(2) + '%'
    },
    
    isInWatchlistState() {
      return this.isInWatchlist(this.fund.code)
    }
  },
  
  methods: {
    handleClick() {
      this.$emit('click', this.fund)
    },
    
    handleAdd() {
      this.$emit('add', this.fund)
    }
  }
}
</script>

<style lang="scss" scoped>
.fund-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  
  &:active {
    background-color: #f8f8f8;
  }
}

.fund-info {
  flex: 1;
  
  .fund-name {
    font-size: 28rpx;
    font-weight: 500;
    color: #333333;
    display: block;
    margin-bottom: 4rpx;
  }
  
  .fund-code {
    font-size: 24rpx;
    color: #999999;
    display: block;
    margin-bottom: 4rpx;
  }
  
  .fund-type {
    font-size: 22rpx;
    color: #E8453C;
    background-color: #FFF1F0;
    padding: 4rpx 12rpx;
    border-radius: 4rpx;
    display: inline-block;
  }
}

.fund-data {
  text-align: right;
  margin-right: 20rpx;
  
  .fund-nav {
    font-size: 28rpx;
    font-weight: 500;
    color: #333333;
    display: block;
    margin-bottom: 4rpx;
  }
  
  .fund-change {
    font-size: 26rpx;
    display: block;
  }
}

.fund-actions {
  .action-btn {
    font-size: 24rpx;
    color: #E8453C;
    padding: 8rpx 16rpx;
    border: 1rpx solid #E8453C;
    border-radius: 8rpx;
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
