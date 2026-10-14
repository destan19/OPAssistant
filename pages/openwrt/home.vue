<template>
	<view class="container">
	
		<view v-if="loading" class="loading-overlay">
			<view class="loading-content">
				<view class="loading-spinner"></view>
				<text class="loading-text">{{ $t('home.loading') }}</text>
			</view>
		</view>

		<view class="nav-header">
			<view class="back-btn" @click="goBack">
				<image class="back-icon" src="/static/back.png" mode="widthFix" style="width: 34rpx; height: 34rpx;" />
			</view>
			<text class="nav-title">{{ truncatedModel || $t('home.openwrt_device') }}</text>
			<view style="width: 60rpx;"></view>
		</view>
		<scroll-view class="content-scroll" scroll-y="true" show-scrollbar="false">
		<view class="hw-inner">
		<view class="device-card">
			<view class="device-header">
				<text class="card-title">{{ $t('home.system_status') }}</text>
			</view>
			<view class="device-details">
				<view class="detail-row">
					<text class="detail-label">{{ $t('home.hostname') }}:</text>
					<text class="detail-value">{{ systemStatus.hostname || '--' }}</text>
				</view>
				<view class="detail-row" v-if="truncatedVersion">
					<text class="detail-label">{{ $t('home.version_info') }}:</text>
					<text class="detail-value">{{ truncatedVersion }}</text>
				</view>
				<view class="detail-row">
					<text class="detail-label">{{ $t('home.architecture') }}:</text>
					<text class="detail-value">{{ truncatedArchitecture }}</text>
				</view>
				<view class="detail-row">
					<text class="detail-label">{{ $t('home.target_platform') }}:</text>
					<text class="detail-value">{{ systemStatus.target || '--' }}</text>
				</view>
				<view class="detail-row" v-if="systemStatus.temperature && systemStatus.temperature !== '--'">
					<text class="detail-label">{{ $t('home.temperature') }}:</text>
					<text class="detail-value temperature-value">{{ systemStatus.temperature }}</text>
				</view>
				<view class="detail-row">
					<text class="detail-label">{{ $t('home.uptime') }}:</text>
					<text class="detail-value">{{ systemStatus.uptime || '0' + $t('home.days') }}</text>
				</view>
				<view class="detail-row">
					<text class="detail-label">{{ $t('home.cpu_load') }}:</text>
					<text class="detail-value">{{ systemStatus.cpuLoad || '0.00 0.00 0.00' }}</text>
				</view>
			</view>
		</view>

		<view class="cpu-mem-card">
			<view class="card-header">
				<text class="card-title">{{ $t('home.resource_monitor') }}</text>
			</view>
			<view class="ring-row">
				<view class="ring-item">
					<view class="ring-chart-wrap">
						<l-echart ref="overlayChartRef" @finished="initOverlayChart" style="width:100%;height:100%;"></l-echart>
						<view class="ring-center">
							<text class="ring-center-title">{{ $t('home.overlay') }}</text>
							<text class="ring-center-percent">{{ overlayPercentNum }}%</text>
						</view>
					</view>
					<text class="ring-detail">{{ overlayDetail }}</text>
				</view>
				<view class="ring-item">
					<view class="ring-chart-wrap">
						<l-echart ref="memChartRef" @finished="initMemChart" style="width:100%;height:100%;"></l-echart>
						<view class="ring-center">
							<text class="ring-center-title">{{ $t('home.memory') }}</text>
							<text class="ring-center-percent">{{ systemStatus.memoryUsage || '0%' }}</text>
						</view>
					</view>
					<text class="ring-detail">{{ systemStatus.memoryDetail || '0MB / 0MB' }}</text>
				</view>
			</view>
		</view>

		<view class="quick-bandwidth-card" v-if="quickBandwidthDevice">
			<view class="quick-bandwidth-header">
				<view class="quick-bandwidth-title-wrap">
					<text class="card-title">流量统计（{{ quickBandwidthDisplayName }}）</text>
				</view>
				<view class="quick-bandwidth-metrics">
					<view class="quick-bandwidth-metric quick-bandwidth-metric-down">
						<text class="quick-bandwidth-arrow">&#8595;</text>
						<text class="quick-bandwidth-metric-value">{{ formatBandwidth(quickRxRate) }}</text>
					</view>
					<view class="quick-bandwidth-metric quick-bandwidth-metric-up">
						<text class="quick-bandwidth-arrow">&#8593;</text>
						<text class="quick-bandwidth-metric-value">{{ formatBandwidth(quickTxRate) }}</text>
					</view>
				</view>
			</view>
			<view class="quick-bandwidth-chart">
				<l-echart ref="quickBandwidthChartRef" @finished="initQuickBandwidthChart"></l-echart>
			</view>
		</view>

		<!-- Port Status Card -->
		<view class="port-card" v-if="physicalPorts.length > 0">
			<view class="card-header">
				<text class="card-title">网口状态</text>
			</view>
			<view class="port-grid">
				<view
					v-for="port in physicalPorts"
					:key="port.name"
					class="port-item"
					@click="showPortDetail(port)"
				>
					<image
						class="port-icon-img"
						:class="port.carrier ? 'port-icon-up' : 'port-icon-down'"
						src="/static/ethernet-port.svg"
						mode="aspectFit"
					/>
					<text class="port-label" :class="port.carrier ? 'port-label-up' : 'port-label-down'">{{ port.label }}</text>
				</view>
			</view>
		</view>

		<view class="network-card">
			<view class="card-header">
				<text class="card-title">{{ $t('home.network_status') }}</text>
			</view>
			<view class="network-details">
				<view class="detail-row">
					<text class="detail-label">{{ $t('home.wan_ip') }}:</text>
					<text class="detail-value">{{ networkStatus.wanIp || '--' }}</text>
				</view>
				<view class="detail-row">
					<text class="detail-label">{{ $t('home.lan_ip') }}:</text>
					<text class="detail-value">{{ networkStatus.lanIp || '--' }}</text>
				</view>
				<view class="detail-row">
							<text class="detail-label">{{ $t('home.gateway') }}:</text>
					<text class="detail-value">{{ networkStatus.gateway || '--' }}</text>
				</view>
				<view class="detail-row">
					<text class="detail-label">{{ $t('home.dns') }}:</text>
					<text class="detail-value">{{ networkStatus.dns || '--' }}</text>
				</view>
				<view class="detail-row">
					<text class="detail-label">{{ $t('home.connections') }}:</text>
					<text class="detail-value">{{ systemStatus.connectionsDetail || '0 / 0' }}</text>
				</view>
			</view>
		</view>

		<view class="disk-card" v-if="diskInfo.length > 0">
			<view class="card-header">
				<text class="card-title">{{ $t('home.disk_status') }}</text>
			</view>
			<view class="disk-list">
				<view class="disk-item" v-for="(disk, index) in diskInfo" :key="index">
					<view class="disk-info">
						<text class="disk-mount">{{ diskMountDisplay(disk) }}<text v-if="disk.mount === '/tmp' && disk.device !== 'tmpfs'" class="disk-temp-label"> {{ $t('home.temp_space') }}</text></text>
					</view>
					<view class="disk-usage">
						<text class="disk-usage-line">{{ disk.usedSize }} / {{ disk.totalSize }} ({{ disk.usagePercent }}%)</text>
						<view class="disk-progress-bar">
							<view class="disk-progress-fill" :style="{width: disk.usagePercent + '%'}"></view>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- website link -->
		<view class="footer-link" @click="openWebsite">
			<text class="footer-text">www.openappfilter.com</text>
		</view>
		</view>
		</scroll-view>

		<!-- Port detail bottom sheet -->
		<view v-if="portDetailVisible" class="port-modal-mask" @click="hidePortDetail">
			<view class="port-modal-panel" @click.stop>
				<view class="port-modal-header">
					<view class="port-modal-status-dot" :class="selectedPort && selectedPort.carrier ? 'status-dot-up' : 'status-dot-down'"></view>
					<text class="port-modal-title">{{ selectedPort && selectedPort.label }}</text>
					<text class="port-modal-status" :style="selectedPort && selectedPort.carrier ? {color: '#34c759'} : {color: '#8e8e93'}">
						{{ selectedPort && selectedPort.carrier ? '已连接' : '未连接' }}
					</text>
				</view>
				<view v-if="selectedPort" class="port-modal-rows">
					<view class="port-modal-row">
						<text class="port-modal-label">MAC 地址</text>
						<text class="port-modal-value">{{ selectedPort.mac }}</text>
					</view>
					<view class="port-modal-row">
						<text class="port-modal-label">速率</text>
						<text class="port-modal-value">{{ formatSpeed(selectedPort.speed) }}</text>
					</view>
					<view class="port-modal-row">
						<text class="port-modal-label">双工模式</text>
						<text class="port-modal-value">{{ formatDuplex(selectedPort.duplex) }}</text>
					</view>
					<view class="port-modal-row">
						<text class="port-modal-label">接收数据包</text>
						<text class="port-modal-value">{{ formatPackets(selectedPort.stats.rx_packets) }}</text>
					</view>
					<view class="port-modal-row">
						<text class="port-modal-label">发送数据包</text>
						<text class="port-modal-value">{{ formatPackets(selectedPort.stats.tx_packets) }}</text>
					</view>
					<view class="port-modal-row">
						<text class="port-modal-label">接收流量</text>
						<text class="port-modal-value">{{ formatBytes(selectedPort.stats.rx_bytes) }}</text>
					</view>
					<view class="port-modal-row">
						<text class="port-modal-label">发送流量</text>
						<text class="port-modal-value">{{ formatBytes(selectedPort.stats.tx_bytes) }}</text>
					</view>
					<view class="port-modal-row" v-if="selectedPort.stats.rx_errors > 0 || selectedPort.stats.tx_errors > 0">
						<text class="port-modal-label">错误包</text>
						<text class="port-modal-value port-modal-value-error">RX {{ selectedPort.stats.rx_errors }} / TX {{ selectedPort.stats.tx_errors }}</text>
					</view>
				</view>
				<view class="port-modal-close-btn" @click="hidePortDetail">
					<text class="port-modal-close-text">关闭</text>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'
import * as echarts from '@/uni_modules/lime-echart/static/echarts.min.js'

export default {
	data() {
		return {
			_overlayChartInstance: null,
			_memChartInstance: null,
			_quickBandwidthChartInstance: null,
			loading: false,
			isFirstLoad: true, 
			timer: null,
			url: '/ubus',
			session: '',
			deviceInfo: {
				model: '',
				version: '',
				cpu: '',
				kernel: ''
			},
			systemStatus: {
				cpuUsage: '0%',
				cpuLoad: '0.00 0.00 0.00',
				memoryUsage: '0%',
				memoryDetail: '0MB / 0MB',
				memoryCache: '0MB',
				memoryCacheDetail: '0MB / 0MB',
				memoryCachePercent: '0%',
				hostname: '--',
				architecture: '--',
				target: '--',
				kernel: '--',
				temperature: '--',
				localtime: '--',
				uptime: '0' + this.$t('home.days'),
				onlineUsers: '0',
				connections: '0',
				connectionsDetail: '0 / 0',
				connectionsPercent: '0%'
			},
			networkStatus: {
				wanIp: '--',
				lanIp: '--',
				gateway: '--',
				dns: '--'
			},
			diskInfo: [],
			physicalPorts: [],
			portDetailVisible: false,
			selectedPort: null,
			quickBandwidthDevice: '',
			quickBandwidthSource: '',
			quickRxRate: 0,
			quickTxRate: 0,
			quickBandwidthChartData: {
				timestamps: [],
				rxRates: [],
				txRates: []
			}
		}
	},
	computed: {
		truncatedModel() {
			const model = this.deviceInfo.model || this.$t('home.openwrt_device')
			return model.length > 20 ? model.substring(0, 20) + '...' : model
		},
		truncatedVersion() {
			const version = this.deviceInfo.version || this.$t('home.version_info')
			return version.length > 24 ? version.substring(0, 24) + '...' : version
		},
		truncatedArchitecture() {
			const arch = this.systemStatus.architecture || '--'
			return arch.length > 32 ? arch.substring(0, 32) + '...' : arch
		},
		overlayDisk() {
			return this.diskInfo.find(d => d.mount === '/overlay') || null
		},
		overlayPercentNum() {
			const d = this.overlayDisk
			return d ? Math.min(100, Math.max(0, d.usagePercent)) : 0
		},
		overlayDetail() {
			const d = this.overlayDisk
			return d ? `${d.usedSize} / ${d.totalSize}` : '0MB / 0MB'
		},
		memPercentNum() {
			const s = (this.systemStatus.memoryUsage || '0%').toString()
			const n = parseInt(s.replace(/\D/g, ''), 10)
			return isNaN(n) ? 0 : Math.min(100, Math.max(0, n))
		},
		quickBandwidthDisplayName() {
			if (this.quickBandwidthSource === 'wan') {
				return 'WAN'
			}
			return 'LAN'
		}
	},
	watch: {
		overlayPercentNum() {
			this.updateOverlayChart()
		},
		memPercentNum() {
			this.updateMemChart()
		}
	},
	onLoad() {
		// FanchmWrt: if device is flagged, redirect to fanchmwrt dashboard
		const _d = DeviceManager.getCurrentDevice()
		if (_d && _d.isFanchmwrt === true) {
			uni.reLaunch({ url: '/pages/fanchmwrt/dashboard' })
			return
		}
		this.updateTabBarText()
		uni.setNavigationBarTitle({
			title: this.$t('home.title')
		})
		uni.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: '#F8F8F8'
		})
		this.deviceInfo = DeviceManager.getCurrentDevice()
		this.session = this.deviceInfo.sysauth
		const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
		const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
		this.url = `${protocol}://${formattedHost}:${this.deviceInfo.port}/ubus`
		this.loadData()
		this.startAutoRefresh()
		
		
	},
	onShow() {
		uni.setNavigationBarTitle({
			title: this.$t('home.title')
		})
		uni.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: '#F8F8F8'
		})
		this.startAutoRefresh()
	},
	
	onHide() {
		this.stopAutoRefresh()
	},
	
	onUnload() {
		this.stopAutoRefresh()
		if (this._overlayChartInstance) {
			this._overlayChartInstance.dispose()
			this._overlayChartInstance = null
		}
		if (this._memChartInstance) {
			this._memChartInstance.dispose()
			this._memChartInstance = null
		}
		if (this._quickBandwidthChartInstance) {
			this._quickBandwidthChartInstance.dispose()
			this._quickBandwidthChartInstance = null
		}
	},

	methods: {

		goBack() {
			this.stopAutoRefresh()
			uni.reLaunch({ url: DeviceManager.getEntryUrl(this.deviceInfo) })
		},

		getOverlayRingOption() {
			const percent = this.overlayPercentNum
			return {
				graphic: [],
				series: [{
					type: 'pie',
					radius: ['72%', '90%'],
					center: ['50%', '50%'],
					startAngle: 90,
					clockWise: true,
					roundCap: true,
					silent: true,
					data: [
						{ value: percent, itemStyle: { color: '#2196F3', borderRadius: 8 } },
						{ value: 100 - percent, itemStyle: { color: '#e8e8e8' } }
					],
					label: { show: false },
					labelLine: { show: false }
				}]
			}
		},

		getMemRingOption() {
			const percent = this.memPercentNum
			return {
				graphic: [],
				series: [{
					type: 'pie',
					radius: ['72%', '90%'],
					center: ['50%', '50%'],
					startAngle: 90,
					clockWise: true,
					roundCap: true,
					silent: true,
					data: [
						{ value: percent, itemStyle: { color: '#2196F3', borderRadius: 8 } },
						{ value: 100 - percent, itemStyle: { color: '#e8e8e8' } }
					],
					label: { show: false },
					labelLine: { show: false }
				}]
			}
		},

		async initOverlayChart() {
			if (!this.$refs.overlayChartRef) return
			try {
				const chart = await this.$refs.overlayChartRef.init(echarts)
				this._overlayChartInstance = chart
				this._overlayChartInstance.setOption(this.getOverlayRingOption(), false)
			} catch (e) {
				console.error('overlay chart init failed:', e)
			}
		},

		async initMemChart() {
			if (!this.$refs.memChartRef) return
			try {
				const chart = await this.$refs.memChartRef.init(echarts)
				this._memChartInstance = chart
				this._memChartInstance.setOption(this.getMemRingOption(), false)
			} catch (e) {
				console.error('mem chart init failed:', e)
			}
		},

		updateOverlayChart() {
			if (this._overlayChartInstance) {
				this._overlayChartInstance.setOption(this.getOverlayRingOption(), false)
			}
		},

		updateMemChart() {
			if (this._memChartInstance) {
				this._memChartInstance.setOption(this.getMemRingOption(), false)
			}
		},
		async initQuickBandwidthChart() {
			if (!this.$refs.quickBandwidthChartRef) return
			try {
				const chart = await this.$refs.quickBandwidthChartRef.init(echarts)
				this._quickBandwidthChartInstance = chart
				this.updateQuickBandwidthChart()
			} catch (e) {
				console.error('quick bandwidth chart init failed:', e)
			}
		},
		updateQuickBandwidthChart() {
			if (!this._quickBandwidthChartInstance) return
			this._quickBandwidthChartInstance.setOption(this.getQuickBandwidthChartOption(), false)
			this._quickBandwidthChartInstance.dispatchAction({ type: 'hideTip' })
			this._quickBandwidthChartInstance.dispatchAction({ type: 'downplay', seriesIndex: 0 })
			this._quickBandwidthChartInstance.dispatchAction({ type: 'downplay', seriesIndex: 1 })
		},
		getQuickBandwidthChartOption() {
			const timestamps = Array.isArray(this.quickBandwidthChartData.timestamps) ? this.quickBandwidthChartData.timestamps : []
			const rxRates = Array.isArray(this.quickBandwidthChartData.rxRates) ? this.quickBandwidthChartData.rxRates : []
			const txRates = Array.isArray(this.quickBandwidthChartData.txRates) ? this.quickBandwidthChartData.txRates : []
			const categories = timestamps.map(() => '')
			const allRates = [...rxRates, ...txRates]
			const maxRate = allRates.length > 0 ? Math.max(...allRates) : 0
			const axisScale = this.getQuickBandwidthAxisScale(maxRate)
			return {
				animation: false,
				tooltip: {
					trigger: 'axis',
					axisPointer: { type: 'line', lineStyle: { color: 'rgba(79,172,254,0.4)', width: 1 } },
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					borderColor: '#4facfe',
					borderWidth: 1,
					textStyle: { color: '#fff', fontSize: 12 },
					formatter: (params) => {
						const inbound = params && params[0] ? this.formatBandwidth(params[0].value) : '0 B/s'
						const outbound = params && params[1] ? this.formatBandwidth(params[1].value) : '0 B/s'
						return `${this.$t('statistics.inbound')}: ${inbound}\n${this.$t('statistics.outbound')}: ${outbound}`
					}
				},
				grid: { left: '0px', right: '8px', bottom: '12px', top: '10px', containLabel: false },
				xAxis: {
					type: 'category',
					boundaryGap: false,
					data: categories,
					axisLabel: { show: false },
					axisTick: { show: false },
					axisLine: { lineStyle: { color: '#e5e7eb' } },
					splitLine: { show: false }
				},
				yAxis: {
					type: 'value',
					min: 0,
					max: axisScale.max,
					interval: axisScale.interval,
					splitNumber: 5,
					axisLabel: { show: false },
					splitLine: { show: false },
					axisLine: { show: false },
					axisTick: { show: false }
				},
				series: [
					{
						name: this.$t('statistics.inbound'),
						type: 'line',
						data: rxRates,
						smooth: true,
						showSymbol: false,
						symbol: 'none',
						animation: false,
						lineStyle: { color: '#4facfe', width: 1.2 },
						areaStyle: {
							color: {
								type: 'linear',
								x: 0,
								y: 0,
								x2: 0,
								y2: 1,
								colorStops: [
									{ offset: 0, color: 'rgba(79, 172, 254, 0.28)' },
									{ offset: 1, color: 'rgba(79, 172, 254, 0.06)' }
								]
							}
						}
					},
					{
						name: this.$t('statistics.outbound'),
						type: 'line',
						data: txRates,
						smooth: true,
						showSymbol: false,
						symbol: 'none',
						animation: false,
						lineStyle: { color: '#00c4cc', width: 1.2 },
						areaStyle: {
							color: {
								type: 'linear',
								x: 0,
								y: 0,
								x2: 0,
								y2: 1,
								colorStops: [
									{ offset: 0, color: 'rgba(0, 196, 204, 0.24)' },
									{ offset: 1, color: 'rgba(0, 196, 204, 0.05)' }
								]
							}
						}
					}
				]
			}
		},
		getQuickBandwidthAxisScale(maxRate) {
			const KB = 1024
			const safeMax = Number(maxRate) > 0 ? Number(maxRate) : 0
			const paddedMax = Math.max(safeMax * 1.1, 10 * KB)
			const rawInterval = paddedMax / 5
			const base = paddedMax < 100 * KB ? 10 * KB : 100 * KB
			const interval = Math.max(base, Math.ceil(rawInterval / base) * base)
			const max = interval * 5
			return { max, interval }
		},
		formatQuickBandwidthAxis(bytesPerSecond) {
			if (!bytesPerSecond || bytesPerSecond < 0) return '0'
			const KB = 1024
			const kbValue = bytesPerSecond / KB
			if (kbValue >= 1000) {
				const mbValue = kbValue / 1000
				return `${mbValue.toFixed(mbValue >= 10 ? 0 : 1)} MB/s`
			}
			return this.formatBandwidth(bytesPerSecond)
		},
		formatChartTime(timestamp) {
			const date = new Date(Number(timestamp || 0) * 1000)
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			const seconds = String(date.getSeconds()).padStart(2, '0')
			return `${hours}:${minutes}:${seconds}`
		},
		
		// Open website
		openWebsite() {
			uni.showModal({
				title: this.$t('home.open_website'),
				content: this.$t('home.open_website_confirm'),
				success: (res) => {
					if (res.confirm) {
						// Open website in browser
						plus.runtime.openURL('https://www.openappfilter.com')
					}
				}
			})
		},
		
	updateTabBarText() {
      	uni.setTabBarItem({ index: 0, text: this.$t('tabbar.home') })
		uni.setTabBarItem({ index: 1, text: this.$t('tabbar.statistics') })
		uni.setTabBarItem({ index: 2, text: this.$t('tabbar.clients') })
		uni.setTabBarItem({ index: 3, text: this.$t('tabbar.network') })
		uni.setTabBarItem({ index: 4, text: this.$t('tabbar.apps') })
    },


		loadData() {
	
			if (this.isFirstLoad) {
				this.loading = true
			}
			this.fetchAllStatusData()
		},

	
		fetchAllStatusData() {
			uni.request({
				method: "POST",
				url: this.url,
				timeout: 3000,
				data: [
					{
						jsonrpc: "2.0",
						id: 1,
						method: "call",
						params: [this.session, "system", "board", {}]
					},
					{
						jsonrpc: "2.0",
						id: 2,
						method: "call",
						params: [this.session, "system", "info", {}]
					},
					{
						jsonrpc: "2.0",
						id: 3,
						method: "call",
						params: [this.session, "luci", "getCPUUsage", {}]
					},
					{
						jsonrpc: "2.0",
						id: 4,
						method: "call",
						params: [this.session, "luci", "getOnlineUsers", {}]
					},
					{
						jsonrpc: "2.0",
						id: 5,
						method: "call",
						params: [this.session, "file", "read", {path: "/proc/sys/net/netfilter/nf_conntrack_count"}]
					},
					{
						jsonrpc: "2.0",
						id: 6,
						method: "call",
						params: [this.session, "file", "read", {path: "/proc/sys/net/netfilter/nf_conntrack_max"}]
					},
					{
						jsonrpc: "2.0",
						id: 7,
						method: "call",
						params: [this.session, "network.interface", "dump", {}]
					},
					{
						jsonrpc: "2.0",
						id: 8,
						method: "call",
						params: [this.session, "luci", "getTempInfo", {}]
					},
					{
						jsonrpc: "2.0",
						id: 9,
						method: "call",
						params: [this.session, "luci", "getMountPoints", {}]
					},
					{
						jsonrpc: "2.0",
						id: 10,
						method: "call",
						params: [this.session, "luci-rpc", "getBoardJSON", {}]
					},
					{
						jsonrpc: "2.0",
						id: 11,
						method: "call",
						params: [this.session, "luci-rpc", "getNetworkDevices", {}]
					}
				],
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				success: (res) => {
	
					this.processAllStatusData(res.data)
				},
				fail: (err) => {
					console.error('data error:', err)
					this.loading = false
				}
			})
		},

	
		processAllStatusData(dataArray) {
			if (!Array.isArray(dataArray)) {
				console.error('data format error')
				this.loading = false
				return
			}

			const deviceInfoRes = dataArray[0]
			if (deviceInfoRes && deviceInfoRes.result && deviceInfoRes.result[1]) {
				const data = deviceInfoRes.result[1]
				const dist = (data.release && data.release.distribution) ? data.release.distribution : 'OpenWrt'
				const ver = (data.release && data.release.version) ? data.release.version : ''
				const kern = data.kernel || '--'
				const versionStr = ver ? `${dist} ${ver}(${kern})` : `${dist} (${kern})`
				this.deviceInfo = {
						model: data.model || this.$t('home.openwrt'),
					version: versionStr.trim() || this.$t('home.version_info'),
					cpu: data.system || '--',
					kernel: data.kernel || '--'
				}
				
			
				this.systemStatus.hostname = data.hostname || '--'
				this.systemStatus.architecture = data.system || '--'
				this.systemStatus.kernel = data.kernel || '--'
	
				if (data.release && data.release.target) {
					this.systemStatus.target = data.release.target
				}
			}


			const systemInfoRes = dataArray[1]
			if (systemInfoRes && systemInfoRes.result && systemInfoRes.result[1]) {
				const data = systemInfoRes.result[1]
				
		
				const memory = data.memory
				if (memory) {
					const used = memory.total - memory.available
					const usage = Math.round((used / memory.total) * 100)
					this.systemStatus.memoryUsage = usage + '%'
		
					this.systemStatus.memoryDetail = this.formatBytes(used) + ' / ' + this.formatBytes(memory.total)
					
			
					if (memory.cached) {
						this.systemStatus.memoryCache = this.formatBytes(memory.cached)
					
						const cacheUsage = Math.round((memory.cached / memory.total) * 100)
						this.systemStatus.memoryCachePercent = cacheUsage + '%'
						this.systemStatus.memoryCacheDetail = this.formatBytes(memory.cached) + ' / ' + this.formatBytes(memory.total)
					}
				}
				
		
				if (data.load && Array.isArray(data.load) && data.load.length >= 3) {

					const load1 = (data.load[0] / 65536).toFixed(2)
					const load5 = (data.load[1] / 65536).toFixed(2)
					const load15 = (data.load[2] / 65536).toFixed(2)
					this.systemStatus.cpuLoad = `${load1} ${load5} ${load15}`
				}
				
		
				if (data.localtime) {
					const utcDate = new Date(data.localtime * 1000)
					const beijingOffset = 8 * 60 * 60 * 1000 
					const beijingDate = new Date(utcDate.getTime() - beijingOffset)
					const year = beijingDate.getFullYear()
					const month = String(beijingDate.getMonth() + 1).padStart(2, '0')
					const day = String(beijingDate.getDate()).padStart(2, '0')
					const hours = String(beijingDate.getHours()).padStart(2, '0')
					const minutes = String(beijingDate.getMinutes()).padStart(2, '0')
					const seconds = String(beijingDate.getSeconds()).padStart(2, '0')
					this.systemStatus.localtime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
				}
				
			
				if (data.uptime) {
					const days = Math.floor(data.uptime / 86400)
					const hours = Math.floor((data.uptime % 86400) / 3600)
					const minutes = Math.floor((data.uptime % 3600) / 60)
					const seconds = data.uptime % 60
					
					let uptimeStr = ''
					if (days > 0) {
						uptimeStr += days + 'd '
					}
					if (hours > 0 || days > 0) {
						uptimeStr += hours + 'h '
					}
					if (minutes > 0 || hours > 0 || days > 0) {
						uptimeStr += minutes + 'm '
					}
					uptimeStr += seconds + 's'
					
					this.systemStatus.uptime = uptimeStr
				}
			}

			const cpuRes = dataArray[2]
			console.log('[getCPUUsage] raw response:', cpuRes)
			if (cpuRes && cpuRes.result && cpuRes.result[1]) {
				const data = cpuRes.result[1]
				console.log('[getCPUUsage] result[1] data:', data)
				const raw = data.cpuusage
				let cpuUsage = '0%'
				if (raw !== undefined && raw !== null) {
					if (typeof raw === 'number') {
						const pct = Math.min(100, Math.max(0, Number.isFinite(raw) ? raw : 0))
						cpuUsage = (raw <= 1 && pct <= 1 ? Math.round(pct * 100) : Math.round(pct)) + '%'
					} else {
						const str = String(raw).trim()
						if (str.includes('CPU:') && str.includes('%')) {
							const m = str.match(/CPU:\s*([\d.]+)\s*%?/)
							if (m) cpuUsage = Math.min(100, Math.max(0, Math.round(parseFloat(m[1])))) + '%'
						} else if (str.includes('%')) {
							const m = str.match(/([\d.]+)\s*%/)
							if (m) cpuUsage = Math.min(100, Math.max(0, Math.round(parseFloat(m[1])))) + '%'
						} else {
							const n = parseFloat(str)
							if (!isNaN(n)) cpuUsage = Math.min(100, Math.max(0, n <= 1 ? Math.round(n * 100) : Math.round(n))) + '%'
						}
					}
				}
				this.systemStatus.cpuUsage = cpuUsage
			}

			const usersRes = dataArray[3]
			if (usersRes && usersRes.result && usersRes.result[1]) {
				const data = usersRes.result[1]
				this.systemStatus.onlineUsers = (data.onlineusers && data.onlineusers.trim) ? data.onlineusers.trim() : '0'
			}

			const connectionsRes = dataArray[4]
			const maxConnectionsRes = dataArray[5]
			
			if (connectionsRes && connectionsRes.result && connectionsRes.result[1]) {
				const data = connectionsRes.result[1]
				const currentConnections = parseInt((data.data && data.data.trim) ? data.data.trim() : '0')
				this.systemStatus.connections = currentConnections.toString()
				
				if (maxConnectionsRes && maxConnectionsRes.result && maxConnectionsRes.result[1]) {
					const maxData = maxConnectionsRes.result[1]
					const maxConnections = parseInt((maxData.data && maxData.data.trim) ? maxData.data.trim() : '0')
					this.systemStatus.connectionsDetail = currentConnections + ' / ' + maxConnections
					
			
					if (maxConnections > 0) {
						const usagePercent = Math.round((currentConnections / maxConnections) * 100)
						this.systemStatus.connectionsPercent = usagePercent + '%'
					} else {
						this.systemStatus.connectionsPercent = '0%'
					}
				}
			}

	
			const networkRes = dataArray[6]
			if (networkRes && networkRes.result && networkRes.result[1]) {
				const interfaces = networkRes.result[1].interface
				this.parseNetworkInterfaces(interfaces)
				const quickTarget = this.getQuickBandwidthTarget(interfaces)
				if (quickTarget && quickTarget.device) {
					if (this.quickBandwidthDevice !== quickTarget.device) {
						this.quickBandwidthChartData = {
							timestamps: [],
							rxRates: [],
							txRates: []
						}
						this.quickRxRate = 0
						this.quickTxRate = 0
						this.updateQuickBandwidthChart()
					}
					this.quickBandwidthSource = quickTarget.source
					this.quickBandwidthDevice = quickTarget.device
					this.fetchQuickBandwidthData(quickTarget.device)
				}
			}

		
			const tempRes = dataArray[7]
			if (tempRes && tempRes.result && tempRes.result[1]) {
				const data = tempRes.result[1]
				this.systemStatus.temperature = data.tempinfo || '--'
			}

	
			const diskRes = dataArray[8]
			if (diskRes && diskRes.result && diskRes.result[1] && diskRes.result[1].result) {
				const mountPoints = diskRes.result[1].result
				this.processDiskInfo(mountPoints)
			}

			const boardJsonRes = dataArray[9]
			const netDevicesRes = dataArray[10]
			const boardJson = (boardJsonRes && boardJsonRes.result && boardJsonRes.result[0] === 0)
				? boardJsonRes.result[1] : null
			const netDevs = (netDevicesRes && netDevicesRes.result && netDevicesRes.result[0] === 0)
				? netDevicesRes.result[1] : null
			if (netDevs) {
				this.processPhysicalPorts(boardJson, netDevs)
			}

			this.loading = false

			this.isFirstLoad = false
		},


		startAutoRefresh() {
		
			this.stopAutoRefresh()
	
			this.timer = setInterval(() => {
				this.loadData()
			}, 3000)
		},


		stopAutoRefresh() {
			if (this.timer) {
				clearInterval(this.timer)
				this.timer = null
			}
		},

	
		formatBytes(bytes) {
			if (bytes === 0) return '0 B'
			const k = 1024
			const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
			const i = Math.floor(Math.log(bytes) / Math.log(k))
			// Ensure index does not exceed array length
			const index = Math.min(i, sizes.length - 1)
			return parseFloat((bytes / Math.pow(k, index)).toFixed(1)) + ' ' + sizes[index]
		},

		// Truncate string to max length
		truncateString(str, maxLength = 32) {
			if (!str || str.length <= maxLength) {
				return str
			}
			return str.substring(0, maxLength) + '...'
		},
		// Limit mount display length
		diskMountDisplay(disk) {
			if (!disk) return ''
			const raw = disk.mount + ' (' + (disk.device || '') + ')'
			return this.truncateString(raw, 32)
		},

	
		parseNetworkInterfaces(interfaces) {
			if (!interfaces || !Array.isArray(interfaces)) {
				return
			}

	
			for (const iface of interfaces) {
				if (iface.interface === 'wan') {
			
					this.parseWANInterface(iface)
				} else if (iface.interface === 'lan') {
			
					this.parseLANInterface(iface)
				}
			}
		},

	
		parseWANInterface(wanData) {
			
			if (wanData['ipv4-address'] && wanData['ipv4-address'].length > 0) {
				const ipInfo = wanData['ipv4-address'][0]
				this.networkStatus.wanIp = ipInfo.address + '/' + ipInfo.mask
			}
			

			if (wanData.route && wanData.route.length > 0) {
				for (const route of wanData.route) {
					if (route.target === '0.0.0.0' && route.mask === 0) {
						this.networkStatus.gateway = route.nexthop
						break
					}
				}
			}
	
			if (wanData['dns-server'] && wanData['dns-server'].length > 0) {
				const dnsServers = []
				for (let i = 0; i < Math.min(wanData['dns-server'].length, 2); i++) {
					dnsServers.push(wanData['dns-server'][i])
				}
				this.networkStatus.dns = dnsServers.join(', ')
			}
		},


		parseLANInterface(lanData) {

			if (lanData['ipv4-address'] && lanData['ipv4-address'].length > 0) {
				const ipInfo = lanData['ipv4-address'][0]
				this.networkStatus.lanIp = ipInfo.address + '/' + ipInfo.mask
			}
		},
		getQuickBandwidthTarget(interfaces) {
			if (!Array.isArray(interfaces)) {
				return {
					device: 'br-lan',
					source: 'br-lan'
				}
			}
			const wanInterface = interfaces.find(iface => iface && iface.interface === 'wan')
			if (wanInterface) {
				return {
					device: wanInterface.l3_device || wanInterface.device || 'wan',
					source: 'wan'
				}
			}
			return {
				device: 'br-lan',
				source: 'br-lan'
			}
		},
		fetchQuickBandwidthData(device) {
			if (!device) return
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 10,
					method: 'call',
					params: [this.session, 'luci', 'getRealtimeStats', { mode: 'interface', device }]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 3000,
				success: (res) => {
					const result = res && res.data && res.data.result && res.data.result[1] ? res.data.result[1].result : null
					this.processQuickBandwidthData(result)
				},
				fail: () => {
				}
			})
		},
		processQuickBandwidthData(result) {
			if (!Array.isArray(result) || result.length < 2) return
			const timestamps = []
			const rxRates = []
			const txRates = []
			for (let i = 1; i < result.length; i++) {
				const current = result[i]
				const previous = result[i - 1]
				const timeDelta = current[0] - previous[0]
				if (timeDelta <= 0) continue
				const rxRate = Math.max(0, (current[1] - previous[1]) / timeDelta)
				const txRate = Math.max(0, (current[3] - previous[3]) / timeDelta)
				timestamps.push(current[0])
				rxRates.push(rxRate)
				txRates.push(txRate)
			}
			const maxPoints = 60
			if (timestamps.length > maxPoints) {
				timestamps.splice(0, timestamps.length - maxPoints)
				rxRates.splice(0, rxRates.length - maxPoints)
				txRates.splice(0, txRates.length - maxPoints)
			}
			this.quickBandwidthChartData = {
				timestamps,
				rxRates,
				txRates
			}
			if (rxRates.length > 0) {
				this.quickRxRate = rxRates[rxRates.length - 1]
			}
			if (txRates.length > 0) {
				this.quickTxRate = txRates[txRates.length - 1]
			}
			this.updateQuickBandwidthChart()
		},
		formatBandwidth(bytesPerSecond) {
			if (!bytesPerSecond || bytesPerSecond < 0) return '0 B/s'
			const k = 1024
			const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
			const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
			if (i === 0) {
				return Math.round(bytesPerSecond) + ' B/s'
			}
			const value = bytesPerSecond / Math.pow(k, i)
			if (i === 1) {
				return Math.round(value) + ' ' + sizes[i]
			}
			return value.toFixed(1) + ' ' + sizes[i]
		},

	
		processDiskInfo(mountPoints) {
			if (!Array.isArray(mountPoints)) {
				return
			}

			this.diskInfo = mountPoints.map(mount => {
				const totalSize = mount.size || 0
				const freeSize = mount.free || 0
				const usedSize = totalSize - freeSize
				const usagePercent = totalSize > 0 ? Math.round((usedSize / totalSize) * 100) : 0

				return {
					device: this.truncateString(mount.device || '--'),
					mount: this.truncateString(mount.mount || '--'),
					totalSize: this.formatBytes(totalSize),
					usedSize: this.formatBytes(usedSize),
					freeSize: this.formatBytes(freeSize),
					usagePercent: usagePercent
				}
			}).filter(disk => {
		
				return disk.mount !== '/' && disk.mount !== '/dev'
			}).sort((a, b) => {
		
				if (a.mount === '/overlay') return -1
				if (b.mount === '/overlay') return 1
				if (a.mount === '/tmp') return -1
				if (b.mount === '/tmp') return 1
				return 0
			})
		},

		processPhysicalPorts(boardJson, netDevs) {
			if (!netDevs) return
			let portDefs = []

			if (boardJson && boardJson.network) {
				const wanDevice = boardJson.network.wan && boardJson.network.wan.device
				const lanPorts = (boardJson.network.lan && boardJson.network.lan.ports) || []
				if (wanDevice && netDevs[wanDevice]) {
					portDefs.push({ name: wanDevice, role: 'wan', label: 'WAN' })
				}
				lanPorts.forEach((name) => {
					if (netDevs[name]) {
						portDefs.push({ name, role: 'lan', label: name })
					}
				})
			} else {
				const SKIP_TYPES = ['wlan', 'bridge']
				portDefs = Object.entries(netDevs)
					.filter(([name, dev]) => {
						if (dev.wireless) return false
						if (dev.flags && dev.flags.loopback) return false
						if (SKIP_TYPES.includes(dev.devtype)) return false
						if (name.startsWith('dummy') || name === 'lo') return false
						return dev.devtype === 'ethernet' || dev.devtype === 'dsa'
					})
					.map(([name]) => ({
						name,
						role: name.toLowerCase().includes('wan') ? 'wan' : 'lan',
						label: name.toUpperCase()
					}))
					.sort((a, b) => {
						if (a.role === 'wan' && b.role !== 'wan') return -1
						if (b.role === 'wan' && a.role !== 'wan') return 1
						return a.name.localeCompare(b.name)
					})
			}

			this.physicalPorts = portDefs.map(({ name, role, label }) => {
				const dev = netDevs[name] || {}
				const link = dev.link || {}
				const stats = dev.stats || {}
				return {
					name,
					label,
					role,
					carrier: link.carrier === true,
					up: dev.up === true,
					mac: dev.mac || '--',
					speed: (link.speed !== undefined && link.speed !== null) ? link.speed : -1,
					duplex: link.duplex || 'unknown',
					stats: {
						rx_bytes: stats.rx_bytes || 0,
						tx_bytes: stats.tx_bytes || 0,
						rx_packets: stats.rx_packets || 0,
						tx_packets: stats.tx_packets || 0,
						rx_errors: stats.rx_errors || 0,
						tx_errors: stats.tx_errors || 0
					}
				}
			})
		},

		showPortDetail(port) {
			this.selectedPort = port
			this.portDetailVisible = true
		},

		hidePortDetail() {
			this.portDetailVisible = false
			this.selectedPort = null
		},

		formatSpeed(speed) {
			if (speed === undefined || speed === null || speed < 0) return '--'
			if (speed === 0) return '--'
			if (speed >= 1000) {
				const gbps = speed / 1000
				return (Number.isInteger(gbps) ? gbps : gbps.toFixed(1)) + ' Gbps'
			}
			return speed + ' Mbps'
		},

		formatDuplex(duplex) {
			if (!duplex || duplex === 'unknown') return '--'
			if (duplex === 'full') return '全双工'
			if (duplex === 'half') return '半双工'
			return duplex
		},

		formatPackets(n) {
			const num = Number(n) || 0
			if (num < 1000) return String(num)
			if (num < 1000000) return (num / 1000).toFixed(1) + 'K'
			if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M'
			return (num / 1000000000).toFixed(1) + 'G'
		}
	}

}
</script>


<style scoped>
@import '@/styles/common.scss';

/* ── Layout ── */
.container {
	min-height: 100vh;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: #F2F2F7;
}

/* ── Nav ── */
.nav-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 88rpx 32rpx 8rpx;
	background: #ffffff;
	border-bottom: 1rpx solid rgba(0,0,0,0.06);
}
.nav-title {
	flex: 1;
	text-align: center;
	font-size: 28rpx;
	font-weight: 400;
	color: #1c1c1e;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.back-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
}

/* ── Scroll ── */
.content-scroll {
	flex: 1;
	min-height: 0;
}
.hw-inner {
	padding: 2px 16rpx 80rpx;
	box-sizing: border-box;
}

/* ── Cards (unified) ── */
.device-card,
.cpu-mem-card,
.quick-bandwidth-card,
.network-card,
.disk-card,
.port-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 28rpx 30rpx;
	margin-bottom: 5px;
	box-sizing: border-box;
}
.device-header { margin-bottom: 16rpx; }
.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}
.card-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #1c1c1e;
}

/* ── Info rows ── */
.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 14rpx 0;
	border-bottom: 1rpx solid rgba(0,0,0,0.05);
}
.detail-row:last-child { border-bottom: none; }
.detail-label {
	font-size: 26rpx;
	color: #8e8e93;
	font-weight: 400;
	flex-shrink: 0;
}
.detail-value {
	font-size: 26rpx;
	font-weight: 500;
	color: #1c1c1e;
	text-align: right;
	max-width: 60%;
	word-break: break-all;
}
.temperature-value {
	max-width: 70% !important;
	font-size: 24rpx !important;
	line-height: 1.4 !important;
}
.device-details,
.network-details {
	display: flex;
	flex-direction: column;
}

/* ── Resource ring charts ── */
.cpu-mem-card { padding-bottom: 28rpx; }
.ring-row {
	display: flex;
	justify-content: space-around;
	align-items: flex-start;
	flex-wrap: wrap;
	gap: 24rpx;
	margin-top: 16rpx;
}
.ring-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
	min-width: 180rpx;
}
.ring-chart-wrap {
	width: 160rpx;
	height: 160rpx;
	flex-shrink: 0;
	position: relative;
	overflow: hidden;
}
.ring-center {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 2;
}
.ring-center-title {
	position: absolute;
	top: 32%;
	left: 50%;
	transform: translate(-50%, -50%);
	font-size: 10px;
	font-weight: 400;
	color: #8e8e93;
	line-height: 1;
	white-space: nowrap;
}
.ring-center-percent {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	font-size: 12px;
	font-weight: 700;
	color: #1c1c1e;
	line-height: 1;
	white-space: nowrap;
}
.ring-detail {
	font-size: 22rpx;
	color: #8e8e93;
	margin-top: 12rpx;
	text-align: center;
	word-break: break-all;
}

/* ── Quick bandwidth card ── */
.quick-bandwidth-card { padding-bottom: 20rpx; }
.quick-bandwidth-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 12rpx;
	gap: 16rpx;
}
.quick-bandwidth-title-wrap {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}
.quick-bandwidth-metrics {
	display: flex;
	align-items: center;
	gap: 18rpx;
	padding-top: 2rpx;
	flex-shrink: 0;
}
.quick-bandwidth-metric {
	display: flex;
	align-items: center;
	gap: 6rpx;
}
.quick-bandwidth-metric-down { color: #4facfe; }
.quick-bandwidth-metric-up { color: #00c4cc; }
.quick-bandwidth-arrow { font-size: 24rpx; font-weight: 700; line-height: 1; }
.quick-bandwidth-metric-value { font-size: 24rpx; font-weight: 600; line-height: 1.2; }
.quick-bandwidth-chart { width: 100%; height: 255rpx; }

/* ── Disk card ── */
.disk-list { display: flex; flex-direction: column; }
.disk-item {
	padding: 14rpx 0;
	border-bottom: 1rpx solid rgba(0,0,0,0.05);
}
.disk-item:last-child { border-bottom: none; }
.disk-info { margin-bottom: 8rpx; }
.disk-mount {
	font-size: 26rpx;
	font-weight: 500;
	color: #1c1c1e;
	line-height: 1.4;
}
.disk-temp-label {
	font-size: 22rpx;
	color: #8e8e93;
	font-weight: 400;
	margin-left: 8rpx;
}
.disk-usage { display: flex; flex-direction: column; gap: 8rpx; }
.disk-usage-line {
	font-size: 24rpx;
	color: #8e8e93;
	text-align: right;
}
.disk-progress-bar {
	width: 100%;
	height: 14rpx;
	background: rgba(0,0,0,0.07);
	border-radius: 7rpx;
	overflow: hidden;
}
.disk-progress-fill {
	height: 100%;
	border-radius: 7rpx;
	background: #3b82f6;
	transition: width 0.3s ease;
}

/* ── Loading overlay ── */
.loading-overlay {
	position: fixed;
	top: 0; left: 0;
	width: 100%; height: 100%;
	background: rgba(0,0,0,0.4);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 999;
}
.loading-content {
	background: white;
	padding: 40rpx;
	border-radius: 20rpx;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-width: 300rpx;
}
.loading-spinner {
	border: 4rpx solid #e5e5e5;
	border-top: 4rpx solid #007AFF;
	border-radius: 50%;
	width: 80rpx;
	height: 80rpx;
	animation: spin 0.8s linear infinite;
}
@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}
.loading-text {
	font-size: 28rpx;
	color: #999;
	margin-top: 20rpx;
	text-align: center;
	width: 100%;
}

/* ── Footer ── */
.footer-link {
	text-align: center;
	padding: 20rpx;
	cursor: pointer;
}
.footer-link:active { opacity: 0.7; }
.footer-text {
	font-size: 26rpx;
	color: #c7c7cc;
	font-weight: 500;
}

/* ── Port Status Card ── */
.port-grid {
	display: flex;
	flex-wrap: wrap;
	margin-top: 8rpx;
}
.port-item {
	width: 20%;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16rpx 0;
	cursor: pointer;
}
.port-item:active { opacity: 0.65; }
.port-icon-img {
	width: 56rpx;
	height: 54rpx;
	margin-bottom: 10rpx;
}
.port-icon-up {
	filter: brightness(0) saturate(100%) invert(54%) sepia(80%) saturate(600%) hue-rotate(95deg) brightness(95%);
}
.port-icon-down {
	filter: brightness(0) invert(1) brightness(0.55);
}
.port-label {
	font-size: 18rpx;
	font-weight: 400;
	color: #8e8e93;
	text-align: center;
}
.port-label-up { color: #34c759; }
.port-label-down { color: #8e8e93; }

/* ── Port Detail Modal ── */
.port-modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0,0,0,0.45);
	display: flex;
	align-items: flex-end;
	z-index: 200;
}
.port-modal-panel {
	width: 100%;
	background: #f2f2f7;
	border-radius: 20rpx 20rpx 0 0;
	padding: 24rpx 0 40rpx;
	box-sizing: border-box;
}
.port-modal-header {
	display: flex;
	align-items: center;
	padding: 0 32rpx 20rpx;
	border-bottom: 1rpx solid rgba(0,0,0,0.08);
	gap: 14rpx;
}
.port-modal-status-dot {
	width: 20rpx;
	height: 20rpx;
	border-radius: 10rpx;
	flex-shrink: 0;
}
.status-dot-up { background: #34c759; }
.status-dot-down { background: #c7c7cc; }
.port-modal-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #1c1c1e;
	flex: 1;
}
.port-modal-status {
	font-size: 26rpx;
	font-weight: 500;
}
.port-modal-rows {
	background: #ffffff;
	margin: 16rpx 0 0;
}
.port-modal-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 22rpx 32rpx;
	border-bottom: 1rpx solid rgba(0,0,0,0.05);
}
.port-modal-row:last-child { border-bottom: none; }
.port-modal-label {
	font-size: 28rpx;
	color: #8e8e93;
}
.port-modal-value {
	font-size: 28rpx;
	font-weight: 500;
	color: #1c1c1e;
	text-align: right;
	max-width: 60%;
	word-break: break-all;
}
.port-modal-value-error { color: #ff3b30; }
.port-modal-close-btn {
	margin: 16rpx 32rpx 0;
	height: 96rpx;
	background: #ffffff;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}
.port-modal-close-btn:active { opacity: 0.7; }
.port-modal-close-text {
	font-size: 30rpx;
	font-weight: 500;
	color: #007aff;
}
</style> 
