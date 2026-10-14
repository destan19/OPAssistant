<template>
	<view class="container">
		<view v-if="loading" class="loading-overlay">
			<view class="loading-content">
				<view class="loading-spinner"></view>
				<text class="loading-text">{{ $t('route.loading_routes') }}</text>
			</view>
		</view>

		<view v-else class="route-container">
		

			<view v-if="routeList.length > 0" class="route-list">
				<view v-for="(route, index) in routeList" :key="index" class="route-item">
					<view class="route-header">
						<text class="route-index">#{{ index + 1 }}</text>
						<text class="route-type">{{ getRouteType(route) }}</text>
					</view>
					<view class="route-details">
						<view class="detail-row" v-if="route.destination">
							<text class="detail-label">{{ $t('route.destination') }}:</text>
							<text class="detail-value">{{ route.destination }}</text>
						</view>
						<view class="detail-row" v-if="route.gateway">
							<text class="detail-label">{{ $t('route.gateway') }}:</text>
							<text class="detail-value">{{ route.gateway }}</text>
						</view>
						<view class="detail-row" v-if="route.device">
							<text class="detail-label">{{ $t('route.device') }}:</text>
							<text class="detail-value">{{ route.device }}</text>
						</view>
						<view class="detail-row" v-if="route.src">
							<text class="detail-label">{{ $t('route.src') }}:</text>
							<text class="detail-value">{{ route.src }}</text>
						</view>
						<view class="detail-row" v-if="route.scope">
							<text class="detail-label">{{ $t('route.scope') }}:</text>
							<text class="detail-value">{{ route.scope }}</text>
						</view>
						<view class="detail-row" v-if="route.table">
							<text class="detail-label">{{ $t('route.table') }}:</text>
							<text class="detail-value">{{ route.table }}</text>
						</view>
					</view>
				</view>
			</view>

			<view v-else class="empty-state">
				<text class="empty-text">{{ $t('route.no_routes') }}</text>
			</view>

			<view v-if="error" class="error-state">
				<text class="error-text">{{ error }}</text>
				<button class="retry-btn" @click="loadRouteTable">
					<text class="retry-text">{{ $t('route.retry') }}</text>
				</button>
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
			routeList: [],
			error: '',
			deviceInfo: {},
			session: '',
			url: '/ubus'
		}
	},
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('route.title')
		})
		
		this.deviceInfo = DeviceManager.getCurrentDevice()
		this.session = this.deviceInfo.sysauth
		const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
		const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
		this.url = `${protocol}://${formattedHost}:${this.deviceInfo.port}/ubus`
		
		this.loadRouteTable()
	},
	methods: {
		loadRouteTable() {
			this.loading = true
			this.error = ''
			
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 1,
					method: 'call',
					params: [this.session, 'file', 'exec', {
						command: '/sbin/ip',
						params: ['-4', 'route', 'show', 'table', 'all'],
						env: null
					}]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 10000,
				success: (res) => {
					if (res.data && res.data.result && res.data.result[1] && res.data.result[1].stdout) {
						this.parseRouteTable(res.data.result[1].stdout)
					} else {
						this.error = this.$t('route.parse_failed')
					}
					this.loading = false
				},
				fail: (err) => {
					this.error = this.$t('route.load_failed')
					this.loading = false
				}
			})
		},
		
		parseRouteTable(stdout) {
			try {
				const lines = stdout.split('\n').filter(line => line.trim())
				this.routeList = []
				
				lines.forEach(line => {
					const route = this.parseRouteLine(line.trim())
					if (route) {
						this.routeList.push(route)
					}
				})
				
			} catch (error) {
				this.error = this.$t('route.parse_failed')
			}
		},
		
		parseRouteLine(line) {
	
			
			const parts = line.split(/\s+/)
			const route = {}
			
			let i = 0
			while (i < parts.length) {
				const part = parts[i]
				
				if (part === 'default') {
					route.destination = 'default'
					i++
				} else if (part === 'via') {
					route.gateway = parts[++i]
					i++
				} else if (part === 'dev') {
					route.device = parts[++i]
					i++
				} else if (part === 'src') {
					route.src = parts[++i]
					i++
				} else if (part === 'scope') {
					route.scope = parts[++i]
					i++
				} else if (part === 'table') {
					route.table = parts[++i]
					i++
				} else if (part.includes('/') && !route.destination) {
					route.destination = part
					i++
				} else if (part.match(/^\d+\.\d+\.\d+\.\d+$/) && !route.destination) {
					route.destination = part
					i++
				} else {
					i++
				}
			}
			
			return Object.keys(route).length > 0 ? route : null
		},
		
		getRouteType(route) {
			if (route.destination === 'default') {
				return this.$t('route.type_default')
			} else if (route.destination === 'local') {
				return this.$t('route.type_local')
			} else if (route.destination === 'broadcast') {
				return this.$t('route.type_broadcast')
			} else if (route.destination && route.destination.includes('/')) {
				return this.$t('route.type_network')
			} else {
				return this.$t('route.type_host')
			}
		}
	}
}
</script>

<style scoped>
@import '@/styles/common.scss';

.container {
	padding: 10rpx;
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

.route-container {
	padding: 5rpx;
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

.route-list {
}

.route-item {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.route-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
	padding-bottom: 15rpx;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
}

.route-index {
	font-size: 24rpx;
	color: #666;
	font-weight: 500;
}

.route-type {
	font-size: 24rpx;
	color: #007AFF;
	font-weight: 600;
	background: rgba(0, 122, 255, 0.1);
	padding: 6rpx 12rpx;
	border-radius: 8rpx;
}

.route-details {
}

.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
	padding: 8rpx 0;
}

.detail-row:last-child {
	margin-bottom: 0;
}

.detail-label {
	font-size: 26rpx;
	color: #666;
	font-weight: 500;
	min-width: 120rpx;
	flex-shrink: 0;
}

.detail-value {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
	text-align: right;
	max-width: 60%;
	word-break: break-all;
	flex: 1;
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
	margin-bottom: 20rpx;
	text-align: center;
}

.retry-btn {
	background: #FF3B30;
	color: white;
	border: none;
	border-radius: 12rpx;
	padding: 20rpx 40rpx;
	font-size: 28rpx;
}

.retry-text {
	color: white;
	font-size: 28rpx;
}
</style>
