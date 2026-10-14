<template>
	<view class="fwx-page">
		<!-- 顶部导航 -->
		<view class="fwx-nav">
			<view style="width: 60rpx;"></view>
			<text class="fwx-nav-title">{{ $t('fwx_monitor.title') }}</text>
			<view style="width: 60rpx;"></view>
		</view>

		<!-- 页面级 Tab -->
		<view class="fwx-page-tabs">
			<view class="fwx-page-tab" :class="{ 'fwx-page-tab-active': pageTab === 0 }" @click="switchTab(0)">
				<text class="fwx-page-tab-text">{{ $t('fwx_monitor.tab_sessions') }}</text>
			</view>
			<view class="fwx-page-tab" :class="{ 'fwx-page-tab-active': pageTab === 1 }" @click="switchTab(1)">
				<text class="fwx-page-tab-text">{{ $t('fwx_monitor.tab_records') }}</text>
			</view>
		</view>

		<!-- Tab 0：会话统计 -->
		<scroll-view
			v-if="pageTab === 0"
			class="fwx-scroll"
			scroll-y="true"
			show-scrollbar="false"
		>
			<view class="fwx-inner" style="padding-bottom: calc(100rpx + env(safe-area-inset-bottom));">

				<!-- KPI 卡片 -->
				<view class="fwx-kpi-grid">
					<view class="fwx-kpi-card fwx-kpi-current">
						<text class="fwx-kpi-value">{{ sessionCurrent }}</text>
						<text class="fwx-kpi-label">{{ $t('fwx_monitor.kpi_current') }}</text>
					</view>
					<view class="fwx-kpi-card fwx-kpi-avg">
						<text class="fwx-kpi-value">{{ sessionAvg }}</text>
						<text class="fwx-kpi-label">{{ $t('fwx_monitor.kpi_avg') }}</text>
					</view>
					<view class="fwx-kpi-card fwx-kpi-peak">
						<text class="fwx-kpi-value">{{ sessionPeak }}</text>
						<text class="fwx-kpi-label">{{ $t('fwx_monitor.kpi_peak') }}</text>
					</view>
				</view>

				<!-- 时间范围选择 -->
				<view class="fwx-range-tabs">
					<view
						v-for="(r, i) in rangeOptions"
						:key="i"
						class="fwx-range-tab"
						:class="{ 'fwx-range-tab-active': currentRange === r.value }"
						@click="setRange(r.value)"
					>
						<text class="fwx-range-tab-text">{{ r.label }}</text>
					</view>
				</view>

				<!-- 折线图 -->
				<view class="fwx-chart-card">
					<l-echart ref="sessionChart" @finished="initSessionChart"></l-echart>
				</view>

			</view>
		</scroll-view>

		<!-- Tab 1：终端记录 -->
		<scroll-view
			v-if="pageTab === 1"
			class="fwx-scroll"
			scroll-y="true"
			show-scrollbar="false"
		>
			<view class="fwx-inner" style="padding-bottom: calc(100rpx + env(safe-area-inset-bottom));">

				<!-- 搜索栏 -->
				<view class="fwx-filter-bar">
					<input
						class="fwx-filter-input"
						v-model="filterMac"
						:placeholder="$t('fwx_monitor.mac_placeholder')"
						placeholder-style="color: #c7c7cc;"
						maxlength="17"
					/>
					<!-- 快速时间筛选 -->
					<view class="fwx-time-chips">
						<view
							v-for="(t, i) in timeOptions"
							:key="i"
							class="fwx-time-chip"
							:class="{ 'fwx-time-chip-active': filterTime === t.value }"
							@click="setTimeFilter(t.value)"
						>
							<text class="fwx-time-chip-text">{{ t.label }}</text>
						</view>
					</view>
					<view class="fwx-filter-btns">
						<view class="fwx-btn-search" @click="doSearch">
							<text class="fwx-btn-text">{{ $t('fwx_monitor.search') }}</text>
						</view>
						<view class="fwx-btn-reset" @click="doReset">
							<text class="fwx-btn-text fwx-btn-text-gray">{{ $t('fwx_monitor.reset') }}</text>
						</view>
					</view>
				</view>

				<!-- 汇总 -->
				<view class="fwx-summary-bar" v-if="recordsTotal > 0">
					<text class="fwx-summary-text">{{ $t('fwx_monitor.records_total', { total: recordsTotal }) }}</text>
				</view>

				<!-- 记录初始加载 -->
				<view v-if="recordsLoading && records.length === 0" class="fwx-loading-inline">
					<view class="fwx-spinner"></view>
				</view>

				<!-- 记录列表 -->
				<view v-else-if="records.length">
					<view
						v-for="(rec, i) in records"
						:key="i"
						class="fwx-record-card"
					>
						<!-- 记录头：时间 + 事件 badge -->
						<view class="fwx-record-head">
							<text class="fwx-record-time">{{ rec.time_str || '--' }}</text>
							<view class="fwx-event-badge" :class="rec.action == 0 ? 'fwx-online' : 'fwx-offline'">
								<text class="fwx-event-text">{{ $t(rec.action == 0 ? 'fwx_monitor.event_online' : 'fwx_monitor.event_offline') }}</text>
							</view>
						</view>
						<!-- 用户信息 -->
						<view class="fwx-record-user-row">
							<view class="fwx-avatar-sm" :style="{ background: macColor(rec.mac) }">
								<text class="fwx-avatar-sm-text">{{ recInitial(rec) }}</text>
							</view>
							<view class="fwx-record-user-info">
								<text class="fwx-record-name">{{ recName(rec) }}</text>
								<text class="fwx-record-mac">{{ rec.mac || '--' }}</text>
							</view>
						</view>
						<!-- 下线才显示流量/时长 -->
						<view v-if="rec.action != 0" class="fwx-record-stats">
							<view class="fwx-record-stat-item">
								<text class="fwx-stat-lbl">{{ $t('fwx_monitor.stat_up') }}</text>
								<text class="fwx-stat-val fwx-up">{{ formatBytes(rec.up_bytes) }}</text>
							</view>
							<view class="fwx-record-stat-item">
								<text class="fwx-stat-lbl">{{ $t('fwx_monitor.stat_down') }}</text>
								<text class="fwx-stat-val fwx-down">{{ formatBytes(rec.down_bytes) }}</text>
							</view>
							<view class="fwx-record-stat-item" v-if="rec.online_duration">
								<text class="fwx-stat-lbl">{{ $t('fwx_monitor.stat_online_duration') }}</text>
								<text class="fwx-stat-val">{{ formatDuration(rec.online_duration) }}</text>
							</view>
							<view class="fwx-record-stat-item" v-if="rec.active_duration">
								<text class="fwx-stat-lbl">{{ $t('fwx_monitor.stat_active_duration') }}</text>
								<text class="fwx-stat-val">{{ formatDuration(rec.active_duration) }}</text>
							</view>
						</view>
						<!-- 近期应用 -->
						<view v-if="rec.recent_apps && rec.recent_apps.length" class="fwx-record-apps">
							<view v-for="(app, ai) in rec.recent_apps.slice(0, 5)" :key="ai" class="fwx-app-chip">
								<text class="fwx-app-chip-text">{{ app.name }}</text>
							</view>
						</view>
					</view>

					<!-- 加载更多 -->
					<view class="fwx-load-more" v-if="recordsHasMore" @click="loadMoreRecords">
						<view v-if="recordsLoadingMore" class="fwx-load-more-spinner"></view>
						<text class="fwx-load-more-text">{{ recordsLoadingMore ? $t('fwx_common.loading_more') : $t('fwx_common.load_more') }}</text>
					</view>
				</view>

				<view v-else-if="!recordsLoading" class="fwx-empty-page">
					<text class="fwx-empty-text">{{ $t('fwx_monitor.no_records') }}</text>
				</view>

			</view>
		</scroll-view>

		<fwx-tab-bar :current="1" />
	</view>
</template>

<script>
import * as echarts from '@/uni_modules/lime-echart/static/echarts.min.js'
import DeviceManager from '@/utils/deviceManager.js'
import { APP_MODE } from '@/config/appMode.js'
import FwxTabBar from '@/components/fwxTabBar.vue'

const USER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

// 5min=60点(5s/点), hour=60点(1min/点), day=24点(1h/点)
const RANGE_WINDOW = { '5min': 60, 'hour': 60, 'day': 24 }

export default {
	components: { FwxTabBar },
	data() {
		return {
			device: null,
			ubusUrl: '',
			pageTab: 0,
			// 会话统计
			chart: null,
			chartReady: false,
			currentRange: '5min',
			sessionCurrent: 0,
			sessionAvg: 0,
			sessionPeak: 0,
			pendingChartData: null,
			refreshTimer: null,
			// 终端记录
			filterMac: '',
			filterTime: 'all',
			records: [],
			recordsLoading: false,
			recordsLoadingMore: false,
			recordsPage: 1,
			recordsTotal: 0,
			recordsHasMore: false
		}
	},

	computed: {
		rangeOptions() {
			return [
				{ label: this.$t('fwx_monitor.range_5min'), value: '5min' },
				{ label: this.$t('fwx_monitor.range_hour'), value: 'hour' },
				{ label: this.$t('fwx_monitor.range_day'),  value: 'day' }
			]
		},
		timeOptions() {
			return [
				{ label: this.$t('fwx_monitor.filter_all'),    value: 'all' },
				{ label: this.$t('fwx_monitor.filter_today'),  value: 'today' },
				{ label: this.$t('fwx_monitor.filter_3days'),  value: '3days' }
			]
		}
	},

	onLoad() {
		this.device = DeviceManager.getCurrentDevice()
		if (!this.device) { uni.reLaunch({ url: APP_MODE === 'h5_single' ? '/pages/single/login' : '/pages/device_list' }); return }
		const protocol = this.device.useHttps ? 'https' : 'http'
		const host = DeviceManager.formatHostForUrl(this.device.ip)
		this.ubusUrl = `${protocol}://${host}:${this.device.port}/ubus`
	},
	onShow() { this.startTimer() },
	onHide() { this.stopTimer() },
	onUnload() { this.stopTimer() },

	methods: {
		switchTab(tab) {
			this.pageTab = tab
			if (tab === 0) {
				this.startTimer()
				this.$nextTick(() => { if (this.chart) this.chart.resize() })
			} else {
				this.stopTimer()
				if (this.records.length === 0 && !this.recordsLoading) {
					this.fetchRecords(1, false)
				}
			}
		},

		// --- 计时器 ---
		startTimer() {
			this.stopTimer()
			if (this.pageTab !== 0) return
			this.fetchSession()
			this.refreshTimer = setInterval(() => this.fetchSession(), 3000)
		},
		stopTimer() {
			if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null }
		},

		// --- ubus 通用 ---
		ubus(api, data, cb, failCb) {
			console.log('[Monitor] ubus:', api, '| sysauth:', this.device && this.device.sysauth ? this.device.sysauth.slice(0, 8) + '...' : 'MISSING', '| url:', this.ubusUrl)
			uni.request({
				url: this.ubusUrl, method: 'POST',
				header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
				data: {
					jsonrpc: '2.0', id: 1, method: 'call',
					params: [this.device.sysauth, 'fwx', 'common', { api, CopyRight: 'www.fanchmwrt.com', data }]
				},
				timeout: 6000,
				success: (res) => {
					console.log('[Monitor] ubus response:', api, '| status:', res.statusCode, '| result[0]:', res.data && res.data.result && res.data.result[0])
					if (res.data && res.data.result && res.data.result[0] === 0) {
						const p = res.data.result[1]
						cb((p && p.data) ? p.data : p)
					} else {
						console.warn('[Monitor] ubus non-zero:', api, JSON.stringify(res.data && res.data.result))
						if (failCb) failCb()
					}
				},
				fail: (err) => {
					console.error('[Monitor] ubus fail:', api, JSON.stringify(err))
					if (failCb) failCb()
				}
			})
		},

		// --- 会话统计 ---
		async initSessionChart() {
			try {
				this.chart = await this.$refs.sessionChart.init(echarts)
				this.chart.setOption(this.buildChartOption([], []))
				this.chartReady = true
				if (this.pendingChartData) {
					this.applyChartData(this.pendingChartData)
					this.pendingChartData = null
				}
			} catch (e) {}
		},

		buildChartOption(labels, values) {
			const lineColor = '#38bdf8'
			return {
				animation: false,
				color: [lineColor],
				grid: { left: '5%', right: '3%', top: '12%', bottom: '12%', containLabel: true },
				tooltip: {
					trigger: 'axis',
					formatter: (params) => {
						if (!params || !params.length || params[0].data == null) return ''
						return params[0].axisValue + '<br/>' + this.$t('fwx_monitor.chart_sessions') + ': ' + params[0].data
					}
				},
				xAxis: {
					type: 'category',
					boundaryGap: false,
					data: labels,
					axisLabel: { color: '#8e8e93', fontSize: 10, showMinLabel: true, showMaxLabel: true },
					axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
					splitLine: { show: false }
				},
				yAxis: {
					type: 'value',
					minInterval: 1,
					axisLabel: { color: '#8e8e93', fontSize: 10 },
					splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)', type: 'dashed' } }
				},
				series: [{
					name: this.$t('fwx_monitor.chart_sessions'),
					type: 'line',
					smooth: this.currentRange === '5min',
					symbol: 'none',
					data: values,
					lineStyle: { width: 1.2, color: lineColor },
					itemStyle: { color: lineColor },
					areaStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: 'rgba(56, 189, 248, 0.35)' },
							{ offset: 1, color: 'rgba(56, 189, 248, 0.03)' }
						])
					}
				}]
			}
		},

		setRange(range) {
			if (this.currentRange === range) return
			this.currentRange = range
			this.sessionCurrent = 0
			this.sessionAvg = 0
			this.sessionPeak = 0
			if (this.chart) this.chart.setOption(this.buildChartOption([], []))
			this.fetchSession()
		},

		fetchSession() {
			if (!this.ubusUrl) return
			this.ubus('get_history_session', { range: this.currentRange }, (data) => {
				this.sessionCurrent = parseInt(data.current || 0)
				this.sessionAvg     = parseInt(data.avg || 0)
				this.sessionPeak    = parseInt(data.peak || 0)
				if (this.chartReady) {
					this.applyChartData(data)
				} else {
					this.pendingChartData = data
				}
			})
		},

		applyChartData(data) {
			const rawList = Array.isArray(data.list) ? data.list : []
			const values = rawList.map(item =>
				(item && typeof item === 'object') ? parseInt(item.value || 0) : parseInt(item || 0)
			)
			const windowSize = RANGE_WINDOW[this.currentRange] || 60
			// 右对齐填充
			const padded = new Array(windowSize).fill(null)
			const count = Math.min(values.length, windowSize)
			for (let i = 0; i < count; i++) padded[windowSize - count + i] = values[values.length - count + i]

			const labels = this.buildLabels(padded.length, data)
			const interval = Math.max(0, Math.ceil(padded.length / 8) - 1)
			this.chart.setOption({
				xAxis: { data: labels, axisLabel: { interval } },
				series: [{ smooth: this.currentRange === '5min', data: padded }]
			})
		},

		buildLabels(count, data) {
			if (count <= 0) return []
			if (this.currentRange === 'day') {
				// 绝对时间标签 HH:mm
				const labels = []
				const nowMs = Date.now()
				const stepMs = 3600 * 1000
				const startMs = nowMs - (count - 1) * stepMs
				const p = n => String(n).padStart(2, '0')
				for (let i = 0; i < count; i++) {
					const d = new Date(startMs + i * stepMs)
					labels.push(`${p(d.getHours())}:${p(d.getMinutes())}`)
				}
				return labels
			}
			// 相对标签：最左 = 窗口宽度前，最右 = now
			const labels = new Array(count).fill('')
			const minutes = parseInt(data.minutes || 0)
			const windowLabel = this.currentRange === '5min' ? '5min'
				: this.currentRange === 'hour' ? '60min'
				: String(minutes || 0) + 'min'
			labels[0] = windowLabel
			labels[count - 1] = '0'
			return labels
		},

		// --- 终端记录 ---
		getTimeRange() {
			if (this.filterTime === 'all') return { start_time: 0, end_time: 0 }
			const now = Math.floor(Date.now() / 1000)
			if (this.filterTime === 'today') {
				const d = new Date()
				d.setHours(0, 0, 0, 0)
				return { start_time: Math.floor(d.getTime() / 1000), end_time: now }
			}
			if (this.filterTime === '3days') return { start_time: now - 3 * 86400, end_time: now }
			return { start_time: 0, end_time: 0 }
		},

		setTimeFilter(val) {
			this.filterTime = val
			this.doSearch()
		},

		doSearch() {
			this.recordsPage = 1
			this.records = []
			this.fetchRecords(1, false)
		},

		doReset() {
			this.filterMac = ''
			this.filterTime = 'all'
			this.doSearch()
		},

		fetchRecords(page, append, done) {
			if (append) {
				this.recordsLoadingMore = true
			} else {
				this.recordsLoading = true
			}
			const { start_time, end_time } = this.getTimeRange()
			this.ubus('get_user_records', {
				mac: this.filterMac.trim(),
				start_time,
				end_time,
				page,
				page_size: 15
			}, (data) => {
				this.recordsLoading = false
				this.recordsLoadingMore = false
				const list = Array.isArray(data.list) ? data.list : []
				const total = parseInt(data.total_num || data.total || list.length)
				this.recordsTotal = total
				this.recordsPage = page
				if (append) {
					this.records = this.records.concat(list)
				} else {
					this.records = list
				}
				const totalPage = parseInt(data.total_page || Math.ceil(total / 15) || 1)
				this.recordsHasMore = page < totalPage
				if (done) done()
			}, () => {
				this.recordsLoading = false
				this.recordsLoadingMore = false
				if (done) done()
			})
		},

		loadMoreRecords() {
			if (this.recordsLoadingMore || !this.recordsHasMore) return
			this.fetchRecords(this.recordsPage + 1, true)
		},

		// --- 显示辅助 ---
		macColor(mac) {
			if (!mac) return USER_COLORS[0]
			let hash = 0
			for (let i = 0; i < mac.length; i++) hash = ((hash * 31) + mac.charCodeAt(i)) >>> 0
			return USER_COLORS[hash % USER_COLORS.length]
		},
		recInitial(rec) {
			const name = rec.nickname || rec.hostname || rec.mac || '?'
			return name.charAt(0).toUpperCase()
		},
		recName(rec) {
			return rec.nickname || rec.hostname || rec.mac || '--'
		},
		formatBytes(bytes) {
			const v = parseInt(bytes || 0)
			if (v <= 0) return '--'
			const KB = 1024, MB = KB * 1024, GB = MB * 1024
			if (v >= GB) return (v / GB).toFixed(2) + ' GB'
			if (v >= MB) return (v / MB).toFixed(1) + ' MB'
			if (v >= KB) return Math.round(v / KB) + ' KB'
			return v + ' B'
		},
		formatDuration(sec) {
			const s = parseInt(sec || 0)
			if (!s) return '--'
			const h = Math.floor(s / 3600)
			const m = Math.floor((s % 3600) / 60)
			const r = s % 60
			if (h > 0) return `${h}h${m}m`
			if (m > 0) return `${m}m${r}s`
			return `${r}s`
		}
	}
}
</script>

<style scoped>
.fwx-page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }

/* 导航 */
.fwx-nav { display: flex; align-items: center; justify-content: space-between; padding: 88rpx 32rpx 20rpx; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.fwx-nav-title { font-size: 28rpx; font-weight: 400; color: #1c1c1e; flex: 1; text-align: center; }

/* 页面 Tab */
.fwx-page-tabs { display: flex; background: #ffffff; border-bottom: 2rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.fwx-page-tab { flex: 1; padding: 22rpx 0 20rpx; display: flex; align-items: center; justify-content: center; position: relative; }
.fwx-page-tab-text { font-size: 28rpx; color: #8e8e93; font-weight: 500; }
.fwx-page-tab-active .fwx-page-tab-text { color: #007AFF; font-weight: 600; }
.fwx-page-tab-active::after { content: ''; position: absolute; bottom: 0; left: 20%; right: 20%; height: 4rpx; background: #007AFF; border-radius: 4rpx; }

/* 加载 */
@keyframes spin { to { transform: rotate(360deg); } }
.fwx-spinner { width: 52rpx; height: 52rpx; border: 4rpx solid #e5e5e5; border-top-color: #007AFF; border-radius: 50%; animation: spin 0.8s linear infinite; }
.fwx-loading-inline { display: flex; justify-content: center; padding: 60rpx 0; }

/* 滚动内容 */
.fwx-scroll { flex: 1; }
.fwx-inner { padding: 20rpx 24rpx 0; box-sizing: border-box; }

/* KPI 格子 */
.fwx-kpi-grid { display: flex; gap: 14rpx; margin-bottom: 20rpx; }
.fwx-kpi-card { flex: 1; border-radius: 16rpx; padding: 24rpx 10rpx; display: flex; flex-direction: column; align-items: center; gap: 8rpx; background: #ffffff; }
.fwx-kpi-value { font-size: 44rpx; font-weight: 700; }
.fwx-kpi-current .fwx-kpi-value { color: #38bdf8; }
.fwx-kpi-avg     .fwx-kpi-value { color: #a78bfa; }
.fwx-kpi-peak    .fwx-kpi-value { color: #fb923c; }
.fwx-kpi-label { font-size: 22rpx; color: #8e8e93; }

/* 时间范围 Tab */
.fwx-range-tabs { display: flex; gap: 12rpx; margin-bottom: 16rpx; }
.fwx-range-tab { padding: 10rpx 26rpx; border-radius: 20rpx; background: #e5e5ea; }
.fwx-range-tab-active { background: #3b82f6; }
.fwx-range-tab-text { font-size: 24rpx; color: #3c3c43; font-weight: 500; }
.fwx-range-tab-active .fwx-range-tab-text { color: #ffffff; }

/* 图表卡片 */
.fwx-chart-card { background: #ffffff; border-radius: 16rpx; padding: 16rpx 8rpx 12rpx; margin-bottom: 20rpx; height: 380rpx; }

/* 搜索栏 */
.fwx-filter-bar { background: #ffffff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.fwx-filter-input { width: 100%; height: 72rpx; border: 1rpx solid #e5e5ea; border-radius: 10rpx; padding: 0 20rpx; font-size: 26rpx; color: #1c1c1e; box-sizing: border-box; }
.fwx-time-chips { display: flex; gap: 12rpx; margin-top: 16rpx; }
.fwx-time-chip { padding: 10rpx 26rpx; border-radius: 20rpx; background: #e5e5ea; }
.fwx-time-chip-active { background: #3b82f6; }
.fwx-time-chip-text { font-size: 24rpx; color: #3c3c43; }
.fwx-time-chip-active .fwx-time-chip-text { color: #ffffff; }
.fwx-filter-btns { display: flex; gap: 16rpx; margin-top: 16rpx; }
.fwx-btn-search { flex: 1; height: 72rpx; background: #007AFF; border-radius: 10rpx; display: flex; align-items: center; justify-content: center; }
.fwx-btn-reset  { flex: 1; height: 72rpx; background: #e5e5ea; border-radius: 10rpx; display: flex; align-items: center; justify-content: center; }
.fwx-btn-text { font-size: 28rpx; color: #ffffff; font-weight: 600; }
.fwx-btn-text-gray { color: #3c3c43; }

/* 汇总条 */
.fwx-summary-bar { padding: 6rpx 4rpx 14rpx; }
.fwx-summary-text { font-size: 24rpx; color: #8e8e93; }

/* 终端记录卡片 */
.fwx-record-card { background: #ffffff; border-radius: 16rpx; padding: 20rpx 24rpx; margin-bottom: 14rpx; }
.fwx-record-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14rpx; }
.fwx-record-time { font-size: 24rpx; color: #8e8e93; }
.fwx-event-badge { padding: 6rpx 18rpx; border-radius: 20rpx; }
.fwx-online  { background: #dcfce7; } .fwx-online  .fwx-event-text { color: #16a34a; }
.fwx-offline { background: #fee2e2; } .fwx-offline .fwx-event-text { color: #dc2626; }
.fwx-event-text { font-size: 22rpx; font-weight: 700; }

/* 用户行 */
.fwx-record-user-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 14rpx; }
.fwx-avatar-sm { width: 64rpx; height: 64rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fwx-avatar-sm-text { font-size: 26rpx; color: #fff; font-weight: 700; }
.fwx-record-user-info { flex: 1; }
.fwx-record-name { font-size: 28rpx; font-weight: 600; color: #1c1c1e; display: block; }
.fwx-record-mac { font-size: 22rpx; color: #8e8e93; display: block; margin-top: 4rpx; }

/* 流量/时长统计格 */
.fwx-record-stats { display: flex; flex-wrap: wrap; gap: 10rpx; margin-bottom: 12rpx; }
.fwx-record-stat-item { background: #F8F8F8; border-radius: 10rpx; padding: 10rpx 18rpx; display: flex; align-items: center; gap: 8rpx; }
.fwx-stat-lbl { font-size: 22rpx; color: #8e8e93; }
.fwx-stat-val { font-size: 24rpx; font-weight: 600; color: #1c1c1e; }
.fwx-up   { color: #00c4cc; }
.fwx-down { color: #4facfe; }

/* App chips */
.fwx-record-apps { display: flex; flex-wrap: wrap; gap: 10rpx; }
.fwx-app-chip { background: #f0f4ff; border-radius: 8rpx; padding: 6rpx 16rpx; }
.fwx-app-chip-text { font-size: 22rpx; color: #3b82f6; }

/* 加载更多 */
.fwx-load-more { display: flex; align-items: center; justify-content: center; gap: 12rpx; padding: 24rpx 0; }
.fwx-load-more:active { opacity: 0.7; }
.fwx-load-more-spinner { width: 28rpx; height: 28rpx; border: 3rpx solid #e5e5e5; border-top-color: #007AFF; border-radius: 50%; animation: spin 0.8s linear infinite; }
.fwx-load-more-text { font-size: 24rpx; color: #007AFF; }

/* 空状态 */
.fwx-empty-page { padding: 120rpx 0; text-align: center; }
.fwx-empty-text { font-size: 26rpx; color: #c7c7cc; }
</style>
