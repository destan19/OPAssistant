<template>
	<view class="fn-page">
		<!-- nav -->
		<view class="fn-nav">
			<view style="width: 60rpx;"></view>
			<text class="fn-nav-title">{{ $t('fwx_network.title') }}</text>
			<view style="width: 60rpx;"></view>
		</view>

		<!-- page-level tabs -->
		<view class="fn-tabs-bar">
			<view
				v-for="(t, i) in pageTabs"
				:key="i"
				class="fn-tab-item"
				:class="{ 'fn-tab-active': pageTab === i }"
				@click="switchTab(i)"
			>
				<text class="fn-tab-text" :class="{ 'fn-tab-text-active': pageTab === i }">{{ t }}</text>
			</view>
		</view>

		<!-- ─── 工作模式 ─────────────────────────── -->
		<scroll-view
			v-if="pageTab === 0"
			scroll-y
			style="flex: 1;"
			class="fn-scroll"
		>
			<view class="fn-section">
				<view class="fn-card">
					<view class="fn-card-title">{{ $t('fwx_network.section_mode') }}</view>
					<view class="fn-mode-group">
						<view
							class="fn-mode-btn"
							:class="{ 'fn-mode-btn-active': workMode === 0 }"
							@click="workMode = 0"
						>
							<view class="fn-mode-icon-wrap" :class="{ 'fn-mode-icon-active': workMode === 0 }">
								<text class="fn-mode-icon">⊙</text>
							</view>
							<text class="fn-mode-label">{{ $t('fwx_network.mode_gateway') }}</text>
							<text class="fn-mode-desc">{{ $t('fwx_network.mode_gateway_desc') }}</text>
						</view>
						<view
							class="fn-mode-btn"
							:class="{ 'fn-mode-btn-active': workMode === 1 }"
							@click="workMode = 1"
						>
							<view class="fn-mode-icon-wrap" :class="{ 'fn-mode-icon-active': workMode === 1 }">
								<text class="fn-mode-icon">⊕</text>
							</view>
							<text class="fn-mode-label">{{ $t('fwx_network.mode_bypass') }}</text>
							<text class="fn-mode-desc">{{ $t('fwx_network.mode_bypass_desc') }}</text>
						</view>
					</view>

					<!-- bypass warning -->
					<view v-if="workMode === 1" class="fn-warn-box">
						<view class="fn-warn-row">
							<text class="fn-warn-icon">⚠</text>
							<text class="fn-warn-text">{{ $t('fwx_network.warn_bypass_traffic') }}</text>
						</view>
						<view class="fn-warn-row" style="margin-top: 8rpx;">
							<text class="fn-warn-icon">⚠</text>
							<text class="fn-warn-text">{{ $t('fwx_network.warn_bypass_ipv6') }}</text>
						</view>
					</view>
				</view>

				<view class="fn-save-wrap">
					<view class="fn-save-btn" :class="{ 'fn-save-btn-loading': modeLoading }" @click="saveWorkMode">
						<text v-if="!modeLoading" class="fn-save-text">{{ $t('fwx_common.save') }}</text>
						<view v-else class="fn-spin"></view>
					</view>
				</view>
			</view>

			<view style="height: 160rpx;"></view>
		</scroll-view>

		<!-- ─── LAN 设置 ──────────────────────────── -->
		<scroll-view
			v-if="pageTab === 1"
			scroll-y
			style="flex: 1;"
			class="fn-scroll"
		>
			<view class="fn-section">
				<view class="fn-card">
					<view class="fn-card-title">{{ $t('fwx_network.section_lan') }}</view>

					<!-- protocol -->
					<view class="fn-row">
						<text class="fn-label">{{ $t('fwx_network.conn_type') }}</text>
						<picker
							mode="selector"
							:range="lanProtoLabels"
							:value="lanProtoIndex"
							@change="e => onLanProtoChange(e.detail.value)"
						>
							<view class="fn-picker-val">
								<text class="fn-val-text">{{ lanProtoLabels[lanProtoIndex] }}</text>
								<text class="fn-arrow">›</text>
							</view>
						</picker>
					</view>

					<!-- static fields -->
					<template v-if="lan.proto === 'static'">
						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.ip_addr') }}</text>
							<input
								class="fn-input"
								v-model="lan.ipaddr"
								placeholder="192.168.1.1"
								placeholder-class="fn-placeholder"
								@blur="validateLan"
							/>
						</view>
						<view v-if="lanErrors.ipaddr" class="fn-err-msg">{{ lanErrors.ipaddr }}</view>

						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.netmask') }}</text>
							<input
								class="fn-input"
								v-model="lan.netmask"
								placeholder="255.255.255.0"
								placeholder-class="fn-placeholder"
								@blur="validateLan"
							/>
						</view>
						<view v-if="lanErrors.netmask" class="fn-err-msg">{{ lanErrors.netmask }}</view>

						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.gateway') }}</text>
							<input
								class="fn-input"
								v-model="lan.gateway"
								placeholder="可留空"
								placeholder-class="fn-placeholder"
							/>
						</view>

						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.dns1') }}</text>
							<input
								class="fn-input"
								v-model="lan.dns1"
								placeholder="可留空"
								placeholder-class="fn-placeholder"
							/>
						</view>

						<view class="fn-row fn-row-last">
							<text class="fn-label" :class="{ 'fn-label-disabled': !lan.dns1 }">{{ $t('fwx_network.dns2') }}</text>
							<input
								class="fn-input"
								v-model="lan.dns2"
								:disabled="!lan.dns1"
								placeholder="可留空"
								placeholder-class="fn-placeholder"
							/>
						</view>
					</template>

					<view v-if="lan.proto === 'dhcp'" class="fn-info-tip fn-row-last">
						<text class="fn-info-text">{{ $t('fwx_network.tip_lan_dhcp') }}</text>
					</view>
				</view>

				<!-- DHCP server (static only) -->
				<view v-if="lan.proto === 'static'" class="fn-card">
					<view class="fn-card-title">{{ $t('fwx_network.section_dhcp') }}</view>

					<view class="fn-row">
						<text class="fn-label">{{ $t('fwx_network.dhcp_enable') }}</text>
						<view
							class="fn-toggle"
							:class="{ 'fn-toggle-on': lan.dhcp.enable }"
							@click="lan.dhcp.enable = !lan.dhcp.enable"
						>
							<view class="fn-toggle-knob"></view>
						</view>
					</view>

					<template v-if="lan.dhcp.enable">
						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.dhcp_start') }}</text>
							<input
								class="fn-input"
								v-model.number="lan.dhcp.start"
								type="number"
								placeholder="100"
								placeholder-class="fn-placeholder"
							/>
						</view>

						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.dhcp_limit') }}</text>
							<input
								class="fn-input"
								v-model.number="lan.dhcp.limit"
								type="number"
								placeholder="150"
								placeholder-class="fn-placeholder"
							/>
						</view>

						<view class="fn-row fn-row-last">
							<text class="fn-label">{{ $t('fwx_network.dhcp_lease') }}</text>
							<picker
								mode="selector"
								:range="leaseLabels"
								:value="leaseIndex"
								@change="e => leaseIndex = +e.detail.value"
							>
								<view class="fn-picker-val">
									<text class="fn-val-text">{{ leaseLabels[leaseIndex] }}</text>
									<text class="fn-arrow">›</text>
								</view>
							</picker>
						</view>
					</template>

					<view v-if="!lan.dhcp.enable" class="fn-info-tip fn-row-last">
						<text class="fn-info-text">{{ $t('fwx_network.tip_dhcp_disabled') }}</text>
					</view>
				</view>

				<view class="fn-save-wrap">
					<view class="fn-save-btn" :class="{ 'fn-save-btn-loading': lanLoading }" @click="saveLan">
						<text v-if="!lanLoading" class="fn-save-text">{{ $t('fwx_common.save') }}</text>
						<view v-else class="fn-spin"></view>
					</view>
				</view>
			</view>

			<view style="height: 160rpx;"></view>
		</scroll-view>

		<!-- ─── WAN 设置 ──────────────────────────── -->
		<scroll-view
			v-if="pageTab === 2"
			scroll-y
			style="flex: 1;"
			class="fn-scroll"
		>
			<view class="fn-section">
				<view class="fn-card">
					<view class="fn-card-title">{{ $t('fwx_network.section_wan') }}</view>

					<!-- protocol -->
					<view class="fn-row">
						<text class="fn-label">{{ $t('fwx_network.conn_type') }}</text>
						<picker
							mode="selector"
							:range="wanProtoLabels"
							:value="wanProtoIndex"
							@change="e => onWanProtoChange(e.detail.value)"
						>
							<view class="fn-picker-val">
								<text class="fn-val-text">{{ wanProtoLabels[wanProtoIndex] }}</text>
								<text class="fn-arrow">›</text>
							</view>
						</picker>
					</view>

					<!-- static fields -->
					<template v-if="wan.proto === 'static'">
						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.ip_addr') }}</text>
							<input
								class="fn-input"
								v-model="wan.ipaddr"
								placeholder="请输入 IP 地址"
								placeholder-class="fn-placeholder"
								@blur="validateWan"
							/>
						</view>
						<view v-if="wanErrors.ipaddr" class="fn-err-msg">{{ wanErrors.ipaddr }}</view>

						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.netmask') }}</text>
							<input
								class="fn-input"
								v-model="wan.netmask"
								placeholder="255.255.255.0"
								placeholder-class="fn-placeholder"
								@blur="validateWan"
							/>
						</view>
						<view v-if="wanErrors.netmask" class="fn-err-msg">{{ wanErrors.netmask }}</view>

						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.gateway') }}</text>
							<input
								class="fn-input"
								v-model="wan.gateway"
								placeholder="请输入网关地址"
								placeholder-class="fn-placeholder"
								@blur="validateWan"
							/>
						</view>
						<view v-if="wanErrors.gateway" class="fn-err-msg">{{ wanErrors.gateway }}</view>

						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.dns1') }}</text>
							<input
								class="fn-input"
								v-model="wan.dns1"
								placeholder="可留空"
								placeholder-class="fn-placeholder"
							/>
						</view>

						<view class="fn-row fn-row-last">
							<text class="fn-label" :class="{ 'fn-label-disabled': !wan.dns1 }">{{ $t('fwx_network.dns2') }}</text>
							<input
								class="fn-input"
								v-model="wan.dns2"
								:disabled="!wan.dns1"
								placeholder="可留空"
								placeholder-class="fn-placeholder"
							/>
						</view>
					</template>

					<!-- pppoe fields -->
					<template v-if="wan.proto === 'pppoe'">
						<view class="fn-row">
							<text class="fn-label">{{ $t('fwx_network.pppoe_username') }}</text>
							<input
								class="fn-input"
								v-model="wan.username"
								placeholder="请输入账号"
								placeholder-class="fn-placeholder"
								@blur="validateWan"
							/>
						</view>
						<view v-if="wanErrors.username" class="fn-err-msg">{{ wanErrors.username }}</view>

						<view class="fn-row fn-row-last">
							<text class="fn-label">{{ $t('fwx_network.pppoe_password') }}</text>
							<input
								class="fn-input"
								v-model="wan.password"
								:password="!showWanPwd"
								placeholder="请输入密码"
								placeholder-class="fn-placeholder"
								@blur="validateWan"
							/>
							<uni-icons
								:type="showWanPwd ? 'eye-slash-filled' : 'eye-filled'"
								size="20"
								color="#c7c7cc"
								class="fn-eye-btn"
								@click="showWanPwd = !showWanPwd"
							></uni-icons>
						</view>
						<view v-if="wanErrors.password" class="fn-err-msg">{{ wanErrors.password }}</view>
					</template>

					<!-- dhcp tip -->
					<view v-if="wan.proto === 'dhcp'" class="fn-info-tip fn-row-last">
						<text class="fn-info-text">{{ $t('fwx_network.tip_wan_dhcp') }}</text>
					</view>
				</view>

				<view class="fn-save-wrap">
					<view class="fn-save-btn" :class="{ 'fn-save-btn-loading': wanLoading }" @click="saveWan">
						<text v-if="!wanLoading" class="fn-save-text">{{ $t('fwx_common.save') }}</text>
						<view v-else class="fn-spin"></view>
					</view>
				</view>
			</view>

			<view style="height: 160rpx;"></view>
		</scroll-view>

		<!-- LAN 更新覆盖层 -->
		<view v-if="lanUpdating" class="fn-overlay">
			<view class="fn-overlay-card">
				<view class="fn-overlay-spin"></view>
				<text class="fn-overlay-title">{{ $t('fwx_network.overlay_title') }}</text>
				<text class="fn-overlay-sub">{{ $t('fwx_network.overlay_sub') }}</text>
				<view class="fn-overlay-bar-wrap">
					<view class="fn-overlay-bar" :style="{ width: lanProgressPct + '%' }"></view>
				</view>
				<text class="fn-overlay-count">{{ $t('fwx_network.overlay_countdown', { n: lanCountdown }) }}</text>
			</view>
		</view>

		<fwx-tab-bar :current="3" />
	</view>
</template>

<script>
import FwxTabBar from '@/components/fwxTabBar.vue'
import DeviceManager from '@/utils/deviceManager.js'

const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$/
function isValidIp(ip) {
	if (!IP_RE.test(ip)) return false
	return ip.split('.').every(n => +n >= 0 && +n <= 255)
}

const LEASE_VALS   = [10, 15, 30, 45, 60, 120, 180, 240, 300, 360, 480, 720, 1440, 2880, 4320, 10080]
const LEASE_LABELS = ['10 分钟','15 分钟','30 分钟','45 分钟','1 小时','2 小时','3 小时','4 小时','5 小时','6 小时','8 小时','12 小时','1 天','2 天','3 天','7 天']

export default {
	components: { FwxTabBar },

	data() {
		return {
			device: null,
			ubusUrl: '',
			pageTab: 0,

			// 工作模式
			workMode: 0,
			modeLoading: false,

			// LAN
			lan: {
				proto: 'static',
				ipaddr: '', netmask: '255.255.255.0', gateway: '',
				dns1: '', dns2: '',
				dhcp: { enable: true, start: 100, limit: 150, leasetime: 720 }
			},
			lanErrors: { ipaddr: '', netmask: '' },
			leaseIndex: 11,
			lanLoading: false,
			lanUpdating: false,
			lanCountdown: 60,
			_lanTimer: null,

			// WAN
			wan: {
				proto: 'dhcp',
				ipaddr: '', netmask: '255.255.255.0', gateway: '',
				dns1: '', dns2: '',
				username: '', password: ''
			},
			wanErrors: { ipaddr: '', netmask: '', gateway: '', username: '', password: '' },
			showWanPwd: false,
			wanLoading: false,

			loaded: [false, false, false]
		}
	},

	computed: {
		pageTabs() {
			return [
				this.$t('fwx_network.tab_mode'),
				this.$t('fwx_network.tab_lan'),
				this.$t('fwx_network.tab_wan')
			]
		},
		lanProtoLabels() {
			return [this.$t('fwx_network.proto_static'), this.$t('fwx_network.proto_dhcp')]
		},
		wanProtoLabels() {
			return [this.$t('fwx_network.proto_dhcp'), this.$t('fwx_network.proto_static'), this.$t('fwx_network.proto_pppoe')]
		},
		leaseLabels() {
			const keys = ['lease_10min','lease_15min','lease_30min','lease_45min','lease_1h','lease_2h','lease_3h','lease_4h','lease_5h','lease_6h','lease_8h','lease_12h','lease_1d','lease_2d','lease_3d','lease_7d']
			return keys.map(k => this.$t('fwx_network.' + k))
		},
		lanProtoIndex() {
			return this.lan.proto === 'static' ? 0 : 1
		},
		wanProtoIndex() {
			return { dhcp: 0, static: 1, pppoe: 2 }[this.wan.proto] ?? 0
		},
		lanProgressPct() {
			return Math.round((60 - this.lanCountdown) / 60 * 100)
		}
	},

	onShow() {
		const device = DeviceManager.getCurrentDevice()
		if (!device) return
		this.device = device
		const protocol = device.useHttps ? 'https' : 'http'
		const host = DeviceManager.formatHostForUrl(device.ip)
		this.ubusUrl = `${protocol}://${host}:${device.port}/ubus`
		if (!this.loaded[this.pageTab]) {
			this.loadTab(this.pageTab)
		}
	},

	onHide() {
		this._clearLanTimer()
	},

	onUnload() {
		this._clearLanTimer()
	},

	methods: {
		switchTab(i) {
			this.pageTab = i
			if (!this.loaded[i]) this.loadTab(i)
		},

		loadTab(i) {
			if (i === 0) this.fetchWorkMode()
			else if (i === 1) this.fetchLan()
			else if (i === 2) this.fetchWan()
		},

		async ubus(api, data = {}) {
			const session = this.device?.sysauth || '00000000000000000000000000000000'
			const res = await uni.request({
				url: this.ubusUrl,
				method: 'POST',
				header: { 'Content-Type': 'application/json' },
				data: {
					jsonrpc: '2.0', id: 1, method: 'call',
					params: [session, 'fwx', 'common', { api, CopyRight: 'www.fanchmwrt.com', data }]
				},
				timeout: 10000
			})
			const payload = res?.data?.result?.[1]
			return (payload && payload.data) ? payload.data : payload
		},

		// ── 工作模式 ─────────────────────────────────
		async fetchWorkMode() {
			try {
				const d = await this.ubus('get_work_mode')
				if (d) this.workMode = d.work_mode ?? 0
			} catch (e) {}
			this.$set(this.loaded, 0, true)
		},

		async saveWorkMode() {
			if (this.modeLoading) return
			this.modeLoading = true
			try {
				await this.ubus('set_work_mode', { work_mode: this.workMode })
				uni.showToast({ title: this.$t('fwx_common.save_success'), icon: 'success', duration: 1500 })
			} catch (e) {
				uni.showToast({ title: this.$t('fwx_common.save_failed'), icon: 'none', duration: 2000 })
			} finally {
				this.modeLoading = false
			}
		},

		// ── LAN ──────────────────────────────────────
		async fetchLan() {
			try {
				const d = await this.ubus('get_lan_info')
				if (d) {
					this.lan.proto   = d.proto   || 'static'
					this.lan.ipaddr  = d.ipaddr  || ''
					this.lan.netmask = d.netmask || '255.255.255.0'
					this.lan.gateway = d.gateway || ''
					this.lan.dns1    = d.dns1    || ''
					this.lan.dns2    = d.dns2    || ''
					if (d.dhcp) {
						this.lan.dhcp.enable    = !!d.dhcp.enable
						this.lan.dhcp.start     = d.dhcp.start    ?? 100
						this.lan.dhcp.limit     = d.dhcp.limit    ?? 150
						this.lan.dhcp.leasetime = d.dhcp.leasetime ?? 720
					}
					this.leaseIndex = this._closestLeaseIndex(this.lan.dhcp.leasetime)
				}
			} catch (e) {}
			this.$set(this.loaded, 1, true)
		},

		onLanProtoChange(idx) {
			this.lan.proto = +idx === 0 ? 'static' : 'dhcp'
			this.lanErrors = { ipaddr: '', netmask: '' }
		},

		validateLan() {
			let ok = true
			this.lanErrors = { ipaddr: '', netmask: '' }
			if (this.lan.proto === 'static') {
				if (!this.lan.ipaddr) {
					this.lanErrors.ipaddr = this.$t('fwx_network.err_ip_required'); ok = false
				} else if (!isValidIp(this.lan.ipaddr)) {
					this.lanErrors.ipaddr = this.$t('fwx_network.err_ip_invalid'); ok = false
				}
				if (!this.lan.netmask) {
					this.lanErrors.netmask = this.$t('fwx_network.err_mask_required'); ok = false
				} else if (!isValidIp(this.lan.netmask)) {
					this.lanErrors.netmask = this.$t('fwx_network.err_mask_invalid'); ok = false
				}
			}
			return ok
		},

		saveLan() {
			if (this.lanLoading || this.lanUpdating) return
			if (!this.validateLan()) return
			uni.showModal({
				title: this.$t('fwx_network.confirm_title'),
				content: this.$t('fwx_network.confirm_content'),
				confirmText: this.$t('fwx_common.confirm'),
				cancelText: this.$t('fwx_common.cancel'),
				success: res => { if (res.confirm) this._doSaveLan() }
			})
		},

		_doSaveLan() {
			this.lanLoading = true
			const payload = {
				proto: this.lan.proto, ipaddr: this.lan.ipaddr,
				netmask: this.lan.netmask, gateway: this.lan.gateway,
				dns1: this.lan.dns1, dns2: this.lan.dns2,
				dhcp: {
					enable: this.lan.dhcp.enable, start: this.lan.dhcp.start,
					limit: this.lan.dhcp.limit, leasetime: LEASE_VALS[this.leaseIndex]
				}
			}
			const session = this.device?.sysauth || '00000000000000000000000000000000'
			uni.request({
				url: this.ubusUrl, method: 'POST',
				header: { 'Content-Type': 'application/json' },
				data: {
					jsonrpc: '2.0', id: 1, method: 'call',
					params: [session, 'fwx', 'common', { api: 'set_lan_info', CopyRight: 'www.fanchmwrt.com', data: payload }]
				},
				timeout: 5000
			}).catch(() => {})
			this.lanLoading = false
			this._startLanCountdown()
		},

		_startLanCountdown() {
			this.lanCountdown = 60
			this.lanUpdating  = true
			this._clearLanTimer()
			this._lanTimer = setInterval(() => {
				this.lanCountdown--
				if (this.lanCountdown <= 0) {
					this._clearLanTimer()
					this.lanUpdating = false
					uni.showToast({ title: this.$t('fwx_network.config_applied'), icon: 'success', duration: 1500 })
					this.$set(this.loaded, 1, false)
					this.fetchLan()
				}
			}, 1000)
		},

		_clearLanTimer() {
			if (this._lanTimer) { clearInterval(this._lanTimer); this._lanTimer = null }
		},

		_closestLeaseIndex(val) {
			let best = 0, bestDiff = Infinity
			LEASE_VALS.forEach((v, i) => {
				const d = Math.abs(v - val)
				if (d < bestDiff) { bestDiff = d; best = i }
			})
			return best
		},

		// ── WAN ──────────────────────────────────────
		async fetchWan() {
			try {
				const d = await this.ubus('get_wan_info')
				if (d) {
					this.wan.proto    = d.proto    || 'dhcp'
					this.wan.ipaddr   = d.ipaddr   || ''
					this.wan.netmask  = d.netmask  || '255.255.255.0'
					this.wan.gateway  = d.gateway  || ''
					this.wan.dns1     = d.dns1     || ''
					this.wan.dns2     = d.dns2     || ''
					this.wan.username = d.username || ''
					this.wan.password = d.password || ''
				}
			} catch (e) {}
			this.$set(this.loaded, 2, true)
		},

		onWanProtoChange(idx) {
			this.wan.proto = ['dhcp', 'static', 'pppoe'][+idx] || 'dhcp'
			this.wanErrors = { ipaddr: '', netmask: '', gateway: '', username: '', password: '' }
		},

		validateWan() {
			let ok = true
			this.wanErrors = { ipaddr: '', netmask: '', gateway: '', username: '', password: '' }
			if (this.wan.proto === 'static') {
				if (!this.wan.ipaddr) {
					this.wanErrors.ipaddr = this.$t('fwx_network.err_ip_required'); ok = false
				} else if (!isValidIp(this.wan.ipaddr)) {
					this.wanErrors.ipaddr = this.$t('fwx_network.err_ip_invalid'); ok = false
				}
				if (!this.wan.netmask) {
					this.wanErrors.netmask = this.$t('fwx_network.err_mask_required'); ok = false
				} else if (!isValidIp(this.wan.netmask)) {
					this.wanErrors.netmask = this.$t('fwx_network.err_mask_invalid'); ok = false
				}
				if (!this.wan.gateway) {
					this.wanErrors.gateway = this.$t('fwx_network.err_gw_required'); ok = false
				} else if (!isValidIp(this.wan.gateway)) {
					this.wanErrors.gateway = this.$t('fwx_network.err_gw_invalid'); ok = false
				}
			}
			if (this.wan.proto === 'pppoe') {
				if (!this.wan.username.trim()) { this.wanErrors.username = this.$t('fwx_network.err_user_required'); ok = false }
				if (!this.wan.password)        { this.wanErrors.password = this.$t('fwx_network.err_pwd_required'); ok = false }
			}
			return ok
		},

		async saveWan() {
			if (this.wanLoading) return
			if (!this.validateWan()) return
			this.wanLoading = true
			try {
				const payload = { proto: this.wan.proto }
				if (this.wan.proto === 'static') {
					Object.assign(payload, {
						ipaddr: this.wan.ipaddr, netmask: this.wan.netmask,
						gateway: this.wan.gateway, dns1: this.wan.dns1, dns2: this.wan.dns2
					})
				} else if (this.wan.proto === 'pppoe') {
					Object.assign(payload, { username: this.wan.username, password: this.wan.password })
				}
				await this.ubus('set_wan_info', payload)
				uni.showToast({ title: this.$t('fwx_common.save_success'), icon: 'success', duration: 1500 })
			} catch (e) {
				uni.showToast({ title: this.$t('fwx_common.save_failed'), icon: 'none', duration: 2000 })
			} finally {
				this.wanLoading = false
			}
		}
	}
}
</script>

<style scoped>
.fn-page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }

/* nav */
.fn-nav       { display: flex; align-items: center; justify-content: space-between; padding: 88rpx 32rpx 20rpx; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.fn-nav-title { font-size: 28rpx; font-weight: 500; color: #1c1c1e; flex: 1; text-align: center; }

/* page tabs */
.fn-tabs-bar { display: flex; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.fn-tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 20rpx 0 16rpx; position: relative; }
.fn-tab-item.fn-tab-active::after { content: ''; position: absolute; bottom: 0; left: 25%; right: 25%; height: 4rpx; background: #007AFF; border-radius: 2rpx; }
.fn-tab-text { font-size: 26rpx; color: #8e8e93; }
.fn-tab-text-active { color: #007AFF; font-weight: 500; }

/* scroll container */
.fn-scroll { background: #F2F2F7; }

/* layout */
.fn-section { padding: 24rpx 24rpx 0; display: flex; flex-direction: column; gap: 20rpx; }
.fn-card    { background: #ffffff; border-radius: 16rpx; overflow: hidden; }
.fn-card-title { font-size: 22rpx; font-weight: 600; color: #8e8e93; letter-spacing: 1rpx; padding: 24rpx 28rpx 8rpx; }

/* form rows */
.fn-row      { display: flex; align-items: center; padding: 22rpx 28rpx; border-bottom: 1rpx solid rgba(0,0,0,0.05); }
.fn-row-last { border-bottom: none; }
.fn-label    { font-size: 28rpx; color: #1c1c1e; min-width: 160rpx; flex-shrink: 0; }
.fn-label-disabled { color: #c7c7cc; }
.fn-input    { flex: 1; font-size: 28rpx; color: #1c1c1e; text-align: right; border: none; outline: none; background: transparent; }
.fn-placeholder { color: #c7c7cc; }

/* picker */
.fn-picker-val { display: flex; align-items: center; gap: 8rpx; }
.fn-val-text   { font-size: 28rpx; color: #1c1c1e; }
.fn-arrow      { font-size: 32rpx; color: #c7c7cc; line-height: 1; }

/* error + tip */
.fn-err-msg  { font-size: 22rpx; color: #ef4444; padding: 0 28rpx 12rpx; margin-top: -6rpx; }
.fn-info-tip { padding: 20rpx 28rpx; }
.fn-info-text { font-size: 24rpx; color: #8e8e93; line-height: 1.6; }

/* toggle switch */
.fn-toggle     { width: 96rpx; height: 56rpx; border-radius: 28rpx; background: #e5e5ea; position: relative; transition: background 0.2s; margin-left: auto; }
.fn-toggle-on  { background: #34c759; }
.fn-toggle-knob { position: absolute; top: 4rpx; left: 4rpx; width: 48rpx; height: 48rpx; border-radius: 24rpx; background: #ffffff; box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.18); transition: left 0.2s; }
.fn-toggle-on .fn-toggle-knob { left: 44rpx; }

/* work mode card */
.fn-mode-group { display: flex; gap: 20rpx; padding: 16rpx 24rpx 24rpx; }
.fn-mode-btn   { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10rpx; padding: 28rpx 16rpx; border-radius: 16rpx; border: 2rpx solid #e5e5ea; background: #f9f9f9; }
.fn-mode-btn-active { border-color: #007AFF; background: #f0f6ff; }
.fn-mode-icon-wrap  { width: 72rpx; height: 72rpx; border-radius: 36rpx; background: #e5e5ea; display: flex; align-items: center; justify-content: center; }
.fn-mode-icon-active { background: #007AFF; }
.fn-mode-icon  { font-size: 36rpx; color: #ffffff; }
.fn-mode-label { font-size: 28rpx; font-weight: 600; color: #1c1c1e; }
.fn-mode-desc  { font-size: 22rpx; color: #8e8e93; text-align: center; }

/* bypass warning */
.fn-warn-box  { margin: 0 24rpx 24rpx; background: #fffbeb; border: 1rpx solid #fde68a; border-radius: 12rpx; padding: 20rpx; }
.fn-warn-row  { display: flex; align-items: flex-start; gap: 10rpx; }
.fn-warn-icon { font-size: 26rpx; color: #d97706; flex-shrink: 0; }
.fn-warn-text { font-size: 24rpx; color: #92400e; line-height: 1.6; }

/* save button */
.fn-save-wrap     { padding: 8rpx 0 4rpx; }
.fn-save-btn      { background: #007AFF; border-radius: 16rpx; height: 88rpx; display: flex; align-items: center; justify-content: center; }
.fn-save-btn-loading { opacity: 0.6; }
.fn-save-text     { font-size: 30rpx; font-weight: 600; color: #ffffff; }
.fn-spin          { width: 40rpx; height: 40rpx; border-radius: 20rpx; border: 4rpx solid rgba(255,255,255,0.3); border-top-color: #ffffff; animation: fn-rotate 0.7s linear infinite; }

.fn-eye-btn { padding-left: 16rpx; flex-shrink: 0; }

/* LAN updating overlay */
.fn-overlay      { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.fn-overlay-card { background: #ffffff; border-radius: 24rpx; padding: 56rpx 48rpx; width: 560rpx; display: flex; flex-direction: column; align-items: center; gap: 20rpx; }
.fn-overlay-spin { width: 72rpx; height: 72rpx; border-radius: 36rpx; border: 6rpx solid #e5e5ea; border-top-color: #007AFF; animation: fn-rotate 0.8s linear infinite; }
.fn-overlay-title { font-size: 32rpx; font-weight: 600; color: #1c1c1e; }
.fn-overlay-sub  { font-size: 24rpx; color: #8e8e93; text-align: center; line-height: 1.6; }
.fn-overlay-bar-wrap { width: 100%; height: 8rpx; background: #e5e5ea; border-radius: 4rpx; overflow: hidden; margin-top: 4rpx; }
.fn-overlay-bar  { height: 100%; background: #007AFF; border-radius: 4rpx; transition: width 1s linear; }
.fn-overlay-count { font-size: 26rpx; color: #8e8e93; }

@keyframes fn-rotate { to { transform: rotate(360deg); } }
</style>
