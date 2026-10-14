<template>
	<view class="container">
	
		<view v-if="loading" class="loading-overlay">
			<view class="loading-content">
				<view class="loading-spinner"></view>
				<text class="loading-text">{{ $t('parental_control.loading_settings') }}</text>
			</view>
		</view>

		<view v-else class="settings-container">
			<view class="setting-card">
				<view class="setting-header">
					<text class="setting-title">{{ $t('parental_control.auto_load_engine') }}</text>
					<text class="setting-desc">{{ $t('parental_control.auto_load_engine_desc') }}</text>
				</view>
				<view class="setting-control">
					<switch 
						:checked="advancedConfig.auto_load_engine === 1" 
						@change="updateAutoLoadEngine"
						color="#007AFF"
					/>
				</view>
			</view>

			<view class="setting-card">
				<view class="setting-header">
					<text class="setting-title">{{ $t('parental_control.lan_ifname') }}</text>
					<text class="setting-desc">{{ $t('parental_control.lan_ifname_desc') }}</text>
				</view>
				<view class="setting-control">
					<input 
						v-model="advancedConfig.lan_ifname" 
						class="setting-input"
						:placeholder="$t('parental_control.lan_ifname_placeholder')"
					/>
				</view>
			</view>

			<view class="setting-card">
				<view class="setting-header">
					<text class="setting-title">{{ $t('parental_control.disable_hnat') }}</text>
					<text class="setting-desc">{{ $t('parental_control.disable_hnat_desc') }}</text>
				</view>
				<view class="setting-control">
					<switch 
						:checked="advancedConfig.disable_hnat === 1" 
						@change="updateDisableHnat"
						color="#007AFF"
					/>
				</view>
			</view>

			<view class="save-button-container">
				<button 
					class="save-button" 
					@click="saveAdvancedSettings"
					:disabled="saving"
				>
					<text class="save-button-text">{{ saving ? $t('parental_control.saving') : $t('parental_control.save') }}</text>
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
			saving: false,
			deviceInfo: {},
			session: '',
			url: '/ubus',
			advancedConfig: {
				auto_load_engine: 1,
				lan_ifname: 'br-lan',
				disable_hnat: 1
			}
		}
	},
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('parental_control.advanced_settings')
		})
		
		this.deviceInfo = DeviceManager.getCurrentDevice()
		this.session = this.deviceInfo.sysauth
		const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
		const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
		this.url = `${protocol}://${formattedHost}:${this.deviceInfo.port}/ubus`
		
		this.loadAdvancedSettings()
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		loadAdvancedSettings() {
			this.loading = true
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 1,
					method: 'call',
					params: [this.session, 'appfilter', 'get_app_filter_adv', {}]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 5000,
				success: (res) => {
					if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
						this.advancedConfig = res.data.result[1].data
					}
					this.loading = false
				},
				fail: (err) => {
					this.loading = false
				}
			})
		},
		
		saveAdvancedSettings() {
			this.saving = true
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 2,
					method: 'call',
					params: [this.session, 'appfilter', 'set_app_filter_adv', this.advancedConfig]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 5000,
				success: (res) => {
					if (res.data && res.data.result && res.data.result[0] === 0) {
						uni.showToast({
							title: this.$t('parental_control.save_success'),
							icon: 'success'
						})
						
						setTimeout(() => {
							uni.navigateBack()
						}, 1500)
					} else {
						uni.showToast({
							title: this.$t('parental_control.save_failed'),
							icon: 'error'
						})
					}
					this.saving = false
				},
				fail: (err) => {
					uni.showToast({
						title: this.$t('parental_control.save_failed'),
						icon: 'error'
					})
					this.saving = false
				}
			})
		},
		
		updateAutoLoadEngine(e) {
			this.advancedConfig.auto_load_engine = e.detail.value ? 1 : 0
		},
		
		updateDisableHnat(e) {
			this.advancedConfig.disable_hnat = e.detail.value ? 1 : 0
		}
	}
}
</script>

<style scoped>
@import '@/styles/common.scss';


.settings-container {
	padding: 5rpx;
}

.setting-card {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.setting-header {
	flex: 1;
	margin-right: 20rpx;
}

.setting-title {
	font-size: 32rpx;
	color: #333;
	font-weight: 600;
	margin-bottom: 8rpx;
	display: block;
}

.setting-desc {
	font-size: 24rpx;
	color: #666;
	line-height: 1.4;
	display: block;
}

.setting-control {
	display: flex;
	align-items: center;
}

.setting-input {
	padding: 15rpx 20rpx;
	background: #fff;
	border-radius: 8rpx;
	font-size: 28rpx;
	color: #333;
	border: 1rpx solid #ddd;
	min-width: 200rpx;
}

.save-button-container {
	padding: 40rpx 20rpx;
}

.save-button {
	width: 100%;
	height: 88rpx;
	background: #007AFF;
	border-radius: 16rpx;
	border: none;
	display: flex;
	justify-content: center;
	align-items: center;
}

.save-button:disabled {
	background: #ccc;
}

.save-button-text {
	font-size: 32rpx;
	color: #fff;
	font-weight: 600;
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
</style>
