<template>
	<view class="container">
		<view class="header">
			<view class="menu-btn" @click="showMenu">
				<image class="menu-icon" src="/static/menu.png" mode="widthFix" />
			</view>
			<text class="header-title">{{ $t('device_list.title') }}</text>
			<view class="add-btn" @click="addDevice">
				<image class="add-icon" src="/static/add.png" mode="widthFix" />
			</view>
		</view>
		
		<uni-popup ref="menuPopup" type="top" :mask-click="true">
			<view class="menu-content">
				<view class="menu-item" @click="navigateToHelp">
					<view class="menu-item-icon-wrap help-icon-wrap">
						<image class="menu-popup-icon" src="/static/help.png" mode="aspectFit" />
					</view>
					<text class="menu-item-text">{{ $t('device_list.help_feedback') }}</text>
					<image class="menu-item-arrow" src="/static/right.png" mode="widthFix" style="width: 32rpx; height: 32rpx;" />
				</view>
				<view class="menu-item" @click="navigateToSettings">
					<view class="menu-item-icon-wrap language-icon-wrap">
						<image class="menu-popup-icon" src="/static/lang.png" mode="aspectFit" />
					</view>
					<text class="menu-item-text">{{ $t('device_list.language_settings') }}</text>
					<image class="menu-item-arrow" src="/static/right.png" mode="widthFix" style="width: 32rpx; height: 32rpx;" />
				</view>
				<view class="menu-item" @click="navigateToAbout">
					<view class="menu-item-icon-wrap about-icon-wrap">
						<image class="menu-popup-icon" src="/static/about.png" mode="aspectFit" />
					</view>
					<text class="menu-item-text">{{ $t('device_list.about') }}</text>
					<image class="menu-item-arrow" src="/static/right.png" mode="widthFix" style="width: 32rpx; height: 32rpx;" />
				</view>
			
			</view>
		</uni-popup>
		
		<scroll-view class="content-scroll" scroll-y="true" show-scrollbar="false">
			<view class="device-list-container">
				<view v-if="deviceList.length === 0" class="empty-state">
					<text class="empty-text">{{ $t('device_list.empty_message') }}</text>
				</view>
				<view v-else :key="index" v-for="(item, index) in deviceList">
					<view class="device-card" @click="onCardClickHandle(item)">
						<view class="card-content">
							<view class="device-icon-wrap">
								<image class="device-icon" src="/static/router.png" mode="widthFix" />
							</view>
							<view class="device-info">
								<text class="device-name">{{ item.name }}</text>
								<view class="device-sub-row">
									<text class="ip-chip">{{ formatDeviceAddress(item) }}</text>
									<text class="meta-chip">{{ item.useHttps ? 'HTTPS' : 'HTTP' }}</text>
									<text class="meta-chip">{{ item.port || '-' }}</text>
								</view>
							</view>
							<view class="more-btn" @click.stop="showDeviceMenu(item)">
								<image class="more-icon" src="/static/more.png" mode="widthFix" />
							</view>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
		<view class="page-footer" @click="openWebsite">
			<text class="page-footer-text">www.openappfilter.com</text>
		</view>
	
		<uni-popup ref="devicePopup" type="center" :mask-click="false">
			<view class="popup-content">
				<view class="popup-header">
					<text class="popup-title">{{isEdit ? $t('device_list.edit_device_popup') : $t('device_list.add_device_popup')}}</text>
				</view>
				<view class="form-content">
				
					<view class="form-item">
						<text class="label">{{ $t('device_list.host_address') }}:</text>
						<input class="input" v-model="deviceForm.ip" :placeholder="$t('device_list.host_placeholder')" />
					</view>
			
				
					<view class="form-item">
						<text class="label">{{ $t('device_list.protocol') }}:</text>
						<view class="protocol-selector">
							<view 
								:class="['protocol-option', deviceForm.useHttps ? '' : 'active']" 
								@click="deviceForm.useHttps = false"
							>
								<text>{{ $t('device_list.protocol_http') }}</text>
							</view>
							<view 
								:class="['protocol-option', deviceForm.useHttps ? 'active' : '']" 
								@click="deviceForm.useHttps = true"
							>
								<text>{{ $t('device_list.protocol_https') }}</text>
							</view>
						</view>
					</view>
					<view class="form-item">
						<text class="label">{{ $t('device_list.username_default') }}:</text>
						<input class="input" v-model="deviceForm.username" :placeholder="$t('device_list.username_placeholder')" />
					</view>
					<view class="form-item">
						<text class="label">{{ $t('device_list.password') }}:</text>
						<input class="input" v-model="deviceForm.password" :placeholder="$t('device_list.password_placeholder')" type="password" />
					</view>
					<view class="form-item">
						<text class="label">{{ $t('device_list.port_default') }}:</text>
						<input class="input" v-model="deviceForm.port" :placeholder="$t('device_list.port_placeholder')" />
					</view>
					<view class="form-item">
						<text class="label">{{ $t('device_list.remark') }}:</text>
						<input class="input" v-model="deviceForm.name" :placeholder="$t('device_list.name_placeholder')" />
					</view>
				</view>
				<view class="popup-actions">
					<button class="popup-btn cancel-btn" @click="closePopup">{{ $t('device_list.cancel') }}</button>
					<button class="popup-btn confirm-btn" @click="saveDevice">{{ $t('device_list.confirm') }}</button>
				</view>
			</view>
		</uni-popup>
		
		<!-- 设备操作菜单弹窗 -->
		<uni-popup ref="deviceMenuPopup" type="bottom" :mask-click="true">
			<view class="device-menu-content">
				<view class="menu-item" @click="editDeviceFromMenu">
					<image class="menu-item-icon" src="/static/edit2.png" mode="widthFix" />
					<text class="menu-item-text">{{ $t('device_list.edit') }}</text>
				</view>
				<view class="menu-item delete-item" @click="deleteDeviceFromMenu">
					<image class="menu-item-icon" src="/static/delete2.png" mode="widthFix" />
					<text class="menu-item-text">{{ $t('device_list.delete') }}</text>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import DeviceManager from '@/utils/deviceManager.js'
	
	export default {
		data() {
			return {
				deviceList: [],
				deviceForm: {
					name: 'OpenWrt',
					ip: '192.168.1.1',
					port: '80',
					username: 'root',
					password: '',
					useHttps: false
				},
				isEdit: false,
				editDeviceId: null,
				currentDevice: null // 当前选中的设备
			}
		},
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('device_list.title')
		})
		
		this.loadDeviceList()
	},
	onShow() {
		// Update navigation bar title when returning to this page (e.g., after language switch)
		uni.setNavigationBarTitle({
			title: this.$t('device_list.title')
		})
		
		this.loadDeviceList()
	},
		methods: {
		// 根据错误码获取错误消息
		getErrorMessage(errorCode) {
			switch (errorCode) {
				case 4000: // 网络错误
					return this.$t('device_list.error_network')
				case 4001: // 用户名密码错误
					return this.$t('device_list.error_auth')
				case 4003: // 证书错误
					return this.$t('device_list.error_certificate')
				case 4002: // 其他错误
					return this.$t('device_list.error_other')
				default:
					return this.$t('device_list.connection_failed_content')
			}
		},
			
			loadDeviceList() {
				const deviceList = DeviceManager.getDeviceList()
				if (deviceList.length === 0) {
		
					DeviceManager.initTestData()
					this.deviceList = DeviceManager.getDeviceList()
				} else {
					this.deviceList = deviceList
				}
			},
			


			addDevice() {
				this.isEdit = false
				this.editDeviceId = null
				this.resetDeviceForm()
				this.$refs.devicePopup.open()
			},
			
	
			editDevice(device) {
				this.isEdit = true
				this.editDeviceId = device.id
				// 获取解密后的设备信息
				const decryptedDevice = DeviceManager.getDeviceById(device.id)
				this.deviceForm = { ...decryptedDevice }
				this.$refs.devicePopup.open()
			},
			
		
			deleteDevice(deviceId) {
				uni.showModal({
					title: this.$t('device_list.delete_confirm_title'),
					content: this.$t('device_list.delete_confirm_content'),
					success: (res) => {
						if (res.confirm) {
							if (DeviceManager.deleteDevice(deviceId)) {
								this.loadDeviceList()
								uni.showToast({
									title: this.$t('device_list.delete_success'),
									icon: 'success',
									duration: 1000
								})
							} else {
								uni.showToast({
									title: this.$t('device_list.delete_failed'),
									icon: 'error',
									duration: 1000
								})
							}
						}
					}
				})
			},
			
	
			resetDeviceForm() {
				this.deviceForm = {
					name: 'OpenWrt',
					ip: '',
					port: '80',
					username: 'root',
					password: '',
					useHttps: false
				}
			},
			
		
			validateIP(host) {
				// 长度限制：不超过64个字符
				if (!host || host.length === 0 || host.length > 64) {
					return false
				}
				
				// 允许的字符：字母、数字、点号、冒号、连字符
				// 这些字符涵盖了IPv4、IPv6和域名的所有有效字符
				const allowedCharsRegex = /^[a-zA-Z0-9.:-]+$/
				return allowedCharsRegex.test(host)
			},
			
			
			validatePort(port) {
				const portNum = parseInt(port)
				return portNum >= 1 && portNum <= 65535
			},
			
		
		validateUsername(username) {
			const usernameRegex = /^[a-zA-Z0-9.\-_@]+$/
			return usernameRegex.test(username)
		},
			
		validatePassword(password) {
		
			if (password === '') {
				return { valid: true, message: '' }
			}
			
			if (password.length > 64) {
				return { valid: false, message: this.$t('device_list.password_length_error') }
			}
			if (password.includes(' ') || password.includes('\n') || password.includes('\r')) {
				return { valid: false, message: this.$t('device_list.password_format_error') }
			}

			const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/
			if (!passwordRegex.test(password)) {
				return { valid: false, message: this.$t('device_list.password_char_error') }
			}
			
			return { valid: true, message: '' }
		},
			
			// 验证备注长度
			validateName(name) {
				return name.length <= 64
			},
			
	
			saveDevice() {
			
				if (!this.deviceForm.ip) {
					uni.showToast({
						title: this.$t('device_list.host_required'),
						icon: 'none'
					})
					return
				}
				if (!this.validateIP(this.deviceForm.ip)) {
					uni.showToast({
						title: this.$t('device_list.host_format_error'),
						icon: 'none'
					})
					return
				}
				
		
				if (!this.deviceForm.port) {
					uni.showToast({
						title: this.$t('device_list.port_required'),
						icon: 'none'
					})
					return
				}
				if (!this.validatePort(this.deviceForm.port)) {
					uni.showToast({
						title: this.$t('device_list.port_range_error'),
						icon: 'none'
					})
					return
				}
				
		
				if (!this.deviceForm.username) {
					uni.showToast({
						title: this.$t('device_list.username_required'),
						icon: 'none'
					})
					return
				}
				if (!this.validateUsername(this.deviceForm.username)) {
					uni.showToast({
						title: this.$t('device_list.username_format_error'),
						icon: 'none'
					})
					return
				}
				
		
				const passwordValidation = this.validatePassword(this.deviceForm.password)
				if (!passwordValidation.valid) {
					uni.showToast({
						title: passwordValidation.message,
						icon: 'none'
					})
					return
				}
			
				if (!this.deviceForm.name) {
					uni.showToast({
						title: this.$t('device_list.remark_required'),
						icon: 'none'
					})
					return
				}
				if (!this.validateName(this.deviceForm.name)) {
					uni.showToast({
						title: this.$t('device_list.remark_length_error'),
						icon: 'none'
					})
					return
				}
				
				let success = false
				if (this.isEdit) {
			
					this.deviceForm.sysauth = null
					this.deviceForm.online = false
					success = DeviceManager.updateDevice(this.editDeviceId, this.deviceForm)
				} else {
		
					success = DeviceManager.addDevice(this.deviceForm)
				}
				
				if (success) {
					this.loadDeviceList()
					this.closePopup()
					uni.showToast({
						title: this.isEdit ? this.$t('device_list.edit_success') : this.$t('device_list.add_success'),
						icon: 'success',
						duration: 1000
					})
				} else {
					uni.showToast({
						title: this.$t('device_list.operation_failed'),
						icon: 'error',
						duration: 1000
					})
				}
			},
			
		
			closePopup() {
				this.$refs.devicePopup.close()
				this.resetDeviceForm()
			},
			
		
			formatTime(timeString) {
				if (!timeString) return ''
				const date = new Date(timeString)
				// 根据当前语言设置时间格式
				const locale = this.$i18n.locale
				return date.toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN')
			},

			
	
			onCardClickHandle(device) {
		
				uni.showLoading({
							title: this.$t('device_list.connecting')
						})
				
				DeviceManager.checkAndLoginDevice(device, (loginResult) => {
					console.log("check and login device")

					if (loginResult.success) {
						console.log("loginResult.success = " + loginResult.success)
						console.log("loginResult.sysauth = " + loginResult.sysauth)
						
						const updatedDevice = { ...device, sysauth: loginResult.sysauth, online: true }
						DeviceManager.setCurrentDevice(updatedDevice)
			
						
						// 在跳转前先检查session是否有效，然后检查oaf_status
						this.checkSessionValidity(updatedDevice)
					} else {
						// 登录失败
						uni.hideLoading()
						const errorMessage = this.getErrorMessage(loginResult.errorCode)
						uni.showModal({
							title: this.$t('device_list.connection_failed'),
							content: errorMessage,
							showCancel: false
						})
					}
				})
			},
			
			// 检查session是否有效
			checkSessionValidity(device) {
				const protocol = device.useHttps ? 'https' : 'http'
				const formattedHost = DeviceManager.formatHostForUrl(device.ip)
				const url = `${protocol}://${formattedHost}:${device.port}/ubus`
				console.log("checkSessionValidity url:", url)
				uni.request({
					method: "POST",
					url: url,
		
					data: {
						jsonrpc: "2.0",
						id: 1,
						method: "call",
						params: [device.sysauth, "system", "board", {}]
					},
					header: {
						'Content-Type': 'application/json',
						'x-uniauth': 'true'
					},
					timeout: 3000,
					success: (res) => {
						console.log("checkSessionValidity session检查响应:", JSON.stringify(res))
						
				
						if (res.statusCode === 200 && res.data && res.data.result && res.data.result[0] === 0) {
					
							uni.hideLoading()
							uni.showToast({
								title: this.$t('device_list.connection_success'),
								icon: 'success',
								duration: 1000
							})
							
							// 异步检查oaf_status，不阻塞页面跳转
							this.checkOafStatus(device)
							// 探测FanchmWrt系统，根据结果分流跳转
							this.detectAndNavigate(device)
							console.log("session valid, detecting system type...")
							
						} else {
							this.reLoginDevice(device)
						}
					},
					fail: (err) => {
						console.log("checkSessionValidity fail:", err)
						// 安卓出现该接口概率性失败，但是reLogin ok，所以去掉提示
						// 直接调用reLoginDevice，让reLoginDevice方法处理loading的隐藏
						this.reLoginDevice(device)
					}
				})
		},
		
		saveParentalControlSupport(device, supportParentalControl) {
			const currentDevice = DeviceManager.getCurrentDevice()
			const deviceBase = currentDevice && currentDevice.id === device.id ? currentDevice : device
			const updatedDevice = { ...deviceBase, support_parental_control: supportParentalControl }
			DeviceManager.setCurrentDevice(updatedDevice)
			DeviceManager.updateDeviceById(device.id, { support_parental_control: supportParentalControl })
		},

		// 获取oaf_status并设置support_parental_control（异步非阻塞）
		async checkOafStatus(device) {
			try {
				const protocol = device.useHttps ? 'https' : 'http'
				const formattedHost = DeviceManager.formatHostForUrl(device.ip)
				const url = `${protocol}://${formattedHost}:${device.port}/ubus`
				
				// 设置3秒超时
				const response = await Promise.race([
					new Promise((resolve, reject) => {
						uni.request({
							url: url,
							method: 'POST',
							header: {
								'Content-Type': 'application/json',
								'x-uniauth': 'true'
							},
							data: {
								jsonrpc: '2.0',
								id: 1,
								method: 'call',
								params: [
									device.sysauth,
									'appfilter',
									'get_oaf_status',
									{}
								]
							},
							timeout: 3000,
							success: resolve,
							fail: reject
						})
					}),
					new Promise((_, reject) => {
						setTimeout(() => reject(new Error('oaf_status请求超时')), 3000)
					})
				])
				
				if (response.data && response.data.result && response.data.result[0] === 0) {
					// oaf_status获取成功，设置support_parental_control为1
					this.saveParentalControlSupport(device, 1)
					console.log('oaf_status获取成功，设置support_parental_control为1')
				} else {
					// oaf_status获取失败，设置support_parental_control为0
					this.saveParentalControlSupport(device, 0)
					console.log('oaf_status获取失败，设置support_parental_control为0')
				}
			} catch (error) {
				// 请求失败或超时，设置support_parental_control为0
				this.saveParentalControlSupport(device, 0)
				console.log('oaf_status请求失败或超时，设置support_parental_control为0:', error.message || error)
			}
		},
		
		// 探测设备是否为FanchmWrt系统，据此跳转到对应首页
		async detectAndNavigate(device) {
			const protocol = device.useHttps ? 'https' : 'http'
			const host = DeviceManager.formatHostForUrl(device.ip)
			const url = `${protocol}://${host}:${device.port}/ubus`
			const reqData = {
				jsonrpc: '2.0', id: 1, method: 'call',
				params: [device.sysauth, 'fwx', 'common', { api: 'get_dashboard_common', CopyRight: 'www.fanchmwrt.com', data: {} }]
			}
			console.log('[FanchmWrt detect] POST', url)
			console.log('[FanchmWrt detect] request:', JSON.stringify(reqData))
			let isFanchmwrt = false
			let oaf = null
			try {
				await new Promise((resolve) => {
					const timer = setTimeout(() => {
						console.warn('[FanchmWrt detect] timeout, fallback to standard OpenWrt')
						resolve()
					}, 2500)
					uni.request({
						url,
						method: 'POST',
						header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
						data: reqData,
						timeout: 2000,
						success: (res) => {
							clearTimeout(timer)
							console.log('[FanchmWrt detect] response status:', res.statusCode)
							console.log('[FanchmWrt detect] response data:', JSON.stringify(res.data))
							isFanchmwrt = !!(res.data && res.data.result && res.data.result[0] === 0)
							if (isFanchmwrt) {
								const payload = res.data.result[1]
								const dashboardData = (payload && payload.data) ? payload.data : payload
								const systemStatus = (dashboardData && dashboardData.system_status) || {}
								const hasOaf = Object.prototype.hasOwnProperty.call(systemStatus, 'oaf')
								oaf = hasOaf ? systemStatus.oaf : null
								console.log('[FanchmWrt detect] system_status.oaf:', oaf, '| exists:', hasOaf, '| type:', typeof oaf)
							}
							resolve()
						},
						fail: (err) => {
							clearTimeout(timer)
							console.warn('[FanchmWrt detect] request failed:', JSON.stringify(err))
							resolve()
						}
					})
				})
			} catch (e) {
				console.error('[FanchmWrt detect] exception:', e)
				isFanchmwrt = false
			}
			const currentDevice = DeviceManager.getCurrentDevice()
			const deviceBase = currentDevice && currentDevice.id === device.id ? currentDevice : device
			const updatedDevice = { ...deviceBase, isFanchmwrt, oaf: isFanchmwrt ? oaf : null }
			DeviceManager.setCurrentDevice(updatedDevice)
			DeviceManager.updateDeviceById(device.id, { isFanchmwrt, oaf: isFanchmwrt ? oaf : null })
			console.log('[FanchmWrt detect] stored device.oaf:', updatedDevice.oaf)
			console.log(`[FanchmWrt detect] result: ${isFanchmwrt}, navigating to ${isFanchmwrt ? 'fanchmwrt/dashboard' : 'device/home'}`)
			setTimeout(() => {
				if (isFanchmwrt) {
					uni.reLaunch({ url: '/pages/fanchmwrt/dashboard' })
				} else {
					uni.reLaunch({ url: '/pages/openwrt/home' })
				}
			}, 300)
		},

		reLoginDevice(device) {
				const deviceWithoutSession = { ...device, sysauth: null }
				DeviceManager.loginDevice(deviceWithoutSession, (loginResult) => {
					if (loginResult.success) {
				
						const updatedDevice = { ...device, sysauth: loginResult.sysauth, online: true }
						DeviceManager.setCurrentDevice(updatedDevice)
						
						uni.hideLoading()
						uni.showToast({
							title: this.$t('device_list.login_success'),
							icon: 'success',
							duration: 1000
						})
						
						// 异步检查oaf_status，不阻塞页面跳转
						this.checkOafStatus(updatedDevice)
						// 探测FanchmWrt系统，根据结果分流跳转
						this.detectAndNavigate(updatedDevice)
					} else {
						uni.hideLoading()
						const errorMessage = this.getErrorMessage(loginResult.errorCode)
						uni.showModal({
							title: this.$t('device_list.login_failed'),
							content: errorMessage,
							showCancel: false
						})
					}
				})
			},

			// 显示菜单
			showMenu() {
				this.$refs.menuPopup.open()
			},

			navigateToHelp() {
				uni.navigateTo({
					url: '/pages/help/index'
				})
				this.$refs.menuPopup.close()
			},

			navigateToAbout() {
				uni.navigateTo({
					url: '/pages/about/index'
				})
				this.$refs.menuPopup.close()
			},

			navigateToSettings() {
				uni.navigateTo({
					url: '/pages/language/index'
				})
				this.$refs.menuPopup.close()
			},

			// 显示设备操作菜单
			showDeviceMenu(device) {
				this.currentDevice = device
				this.$refs.deviceMenuPopup.open()
			},

			// 从菜单编辑设备
			editDeviceFromMenu() {
				this.$refs.deviceMenuPopup.close()
				this.editDevice(this.currentDevice)
			},

			// 从菜单删除设备
			deleteDeviceFromMenu() {
				this.$refs.deviceMenuPopup.close()
				this.deleteDevice(this.currentDevice.id)
			},

			// 格式化设备地址，超过32个字符时隐藏中间部分
			formatDeviceAddress(device) {
				const host = device && device.ip ? String(device.ip).trim() : ''
				if (!host) {
					return '-'
				}
				if (host.length <= 36) {
					return host
				}
				return `${host.substring(0, 19)}...${host.substring(host.length - 14)}`
			},

			openWebsite() {
				if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.openURL) {
					plus.runtime.openURL('https://www.openappfilter.com')
					return
				}
				if (typeof window !== 'undefined' && window.open) {
					window.open('https://www.openappfilter.com')
				}
			}
		}
	}
</script>

<style scoped>
.container {
	padding: 0 16rpx 24rpx;
	padding-top: var(--status-bar-height);
	background-color: #f6f8fc;
	height: 100vh;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 10px;
	margin-bottom: 10rpx;
	padding: calc(10rpx + 5px) 4rpx;
}

.menu-btn {
	width: 64rpx;
	height: 64rpx;
	border-radius: 12rpx;
	background: transparent;
	border: none;
	box-shadow: none;
	display: flex;
	align-items: center;
	justify-content: center;
}

.header-title {
	flex: 1;
	font-size: 33rpx;
	font-weight: 600;
	color: #0f172a;
	text-align: center;
	line-height: 1.3;
}

.menu-icon {
	width: 38rpx;
	height: 38rpx;
}

.add-btn {
	width: 64rpx;
	height: 64rpx;
	border-radius: 12rpx;
	background: transparent;
	border: none;
	box-shadow: none;
	display: flex;
	align-items: center;
	justify-content: center;
}

.menu-btn:active,
.add-btn:active {
	background: rgba(15, 23, 42, 0.08);
}

.add-icon {
	width: 38rpx;
	height: 38rpx;
}

.content-scroll {
	flex: 1;
	min-height: 0;
}

.page-footer {
	padding: 10rpx 0 6rpx;
	text-align: center;
	cursor: pointer;
	transition: opacity 0.2s ease;
}

.page-footer:active {
	opacity: 0.72;
}

.page-footer-text {
	font-size: 23rpx;
	color: #6b7280;
}

.device-list-container {
	padding: 2rpx 2rpx 24rpx;
}

.device-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.empty-state {
	text-align: center;
	padding: 84rpx 24rpx;
	background: #ffffff;
	border: 1rpx solid #e4ebf5;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.05);
}

.empty-text {
	color: #6b7280;
	font-size: 23rpx;
	line-height: 1.6;
}

/* 设备卡片样式 */
.device-card {
	background: #ffffff;
	border-radius: 20rpx;
	margin-bottom: 16rpx;
	padding: 18rpx 16rpx;
	box-shadow: 0 6rpx 16rpx rgba(15, 23, 42, 0.06);
	min-height: 100rpx;
	position: relative;
	border: 1rpx solid #e3eaf5;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.device-card:active {
	transform: scale(0.99);
	box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.12);
}

.card-content {
	display: flex;
	align-items: center;
	gap: 12rpx;
	min-height: 86rpx;
}

.device-icon-wrap {
	width: 86rpx;
	height: 86rpx;
	border-radius: 19rpx;
	background: #3b82f6;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.device-icon {
	width: 54rpx;
	height: 54rpx;
}

.device-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	min-width: 0;
}

.device-name {
	font-size: 26rpx;
	font-weight: 600;
	color: #1e293b;
	line-height: 1.22;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.device-sub-row {
	display: flex;
	align-items: center;
	gap: 8rpx;
	margin-top: calc(8rpx + 6px);
	flex-wrap: nowrap;
	min-width: 0;
	overflow: hidden;
}

.ip-chip {
	height: 38rpx;
	line-height: 38rpx;
	padding: 0 14rpx;
	border-radius: 999rpx;
	font-size: 20rpx;
	color: #2b5f99;
	background: #eaf3ff;
	border: 1rpx solid #cfe2ff;
	max-width: 300rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex-shrink: 1;
}

.meta-chip {
	height: 36rpx;
	line-height: 36rpx;
	padding: 0 12rpx;
	border-radius: 999rpx;
	font-size: 19rpx;
	color: #3d5c88;
	background: #f1f6ff;
	border: 1rpx solid #dceaff;
	max-width: 140rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex-shrink: 0;
}

.more-btn {
	width: 56rpx;
	height: 56rpx;
	padding: 8rpx;
	margin-left: 4rpx;
	flex-shrink: 0;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.more-btn:active {
	background: rgba(0, 0, 0, 0.06);
}

.more-icon {
	width: 34rpx;
	height: 34rpx;
}

.popup-content {
	background-color: #ffffff;
	border-radius: 24rpx;
	width: 660rpx;
	padding: 24rpx;
	border: 1rpx solid #e3ebf7;
	box-shadow: 0 14rpx 38rpx rgba(15, 23, 42, 0.12);
}

.popup-header {
	text-align: center;
	margin-bottom: 18rpx;
}

.popup-title {
	font-size: 33rpx;
	font-weight: 600;
	color: #0f172a;
}

.form-content {
	margin-bottom: 16rpx;
	background: #f7fbff;
	border: 1rpx solid #e4edf9;
	border-radius: 16rpx;
	padding: 18rpx 16rpx;
}

.form-item {
	margin-bottom: 14rpx;
}

.form-item .label {
	display: block;
	font-size: 23rpx;
	font-weight: 500;
	color: #475569;
	margin-bottom: 7rpx;
}

.input {
	width: 100%;
	height: 72rpx;
	border: 1rpx solid #d7e2f0;
	border-radius: 12rpx;
	padding: 0 16rpx;
	font-size: 24rpx;
	color: #0f172a;
	background: #ffffff;
	box-sizing: border-box;
}

.input:focus {
	border-color: #3b82f6;
	box-shadow: 0 0 0 2rpx rgba(59, 130, 246, 0.15);
}

.popup-actions {
	display: flex;
	justify-content: space-between;
	gap: 12rpx;
}

.popup-btn {
	flex: 1;
	height: 72rpx;
	border-radius: 12rpx;
	font-size: 25rpx;
	font-weight: 600;
	border: none;
}

.cancel-btn {
	background-color: #ffffff;
	color: #475569;
	border: 1rpx solid #d7deea;
}

.confirm-btn {
	background-color: #2563eb;
	color: white;
	box-shadow: 0 8rpx 16rpx rgba(37, 99, 235, 0.2);
}

.protocol-selector {
	display: flex;
	gap: 8rpx;
	padding: 8rpx;
	border: 1rpx solid #d7e2f0;
	border-radius: 12rpx;
	background: #eef4ff;
}

.protocol-option {
	flex: 1;
	text-align: center;
	height: 56rpx;
	line-height: 56rpx;
	padding: 0;
	border: 1rpx solid transparent;
	border-radius: 10rpx;
	font-size: 24rpx;
	font-weight: 500;
	color: #475569;
	background-color: transparent;
	transition: all 0.2s ease;
}

.protocol-option.active {
	background-color: #ffffff;
	color: #2563eb;
	border-color: #cddfff;
	box-shadow: 0 4rpx 10rpx rgba(37, 99, 235, 0.12);
}

/* 菜单弹窗样式 */
.menu-content {
	background-color: #fff;
	border-radius: 24rpx;
	margin-top: calc(var(--status-bar-height) + 94rpx + 20px);
	padding: 16rpx 20rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 20rpx 12rpx;
	border-radius: 12rpx;
	border-bottom: none;
	transition: background 0.2s ease;
}

.menu-item:active {
	background: #f5f5f5;
}

.menu-item-icon-wrap {
	width: 56rpx;
	height: 56rpx;
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.menu-popup-icon {
	width: 36rpx;
	height: 36rpx;
}

.language-icon-wrap {
	background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.language-icon-text {
	font-size: 22rpx;
	font-weight: 700;
	color: #1976d2;
	letter-spacing: -1rpx;
}

.help-icon-wrap {
	background: #fff3e0;
}

.about-icon-wrap {
	background: #f3e5f5;
}

.menu-item-icon-emoji {
	font-size: 28rpx;
	font-weight: bold;
	color: #e65100;
	font-style: italic;
}

.about-icon-wrap .menu-item-icon-emoji {
	color: #7b1fa2;
}

.menu-item-text {
	flex: 1;
	font-size: 30rpx;
	color: #333;
}

.menu-item-arrow {
	font-size: 30rpx;
	color: #999;
}

.menu-item-icon {
	font-size: 36rpx;
	margin-right: 15rpx;
	color: #007aff;
}

/* 设备操作菜单样式 */
.device-menu-content {
	background-color: #fff;
	border-radius: 18rpx 18rpx 0 0;
	padding: 10rpx 14rpx;
	border-top: 1rpx solid #e5ecf6;
}

.device-menu-content .menu-item {
	display: flex;
	align-items: center;
	padding: 18rpx 8rpx;
	border-bottom: 1rpx solid #eef2f7;
	border-radius: 12rpx;
}

.device-menu-content .menu-item:last-child {
	border-bottom: none;
}

.device-menu-content .menu-item:active {
	background: #f8fafc;
}

.device-menu-content .menu-item-icon {
	width: 40rpx;
	height: 40rpx;
	margin-right: 20rpx;
}

.device-menu-content .menu-item-text {
	flex: 1;
	font-size: 30rpx;
	color: #1f2937;
	font-weight: 500;
}

.device-menu-content .delete-item .menu-item-text {
	color: #ff3b30;
}
</style>
