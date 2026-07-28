<template>
  <view class="page-container">
    <!-- 用户信息 -->
    <view class="user-section">
      <view class="user-avatar">
        <image class="avatar" :src="userInfo.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
      </view>
      <view class="user-info">
        <text class="user-name">{{ userInfo.nickName || '未登录' }}</text>
        <text class="user-id" v-if="userInfo.openid">ID: {{ userInfo.openid.slice(0, 8) }}...</text>
      </view>
      <view class="login-btn" v-if="!isLoggedIn" @click="login">
        <text>登录</text>
      </view>
    </view>
    
    <!-- 设置选项 -->
    <view class="settings-section">
      <view class="settings-group">
        <view class="settings-item" @click="toggleNotify">
          <text class="item-label">信号推送</text>
          <switch class="item-switch" :checked="settings.notifyEnabled" color="#1890ff" />
        </view>
        <view class="settings-item" @click="showRiskLevel">
          <text class="item-label">风险偏好</text>
          <view class="item-value">
            <text>{{ riskLevelText }}</text>
            <text class="arrow">›</text>
          </view>
        </view>
        <view class="settings-item" @click="showThemePicker">
          <text class="item-label">主题设置</text>
          <view class="item-value">
            <text>{{ settings.theme === 'light' ? '浅色' : '深色' }}</text>
            <text class="arrow">›</text>
          </view>
        </view>
      </view>
      
      <view class="settings-group">
        <view class="settings-item" @click="clearCache">
          <text class="item-label">清除缓存</text>
          <view class="item-value">
            <text>{{ cacheSize }}</text>
            <text class="arrow">›</text>
          </view>
        </view>
        <view class="settings-item" @click="checkUpdate">
          <text class="item-label">检查更新</text>
          <view class="item-value">
            <text>v1.0.0</text>
            <text class="arrow">›</text>
          </view>
        </view>
        <view class="settings-item" @click="showAbout">
          <text class="item-label">关于我们</text>
          <view class="item-value">
            <text class="arrow">›</text>
          </view>
        </view>
      </view>
      
      <view class="settings-group">
        <view class="settings-item" @click="showFeedback">
          <text class="item-label">意见反馈</text>
          <view class="item-value">
            <text class="arrow">›</text>
          </view>
        </view>
        <view class="settings-item" @click="showDisclaimer">
          <text class="item-label">免责声明</text>
          <view class="item-value">
            <text class="arrow">›</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 退出登录 -->
    <view class="logout-btn" v-if="isLoggedIn" @click="logout">
      <text>退出登录</text>
    </view>
  </view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  data() {
    return {
      cacheSize: '12.5MB'
    }
  },
  
  computed: {
    ...mapGetters('user', ['getUserInfo', 'isLoggedIn', 'getSettings']),
    
    userInfo() {
      return this.getUserInfo || {}
    },
    
    settings() {
      return this.getSettings
    },
    
    riskLevelText() {
      const levels = {
        conservative: '保守型',
        moderate: '稳健型',
        aggressive: '进取型'
      }
      return levels[this.settings.riskLevel] || '稳健型'
    }
  },
  
  onLoad() {
    this.initData()
  },
  
  methods: {
    ...mapActions('user', ['login', 'logout', 'updateSettings']),
    
    async initData() {
      // 获取缓存大小
      this.getCacheSize()
    },
    
    getCacheSize() {
      try {
        const info = uni.getStorageInfoSync()
        this.cacheSize = (info.currentSize / 1024).toFixed(1) + 'MB'
      } catch (e) {
        this.cacheSize = '0MB'
      }
    },
    
    toggleNotify() {
      this.updateSettings({
        notifyEnabled: !this.settings.notifyEnabled
      })
      uni.showToast({
        title: this.settings.notifyEnabled ? '已开启推送' : '已关闭推送',
        icon: 'none'
      })
    },
    
    showRiskLevel() {
      uni.showActionSheet({
        itemList: ['保守型', '稳健型', '进取型'],
        success: (res) => {
          const levels = ['conservative', 'moderate', 'aggressive']
          this.updateSettings({ riskLevel: levels[res.tapIndex] })
        }
      })
    },
    
    showThemePicker() {
      uni.showActionSheet({
        itemList: ['浅色主题', '深色主题'],
        success: (res) => {
          const themes = ['light', 'dark']
          this.updateSettings({ theme: themes[res.tapIndex] })
        }
      })
    },
    
    clearCache() {
      uni.showModal({
        title: '确认清除',
        content: '确定要清除所有缓存数据吗？',
        success: (res) => {
          if (res.confirm) {
            uni.clearStorageSync()
            this.cacheSize = '0MB'
            uni.showToast({ title: '清除成功', icon: 'success' })
          }
        }
      })
    },
    
    checkUpdate() {
      uni.showToast({ title: '已是最新版本', icon: 'none' })
    },
    
    showAbout() {
      uni.showModal({
        title: '关于我们',
        content: '基金管理小程序 v1.0.0\n一款专业的基金管理工具，提供市场行情、自选基金、持仓管理和波段信号等功能。\n\n免责声明：本应用提供的信息仅供参考，不构成任何投资建议。基金投资有风险，入市需谨慎。',
        showCancel: false
      })
    },
    
    showFeedback() {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    },
    
    showDisclaimer() {
      uni.showModal({
        title: '免责声明',
        content: '本应用提供的所有信息、数据和信号仅供参考，不构成任何投资建议或投资决策依据。\n\n基金投资有风险，投资需谨慎。过往业绩不代表未来表现。\n\n本应用不对因使用本应用信息而导致的任何损失承担责任。',
        showCancel: false
      })
    },
    
    async login() {
      try {
        await this.login()
        uni.showToast({ title: '登录成功', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: '登录失败', icon: 'none' })
      }
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

.user-section {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 16rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  color: #ffffff;
  
  .user-avatar {
    margin-right: 24rpx;
    
    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
  
  .user-info {
    flex: 1;
    
    .user-name {
      font-size: 32rpx;
      font-weight: 600;
      display: block;
    }
    
    .user-id {
      font-size: 24rpx;
      opacity: 0.8;
      display: block;
      margin-top: 8rpx;
    }
  }
  
  .login-btn {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 12rpx 32rpx;
    border-radius: 32rpx;
    
    text {
      font-size: 26rpx;
    }
  }
}

.settings-section {
  margin-bottom: 20rpx;
}

.settings-group {
  background-color: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  .item-label {
    font-size: 28rpx;
    color: #333333;
  }
  
  .item-value {
    display: flex;
    align-items: center;
    
    text {
      font-size: 26rpx;
      color: #999999;
    }
    
    .arrow {
      font-size: 32rpx;
      margin-left: 8rpx;
    }
  }
  
  .item-switch {
    transform: scale(0.8);
  }
}

.logout-btn {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx;
  text-align: center;
  margin-top: 40rpx;
  
  text {
    font-size: 28rpx;
    color: #ff4d4f;
  }
}
</style>
