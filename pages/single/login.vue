<template>
	<view class="sl-page">
		<view class="sl-body">

			<!-- Hero -->
			<view class="sl-hero">
				<view class="sl-logo-wrap">
					<image class="sl-logo" src="/static/router.png" mode="widthFix" />
				</view>
				<text class="sl-product">OPAssistant</text>
			</view>

			<!-- Form card -->
			<view class="sl-card">
				<view class="sl-row">
					<text class="sl-label">{{ $t('single_login.username') }}</text>
					<input
						class="sl-input"
						v-model="form.username"
						:placeholder="$t('single_login.username_placeholder')"
						:disabled="loading"
					/>
				</view>
				<view class="sl-sep" />
				<view class="sl-row">
					<text class="sl-label">{{ $t('single_login.password') }}</text>
					<input
						class="sl-input"
						v-model="form.password"
						:placeholder="$t('single_login.password_placeholder')"
						password
						:disabled="loading"
					/>
				</view>
			</view>

			<!-- Error -->
			<text v-if="errorMsg" class="sl-error">{{ errorMsg }}</text>

			<!-- Login button -->
			<button class="sl-btn" :loading="loading" :disabled="loading" @click="doLogin">
				{{ $t('single_login.login') }}
			</button>

			<!-- #ifdef H5 -->
			<view class="sl-luci-link" @click="openLuci">
				<text class="sl-luci-text">访问 LuCI 管理界面</text>
			</view>
			<!-- #endif -->

		</view>
	</view>
</template>

<script>
	import DeviceManager from '@/utils/deviceManager.js'

	export default {
		data() {
			return {
				form: {
					username: 'root',
					password: ''
				},
				ip: '',
				port: '80',
				useHttps: false,
				displayHost: '',
				loading: false,
				errorMsg: '',
				luciUrl: ''
			}
		},

		onLoad() {
			// #ifdef H5
			const loc = window.location
			this.useHttps = loc.protocol === 'https:'
			this.ip = loc.hostname
			this.port = loc.port || (this.useHttps ? '443' : '80')
			this.displayHost = loc.hostname + (loc.port ? ':' + loc.port : '')
			this.luciUrl = loc.origin + '/cgi-bin/luci'
			// #endif
			// #ifndef H5
			this.ip = '192.168.1.1'
			this.port = '80'
			this.displayHost = '192.168.1.1'
			// #endif

			// Auto-fill credentials from stored device if IP matches
			const saved = DeviceManager.getDeviceById(DeviceManager.H5_SINGLE_DEVICE_ID)
			if (saved && saved.ip === this.ip && saved.port === this.port) {
				this.form.username = saved.username || 'root'
				this.form.password = saved.password || ''
			}
		},

		methods: {
			doLogin() {
				if (!this.form.username.trim()) {
					this.errorMsg = this.$t('single_login.error_username_required')
					return
				}
				if (!this.form.password) {
					this.errorMsg = this.$t('single_login.error_password_required')
					return
				}
				this.errorMsg = ''
				this.loading = true

				DeviceManager.loginH5Single({
					ip: this.ip,
					port: this.port,
					useHttps: this.useHttps,
					username: this.form.username.trim(),
					password: this.form.password
				}, (result) => {
					if (result.success) {
						this.detectAndNavigate()
					} else {
						this.loading = false
						this.errorMsg = this.getErrorMsg(result.errorCode)
					}
				})
			},

			// Detect fanchmwrt vs standard OpenWrt, then navigate
			async detectAndNavigate() {
				const device = DeviceManager.getCurrentDevice()
				if (!device) {
					this.loading = false
					this.errorMsg = this.$t('single_login.error_unknown')
					return
				}

				const protocol = device.useHttps ? 'https' : 'http'
				const host = DeviceManager.formatHostForUrl(device.ip)
				const url = `${protocol}://${host}:${device.port}/ubus`
				const reqData = {
					jsonrpc: '2.0', id: 1, method: 'call',
					params: [device.sysauth, 'fwx', 'common', { api: 'get_dashboard_common', CopyRight: 'www.fanchmwrt.com', data: {} }]
				}

				let isFanchmwrt = false
				let oaf = null
				try {
					await new Promise((resolve) => {
						const timer = setTimeout(() => resolve(), 2500)
						uni.request({
							url, method: 'POST',
							header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
							sslVerify: false,
							data: reqData,
							timeout: 2000,
							success: (res) => {
								clearTimeout(timer)
								isFanchmwrt = !!(res.data && res.data.result && res.data.result[0] === 0)
								if (isFanchmwrt) {
									const payload = res.data.result[1]
									const dashboardData = (payload && payload.data) ? payload.data : payload
									const systemStatus = (dashboardData && dashboardData.system_status) || {}
									const hasOaf = Object.prototype.hasOwnProperty.call(systemStatus, 'oaf')
									oaf = hasOaf ? systemStatus.oaf : null
									console.log('[FanchmWrt detect][single] system_status.oaf:', oaf, '| exists:', hasOaf, '| type:', typeof oaf)
								}
								resolve()
							},
							fail: () => { clearTimeout(timer); resolve() }
						})
					})
				} catch (e) {
					isFanchmwrt = false
				}

				const updatedDevice = { ...device, isFanchmwrt, oaf: isFanchmwrt ? oaf : null }
				DeviceManager.setCurrentDevice(updatedDevice)
				DeviceManager.updateDeviceById(device.id, { isFanchmwrt, oaf: isFanchmwrt ? oaf : null })
				console.log('[FanchmWrt detect][single] stored device.oaf:', updatedDevice.oaf)

				setTimeout(() => {
					if (isFanchmwrt) {
						uni.reLaunch({ url: '/pages/fanchmwrt/dashboard' })
					} else {
						uni.reLaunch({ url: '/pages/openwrt/home' })
					}
				}, 300)
			},

			openLuci() {
				// #ifdef H5
				window.open(this.luciUrl, '_blank')
				// #endif
			},

			getErrorMsg(errorCode) {
				const map = {
					4001: this.$t('single_login.error_auth'),
					4003: this.$t('single_login.error_cert'),
					4000: this.$t('single_login.error_network'),
					4002: this.$t('single_login.error_unknown')
				}
				return map[errorCode] || this.$t('single_login.error_unknown')
			}
		}
	}
</script>

<style scoped>
.sl-page {
	min-height: 100vh;
	background: #F2F2F7;
	display: flex;
	align-items: center;
	justify-content: center;
}

.sl-body {
	width: 100%;
	max-width: 680rpx;
	padding: 0 32rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: center;
}

/* Hero */
.sl-hero {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 48rpx;
}

.sl-logo-wrap {
	width: 112rpx;
	height: 112rpx;
	background: #007aff;
	border-radius: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 24rpx;
}

.sl-logo {
	width: 68rpx;
	height: 68rpx;
}

.sl-product {
	font-size: 34rpx;
	font-weight: 600;
	color: #1c1c1e;
	letter-spacing: 0.5rpx;
}

/* Card */
.sl-card {
	width: 100%;
	background: #ffffff;
	border-radius: 16rpx;
	overflow: hidden;
	margin-bottom: 16rpx;
}

.sl-row {
	display: flex;
	align-items: center;
	padding: 0 28rpx;
	height: 96rpx;
}

.sl-sep {
	height: 1rpx;
	background: rgba(0, 0, 0, 0.08);
	margin: 0 28rpx;
}

.sl-label {
	font-size: 28rpx;
	color: #1c1c1e;
	width: 120rpx;
	flex-shrink: 0;
}

.sl-input {
	flex: 1;
	font-size: 28rpx;
	color: #1c1c1e;
	text-align: right;
}

/* Error */
.sl-error {
	width: 100%;
	font-size: 24rpx;
	color: #ff3b30;
	text-align: center;
	margin-bottom: 16rpx;
}

/* Button */
.sl-btn {
	width: 100%;
	height: 80rpx;
	line-height: 80rpx;
	background: #007aff;
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 500;
	border-radius: 14rpx;
	border: none;
	margin-top: 8rpx;
}

.sl-btn[disabled] {
	opacity: 0.6;
}

/* #ifdef H5 */
.sl-luci-link {
	margin-top: 36rpx;
	cursor: pointer;
	display: flex;
	justify-content: center;
}

.sl-luci-text {
	font-size: 26rpx;
	color: #007aff;
	text-decoration: underline;
}
/* #endif */
</style>
