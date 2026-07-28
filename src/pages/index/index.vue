<template>
  <view class="page-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input" @click="goToSearch">
        <text class="icon-search">搜索</text>
        <text class="placeholder">搜索基金代码/名称</text>
      </view>
    </view>
    
    <!-- 大盘指数 -->
    <view class="indices-section">
      <view class="section-header">
        <text class="section-title">大盘指数</text>
        <text class="section-more" @click="refreshData">刷新</text>
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
              {{ item.value.toFixed(2) }}
            </text>
            <text class="index-change" :class="getChangeClass(item.change)">
              {{ item.change > 0 ? '+' : '' }}{{ item.changePercent }}%
            </text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 板块行情 -->
    <view class="sectors-section">
      <view class="section-header">
        <text class="section-title">板块行情</text>
      </view>
      <scroll-view scroll-x class="sectors-scroll">
        <view class="sectors-list">
          <view 
            class="sector-card" 
            v-for="item in sectors" 
            :key="item.name"
            @click="goToSector(item)"
          >
            <text class="sector-name">{{ item.name }}</text>
            <text class="sector-change" :class="getChangeClass(item.change)">
              {{ item.change > 0 ? '+' : '' }}{{ item.change }}%
            </text>
            <text class="sector-funds">{{ item.funds }}只基金</text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 基金排行 -->
    <view class="rank-section">
      <view class="section-header">
        <text class="section-title">基金排行</text>
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
        </view>
      </view>
      
      <!-- 排序选项 -->
      <view class="sort-bar">
        <text class="sort-item" @click="changeSort('1nzf')">近1月</text>
        <text class="sort-item" @click="changeSort('3nzf')">近3月</text>
        <text class="sort-item" @click="changeSort('6nzf')">近6月</text>
        <text class="sort-item" @click="changeSort('1nzf')">近1年</text>
      </view>
      
      <!-- 基金列表 -->
      <view class="fund-list">
        <view 
          class="fund-item" 
          v-for="item in fundRank" 
          :key="item.code"
          @click="goToFundDetail(item)"
        >
          <view class="fund-info">
            <text class="fund-name">{{ item.name }}</text>
            <text class="fund-code">{{ item.code }}</text>
            <text class="fund-type">{{ item.type }}</text>
          </view>
          <view class="fund-data">
            <text class="fund-nav">{{ item.nav.toFixed(4) }}</text>
            <text class="fund-change" :class="getChangeClass(item.dayChange)">
              {{ item.dayChange > 0 ? '+' : '' }}{{ item.dayChange }}%
            </text>
          </view>
        </view>
        
        <!-- 加载更多 -->
        <view class="load-more" v-if="hasMore" @click="loadMore">
          <text>加载更多</text>
        </view>
        
        <!-- 无数据 -->
        <view class="no-data" v-if="!hasMore && fundRank.length === 0">
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
      sortBy: '1nzf'
    }
  },
  
  computed: {
    ...mapGetters('market', [
      'getIndices',
      'getFundRank',
      'getSectors',
      'hasMore',
      'isLoading'
    ]),
    
    indices() {
      return this.getIndices
    },
    
    fundRank() {
      return this.getFundRank
    },
    
    sectors() {
      return this.getSectors
    }
  },
  
  onLoad() {
    this.initData()
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
      'setFundType',
      'setSortBy',
      'loadMore',
      'refresh'
    ]),
    
    async initData() {
      await Promise.all([
        this.fetchIndices(),
        this.fetchFundRank(),
        this.fetchSectors()
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
  background-color: #f5f5f5;
  min-height: 100vh;
}

.search-bar {
  margin-bottom: 20rpx;
  
  .search-input {
    display: flex;
    align-items: center;
    background-color: #ffffff;
    border-radius: 32rpx;
    padding: 16rpx 24rpx;
    
    .icon-search {
      color: #999999;
      margin-right: 12rpx;
    }
    
    .placeholder {
      color: #cccccc;
      font-size: 28rpx;
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
  
  .section-more {
    font-size: 24rpx;
    color: #1890ff;
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
  background-color: #ffffff;
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

.sectors-section {
  margin-bottom: 20rpx;
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
  background-color: #ffffff;
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
  
  .sector-funds {
    font-size: 22rpx;
    color: #999999;
  }
}

.rank-section {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.tab-bar {
  display: flex;
  gap: 24rpx;
  
  .tab-item {
    font-size: 26rpx;
    color: #666666;
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    
    &.active {
      color: #1890ff;
      background-color: #e6f7ff;
    }
  }
}

.sort-bar {
  display: flex;
  justify-content: space-around;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #eeeeee;
  
  .sort-item {
    font-size: 24rpx;
    color: #666666;
    padding: 8rpx 16rpx;
  }
}

.fund-list {
  margin-top: 16rpx;
}

.fund-item {
  display: flex;
  justify-content: space-between;
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
    
    .fund-type {
      font-size: 22rpx;
      color: #1890ff;
      background-color: #e6f7ff;
      padding: 4rpx 12rpx;
      border-radius: 4rpx;
      margin-top: 8rpx;
      display: inline-block;
    }
  }
  
  .fund-data {
    text-align: right;
    
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
}

.load-more {
  text-align: center;
  padding: 24rpx;
  color: #1890ff;
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
