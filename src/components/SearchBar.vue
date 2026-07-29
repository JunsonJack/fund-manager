<template>
  <view class="search-bar">
    <view class="search-input-wrap">
      <text class="search-icon">搜索</text>
      <input 
        class="search-input" 
        type="text" 
        :value="value"
        :placeholder="placeholder"
        confirm-type="search"
        @input="handleInput"
        @confirm="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <text 
        class="clear-icon" 
        v-if="value"
        @click="handleClear"
      >×</text>
    </view>
    
    <text class="cancel-btn" v-if="showCancel" @click="handleCancel">取消</text>
  </view>
</template>

<script>
export default {
  name: 'SearchBar',
  
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '搜索基金代码/名称'
    },
    showCancel: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      isFocused: false
    }
  },
  
  methods: {
    handleInput(e) {
      this.$emit('input', e.detail.value)
      this.$emit('change', e.detail.value)
    },
    
    handleSearch() {
      this.$emit('search', this.value)
    },
    
    handleFocus() {
      this.isFocused = true
      this.$emit('focus')
    },
    
    handleBlur() {
      this.isFocused = false
      this.$emit('blur')
    },
    
    handleClear() {
      this.$emit('input', '')
      this.$emit('change', '')
      this.$emit('clear')
    },
    
    handleCancel() {
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 32rpx;
  padding: 16rpx 24rpx;
  
  .search-icon {
    font-size: 28rpx;
    color: #999999;
    margin-right: 12rpx;
  }
  
  .search-input {
    flex: 1;
    font-size: 28rpx;
    color: #333333;
  }
  
  .clear-icon {
    font-size: 32rpx;
    color: #cccccc;
    padding: 8rpx;
  }
}

.cancel-btn {
  font-size: 28rpx;
  color: #E8453C;
  margin-left: 20rpx;
}
</style>
