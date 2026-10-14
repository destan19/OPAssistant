<template>
	<view class="ar-page">
		<view class="ar-nav">
			<view class="ar-back" @click="goBack">
				<image src="/static/back.png" mode="widthFix" class="ar-back-icon" />
			</view>
			<text class="ar-nav-title">{{ $t('fwx_app_record.title') }}</text>
			<view class="ar-refresh" @click="refreshCurrent">
				<text class="ar-refresh-text">↻</text>
			</view>
		</view>

		<view class="ar-tabs">
			<view
				v-for="(tab, i) in tabs"
				:key="i"
				class="ar-tab"
				:class="{ 'ar-tab-active': activeTab === i }"
				@click="switchTab(i)"
			>
				<text class="ar-tab-text" :class="{ 'ar-tab-text-active': activeTab === i }">{{ tab }}</text>
			</view>
		</view>

		<scroll-view scroll-y style="flex: 1;" class="ar-scroll">
			<view class="ar-inner">
				<view class="ar-summary-card">
					<view>
						<text class="ar-summary-title">{{ activeTab === 0 ? $t('fwx_app_record.tab_online') : $t('fwx_app_record.tab_history') }}</text>
						<text class="ar-summary-desc">{{ activeTab === 0 ? $t('fwx_app_record.online_desc') : $t('fwx_app_record.history_desc') }}</text>
					</view>
					<text class="ar-summary-count">{{ $t('fwx_app_record.summary', { total: currentState.totalNum }) }}</text>
				</view>

				<view v-if="activeTab === 1" class="ar-filter-card">
					<view class="ar-input-row">
						<text class="ar-filter-label">MAC</text>
						<input class="ar-mac-input" v-model="filters.mac" :placeholder="$t('fwx_app_record.mac_placeholder')" />
					</view>
					<view class="ar-time-row">
						<text class="ar-filter-label">{{ $t('fwx_app_record.start_time') }}</text>
						<view class="ar-time-controls">
							<picker mode="date" :value="filters.startDate" @change="setStartDate">
								<view class="ar-time-pill">{{ filters.startDate || $t('fwx_app_record.date_placeholder') }}</view>
							</picker>
							<picker mode="time" :value="filters.startTime" @change="setStartTime">
								<view class="ar-time-pill">{{ filters.startTime || $t('fwx_app_record.time_placeholder') }}</view>
							</picker>
						</view>
					</view>
					<view class="ar-time-row">
						<text class="ar-filter-label">{{ $t('fwx_app_record.end_time') }}</text>
						<view class="ar-time-controls">
							<picker mode="date" :value="filters.endDate" @change="setEndDate">
								<view class="ar-time-pill">{{ filters.endDate || $t('fwx_app_record.date_placeholder') }}</view>
							</picker>
							<picker mode="time" :value="filters.endTime" @change="setEndTime">
								<view class="ar-time-pill">{{ filters.endTime || $t('fwx_app_record.time_placeholder') }}</view>
							</picker>
						</view>
					</view>
					<view class="ar-filter-actions">
						<view class="ar-filter-btn ar-filter-reset" @click="resetHistoryFilters">
							<text class="ar-filter-reset-text">{{ $t('fwx_app_record.reset') }}</text>
						</view>
						<view class="ar-filter-btn ar-filter-search" @click="searchHistory">
							<text class="ar-filter-search-text">{{ $t('fwx_app_record.search') }}</text>
						</view>
					</view>
				</view>

				<view v-if="currentState.loading && currentState.list.length === 0" class="ar-state">
					<view class="ar-spinner"></view>
					<text class="ar-state-text">{{ $t('fwx_common.loading') }}</text>
				</view>
				<view v-else-if="currentState.error" class="ar-state">
					<text class="ar-state-text">{{ currentState.error }}</text>
					<view class="ar-retry-btn" @click="refreshCurrent">
						<text class="ar-retry-text">{{ $t('route.retry') }}</text>
					</view>
				</view>
				<view v-else-if="currentState.list.length === 0" class="ar-state">
					<view class="ar-empty-icon">
						<image src="/static/app-record-w.svg" mode="aspectFit" class="ar-empty-icon-img" />
					</view>
					<text class="ar-state-text">{{ $t('fwx_app_record.no_records') }}</text>
				</view>
				<view v-else class="ar-record-list">
					<view
						v-for="(rec, i) in currentState.list"
						:key="activeTab + '_' + i + '_' + rec.mac + '_' + appId(rec) + '_' + firstTime(rec)"
						class="ar-record-card"
					>
						<view class="ar-record-main">
							<view class="ar-app-icon-wrap">
								<image
									v-if="appId(rec) && !iconErrors[appId(rec)]"
									:src="getAppIconUrl(appId(rec))"
									class="ar-app-icon"
									mode="scaleToFill"
									@error="onIconError(appId(rec))"
								/>
								<view v-else class="ar-app-icon-fallback" :style="{ background: appColor(appName(rec)) }">
									<text class="ar-app-icon-text">{{ appName(rec).charAt(0) }}</text>
								</view>
							</view>
							<view class="ar-record-info">
								<view class="ar-record-title-row">
									<text class="ar-app-name">{{ appName(rec) }}</text>
									<view class="ar-badge" :class="isFiltered(rec) ? 'ar-badge-filtered' : 'ar-badge-ok'">
										<text class="ar-badge-text">{{ isFiltered(rec) ? $t('fwx_app_record.filtered') : $t('fwx_app_record.not_filtered') }}</text>
									</view>
								</view>
								<text class="ar-device-name">{{ displayDevice(rec) }}</text>
								<text class="ar-mac">{{ rec.mac || '--' }}</text>
							</view>
						</view>

						<view class="ar-meta-grid">
							<view class="ar-meta-item">
								<text class="ar-meta-label">{{ $t('fwx_app_record.first_visit') }}</text>
								<text class="ar-meta-value">{{ formatTime(firstTime(rec)) }}</text>
							</view>
							<view class="ar-meta-item">
								<text class="ar-meta-label">{{ $t('fwx_app_record.latest_visit') }}</text>
								<text class="ar-meta-value">{{ formatTime(latestTime(rec)) }}</text>
							</view>
							<view class="ar-meta-item">
								<text class="ar-meta-label">{{ $t('fwx_app_record.duration') }}</text>
								<text class="ar-meta-value">{{ formatDuration(totalTime(rec)) }}</text>
							</view>
							<view class="ar-meta-item">
								<text class="ar-meta-label">{{ $t('fwx_app_record.online') }}</text>
								<text class="ar-meta-value" :class="isOnline(rec) ? 'ar-online' : 'ar-offline'">{{ isOnline(rec) ? $t('fwx_app_record.online') : $t('fwx_app_record.offline') }}</text>
							</view>
						</view>
					</view>

					<view v-if="currentState.hasMore" class="ar-load-more" @click="loadMore">
						<view v-if="currentState.loadingMore" class="ar-load-spinner"></view>
						<text class="ar-load-text">{{ currentState.loadingMore ? $t('fwx_common.loading_more') : $t('fwx_common.load_more') }}</text>
					</view>
				</view>

				<view style="height: 40rpx;"></view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'
import { getFanchmwrtAppIconUrl } from '@/utils/fanchmwrtAppIcon.js'

const PAGE_SIZE = 15
const APP_COLORS = [
	'#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
	'#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1'
]

function blankState() {
	return {
		loading: false,
		loadingMore: false,
		list: [],
		page: 1,
		totalPage: 1,
		totalNum: 0,
		hasMore: false,
		error: ''
	}
}

export default {
	data() {
		return {
			device: null,
			ubusUrl: '',
			activeTab: 0,
			onlineState: blankState(),
			historyState: blankState(),
			historyLoaded: false,
			filters: {
				mac: '',
				startDate: '',
				startTime: '00:00',
				endDate: '',
				endTime: '23:59'
			},
			iconErrors: {}
		}
	},

	computed: {
		tabs() {
			return [
				this.$t('fwx_app_record.tab_online'),
				this.$t('fwx_app_record.tab_history')
			]
		},
		currentState() {
			return this.activeTab === 0 ? this.onlineState : this.historyState
		}
	},

	onShow() {
		const device = DeviceManager.getCurrentDevice()
		if (!device) return
		this.device = device
		const protocol = device.useHttps ? 'https' : 'http'
		const host = DeviceManager.formatHostForUrl(device.ip)
		this.ubusUrl = `${protocol}://${host}:${device.port}/ubus`
		if (this.activeTab === 0) {
			this.fetchOnlineRecords(1, false)
		} else if (!this.historyLoaded) {
			this.fetchHistoryRecords(1, false)
		}
	},

	methods: {
		goBack() { uni.navigateBack() },

		switchTab(i) {
			if (this.activeTab === i) return
			this.activeTab = i
			if (i === 0 && this.onlineState.list.length === 0 && !this.onlineState.loading) {
				this.fetchOnlineRecords(1, false)
			}
			if (i === 1 && !this.historyLoaded && !this.historyState.loading) {
				this.fetchHistoryRecords(1, false)
			}
		},

		refreshCurrent() {
			if (this.activeTab === 0) this.fetchOnlineRecords(1, false)
			else this.fetchHistoryRecords(1, false)
		},

		async ubus(api, data = {}) {
			const session = this.device?.sysauth || '00000000000000000000000000000000'
			const res = await uni.request({
				url: this.ubusUrl,
				method: 'POST',
				header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
				data: {
					jsonrpc: '2.0',
					id: 1,
					method: 'call',
					params: [session, 'fwx', 'common', { api, CopyRight: 'www.fanchmwrt.com', data }]
				},
				timeout: 10000
			})
			const payload = res?.data?.result?.[1]
			return (payload && payload.data) ? payload.data : payload
		},

		async fetchOnlineRecords(page = 1, append = false) {
			await this.fetchRecords('online', 'get_active_app_records', { page, page_size: PAGE_SIZE }, append)
		},

		async fetchHistoryRecords(page = 1, append = false) {
			const data = {
				mac: String(this.filters.mac || '').trim(),
				start_time: this.getFilterTimestamp(this.filters.startDate, this.filters.startTime),
				end_time: this.getFilterTimestamp(this.filters.endDate, this.filters.endTime),
				appid: 0,
				page,
				page_size: PAGE_SIZE
			}
			await this.fetchRecords('history', 'get_app_history_records', data, append)
			if (!this.historyState.error) this.historyLoaded = true
		},

		async fetchRecords(type, api, data, append) {
			const state = type === 'online' ? this.onlineState : this.historyState
			if (append) state.loadingMore = true
			else {
				state.loading = true
				state.error = ''
			}
			try {
				const res = await this.ubus(api, data)
				const list = Array.isArray(res?.list) ? res.list : []
				const totalNum = parseInt(res?.total_num || list.length || 0, 10)
				const totalPage = Math.max(1, parseInt(res?.total_page || Math.ceil(totalNum / PAGE_SIZE) || 1, 10))
				const pageNo = parseInt(res?.page || data.page || 1, 10)
				state.totalNum = totalNum
				state.totalPage = totalPage
				state.page = pageNo
				state.list = append ? state.list.concat(list) : list
				state.hasMore = pageNo < totalPage && state.list.length < totalNum
			} catch (e) {
				if (!append) {
					state.list = []
					state.error = this.$t('fwx_app_record.load_failed')
				}
			} finally {
				state.loading = false
				state.loadingMore = false
			}
		},

		loadMore() {
			const state = this.currentState
			if (state.loadingMore || !state.hasMore) return
			const nextPage = state.page + 1
			if (this.activeTab === 0) this.fetchOnlineRecords(nextPage, true)
			else this.fetchHistoryRecords(nextPage, true)
		},

		searchHistory() {
			this.historyLoaded = true
			this.fetchHistoryRecords(1, false)
		},

		resetHistoryFilters() {
			this.filters = {
				mac: '',
				startDate: '',
				startTime: '00:00',
				endDate: '',
				endTime: '23:59'
			}
			this.searchHistory()
		},

		setStartDate(e) { this.filters.startDate = e.detail.value },
		setStartTime(e) { this.filters.startTime = e.detail.value },
		setEndDate(e) { this.filters.endDate = e.detail.value },
		setEndTime(e) { this.filters.endTime = e.detail.value },

		getFilterTimestamp(date, time) {
			if (!date) return 0
			const parts = String(date).split('-').map(n => parseInt(n, 10))
			const timeParts = String(time || '00:00').split(':').map(n => parseInt(n, 10))
			if (parts.length !== 3 || parts.some(n => isNaN(n))) return 0
			const d = new Date(parts[0], parts[1] - 1, parts[2], timeParts[0] || 0, timeParts[1] || 0, 0)
			const ms = d.getTime()
			return ms > 0 ? Math.floor(ms / 1000) : 0
		},

		appName(rec) {
			return rec?.name || rec?.appname || '--'
		},
		appId(rec) {
			const id = rec?.id || rec?.appid || rec?.app_id || rec?.appId
			return id ? String(id) : ''
		},
		firstTime(rec) {
			return rec?.ft || rec?.first_time || 0
		},
		latestTime(rec) {
			return rec?.lt || rec?.latest_time || 0
		},
		totalTime(rec) {
			return rec?.tt || rec?.total_time || 0
		},
		isOnline(rec) {
			return parseInt(rec?.online || 0, 10) === 1
		},
		isFiltered(rec) {
			return parseInt(rec?.act ?? rec?.latest_action ?? 0, 10) === 1
		},
		displayDevice(rec) {
			const nickname = String(rec?.nickname || '').trim()
			const hostname = String(rec?.hostname || '').trim()
			if (nickname && nickname !== '--') return nickname
			if (hostname && hostname !== '--') return hostname
			return rec?.mac || '--'
		},
		formatTime(ts) {
			const t = parseInt(ts || 0, 10)
			if (!t) return '--'
			const d = new Date(t * 1000)
			if (isNaN(d.getTime())) return '--'
			const p = n => String(n).padStart(2, '0')
			return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
		},
		formatDuration(sec) {
			let s = parseInt(sec || 0, 10)
			if (s < 0 || isNaN(s)) s = 0
			const h = Math.floor(s / 3600)
			const m = Math.floor((s % 3600) / 60)
			const r = s % 60
			if (h > 0) return `${h}h${m}m`
			if (m > 0) return `${m}m${r}s`
			return `${r}s`
		},
		getAppIconUrl(appId) {
			return getFanchmwrtAppIconUrl(this.device, appId)
		},
		onIconError(appId) {
			this.$set(this.iconErrors, appId, true)
		},
		appColor(name) {
			if (!name) return APP_COLORS[0]
			let hash = 0
			for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
			return APP_COLORS[Math.abs(hash) % APP_COLORS.length]
		}
	}
}
</script>

<style scoped>
.ar-page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.ar-nav { display: flex; align-items: center; padding: 88rpx 24rpx 20rpx; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.ar-back { width: 60rpx; display: flex; align-items: center; }
.ar-back-icon { width: 36rpx; }
.ar-nav-title { flex: 1; font-size: 32rpx; font-weight: 600; color: #1c1c1e; text-align: center; }
.ar-refresh { width: 60rpx; height: 56rpx; display: flex; align-items: center; justify-content: flex-end; }
.ar-refresh-text { font-size: 34rpx; color: #007AFF; line-height: 1; }

.ar-tabs { display: flex; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.08); flex-shrink: 0; }
.ar-tab { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24rpx 0 20rpx; position: relative; }
.ar-tab-active::after { content: ''; position: absolute; bottom: 0; left: 20%; right: 20%; height: 4rpx; background: #007AFF; border-radius: 2rpx; }
.ar-tab-text { font-size: 26rpx; color: #8e8e93; }
.ar-tab-text-active { color: #007AFF; font-weight: 600; }

.ar-scroll { background: #F2F2F7; }
.ar-inner { padding: 24rpx 24rpx 0; box-sizing: border-box; }
.ar-summary-card { background: #ffffff; border-radius: 20rpx; padding: 24rpx 28rpx; display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-bottom: 20rpx; }
.ar-summary-title { font-size: 30rpx; font-weight: 700; color: #1c1c1e; display: block; }
.ar-summary-desc { font-size: 22rpx; color: #8e8e93; display: block; margin-top: 6rpx; }
.ar-summary-count { font-size: 24rpx; color: #007AFF; font-weight: 600; flex-shrink: 0; }

.ar-filter-card { background: #ffffff; border-radius: 20rpx; padding: 8rpx 28rpx 24rpx; margin-bottom: 20rpx; }
.ar-input-row, .ar-time-row { display: flex; align-items: center; gap: 18rpx; padding: 20rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.05); }
.ar-filter-label { font-size: 26rpx; color: #1c1c1e; font-weight: 500; min-width: 120rpx; flex-shrink: 0; }
.ar-mac-input { flex: 1; font-size: 26rpx; color: #1c1c1e; text-align: right; }
.ar-time-controls { flex: 1; display: flex; justify-content: flex-end; gap: 12rpx; min-width: 0; }
.ar-time-pill { min-width: 132rpx; max-width: 190rpx; padding: 10rpx 14rpx; border-radius: 12rpx; background: #F2F2F7; color: #3c3c43; font-size: 24rpx; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-filter-actions { display: flex; gap: 16rpx; padding-top: 24rpx; }
.ar-filter-btn { flex: 1; height: 72rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.ar-filter-reset { background: #F2F2F7; }
.ar-filter-search { background: #007AFF; }
.ar-filter-reset-text { font-size: 26rpx; color: #3c3c43; font-weight: 600; }
.ar-filter-search-text { font-size: 26rpx; color: #ffffff; font-weight: 600; }

.ar-state { padding: 100rpx 40rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18rpx; }
.ar-state-text { font-size: 28rpx; color: #8e8e93; }
.ar-spinner { width: 56rpx; height: 56rpx; border-radius: 50%; border: 4rpx solid #e5e5ea; border-top-color: #007AFF; animation: ar-spin 0.8s linear infinite; }
.ar-empty-icon { width: 104rpx; height: 104rpx; border-radius: 26rpx; background: #3B9BFF; display: flex; align-items: center; justify-content: center; }
.ar-empty-icon-img { width: 62rpx; height: 62rpx; }
.ar-retry-btn { padding: 12rpx 28rpx; border-radius: 999rpx; background: #007AFF; }
.ar-retry-text { font-size: 24rpx; color: #ffffff; font-weight: 600; }
@keyframes ar-spin { to { transform: rotate(360deg); } }

.ar-record-list { display: flex; flex-direction: column; gap: 18rpx; }
.ar-record-card { background: #ffffff; border-radius: 20rpx; padding: 24rpx 26rpx; }
.ar-record-main { display: flex; align-items: center; gap: 18rpx; }
.ar-app-icon-wrap { width: 56rpx; height: 56rpx; flex-shrink: 0; }
.ar-app-icon { width: 56rpx; height: 56rpx; border-radius: 12rpx; display: block; }
.ar-app-icon-fallback { width: 56rpx; height: 56rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; }
.ar-app-icon-text { font-size: 24rpx; font-weight: 700; color: #ffffff; }
.ar-record-info { flex: 1; min-width: 0; }
.ar-record-title-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 6rpx; }
.ar-app-name { flex: 1; min-width: 0; font-size: 28rpx; color: #1c1c1e; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-badge { padding: 5rpx 12rpx; border-radius: 999rpx; flex-shrink: 0; }
.ar-badge-ok { background: rgba(34,197,94,0.14); }
.ar-badge-filtered { background: rgba(239,68,68,0.14); }
.ar-badge-text { font-size: 20rpx; font-weight: 600; line-height: 1; }
.ar-badge-ok .ar-badge-text { color: #16a34a; }
.ar-badge-filtered .ar-badge-text { color: #ef4444; }
.ar-device-name { font-size: 24rpx; color: #3c3c43; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-mac { font-size: 21rpx; color: #8e8e93; display: block; margin-top: 3rpx; font-family: monospace; }

.ar-meta-grid { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 20rpx; padding-top: 18rpx; border-top: 1rpx solid rgba(0,0,0,0.05); }
.ar-meta-item { width: 49%; background: #F8F8F8; border-radius: 14rpx; padding: 14rpx 16rpx; box-sizing: border-box; min-width: 0; margin-bottom: 14rpx; }
.ar-meta-label { font-size: 21rpx; color: #8e8e93; display: block; margin-bottom: 6rpx; }
.ar-meta-value { font-size: 23rpx; color: #1c1c1e; font-weight: 500; display: block; word-break: break-all; }
.ar-online { color: #16a34a; }
.ar-offline { color: #ef4444; }

.ar-load-more { display: flex; align-items: center; justify-content: center; gap: 12rpx; padding: 24rpx 0 8rpx; }
.ar-load-more:active { opacity: 0.7; }
.ar-load-spinner { width: 28rpx; height: 28rpx; border-radius: 50%; border: 3rpx solid #e5e5ea; border-top-color: #007AFF; animation: ar-spin 0.8s linear infinite; }
.ar-load-text { font-size: 24rpx; color: #007AFF; font-weight: 600; }
</style>
