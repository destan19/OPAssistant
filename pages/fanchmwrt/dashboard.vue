<template>
	<view class="fw-container">

		<!-- 顶部导航 -->
		<view class="fw-nav">
			<view class="fw-nav-back" @click="goBack">
				<image src="/static/back.png" mode="widthFix" style="width: 34rpx; height: 34rpx;" />
			</view>
			<text class="fw-nav-title">{{ deviceName }}</text>
			<view style="width: 60rpx;"></view>
		</view>

		<view v-if="loading" class="fw-loading">
			<view class="fw-loading-spinner"></view>
			<text class="fw-loading-text">{{ $t('fwx_common.loading') }}</text>
		</view>

		<scroll-view v-else class="fw-scroll" scroll-y="true" show-scrollbar="false" style="padding-bottom: calc(100rpx + env(safe-area-inset-bottom));">
			<view class="fw-inner">

				<!-- 1. 系统概况 -->
				<view class="fw-card">
					<view class="fw-card-hd">
						<text class="fw-card-title">{{ $t('fwx_dashboard.system_overview') }}</text>
						<text class="fw-card-uptime">{{ uptimeText }}</text>
					</view>
					<view class="fw-row">
						<text class="fw-lbl">{{ $t('fwx_dashboard.hostname') }}</text>
						<text class="fw-val">{{ sysData.hostname }}</text>
					</view>
					<view class="fw-row">
						<text class="fw-lbl">{{ $t('fwx_dashboard.version') }}</text>
						<text class="fw-val">{{ versionText }} ({{ sysData.kernelVersion }})</text>
					</view>
					<view class="fw-row">
						<text class="fw-lbl">{{ $t('fwx_dashboard.connections') }}</text>
						<text class="fw-val">{{ sysData.connections }}</text>
					</view>
					<view class="fw-row" v-if="sysData.cpuTemp != null">
						<text class="fw-lbl">{{ $t('fwx_dashboard.cpu_temp') }}</text>
						<text class="fw-val" :style="{ color: tempColor }">{{ sysData.cpuTemp }}°C</text>
					</view>
					<!-- CPU 进度条 -->
					<view class="fw-status-item">
						<view class="fw-status-hd">
							<text class="fw-status-name">CPU</text>
							<text class="fw-status-pct" :style="{ color: cpuColor }">{{ sysData.cpu }}%</text>
						</view>
						<view class="fw-bar-bg">
							<view class="fw-bar-fill" :style="{ width: sysData.cpu + '%', background: cpuColor }"></view>
						</view>
					</view>
					<!-- 内存进度条 -->
					<view class="fw-status-item">
						<view class="fw-status-hd">
							<text class="fw-status-name">{{ $t('fwx_dashboard.memory') }}</text>
							<text class="fw-status-pct" :style="{ color: memColor }">{{ memPercent }}% ({{ memUsedText }})</text>
						</view>
						<view class="fw-bar-bg">
							<view class="fw-bar-fill" :style="{ width: memPercent + '%', background: memColor }"></view>
						</view>
					</view>
				</view>

				<!-- 3. 活跃应用 -->
				<view class="fw-card fw-apps-card" v-if="activeApps.length > 0">
					<view class="fw-card-hd">
						<text class="fw-card-title">{{ $t('fwx_dashboard.active_apps') }}</text>
						<text class="fw-card-sub">{{ activeApps.length }} {{ $t('fwx_dashboard.apps_count_unit') }}</text>
					</view>
					<scroll-view scroll-x="true" show-scrollbar="false" class="fw-apps-scroll">
						<view class="fw-apps-row">
							<view
								class="fw-app-item"
								v-for="(app, i) in activeApps"
								:key="i"
								@click="showAppDetail(app)"
							>
								<image
									v-if="app.id && !iconErrors[app.id]"
									:src="getAppIconUrl(app.id)"
									class="fw-app-icon fw-app-icon-img"
									mode="scaleToFill"
									@error="onIconError(app.id)"
								/>
								<view v-else class="fw-app-icon" :style="{ background: appColor(app.name) }">
									<text class="fw-app-icon-text">{{ app.name.charAt(0) }}</text>
								</view>
								<text class="fw-app-name">{{ app.name }}</text>
							</view>
						</view>
					</scroll-view>
				</view>

				<!-- 4. 网络流量 -->
				<view class="fw-card fw-traffic-card">
					<view class="fw-traffic-hd">
						<text class="fw-card-title">{{ $t('fwx_dashboard.traffic') }}</text>
						<view class="fw-traffic-rates">
							<view class="fw-rate-item">
								<text class="fw-rate-arrow fw-rate-down">&#8595;</text>
								<text class="fw-rate-val">{{ formatBandwidth(currentDownRate) }}</text>
							</view>
							<view class="fw-rate-item">
								<text class="fw-rate-arrow fw-rate-up">&#8593;</text>
								<text class="fw-rate-val">{{ formatBandwidth(currentUpRate) }}</text>
							</view>
						</view>
					</view>
					<view class="fw-chart-wrap">
						<l-echart ref="trafficChartRef" @finished="initTrafficChart"></l-echart>
					</view>
				</view>

				<!-- 5. 网络状态 -->
				<view class="fw-card">
					<view class="fw-card-hd">
						<text class="fw-card-title">{{ $t('fwx_dashboard.net_status') }}</text>
						<view class="fw-badge" :style="{ background: internetBadgeBg }">
							<text class="fw-badge-text" :style="{ color: internetTextColor }">{{ internetText }}</text>
						</view>
					</view>
					<view class="fw-row">
						<text class="fw-lbl">{{ $t('fwx_dashboard.wan_ip') }}</text>
						<text class="fw-val">{{ netData.wanIp }}</text>
					</view>
					<view class="fw-row">
						<text class="fw-lbl">{{ $t('fwx_dashboard.gateway') }}</text>
						<text class="fw-val">{{ netData.wanGateway }}</text>
					</view>
					<view class="fw-row">
						<text class="fw-lbl">{{ $t('fwx_dashboard.dns') }}</text>
						<text class="fw-val">{{ netData.wanDns }}</text>
					</view>
					<view class="fw-row">
						<text class="fw-lbl">{{ $t('fwx_dashboard.lan_ip') }}</text>
						<text class="fw-val">{{ netData.lanIp }}</text>
					</view>
					<view class="fw-row fw-row-last">
						<text class="fw-lbl">{{ $t('fwx_dashboard.netmask') }}</text>
						<text class="fw-val">{{ netData.lanMask }}</text>
					</view>
				</view>

				<!-- 6. 活跃网址 -->
				<view class="fw-card">
					<view class="fw-card-hd">
						<text class="fw-card-title">{{ $t('fwx_dashboard.active_urls') }}</text>
					</view>
					<view v-if="activeUrls.length > 0">
						<view
							class="fw-url-row"
							v-for="(item, i) in activeUrls"
							:key="i"
							:class="{ 'fw-row-last': i === activeUrls.length - 1 }"
						>
							<text class="fw-url-user" :style="{ color: item.userColor }">{{ item.userName || $t('fwx_dashboard.unknown_user') }}: </text>
							<text class="fw-url-text">{{ item.url }}</text>
						</view>
					</view>
					<view v-else class="fw-url-empty">
						<text class="fw-url-empty-text">{{ $t('fwx_dashboard.no_active_url') }}</text>
					</view>
				</view>

				<view style="height: 60rpx;"></view>
			</view>
		</scroll-view>

		<fwx-tab-bar :current="0" />

		<!-- 应用详情弹窗（1秒自动关闭） -->
		<view v-if="appDetail" class="fw-popup-mask" @click.self="closeAppDetail">
			<view class="fw-popup">
				<view class="fw-popup-hd">
					<image
						v-if="appDetail.id && !iconErrors[appDetail.id]"
						:src="getAppIconUrl(appDetail.id)"
						class="fw-app-icon fw-popup-icon fw-app-icon-img"
						mode="scaleToFill"
						@error="onIconError(appDetail.id)"
					/>
					<view v-else class="fw-app-icon fw-popup-icon" :style="{ background: appColor(appDetail.name) }">
						<text class="fw-app-icon-text">{{ appDetail.name.charAt(0) }}</text>
					</view>
					<text class="fw-popup-title">{{ appDetail.name }}</text>
				</view>
				<view class="fw-popup-body" v-if="appDetail.connections && appDetail.connections.length">
					<view class="fw-popup-row">
						<text class="fw-popup-lbl">{{ $t('fwx_dashboard.popup_user') }}</text>
						<text class="fw-popup-val">{{ formatConnUser(appDetail.connections[0]) }}</text>
					</view>
					<view class="fw-popup-row" v-if="appDetail.connections[0].timestamp">
						<text class="fw-popup-lbl">{{ $t('fwx_dashboard.popup_time') }}</text>
						<text class="fw-popup-val">{{ formatTimestamp(appDetail.connections[0].timestamp) }}</text>
					</view>
					<view class="fw-popup-row" v-if="appDetail.connections[0].src_ip">
						<text class="fw-popup-lbl">{{ $t('fwx_dashboard.popup_src_ip') }}</text>
						<text class="fw-popup-val">{{ appDetail.connections[0].src_ip }}</text>
					</view>
					<view class="fw-popup-row" v-if="appDetail.connections[0].dst_ip">
						<text class="fw-popup-lbl">{{ $t('fwx_dashboard.popup_dst_ip') }}</text>
						<text class="fw-popup-val">{{ appDetail.connections[0].dst_ip }}{{ appDetail.connections[0].dst_port ? ':' + appDetail.connections[0].dst_port : '' }}</text>
					</view>
					<view class="fw-popup-row" v-if="appDetail.connections[0].protocol">
						<text class="fw-popup-lbl">{{ $t('fwx_dashboard.popup_protocol') }}</text>
						<text class="fw-popup-val">{{ appDetail.connections[0].protocol }}</text>
					</view>
					<view class="fw-popup-row" v-if="appDetail.connections[0].src_port">
						<text class="fw-popup-lbl">{{ $t('fwx_dashboard.popup_src_port') }}</text>
						<text class="fw-popup-val">{{ appDetail.connections[0].src_port }}</text>
					</view>
					<view class="fw-popup-row" v-if="appDetail.connections[0].domain">
						<text class="fw-popup-lbl">{{ $t('fwx_dashboard.popup_domain') }}</text>
						<text class="fw-popup-val">{{ appDetail.connections[0].domain }}</text>
					</view>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'
import { getFanchmwrtAppIconUrl } from '@/utils/fanchmwrtAppIcon.js'
import * as echarts from '@/uni_modules/lime-echart/static/echarts.min.js'
import FwxTabBar from '@/components/fwxTabBar.vue'

const APP_COLORS = [
	'#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
	'#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1'
]

export default {
	components: { FwxTabBar },
	data() {
		return {
			loading: true,
			device: null,
			ubusUrl: '',
			refreshTimer: null,
			_trafficChartInstance: null,
			sysData: {
				model: '--', hostname: '--', kernelVersion: '--',
				openwrtVersion: '', fwxVersion: '', releaseDate: '', releaseType: 0,
				arch: '', cpuModelName: '--',
				uptime: 0, cpu: 0, totalMem: 0, usedMem: 0,
				connections: 0, clientNum: 0, cpuTemp: null
			},
			netData: {
				internet: -1,
				wanIp: '--', wanGateway: '--', wanDns: '--',
				lanIp: '--', lanMask: '--'
			},
			rawAppList: [],
		iconErrors: {},
	
			trafficChartData: { rxRates: [], txRates: [] },
			currentUpRate: 0,
			currentDownRate: 0,
			appDetail: null,
			_detailTimer: null
		}
	},

	computed: {
		deviceName() {
			const isX86 = this.sysData.arch === 'x86-64' || this.sysData.arch === 'x86_64'
			const model = isX86 ? this.sysData.cpuModelName : this.sysData.model
			const nickname = (this.device && this.device.name) ? this.device.name : ''
			if (!model || model === '--') return nickname || 'FanchmWrt'
			const MODEL_MAX = 20
			const displayModel = model.length > MODEL_MAX ? model.substring(0, MODEL_MAX) + '…' : model
			const truncated = model.length > MODEL_MAX
			if (!truncated && nickname && (displayModel.length + nickname.length + 3) <= 30) {
				return `${displayModel} (${nickname})`
			}
			return displayModel
		},
		memPercent() {
			if (!this.sysData.totalMem) return 0
			return Math.min(100, Math.round(this.sysData.usedMem / this.sysData.totalMem * 100))
		},
		memUsedText() {
			const used = Math.round(this.sysData.usedMem / 1024)
			return `${used} MB`
		},
		versionText() {
			const ss = this.sysData
			let owVer = ss.openwrtVersion
			if (owVer === 'SNAPSHOT' && ss.releaseDate) owVer = 's' + ss.releaseDate
			let ver = ''
			if (owVer && ss.fwxVersion) ver = owVer + '-' + ss.fwxVersion
			else if (owVer) ver = owVer
			else if (ss.fwxVersion) ver = ss.fwxVersion
			else ver = '--'
			if (ver !== '--') {
				if (ss.releaseType === 1) ver += '_alpha'
				else if (ss.releaseType === 2) ver += '_beta'
			}
			return ver
		},
		uptimeText() {
			const s = Number(this.sysData.uptime) || 0
			if (!s) return '--'
			const d = Math.floor(s / 86400)
			const h = Math.floor((s % 86400) / 3600)
			const m = Math.floor((s % 3600) / 60)
			const D = this.$t('fwx_dashboard.day')
			const H = this.$t('fwx_dashboard.hour')
			const M = this.$t('fwx_dashboard.minute')
			let t = ''
			if (d > 0) {
				t = `${d}${D}`
				if (h > 0) t += `${h}${H}`
			} else if (h > 0) {
				t = `${h}${H}`
				if (m > 0) t += `${m}${M}`
			} else {
				t = `${m}${M}`
			}
			return `${this.$t('fwx_dashboard.uptime_prefix')}${t})`
		},
		cpuColor() {
			const c = this.sysData.cpu
			return c >= 85 ? '#ef4444' : c >= 60 ? '#f97316' : '#3b82f6'
		},
		memColor() {
			const p = this.memPercent
			return p >= 85 ? '#ef4444' : p >= 70 ? '#f97316' : '#10b981'
		},
		tempColor() {
			const t = this.sysData.cpuTemp
			if (t == null) return '#333'
			return t >= 80 ? '#ef4444' : t >= 60 ? '#f97316' : '#10b981'
		},
		internetText() {
			const map = {
				0: this.$t('fwx_dashboard.internet_connected'),
				1: this.$t('fwx_dashboard.internet_disconnected'),
				2: this.$t('fwx_dashboard.internet_no_cable'),
				3: this.$t('fwx_dashboard.internet_pppoe_failed')
			}
			return map[this.netData.internet] !== undefined ? map[this.netData.internet] : '--'
		},
		internetBadgeBg() {
			const map = { 0: '#dcfce7', 1: '#fee2e2', 2: '#f3f4f6', 3: '#ffedd5' }
			return map[this.netData.internet] || '#f3f4f6'
		},
		internetTextColor() {
			const map = { 0: '#16a34a', 1: '#dc2626', 2: '#6b7280', 3: '#ea580c' }
			return map[this.netData.internet] || '#6b7280'
		},
		// 去重后的活跃应用列表（按 id 去重，保留各自所有连接）
		activeApps() {
			const map = {}
			for (const item of this.rawAppList) {
				if (!item.name) continue
				if (!map[item.id]) {
					map[item.id] = { id: item.id, name: item.name, connections: [] }
				}
				map[item.id].connections.push(item)
			}
			return Object.values(map)
		},
		// 活跃网址 top5（去重，携带用户信息用于彩色显示）
		activeUrls() {
			const USER_COLORS = ['#38bdf8', '#f97316', '#c084fc', '#ec4899', '#84cc16']
			const seen = new Set()
			const result = []
			for (const item of this.rawAppList) {
				const url = item.domain || item.uri
				if (!url || seen.has(url)) continue
				seen.add(url)
				const mac = item.mac || ''
				let hash = 0
				for (let i = 0; i < mac.length; i++) hash = ((hash * 31) + mac.charCodeAt(i)) >>> 0
				const userColor = USER_COLORS[hash % USER_COLORS.length]
				const userName = (item.nickname || item.hostname || '').trim()
				result.push({ url, userName, userColor })
				if (result.length >= 5) break
			}
			return result
		}
	},

	onLoad() {
		console.log('[FWX Dashboard] onLoad')
		this.device = DeviceManager.getCurrentDevice()
		if (!this.device) {
			const fallback = DeviceManager.getEntryUrl()
			console.warn('[FWX Dashboard] no current device, back to', fallback)
			uni.reLaunch({ url: fallback })
			return
		}
		const protocol = this.device.useHttps ? 'https' : 'http'
		const host = DeviceManager.formatHostForUrl(this.device.ip)
		this.ubusUrl = `${protocol}://${host}:${this.device.port}/ubus`
		console.log('[FWX Dashboard] device:', this.device.name, '| ubusUrl:', this.ubusUrl)
		this.fetchData(false)
	},

	onShow() { this.startTimer() },
	onHide() { this.stopTimer() },
	onUnload() {
		this.stopTimer()
		if (this._trafficChartInstance) { this._trafficChartInstance.dispose(); this._trafficChartInstance = null }
	},

	methods: {
		goBack() {
			uni.reLaunch({ url: DeviceManager.getEntryUrl(this.device) })
		},

		startTimer() {
			this.stopTimer()
			this.refreshTimer = setInterval(() => this.fetchData(true), 3000)
		},
		stopTimer() {
			if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null }
		},

		fetchData(silent) {
			const reqData = {
				jsonrpc: '2.0', id: 1, method: 'call',
				params: [this.device.sysauth, 'fwx', 'common', { api: 'get_dashboard_common', CopyRight: 'www.fanchmwrt.com', data: {} }]
			}
			if (!silent) {
				console.log('[FWX Dashboard] POST', this.ubusUrl)
				console.log('[FWX Dashboard] request params:', JSON.stringify(reqData.params))
			}
			uni.request({
				url: this.ubusUrl,
				method: 'POST',
				header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
				data: reqData,
				timeout: 5000,
				success: (res) => {
					console.log('[FWX Dashboard] response status:', res.statusCode)
					console.log('[FWX Dashboard] response data:', JSON.stringify(res.data))
					if (res.data && res.data.result && res.data.result[0] === 0 && res.data.result[1]) {
						this.parseData(res.data.result[1])
					} else {
						console.warn('[FWX Dashboard] unexpected result code:', res.data && res.data.result && res.data.result[0])
					}
					this.loading = false
				},
				fail: (err) => {
					console.error('[FWX Dashboard] request failed:', JSON.stringify(err))
					this.loading = false
				}
			})
		},

		saveOafStatus(systemStatus) {
			const hasOaf = Object.prototype.hasOwnProperty.call(systemStatus, 'oaf')
			const oaf = hasOaf ? systemStatus.oaf : null
			console.log('[FWX Dashboard] system_status.oaf:', oaf, '| exists:', hasOaf, '| type:', typeof oaf)

			const currentDevice = DeviceManager.getCurrentDevice()
			const deviceBase = currentDevice && this.device && currentDevice.id === this.device.id
				? currentDevice
				: this.device
			if (!deviceBase || JSON.stringify(deviceBase.oaf) === JSON.stringify(oaf)) return

			this.device = { ...deviceBase, oaf }
			this.iconErrors = {}
			DeviceManager.setCurrentDevice(this.device)
			if (this.device.id) DeviceManager.updateDeviceById(this.device.id, { oaf })
			console.log('[FWX Dashboard] stored device.oaf:', this.device.oaf)
		},

		parseData(payload) {
			// result[1] 格式: { code: 2000, data: { system_status, network_status, ... } }
			const data = (payload && payload.data) ? payload.data : payload

			const ss = data.system_status || {}
			console.log('[FWX Dashboard] system_status keys:', Object.keys(ss).join(', '))
			this.saveOafStatus(ss)
			console.log('[FWX Dashboard] mem fields — total_mem:', ss.total_mem, 'used_mem:', ss.used_mem, 'free_mem:', ss.free_mem)
			console.log('[FWX Dashboard] version fields — openwrt_version:', ss.openwrt_version, 'fwx_version:', ss.fwx_version, 'release_date:', ss.release_date, 'release_type:', ss.release_type)
			this.sysData = {
				model: ss.model || '--',
				hostname: ss.hostname || '--',
				kernelVersion: ss.kernel_version || '--',
				openwrtVersion: ss.openwrt_version || '',
				fwxVersion: ss.fwx_version || '',
				releaseDate: ss.release_date || '',
				releaseType: parseInt(ss.release_type) || 0,
				arch: ss.arch || '',
				cpuModelName: ss.cpu_model_name || '--',
				uptime: ss.uptime || 0,
				cpu: Math.min(100, parseInt(ss.cpu) || 0),
				totalMem: ss.total_mem || 0,
				usedMem: ss.used_mem || 0,
				connections: ss.connections || 0,
				clientNum: ss.client_num || 0,
				cpuTemp: ss.cpu_temp != null ? Number(ss.cpu_temp) : null
			}

			const ns = data.network_status || {}
			const wanDns = ns.wan && ns.wan.dns
			this.netData = {
				internet: ns.internet != null ? Number(ns.internet) : -1,
				wanIp: (ns.wan && ns.wan.ip) || '--',
				wanGateway: (ns.wan && ns.wan.gateway) || '--',
				wanDns: Array.isArray(wanDns) ? (wanDns[0] || '--') : (wanDns || '--'),
				lanIp: (ns.lan && ns.lan.ip) || '--',
				lanMask: (ns.lan && ns.lan.mask) || '--'
			}

			const aa = data.active_app || {}
			this.rawAppList = Array.isArray(aa.list) ? aa.list : (Array.isArray(aa) ? aa : [])

			// 流量图
			const trafficData = data.interface_traffic
			if (trafficData) {
				const t = Array.isArray(trafficData) ? trafficData[0] : trafficData
				const samples = (t && t.traffic) || []
				// traffic[] 从旧到新，取最后一项作为当前速率
				const latest = samples[samples.length - 1] || {}
				this.currentUpRate = Number(latest.up) || 0
				this.currentDownRate = Number(latest.down) || 0
				// 直接用后台全量数据替换，不再手动累积
				this.trafficChartData = {
					rxRates: samples.map(s => Number(s.down) || 0),
					txRates: samples.map(s => Number(s.up) || 0)
				}
				this.updateTrafficChart()
			}
		},

		showAppDetail(app) {
			if (this._detailTimer) { clearTimeout(this._detailTimer); this._detailTimer = null }
			this.appDetail = app
			this._detailTimer = setTimeout(() => { this.appDetail = null; this._detailTimer = null }, 1000)
		},
		closeAppDetail() {
			if (this._detailTimer) { clearTimeout(this._detailTimer); this._detailTimer = null }
			this.appDetail = null
		},
		formatConnUser(conn) {
			const name = (conn.nickname || conn.hostname || '').trim()
			const mac = (conn.mac || '').trim()
			if (name) return mac ? `${name} (${mac})` : name
			return mac || conn.src_ip || '--'
		},
		formatTimestamp(ts) {
			if (!ts) return '--'
			const d = new Date(Number(ts) * 1000)
			const p = n => String(n).padStart(2, '0')
			return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
		},

		getAppIconUrl(appId) {
			return getFanchmwrtAppIconUrl(this.device, appId)
		},
		onIconError(appId) {
			this.$set(this.iconErrors, appId, true)
		},

		appColor(name) {
			let hash = 0
			for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
			return APP_COLORS[Math.abs(hash) % APP_COLORS.length]
		},

		// --- 流量图（与 home.vue quick-bandwidth 保持一致） ---
		async initTrafficChart() {
			if (!this.$refs.trafficChartRef) return
			try {
				const chart = await this.$refs.trafficChartRef.init(echarts)
				this._trafficChartInstance = chart
				this.updateTrafficChart()
			} catch (e) {
				console.error('[FWX Dashboard] traffic chart init failed:', e)
			}
		},
		updateTrafficChart() {
			if (!this._trafficChartInstance) return
			this._trafficChartInstance.setOption(this.getTrafficChartOption(), false)
			this._trafficChartInstance.dispatchAction({ type: 'hideTip' })
			this._trafficChartInstance.dispatchAction({ type: 'downplay', seriesIndex: 0 })
			this._trafficChartInstance.dispatchAction({ type: 'downplay', seriesIndex: 1 })
		},
		getTrafficChartOption() {
			const rxRates = Array.isArray(this.trafficChartData.rxRates) ? this.trafficChartData.rxRates : []
			const txRates = Array.isArray(this.trafficChartData.txRates) ? this.trafficChartData.txRates : []
			const categories = rxRates.map(() => '')
			const maxRate = Math.max(...rxRates, ...txRates, 0)
			const axisScale = this.getAxisScale(maxRate)
			return {
				animation: false,
				tooltip: {
					trigger: 'axis',
					axisPointer: { type: 'line', lineStyle: { color: 'rgba(79,172,254,0.4)', width: 1 } },
					backgroundColor: 'rgba(0,0,0,0.8)',
					borderColor: '#4facfe',
					borderWidth: 1,
					textStyle: { color: '#fff', fontSize: 12 },
					formatter: (params) => {
						const down = params[0] ? this.formatBandwidth(params[0].value) : '0 B/s'
						const up = params[1] ? this.formatBandwidth(params[1].value) : '0 B/s'
						return `${this.$t('fwx_dashboard.chart_download')}: ${down}\n${this.$t('fwx_dashboard.chart_upload')}: ${up}`
					}
				},
				grid: { left: '0px', right: '8px', bottom: '12px', top: '10px', containLabel: false },
				xAxis: {
					type: 'category', boundaryGap: false, data: categories,
					axisLabel: { show: false },
					axisTick: { show: true, length: 4, lineStyle: { color: '#cbd5e1' } },
					axisLine: { lineStyle: { color: '#e5e7eb' } },
					splitLine: { show: false }
				},
				yAxis: {
					type: 'value', min: 0, max: axisScale.max, interval: axisScale.interval,
					splitNumber: 5,
					axisLabel: { show: false },
					splitLine: { show: false },
					axisLine: { show: false },
					axisTick: { show: false }
				},
				series: [
					{
						name: this.$t('fwx_dashboard.chart_download'), type: 'line', data: rxRates, smooth: true, showSymbol: false, symbol: 'none', animation: false,
						lineStyle: { color: '#4facfe', width: 1.2 },
						areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(79,172,254,0.28)' }, { offset: 1, color: 'rgba(79,172,254,0.06)' }] } }
					},
					{
						name: this.$t('fwx_dashboard.chart_upload'), type: 'line', data: txRates, smooth: true, showSymbol: false, symbol: 'none', animation: false,
						lineStyle: { color: '#00c4cc', width: 1.2 },
						areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,196,204,0.24)' }, { offset: 1, color: 'rgba(0,196,204,0.05)' }] } }
					}
				]
			}
		},
		getAxisScale(maxRate) {
			const paddedMax = Math.max(Number(maxRate) * 1.15, 1024)
			return { max: paddedMax, interval: paddedMax / 4 }
		},
		formatAxisLabel(v) {
			if (!v || v < 0) return '0'
			const KB = 1024, MB = KB * 1024
			if (v >= MB) return (v / MB).toFixed(v >= 10 * MB ? 0 : 1) + ' MB/s'
			if (v >= KB) return (v / KB).toFixed(1) + ' KB/s'
			return v + ' B/s'
		},
		formatBandwidth(b) {
			if (!b || b <= 0) return '0 B/s'
			const KB = 1024, MB = KB * 1024, GB = MB * 1024
			if (b >= GB) return (b / GB).toFixed(2) + ' GB/s'
			if (b >= MB) return (b / MB).toFixed(1) + ' MB/s'
			if (b >= KB) return (b / KB).toFixed(1) + ' KB/s'
			return Math.round(b) + ' B/s'
		}
	}
}
</script>

<style scoped>
.fw-container {
	min-height: 100vh;
	background: #F2F2F7;
	display: flex;
	flex-direction: column;
}

/* 顶部导航 */
.fw-nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 88rpx 32rpx 20rpx;
	background: #ffffff;
	border-bottom: 1rpx solid rgba(0,0,0,0.06);
}
.fw-nav-back {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
}
.fw-nav-title {
	font-size: 28rpx;
	font-weight: 400;
	color: #1c1c1e;
	flex: 1;
	text-align: center;
}

/* 加载 */
.fw-loading {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}
.fw-loading-spinner {
	width: 60rpx;
	height: 60rpx;
	border: 4rpx solid #e5e5e5;
	border-top-color: #007AFF;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
	margin-bottom: 20rpx;
}
@keyframes spin { to { transform: rotate(360deg); } }
.fw-loading-text { font-size: 28rpx; color: #999; }

/* scroll-view 不加 padding，用内部 wrapper 控制间距 */
.fw-scroll { flex: 1; }
.fw-inner { padding: 20rpx 24rpx 0; box-sizing: border-box; }

/* 通用卡片 */
.fw-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 28rpx 30rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
}

.fw-card-hd {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}
.fw-card-title { font-size: 30rpx; font-weight: 700; color: #1c1c1e; }
.fw-card-sub { font-size: 24rpx; color: #8e8e93; }
.fw-card-uptime { font-size: 22rpx; color: #8e8e93; }

/* 信息行 */
.fw-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14rpx 0;
	border-bottom: 1rpx solid rgba(0,0,0,0.05);
}
.fw-row-last { border-bottom: none; }
.fw-lbl { font-size: 26rpx; color: #8e8e93; min-width: 140rpx; flex-shrink: 0; }
.fw-val {
	font-size: 26rpx;
	color: #1c1c1e;
	font-weight: 500;
	flex: 1;
	text-align: right;
	word-break: break-all;
}

/* 进度条（CPU / 内存） */
.fw-status-item { margin: 16rpx 0 8rpx; }
.fw-status-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.fw-status-name { font-size: 26rpx; color: #3c3c43; font-weight: 600; }
.fw-status-pct { font-size: 26rpx; font-weight: 700; }
.fw-bar-bg { height: 14rpx; background: rgba(0,0,0,0.07); border-radius: 7rpx; overflow: hidden; }
.fw-bar-fill { height: 100%; border-radius: 7rpx; transition: width 0.4s ease; }
.fw-status-detail { font-size: 22rpx; color: #8e8e93; display: block; margin-top: 8rpx; }

/* 活跃应用 */
.fw-apps-card { padding-bottom: 24rpx; }
.fw-apps-scroll { white-space: nowrap; }
.fw-apps-row { display: inline-flex; flex-direction: row; gap: 32rpx; padding: 4rpx 0; }
.fw-app-item {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
	min-width: 80rpx;
}
.fw-app-item:active { opacity: 0.7; }
.fw-app-icon {
	width: 60rpx;
	height: 60rpx;
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.fw-app-icon-img { width: 60rpx; height: 60rpx; border-radius: 14rpx; display: block; flex-shrink: 0; }
.fw-popup-icon-img { width: 72rpx; height: 72rpx; border-radius: 18rpx; }
.fw-app-icon-text { font-size: 24rpx; color: #fff; font-weight: 700; }
.fw-popup-icon .fw-app-icon-text { font-size: 28rpx; }
.fw-app-name {
	font-size: 22rpx;
	color: #3c3c43;
	text-align: center;
	max-width: 90rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 活跃网址 */
.fw-url-row {
	display: flex;
	align-items: center;
	padding: 14rpx 0;
	border-bottom: 1rpx solid rgba(0,0,0,0.05);
	gap: 0;
	overflow: hidden;
}
.fw-url-user {
	font-size: 24rpx;
	font-weight: 600;
	flex-shrink: 0;
	max-width: 200rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.fw-url-text {
	font-size: 24rpx;
	color: #3b82f6;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.fw-url-empty { padding: 20rpx 0 8rpx; }
.fw-url-empty-text { font-size: 26rpx; color: #c7c7cc; }

/* WAN 流量 */
.fw-traffic-card { padding-bottom: 20rpx; }
.fw-traffic-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.fw-traffic-rates { display: flex; gap: 24rpx; }
.fw-rate-item { display: flex; align-items: center; gap: 6rpx; }
.fw-rate-arrow { font-size: 28rpx; font-weight: 700; }
.fw-rate-down { color: #4facfe; }
.fw-rate-up { color: #00c4cc; }
.fw-rate-val { font-size: 26rpx; font-weight: 600; color: #1c1c1e; }
.fw-chart-wrap { height: 220rpx; }

/* 网络状态 badge */
.fw-badge { padding: 6rpx 20rpx; border-radius: 20rpx; }
.fw-badge-text { font-size: 24rpx; font-weight: 600; }

/* 应用详情弹窗 */
.fw-popup-mask {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.4);
	display: flex;
	align-items: flex-end;
	z-index: 999;
}
.fw-popup {
	background: #ffffff;
	border-radius: 24rpx 24rpx 0 0;
	padding: 32rpx 30rpx 60rpx;
	width: 100%;
	box-sizing: border-box;
	max-height: 70vh;
	overflow-y: auto;
}
.fw-popup-hd {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 28rpx;
}
.fw-popup-icon { width: 72rpx; height: 72rpx; border-radius: 18rpx; flex-shrink: 0; }
.fw-popup-title { font-size: 34rpx; font-weight: 700; color: #1c1c1e; }
.fw-popup-body { display: flex; flex-direction: column; gap: 0; }
.fw-popup-row {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	padding: 12rpx 0;
	border-bottom: 1rpx solid rgba(0,0,0,0.05);
	gap: 16rpx;
}
.fw-popup-row:last-child { border-bottom: none; }
.fw-popup-lbl { font-size: 24rpx; color: #8e8e93; flex-shrink: 0; min-width: 120rpx; }
.fw-popup-val { font-size: 26rpx; color: #1c1c1e; font-weight: 500; flex: 1; text-align: right; word-break: break-all; }
</style>
