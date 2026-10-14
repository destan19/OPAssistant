<template>
	<view class="container">
	
		<view v-if="showProgress" class="progress-overlay">
			<view class="progress-content">
				<view class="progress-spinner"></view>
				<text class="progress-title">{{ $t('reboot.device_restarting') }}</text>
				<text class="progress-desc">{{ $t('reboot.please_wait') }}</text>
				<text class="progress-countdown">{{ countdownText }}</text>
			</view>
		</view>

		<view class="reboot-card">
			<view class="reboot-icon">
				<image src="/static/reboot.png" mode="aspectFit" class="app-icon-image" />
			</view>
			<text class="reboot-title">{{ $t('reboot.device_restart') }}</text>
			<text class="reboot-desc">{{ $t('reboot.restart_desc') }}</text>
			
			<button class="reboot-btn" @click="confirmReboot" :disabled="rebooting">
				<text v-if="!rebooting" class="reboot-btn-text">{{ $t('reboot.restart_device') }}</text>
				<text v-else class="reboot-btn-text">{{ $t('reboot.restarting') }}</text>
			</button>
		</view>
	</view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'

export default {
		data() {
			return {
				rebooting: false,
				showProgress: false,
				countdown: 60,
				countdownText: '',
				countdownTimer: null,
				deviceInfo: {},
				session: '',
				url: '/ubus'
			}
		},
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('reboot.title')
		})
		
		this.deviceInfo = DeviceManager.getCurrentDevice()
		this.session = this.deviceInfo.sysauth
		const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
		const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
		this.url = `${protocol}://${formattedHost}:${this.deviceInfo.port}/ubus`
	},
	onUnload() {
	
		this.clearCountdown()
	},
	methods: {

		confirmReboot() {
			uni.showModal({
				title: this.$t('reboot.confirm_restart'),
				content: this.$t('reboot.confirm_restart_content'),
				confirmText: this.$t('reboot.confirm_restart_text'),
				confirmColor: '#ff3b30',
				success: (res) => {
					if (res.confirm) {
						this.executeReboot()
					}
				}
			})
		},
		
	
		executeReboot() {
			this.rebooting = true
	
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 3,
					method: 'call',
					params: [this.session, 'system', 'reboot', {}]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 3000,
				success: (res) => {
					console.log('reboot:', res)
				},
				fail: (err) => {
					console.log('reboot:', err)
				},
				complete: () => {
				
					this.showProgress = true
					this.startCountdown()
				}
			})
		},

		startCountdown() {
			this.countdown = 60
			this.updateCountdownText()
			
			this.countdownTimer = setInterval(() => {
				this.countdown--
				this.updateCountdownText()
				
				if (this.countdown <= 0) {
					this.clearCountdown()
		
					uni.reLaunch({
						url: '/pages/device_list'
					})
				}
			}, 1000)
		},
		
	
		clearCountdown() {
			if (this.countdownTimer) {
				clearInterval(this.countdownTimer)
				this.countdownTimer = null
			}
		},
		

		updateCountdownText() {
			this.countdownText = `${this.countdown}${this.$t('reboot.seconds')}`
		}
	}
}
</script>

<style scoped>
@import '@/styles/common.scss';

.container {
	padding: 20rpx;
}

.progress-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(15, 23, 42, 0.45);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 999;
}

.progress-content {
	background: #ffffff;
	padding: 56rpx 42rpx;
	border-radius: 24rpx;
	text-align: center;
	width: 84%;
	max-width: 620rpx;
	box-shadow: 0 16rpx 40rpx rgba(15, 23, 42, 0.18);
}

.progress-spinner {
	border: 6rpx solid #f1f5f9;
	border-top: 6rpx solid #3b82f6;
	border-radius: 50%;
	width: 92rpx;
	height: 92rpx;
	animation: spin 1s linear infinite;
	margin: 0 auto 28rpx;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.progress-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #111827;
	display: block;
	margin-bottom: 14rpx;
}

.progress-desc {
	font-size: 26rpx;
	color: #4b5563;
	display: block;
	margin-bottom: 22rpx;
	line-height: 1.5;
}

.progress-countdown {
	font-size: 32rpx;
	font-weight: 700;
	color: #3b82f6;
	display: block;
}


.reboot-card {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 24rpx;
	padding: 52rpx 36rpx;
	margin-top: 24rpx;
	text-align: center;
	box-shadow: 0 10rpx 30rpx rgba(15, 23, 42, 0.12);
	border: 1rpx solid rgba(59, 130, 246, 0.08);
}

.reboot-icon {
	width: 168rpx;
	height: 168rpx;
	margin: 0 auto 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 24rpx;
	background: #eaf4ff;
}

.app-icon-image {
	width: 112rpx;
	height: 112rpx;
}

.reboot-title {
	font-size: 38rpx;
	font-weight: 700;
	color: #111827;
	display: block;
	margin-bottom: 16rpx;
}

.reboot-desc {
	font-size: 26rpx;
	color: #4b5563;
	line-height: 1.6;
	display: block;
	margin-bottom: 42rpx;
}

.reboot-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	background: #ef4444;
	color: #ffffff;
	border: none;
	border-radius: 16rpx;
	box-shadow: none;
	transition: all 0.2s ease;
}

.reboot-btn::after {
	border: none;
}

.reboot-btn:active {
	transform: none;
	background: #dc2626;
}

.reboot-btn:disabled {
	opacity: 0.6;
	transform: none;
	box-shadow: none;
	background: #fca5a5;
}

.reboot-btn-text {
	font-size: 30rpx;
	font-weight: 600;
}
</style>

