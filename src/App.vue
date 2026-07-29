<script>
import { VERSION_TEXT } from './config/version'

export default {
  onLaunch() {
    console.log('App Launch')

    // 存储版本号到本地
    try {
      uni.setStorageSync('app_version', VERSION_TEXT)
    } catch (e) {}

    // #ifdef MP-WEIXIN
    // 初始化微信云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloudbase-d6g5dk55k85072271',
        traceUser: true,
      })
      console.log('云开发初始化成功')
    }
    // #endif

    // 检查登录状态
    this.checkLoginStatus()
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
  methods: {
    checkLoginStatus() {
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo) {
        console.log('用户未登录')
      }
    }
  }
}
</script>

<style lang="scss">
@import './uni.scss';

/* 全局样式 */
page {
  background-color: #FFF5F5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: #333333;
  line-height: 1.5;
}

/* 容器样式 */
.container {
  padding: 20rpx;
}

/* 卡片样式 */
.card {
  background-color: rgba(255, 255, 255, 0.88);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(232, 69, 60, 0.08);
  backdrop-filter: blur(10px);
}

/* 涨跌颜色 */
.color-up {
  color: #ff4d4f;
}

.color-down {
  color: #52c41a;
}

.color-flat {
  color: #999999;
}

/* 按钮样式 */
.btn-primary {
  background-color: #E8453C;
  color: #ffffff;
  border-radius: 8rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
  text-align: center;
}

.btn-secondary {
  background-color: #FFF1F0;
  color: #E8453C;
  border-radius: 8rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
  text-align: center;
}

/* 分割线 */
.divider {
  height: 1rpx;
  background-color: #FFE8E6;
  margin: 20rpx 0;
}

/* 文字样式 */
.text-bold {
  font-weight: 600;
}

.text-gray {
  color: #999999;
}

.text-small {
  font-size: 24rpx;
}

.text-large {
  font-size: 32rpx;
}

/* Flex布局 */
.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

/* ==================== 安全区域适配 ==================== */

/* 底部安全区域 - 全覆盖 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 顶部安全区域 */
.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

/* 全部安全区域 */
.safe-area-all {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 底部固定栏 - 适配安全区域 */
.fixed-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  z-index: 999;
}

/* TabBar 安全区域 */
.tabbar-wrapper {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 底部间距容器 - 页面内容需要留出底部空间 */
.page-bottom-space {
  height: calc(120rpx + constant(safe-area-inset-bottom));
  height: calc(120rpx + env(safe-area-inset-bottom));
}

/* 按钮组底部安全区域 */
.btn-group-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 -2rpx 10rpx rgba(232, 69, 60, 0.08);
  z-index: 999;
}

/* 列表底部安全区域 */
.list-bottom-safe {
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

/* 输入框底部安全区域 */
.input-bottom-safe {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

/* 浮动按钮底部安全区域 */
.fab-bottom {
  position: fixed;
  right: 32rpx;
  bottom: calc(32rpx + constant(safe-area-inset-bottom));
  bottom: calc(32rpx + env(safe-area-inset-bottom));
  z-index: 999;
}
</style>
