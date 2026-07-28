<template>
  <view class="signal-badge" :style="badgeStyle">
    <text class="signal-text" :style="{ color: signal.color }">{{ signal.text }}</text>
  </view>
</template>

<script>
import { generateSignal } from '@/utils/signal'

export default {
  name: 'SignalBadge',
  
  props: {
    score: {
      type: Number,
      default: 50
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
  },
  
  computed: {
    signal() {
      return generateSignal(this.score)
    },
    
    badgeStyle() {
      const sizeMap = {
        small: { padding: '4rpx 12rpx', fontSize: '20rpx' },
        medium: { padding: '8rpx 20rpx', fontSize: '24rpx' },
        large: { padding: '12rpx 28rpx', fontSize: '28rpx' }
      }
      
      return {
        backgroundColor: this.signal.color + '15',
        padding: sizeMap[this.size].padding
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.signal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  
  .signal-text {
    font-weight: 500;
  }
}
</style>
