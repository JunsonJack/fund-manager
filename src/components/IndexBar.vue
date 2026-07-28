<template>
  <view class="index-bar">
    <scroll-view scroll-x class="scroll-container">
      <view class="index-list">
        <view 
          class="index-item" 
          v-for="item in indices" 
          :key="item.code"
          @click="handleClick(item)"
        >
          <text class="index-name">{{ item.name }}</text>
          <text class="index-value" :class="changeClass(item.change)">
            {{ item.value.toFixed(2) }}
          </text>
          <text class="index-change" :class="changeClass(item.change)">
            {{ changeText(item) }}
          </text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  name: 'IndexBar',
  
  props: {
    indices: {
      type: Array,
      default: () => []
    }
  },
  
  methods: {
    changeClass(change) {
      if (!change) return 'color-flat'
      if (change > 0) return 'color-up'
      if (change < 0) return 'color-down'
      return 'color-flat'
    },
    
    changeText(item) {
      if (!item.changePercent && item.changePercent !== 0) return '--'
      const change = item.changePercent
      return (change > 0 ? '+' : '') + change.toFixed(2) + '%'
    },
    
    handleClick(item) {
      this.$emit('click', item)
    }
  }
}
</script>

<style lang="scss" scoped>
.index-bar {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 16rpx 0;
  margin-bottom: 20rpx;
}

.scroll-container {
  white-space: nowrap;
}

.index-list {
  display: inline-flex;
  padding: 0 20rpx;
  gap: 24rpx;
}

.index-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 180rpx;
  
  .index-name {
    font-size: 24rpx;
    color: #666666;
    margin-bottom: 8rpx;
  }
  
  .index-value {
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 4rpx;
  }
  
  .index-change {
    font-size: 24rpx;
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
