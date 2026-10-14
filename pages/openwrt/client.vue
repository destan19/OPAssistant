<template>
  <view class="container">
    <page-tab v-model="currentTab" :tabs="tab_list" style="margin-bottom: 8rpx;" />

    <!-- Tab 0: 用户列表（有应用过滤模块时，新卡片样式） -->
    <view v-if="currentTab === 0">
      <view v-if="userListLoading" class="client-empty">{{ $t('client.user_list_loading') }}</view>
      <view v-else-if="userList.length === 0" class="client-empty">{{ $t('client.no_user_data') }}</view>
      <view v-else>
        <view
          v-for="(user, index) in userList"
          :key="index"
          class="cl-user-card"
          @click="openDetail(user)"
        >
          <!-- 卡片头部：头像 + 名称 + 状态 -->
          <view class="cl-card-head">
            <view class="cl-avatar" :style="{ background: macColor(user.mac) }">
              <text class="cl-avatar-text">{{ userInitial(user) }}</text>
            </view>
            <view class="cl-card-info">
              <view class="cl-name-row">
                <text class="cl-card-name">{{ getUserDisplayName(user) }}</text>
                <view class="cl-status-badge" :class="statusBadgeClass(user)">
                  <text class="cl-status-text">{{ getUserStatusText(user) }}</text>
                </view>
              </view>
              <text class="cl-card-sub">{{ user.ip || '--' }}</text>
            </view>
          </view>

          <!-- 速率行（在线且版本支持时显示） -->
          <view class="cl-card-rates" v-if="getUserStatusCode(user) !== 0 && showSpeedInUserList">
            <view class="cl-rate-item">
              <text class="cl-rate-arrow cl-up">↑</text>
              <text class="cl-rate-val">{{ getUserUpSpeed(user) }}</text>
            </view>
            <view class="cl-rate-item">
              <text class="cl-rate-arrow cl-down">↓</text>
              <text class="cl-rate-val">{{ getUserDownSpeed(user) }}</text>
            </view>
            <view class="cl-today-stats" v-if="getUserTodayDuration(user)">
              <text class="cl-today-stat">⏱ {{ getUserTodayDuration(user) }}</text>
            </view>
          </view>
          <!-- 今日统计（离线或无速率时单独显示） -->
          <view class="cl-today-offline-row" v-else-if="getUserTodayDuration(user)">
            <text class="cl-today-stat">⏱ {{ getUserTodayDuration(user) }}</text>
          </view>

          <!-- 应用图标行 + 当前 URL -->
          <view class="cl-app-icons" v-if="user.app || user.url || (user.applist && user.applist.length)">
            <!-- 活跃应用图标（绿点指示） -->
            <view class="cl-icon-slot" v-if="user.app">
              <image
                v-if="getActiveAppIconId(user) && !iconErrors[getActiveAppIconId(user)]"
                :src="getAppIconUrl(getActiveAppIconId(user))"
                class="cl-app-icon-img"
                mode="scaleToFill"
                @error="setIconError(getActiveAppIconId(user))"
              />
              <view v-else class="cl-app-icon-fb" :style="{ background: appColor(user.app) }">
                <text class="cl-icon-fb-text">{{ user.app.charAt(0) }}</text>
              </view>
              <view class="cl-icon-active-dot"></view>
            </view>
            <!-- 常用应用图标 -->
            <view
              v-for="(app, ai) in getCommonApps(user)"
              :key="'ca' + ai"
              class="cl-icon-slot"
            >
              <image
                v-if="app.id && !iconErrors[app.id]"
                :src="getAppIconUrl(app.id)"
                class="cl-app-icon-img"
                mode="scaleToFill"
                @error="setIconError(app.id)"
              />
              <view v-else class="cl-app-icon-fb" :style="{ background: appColor(app.name || '') }">
                <text class="cl-icon-fb-text">{{ (app.name || '?').charAt(0) }}</text>
              </view>
            </view>
            <!-- 当前访问 URL -->
            <text v-if="user.url" class="cl-url-label">{{ abbreviateUrl(user.url) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Tab 1: 无线客户端 -->
    <view v-else-if="currentTab === 1">
      <view v-if="loading" class="client-empty">{{ $t('client.wireless_clients_loading') }}</view>
      <view v-else-if="wirelessClients.length === 0" class="client-empty">{{ $t('client.no_wireless_clients') }}</view>
      <view v-else>
        <view v-for="(client, index) in wirelessClients" :key="index" class="wc-card">
          <!-- 卡片头：头像 + 名称/MAC + 频段徽章 + 踢出按钮 -->
          <view class="wc-head">
            <view class="wc-avatar" :style="{ background: wifiAvatarColor(client) }">
              <text class="wc-avatar-text">{{ wifiInitial(client) }}</text>
            </view>
            <view class="wc-head-info">
              <text class="wc-name">{{ client.hostname || client.mac }}</text>
              <text v-if="client.hostname" class="wc-sub">{{ client.mac }}</text>
            </view>
            <view v-if="wirelessIfBandMap[client.ifname]" class="wc-band-badge">
              <text class="wc-band-text">{{ wirelessIfBandMap[client.ifname] }}</text>
            </view>
            <view class="wc-kick-wrap" @click="kickClient(client)">
              <text class="wc-kick-icon">✕</text>
            </view>
          </view>
          <!-- 信息行 -->
          <view class="wc-divider"></view>
          <view class="wc-row">
            <text class="wc-lbl">{{ $t('client.signal') }}</text>
            <view class="wc-signal-inline" :style="signalBadgeStyle(client.signal)">
              <text class="wc-signal-inline-text">{{ client.signal }} dBm</text>
            </view>
          </view>
          <view class="wc-row">
            <text class="wc-lbl">{{ $t('client.connection_time') }}</text>
            <text class="wc-val">{{ formatTime(client.connected_time) }}</text>
          </view>
          <view class="wc-row">
            <text class="wc-lbl">{{ $t('client.receive_rate') }}</text>
            <text class="wc-val">{{ formatSingleRate(client, 'rx') }}</text>
          </view>
          <view class="wc-row">
            <text class="wc-lbl">{{ $t('client.transmit_rate') }}</text>
            <text class="wc-val">{{ formatSingleRate(client, 'tx') }}</text>
          </view>
          <view class="wc-row wc-row-last">
            <text class="wc-lbl">{{ $t('client.interface') }}</text>
            <text class="wc-val">{{ client.ifname }}</text>
          </view>
        </view>
      </view>
      <view v-if="showDetail" class="client-detail-mask" @click="showDetail = false">
        <view class="client-detail-popup" @click.stop>
          <view class="client-detail-title">{{ $t('client.client_details') }}</view>
          <view v-for="(val, key) in detailClient" :key="key" class="client-detail-row">
            <text class="client-detail-key">{{ key }}</text>：<text class="client-detail-value">{{ val }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Tab 2: DHCPv4 -->
    <view v-else-if="currentTab === 2">
      <view v-if="dhcpv4List.length === 0" class="client-empty">{{ $t('client.no_dhcpv4_allocation') }}</view>
      <view v-else>
        <view v-for="(item, index) in dhcpv4List" :key="index" class="client-card">
          <view class="client-row"><text class="label">{{ $t('client.mac') }}：</text><text class="value">{{ item.macaddr }}</text></view>
          <view class="client-row"><text class="label">{{ $t('client.hostname') }}：</text><text class="value">{{ item.hostname || '-' }}</text></view>
          <view class="client-row"><text class="label">{{ $t('client.ip_address') }}：</text><text class="value">{{ item.ipaddr }}</text></view>
          <view class="client-row"><text class="label">{{ $t('client.lease_time') }}：</text><text class="value">{{ formatLeaseTime(item.expires) }}</text></view>
        </view>
      </view>
    </view>

    <!-- Tab 3: DHCPv6 -->
    <view v-else-if="currentTab === 3">
      <view v-if="dhcpv6List.length === 0" class="client-empty">{{ $t('client.no_dhcpv6_allocation') }}</view>
      <view v-else>
        <view v-for="(item, index) in dhcpv6List" :key="index" class="client-card">
          <view v-if="item.macaddr" class="client-row"><text class="label">{{ $t('client.mac') }}：</text><text class="value">{{ item.macaddr }}</text></view>
          <view class="client-row"><text class="label">{{ $t('client.hostname') }}：</text><text class="value">{{ item.hostname || '-' }}</text></view>
          <view class="client-row"><text class="label">{{ $t('client.ipv6_address') }}：</text><text class="value">{{ item.ip6addr }}</text></view>
          <view class="client-row"><text class="label">{{ $t('client.duid') }}：</text><text class="value">{{ item.duid }}</text></view>
          <view class="client-row"><text class="label">{{ $t('client.lease_time') }}：</text><text class="value">{{ formatLeaseTime(item.expires) }}</text></view>
        </view>
      </view>
    </view>

    <!-- 底部详情面板（从底部弹出，参照 fanchmwrt 样式） -->
    <view v-if="detail" class="cl-detail-mask" @click.self="closeDetail">
      <view class="cl-detail-panel">
        <!-- 面板头 -->
        <view class="cl-detail-head">
          <view class="cl-avatar cl-detail-avatar" :style="{ background: macColor(detail.mac) }">
            <text class="cl-avatar-text">{{ userInitial(detail) }}</text>
          </view>
          <view class="cl-detail-title-wrap">
            <text class="cl-detail-title">{{ getUserDisplayName(detail) }}</text>
            <view class="cl-status-badge" :class="statusBadgeClass(detail)">
              <text class="cl-status-text">{{ getUserStatusText(detail) }}</text>
            </view>
          </view>
          <view class="cl-detail-close" @click="closeDetail">
            <text class="cl-detail-close-text">✕</text>
          </view>
        </view>

        <!-- Tab 切换栏 -->
        <view class="cl-detail-tabs">
          <view class="cl-detail-tab" :class="{ 'cl-detail-tab-active': detailTab === 0 }" @click="switchDetailTab(0)">
            <text class="cl-detail-tab-text">{{ $t('client_detail.basic_info') }}</text>
          </view>
          <view class="cl-detail-tab" :class="{ 'cl-detail-tab-active': detailTab === 1 }" @click="switchDetailTab(1)">
            <text class="cl-detail-tab-text">{{ $t('client_detail.app_statistics') }}</text>
          </view>
          <view class="cl-detail-tab" :class="{ 'cl-detail-tab-active': detailTab === 2 }" @click="switchDetailTab(2)">
            <text class="cl-detail-tab-text">{{ $t('client_detail.app_records') }}</text>
          </view>
        </view>

        <!-- Tab 0: 基本信息 -->
        <scroll-view v-if="detailTab === 0" class="cl-detail-scroll" scroll-y="true" show-scrollbar="false">
          <view class="cl-detail-section">
            <view class="cl-kv-row">
              <text class="cl-kv-lbl">MAC</text>
              <text class="cl-kv-val">{{ detail.mac }}</text>
            </view>
            <view class="cl-kv-row" v-if="detail.ip">
              <text class="cl-kv-lbl">IP</text>
              <text class="cl-kv-val">{{ detail.ip }}</text>
            </view>
            <view class="cl-kv-row">
              <text class="cl-kv-lbl">{{ $t('client_detail.online_status') }}</text>
              <text class="cl-kv-val" :style="{ color: getUserStatusCode(detail) !== 0 ? '#34C759' : '#FF3B30' }">{{ getUserStatusText(detail) }}</text>
            </view>
            <view class="cl-kv-row" v-if="detail.app">
              <text class="cl-kv-lbl">{{ $t('client_detail.current_app') }}</text>
              <text class="cl-kv-val">{{ detail.app }}</text>
            </view>
            <view class="cl-kv-row" v-if="detail.url">
              <text class="cl-kv-lbl">{{ $t('client_detail.current_url') }}</text>
              <text class="cl-kv-val">{{ detail.url }}</text>
            </view>
            <view class="cl-kv-row" v-if="getTodayUsageText(detail)">
              <text class="cl-kv-lbl">{{ $t('client_detail.today_usage_time') }}</text>
              <text class="cl-kv-val">{{ getTodayUsageText(detail) }}</text>
            </view>
            <view class="cl-kv-row" v-if="getTodayFlowText(detail)">
              <text class="cl-kv-lbl">{{ $t('client_detail.today_flow') }}</text>
              <text class="cl-kv-val">{{ getTodayFlowText(detail) }}</text>
            </view>
          </view>
          <view style="height: 40rpx;"></view>
        </scroll-view>

        <!-- Tab 1: App统计（环形饼图） -->
        <scroll-view v-if="detailTab === 1" class="cl-detail-scroll" scroll-y="true" show-scrollbar="false">
          <view v-if="detailAppStatsLoading" class="cl-tab-state">
            <text class="cl-loading-text">{{ $t('client_detail.loading_statistics') }}</text>
          </view>
          <template v-else-if="detailAppStats.length">
            <view class="cl-detail-section cl-pie-section">
              <canvas canvas-id="clDetailPieChart" class="cl-pie-canvas"></canvas>
            </view>
            <view class="cl-detail-section cl-pie-legend-section">
              <view
                v-for="(app, ai) in detailAppStats"
                :key="ai"
                class="cl-pie-legend-row"
                :class="{ 'cl-pie-legend-border': ai > 0 }"
              >
                <view class="cl-pie-legend-dot" :style="{ background: pieColors[ai % pieColors.length] }"></view>
                <text class="cl-pie-legend-name">{{ app.name }}</text>
                <text class="cl-pie-legend-pct">{{ detailAppStatsTotal > 0 ? Math.round(app.t / detailAppStatsTotal * 100) + '%' : '0%' }}</text>
                <text class="cl-pie-legend-time">{{ formatAppTime(app.t) }}</text>
              </view>
            </view>
          </template>
          <view v-else class="cl-tab-state">
            <text class="cl-empty-text">{{ $t('client_detail.no_statistics') }}</text>
          </view>
          <view style="height: 40rpx;"></view>
        </scroll-view>

        <!-- Tab 2: 应用记录 -->
        <scroll-view v-if="detailTab === 2" class="cl-detail-scroll" scroll-y="true" show-scrollbar="false">
          <view class="cl-detail-section">
            <view v-if="detailAppRecordsLoading && !detailAppRecords.length" class="cl-tab-state">
              <text class="cl-loading-text">{{ $t('client_detail.loading_records') }}</text>
            </view>
            <view v-else-if="detailAppRecords.length">
              <view
                v-for="(rec, ri) in detailAppRecords"
                :key="ri"
                class="cl-record-row"
                :class="{ 'cl-record-last': ri === detailAppRecords.length - 1 }"
              >
                <view class="cl-record-icon-wrap">
                  <image
                    :src="getAppIconUrl(rec.id)"
                    mode="aspectFit"
                    class="cl-record-icon-img"
                    @error="onRecordIconError($event, rec.id)"
                  />
                  <text v-if="rec.iconError" class="cl-record-icon-fb">📱</text>
                </view>
                <view class="cl-record-body">
                  <text class="cl-record-name">{{ rec.name }}</text>
                  <text class="cl-record-time">{{ formatRecordTime(rec.ft) }} · {{ formatDetailDuration(rec.tt) }}</text>
                </view>
              </view>
            </view>
            <view v-else class="cl-tab-state">
              <text class="cl-empty-text">{{ $t('client_detail.no_records') }}</text>
            </view>
          </view>
          <view style="height: 40rpx;"></view>
        </scroll-view>
      </view>
    </view>

    <!-- App Tooltip -->
    <view v-if="tooltip.show" class="app-tooltip" :style="tooltip.style">
      {{ tooltip.text }}
    </view>
  </view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'
import PageTab from '@/components/page_tab.vue'

const USER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']
const APP_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1']

export default {
  components: {
    PageTab
  },
  data() {
    return {
      currentTab: 0,
      session: '',
      url: '/ubus',
      deviceInfo: {},
      wirelessClients: [],
      loading: false,
      showDetail: false,
      detailClient: {},
      wirelessIfBandMap: {},
      dhcpv4List: [],
      dhcpv6List: [],
      userList: [],
      userListLoading: false,
      oafSupported: true,
      userListTimer: null,
      appFilterVersion: '',
      tooltip: {
        show: false,
        text: '',
        style: {}
      },
      // 底部详情面板
      detail: null,
      detailTab: 0,
      detailAppStats: [],
      detailAppStatsLoading: false,
      detailAppRecords: [],
      detailAppRecordsLoading: false,
      iconErrors: {},
      pieColors: ['#34d399','#22c55e','#06b6d4','#60a5fa','#a78bfa','#f472b6','#fb923c','#fbbf24','#10b981','#3b82f6','#8b5cf6','#ec4899']
    }
  },
  computed: {
    tab_list() {
      const support_parental_control = !!this.deviceInfo.support_parental_control
      const list = []
      if (support_parental_control) {
        list.push({ value: 0, label: this.$t('client.user_list') })
      }
      list.push({ value: 1, label: this.$t('client.wireless_clients') })
      if (!support_parental_control) {
        list.push({ value: 2, label: this.$t('client.dhcpv4_allocation') })
        list.push({ value: 3, label: this.$t('client.dhcpv6_allocation') })
      }
      return list
    },
    showSpeedInUserList() {
      return this.compareVersions(this.appFilterVersion, '6.1.6') > 0
    },
    detailAppStatsTotal() {
      return (this.detailAppStats || []).reduce((s, a) => s + (a.t || 0), 0)
    }
  },
  watch: {
    currentTab(val) {
      this.loadData()
    },
    detailAppStats(val) {
      if (val && val.length && this.detailTab === 1) {
        this.$nextTick(() => setTimeout(() => this.drawDetailPieChart(), 80))
      }
    },
    detailTab(val) {
      if (val === 1 && this.detailAppStats.length) {
        this.$nextTick(() => setTimeout(() => this.drawDetailPieChart(), 80))
      }
    }
  },
  onLoad() {
    uni.setNavigationBarTitle({ title: this.$t('client.title') })
    uni.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#F8F8F8' })

    this.deviceInfo = DeviceManager.getCurrentDevice()
    if (this.deviceInfo.support_parental_control === undefined) {
      this.deviceInfo.support_parental_control = 0
    }
    if (this.deviceInfo.support_parental_control === 0) {
      this.currentTab = 1
    } else {
      this.currentTab = 0
    }

    this.session = this.deviceInfo.sysauth
    const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
    const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
    this.url = `${protocol}://${formattedHost}:${this.deviceInfo.port}/ubus`
    this.loadData()
    this.startUserListTimer()
  },
  onShow() {
    uni.setNavigationBarTitle({ title: this.$t('client.title') })
    uni.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#F8F8F8' })
    this.startUserListTimer()
  },
  onHide() {
    this.stopUserListTimer()
  },
  onUnload() {
    this.stopUserListTimer()
  },
  methods: {
    // ── 颜色 / 显示辅助 ──────────────────────────────────────────
    macColor(mac) {
      if (!mac) return USER_COLORS[0]
      let hash = 0
      for (let i = 0; i < mac.length; i++) hash = ((hash * 31) + mac.charCodeAt(i)) >>> 0
      return USER_COLORS[hash % USER_COLORS.length]
    },
    appColor(name) {
      if (!name) return APP_COLORS[0]
      let hash = 0
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
      return APP_COLORS[Math.abs(hash) % APP_COLORS.length]
    },
    userInitial(user) {
      const name = user.nickname || user.hostname || user.mac || '?'
      return name.charAt(0).toUpperCase()
    },
    statusBadgeClass(user) {
      const code = this.getUserStatusCode(user)
      if (code === 2) return 'cl-status-active'
      if (code === 1) return 'cl-status-online'
      return 'cl-status-offline'
    },
    getActiveAppIconId(user) {
      if (!user.app || !user.applist) return null
      const item = user.applist.find(a => a.name === user.app)
      return item ? (item.id || null) : null
    },
    getCommonApps(user) {
      const applist = user.applist || []
      const max = user.app ? 4 : 5
      if (user.app) return applist.filter(a => a.name !== user.app).slice(0, max)
      return applist.slice(0, max)
    },
    setIconError(appId) {
      this.$set(this.iconErrors, appId, true)
    },

    // ── 用户状态 ──────────────────────────────────────────────────
    getUserStatusCode(user) {
      const v = user.online
      if (v === 2 || v === '2') return 2
      if (v === 1 || v === '1' || v === true) return 1
      return 0
    },
    getUserStatusClass(user) {
      const code = this.getUserStatusCode(user)
      if (code === 2) return 'active'
      if (code === 1) return 'online'
      return 'offline'
    },
    getUserStatusText(user) {
      const code = this.getUserStatusCode(user)
      if (code === 2) return this.$t('client.active')
      if (code === 1) return this.$t('client.online')
      return this.$t('client.offline')
    },

    // ── 速率 ──────────────────────────────────────────────────────
    hasSpeedInfo(user) {
      return this.getUserUpSpeed(user) !== '' || this.getUserDownSpeed(user) !== ''
    },
    getUserUpSpeed(user) {
      const v = user.up_speed != null ? user.up_speed : (user.up_rate != null ? user.up_rate : user.tx_speed)
      if (v != null) return this.formatUserSpeed(v)
      if (this.getUserStatusCode(user) !== 0) return '0 KB/s'
      return ''
    },
    getUserDownSpeed(user) {
      const v = user.down_speed != null ? user.down_speed : (user.down_rate != null ? user.down_rate : user.rx_speed)
      if (v != null) return this.formatUserSpeed(v)
      if (this.getUserStatusCode(user) !== 0) return '0 KB/s'
      return ''
    },
    formatUserSpeed(val) {
      if (val === undefined || val === null || val === '') return ''
      const num = Number(val)
      if (Number.isNaN(num)) return ''
      const abs = Math.abs(num)
      if (abs >= 1024 * 1024) return (abs / 1024 / 1024).toFixed(1) + ' GB/s'
      if (abs >= 1024) return (abs / 1024).toFixed(1) + ' MB/s'
      return abs.toFixed(0) + ' KB/s'
    },

    // ── 今日时长 ──────────────────────────────────────────────────
    getUserTodayDuration(user) {
      const hasField = user.today_am_active_time !== undefined || user.today_pm_active_time !== undefined
      if (!hasField) return ''
      const am = Number(user.today_am_active_time) || 0
      const pm = Number(user.today_pm_active_time) || 0
      return this.formatMinutes(am + pm)
    },
    formatMinutes(m) {
      const min = Math.floor(Number(m)) || 0
      if (min <= 0) return '0m'
      if (min < 60) return min + 'm'
      const h = Math.floor(min / 60)
      const rest = min % 60
      return rest > 0 ? h + 'h ' + rest + 'm' : h + 'h'
    },

    // ── 名称 ──────────────────────────────────────────────────────
    getUserDisplayName(user) {
      return user.nickname || user.hostname || user.mac || '--'
    },
    getUserDisplayNameLine(user) {
      const mac = (user.mac && String(user.mac).trim()) || ''
      const nickname = (user.nickname && String(user.nickname).trim()) || ''
      const hostname = (user.hostname && String(user.hostname).trim()) || ''
      if (nickname) return `${nickname} (${mac})`
      if (hostname) return `${hostname} (${mac})`
      return mac
    },

    // ── URL 缩写 ──────────────────────────────────────────────────
    abbreviateUrl(urlStr) {
      if (!urlStr || typeof urlStr !== 'string') return ''
      const s = urlStr.trim()
      if (s.length <= 26) return s
      return s.substring(0, 13) + '...' + s.substring(s.length - 13)
    },

    // ── 今日使用 / 流量文字（详情面板 Tab 0） ─────────────────────
    getTodayUsageText(user) {
      const hasField = user.today_am_active_time !== undefined || user.today_pm_active_time !== undefined
      if (!hasField) return ''
      const am = Number(user.today_am_active_time) || 0
      const pm = Number(user.today_pm_active_time) || 0
      const m = this.$t('client_detail.minutes')
      return this.$t('client_detail.morning') + ' ' + am + m + '，' + this.$t('client_detail.afternoon') + ' ' + pm + m
    },
    formatFlowFromKB(kb) {
      const n = Number(kb) || 0
      if (n >= 1024 * 1024 * 1024) return (n / 1024 / 1024 / 1024).toFixed(2) + ' ' + this.$t('client_detail.tb')
      if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' ' + this.$t('client_detail.gb')
      if (n >= 1024) return (n / 1024).toFixed(2) + ' ' + this.$t('client_detail.mb')
      return n + ' ' + this.$t('client_detail.kb')
    },
    getTodayFlowText(user) {
      const up = user.today_up_flow != null ? Number(user.today_up_flow) : null
      const down = user.today_down_flow != null ? Number(user.today_down_flow) : null
      if (up == null && down == null) return ''
      const upStr = up != null ? this.$t('client_detail.up_flow') + ' ' + this.formatFlowFromKB(up) : ''
      const downStr = down != null ? this.$t('client_detail.down_flow') + ' ' + this.formatFlowFromKB(down) : ''
      return [upStr, downStr].filter(Boolean).join('，')
    },

    // ── 底部详情面板 ──────────────────────────────────────────────
    openDetail(user) {
      this.detail = user
      this.detailTab = 0
      this.detailAppStats = []
      this.detailAppRecords = []
    },
    closeDetail() {
      this.detail = null
    },
    switchDetailTab(idx) {
      this.detailTab = idx
      if (!this.detail) return
      const mac = this.detail.mac
      if (idx === 1 && !this.detailAppStats.length && !this.detailAppStatsLoading) {
        this.fetchDetailAppStats(mac)
      }
      if (idx === 2 && !this.detailAppRecords.length && !this.detailAppRecordsLoading) {
        this.fetchDetailAppRecords(mac)
      }
    },

    // ── 详情数据请求（appfilter 接口，不修改） ────────────────────
    fetchDetailAppStats(mac) {
      this.detailAppStatsLoading = true
      uni.request({
        method: 'POST',
        url: this.url,
        data: {
          jsonrpc: '2.0', id: 1, method: 'call',
          params: [this.session, 'appfilter', 'dev_visit_time', { mac }]
        },
        header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
        timeout: 5000,
        success: (res) => {
          if (res.data && res.data.result && res.data.result[1] && res.data.result[1].list) {
            this.detailAppStats = [...res.data.result[1].list].sort((a, b) => (b.t || 0) - (a.t || 0))
          } else {
            this.detailAppStats = []
          }
          this.detailAppStatsLoading = false
        },
        fail: () => {
          this.detailAppStats = []
          this.detailAppStatsLoading = false
        }
      })
    },
    fetchDetailAppRecords(mac) {
      this.detailAppRecordsLoading = true
      uni.request({
        method: 'POST',
        url: this.url,
        data: {
          jsonrpc: '2.0', id: 1, method: 'call',
          params: [this.session, 'appfilter', 'dev_visit_list', { mac }]
        },
        header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
        timeout: 5000,
        success: (res) => {
          if (res.data && res.data.result && res.data.result[1] && res.data.result[1].list) {
            const records = res.data.result[1].list || []
            this.detailAppRecords = records
              .filter(r => r.tt && r.tt > 0)
              .sort((a, b) => (b.ft || 0) - (a.ft || 0))
          } else {
            this.detailAppRecords = []
          }
          this.detailAppRecordsLoading = false
        },
        fail: () => {
          this.detailAppRecords = []
          this.detailAppRecordsLoading = false
        }
      })
    },

    // ── 环形饼图（canvas，与 fanchmwrt 相同实现） ─────────────────
    drawDetailPieChart() {
      const data = this.detailAppStats
      if (!data.length) return
      const total = this.detailAppStatsTotal
      if (total <= 0) return
      const SIZE = 250, cx = 125, cy = 125, outerR = 105, innerR = 58
      const COLORS = this.pieColors
      const ctx = uni.createCanvasContext('clDetailPieChart', this)
      let startAngle = -Math.PI / 2
      data.forEach((app, i) => {
        const sweep = (app.t / total) * 2 * Math.PI
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep)
        ctx.closePath()
        ctx.setFillStyle(COLORS[i % COLORS.length])
        ctx.fill()
        startAngle += sweep
      })
      ctx.beginPath()
      ctx.arc(cx, cy, innerR, 0, 2 * Math.PI)
      ctx.setFillStyle('#ffffff')
      ctx.fill()
      ctx.setTextAlign('center')
      ctx.setTextBaseline('middle')
      ctx.setFontSize(17)
      ctx.setFillStyle('#1c1c1e')
      ctx.fillText(this.formatAppTime(total), cx, cy - 9)
      ctx.setFontSize(11)
      ctx.setFillStyle('#8e8e93')
      ctx.fillText(this.$t('client_detail.total_duration'), cx, cy + 13)
      ctx.draw()
    },

    // ── 时间格式化 ────────────────────────────────────────────────
    formatAppTime(seconds) {
      if (!seconds || seconds <= 0) return '--'
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      if (h > 0) return `${h}h${m > 0 ? m + 'm' : ''}`
      if (m > 0) return `${m}m`
      return `${seconds}s`
    },
    formatRecordTime(ts) {
      if (!ts) return '--'
      const d = new Date(Number(ts) * 1000)
      const p = n => String(n).padStart(2, '0')
      return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
    },
    formatDetailDuration(seconds) {
      if (!seconds) return '--'
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = seconds % 60
      if (h > 0) return `${h}h${m}m`
      if (m > 0) return `${m}m${s}s`
      return `${s}s`
    },
    onRecordIconError(event, appId) {
      this.detailAppRecords.forEach(rec => {
        if (rec.id === appId) this.$set(rec, 'iconError', true)
      })
    },

    // ── 图标 URL ──────────────────────────────────────────────────
    getAppIconUrl(appId) {
      const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
      const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
      return `${protocol}://${formattedHost}:${this.deviceInfo.port}/luci-static/resources/app_icons/${appId}.png`
    },

    // ── 用户列表加载 ──────────────────────────────────────────────
    goBack() {
      uni.reLaunch({ url: '/pages/device_list' })
    },
    loadData() {
      if (this.currentTab === 0) {
        this.fetchUserList()
        this.startUserListTimer()
      } else if (this.currentTab === 1) {
        this.fetchWirelessClients()
        this.stopUserListTimer()
      } else if (this.currentTab === 2) {
        this.fetchDHCPv4List()
        this.stopUserListTimer()
      } else if (this.currentTab === 3) {
        this.fetchDHCPv6List()
        this.stopUserListTimer()
      }
    },
    fetchUserList(showLoading = true) {
      if (showLoading) this.userListLoading = true
      this.fetchOafVersion().then(() => {
        uni.request({
          method: 'POST',
          url: this.url,
          data: {
            jsonrpc: '2.0', id: 1, method: 'call',
            params: [this.session, 'appfilter', 'get_all_users', { flag: 3 }]
          },
          header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
          timeout: 5000,
          success: (res) => {
            if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
              this.userList = res.data.result[1].data.list || []
            } else {
              this.userList = []
            }
            if (showLoading) this.userListLoading = false
          },
          fail: () => {
            this.userList = []
            if (showLoading) {
              this.userListLoading = false
              uni.showToast({ title: this.$t('client.load_failed'), icon: 'none' })
            }
          }
        })
      }).catch(() => {
        if (showLoading) this.userListLoading = false
      })
    },
    fetchOafVersion() {
      return new Promise((resolve) => {
        uni.request({
          method: 'POST',
          url: this.url,
          data: {
            jsonrpc: '2.0', id: 0, method: 'call',
            params: [this.session, 'appfilter', 'get_oaf_status', {}]
          },
          header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
          timeout: 5000,
          success: (res) => {
            if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
              this.appFilterVersion = res.data.result[1].data.version || '--'
            } else {
              this.appFilterVersion = '--'
            }
            resolve()
          },
          fail: () => { this.appFilterVersion = '--'; resolve() }
        })
      })
    },
    compareVersions(v1, v2) {
      if (!v1 || v1 === '--' || !v2 || v2 === '--') return -1
      const p1 = String(v1).split('.').map(Number)
      const p2 = String(v2).split('.').map(Number)
      for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const a = p1[i] || 0, b = p2[i] || 0
        if (a > b) return 1
        if (a < b) return -1
      }
      return 0
    },
    startUserListTimer() {
      this.stopUserListTimer()
      if (this.currentTab === 0) {
        this.userListTimer = setInterval(() => { this.fetchUserList(false) }, 3000)
      }
    },
    stopUserListTimer() {
      if (this.userListTimer) {
        clearInterval(this.userListTimer)
        this.userListTimer = null
      }
    },

    // ── 无线客户端 ────────────────────────────────────────────────
    async fetchWirelessClients() {
      this.loading = true
      this.wirelessClients = []
      this.wirelessIfBandMap = {}
      const [interfaces, dhcpv4, dhcpv6] = await Promise.all([
        this.getWirelessInterfaces(),
        this.getDHCPv4Leases(),
        this.getDHCPv6Leases()
      ])
      const macToHostname = {}
      dhcpv4.forEach(item => { if (item.macaddr) macToHostname[item.macaddr.toUpperCase()] = item.hostname })
      dhcpv6.forEach(item => { if (item.macaddr) macToHostname[item.macaddr.toUpperCase()] = item.hostname })
      let allClients = []
      for (let iface of interfaces) {
        let clients = await this.getClientsByInterface(iface.ifname)
        allClients.push(...clients.map(c => ({
          ...c,
          ifname: iface.ifname,
          hostname: macToHostname[(c.mac || '').toUpperCase()] || ''
        })))
      }
      this.wirelessClients = allClients
      this.loading = false
    },
    getWirelessInterfaces() {
      return new Promise((resolve) => {
        uni.request({
          method: 'POST', url: this.url,
          data: { jsonrpc: '2.0', id: 101, method: 'call', params: [this.session, 'luci-rpc', 'getWirelessDevices', {}] },
          header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
          timeout: 3000,
          success: (res) => {
            let interfaces = []
            if (res.data && res.data.result && res.data.result[1]) {
              const radios = res.data.result[1]
              Object.values(radios).forEach(radio => {
                let band = radio.config && radio.config.band ? radio.config.band.toUpperCase() : '-'
                if (radio.interfaces && Array.isArray(radio.interfaces)) {
                  radio.interfaces.forEach(iface => {
                    if (iface.ifname) {
                      interfaces.push({ ifname: iface.ifname, band })
                      this.wirelessIfBandMap[iface.ifname] = band
                    }
                  })
                }
              })
            }
            resolve(interfaces)
          },
          fail: () => resolve([])
        })
      })
    },
    getClientsByInterface(ifname) {
      return new Promise((resolve) => {
        uni.request({
          method: 'POST', url: this.url,
          data: { jsonrpc: '2.0', id: 102, method: 'call', params: [this.session, 'iwinfo', 'assoclist', { device: ifname }] },
          header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
          timeout: 3000,
          success: (res) => {
            let clients = []
            if (res.data && res.data.result && res.data.result[1] && res.data.result[1].results) {
              clients = res.data.result[1].results
            }
            resolve(clients)
          },
          fail: () => resolve([])
        })
      })
    },
    wifiInitial(client) {
      const name = client.hostname || client.mac || '?'
      return name.charAt(0).toUpperCase()
    },
    wifiAvatarColor(client) {
      const palette = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4']
      let h = 0
      for (const c of (client.mac || '')) h = (h * 31 + c.charCodeAt(0)) & 0xffff
      return palette[h % palette.length]
    },
    signalBadgeStyle(signal) {
      const s = Number(signal)
      if (s >= -60) return { background: '#dcfce7', color: '#16a34a' }
      if (s >= -75) return { background: '#fef9c3', color: '#ca8a04' }
      return { background: '#fee2e2', color: '#dc2626' }
    },

    formatTime(val) {
      if (!val && val !== 0) return '-'
      const s = parseInt(val)
      const d = Math.floor(s / 86400)
      const h = Math.floor((s % 86400) / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = s % 60
      let str = ''
      if (d > 0) str += `${d}d `
      if (h > 0 || d > 0) str += `${h}h `
      if (m > 0 || h > 0 || d > 0) str += `${m}m `
      str += `${sec}s`
      return str.trim()
    },
    formatSingleRate(client, dir) {
      const info = (client[dir] || {})
      const rate = info.rate ? (info.rate / 1000).toFixed(1) : '-'
      const mhz = info.mhz ? `${info.mhz}MHz` : ''
      let mcsType = ''
      if (info.ht === true) mcsType = 'ht'
      else if (info.vht === true) mcsType = 'vht'
      else if (info.he === true) mcsType = 'he'
      else if (info.eht === true) mcsType = 'eht'
      let mcsStr = ''
      if (typeof info.mcs === 'number' && mcsType) mcsStr = `${mcsType}-mcs${info.mcs}`
      let str = `${rate} Mbit/s`
      if (mhz) str += ` ${mhz}`
      if (mcsStr) str += ` ${mcsStr}`
      return str
    },
    showClientDetail(client) {
      this.detailClient = client
      this.showDetail = true
    },

    // ── DHCP ──────────────────────────────────────────────────────
    fetchDHCPv4List() {
      this.dhcpv4List = []
      uni.request({
        method: 'POST', url: this.url,
        data: { jsonrpc: '2.0', id: 201, method: 'call', params: [this.session, 'luci-rpc', 'getDHCPLeases', {}] },
        header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
        timeout: 3000,
        success: (res) => {
          if (res.data && res.data.result && res.data.result[1] && res.data.result[1].dhcp_leases) {
            this.dhcpv4List = res.data.result[1].dhcp_leases
          }
        }
      })
    },
    fetchDHCPv6List() {
      this.dhcpv6List = []
      uni.request({
        method: 'POST', url: this.url,
        data: { jsonrpc: '2.0', id: 202, method: 'call', params: [this.session, 'luci-rpc', 'getDHCPLeases', {}] },
        header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
        timeout: 3000,
        success: (res) => {
          if (res.data && res.data.result && res.data.result[1] && res.data.result[1].dhcp6_leases) {
            this.dhcpv6List = res.data.result[1].dhcp6_leases
          }
        }
      })
    },
    getDHCPv4Leases() {
      return new Promise((resolve) => {
        uni.request({
          method: 'POST', url: this.url,
          data: { jsonrpc: '2.0', id: 201, method: 'call', params: [this.session, 'luci-rpc', 'getDHCPLeases', {}] },
          header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
          timeout: 3000,
          success: (res) => {
            if (res.data && res.data.result && res.data.result[1] && res.data.result[1].dhcp_leases) {
              resolve(res.data.result[1].dhcp_leases)
            } else { resolve([]) }
          },
          fail: () => resolve([])
        })
      })
    },
    getDHCPv6Leases() {
      return new Promise((resolve) => {
        uni.request({
          method: 'POST', url: this.url,
          data: { jsonrpc: '2.0', id: 202, method: 'call', params: [this.session, 'luci-rpc', 'getDHCPLeases', {}] },
          header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
          timeout: 3000,
          success: (res) => {
            if (res.data && res.data.result && res.data.result[1] && res.data.result[1].dhcp6_leases) {
              resolve(res.data.result[1].dhcp6_leases)
            } else { resolve([]) }
          },
          fail: () => resolve([])
        })
      })
    },
    formatLeaseTime(val) {
      if (!val && val !== 0) return '-'
      const s = parseInt(val)
      const d = Math.floor(s / 86400)
      const h = Math.floor((s % 86400) / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = s % 60
      if (d > 0) return `${d}d ${h}h ${m}m ${sec}s`
      if (h > 0) return `${h}h ${m}m ${sec}s`
      if (m > 0) return `${m}m ${sec}s`
      return `${sec}s`
    },

    // ── 踢出无线客户端 ────────────────────────────────────────────
    kickClient(client) {
      uni.showModal({
        title: this.$t('client.tip'),
        content: this.$t('client.confirm_disconnect', {
          mac: client.mac,
          hostname: client.hostname ? '(' + client.hostname + ')' : ''
        }),
        success: (res) => {
          if (res.confirm) {
            uni.request({
              method: 'POST', url: this.url,
              data: {
                jsonrpc: '2.0', id: 93, method: 'call',
                params: [this.session, `hostapd.${client.ifname}`, 'del_client', {
                  addr: client.mac, deauth: true, reason: 5, ban_time: 60000
                }]
              },
              header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
              timeout: 3000,
              success: () => {
                uni.showToast({ title: this.$t('client.disconnect_success'), icon: 'success' })
                this.loadData()
              },
              fail: () => {
                uni.showToast({ title: this.$t('client.disconnect_failed'), icon: 'none' })
              }
            })
          }
        }
      })
    },

    // ── 旧 tooltip（无线客户端 tab 遗留，保留） ───────────────────
    showAppTooltip(appName, event) {
      this.tooltip.text = appName
      this.tooltip.show = true
      const rect = event.target.getBoundingClientRect()
      this.tooltip.style = {
        position: 'fixed',
        left: rect.left + rect.width / 2 + 'px',
        top: rect.top - 10 + 'px',
        transform: 'translateX(-50%)',
        zIndex: 9999
      }
      setTimeout(() => { this.hideAppTooltip() }, 3000)
    },
    hideAppTooltip() {
      this.tooltip.show = false
    },

    // 保留旧导航方法（client_detail.vue 仍可直接访问）
    goToUserDetail(user) {
      const userInfo = encodeURIComponent(JSON.stringify(user))
      uni.navigateTo({ url: `/pages/openwrt/client_detail?userInfo=${userInfo}` })
    },
    onIconError(event, appId) {
      this.userList.forEach(user => {
        if (user.applist) {
          user.applist.forEach(app => {
            if (app.id === appId) this.$set(app, 'iconError', true)
          })
        }
      })
    }
  }
}
</script>

<style scoped>
@import '@/styles/common.scss';

.container {
  padding: 20rpx;
}

/* ── 无线终端新卡片样式 ────────────────────────────────────────── */
.wc-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 28rpx 0;
  margin-bottom: 16rpx;
}
.wc-head {
  display: flex;
  align-items: center;
  padding-bottom: 20rpx;
}
.wc-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wc-avatar-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}
.wc-head-info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.wc-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1c1c1e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wc-sub {
  font-size: 22rpx;
  color: #8e8e93;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wc-band-badge {
  flex-shrink: 0;
  border-radius: 8rpx;
  padding: 0 12rpx 2px;
  margin-left: 16rpx;
  background: #eff6ff;
}
.wc-band-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #3b82f6;
  line-height: 1;
}
.wc-signal-inline {
  border-radius: 8rpx;
  padding: 0 12rpx 2px;
}
.wc-signal-inline-text {
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;
}
.wc-kick-wrap {
  flex-shrink: 0;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12rpx;
}
.wc-kick-icon {
  font-size: 24rpx;
  color: #c7c7cc;
}
.wc-divider {
  height: 1rpx;
  background: rgba(0, 0, 0, 0.05);
}
.wc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}
.wc-row-last {
  border-bottom: none;
  padding-bottom: 20rpx;
}
.wc-lbl {
  font-size: 26rpx;
  color: #8e8e93;
  flex-shrink: 0;
}
.wc-val {
  font-size: 26rpx;
  font-weight: 500;
  color: #1c1c1e;
  text-align: right;
  flex: 1;
  margin-left: 16rpx;
}
.wc-band {
  font-size: 22rpx;
  color: #8e8e93;
  font-weight: 400;
}

/* ── 旧样式（无线客户端 / DHCP tab 保留） ────────────────────── */
.client-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  padding: 40rpx;
}
.client-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}
.client-row:last-child { border-bottom: none; }
.label { font-size: 26rpx; color: #666; font-weight: 500; min-width: 120rpx; flex-shrink: 0; }
.value { font-size: 26rpx; font-weight: bold; color: #333; text-align: right; max-width: 60%; word-break: break-all; flex: 1; }
.client-empty {
  color: #666; text-align: center; margin: 40rpx 0; font-size: 28rpx;
  background: rgba(255, 255, 255, 0.95); border-radius: 20rpx; padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}
.client-detail-mask {
  position: fixed; left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.client-detail-popup {
  background: #fff; border-radius: 18rpx; padding: 36rpx 40rpx 28rpx;
  min-width: 400rpx; max-width: 90vw; max-height: 80vh; overflow-y: auto;
}
.client-detail-title { font-size: 30rpx; font-weight: bold; color: #2563eb; margin-bottom: 18rpx; }
.client-detail-row { font-size: 24rpx; color: #333; margin-bottom: 8rpx; display: flex; flex-wrap: wrap; }
.client-detail-key { color: #888; min-width: 120rpx; font-weight: 500; }
.client-detail-value { color: #222; font-weight: 500; margin-left: 8rpx; }
.band-info { color: #666; font-size: 24rpx; margin-left: 4rpx; font-weight: normal; }
.kick-btn { margin-left: 20rpx; cursor: pointer; transition: transform 0.2s; }
.kick-btn:active { transform: scale(0.9); }
.app-tooltip {
  background: rgba(0, 0, 0, 0.8); color: white; padding: 8rpx 16rpx;
  border-radius: 8rpx; font-size: 24rpx; white-space: nowrap; pointer-events: none;
}

/* ── 新卡片样式（Tab 0 appfilter 模式） ──────────────────────── */
.cl-user-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx 26rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
}
.cl-user-card:active { opacity: 0.85; }

.cl-card-head { display: flex; align-items: center; gap: 20rpx; margin-bottom: 16rpx; }
.cl-avatar {
  width: 80rpx; height: 80rpx; border-radius: 20rpx;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cl-avatar-text { font-size: 32rpx; color: #fff; font-weight: 700; }
.cl-card-info { flex: 1; min-width: 0; }
.cl-name-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 6rpx; }
.cl-card-name { font-size: 28rpx; font-weight: 600; color: #1c1c1e; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cl-card-sub { font-size: 22rpx; color: #8e8e93; }

/* 状态 badge */
.cl-status-badge { padding: 6rpx 14rpx; border-radius: 20rpx; flex-shrink: 0; display: flex; align-items: center; }
.cl-status-active { background: #dcfce7; }
.cl-status-online  { background: #dbeafe; }
.cl-status-offline { background: #f3f4f6; }
.cl-status-text { font-size: 20rpx; font-weight: 600; line-height: 1; }
.cl-status-active .cl-status-text  { color: #16a34a; }
.cl-status-online  .cl-status-text { color: #2563eb; }
.cl-status-offline .cl-status-text { color: #6b7280; }

/* 速率行 */
.cl-card-rates { display: flex; align-items: center; gap: 20rpx; margin-bottom: 12rpx; }
.cl-rate-item { display: flex; align-items: center; gap: 4rpx; }
.cl-rate-arrow { font-size: 24rpx; font-weight: 700; }
.cl-up { color: #00c4cc; }
.cl-down { color: #4facfe; }
.cl-rate-val { font-size: 24rpx; color: #3c3c43; font-weight: 500; }
.cl-today-stats { margin-left: auto; display: flex; align-items: center; gap: 10rpx; }
.cl-today-offline-row { display: flex; align-items: center; gap: 10rpx; margin-bottom: 12rpx; }
.cl-today-stat { font-size: 22rpx; color: #8e8e93; background: #F2F2F7; padding: 4rpx 10rpx; border-radius: 8rpx; line-height: 1; }

/* 应用图标行 */
.cl-app-icons { display: flex; align-items: center; gap: 10rpx; margin-top: 4rpx; }
.cl-icon-slot { position: relative; flex-shrink: 0; }
.cl-app-icon-img { width: 48rpx; height: 48rpx; border-radius: 10rpx; display: block; }
.cl-app-icon-fb { width: 48rpx; height: 48rpx; border-radius: 10rpx; display: flex; align-items: center; justify-content: center; }
.cl-icon-fb-text { font-size: 20rpx; color: #fff; font-weight: 700; }
.cl-icon-active-dot { position: absolute; top: -3rpx; left: -3rpx; width: 16rpx; height: 16rpx; background: #22c55e; border-radius: 50%; border: 3rpx solid #fff; }
.cl-url-label { margin-left: auto; font-size: 22rpx; color: #8e8e93; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; }

/* ── 底部详情面板 ────────────────────────────────────────────── */
.cl-detail-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 200;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.cl-detail-panel {
  background: #F2F2F7; border-radius: 24rpx 24rpx 0 0;
  height: 80vh; display: flex; flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 面板头 */
.cl-detail-head {
  display: flex; align-items: center; gap: 20rpx;
  padding: 32rpx 30rpx 24rpx;
  background: #ffffff; border-radius: 24rpx 24rpx 0 0;
  border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0;
}
.cl-detail-avatar { width: 72rpx; height: 72rpx; border-radius: 18rpx; }
.cl-detail-title-wrap { flex: 1; display: flex; align-items: center; gap: 14rpx; min-width: 0; }
.cl-detail-title { font-size: 30rpx; font-weight: 700; color: #1c1c1e; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cl-detail-close { width: 56rpx; height: 56rpx; background: #F2F2F7; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cl-detail-close-text { font-size: 24rpx; color: #8e8e93; }

/* Tab 栏 */
.cl-detail-tabs {
  display: flex; background: #ffffff;
  border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0;
}
.cl-detail-tab {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 22rpx 20rpx 20rpx; position: relative;
}
.cl-detail-tab-text { font-size: 26rpx; color: #8e8e93; font-weight: 500; }
.cl-detail-tab-active .cl-detail-tab-text { color: #007AFF; }
.cl-detail-tab-active::after {
  content: ''; position: absolute; bottom: 0; left: 25%; right: 25%;
  height: 4rpx; background: #007AFF; border-radius: 4rpx;
}

/* 内容滚动区 */
.cl-detail-scroll { flex: 1; height: 0; }

/* section 卡片 */
.cl-detail-section {
  background: #ffffff; border-radius: 16rpx; margin: 16rpx 20rpx 0; padding: 24rpx 26rpx;
}

/* KV 行 */
.cl-kv-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.05);
}
.cl-kv-row:last-child { border-bottom: none; }
.cl-kv-lbl { font-size: 24rpx; color: #8e8e93; flex-shrink: 0; min-width: 130rpx; }
.cl-kv-val { font-size: 26rpx; color: #1c1c1e; font-weight: 500; flex: 1; text-align: right; word-break: break-all; }

/* 空 / 加载状态 */
.cl-tab-state { display: flex; align-items: center; justify-content: center; padding: 80rpx 40rpx; }
.cl-loading-text { font-size: 26rpx; color: #999; }
.cl-empty-text { font-size: 26rpx; color: #c7c7cc; }

/* 饼图 */
.cl-pie-section { padding: 30rpx 26rpx 20rpx; display: flex; flex-direction: column; align-items: center; }
.cl-pie-canvas { width: 250px; height: 250px; display: block; }
.cl-pie-legend-section { padding: 0 26rpx; }
.cl-pie-legend-row { display: flex; align-items: center; gap: 14rpx; padding: 16rpx 0; }
.cl-pie-legend-border { border-top: 1rpx solid rgba(0,0,0,0.05); }
.cl-pie-legend-dot { width: 20rpx; height: 20rpx; border-radius: 50%; flex-shrink: 0; }
.cl-pie-legend-name { flex: 1; font-size: 26rpx; color: #1c1c1e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cl-pie-legend-pct { font-size: 24rpx; color: #8e8e93; min-width: 60rpx; text-align: right; flex-shrink: 0; }
.cl-pie-legend-time { font-size: 24rpx; color: #3c3c43; min-width: 80rpx; text-align: right; flex-shrink: 0; }

/* 应用记录 */
.cl-record-row {
  display: flex; align-items: center; gap: 16rpx;
  padding: 16rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.05);
}
.cl-record-last { border-bottom: none; }
.cl-record-icon-wrap {
  width: 44rpx; height: 44rpx; flex-shrink: 0; position: relative;
  overflow: hidden; border-radius: 10rpx; background: rgba(0,122,255,0.08);
}
.cl-record-icon-img { width: 44rpx; height: 44rpx; border-radius: 10rpx; }
.cl-record-icon-fb { font-size: 20rpx; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.cl-record-body { flex: 1; min-width: 0; }
.cl-record-name { font-size: 26rpx; color: #1c1c1e; font-weight: 500; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cl-record-time { font-size: 22rpx; color: #8e8e93; display: block; margin-top: 4rpx; }
</style>
