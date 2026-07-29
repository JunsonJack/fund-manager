<template>
  <view class="page-container">
    <!-- 分组标签 -->
    <scroll-view scroll-x class="group-scroll">
      <view class="group-list">
        <text 
          class="group-item" 
          :class="{ active: currentGroup === '全部' }"
          @click="setCurrentGroup('全部')"
        >全部</text>
        <text 
          class="group-item" 
          v-for="group in groups" 
          :key="group"
          :class="{ active: currentGroup === group }"
          @click="setCurrentGroup(group)"
        >{{ group }}</text>
        <text class="group-item add" @click="showAddGroupDialog">+</text>
      </view>
    </scroll-view>
    
    <!-- 自选基金列表 -->
    <view class="watchlist-container">
      <view class="watchlist-header">
        <text class="count">共 {{ watchlist.length }} 只基金</text>
        <text class="edit-btn" @click="toggleEdit">{{ isEditing ? '完成' : '编辑' }}</text>
      </view>
      
      <view class="fund-list" v-if="watchlist.length > 0">
        <view 
          class="fund-item" 
          v-for="item in watchlist" 
          :key="item.fundCode"
          @click="goToFundDetail(item)"
        >
          <view class="fund-info">
            <text class="fund-name">{{ item.fundName }}</text>
            <text class="fund-code">{{ item.fundCode }}</text>
            <text class="fund-group" v-if="item.groupName !== '默认分组'">{{ item.groupName }}</text>
          </view>
          <view class="fund-data">
            <text class="fund-nav">{{ item.nav || '--' }}</text>
            <text class="fund-change" :class="getChangeClass(item.dayChange)">
              {{ item.dayChange ? (item.dayChange > 0 ? '+' : '') + item.dayChange + '%' : '--' }}
            </text>
          </view>
          <view class="fund-actions" v-if="isEditing">
            <text class="delete-btn" @click.stop="removeFromWatchlist(item.fundCode)">删除</text>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-else>
        <text class="empty-icon">+</text>
        <text class="empty-text">暂无自选基金</text>
        <text class="empty-hint">点击下方按钮添加自选</text>
      </view>
    </view>
    
    <!-- 添加按钮 -->
    <view class="add-btn" @click="goToAddFund">
      <text class="add-icon">+</text>
      <text class="add-text">添加自选</text>
    </view>
  </view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  data() {
    return {
      isEditing: false
    }
  },
  
  computed: {
    ...mapGetters('watchlist', [
      'getWatchlist',
      'getGroups',
      'getCurrentGroup'
    ]),
    
    watchlist() {
      return this.getWatchlist
    },
    
    groups() {
      return this.getGroups.filter(g => g !== '全部')
    },
    
    currentGroup() {
      return this.getCurrentGroup
    }
  },
  
  onLoad() {
    this.initData()
  },
  
  onPullDownRefresh() {
    this.refreshWatchlist().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  methods: {
    ...mapActions('watchlist', [
      'loadWatchlist',
      'removeFromWatchlist',
      'setCurrentGroup',
      'addGroup',
      'refreshWatchlist'
    ]),
    
    async initData() {
      await this.loadWatchlist()
    },
    
    toggleEdit() {
      this.isEditing = !this.isEditing
    },
    
    getChangeClass(change) {
      if (!change) return ''
      if (change > 0) return 'color-up'
      if (change < 0) return 'color-down'
      return 'color-flat'
    },
    
    goToFundDetail(fund) {
      if (this.isEditing) return
      uni.navigateTo({
        url: `/pages/fund-detail/index?code=${fund.fundCode}&name=${fund.fundName}`
      })
    },
    
    goToAddFund() {
      uni.navigateTo({
        url: '/pages/search/index?type=watchlist'
      })
    },
    
    showAddGroupDialog() {
      uni.showModal({
        title: '新建分组',
        editable: true,
        placeholderText: '请输入分组名称',
        success: async (res) => {
          if (res.confirm && res.content) {
            await this.addGroup(res.content.trim())
          }
        }
      })
    },
    
    async removeFromWatchlist(fundCode) {
      uni.showModal({
        title: '确认删除',
        content: '确定要移除该自选基金吗？',
        success: async (res) => {
          if (res.confirm) {
            await this.removeFromWatchlist(fundCode)
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.group-scroll {
  background-color: #ffffff;
  white-space: nowrap;
  padding: 20rpx 0;
}

.group-list {
  display: inline-flex;
  padding: 0 20rpx;
  gap: 16rpx;
}

.group-item {
  display: inline-block;
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  color: #666666;
  background-color: #f5f5f5;
  border-radius: 32rpx;
  
  &.active {
    color: #E8453C;
    background-color: #FFF1F0;
  }
  
  &.add {
    color: #E8453C;
    background-color: #FFF1F0;
  }
}

.watchlist-container {
  margin: 20rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.watchlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  
  .count {
    font-size: 26rpx;
    color: #999999;
  }
  
  .edit-btn {
    font-size: 26rpx;
    color: #E8453C;
  }
}

.fund-list {
  .fund-item {
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
        font-size: 24rpx;
        color: #999999;
        margin-top: 4rpx;
        display: block;
      }
      
      .fund-group {
        font-size: 22rpx;
        color: #E8453C;
        background-color: #FFF1F0;
        padding: 2rpx 12rpx;
        border-radius: 4rpx;
        margin-top: 8rpx;
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
      }
      
      .fund-change {
        font-size: 26rpx;
        margin-top: 4rpx;
        display: block;
      }
    }
    
    .fund-actions {
      .delete-btn {
        font-size: 24rpx;
        color: #ff4d4f;
        padding: 8rpx 16rpx;
        background-color: #fff2f0;
        border-radius: 8rpx;
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
  
  .empty-icon {
    font-size: 80rpx;
    color: #cccccc;
    margin-bottom: 20rpx;
  }
  
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

.add-btn {
  position: fixed;
  bottom: calc(40rpx + constant(safe-area-inset-bottom));
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background-color: #E8453C;
  color: #ffffff;
  padding: 20rpx 48rpx;
  border-radius: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.3);
  z-index: 999;

  .add-icon {
    font-size: 36rpx;
    margin-right: 8rpx;
  }

  .add-text {
    font-size: 28rpx;
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
