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
					<text class="setting-title">{{ $t('parental_control.app_filter_switch') }}</text>
					<text class="setting-desc">{{ $t('parental_control.app_filter_switch_desc') }}</text>
				</view>
				<view class="setting-control">
					<switch 
						:checked="settings.enable" 
						@change="onEnableChange"
						color="#007AFF"
					/>
				</view>
			</view>

			<view class="setting-card">
				<view class="setting-header">
					<text class="setting-title">{{ $t('parental_control.app_record_switch') }}</text>
					<text class="setting-desc">{{ $t('parental_control.app_record_switch_desc') }}</text>
				</view>
				<view class="setting-control">
					<switch 
						:checked="settings.recordEnable" 
						@change="onRecordEnableChange"
						color="#007AFF"
					/>
				</view>
			</view>

			<view class="setting-card">
				<view class="setting-header">
					<text class="setting-title">{{ $t('parental_control.work_mode') }}</text>
					<text class="setting-desc">{{ $t('parental_control.work_mode_desc') }}</text>
				</view>
				<view class="setting-control">
					<picker 
						:value="settings.workMode" 
						:range="workModeOptions" 
						range-key="text"
						@change="onWorkModeChange"
					>
						<view class="picker-display">
							<text class="picker-text">{{ getWorkModeText(settings.workMode) }}</text>
							<image class="picker-arrow" src="/static/right.png" mode="widthFix" style="width: 24rpx; height: 24rpx;" />
						</view>
					</picker>
				</view>
			</view>

			<view class="save-button-container">
				<button 
					class="save-button" 
					@click="saveSettings"
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
			settings: {
				enable: false,
				recordEnable: false,
				workMode: 0
			},
			workModeOptions: [
				{ value: 0, text: this.$t('parental_control.work_mode_gateway') },
				{ value: 1, text: this.$t('parental_control.work_mode_bypass') }
			]
		}
	},
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('parental_control.basic_settings')
		})
		
		this.deviceInfo = DeviceManager.getCurrentDevice()
		this.session = this.deviceInfo.sysauth
		const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
		const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
		this.url = `${protocol}://${formattedHost}:${this.deviceInfo.port}/ubus`
		
		this.loadSettings()
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		loadSettings() {
			this.loading = true
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
					if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
						const data = res.data.result[1].data
						this.settings.enable = data.enable === 1
						this.settings.recordEnable = data.record_enable === 1
						this.settings.workMode = data.work_mode || 0
					}
					this.loading = false
				},
				fail: (err) => {
					this.loading = false
					console.log('加载设置失败:', err)
				}
			})
		},
		
		onEnableChange(e) {
			this.settings.enable = e.detail.value
		},
		
		onRecordEnableChange(e) {
			this.settings.recordEnable = e.detail.value
		},
		
		onWorkModeChange(e) {
			this.settings.workMode = this.workModeOptions[e.detail.value].value
		},
		
		getWorkModeText(mode) {
			const modeMap = {
				0: this.$t('parental_control.work_mode_gateway'),
				1: this.$t('parental_control.work_mode_bypass')
			}
			return modeMap[mode] || '--'
		},
		
		saveSettings() {
			this.saving = true
			
			const params = {
				enable: this.settings.enable ? 1 : 0,
				record_enable: this.settings.recordEnable ? 1 : 0,
				work_mode: this.settings.workMode
			}
			
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 2,
					method: 'call',
					params: [this.session, 'appfilter', 'set_app_filter_base', params]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 5000,
				success: (res) => {
					this.saving = false
					uni.showToast({
						title: this.$t('parental_control.save_success'),
						icon: 'success'
					})
					
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				},
				fail: (err) => {
					this.saving = false
					uni.showToast({
						title: this.$t('parental_control.save_failed'),
						icon: 'none'
					})
				}
			})
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

.loading-text {
	font-size: 28rpx;
	color: #666;
}

.settings-container {
	padding: 20rpx;
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
	display: block;
	margin-bottom: 8rpx;
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

.picker-display {
	display: flex;
	align-items: center;
	padding: 10rpx 20rpx;
	background: #f8f8f8;
	border-radius: 8rpx;
	min-width: 200rpx;
}

.picker-text {
	font-size: 28rpx;
	color: #333;
	flex: 1;
}

.picker-arrow {
	margin-left: 10rpx;
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
</style>
