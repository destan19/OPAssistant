
<template>
	<view class="container">
	
		<!-- <view class="nav-header" style="display: flex; align-items: center; position: relative;">
			<view class="back-btn" @click="goBack" style="z-index: 2;">
				<image class="back-icon" src="/static/back.png" mode="widthFix" style="width: 40rpx; height: 40rpx;" />
			</view>
			<view style="flex: 1; display: flex; justify-content: center; position: absolute; left: 0; right: 0; pointer-events: none;">
				<text style="font-size: 32rpx; font-weight: bold; color: #fff;">OpenWrt</text>
			</view>
		</view> -->
		
		
	  <page-tab v-model="currentTab" :tabs="tab_list" />
  
	        <view v-if="currentTab === 0">
        <view v-for="iface in interfaceList" :key="iface.name" class="iface-card">
          <view class="iface-header">
            <view class="iface-title">{{ iface.name.toUpperCase() }}<span v-if="iface.l3_device">({{ iface.l3_device }})</span></view>
            <view class="iface-proto">{{ iface.proto || '-' }}</view>
          </view>
          <view class="iface-body">
            <view class="iface-row" v-if="iface.mac && iface.mac !== '-'">
              <text class="label">{{ $t('network.mac') }}：</text>
              <text class="value">{{ iface.mac }}</text>
            </view>
            <view class="iface-row">
              <text class="label">{{ $t('network.traffic_rx_tx') }}：</text>
              <text class="value">{{ formatBytes(iface.rx_bytes) }} / {{ formatBytes(iface.tx_bytes) }}</text>
            </view>
            <view class="iface-row" v-if="iface.ipv4">
              <text class="label">{{ $t('network.ipv4') }}：</text>
              <text class="value">{{ iface.ipv4 }}</text>
            </view>
            <view class="iface-row ipv6-row" v-if="hasIpv6Data(iface)">
              <text class="label">{{ $t('network.ipv6') }}：</text>
              <view class="value ipv6-value-wrap">
                <text class="ipv6-text" @click="showIpv6Detail(iface)">{{ getShortAddress(iface.ipv6List) }}</text>
                <image
                  v-if="hasIpv6MoreDetail(iface)"
                  class="ipv6-eye"
                  src="/static/eye.png"
                  mode="aspectFit"
                  @click.stop="showIpv6Detail(iface)"
                />
              </view>
            </view>
            <view class="iface-row ipv6-row" v-if="iface.pdAssignList && iface.pdAssignList.length">
              <text class="label">{{ $t('network.ipv6_pd_assign') }}：</text>
              <view class="value ipv6-value-wrap">
                <text class="ipv6-text" @click="showAddressDetail($t('network.ipv6_pd_assign'), iface.pdAssignList)">{{ getShortAddress(iface.pdAssignList) }}</text>
                <image
                  v-if="hasMoreAddress(iface.pdAssignList)"
                  class="ipv6-eye"
                  src="/static/eye.png"
                  mode="aspectFit"
                  @click.stop="showAddressDetail($t('network.ipv6_pd_assign'), iface.pdAssignList)"
                />
              </view>
            </view>
            <view class="iface-row" v-if="iface.gateway">
              <text class="label">{{ $t('network.gateway') }}：</text>
              <text class="value">{{ iface.gateway }}</text>
            </view>
            <view class="iface-row" v-if="iface.dnsList && iface.dnsList.length">
              <text class="label">{{ $t('network.dns') }}：</text>
              <view class="value" style="text-align:right;">
                <view v-for="dns in iface.dnsList" :key="dns">{{ dns }}</view>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-else-if="currentTab === 1">
		<view v-for="group in deviceGroups" :key="group.type" class="dev-group">
		  <view class="dev-group-title">{{ group.label }} ({{ group.count }})</view>
		  <view v-for="dev in group.devices" :key="dev.name" class="dev-card">
			<view class="dev-header">
			  <view class="dev-title">{{ dev.name }}</view>
			  			<view class="dev-status" :class="dev.up ? 'up' : 'down'">{{ dev.up ? $t('network.up') : $t('network.down') }}</view>
			</view>
			<view class="dev-body">
			  			<view class="dev-row"><text class="label">{{ $t('network.mac') }}：</text><text class="value">{{ dev.macaddr || '-' }}</text></view>
			<view v-if="group.type === 'bridge' && dev.ports && dev.ports.length" class="dev-row">
			  <text class="label">{{ $t('network.bridge_ports') }}：</text><text class="value">{{ dev.ports.join(', ') }}</text>
			</view>
			<view class="dev-row"><text class="label">{{ $t('network.mtu') }}：</text><text class="value">{{ dev.mtu || '-' }}</text></view>
            <view class="dev-row"><text class="label">{{ $t('network.traffic_rx_tx') }}：</text><text class="value">{{ formatBytes(dev.rx_bytes) }} / {{ formatBytes(dev.tx_bytes) }}</text></view>
            <view class="dev-row"><text class="label">{{ $t('network.packets_rx_tx') }}：</text><text class="value">{{ formatPacketCount(dev.rx_packets) }} / {{ formatPacketCount(dev.tx_packets) }}</text></view>
			</view>
		  </view>
		</view>
	  </view>
  
	  <view v-else-if="currentTab === 2">
		<view v-if="wirelessList.length === 0" class="wireless-empty">{{ $t('network.wireless_loading') }}</view>
		<view v-for="radio in wirelessList" :key="radio.name" class="wireless-radio-card">
		  <view class="wireless-radio-header">
			<view class="wireless-radio-title">{{ radio.name }}</view>
			<view class="wireless-radio-chip">{{ $t('network.chip') }}：{{ radio.chip }}</view>
		  </view>
		  <view class="wireless-radio-body">
			<view class="wireless-radio-row"><text class="label">{{ $t('network.band') }}：</text><text class="value">{{ radio.band }}</text></view>
			<view class="wireless-radio-row"><text class="label">{{ $t('network.channel') }}：</text><text class="value">{{ radio.channel }}</text></view>
			<view class="wireless-radio-row"><text class="label">{{ $t('network.protocol') }}：</text><text class="value">802.11{{ radio.protocols }}</text></view>
		  </view>
		  <view v-for="iface in radio.interfaces" :key="iface.ifname" class="wireless-iface-card">
			<view class="wireless-iface-header">
			  			<view class="wireless-iface-title">{{ $t('network.ssid') }}：{{ iface.ssid || '-' }}</view>
			<view class="wireless-iface-mode">{{ $t('network.mode') }}：{{ iface.mode || '-' }}</view>
			</view>
			<view class="wireless-iface-body">
			  <view class="wireless-iface-row"><text class="label">{{ $t('network.bssid') }}：</text><text class="value">{{ iface.bssid }}</text></view>
			  <view class="wireless-iface-row"><text class="label">{{ $t('network.signal') }}：</text><text class="value">{{ iface.signal }}</text></view>
			  
			  <view class="wireless-iface-row"><text class="label">{{ $t('network.bitrate') }}：</text><text class="value">{{ iface.bitrate }}</text></view>
			  <view class="wireless-iface-row"><text class="label">{{ $t('network.encryption') }}：</text><text class="value">{{ iface.encryption }}</text></view>
			</view>
		  </view>
		</view>
	  </view>

	  <uni-popup ref="ipv6DialogPopup" type="center" :mask-click="true">
		<view class="ipv6-dialog">
		  <view class="ipv6-dialog-header">
			<text class="ipv6-dialog-title">{{ ipv6Dialog.title }}</text>
			<view class="ipv6-dialog-close" @click="closeIpv6Dialog">
			  <text class="ipv6-dialog-close-text">X</text>
			</view>
		  </view>
		  <scroll-view class="ipv6-dialog-scroll" scroll-y="true" show-scrollbar="false">
			<view v-for="(section, section_index) in ipv6Dialog.sections" :key="section.title + '_' + section_index" class="ipv6-dialog-section">
			  <text class="ipv6-dialog-section-title">{{ section.title }}</text>
			  <view class="ipv6-dialog-list">
				<view v-for="(item, item_index) in section.list" :key="section.title + '_' + item_index" class="ipv6-dialog-item">
				  <text class="ipv6-dialog-item-text">{{ item }}</text>
				</view>
			  </view>
			</view>
		  </scroll-view>
		  <view class="ipv6-dialog-footer">
			<view class="ipv6-dialog-btn" @click="closeIpv6Dialog">OK</view>
		  </view>
		</view>
	  </uni-popup>
	</view>
  </template>
  
  <script>
	import DeviceManager from '@/utils/deviceManager.js'
	import PageTab from '@/components/page_tab.vue'
  export default {
	components: {
	  PageTab
	},
	data() {
	  return {
		currentTab: 0,
		session: '',
		url: '/ubus',
		rawInterfaces: [],
		rawDevices: {},
		interfaceList: [],
		deviceGroups: [],
		deviceInfo: {},
		wirelessList: [],
		ipv6Dialog: {
		  title: '',
		  sections: []
		}
	  }
	},
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('network.title')
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
	},
	onShow() {
		uni.setNavigationBarTitle({
			title: this.$t('network.title')
		})
		uni.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: '#F8F8F8'
		})
	},
	computed: {
	  tab_list() {
		return [
		  { value: 0, label: this.$t('network.interfaces') },
		  { value: 1, label: this.$t('network.devices') },
		  { value: 2, label: this.$t('network.wireless') }
		]
	  }
	},
	methods: {
	
	  goBack() {
		uni.reLaunch({
		  url: '/pages/device_list'
		})
	  },
	  loadData() {
		this.fetchInterfaces()
		this.fetchDevices()
		this.fetchWireless()
	  },
	  fetchInterfaces() {
		uni.request({
		  method: 'POST',
		  url: this.url,
		  data: [
			{
			  jsonrpc: '2.0',
			  id: 1,
			  method: 'call',
			  params: [this.session, 'network.interface', 'dump', {}]
			},
			{
			  jsonrpc: '2.0',
			  id: 2,
			  method: 'call',
			  params: [this.session, 'luci-rpc', 'getNetworkDevices', {}]
			}
		  ],
		  header: {
			'Content-Type': 'application/json',
			'x-uniauth': 'true'
		  },
		  timeout: 3000,
		  success: (res) => {
			const interfaceRes = Array.isArray(res.data) ? res.data[0] : res.data
			const deviceRes = Array.isArray(res.data) ? res.data[1] : null
			let interfaces = []
			let deviceMap = {}
			if (interfaceRes && interfaceRes.result && interfaceRes.result[1] && interfaceRes.result[1].interface) {
			  interfaces = interfaceRes.result[1].interface
			}
			if (deviceRes && deviceRes.result && deviceRes.result[1]) {
			  deviceMap = deviceRes.result[1]
			}
			this.rawInterfaces = interfaces
			this.rawDevices = deviceMap
			this.interfaceList = interfaces
			  .filter(i => i.interface !== 'loopback' && i.up !== false)
			  .map(i => {
				let ipv4 = ''
				let ipv6List = []
				let ipv6pdList = []
				let pdAssignList = []
				let dnsList = []
				if (i['ipv4-address'] && i['ipv4-address'].length > 0) {
				  const ip = i['ipv4-address'][0]
				  ipv4 = ip.address + '/' + ip.mask
				}
				if (i['ipv6-address'] && i['ipv6-address'].length > 0) {
				  ipv6List = this.sortIpv6List(i['ipv6-address'].map(ip6 => ip6.address + '/' + ip6.mask))
				}
				if (i['ipv6-prefix'] && i['ipv6-prefix'].length > 0) {
				  ipv6pdList = i['ipv6-prefix'].map(pd => {
					if (pd.address && pd.mask !== undefined) {
					  return pd.address + '/' + pd.mask
					}
					return ''
				  }).filter(Boolean)
				}
				if (i['ipv6-prefix-assignment'] && i['ipv6-prefix-assignment'].length > 0) {
				  pdAssignList = i['ipv6-prefix-assignment'].map(pda => {
					if (pda['local-address'] && pda['local-address'].address && pda['local-address'].mask !== undefined) {
					  return pda['local-address'].address + '/' + pda['local-address'].mask
					} else if (pda.address && pda.mask !== undefined) {
					  return pda.address + '/' + pda.mask
					}
					return ''
				  }).filter(Boolean)
				}
				if (i['dns-server'] && Array.isArray(i['dns-server']) && i['dns-server'].length > 0) {
				  dnsList = i['dns-server']
				}
				let mac = '-'
				let rx_bytes = 0, rx_packets = 0, tx_bytes = 0, tx_packets = 0
				const dev = deviceMap[i.l3_device]
				if (dev) {
				  mac = dev.mac || '-'
				  rx_bytes = dev.stats ? dev.stats.rx_bytes : 0
				  rx_packets = dev.stats ? dev.stats.rx_packets : 0
				  tx_bytes = dev.stats ? dev.stats.tx_bytes : 0
				  tx_packets = dev.stats ? dev.stats.tx_packets : 0
				}
				let gateway = ''
				if (i.route && Array.isArray(i.route)) {
				  const gw = i.route.find(r => r.target === '0.0.0.0' && r.mask === 0)
				  if (gw && gw.nexthop) gateway = gw.nexthop
				}
				return {
					name: i.interface,
					proto: i.proto,
					uptime: i.uptime,
					l3_device: i.l3_device,
					mac,
					rx_bytes,
					rx_packets,
					tx_bytes,
					tx_packets,
					ipv4,
					ipv6List,
					ipv6pdList,
					pdAssignList,
					gateway,
					dnsList
				}
			  })
	
			const loopbackIface = interfaces.find(i => i.interface === 'loopback')
			if (loopbackIface) {
			  let mac = '-'
			  let rx_bytes = 0, rx_packets = 0, tx_bytes = 0, tx_packets = 0
			  const dev = deviceMap[loopbackIface.l3_device]
			  if (dev) {
				mac = dev.mac || '-'
				rx_bytes = dev.stats ? dev.stats.rx_bytes : 0
				rx_packets = dev.stats ? dev.stats.rx_packets : 0
				tx_bytes = dev.stats ? dev.stats.tx_bytes : 0
				tx_packets = dev.stats ? dev.stats.tx_packets : 0
			  }
			  let ipv4 = ''
			  if (loopbackIface['ipv4-address'] && loopbackIface['ipv4-address'].length > 0) {
				const ip = loopbackIface['ipv4-address'][0]
				ipv4 = ip.address + '/' + ip.mask
			  }
			  let ipv6List = []
			  if (loopbackIface['ipv6-address'] && loopbackIface['ipv6-address'].length > 0) {
				ipv6List = this.sortIpv6List(loopbackIface['ipv6-address'].map(ip6 => ip6.address + '/' + ip6.mask))
			  }
			  let ipv6pdList = []
			  if (loopbackIface['ipv6-prefix'] && loopbackIface['ipv6-prefix'].length > 0) {
				ipv6pdList = loopbackIface['ipv6-prefix'].map(pd => {
				  if (pd.address && pd.mask !== undefined) {
					return pd.address + '/' + pd.mask
				  }
				  return ''
				}).filter(Boolean)
			  }
			  let pdAssignList = []
			  if (loopbackIface['ipv6-prefix-assignment'] && loopbackIface['ipv6-prefix-assignment'].length > 0) {
				pdAssignList = loopbackIface['ipv6-prefix-assignment'].map(pda => {
				  if (pda['local-address'] && pda['local-address'].address && pda['local-address'].mask !== undefined) {
					return pda['local-address'].address + '/' + pda['local-address'].mask
				  } else if (pda.address && pda.mask !== undefined) {
					return pda.address + '/' + pda.mask
				  }
				  return ''
				}).filter(Boolean)
			  }
			  let dnsList = []
			  if (loopbackIface['dns-server'] && Array.isArray(loopbackIface['dns-server']) && loopbackIface['dns-server'].length > 0) {
				dnsList = loopbackIface['dns-server']
			  }
			  let gateway = ''
			  if (loopbackIface.route && Array.isArray(loopbackIface.route)) {
				const gw = loopbackIface.route.find(r => r.target === '0.0.0.0' && r.mask === 0)
				if (gw && gw.nexthop) gateway = gw.nexthop
			  }
			  this.interfaceList.push({
				name: loopbackIface.interface,
				proto: loopbackIface.proto,
				uptime: loopbackIface.uptime,
				l3_device: loopbackIface.l3_device,
				mac,
				rx_bytes,
				rx_packets,
				tx_bytes,
				tx_packets,
				ipv4,
				ipv6List,
				ipv6pdList,
				pdAssignList,
				gateway,
				dnsList
			  })
			}
			this.deviceGroups = this.generateDeviceGroups(deviceMap)
		  }
		})
	  },
	  fetchDevices() {
		uni.request({
		  method: 'POST',
		  url: this.url,
		  data: {
			jsonrpc: '2.0',
			id: 2,
			method: 'call',
			params: [this.session, 'network.device', 'status', {}]
		  },
		  header: {
			'Content-Type': 'application/json',
			'x-uniauth': 'true'
		  },
		  timeout: 3000,
		  success: (res) => {
			if (res.data && res.data.result && res.data.result[1] && res.data.result[1].device) {
			  const list = res.data.result[1].device.map(d => {
				return {
				  name: d.name,
				  up: d.up,
				  macaddr: d.macaddr,
				  speed: d.speed,
				  mtu: d.mtu,
				  rx_bytes: d.rx_bytes,
				  rx_packets: d.rx_packets,
				  tx_bytes: d.tx_bytes,
				  tx_packets: d.tx_packets
				}
			  })
			  this.deviceGroups = this.generateDeviceGroups(list)
			}
		  }
		})
	  },
	  fetchWireless() {
		this.wirelessList = [];
		uni.request({
		  method: 'POST',
		  url: this.url,
		  data: {
			jsonrpc: '2.0',
			id: 99,
			method: 'call',
			params: [this.session, 'luci-rpc', 'getWirelessDevices', {}]
		  },
		  header: {
			'Content-Type': 'application/json',
			'x-uniauth': 'true'
		  },
		  timeout: 3000,
		  success: (res) => {
			if (res.data && res.data.result && res.data.result[1]) {
			  const radios = res.data.result[1];
			  this.wirelessList = Object.keys(radios).map(radioName => {
				const radio = radios[radioName];
				const iw = radio.iwinfo || {};
				return {
				  name: radioName,
				  chip: (iw.hardware && iw.hardware.name) || '-',
				  band: radio.config && radio.config.band ? radio.config.band.toUpperCase() : '-',
				  channel: iw.channel || radio.config.channel || '-',
				  protocols: this.formatHwModes(iw.hwmodes_text, iw.hwmodes) || '-',
				  interfaces: (radio.interfaces || []).map(iface => {
					const ifaceInfo = iface.iwinfo || {};
					let encryption = this.$t('network.no_encryption');
					if (ifaceInfo.encryption && ifaceInfo.encryption.enabled) {
					  let wpa = '';
					  if (Array.isArray(ifaceInfo.encryption.wpa) && ifaceInfo.encryption.wpa.length > 0) {
						wpa = ifaceInfo.encryption.wpa.map(v => v === 1 ? 'WPA' : v === 2 ? 'WPA2' : v === 3 ? 'WPA3' : v).join('+');
					  }
					  let auth = '';
					  if (Array.isArray(ifaceInfo.encryption.authentication) && ifaceInfo.encryption.authentication.length > 0) {
						auth = ifaceInfo.encryption.authentication.map(a => a.toUpperCase()).join('+');
					  }
					  let ciphers = '';
					  if (Array.isArray(ifaceInfo.encryption.ciphers) && ifaceInfo.encryption.ciphers.length > 0) {
						ciphers = ifaceInfo.encryption.ciphers.map(c => c.toUpperCase()).join('/');
					  }
					  let arr = [];
					  if (wpa) arr.push(wpa.toUpperCase());
					  if (auth) arr.push(auth);
					  let encStr = arr.join(' ');
					  if (ciphers) encStr += ' (' + ciphers + ')';
					  encryption = encStr || this.$t('network.encrypted');
					}
					return {
					  ifname: iface.ifname,
					  ssid: ifaceInfo.ssid || '-',
					  bssid: ifaceInfo.bssid || '-',
					  mode: ifaceInfo.mode || iface.config?.mode || '-',
					  signal: ifaceInfo.signal !== undefined ? ifaceInfo.signal + ' dBm' : '-',
					  noise: ifaceInfo.noise !== undefined ? ifaceInfo.noise + ' dBm' : '-',
					  bitrate: ifaceInfo.bitrate ? (ifaceInfo.bitrate / 1000).toFixed(1) + ' Mbit/s' : '-',
					  encryption
					}
				  })
				};
			  });
			}
		  }
		});
	  },
	  generateDeviceGroups(deviceMap) {
		const typeMap = {
		  bridge: this.$t('network.device_type_bridge'),
		  ethernet: this.$t('network.device_type_ethernet'),
		  wireless: this.$t('network.device_type_wireless'),
		  vlan: this.$t('network.device_type_vlan'),
		  tunnel: this.$t('network.device_type_tunnel'),
		}
		const groupMap = {}
		Object.values(deviceMap).forEach(d => {
		  if (!d.up || d.name === 'lo') return
		  let type = d.devtype || 'other'
		  if (!typeMap[type]) type = 'other'
		  if (!groupMap[type]) groupMap[type] = []
		  groupMap[type].push({
			name: d.name,
			up: d.up,
			macaddr: d.mac,
			devtype: d.devtype,
			ports: d.ports || [],
			speed: d.link && d.link.speed ? d.link.speed : '',
			mtu: d.mtu,
			rx_bytes: d.stats ? d.stats.rx_bytes : 0,
			rx_packets: d.stats ? d.stats.rx_packets : 0,
			tx_bytes: d.stats ? d.stats.tx_bytes : 0,
			tx_packets: d.stats ? d.stats.tx_packets : 0
		  })
		})
		if (groupMap.ethernet) {
		  const ethList = groupMap.ethernet.filter(dev => dev.name.startsWith('eth'))
		  const otherList = groupMap.ethernet.filter(dev => !dev.name.startsWith('eth'))
		  groupMap.ethernet = [...ethList, ...otherList]
		}
		const groupArr = Object.keys(groupMap).map(type => ({
		  type,
		  label: typeMap[type] || this.$t('network.other'),
		  count: groupMap[type].length,
		  devices: groupMap[type]
		}))
		groupArr.sort((a, b) => {
		  if (a.type === 'bridge') return -1
		  if (b.type === 'bridge') return 1
		  if (a.type === 'other') return 1
		  if (b.type === 'other') return -1
		  return 0
		})
		return groupArr
	  },
	  sortIpv6List(list) {
		if (!Array.isArray(list)) return []
		return [...list].sort((a, b) => {
		  const aFd = String(a || '').toLowerCase().startsWith('fd')
		  const bFd = String(b || '').toLowerCase().startsWith('fd')
		  if (aFd === bFd) return 0
		  return aFd ? 1 : -1
		})
	  },
	  getShortAddress(list) {
		if (!Array.isArray(list) || list.length === 0) return '-'
		const sorted = this.sortIpv6List(list)
		const first = String(sorted[0] || '')
		const maxLen = 30
		return first.length > maxLen ? first.slice(0, maxLen) + '...' : first
	  },
	  hasIpv6MoreDetail(iface) {
		if (!iface) return false
		const ipv6Count = Array.isArray(iface.ipv6List) ? iface.ipv6List.length : 0
		const pdCount = Array.isArray(iface.ipv6pdList) ? iface.ipv6pdList.length : 0
		return pdCount > 0 || ipv6Count > 1
	  },
	  hasIpv6Data(iface) {
		if (!iface) return false
		const ipv6Count = Array.isArray(iface.ipv6List) ? iface.ipv6List.length : 0
		const pdCount = Array.isArray(iface.ipv6pdList) ? iface.ipv6pdList.length : 0
		return (ipv6Count + pdCount) > 0
	  },
	  showIpv6Detail(iface) {
		if (!iface) return
		const ipv6List = this.sortIpv6List(Array.isArray(iface.ipv6List) ? iface.ipv6List : [])
		const ipv6pdList = Array.isArray(iface.ipv6pdList) ? iface.ipv6pdList : []
		const sections = []
		if (ipv6List.length > 0) {
		  sections.push({
			title: this.$t('network.ipv6'),
			list: ipv6List
		  })
		}
		if (ipv6pdList.length > 0) {
		  sections.push({
			title: this.$t('network.ipv6_pd'),
			list: ipv6pdList
		  })
		}
		if (sections.length === 0) return
		this.openIpv6Dialog(this.$t('network.ipv6'), sections)
	  },
	  hasMoreAddress(list) {
		return Array.isArray(list) && list.length > 1
	  },
	  showAddressDetail(title, list) {
		if (!Array.isArray(list) || list.length === 0) return
		this.openIpv6Dialog(title || this.$t('network.ipv6'), [{
		  title: title || this.$t('network.ipv6'),
		  list
		}])
	  },
	  openIpv6Dialog(title, sections) {
		if (!Array.isArray(sections) || sections.length === 0) return
		const safeSections = sections
		  .map(section => ({
			title: section && section.title ? section.title : this.$t('network.ipv6'),
			list: Array.isArray(section && section.list) ? section.list.filter(Boolean) : []
		  }))
		  .filter(section => section.list.length > 0)
		if (safeSections.length === 0) return
		this.ipv6Dialog = {
		  title: title || this.$t('network.ipv6'),
		  sections: safeSections
		}
		this.$nextTick(() => {
		  if (this.$refs.ipv6DialogPopup) {
			this.$refs.ipv6DialogPopup.open()
		  }
		})
	  },
	  closeIpv6Dialog() {
		if (this.$refs.ipv6DialogPopup) {
		  this.$refs.ipv6DialogPopup.close()
		}
	  },
	  formatBytes(bytes) {
		if (!bytes) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
	  },
	  formatUptime(seconds) {
		if (!seconds) return '-'
		const d = Math.floor(seconds / 86400)
		const h = Math.floor((seconds % 86400) / 3600)
		const m = Math.floor((seconds % 3600) / 60)
		if (d > 0) return `${d}d ${h}h ${m}m`
		if (h > 0) return `${h}h ${m}m`
		return `${m}m`
	  },
	  formatHwModes(hwmodes_text, hwmodes) {

		if (hwmodes_text) {
			return hwmodes_text
		}
	
		if (hwmodes && Array.isArray(hwmodes)) {
		  return hwmodes.join(', ').toUpperCase()
		}
		return null
	  },
	  formatPacketCount(val) {
		const num = Number(val || 0)
		if (num >= 1000) {
		  const kVal = num / 1000
		  const fixed = kVal >= 100 ? kVal.toFixed(0) : kVal.toFixed(1)
		  return fixed.replace(/\.0$/, '') + 'k'
		}
		return String(Math.floor(num))
	  },
	  formatPackets(val) {
		if (!val) return '0'
		if (val >= 1e9) return (val / 1e9).toFixed(2) + 'G'
		if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M'
		if (val >= 1e3) return (val / 1e3).toFixed(2) + 'K'
		return val.toLocaleString()
	  }
	},
	watch: {
	  currentTab(val) {
		if (val === 2) {
		  this.fetchWireless();
		}
	  }
	}
  }
  </script>
  
  <style scoped>

@import '@/styles/common.scss';

.container {
	padding: 20rpx;
}

.iface-card {
	background: rgba(255, 255, 255, 0.98);
	border-radius: 18rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.08);
	border: 1rpx solid #e7edf6;
	padding: 28rpx;
}
  .iface-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
	padding-bottom: 8rpx;
	border-bottom: 1rpx solid rgba(59, 130, 246, 0.12);
  }
  .iface-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1f2937;
	max-width: 72%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
  .iface-proto {
	font-size: 22rpx;
	color: #2563eb;
	font-weight: 600;
	background: #eaf2ff;
	border-radius: 999rpx;
	padding: 4rpx 14rpx;
  }
  .iface-body {
	margin-bottom: 0;
  }
  .iface-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10rpx 0;
	border-bottom: 1rpx solid rgba(15, 23, 42, 0.06);
}
.iface-row:last-child {
	border-bottom: none;
}
  .iface-row .label {
	font-size: 24rpx;
	color: #6b7280;
	font-weight: 500;
	min-width: 140rpx;
	flex-shrink: 0;
  }
  .iface-row .value {
	font-size: 24rpx;
	font-weight: 500;
	color: #111827;
	text-align: right;
	max-width: 64%;
	word-break: break-all;
	flex: 1;
  }
  
  .ipv6-row {
	align-items: center;
  }
  
  .ipv6-value-wrap {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10rpx;
	max-width: 68%;
	min-width: 0;
	text-align: right;
  }

  .ipv6-text {
	display: block;
	max-width: 420rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: #1f2937;
  }

  .ipv6-eye {
	width: 34rpx;
	height: 34rpx;
	flex-shrink: 0;
	opacity: 0.92;
  }

  .ipv6-dialog {
	width: 660rpx;
	max-height: 72vh;
	background: rgba(255, 255, 255, 0.98);
	border-radius: 20rpx;
	border: 1rpx solid #e7edf6;
	box-shadow: 0 10rpx 34rpx rgba(15, 23, 42, 0.16);
	padding: 22rpx 22rpx 20rpx;
	box-sizing: border-box;
  }

  .ipv6-dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 18rpx;
	padding-bottom: 10rpx;
	border-bottom: 1rpx solid rgba(15, 23, 42, 0.08);
  }

  .ipv6-dialog-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1f2937;
	padding-right: 10rpx;
  }

  .ipv6-dialog-close {
	width: 44rpx;
	height: 44rpx;
	border-radius: 22rpx;
	background: #eef2f7;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
  }

  .ipv6-dialog-close-text {
	font-size: 30rpx;
	line-height: 30rpx;
	color: #64748b;
	font-weight: 500;
  }

  .ipv6-dialog-scroll {
	max-height: 52vh;
  }

  .ipv6-dialog-section {
	margin-bottom: 16rpx;
  }

  .ipv6-dialog-section:last-child {
	margin-bottom: 0;
  }

  .ipv6-dialog-section-title {
	display: block;
	font-size: 24rpx;
	font-weight: 600;
	color: #2563eb;
	margin-bottom: 10rpx;
  }

  .ipv6-dialog-list {
	background: #f8fbff;
	border: 1rpx solid #e3edf9;
	border-radius: 14rpx;
	overflow: hidden;
  }

  .ipv6-dialog-item {
	padding: 16rpx 18rpx;
	border-bottom: 1rpx solid rgba(15, 23, 42, 0.06);
  }

  .ipv6-dialog-item:last-child {
	border-bottom: none;
  }

  .ipv6-dialog-item-text {
	font-size: 24rpx;
	font-weight: 500;
	color: #111827;
	word-break: break-all;
	line-height: 1.45;
  }

  .ipv6-dialog-footer {
	margin-top: 18rpx;
	display: flex;
	justify-content: flex-end;
  }

  .ipv6-dialog-btn {
	min-width: 140rpx;
	padding: 10rpx 22rpx;
	text-align: center;
	font-size: 24rpx;
	font-weight: 600;
	color: #2563eb;
	background: #eaf2ff;
	border: 1rpx solid #bfd8ff;
	border-radius: 999rpx;
  }
  .dev-card {
	background: rgba(255, 255, 255, 0.98);
	border-radius: 18rpx;
	margin-bottom: 14rpx;
	box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.08);
	border: 1rpx solid #e7edf6;
	padding: 26rpx;
}
  .dev-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
	padding-bottom: 8rpx;
	border-bottom: 1rpx solid rgba(15, 23, 42, 0.06);
  }
  .dev-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1f2937;
	max-width: 72%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
  }
  .dev-status {
	font-size: 22rpx;
	font-weight: 600;
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
  }
  .dev-status.up {
	color: #16a34a;
	background: #e9f8ef;
  }
  .dev-status.down {
	color: #dc2626;
	background: #fdecec;
  }
  .dev-body {
	margin-top: 2rpx;
  }
  .dev-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10rpx 0;
	border-bottom: 1rpx solid rgba(15, 23, 42, 0.06);
}
.dev-row:last-child {
	border-bottom: none;
}
  .dev-row .label {
	font-size: 24rpx;
	color: #6b7280;
	font-weight: 500;
	min-width: 140rpx;
	flex-shrink: 0;
  }
  .dev-row .value {
	font-size: 24rpx;
	color: #111827;
	font-weight: 500;
	text-align: right;
	max-width: 64%;
	word-break: break-all;
	flex: 1;
  }
  .dev-group {
	margin-bottom: 20rpx;
}
.dev-group-title {
	font-size: 24rpx;
	font-weight: 600;
	color: #374151;
	margin: 18rpx 0 12rpx 0;
	padding-left: 12rpx;
	border-left: 6rpx solid #60a5fa;
	background: transparent;
	box-shadow: none;
}
  .wireless-radio-card {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 20rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
	padding: 40rpx;
}
  .wireless-radio-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8rpx;
  }
  .wireless-radio-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}
  .wireless-radio-chip {
	font-size: 22rpx;
	color: #888;
  }
  .wireless-radio-body {
	margin-bottom: 0;
  }
  .wireless-radio-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8rpx 0;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	font-size: 26rpx;
	color: #666;
}
.wireless-radio-row:last-child {
	border-bottom: none;
}
  .wireless-iface-card {
	background: rgba(255, 255, 255, 0.9);
	border-radius: 16rpx;
	margin: 20rpx 0 10rpx 0;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
	padding: 30rpx;
}
  .wireless-iface-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8rpx;
  }
  .wireless-iface-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #333;
  }
  .wireless-iface-mode {
	font-size: 22rpx;
	color: #666;
}
  .wireless-iface-body {
	margin-top: 4rpx;
  }
  .wireless-iface-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8rpx 0;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	font-size: 26rpx;
	color: #666;
}
.wireless-iface-row:last-child {
	border-bottom: none;
}
  .wireless-empty {
	color: #666;
	text-align: center;
	margin: 40rpx 0;
	font-size: 28rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 20rpx;
	padding: 40rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}
  </style>
  
  
