<template>
	<view class="container">

		<page-tab v-model="currentTab" :tabs="tab_list" />

		<view v-if="currentTab === 0">
			<view v-if="loading" class="loading-overlay">
				<view class="loading-content">
					<view class="loading-spinner"></view>
					<text class="loading-text">{{ $t('parental_control.loading_status') }}</text>
				</view>
			</view>
			
			<view v-else class="status-container">
				<view v-if="showVersionWarning" class="version-warning">
					<view class="warning-content">
						<text class="warning-icon">⚠️</text>
						<text class="warning-text">{{ $t('parental_control.version_warning') }}</text>
					</view>
				</view>
				<view v-if="hasVersionInfo" class="status-card">
					<view class="card-header">
						<text class="card-title">{{ $t('parental_control.version_status') }}</text>
					</view>
					<view class="card-content">
						<view class="detail-row">
							<text class="detail-label">{{ $t('parental_control.plugin_version') }}:</text>
							<text class="detail-value">{{ oafStatus.version || '--' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">{{ $t('parental_control.engine_version') }}:</text>
							<text class="detail-value">{{ oafStatus.engineVersion || '--' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">{{ $t('parental_control.kernel_version') }}:</text>
							<text class="detail-value">{{ oafStatus.kernelVersion || '--' }}</text>
						</view>
					</view>
				</view>

				<!-- running status card -->
				<view class="status-card">
					<view class="card-header">
						<text class="card-title">{{ $t('parental_control.running_status') }}</text>
					</view>
					<view class="card-content">
						<view class="detail-row">
							<text class="detail-label">{{ $t('parental_control.config_status') }}:</text>
							<text class="detail-value" :class="oafStatus.configEnabled ? 'status-enabled' : 'status-disabled'">
								{{ oafStatus.configEnabled ? $t('parental_control.configured') : $t('parental_control.not_configured') }}
							</text>
						</view>
						<view class="detail-row" v-if="oafStatus.configEnabled">
							<text class="detail-label">{{ $t('parental_control.time_mode') }}:</text>
							<text class="detail-value">{{ getTimeModeText(oafStatus.timeMode) }}</text>
						</view>
						<view class="detail-row" v-if="oafStatus.configEnabled">
							<text class="detail-label">{{ $t('parental_control.filter_status') }}:</text>
							<text class="detail-value" :class="oafStatus.enabled ? 'status-enabled' : 'status-disabled'">
								{{ oafStatus.enabled ? $t('parental_control.running') : $t('parental_control.not_running') }}
							</text>
						</view>
						<view class="detail-row" v-if="oafStatus.configEnabled && oafStatus.enabled && oafStatus.timeMode === 1 && getDynamicTimeStatusText()">
							<text class="detail-label">{{ $t('parental_control.status_label') }}:</text>
							<text class="detail-value reason-text">
								{{ getDynamicTimeStatusText() }}
							</text>
						</view>
						<!-- time_mode=2: duration usage (from oaf_status) -->
						<view v-if="oafStatus.configEnabled && oafStatus.timeMode === 2" class="status-duration-usage">
							<view class="today-usage-card status-usage-card">
								<view class="today-usage-title">{{ $t('parental_control.today_usage') }}</view>
								<view class="today-weekday">{{ $t('parental_control.today_is') }}: {{ getWeekdayNameForDaily(oafStatus.currentWeekday) }}</view>
								<view class="usage-row">
									<text class="usage-label">{{ $t('parental_control.morning') }}</text>
									<template v-if="(oafStatus.currentAmLimit || 0) <= 0">
										<text class="usage-no-limit">{{ $t('parental_control.no_limit') }}</text>
									</template>
									<template v-else>
										<view class="usage-bar-wrap">
											<view class="usage-bar" :style="statusAmUsageBarStyle"></view>
										</view>
										<text class="usage-text-below">{{ statusAmUsageText }}</text>
									</template>
								</view>
								<view class="usage-row">
									<text class="usage-label">{{ $t('parental_control.afternoon') }}</text>
									<template v-if="(oafStatus.currentPmLimit || 0) <= 0">
										<text class="usage-no-limit">{{ $t('parental_control.no_limit') }}</text>
									</template>
									<template v-else>
										<view class="usage-bar-wrap">
											<view class="usage-bar pm" :style="statusPmUsageBarStyle"></view>
										</view>
										<text class="usage-text-below">{{ statusPmUsageText }}</text>
									</template>
								</view>
							</view>
						</view>
						<view class="detail-row" v-if="oafStatus.configEnabled">
							<text class="detail-label">{{ $t('parental_control.engine_status') }}:</text>
							<text class="detail-value" :class="oafStatus.engineStatus ? 'status-enabled' : 'status-disabled'">
								{{ oafStatus.engineStatus ? $t('parental_control.normal') : $t('parental_control.abnormal') }}
							</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view v-if="currentTab === 1">
			<view class="menu-list">
				<view class="menu-item" @click="onMenuClick('basic_settings')">
					<view class="menu-left">
						<text class="menu-title">{{ $t('parental_control.basic_settings') }}</text>
						<text class="menu-desc">{{ $t('parental_control.basic_settings_desc') }}</text>
					</view>
					<view class="menu-right">
						<image class="menu-arrow" src="/static/right.png" mode="widthFix" style="width: 32rpx; height: 32rpx;" />
					</view>
				</view>

				<view class="menu-item" @click="onMenuClick('app_filter')">
					<view class="menu-left">
						<text class="menu-title">{{ $t('parental_control.app_filter') }}</text>
						<text class="menu-desc">{{ $t('parental_control.app_filter_desc') }}</text>
					</view>
					<view class="menu-right">
						<image class="menu-arrow" src="/static/right.png" mode="widthFix" style="width: 32rpx; height: 32rpx;" />
					</view>
				</view>


				<view class="menu-item" @click="onMenuClick('advanced_settings')">
					<view class="menu-left">
						<text class="menu-title">{{ $t('parental_control.advanced_settings') }}</text>
						<text class="menu-desc">{{ $t('parental_control.advanced_settings_desc') }}</text>
					</view>
					<view class="menu-right">
						<image class="menu-arrow" src="/static/right.png" mode="widthFix" style="width: 32rpx; height: 32rpx;" />
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'
import PageTab from '@/components/page_tab.vue'

export default {
	components: {
		PageTab
	},
	data() {
		return {
			currentTab: 0,
			loading: false,
			deviceInfo: {},
			session: '',
			url: '/ubus',
			maxSupportedVersion: '6.2.0',
			showVersionWarning: false,
			oafStatus: {
				version: '',
				engineVersion: '',
				kernelVersion: '',
				configEnabled: false,
				enabled: false,
				matchTime: false,
				engineStatus: false,
				timeMode: 0,
				/** remain_time from backend (seconds or time string) */
				remainTime: '',
				/** duration mode (time_mode=2): current usage and limits */
				currentAmLimit: 0,
				currentPmLimit: 0,
				currentAmUsedTime: 0,
				currentPmUsedTime: 0,
				currentWeekday: 0,
				currentDayEnabled: 0
			},
			/** status tab auto-refresh timer (3s) */
			statusRefreshTimer: null,
			basicSettings: {
				enable: false,
				recordEnable: false,
				workMode: 0
			}
		}
	},
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('parental_control.title')
		})
		
		this.deviceInfo = DeviceManager.getCurrentDevice()
		this.session = this.deviceInfo.sysauth
		const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
		const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
		this.url = `${protocol}://${formattedHost}:${this.deviceInfo.port}/ubus`
		
		this.loadPluginStatus()
	},
	onShow() {
		this.startStatusRefreshTimer()
	},
	onHide() {
		this.clearStatusRefreshTimer()
	},
	onUnload() {
		this.clearStatusRefreshTimer()
	},
	computed: {
		tab_list() {
			return [
				{ value: 0, label: this.$t('parental_control.status') },
				{ value: 1, label: this.$t('parental_control.settings') }
			]
		},
		// has version info
		hasVersionInfo() {
			return this.oafStatus.version &&
				   this.oafStatus.version !== '--'
		},
		// duration mode (time_mode=2) usage bar/style from oaf_status
		statusAmUsageBarStyle() {
			const limit = this.oafStatus.currentAmLimit || 0
			const used = Math.min(Number(this.oafStatus.currentAmUsedTime) || 0, limit || 1)
			const pct = limit > 0 ? (used / limit) * 100 : 0
			return { width: pct + '%' }
		},
		statusPmUsageBarStyle() {
			const limit = this.oafStatus.currentPmLimit || 0
			const used = Math.min(Number(this.oafStatus.currentPmUsedTime) || 0, limit || 1)
			const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
			return { width: pct + '%' }
		},
		statusAmUsageText() {
			const used = Number(this.oafStatus.currentAmUsedTime) || 0
			const limit = Number(this.oafStatus.currentAmLimit) || 0
			const min = this.$t('parental_control.minutes')
			if (limit <= 0) return '0/' + limit + min
			return used + '/' + limit + min
		},
		statusPmUsageText() {
			const used = Number(this.oafStatus.currentPmUsedTime) || 0
			const limit = Number(this.oafStatus.currentPmLimit) || 0
			const min = this.$t('parental_control.minutes')
			if (limit <= 0) return '0/' + limit + min
			if (used >= limit) return this.$t('parental_control.used_up_total') + ': ' + limit + min + ')'
			return used + '/' + limit + min
		}
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		loadPluginStatus() {
			this.loading = true
			
			this.getAppFilterBase()
			this.getOafStatus()
		},
		
		getAppFilterBase() {
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 1,
					method: 'call',
					params: [this.session, 'appfilter', 'get_app_filter_base', {}]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 5000,
				success: (res) => {
					console.log('get_app_filter_base response:', res)
					if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
						const data = res.data.result[1].data
						this.oafStatus.filterEnabled = data.enable === 1
						this.oafStatus.recordEnabled = data.record_enable === 1
						this.oafStatus.workMode = data.work_mode
					}
					this.checkLoadingComplete()
				},
				fail: (err) => {
					this.checkLoadingComplete()
				}
			})
		},
		
		getOafStatus() {
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 2,
					method: 'call',
					params: [this.session, 'appfilter', 'get_oaf_status', {}]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 5000,
				success: (res) => {
					if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
						const data = res.data.result[1].data
						this.oafStatus.version = data.version || '--'
						this.oafStatus.engineVersion = data.engine_version || '--'
						this.oafStatus.kernelVersion = data.kernel_version || '--'
						this.oafStatus.configEnabled = data.config_enable === 1
						this.oafStatus.enabled = data.enable === 1
						this.oafStatus.matchTime = data.match_time === 1
						this.oafStatus.engineStatus = data.engine_status === 1
						this.oafStatus.timeMode = data.time_mode || 0
						this.oafStatus.remainTime = data.remain_time != null ? String(data.remain_time) : ''
						this.oafStatus.currentAmLimit = data.current_am_limit != null ? Number(data.current_am_limit) : 0
						this.oafStatus.currentPmLimit = data.current_pm_limit != null ? Number(data.current_pm_limit) : 0
						this.oafStatus.currentAmUsedTime = data.current_am_used_time != null ? Number(data.current_am_used_time) : 0
						this.oafStatus.currentPmUsedTime = data.current_pm_used_time != null ? Number(data.current_pm_used_time) : 0
						this.oafStatus.currentWeekday = data.current_weekday != null ? Number(data.current_weekday) : 0
						this.oafStatus.currentDayEnabled = data.current_day_enabled === 1
						
						this.checkVersionCompatibility()
					}
					this.checkLoadingComplete()
				},
				fail: (err) => {
					console.log('get_oaf_status failed:', err)
					this.checkLoadingComplete()
				}
			})
		},
		
		checkLoadingComplete() {
			if (!this.loading) return
			setTimeout(() => {
				this.loading = false
			}, 1000)
		},

		startStatusRefreshTimer() {
			this.clearStatusRefreshTimer()
			this.statusRefreshTimer = setInterval(() => {
				if (this.currentTab !== 0) return
				this.refreshStatusSilent()
			}, 3000)
		},

		clearStatusRefreshTimer() {
			if (this.statusRefreshTimer) {
				clearInterval(this.statusRefreshTimer)
				this.statusRefreshTimer = null
			}
		},

		/** refresh status without loading indicator */
		refreshStatusSilent() {
			this.getOafStatus()
			this.getAppFilterBase()
		},
		
		checkVersionCompatibility() {
			if (this.oafStatus.version && this.oafStatus.version !== '--') {
				const currentVersion = this.oafStatus.version
				const maxVersion = this.maxSupportedVersion
				
				if (this.compareVersions(currentVersion, maxVersion) > 0) {
					this.showVersionWarning = true
				} else {
					this.showVersionWarning = false
				}
			} else {
				this.showVersionWarning = false
			}
		},
		
		compareVersions(version1, version2) {
			const v1Parts = version1.split('.').map(Number)
			const v2Parts = version2.split('.').map(Number)
			
			while (v1Parts.length < 3) v1Parts.push(0)
			while (v2Parts.length < 3) v2Parts.push(0)
			
			for (let i = 0; i < 3; i++) {
				if (v1Parts[i] > v2Parts[i]) return 1
				if (v1Parts[i] < v2Parts[i]) return -1
			}
			
			return 0
		},
		
getWorkModeText(mode) {
			const modeMap = {
				0: this.$t('parental_control.work_mode_blacklist'),
				1: this.$t('parental_control.work_mode_whitelist')
			}
			return modeMap[mode] || '--'
		},

		getTimeModeText(mode) {
			const modeMap = {
				0: this.$t('parental_control.fixed_time'),
				1: this.$t('parental_control.dynamic_time'),
				2: this.$t('parental_control.duration_mode')
			}
			return modeMap[mode] != null ? modeMap[mode] : '--'
		},

		getNotRunningReason() {
			// time_mode === 2 and config enabled: duration not used up yet
			if (this.oafStatus.timeMode === 2 && this.oafStatus.configEnabled) {
				return this.$t('parental_control.duration_not_used_up')
			}
			// time_mode === 1: show reason when not enabled
			if (this.oafStatus.timeMode === 1) {
				if (!this.oafStatus.matchTime) {
					return this.$t('parental_control.not_in_time_range')
				}
				// match_time 1, enable 0: entertainment time, next open at remain_time
				const timeStr = this.formatRemainTime(this.oafStatus.remainTime)
				return this.$t('parental_control.entertainment_time') + '，' + this.$t('parental_control.next_open_at') + '：' + timeStr
			}
			if (!this.oafStatus.matchTime) {
				return this.$t('parental_control.not_in_time_range')
			}
			return this.$t('parental_control.unknown_reason')
		},

		/** dynamic time running: study time, next close at remain_time */
		getDynamicTimeStatusText() {
			if (this.oafStatus.timeMode !== 1 || !this.oafStatus.enabled) return ''
			const timeStr = this.formatRemainTime(this.oafStatus.remainTime)
			return this.$t('parental_control.study_time') + '，' + this.$t('parental_control.next_close_at') + '：' + timeStr
		},

/** format remain_time from backend (value is in minutes) for display */
		formatRemainTime(remain) {
			if (remain === undefined || remain === null || remain === '') return '--'
			const s = String(remain).trim()
			if (/^\d+$/.test(s)) {
				const minutes = Math.max(0, parseInt(s, 10))
				const minUnit = this.$t('parental_control.minutes')
				return minutes + minUnit
			}
			return s
		},

		getWeekdayName(day) {
			const weekdays = [
				this.$t('parental_control.sunday'),
				this.$t('parental_control.monday'),
				this.$t('parental_control.tuesday'),
				this.$t('parental_control.wednesday'),
				this.$t('parental_control.thursday'),
				this.$t('parental_control.friday'),
				this.$t('parental_control.saturday')
			]
			return weekdays[day] || '--'
		},
		/** api index 0=Sun, 1=Mon, ..., 6=Sat -> display name */
		getWeekdayNameForDaily(apiIndex) {
			if (apiIndex === undefined || apiIndex === null) return '--'
			const i = parseInt(apiIndex, 10)
			if (i < 0 || i > 6) return '--'
			return this.getWeekdayName(i)
		},

		onMenuClick(menuType) {
			console.log('menu click:', menuType)
			if (menuType === 'basic_settings') {
				this.navigateToBasicSettings()
			} else if (menuType === 'app_filter') {
				this.navigateToAppFilterRules()
			} else if (menuType === 'advanced_settings') {
				this.navigateToAdvancedSettings()
			} else {
				uni.showToast({
					title: this.$t('parental_control.coming_soon'),
					icon: 'none'
				})
			}
		},
		
		navigateToBasicSettings() {
			uni.navigateTo({
				url: '/pages/openwrt/apps/parental_control/basic_settings'
			})
		},
		
		navigateToAppFilterRules() {
			uni.navigateTo({
				url: '/pages/openwrt/apps/parental_control/app_filter_rules'
			})
		},
		
		navigateToAdvancedSettings() {
			uni.navigateTo({
				url: '/pages/openwrt/apps/parental_control/advanced_settings'
			})
		}
	}
}
</script>

<style scoped>
@import '@/styles/common.scss';

.container {
	padding-top: 20rpx;
}

.version-warning {
	background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	padding: 20rpx;
	box-shadow: 0 4rpx 15rpx rgba(255, 107, 107, 0.3);
}

.warning-content {
	display: flex;
	align-items: center;
}

.warning-icon {
	font-size: 32rpx;
	margin-right: 15rpx;
}

.warning-text {
	font-size: 28rpx;
	color: #ffffff;
	font-weight: 500;
	line-height: 1.4;
}

.tab-bar {
	display: flex;
	background: rgba(255, 255, 255, 0.95);
	border-bottom: 1rpx solid #e5e5e5;
	
}

.tab {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	font-size: 28rpx;
	color: #666;
	font-weight: 500;
	position: relative;
}

.tab.active {
	color: #007AFF;
	font-weight: 600;
}

.tab.active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 60rpx;
	height: 4rpx;
	background: #007AFF;
	border-radius: 2rpx;
}

.loading-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 9999;
}

.loading-content {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	padding: 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.loading-spinner {
	width: 60rpx;
	height: 60rpx;
	border: 4rpx solid #f3f3f3;
	border-top: 4rpx solid #007AFF;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 20rpx;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.loading-text {
	font-size: 28rpx;
	color: #666;
}

.status-container {
	padding: 5rpx;
}

.status-card {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.card-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.card-content {
}

.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15rpx;
	padding: 10rpx 0;
}

.detail-label {
	font-size: 26rpx;
	color: #666;
	flex: 1;
}

.detail-value {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
	flex: 1;
	text-align: right;
}

.status-enabled {
	color: #28a745 !important;
	font-weight: 600;
}

.status-disabled {
	color: #dc3545 !important;
	font-weight: 600;
}

.reason-text {
	color: #ff6b35 !important;
	font-style: italic;
	min-width: 4em;
	flex: 1.6;
	white-space: nowrap;
}

.status-duration-usage {
	margin-top: 16rpx;
	margin-bottom: 16rpx;
}

.status-usage-card.today-usage-card {
	border: 2rpx solid rgba(0, 122, 255, 0.3);
	border-radius: 12rpx;
	padding: 24rpx;
	background: rgba(0, 122, 255, 0.04);
}

.status-usage-card .today-usage-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 12rpx;
}

.status-usage-card .today-weekday {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 20rpx;
}

.status-usage-card .usage-row {
	margin-bottom: 24rpx;
}

.status-usage-card .usage-label {
	display: block;
	font-size: 26rpx;
	color: #333;
	margin-bottom: 8rpx;
}

.status-usage-card .usage-bar-wrap {
	width: 100%;
	height: 14rpx;
	background: rgba(0, 0, 0, 0.08);
	border-radius: 7rpx;
	overflow: hidden;
	margin-bottom: 6rpx;
}

.status-usage-card .usage-bar {
	height: 100%;
	background: #007AFF;
	border-radius: 7rpx;
	transition: width 0.2s;
}

.status-usage-card .usage-bar.pm {
	background: #007AFF;
}

.status-usage-card .usage-text-below {
	display: block;
	font-size: 24rpx;
	color: #666;
}

.status-usage-card .usage-no-limit {
	font-size: 24rpx;
	color: #007AFF;
	font-weight: 500;
}

.menu-list {
	padding: 5rpx;
}

.menu-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;
}

.menu-item:active {
	transform: scale(0.98);
	background: rgba(255, 255, 255, 1);
}

.menu-left {
	flex: 1;
}

.menu-title {
	font-size: 32rpx;
	color: #333;
	font-weight: 600;
	display: block;
	margin-bottom: 8rpx;
}

.menu-desc {
	font-size: 24rpx;
	color: #666;
	line-height: 1.4;
	display: block;
}

.menu-right {
	display: flex;
	align-items: center;
}

.menu-arrow {
	font-size: 32rpx;
	color: #c7c7cc;
	font-weight: bold;
}

.loading-container {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 80rpx 0;
	margin: 20rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

.user-list {
	padding: 20rpx;
}

.user-card {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.user-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.user-info {
	flex: 1;
}

.user-nickname {
	font-size: 32rpx;
	color: #333;
	font-weight: 600;
	display: block;
	margin-bottom: 6rpx;
}

.user-hostname {
	font-size: 24rpx;
	color: #666;
	display: block;
}

.user-status {
	font-size: 24rpx;
	font-weight: 600;
	padding: 6rpx 16rpx;
	border-radius: 12rpx;
}

.user-status.online {
	color: #4CD964;
	background: rgba(76, 217, 100, 0.1);
}

.user-status.offline {
	color: #FF3B30;
	background: rgba(255, 59, 48, 0.1);
}

.user-details {
	margin-bottom: 20rpx;
}

.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8rpx 0;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.detail-row:last-child {
	border-bottom: none;
}

.label {
	font-size: 26rpx;
	color: #666;
	font-weight: 500;
	min-width: 120rpx;
	flex-shrink: 0;
}

.value {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
	text-align: right;
	max-width: 60%;
	word-break: break-all;
	flex: 1;
}

.app-list {
	margin-top: 20rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid rgba(0, 0, 0, 0.05);
}

.app-list-title {
	font-size: 26rpx;
	color: #666;
	font-weight: 600;
	display: block;
	margin-bottom: 16rpx;
}

.app-icons {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.app-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 80rpx;
}

.app-icon {
	width: 60rpx;
	height: 60rpx;
	background: rgba(0, 122, 255, 0.1);
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 8rpx;
	overflow: hidden;
	position: relative;
}

.app-icon-image {
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
}

.app-icon-fallback {
	font-size: 24rpx;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.app-name {
	font-size: 20rpx;
	color: #666;
	text-align: center;
	line-height: 1.2;
	max-width: 80rpx;
	word-break: break-all;
}

.coming-soon {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 80rpx 0;
	margin: 20rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.coming-text {
	font-size: 28rpx;
	color: #999;
}
</style>
