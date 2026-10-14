<template>
  <view class="st-container">
    <page-tab v-model="currentTab" :tabs="tab_list" style="padding-left: 24rpx;" />

    <!-- ── Bandwidth Tab ── -->
    <scroll-view v-if="currentTab === 0" class="st-scroll" scroll-y="true" show-scrollbar="false">
      <view class="st-inner">

        <!-- Interface selector -->
        <view class="st-card">
          <view class="st-card-hd">
            <text class="st-card-title">{{ $t('statistics.select_interface') }}</text>
          </view>
          <view class="st-iface-list">
            <view
              v-for="(device, index) in deviceList"
              :key="index"
              :class="['st-iface-item', selectedDevice === device.name ? 'active' : '']"
              @click="selectDevice(device.name)"
            >{{ device.name }}</view>
          </view>
        </view>

        <!-- Bandwidth stats + chart -->
        <view v-if="selectedDevice && bandwidthData" class="st-card">
          <!-- Current speed -->
          <view class="st-speed-row">
            <view class="st-speed-item">
              <text class="st-arrow st-down">&#8595;</text>
              <text class="st-speed-val st-down-val">{{ formatBandwidth(currentRxRate) }}</text>
            </view>
            <view class="st-speed-divider"></view>
            <view class="st-speed-item">
              <text class="st-arrow st-up">&#8593;</text>
              <text class="st-speed-val st-up-val">{{ formatBandwidth(currentTxRate) }}</text>
            </view>
          </view>

          <!-- Avg / Peak 2×2 grid -->
          <view class="st-metric-grid">
            <view class="st-metric-cell">
              <text class="st-metric-lbl">↓ {{ $t('statistics.average') }}</text>
              <text class="st-metric-val">{{ formatBandwidth(averageRxRate) }}</text>
            </view>
            <view class="st-metric-cell">
              <text class="st-metric-lbl">↑ {{ $t('statistics.average') }}</text>
              <text class="st-metric-val">{{ formatBandwidth(averageTxRate) }}</text>
            </view>
            <view class="st-metric-cell">
              <text class="st-metric-lbl">↓ {{ $t('statistics.peak') }}</text>
              <text class="st-metric-val st-peak">{{ formatBandwidth(peakRxRate) }}</text>
            </view>
            <view class="st-metric-cell">
              <text class="st-metric-lbl">↑ {{ $t('statistics.peak') }}</text>
              <text class="st-metric-val st-peak">{{ formatBandwidth(peakTxRate) }}</text>
            </view>
          </view>

          <!-- Chart -->
          <view class="st-chart-wrap">
            <l-echart ref="chartRef" @finished="initChart"></l-echart>
          </view>
        </view>

        <view v-else-if="selectedDevice && !bandwidthData" class="st-empty">{{ $t('statistics.loading_bandwidth') }}</view>
        <view v-else-if="!selectedDevice && deviceList.length === 0" class="st-empty">{{ $t('statistics.loading_bandwidth') }}</view>
        <view v-else class="st-empty">{{ $t('statistics.select_interface_first') }}</view>
      </view>
    </scroll-view>

    <!-- ── Load Tab ── -->
    <scroll-view v-else-if="currentTab === 1" class="st-scroll" scroll-y="true" show-scrollbar="false">
      <view class="st-inner">
        <view v-if="loadData" class="st-card">
          <!-- Current load — 3 large numbers -->
          <view class="st-load-row">
            <view class="st-load-item">
              <text class="st-load-lbl">1 min</text>
              <text class="st-load-val">{{ currentLoad1 }}</text>
            </view>
            <view class="st-load-item">
              <text class="st-load-lbl">5 min</text>
              <text class="st-load-val">{{ currentLoad5 }}</text>
            </view>
            <view class="st-load-item">
              <text class="st-load-lbl">15 min</text>
              <text class="st-load-val">{{ currentLoad15 }}</text>
            </view>
          </view>

          <!-- Avg / Peak rows -->
          <view class="st-kv-row">
            <text class="st-kv-lbl">{{ $t('statistics.average') }}</text>
            <text class="st-kv-val">{{ averageLoad1 }} / {{ averageLoad5 }} / {{ averageLoad15 }}</text>
          </view>
          <view class="st-kv-row st-kv-last">
            <text class="st-kv-lbl">{{ $t('statistics.peak') }}</text>
            <text class="st-kv-val">{{ peakLoad1 }} / {{ peakLoad5 }} / {{ peakLoad15 }}</text>
          </view>

          <!-- Chart -->
          <view class="st-chart-wrap st-chart-load">
            <l-echart ref="loadChartRef" @finished="initLoadChart"></l-echart>
          </view>
        </view>

        <view v-else class="st-empty">{{ $t('statistics.loading_load') }}</view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'
import * as echarts from '@/uni_modules/lime-echart/static/echarts.min.js'
import PageTab from '@/components/page_tab.vue'

export default {
  components: { PageTab },
  data() {
    return {
      currentTab: 0,
      session: '',
      url: '/ubus',
      deviceInfo: {},
      deviceList: [],
      selectedDevice: '',
      bandwidthData: null,
      lastUpdateTime: '',
      timer: null,
      currentRxRate: 0,
      currentTxRate: 0,
      averageRxRate: 0,
      averageTxRate: 0,
      peakRxRate: 0,
      peakTxRate: 0,
      loadData: null,
      lastLoadUpdateTime: '',
      loadTimer: null,
      currentLoad1: 0,
      currentLoad5: 0,
      currentLoad15: 0,
      averageLoad1: 0,
      averageLoad5: 0,
      averageLoad15: 0,
      peakLoad1: 0,
      peakLoad5: 0,
      peakLoad15: 0,
      chartData: {
        timestamps: [],
        rxRates: [],
        txRates: []
      },
      loadChartData: {
        timestamps: [],
        load1: [],
        load5: [],
        load15: []
      },
      chartOption: {
        animation: false,
        animationDuration: 0,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line', lineStyle: { color: 'rgba(79,172,254,0.4)', width: 1 } },
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderColor: '#4facfe',
          borderWidth: 1,
          textStyle: { color: '#fff', fontSize: 12 },
          formatter: (params) => {
            const down = params && params[0] ? this.formatBandwidth(params[0].value) : '0 B/s'
            const up = params && params[1] ? this.formatBandwidth(params[1].value) : '0 B/s'
            return `${this.$t('statistics.inbound')}: ${down}\n${this.$t('statistics.outbound')}: ${up}`
          }
        },
        grid: { left: '0px', right: '8px', bottom: '16px', top: '10px', containLabel: false },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: [],
          axisLabel: { show: false },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          splitLine: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            show: true,
            inside: true,
            align: 'left',
            margin: 6,
            color: '#8e8e93',
            fontSize: 10,
            formatter: (value) => this.formatBandwidth(value)
          },
          axisTick: { show: false },
          axisLine: { show: false },
          splitLine: { show: true, lineStyle: { color: '#f0f0f0', type: 'dashed' } }
        },
        series: [
          {
            name: '入站',
            type: 'line', data: [], smooth: true, showSymbol: false, symbol: 'none', animation: false,
            lineStyle: { color: '#4facfe', width: 1.2 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(79,172,254,0.28)' }, { offset: 1, color: 'rgba(79,172,254,0.06)' }] } }
          },
          {
            name: '出站',
            type: 'line', data: [], smooth: true, showSymbol: false, symbol: 'none', animation: false,
            lineStyle: { color: '#00c4cc', width: 1.2 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(0,196,204,0.24)' }, { offset: 1, color: 'rgba(0,196,204,0.05)' }] } }
          }
        ]
      },
      loadChartOption: {
        animation: false,
        animationDuration: 0,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line', lineStyle: { color: 'rgba(99,102,241,0.35)', width: 1 } },
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderColor: '#6366f1',
          borderWidth: 1,
          textStyle: { color: '#fff', fontSize: 12 },
          formatter: (params) => {
            const l1 = params[0] ? params[0].value.toFixed(2) : '0'
            const l5 = params[1] ? params[1].value.toFixed(2) : '0'
            const l15 = params[2] ? params[2].value.toFixed(2) : '0'
            return `1min: ${l1}\n5min: ${l5}\n15min: ${l15}`
          }
        },
        legend: {
          data: ['1min', '5min', '15min'],
          top: 6,
          right: 0,
          textStyle: { color: '#8e8e93', fontSize: 11 },
          itemWidth: 14,
          itemHeight: 3
        },
        grid: { left: '0px', right: '8px', bottom: '16px', top: '36px', containLabel: false },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: [],
          axisLabel: { show: false },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          splitLine: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            show: true,
            inside: true,
            align: 'left',
            margin: 6,
            color: '#8e8e93',
            fontSize: 10,
            formatter: (value) => value.toFixed(2)
          },
          axisTick: { show: false },
          axisLine: { show: false },
          splitLine: { show: true, lineStyle: { color: '#f0f0f0', type: 'dashed' } }
        },
        series: [
          {
            name: '1min',
            type: 'line', data: [], smooth: true, showSymbol: false, symbol: 'none', animation: false,
            lineStyle: { color: '#ef4444', width: 1.5 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.2)' }, { offset: 1, color: 'rgba(239,68,68,0.03)' }] } }
          },
          {
            name: '5min',
            type: 'line', data: [], smooth: true, showSymbol: false, symbol: 'none', animation: false,
            lineStyle: { color: '#f97316', width: 1.5 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(249,115,22,0.2)' }, { offset: 1, color: 'rgba(249,115,22,0.03)' }] } }
          },
          {
            name: '15min',
            type: 'line', data: [], smooth: true, showSymbol: false, symbol: 'none', animation: false,
            lineStyle: { color: '#3b82f6', width: 1.5 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.2)' }, { offset: 1, color: 'rgba(59,130,246,0.03)' }] } }
          }
        ]
      }
    }
  },

  onLoad() {
    uni.setNavigationBarTitle({ title: this.$t('statistics.title') })
    uni.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#F8F8F8' })
    this.deviceInfo = DeviceManager.getCurrentDevice()
    this.session = this.deviceInfo.sysauth
    const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
    const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
    this.url = `${protocol}://${formattedHost}:${this.deviceInfo.port}/ubus`
    this.loadPageData()
    this.startLoadRefresh()
  },

  onReady() {},

  onShow() {
    uni.setNavigationBarTitle({ title: this.$t('statistics.title') })
    uni.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#F8F8F8' })
    this.loadPageData()
    if (this.currentTab === 0) {
      if (this.selectedDevice && !this.timer) this.startAutoRefresh()
    } else if (this.currentTab === 1) {
      if (!this.loadTimer) this.startLoadRefresh()
    }
  },

  onHide() {
    this.stopAutoRefresh()
    this.stopLoadRefresh()
  },

  onUnload() {
    this.stopAutoRefresh()
    this.stopLoadRefresh()
    if (this._chartInstance) { this._chartInstance.dispose(); this._chartInstance = null }
    if (this._loadChartInstance) { this._loadChartInstance.dispose(); this._loadChartInstance = null }
  },

  computed: {
    tab_list() {
      return [
        { value: 0, label: this.$t('statistics.bandwidth') },
        { value: 1, label: this.$t('statistics.load') }
      ]
    }
  },

  methods: {
    goBack() {
      this.stopAutoRefresh()
      this.stopLoadRefresh()
      uni.reLaunch({ url: '/pages/device_list' })
    },

    loadPageData() {
      if (this.currentTab === 1) this.loadLoadData()
      else if (this.currentTab === 0) this.loadBandwidthData()
    },

    loadLoadData() { this.fetchLoadData() },
    loadBandwidthData() { this.fetchDevices() },

    // ── API calls (unchanged) ──────────────────────────────────────────────

    fetchDevices() {
      uni.request({
        method: 'POST',
        url: this.url,
        data: { jsonrpc: '2.0', id: 1, method: 'call', params: [this.session, 'luci-rpc', 'getNetworkDevices', {}] },
        header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
        timeout: 3000,
        success: (res) => {
          if (res.data && res.data.result && res.data.result[1]) {
            const deviceMap = res.data.result[1]
            this.deviceList = Object.keys(deviceMap)
              .filter(devName => devName !== 'lo' && deviceMap[devName].up !== false)
              .map(devName => ({ name: devName, type: deviceMap[devName].type || '-', macaddr: deviceMap[devName].mac || '-' }))
              .sort((a, b) => {
                if (a.name === 'br-lan') return -1
                if (b.name === 'br-lan') return 1
                return a.name.localeCompare(b.name)
              })
            if (this.deviceList.length > 0 && !this.selectedDevice) {
              const brLanDevice = this.deviceList.find(device => device.name === 'br-lan')
              const defaultDevice = brLanDevice ? brLanDevice.name : this.deviceList[0].name
              this.selectDevice(defaultDevice)
            }
          }
        },
        fail: (err) => { console.log('获取接口失败:', err) }
      })
    },

    selectDevice(devname) {
      this.selectedDevice = devname
      this.chartData.timestamps = []
      this.chartData.rxRates = []
      this.chartData.txRates = []
      this.fetchBandwidthData()
      this.startAutoRefresh()
    },

    fetchLoadData() {
      uni.request({
        method: 'POST',
        url: this.url,
        data: { jsonrpc: '2.0', id: 2, method: 'call', params: [this.session, 'luci', 'getRealtimeStats', { mode: 'load' }] },
        header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
        timeout: 3000,
        success: (res) => {
          if (res.data && res.data.result && res.data.result[1] && res.data.result[1].result) {
            this.loadData = res.data.result[1].result
            this.processLoadData()
            this.updateLastLoadUpdateTime()
          } else {
            this.loadData = null
          }
        },
        fail: (err) => { console.error('get load data failed:', err); this.loadData = null }
      })
    },

    fetchBandwidthData() {
      if (!this.selectedDevice) return
      uni.request({
        method: 'POST',
        url: this.url,
        data: { jsonrpc: '2.0', id: 33, method: 'call', params: [this.session, 'luci', 'getRealtimeStats', { mode: 'interface', device: this.selectedDevice }] },
        header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
        timeout: 3000,
        success: (res) => {
          if (res.data && res.data.result && res.data.result[1] && res.data.result[1].result) {
            this.bandwidthData = res.data.result[1].result
            this.processBandwidthData()
            this.updateLastUpdateTime()
          } else {
            this.bandwidthData = null
          }
        },
        fail: (err) => { console.error('get bandwidth data failed:', err); this.bandwidthData = null }
      })
    },

    // ── Data processing (unchanged) ────────────────────────────────────────

    processLoadData() {
      if (!this.loadData || this.loadData.length === 0) return
      const latest = this.loadData[this.loadData.length - 1]
      if (latest) {
        this.currentLoad1 = (latest[1] / 100).toFixed(2)
        this.currentLoad5 = (latest[2] / 100).toFixed(2)
        this.currentLoad15 = (latest[3] / 100).toFixed(2)
        this.calculateLoadStats()
        this.updateLoadChartData()
      }
    },

    calculateLoadStats() {
      if (!this.loadData || this.loadData.length === 0) return
      const loads1 = [], loads5 = [], loads15 = []
      this.loadData.forEach(dataPoint => {
        loads1.push(dataPoint[1] / 100)
        loads5.push(dataPoint[2] / 100)
        loads15.push(dataPoint[3] / 100)
      })
      const sum1 = loads1.reduce((s, l) => s + l, 0)
      const sum5 = loads5.reduce((s, l) => s + l, 0)
      const sum15 = loads15.reduce((s, l) => s + l, 0)
      this.averageLoad1 = (sum1 / loads1.length).toFixed(2)
      this.averageLoad5 = (sum5 / loads5.length).toFixed(2)
      this.averageLoad15 = (sum15 / loads15.length).toFixed(2)
      this.peakLoad1 = Math.max(...loads1).toFixed(2)
      this.peakLoad5 = Math.max(...loads5).toFixed(2)
      this.peakLoad15 = Math.max(...loads15).toFixed(2)
    },

    updateLoadChartData() {
      if (!this.loadData || this.loadData.length === 0) return
      this.loadData.forEach(dataPoint => {
        this.addLoadDataPoint(dataPoint[0], dataPoint[1], dataPoint[2], dataPoint[3])
      })
      if (this._loadChartInstance) this.updateLoadChart()
    },

    addLoadDataPoint(timestamp, load1, load5, load15) {
      const maxPoints = 60
      const lastTs = this.loadChartData.timestamps[this.loadChartData.timestamps.length - 1]
      if (lastTs && lastTs === timestamp) return
      if (this.loadChartData.timestamps.length >= maxPoints) {
        this.loadChartData.timestamps.shift()
        this.loadChartData.load1.shift()
        this.loadChartData.load5.shift()
        this.loadChartData.load15.shift()
      }
      this.loadChartData.timestamps.push(timestamp)
      this.loadChartData.load1.push(load1 / 100)
      this.loadChartData.load5.push(load5 / 100)
      this.loadChartData.load15.push(load15 / 100)
    },

    processBandwidthData() {
      if (!this.bandwidthData || this.bandwidthData.length < 2) return
      const latest = this.bandwidthData[this.bandwidthData.length - 1]
      const previous = this.bandwidthData[this.bandwidthData.length - 2]
      if (latest && previous) {
        const timeDelta = latest[0] - previous[0]
        if (timeDelta > 0) {
          this.currentRxRate = (latest[1] - previous[1]) / timeDelta
          this.currentTxRate = (latest[3] - previous[3]) / timeDelta
          this.calculateAverageAndPeak()
          this.updateChartData()
        }
      }
    },

    calculateAverageAndPeak() {
      if (!this.bandwidthData || this.bandwidthData.length < 2) return
      const rates = []
      for (let i = 1; i < this.bandwidthData.length; i++) {
        const current = this.bandwidthData[i]
        const previous = this.bandwidthData[i - 1]
        const timeDelta = current[0] - previous[0]
        if (timeDelta > 0) {
          rates.push({ rx: (current[1] - previous[1]) / timeDelta, tx: (current[3] - previous[3]) / timeDelta })
        }
      }
      if (rates.length > 0) {
        this.averageRxRate = rates.reduce((s, r) => s + r.rx, 0) / rates.length
        this.averageTxRate = rates.reduce((s, r) => s + r.tx, 0) / rates.length
        this.peakRxRate = Math.max(...rates.map(r => r.rx))
        this.peakTxRate = Math.max(...rates.map(r => r.tx))
      }
    },

    formatBandwidth(bytesPerSecond) {
      if (!bytesPerSecond || bytesPerSecond < 0) return '0 B/s'
      const k = 1024
      const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
      const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
      if (i === 0) return Math.round(bytesPerSecond) + ' B/s'
      const value = bytesPerSecond / Math.pow(k, i)
      return (i === 1 ? Math.round(value) : value.toFixed(1)) + ' ' + sizes[i]
    },

    updateLastUpdateTime() {
      const now = new Date()
      this.lastUpdateTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
    },

    updateLastLoadUpdateTime() {
      const now = new Date()
      this.lastLoadUpdateTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
    },

    startAutoRefresh() {
      this.stopAutoRefresh()
      this.timer = setInterval(() => { if (this.selectedDevice) this.fetchBandwidthData() }, 3000)
    },
    stopAutoRefresh() {
      if (this.timer) { clearInterval(this.timer); this.timer = null }
    },
    startLoadRefresh() {
      this.stopLoadRefresh()
      this.loadTimer = setInterval(() => { this.fetchLoadData() }, 3000)
    },
    stopLoadRefresh() {
      if (this.loadTimer) { clearInterval(this.loadTimer); this.loadTimer = null }
    },

    // ── Chart init & update ────────────────────────────────────────────────

    async initChart() {
      if (!this.$refs.chartRef) return
      try {
        const chart = await this.$refs.chartRef.init(echarts)
        this._chartInstance = chart
        this.chartOption.series[0].name = this.$t('statistics.inbound')
        this.chartOption.series[1].name = this.$t('statistics.outbound')
        this._chartInstance.setOption(this.chartOption, false)
        if (this.chartData.timestamps.length > 0) this.updateChart()
      } catch (e) { console.error('chart init failed:', e) }
    },

    updateChartData() {
      if (!this.bandwidthData || this.bandwidthData.length < 2) return
      for (let i = 1; i < this.bandwidthData.length; i++) {
        const current = this.bandwidthData[i]
        const previous = this.bandwidthData[i - 1]
        if (current && previous) {
          const timeDelta = current[0] - previous[0]
          if (timeDelta > 0) {
            this.addDataPoint(current[0], (current[1] - previous[1]) / timeDelta, (current[3] - previous[3]) / timeDelta)
          }
        }
      }
      if (this._chartInstance) this.updateChart()
    },

    addDataPoint(timestamp, rxRate, txRate) {
      const maxPoints = 60
      const lastTs = this.chartData.timestamps[this.chartData.timestamps.length - 1]
      if (lastTs && lastTs === timestamp) return
      if (this.chartData.timestamps.length >= maxPoints) {
        this.chartData.timestamps.shift()
        this.chartData.rxRates.shift()
        this.chartData.txRates.shift()
      }
      this.chartData.timestamps.push(timestamp)
      this.chartData.rxRates.push(Math.max(0, rxRate))
      this.chartData.txRates.push(Math.max(0, txRate))
    },

    niceBandScale(rawMax) {
      const val = Math.max(Number(rawMax) || 0, 1024)
      const exp = Math.floor(Math.log10(val))
      const base = Math.pow(10, exp)
      for (const m of [1, 2, 4, 5, 8, 10]) {
        const c = base * m
        if (c >= val) return { max: c, interval: c / 4 }
      }
      return { max: base * 10, interval: base * 10 / 4 }
    },

    niceLoadScale(rawMax) {
      const val = Math.max(Number(rawMax) || 0, 0.5)
      const step = val <= 1 ? 0.25 : val <= 2 ? 0.5 : val <= 4 ? 1 : val <= 10 ? 2 : 5
      const niceMax = Math.ceil(val / step) * step
      return { max: niceMax, interval: niceMax / 4 }
    },

    updateChart() {
      if (!this._chartInstance || !this.chartData.timestamps.length) return
      const categories = this.chartData.timestamps.map(() => '')
      const allRates = [...this.chartData.rxRates, ...this.chartData.txRates]
      const scale = this.niceBandScale(Math.max(...allRates, 0) * 1.15)
      const option = {
        ...this.chartOption,
        animation: false,
        xAxis: { ...this.chartOption.xAxis, data: categories },
        yAxis: { ...this.chartOption.yAxis, min: 0, max: scale.max, interval: scale.interval },
        series: [
          { ...this.chartOption.series[0], data: this.chartData.rxRates, animation: false },
          { ...this.chartOption.series[1], data: this.chartData.txRates, animation: false }
        ]
      }
      this._chartInstance.setOption(option, false)
      this._chartInstance.dispatchAction({ type: 'hideTip' })
      this._chartInstance.dispatchAction({ type: 'downplay', seriesIndex: 0 })
      this._chartInstance.dispatchAction({ type: 'downplay', seriesIndex: 1 })
    },

    async initLoadChart() {
      if (!this.$refs.loadChartRef) return
      try {
        const chart = await this.$refs.loadChartRef.init(echarts)
        this._loadChartInstance = chart
        const l1 = this.$t('statistics.load_1min')
        const l5 = this.$t('statistics.load_5min')
        const l15 = this.$t('statistics.load_15min')
        this.loadChartOption.legend.data = [l1, l5, l15]
        this.loadChartOption.series[0].name = l1
        this.loadChartOption.series[1].name = l5
        this.loadChartOption.series[2].name = l15
        this._loadChartInstance.setOption(this.loadChartOption, false)
        if (this.loadChartData.timestamps.length > 0) this.updateLoadChart()
      } catch (e) { console.error('load chart init failed:', e) }
    },

    updateLoadChart() {
      if (!this._loadChartInstance || !this.loadChartData.timestamps.length) return
      const categories = this.loadChartData.timestamps.map(() => '')
      const allLoads = [...this.loadChartData.load1, ...this.loadChartData.load5, ...this.loadChartData.load15]
      const scale = this.niceLoadScale(Math.max(...allLoads, 0) * 1.2)
      const option = {
        ...this.loadChartOption,
        animation: false,
        xAxis: { ...this.loadChartOption.xAxis, data: categories },
        yAxis: { ...this.loadChartOption.yAxis, min: 0, max: scale.max, interval: scale.interval },
        series: [
          { ...this.loadChartOption.series[0], data: this.loadChartData.load1, animation: false },
          { ...this.loadChartOption.series[1], data: this.loadChartData.load5, animation: false },
          { ...this.loadChartOption.series[2], data: this.loadChartData.load15, animation: false }
        ]
      }
      this._loadChartInstance.setOption(option, false)
      this._loadChartInstance.dispatchAction({ type: 'hideTip' })
      this._loadChartInstance.dispatchAction({ type: 'downplay', seriesIndex: 0 })
      this._loadChartInstance.dispatchAction({ type: 'downplay', seriesIndex: 1 })
      this._loadChartInstance.dispatchAction({ type: 'downplay', seriesIndex: 2 })
    }
  },

  watch: {
    currentTab(val) {
      this.loadPageData()
      if (val === 0) {
        if (!this.loadTimer) this.startLoadRefresh()
        this.$nextTick(() => {
          if (!this._loadChartInstance && this.$refs.loadChartRef) this.initLoadChart()
        })
      } else if (val === 1) {
        if (this.selectedDevice && !this.timer) this.startAutoRefresh()
        this.$nextTick(() => {
          if (!this._chartInstance && this.$refs.chartRef) this.initChart()
        })
      } else {
        this.stopAutoRefresh()
        this.stopLoadRefresh()
      }
    }
  }
}
</script>

<style scoped>
@import '@/styles/common.scss';

/* ── Page ── */
.st-container {
  min-height: 100vh;
  background: #F2F2F7;
  display: flex;
  flex-direction: column;
}
.st-scroll { flex: 1; }
.st-inner { padding: 16rpx 24rpx 60rpx; box-sizing: border-box; }

/* ── Card ── */
.st-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 30rpx;
  margin-bottom: 20rpx;
  box-sizing: border-box;
}
.st-card-hd { margin-bottom: 18rpx; }
.st-card-title { font-size: 30rpx; font-weight: 700; color: #1c1c1e; }

/* ── Interface selector ── */
.st-iface-list { display: flex; flex-wrap: wrap; gap: 12rpx; }
.st-iface-item {
  padding: 8rpx 20rpx;
  background: #f2f2f7;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #3c3c43;
  font-weight: 500;
}
.st-iface-item.active {
  background: #3b82f6;
  color: #ffffff;
  font-weight: 600;
}

/* ── Bandwidth: current speed row ── */
.st-speed-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 20rpx 0 24rpx;
  border-bottom: 1rpx solid rgba(0,0,0,0.05);
  margin-bottom: 20rpx;
}
.st-speed-item { display: flex; align-items: center; gap: 8rpx; }
.st-speed-divider { width: 1rpx; height: 40rpx; background: rgba(0,0,0,0.08); }
.st-arrow { font-size: 32rpx; font-weight: 700; line-height: 1; }
.st-down { color: #4facfe; }
.st-up   { color: #00c4cc; }
.st-speed-val { font-size: 32rpx; font-weight: 700; color: #1c1c1e; }
.st-down-val { color: #4facfe; }
.st-up-val   { color: #00c4cc; }

/* ── Bandwidth: avg/peak 2×2 grid ── */
.st-metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin-bottom: 24rpx;
}
.st-metric-cell {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid rgba(0,0,0,0.05);
}
.st-metric-cell:nth-child(odd)  { padding-right: 20rpx; border-right: 1rpx solid rgba(0,0,0,0.05); }
.st-metric-cell:nth-child(even) { padding-left: 20rpx; }
.st-metric-cell:nth-last-child(-n+2) { border-bottom: none; }
.st-metric-lbl { font-size: 22rpx; color: #8e8e93; }
.st-metric-val { font-size: 26rpx; font-weight: 600; color: #1c1c1e; }
.st-metric-val.st-peak { color: #f97316; }

/* ── Load: 3 big numbers ── */
.st-load-row {
  display: flex;
  justify-content: space-around;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid rgba(0,0,0,0.05);
  margin-bottom: 4rpx;
}
.st-load-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.st-load-lbl { font-size: 22rpx; color: #8e8e93; }
.st-load-val { font-size: 44rpx; font-weight: 700; color: #1c1c1e; }

/* ── Load: avg/peak kv rows ── */
.st-kv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx 0;
  border-bottom: 1rpx solid rgba(0,0,0,0.05);
}
.st-kv-last { border-bottom: none; margin-bottom: 16rpx; }
.st-kv-lbl { font-size: 26rpx; color: #8e8e93; flex-shrink: 0; }
.st-kv-val { font-size: 26rpx; font-weight: 500; color: #1c1c1e; text-align: right; }

/* ── Charts ── */
.st-chart-wrap { width: 100%; height: 360rpx; }
.st-chart-load  { height: 380rpx; }

/* ── Empty state ── */
.st-empty {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  font-size: 28rpx;
  color: #8e8e93;
}
</style>
