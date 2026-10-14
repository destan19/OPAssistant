<template>
	<view class="ir-page">
		<!-- nav -->
		<view class="ir-nav">
			<view class="ir-back" @click="goBack">
				<image src="/static/back.png" mode="widthFix" class="ir-back-icon" />
			</view>
			<text class="ir-nav-title">{{ $t('fwx_more.internet_records') }}</text>
			<view class="ir-nav-right">
				<view v-if="activeTab === 1" class="ir-add-btn" @click="openUserPicker">
					<text class="ir-add-text">+</text>
				</view>
				<view v-else style="width: 60rpx;"></view>
			</view>
		</view>

		<!-- segment tabs -->
		<view class="ir-tabs">
			<view
				v-for="(tab, i) in tabs"
				:key="i"
				class="ir-tab"
				:class="{ 'ir-tab-active': activeTab === i }"
				@click="switchTab(i)"
			>
				<text class="ir-tab-text" :class="{ 'ir-tab-text-active': activeTab === i }">{{ tab }}</text>
			</view>
		</view>

		<!-- ── Tab 0: 上网审计（基本设置） ─────── -->
		<scroll-view v-if="activeTab === 0" scroll-y style="flex: 1;" class="ir-scroll">
			<view v-if="baseLoading" class="ir-state">
				<text class="ir-state-text">{{ $t('fwx_common.loading') }}</text>
			</view>
			<view v-else>
				<!-- enable -->
				<view class="ir-section">
					<view class="ir-card">
						<view class="ir-toggle-row">
							<view class="ir-field-info">
								<text class="ir-field-label">{{ $t('fwx_record.enable') }}</text>
								<text class="ir-field-desc">{{ $t('fwx_record.enable_desc') }}</text>
							</view>
							<switch :checked="form.enable" @change="form.enable = $event.detail.value" color="#007AFF" style="transform: scale(0.85);" />
						</view>

						<!-- data usage row (only shown when available) -->
						<view v-if="dataStatus" class="ir-row ir-row-border">
							<text class="ir-row-label">{{ $t('fwx_record.data_usage') }}</text>
							<view class="ir-row-right">
								<text class="ir-row-value">{{ formatDataSize(dataStatus) }}</text>
								<view class="ir-clean-btn" :class="{ 'ir-btn-loading': cleaning }" @click="confirmClean">
									<text v-if="!cleaning" class="ir-clean-text">{{ $t('fwx_record.clean_data') }}</text>
									<view v-else class="ir-spin-sm"></view>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- retention settings -->
				<view class="ir-section">
					<view class="ir-card">
						<!-- record time -->
						<view class="ir-row" @click="pickRecordTime">
							<view class="ir-row-info">
								<text class="ir-row-label">{{ $t('fwx_record.record_time') }}</text>
								<text class="ir-row-desc">{{ $t('fwx_record.record_time_desc') }}</text>
							</view>
							<view class="ir-row-right">
								<text class="ir-row-value">{{ form.record_time }} {{ $t('fwx_record.days') }}</text>
								<text class="ir-row-arrow">›</text>
							</view>
						</view>

						<!-- app valid time -->
						<view class="ir-row ir-row-border" @click="pickAppValidTime">
							<view class="ir-row-info">
								<text class="ir-row-label">{{ $t('fwx_record.app_valid_time') }}</text>
								<text class="ir-row-desc">{{ $t('fwx_record.app_valid_time_desc') }}</text>
							</view>
							<view class="ir-row-right">
								<text class="ir-row-value">{{ form.app_valid_time }} {{ $t('fwx_record.minutes') }}</text>
								<text class="ir-row-arrow">›</text>
							</view>
						</view>
					</view>
				</view>

				<!-- storage settings -->
				<view class="ir-section">
					<view class="ir-card">
						<!-- history data size -->
						<view class="ir-field-row">
							<text class="ir-field-label2">{{ $t('fwx_record.history_size') }}</text>
							<view class="ir-input-wrap">
								<input
									class="ir-input"
									type="number"
									v-model="form.history_data_size"
									:placeholder="'1–1024'"
								/>
								<text class="ir-input-unit">{{ $t('fwx_record.history_size_unit') }}</text>
							</view>
						</view>

						<!-- history data path -->
						<view class="ir-field-row ir-row-border">
							<text class="ir-field-label2">{{ $t('fwx_record.history_path') }}</text>
							<input
								class="ir-input ir-input-path"
								v-model="form.history_data_path"
								:placeholder="'/tmp/fwx'"
								type="text"
							/>
						</view>
						<text class="ir-field-hint">{{ $t('fwx_record.history_path_desc') }}</text>

						<!-- base data path -->
						<view class="ir-field-row ir-row-border">
							<text class="ir-field-label2">{{ $t('fwx_record.base_path') }}</text>
							<input
								class="ir-input ir-input-path"
								v-model="form.base_data_path"
								:placeholder="'/tmp/fwx'"
								type="text"
							/>
						</view>
						<text class="ir-field-hint">{{ $t('fwx_record.base_path_desc') }}</text>
					</view>
				</view>

				<!-- save button -->
				<view class="ir-section">
					<view class="ir-save-btn" :class="{ 'ir-btn-loading': baseSaving }" @click="saveBase">
						<text v-if="!baseSaving" class="ir-save-text">{{ $t('fwx_record.save') }}</text>
						<view v-else class="ir-spin"></view>
					</view>
				</view>
			</view>
			<view style="height: 40rpx;"></view>
		</scroll-view>

		<!-- ── Tab 1: 白名单 ──────────────────── -->
		<scroll-view v-if="activeTab === 1" scroll-y style="flex: 1;" class="ir-scroll">
			<view v-if="wlLoading" class="ir-state">
				<text class="ir-state-text">{{ $t('fwx_common.loading') }}</text>
			</view>
			<view v-else-if="whitelist.length === 0" class="ir-state">
				<text class="ir-state-text">{{ $t('fwx_record.no_whitelist') }}</text>
				<text class="ir-state-hint">{{ $t('fwx_record.whitelist_hint') }}</text>
			</view>
			<view v-else class="ir-list-wrap">
				<view class="ir-card">
					<view
						v-for="(item, i) in whitelist"
						:key="item.mac"
						class="ir-wl-item"
						:class="{ 'ir-row-border': i > 0 }"
					>
						<view class="ir-user-info">
							<text class="ir-user-name">{{ (item.nickname && item.nickname !== '--') ? item.nickname : (item.hostname && item.hostname !== '--') ? item.hostname : item.mac }}</text>
							<text class="ir-user-mac">{{ item.mac }}</text>
						</view>
						<view class="ir-del-btn" @click="confirmRemove(item)">
							<text class="ir-del-text">{{ $t('device_list.delete') }}</text>
						</view>
					</view>
				</view>

				<!-- pagination -->
				<view v-if="wlTotalPage > 1" class="ir-pagination">
					<view class="ir-page-btn" :class="{ 'ir-page-btn-dis': wlPage <= 1 }" @click="gotoPage(wlPage - 1)">
						<text class="ir-page-btn-text">‹</text>
					</view>
					<text class="ir-page-info">{{ wlPage }} / {{ wlTotalPage }}</text>
					<view class="ir-page-btn" :class="{ 'ir-page-btn-dis': wlPage >= wlTotalPage }" @click="gotoPage(wlPage + 1)">
						<text class="ir-page-btn-text">›</text>
					</view>
				</view>
			</view>
			<view style="height: 40rpx;"></view>
		</scroll-view>

		<!-- user picker modal -->
		<view v-if="pickerVisible" class="ir-overlay" @click.stop="pickerVisible = false">
			<view class="ir-picker-sheet" @click.stop>
				<view class="ir-picker-head">
					<text class="ir-picker-title">{{ $t('fwx_record.select_user_title') }}</text>
					<view class="ir-picker-close" @click="pickerVisible = false">
						<text class="ir-picker-close-text">✕</text>
					</view>
				</view>
				<!-- multi-select note -->
				<view class="ir-picker-hint">
					<text class="ir-picker-hint-text">{{ selectedMacs.length > 0 ? `已选 ${selectedMacs.length} 台` : '点击勾选，可多选' }}</text>
					<view v-if="selectedMacs.length > 0" class="ir-picker-confirm-btn" @click="addSelected">
						<text class="ir-picker-confirm-text">确认添加</text>
					</view>
				</view>
				<scroll-view scroll-y style="flex: 1; overflow: hidden;">
					<view v-if="usersLoading" style="padding: 60rpx; text-align: center;">
						<text class="ir-state-text">{{ $t('fwx_record.loading_users') }}</text>
					</view>
					<view v-else-if="availableUsers.length === 0" style="padding: 60rpx; text-align: center;">
						<text class="ir-state-text">{{ $t('fwx_record.no_users') }}</text>
					</view>
					<view v-else>
						<view
							v-for="user in availableUsers"
							:key="user.mac"
							class="ir-picker-item"
							@click="toggleUserSelect(user.mac)"
						>
							<view class="ir-picker-check" :class="{ 'ir-picker-check-on': selectedMacs.includes(user.mac) }">
								<text v-if="selectedMacs.includes(user.mac)" class="ir-check-mark">✓</text>
							</view>
							<view class="ir-picker-info">
								<text class="ir-picker-name">{{ user.nickname || user.hostname || user.mac }}</text>
								<text class="ir-picker-sub">{{ user.mac }}{{ user.ip ? ' · ' + user.ip : '' }}</text>
							</view>
							<view class="ir-picker-status" :class="user.online ? 'ir-status-on' : 'ir-status-off'">
								<text class="ir-picker-status-text">{{ user.online ? $t('fwx_common.online') : $t('fwx_common.offline') }}</text>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'

const RECORD_TIME_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 10, 15, 30]
const APP_VALID_TIME_OPTIONS = [1, 2, 3, 4, 5, 10, 15, 20, 30, 60]

export default {
	data() {
		return {
			device: null,
			ubusUrl: '',

			activeTab: 0,
			tabLoaded: [false, false],

			// Tab 0
			baseLoading: false,
			baseSaving: false,
			cleaning: false,
			dataStatus: null,
			form: {
				enable: false,
				record_time: 7,
				app_valid_time: 5,
				history_data_size: '100',
				history_data_path: '/tmp/fwx',
				base_data_path: '/tmp/fwx'
			},

			// Tab 1
			wlLoading: false,
			whitelist: [],
			wlPage: 1,
			wlTotalPage: 1,
			wlTotalNum: 0,

			// picker
			pickerVisible: false,
			usersLoading: false,
			allUsers: [],
			wlMacSet: [],
			selectedMacs: []
		}
	},

	computed: {
		tabs() {
			return [
				this.$t('fwx_record.tab_base'),
				this.$t('fwx_record.tab_whitelist')
			]
		},
		availableUsers() {
			const wlSet = new Set(this.wlMacSet.map(m => m.toUpperCase()))
			return this.allUsers.filter(u => !wlSet.has((u.mac || '').toUpperCase()))
		}
	},

	onShow() {
		const device = DeviceManager.getCurrentDevice()
		if (!device) return
		this.device = device
		const protocol = device.useHttps ? 'https' : 'http'
		const host = DeviceManager.formatHostForUrl(device.ip)
		this.ubusUrl = `${protocol}://${host}:${device.port}/ubus`
		this.tabLoaded = [false, false]
		this.loadTab(this.activeTab)
	},

	methods: {
		goBack() { uni.navigateBack() },

		switchTab(i) {
			this.activeTab = i
			if (!this.tabLoaded[i]) this.loadTab(i)
		},

		loadTab(i) {
			if (i === 0) this.loadBase()
			else if (i === 1) this.loadWhitelist()
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

		// ── Tab 0: base settings ──────────────

		async loadBase() {
			this.baseLoading = true
			try {
				// ubus returns unwrapped data: {enable, record_time, app_valid_time, ...}
				const d = await this.ubus('get_record_base', {})
				if (d) {
					this.form.enable = d.enable === 1
					this.form.record_time = d.record_time || 7
					this.form.app_valid_time = d.app_valid_time || 5
					this.form.history_data_size = String(d.history_data_size || '')
					this.form.history_data_path = d.history_data_path || ''
					this.form.base_data_path = d.base_data_path || d.terminal_data_path || ''
					this.dataStatus = (d.status && d.status.data_size !== undefined) ? d.status : null
				}
				this.tabLoaded[0] = true
			} catch (e) { /* ignore */ }
			finally { this.baseLoading = false }
		},

		pickRecordTime() {
			const labels = RECORD_TIME_OPTIONS.map(v => `${v} ${this.$t('fwx_record.days')}`)
			uni.showActionSheet({
				itemList: labels,
				success: (res) => { this.form.record_time = RECORD_TIME_OPTIONS[res.tapIndex] }
			})
		},

		pickAppValidTime() {
			const labels = APP_VALID_TIME_OPTIONS.map(v => `${v} ${this.$t('fwx_record.minutes')}`)
			uni.showActionSheet({
				itemList: labels,
				success: (res) => { this.form.app_valid_time = APP_VALID_TIME_OPTIONS[res.tapIndex] }
			})
		},

		async saveBase() {
			if (this.baseSaving) return
			this.baseSaving = true
			try {
				const sizeStr = String(this.form.history_data_size || '').trim()
				if (sizeStr) {
					const n = parseInt(sizeStr)
					if (isNaN(n) || n < 1 || n > 1024 || n !== parseFloat(sizeStr)) {
						uni.showToast({ title: '大小须为 1-1024 MB 的整数', icon: 'none' })
						return
					}
				}
				if (!this.form.history_data_path || this.form.history_data_path === '/') {
					uni.showToast({ title: '历史数据路径不能为空', icon: 'none' }); return
				}
				if (!this.form.base_data_path || this.form.base_data_path === '/') {
					uni.showToast({ title: '基础数据路径不能为空', icon: 'none' }); return
				}
				const res = await this.ubus('set_record_base', {
					enable: this.form.enable ? 1 : 0,
					record_time: this.form.record_time,
					app_valid_time: this.form.app_valid_time,
					history_data_size: sizeStr,
					history_data_path: this.form.history_data_path.trim(),
					base_data_path: this.form.base_data_path.trim()
				})
				if (res && (res.code === 0 || res.code === 2000)) {
					uni.showToast({ title: this.$t('fwx_record.save_success'), icon: 'success' })
				} else {
					uni.showToast({ title: (res && res.msg) || this.$t('fwx_record.save_failed'), icon: 'none' })
				}
			} catch (e) {
				uni.showToast({ title: this.$t('fwx_record.save_failed'), icon: 'none' })
			} finally {
				this.baseSaving = false
			}
		},

		confirmClean() {
			uni.showModal({
				title: this.$t('fwx_record.clean_confirm_title'),
				content: this.$t('fwx_record.clean_confirm'),
				confirmColor: '#FF3B30',
				success: async (res) => {
					if (!res.confirm) return
					this.cleaning = true
					try {
						const r = await this.ubus('record_action', { action: 'clean_all_data' })
						if (r && (r.code === 0 || r.code === 2000)) {
							uni.showToast({ title: this.$t('fwx_record.clean_success'), icon: 'success' })
							setTimeout(() => this.loadBase(), 1000)
						} else {
							uni.showToast({ title: this.$t('fwx_record.clean_failed'), icon: 'none' })
						}
					} catch (e) {
						uni.showToast({ title: this.$t('fwx_record.clean_failed'), icon: 'none' })
					} finally {
						this.cleaning = false
					}
				}
			})
		},

		formatDataSize(status) {
			if (!status) return '--'
			const size = status.data_size || 0
			const unit = status.data_size_unit || 'KB'
			if (unit === 'KB' && size >= 1024) {
				const mb = size / 1024
				return (mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)) + ' MB'
			}
			return `${size} ${unit}`
		},

		// ── Tab 1: whitelist ──────────────────

		async loadWhitelist() {
			this.wlLoading = true
			try {
				// ubus returns unwrapped data: {list, total_num, total_page, page, page_size}
				const res = await this.ubus('get_record_whitelist', { page: this.wlPage, page_size: 50 })
				if (res) {
					this.whitelist = Array.isArray(res.list) ? res.list : []
					this.wlTotalNum = parseInt(res.total_num || 0)
					this.wlTotalPage = Math.max(1, parseInt(res.total_page || 1))
					this.wlPage = parseInt(res.page || this.wlPage)
				}
				this.tabLoaded[1] = true
			} catch (e) { this.whitelist = [] }
			finally { this.wlLoading = false }
		},

		async gotoPage(p) {
			if (p < 1 || p > this.wlTotalPage || p === this.wlPage) return
			this.wlPage = p
			await this.loadWhitelist()
		},

		async openUserPicker() {
			this.selectedMacs = []
			this.pickerVisible = true
			this.usersLoading = true
			// Use already-loaded whitelist to filter out existing entries
			this.wlMacSet = this.whitelist.map(u => (u.mac || '').toUpperCase()).filter(Boolean)
			try {
				const usersData = await this.ubus('get_all_users', { flag: 2, page: 0 })
				this.allUsers = usersData?.list || []
			} catch (e) { /* ignore */ }
			finally { this.usersLoading = false }
		},

		toggleUserSelect(mac) {
			const idx = this.selectedMacs.indexOf(mac)
			if (idx >= 0) this.selectedMacs.splice(idx, 1)
			else this.selectedMacs.push(mac)
		},

		async addSelected() {
			if (!this.selectedMacs.length) return
			const macs = [...this.selectedMacs]
			this.pickerVisible = false
			this.selectedMacs = []
			try {
				const res = await this.ubus('add_record_whitelist', { mac_list: macs })
				if (res && (res.code === 0 || res.code === 2000)) {
					uni.showToast({ title: this.$t('fwx_record.add_success'), icon: 'success' })
					this.wlPage = 1
					this.loadWhitelist()
				} else {
					uni.showToast({ title: this.$t('fwx_record.add_failed'), icon: 'none' })
				}
			} catch (e) {
				uni.showToast({ title: this.$t('fwx_record.add_failed'), icon: 'none' })
			}
		},

		confirmRemove(item) {
			uni.showModal({
				title: this.$t('fwx_record.remove_confirm_title'),
				content: this.$t('fwx_record.remove_confirm'),
				confirmColor: '#FF3B30',
				success: async (res) => {
					if (!res.confirm) return
					try {
						const r = await this.ubus('del_record_whitelist', { mac: item.mac })
						if (r && (r.code === 0 || r.code === 2000)) {
							uni.showToast({ title: this.$t('fwx_record.remove_success'), icon: 'success' })
							this.loadWhitelist()
						} else {
							uni.showToast({ title: this.$t('fwx_record.remove_failed'), icon: 'none' })
						}
					} catch (e) {
						uni.showToast({ title: this.$t('fwx_record.remove_failed'), icon: 'none' })
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.ir-page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }

/* nav */
.ir-nav { display: flex; align-items: center; padding: 88rpx 24rpx 20rpx; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.ir-back { width: 60rpx; display: flex; align-items: center; }
.ir-back-icon { width: 36rpx; }
.ir-nav-title { flex: 1; font-size: 32rpx; font-weight: 600; color: #1c1c1e; text-align: center; }
.ir-nav-right { width: 60rpx; display: flex; justify-content: flex-end; align-items: center; }
.ir-add-btn { width: 56rpx; height: 56rpx; background: #007AFF; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.ir-add-text { font-size: 36rpx; color: #fff; font-weight: 300; line-height: 1; }

/* tabs */
.ir-tabs { display: flex; background: #fff; border-bottom: 1rpx solid rgba(0,0,0,0.08); flex-shrink: 0; }
.ir-tab { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24rpx 0 20rpx; position: relative; }
.ir-tab-active::after { content: ''; position: absolute; bottom: 0; left: 20%; right: 20%; height: 4rpx; background: #007AFF; border-radius: 2rpx; }
.ir-tab-text { font-size: 26rpx; color: #8e8e93; }
.ir-tab-text-active { color: #007AFF; font-weight: 600; }

/* scroll & state */
.ir-scroll { background: #F2F2F7; }
.ir-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 40rpx; gap: 16rpx; }
.ir-state-text { font-size: 28rpx; color: #8e8e93; }
.ir-state-hint { font-size: 24rpx; color: #aeaeb2; }

/* section */
.ir-section { padding: 24rpx 24rpx 0; }
.ir-card { background: #fff; border-radius: 20rpx; overflow: hidden; }

/* toggle row */
.ir-toggle-row { display: flex; align-items: center; padding: 24rpx 28rpx; gap: 16rpx; }
.ir-field-info { flex: 1; }
.ir-field-label { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; }
.ir-field-desc { font-size: 22rpx; color: #8e8e93; margin-top: 4rpx; display: block; }

/* generic row */
.ir-row { display: flex; align-items: center; padding: 24rpx 28rpx; gap: 16rpx; }
.ir-row-border { border-top: 1rpx solid rgba(0,0,0,0.06); }
.ir-row-info { flex: 1; }
.ir-row-label { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; }
.ir-row-desc { font-size: 22rpx; color: #8e8e93; margin-top: 4rpx; display: block; }
.ir-row-right { display: flex; align-items: center; gap: 8rpx; }
.ir-row-value { font-size: 26rpx; color: #8e8e93; }
.ir-row-arrow { font-size: 32rpx; color: #c7c7cc; }

/* data usage clean button */
.ir-clean-btn { margin-left: 12rpx; padding: 8rpx 20rpx; background: rgba(255,59,48,0.1); border-radius: 10rpx; min-width: 80rpx; display: flex; align-items: center; justify-content: center; }
.ir-clean-text { font-size: 24rpx; color: #FF3B30; }

/* field rows (path/size inputs) */
.ir-field-row { display: flex; align-items: center; padding: 20rpx 28rpx; gap: 16rpx; }
.ir-field-label2 { font-size: 26rpx; color: #1c1c1e; font-weight: 500; width: 180rpx; flex-shrink: 0; }
.ir-input-wrap { flex: 1; display: flex; align-items: center; gap: 8rpx; }
.ir-input { flex: 1; font-size: 26rpx; color: #1c1c1e; text-align: right; background: transparent; }
.ir-input-path { text-align: right; font-size: 24rpx; color: #3c3c43; }
.ir-input-unit { font-size: 24rpx; color: #8e8e93; flex-shrink: 0; }
.ir-field-hint { font-size: 22rpx; color: #aeaeb2; display: block; padding: 0 28rpx 16rpx; }

/* save button */
.ir-save-btn { background: #007AFF; border-radius: 16rpx; height: 88rpx; display: flex; align-items: center; justify-content: center; }
.ir-btn-loading { opacity: 0.7; }
.ir-save-text { font-size: 30rpx; font-weight: 600; color: #fff; }
.ir-spin { width: 40rpx; height: 40rpx; border: 4rpx solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
.ir-spin-sm { width: 28rpx; height: 28rpx; border: 3rpx solid rgba(255,59,48,0.3); border-top-color: #FF3B30; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* whitelist list */
.ir-list-wrap { padding: 24rpx; }
.ir-wl-item { display: flex; align-items: center; padding: 24rpx 28rpx; }
.ir-user-info { flex: 1; }
.ir-user-name { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; }
.ir-user-mac { font-size: 22rpx; color: #8e8e93; display: block; margin-top: 4rpx; font-family: monospace; }
.ir-del-btn { padding: 8rpx 16rpx; }
.ir-del-text { font-size: 26rpx; color: #FF3B30; }

/* pagination */
.ir-pagination { display: flex; align-items: center; justify-content: center; gap: 24rpx; padding: 24rpx; }
.ir-page-btn { width: 64rpx; height: 64rpx; background: #fff; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; }
.ir-page-btn-dis { opacity: 0.35; }
.ir-page-btn-text { font-size: 36rpx; color: #007AFF; }
.ir-page-info { font-size: 26rpx; color: #8e8e93; }

/* picker modal */
.ir-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.ir-picker-sheet { background: #fff; border-radius: 24rpx 24rpx 0 0; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
.ir-picker-head { display: flex; align-items: center; justify-content: space-between; padding: 32rpx 32rpx 16rpx; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.ir-picker-title { font-size: 30rpx; font-weight: 600; color: #1c1c1e; }
.ir-picker-close { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }
.ir-picker-close-text { font-size: 28rpx; color: #8e8e93; }
.ir-picker-hint { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 32rpx; background: #F2F2F7; flex-shrink: 0; }
.ir-picker-hint-text { font-size: 24rpx; color: #8e8e93; }
.ir-picker-confirm-btn { padding: 8rpx 24rpx; background: #007AFF; border-radius: 10rpx; }
.ir-picker-confirm-text { font-size: 24rpx; color: #fff; font-weight: 600; }
.ir-picker-item { display: flex; align-items: center; padding: 20rpx 32rpx; border-bottom: 1rpx solid rgba(0,0,0,0.04); gap: 20rpx; }
.ir-picker-check { width: 40rpx; height: 40rpx; border-radius: 8rpx; border: 2rpx solid rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ir-picker-check-on { background: #007AFF; border-color: #007AFF; }
.ir-check-mark { font-size: 24rpx; color: #fff; font-weight: 700; }
.ir-picker-info { flex: 1; min-width: 0; }
.ir-picker-name { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ir-picker-sub { font-size: 22rpx; color: #8e8e93; display: block; margin-top: 4rpx; }
.ir-picker-status { padding: 4rpx 14rpx; border-radius: 20rpx; flex-shrink: 0; }
.ir-status-on { background: rgba(52,199,89,0.15); }
.ir-status-off { background: rgba(142,142,147,0.12); }
.ir-picker-status-text { font-size: 22rpx; font-weight: 500; }
.ir-status-on .ir-picker-status-text { color: #34C759; }
.ir-status-off .ir-picker-status-text { color: #8e8e93; }
</style>
