<template>
  <view class="page-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input" @click="goToSearch">
        <text class="icon-search">搜索</text>
        <text class="placeholder">搜索基金代码/名称</text>
      </view>
      <view class="settings-btn" @click="goToSettings">
        <text class="icon-settings">⚙</text>
      </view>
    </view>
    
    <!-- 大盘指数 -->
    <view class="indices-section">
      <view class="section-header">
        <text class="section-title">大盘指数</text>
        <view class="header-right">
          <text class="refresh-time" v-if="lastRefreshTime">{{ lastRefreshTime }} 更新</text>
          <text class="section-more" @click="refreshData">刷新</text>
        </view>
      </view>
      <scroll-view scroll-x class="indices-scroll">
        <view class="indices-list">
          <view
            class="index-card"
            v-for="item in indices"
            :key="item.code"
          >
            <text class="index-name">{{ item.name }}</text>
            <text class="index-value" :class="getChangeClass(item.change)">
              {{ item.value ? item.value.toFixed(2) : '-' }}
            </text>
            <text class="index-change" :class="getChangeClass(item.change)">
              {{ item.changePercent != null ? (item.changePercent > 0 ? '+' : '') + item.changePercent + '%' : '-' }}
            </text>
          </view>
          <view class="index-card empty-card" v-if="indices.length === 0">
            <text class="index-name">暂无数据</text>
            <text class="index-value">-</text>
            <text class="index-change">-</text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 板块行情 -->
    <view class="sectors-section">
      <view class="section-header">
        <text class="section-title">板块行情</text>
        <view class="sector-tabs">
          <text
            class="sector-tab"
            :class="{ active: currentSectorTab === 'hot' }"
            @click="changeSectorTab('hot')"
          >热门板块</text>
          <text
            class="sector-tab"
            :class="{ active: currentSectorTab === 'lead' }"
            @click="changeSectorTab('lead')"
          >领涨板块</text>
        </view>
      </view>
      <scroll-view scroll-x class="sectors-scroll">
        <view class="sectors-list">
          <view
            class="sector-card"
            v-for="item in currentSectors"
            :key="item.code || item.name"
            @click="goToSector(item)"
          >
            <text class="sector-name">{{ item.name }}</text>
            <text class="sector-change" :class="getChangeClass(item.change)">
              {{ item.change != null ? (item.change > 0 ? '+' : '') + item.change + '%' : '-' }}
            </text>
            <text class="sector-amount" v-if="currentSectorTab === 'hot' && item.amount">
              {{ formatAmount(item.amount) }}
            </text>
          </view>
          <view class="sector-card empty-card" v-if="currentSectors.length === 0">
            <text class="sector-name">暂无数据</text>
            <text class="sector-change">-</text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 基金排行 -->
    <view class="rank-section">
      <view class="section-header">
        <text class="section-title">基金排行</text>
      </view>

      <!-- 基金类型 Tab -->
      <view class="tab-bar">
        <text
          class="tab-item"
          :class="{ active: currentType === 'all' }"
          @click="changeType('all')"
        >全部</text>
        <text
          class="tab-item"
          :class="{ active: currentType === 'gp' }"
          @click="changeType('gp')"
        >股票型</text>
        <text
          class="tab-item"
          :class="{ active: currentType === 'hh' }"
          @click="changeType('hh')"
        >混合型</text>
        <text
          class="tab-item"
          :class="{ active: currentType === 'zq' }"
          @click="changeType('zq')"
        >债券型</text>
        <text
          class="tab-item"
          :class="{ active: currentType === 'zs' }"
          @click="changeType('zs')"
        >指数型</text>
      </view>

      <!-- 排序选项 -->
      <view class="sort-bar">
        <text
          class="sort-item"
          :class="{ active: sortBy === '1nzf' }"
          @click="changeSort('1nzf')"
        >近1月</text>
        <text
          class="sort-item"
          :class="{ active: sortBy === '3nzf' }"
          @click="changeSort('3nzf')"
        >近3月</text>
        <text
          class="sort-item"
          :class="{ active: sortBy === '6nzf' }"
          @click="changeSort('6nzf')"
        >近6月</text>
        <text
          class="sort-item"
          :class="{ active: sortBy === '1yzf' }"
          @click="changeSort('1yzf')"
        >近1年</text>
      </view>

      <!-- 基金列表 -->
      <view class="fund-list">
        <view
          class="fund-item"
          v-for="item in fundRank"
          :key="item.code"
          @click="goToFundDetail(item)"
        >
          <view class="fund-left">
            <text class="fund-name">{{ item.name || '-' }}</text>
            <text class="fund-code">{{ item.code || '-' }}</text>
          </view>
          <view class="fund-right">
            <view class="fund-nav-row">
              <text class="fund-nav">{{ item.nav ? item.nav.toFixed(4) : '-' }}</text>
              <text class="fund-type-tag">{{ item.type || '-' }}</text>
            </view>
            <view class="fund-return-row">
              <view class="return-item">
                <text class="return-label">日涨跌</text>
                <text class="return-value" :class="getChangeClass(item.dayChange)">
                  {{ item.dayChange != null ? (item.dayChange > 0 ? '+' : '') + item.dayChange + '%' : '-' }}
                </text>
              </view>
              <view class="return-item">
                <text class="return-label">近1月</text>
                <text class="return-value" :class="getChangeClass(item.monthChange)">
                  {{ item.monthChange != null ? (item.monthChange > 0 ? '+' : '') + item.monthChange + '%' : '-' }}
                </text>
              </view>
              <view class="return-item">
                <text class="return-label">近1年</text>
                <text class="return-value" :class="getChangeClass(item.yearChange)">
                  {{ item.yearChange != null ? (item.yearChange > 0 ? '+' : '') + item.yearChange + '%' : '-' }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view class="load-more" v-if="hasMore && fundRank.length > 0" @click="loadMore">
          <text>加载更多</text>
        </view>

        <!-- 加载中 -->
        <view class="loading" v-if="loading">
          <text>加载中...</text>
        </view>

        <!-- 无数据 -->
        <view class="no-data" v-if="fundRank.length === 0 && !loading">
          <text>暂无数据</text>
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
      currentType: 'all',
      sortBy: '1nzf',
      currentSectorTab: 'hot'
    }
  },

  computed: {
    ...mapGetters('market', [
      'getIndices',
      'getFundRank',
      'getSectors',
      'getHotSectors',
      'getLeadSectors',
      'hasMore',
      'isLoading',
      'getLastRefreshTime'
    ]),

    indices() {
      return this.getIndices
    },

    fundRank() {
      return this.getFundRank
    },

    hotSectors() {
      return this.getHotSectors
    },

    leadSectors() {
      return this.getLeadSectors
    },

    currentSectors() {
      return this.currentSectorTab === 'hot' ? this.hotSectors : this.leadSectors
    },

    lastRefreshTime() {
      return this.getLastRefreshTime
    }
  },
  
  onLoad() {
    this.initData()
    // 启动自动刷新（每60秒刷新大盘指数）
    this.startAutoRefresh()
  },

  onUnload() {
    // 页面卸载时停止自动刷新
    this.stopAutoRefresh()
  },

  onPullDownRefresh() {
    this.refreshData().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  methods: {
    ...mapActions('market', [
      'fetchIndices',
      'fetchFundRank',
      'fetchSectors',
      'fetchHotSectors',
      'fetchLeadSectors',
      'setFundType',
      'setSortBy',
      'loadMore',
      'refresh',
      'startAutoRefresh',
      'stopAutoRefresh'
    ]),
    
    async initData() {
      await Promise.all([
        this.fetchIndices(),
        this.fetchFundRank(),
        this.fetchHotSectors(),
        this.fetchLeadSectors()
      ])
    },
    
    async refreshData() {
      await this.refresh()
    },
    
    getChangeClass(change) {
      if (change > 0) return 'color-up'
      if (change < 0) return 'color-down'
      return 'color-flat'
    },
    
    changeType(type) {
      this.currentType = type
      this.setFundType(type)
    },

    changeSectorTab(tab) {
      this.currentSectorTab = tab
    },

    formatAmount(amount) {
      if (!amount) return ''
      if (amount >= 100000000) {
        return (amount / 100000000).toFixed(1) + '亿'
      }
      if (amount >= 10000) {
        return (amount / 10000).toFixed(1) + '万'
      }
      return amount.toFixed(0)
    },
    
    changeSort(sort) {
      this.sortBy = sort
      this.setSortBy(sort)
    },
    
    goToSearch() {
      // 跳转到搜索页面
      uni.navigateTo({
        url: '/pages/search/index'
      })
    },

    goToSettings() {
      uni.navigateTo({
        url: '/pages/settings/index'
      })
    },
    
    goToFundDetail(fund) {
      uni.navigateTo({
        url: `/pages/fund-detail/index?code=${fund.code}&name=${fund.name}`
      })
    },
    
    goToSector(sector) {
      // 跳转到板块详情
      console.log('跳转到板块:', sector)
    }
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20rpx;
  background-color: #FFF5F5;
  min-height: 100vh;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  gap: 16rpx;

  .search-input {
    flex: 1;
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.88);
    border-radius: 32rpx;
    padding: 16rpx 24rpx;
    backdrop-filter: blur(10px);

    .icon-search {
      color: #999999;
      margin-right: 12rpx;
    }

    .placeholder {
      color: #cccccc;
      font-size: 28rpx;
    }
  }

  .settings-btn {
    width: 68rpx;
    height: 68rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.88);
    border-radius: 50%;
    backdrop-filter: blur(10px);

    .icon-settings {
      font-size: 36rpx;
      color: #666666;
    }
  }
}

.indices-section {
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .refresh-time {
    font-size: 22rpx;
    color: #999999;
  }

  .section-more {
    font-size: 24rpx;
    color: #E8453C;
  }
}

.indices-scroll {
  white-space: nowrap;
}

.indices-list {
  display: inline-flex;
  gap: 16rpx;
}

.index-card {
  display: inline-flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.88);
  border-radius: 12rpx;
  padding: 20rpx;
  min-width: 200rpx;

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

.empty-card {
  opacity: 0.5;
}

.sectors-section {
  margin-bottom: 20rpx;
}

.sector-tabs {
  display: flex;
  gap: 24rpx;

  .sector-tab {
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

.sectors-scroll {
  white-space: nowrap;
}

.sectors-list {
  display: inline-flex;
  gap: 16rpx;
}

.sector-card {
  display: inline-flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.88);
  border-radius: 12rpx;
  padding: 20rpx;
  min-width: 180rpx;

  .sector-name {
    font-size: 26rpx;
    font-weight: 500;
    color: #333333;
    margin-bottom: 8rpx;
  }

  .sector-change {
    font-size: 28rpx;
    font-weight: 600;
    margin-bottom: 4rpx;
  }

  .sector-amount {
    font-size: 20rpx;
    color: #999999;
  }
}

.sector-card.empty-card {
  opacity: 0.5;
}

.rank-section {
  background-color: rgba(255, 255, 255, 0.88);
  border-radius: 16rpx;
  padding: 24rpx;
}

.tab-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
  overflow-x: auto;
  white-space: nowrap;

  .tab-item {
    font-size: 24rpx;
    color: #666666;
    padding: 8rpx 20rpx;
    border-radius: 8rpx;
    flex-shrink: 0;

    &.active {
      color: #E8453C;
      background-color: #FFF1F0;
    }
  }
}

.sort-bar {
  display: flex;
  justify-content: space-around;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #FFE8E6;

  .sort-item {
    font-size: 24rpx;
    color: #666666;
    padding: 8rpx 12rpx;
    border-radius: 8rpx;

    &.active {
      color: #E8453C;
      background-color: #FFF1F0;
    }
  }
}

.fund-list {
  margin-top: 16rpx;
}

.fund-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #FFF1F0;

  &:last-child {
    border-bottom: none;
  }

  .fund-left {
    flex-shrink: 0;
    width: 240rpx;
    margin-right: 20rpx;

    .fund-name {
      font-size: 28rpx;
      font-weight: 500;
      color: #333333;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .fund-code {
      font-size: 22rpx;
      color: #999999;
      margin-top: 6rpx;
      display: block;
    }
  }

  .fund-right {
    flex: 1;
    min-width: 0;

    .fund-nav-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-bottom: 12rpx;

      .fund-nav {
        font-size: 28rpx;
        font-weight: 500;
        color: #333333;
        margin-right: 12rpx;
      }

      .fund-type-tag {
        font-size: 20rpx;
        color: #E8453C;
        background-color: #FFF1F0;
        padding: 2rpx 10rpx;
        border-radius: 4rpx;
      }
    }

    .fund-return-row {
      display: flex;
      justify-content: space-between;

      .return-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .return-label {
          font-size: 20rpx;
          color: #999999;
          margin-bottom: 4rpx;
        }

        .return-value {
          font-size: 24rpx;
          font-weight: 500;
        }
      }
    }
  }
}

.load-more {
  text-align: center;
  padding: 24rpx;
  color: #E8453C;
  font-size: 28rpx;
}

.loading {
  text-align: center;
  padding: 24rpx;
  color: #999999;
  font-size: 28rpx;
}

.no-data {
  text-align: center;
  padding: 48rpx;
  color: #999999;
  font-size: 28rpx;
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
