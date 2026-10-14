<template>
	<view class="container">
		<view v-if="loading" class="loading-overlay">
			<view class="loading-content">
				<view class="loading-spinner"></view>
				<text class="loading-text">{{ $t('startup.loading_startup') }}</text>
			</view>
		</view>

		<view v-else class="startup-container">


			<view v-if="startupList.length > 0" class="startup-list">
				<view class="table-header">
					<view class="header-cell service-name">{{ $t('startup.service_name') }}</view>
					<view class="header-cell priority">{{ $t('startup.priority') }}</view>
					<view class="header-cell enabled">{{ $t('startup.enabled') }}</view>
					<view class="header-cell running">{{ $t('startup.running') }}</view>
				</view>
				
				<view v-for="(startup, index) in startupList" :key="startup.key" class="startup-row">
					<view class="table-cell service-name">
						<text class="service-name-text">{{ startup.key }}</text>
					</view>
					<view class="table-cell priority">
						<text class="priority-value">{{ startup.start || '--' }}</text>
					</view>
					<view class="table-cell enabled">
						<text class="status-badge" :class="startup.enabled ? 'enabled' : 'disabled'">
							{{ startup.enabled ? $t('startup.yes') : $t('startup.no') }}
						</text>
					</view>
					<view class="table-cell running">
						<text class="status-badge" :class="startup.running ? 'running' : 'stopped'">
							{{ startup.running ? $t('startup.running') : $t('startup.stopped') }}
						</text>
					</view>
				</view>
			</view>

			<view v-else class="empty-state">
				<text class="empty-text">{{ $t('startup.no_startup') }}</text>
			</view>

			<view v-if="error" class="error-state">
				<text class="error-text">{{ error }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'

export default {
	data() {
		return {
			loading: false,
			startupList: [],
			error: '',
			deviceInfo: {},
			session: '',
			url: '/ubus'
		}
	},
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('startup.title')
		})
		
		this.deviceInfo = DeviceManager.getCurrentDevice()
		this.session = this.deviceInfo.sysauth
		const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
		const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
		this.url = `${protocol}://${formattedHost}:${this.deviceInfo.port}/ubus`
		this.loadStartupList()
	},
	methods: {
		loadStartupList() {
			this.loading = true
			this.error = ''
			
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 1,
					method: 'call',
					params: [this.session, 'rc', 'list', {}]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 10000,
				success: (res) => {
					if (res.data && res.data.result && res.data.result[1]) {
						this.parseStartupList(res.data.result[1])
					} else {
						this.error = this.$t('startup.parse_failed')
					}
					this.loading = false
				},
				fail: (err) => {
					this.error = this.$t('startup.load_failed')
					this.loading = false
				}
			})
		},
		
		parseStartupList(data) {
			try {
				this.startupList = []
				
				for (const [key, value] of Object.entries(data)) {
					this.startupList.push({
						key: key,
						start: value.start,
						enabled: value.enabled,
						running: value.running
					})
				}
				
				this.startupList.sort((a, b) => {
					const aStart = a.start || 999
					const bStart = b.start || 999
					return aStart - bStart
				})
				
			} catch (error) {
				this.error = this.$t('startup.parse_failed')
			}
		}
	}
}
</script>

<style scoped>
@import '@/styles/common.scss';

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
.container {
	padding: 10rpx;
	padding-top: 20rpx;
}
.loading-text {
	font-size: 28rpx;
	color: #666;
}

.startup-container {
	padding: 2rpx;
}

.refresh-section {
	margin-bottom: 20rpx;
	text-align: center;
}

.refresh-btn {
	background: #007AFF;
	color: white;
	border: none;
	border-radius: 12rpx;
	padding: 20rpx 40rpx;
	font-size: 28rpx;
}

.refresh-btn:disabled {
	background: #ccc;
}

.refresh-text {
	color: white;
	font-size: 28rpx;
}

.startup-list {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.table-header {
	display: flex;
	background: rgba(0, 122, 255, 0.1);
	padding: 20rpx 0;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
}

.header-cell {
	flex: 1;
	text-align: center;
	font-size: 26rpx;
	font-weight: 600;
	color: #333;
}

.header-cell.service-name {
	flex: 2;
	text-align: left;
	padding-left: 30rpx;
}

.startup-row {
	display: flex;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	transition: background-color 0.2s ease;
}

.startup-row:last-child {
	border-bottom: none;
}

.startup-row:hover {
	background: rgba(0, 122, 255, 0.02);
}

.table-cell {
	flex: 1;
	padding: 20rpx 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.table-cell.service-name {
	flex: 2;
	justify-content: flex-start;
	padding-left: 30rpx;
}

.service-name-text {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.priority-value {
	font-size: 26rpx;
	font-weight: 600;
	color: #666;
}

.status-badge {
	font-size: 24rpx;
	font-weight: 600;
	padding: 6rpx 12rpx;
	border-radius: 8rpx;
}

.status-badge.enabled {
	color: #4CD964;
	background: rgba(76, 217, 100, 0.1);
}

.status-badge.disabled {
	color: #FF3B30;
	background: rgba(255, 59, 48, 0.1);
}

.status-badge.running {
	color: #4CD964;
	background: rgba(76, 217, 100, 0.1);
}

.status-badge.stopped {
	color: #FF3B30;
	background: rgba(255, 59, 48, 0.1);
}

.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 80rpx 0;
	margin: 20rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80rpx 0;
	margin: 20rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.error-text {
	font-size: 28rpx;
	color: #FF3B30;
	text-align: center;
}
</style>
