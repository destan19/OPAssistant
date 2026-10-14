<template>
	<view class="mf-page">
		<!-- nav -->
		<view class="mf-nav">
			<view class="mf-back" @click="goBack">
				<image src="/static/back.png" mode="widthFix" class="mf-back-icon" />
			</view>
			<text class="mf-nav-title">{{ $t('fwx_more.mac_filter') }}</text>
			<view class="mf-nav-action">
				<view v-if="activeTab === 0 || activeTab === 1" class="mf-add-btn" @click="onNavAdd">
					<text class="mf-add-text">+</text>
				</view>
				<view v-else style="width: 60rpx;"></view>
			</view>
		</view>

		<!-- segment tabs -->
		<view class="mf-tabs">
			<view
				v-for="(tab, i) in tabs"
				:key="i"
				class="mf-tab"
				:class="{ 'mf-tab-active': activeTab === i }"
				@click="switchTab(i)"
			>
				<text class="mf-tab-text" :class="{ 'mf-tab-text-active': activeTab === i }">{{ tab }}</text>
			</view>
		</view>

		<!-- ── Tab 0: 过滤规则 ────────────────────── -->
		<scroll-view v-if="activeTab === 0" scroll-y style="flex: 1;" class="mf-scroll">
			<view v-if="rulesLoading" class="mf-state">
				<text class="mf-state-text">{{ $t('fwx_common.loading') }}</text>
			</view>
			<view v-else-if="rules.length === 0" class="mf-state">
				<text class="mf-state-text">{{ $t('fwx_mac_filter.no_rules') }}</text>
				<text class="mf-state-hint">{{ $t('fwx_mac_filter.add_rule_hint') }}</text>
			</view>
			<view v-else class="mf-list-wrap">
				<view v-for="rule in rules" :key="rule.id" class="mf-rule-card">
					<!-- name + badge -->
					<view class="mf-rc-head">
						<text class="mf-rc-name">{{ rule.name }}</text>
						<view class="mf-badge" :class="rule.enabled ? 'mf-badge-on' : 'mf-badge-off'">
							<text class="mf-badge-text">{{ rule.enabled ? $t('fwx_mac_filter.rule_enabled') : $t('fwx_mac_filter.rule_disabled') }}</text>
						</view>
					</view>
					<!-- mode row -->
					<view class="mf-rc-row">
						<text class="mf-rc-mode">{{ rule.mode === 1 ? $t('fwx_mac_filter.mode_all') : $t('fwx_mac_filter.mode_single') }}</text>
						<text v-if="rule.mode === 2" class="mf-rc-user">{{ rule.user_name || rule.user_mac }}</text>
					</view>
					<!-- time mode + summary -->
					<view class="mf-rc-row">
						<text class="mf-rc-tag">{{ getTimeModeText(rule.time_mode) }}</text>
						<text class="mf-rc-time">{{ getTimeSummary(rule) }}</text>
					</view>
					<!-- actions -->
					<view class="mf-rc-actions">
						<view class="mf-rc-btn mf-rc-edit-btn" @click="editRule(rule)">
							<text class="mf-rc-btn-text">{{ $t('device_list.edit') }}</text>
						</view>
						<view class="mf-rc-btn mf-rc-del-btn" @click="confirmDeleteRule(rule)">
							<text class="mf-rc-btn-text mf-rc-del-text">{{ $t('device_list.delete') }}</text>
						</view>
					</view>
				</view>
			</view>
			<view style="height: 40rpx;"></view>
		</scroll-view>

		<!-- ── Tab 1: 白名单 ──────────────────────── -->
		<scroll-view v-if="activeTab === 1" scroll-y style="flex: 1;" class="mf-scroll">
			<view v-if="whitelistLoading" class="mf-state">
				<text class="mf-state-text">{{ $t('fwx_common.loading') }}</text>
			</view>
			<view v-else-if="whitelist.length === 0" class="mf-state">
				<text class="mf-state-text">{{ $t('fwx_mac_filter.no_whitelist') }}</text>
				<text class="mf-state-hint">{{ $t('fwx_mac_filter.whitelist_hint') }}</text>
			</view>
			<view v-else class="mf-list-wrap">
				<view class="mf-wl-card">
					<view
						v-for="(user, i) in whitelist"
						:key="user.mac"
						class="mf-wl-item"
						:class="{ 'mf-wl-item-border': i > 0 }"
					>
						<view class="mf-user-info">
							<text class="mf-user-name">{{ user.nickname || user.hostname || user.mac }}</text>
							<text class="mf-user-sub">{{ user.mac }}</text>
						</view>
						<view class="mf-del-btn" @click="confirmRemoveWhitelist(user)">
							<text class="mf-del-text">{{ $t('device_list.delete') }}</text>
						</view>
					</view>
				</view>
			</view>
			<view style="height: 40rpx;"></view>
		</scroll-view>

		<!-- ── Tab 2: 高级设置 ────────────────────── -->
		<scroll-view v-if="activeTab === 2" scroll-y style="flex: 1;" class="mf-scroll">
			<view v-if="advLoading" class="mf-state">
				<text class="mf-state-text">{{ $t('fwx_common.loading') }}</text>
			</view>
			<view v-else class="mf-adv-wrap">
				<view class="mf-settings-card">
					<view class="mf-setting-row">
						<view class="mf-setting-info">
							<text class="mf-setting-label">{{ $t('fwx_mac_filter.adv_enable') }}</text>
							<text class="mf-setting-desc">{{ $t('fwx_mac_filter.adv_enable_desc') }}</text>
						</view>
						<switch
							:checked="advEnabled"
							@change="advEnabled = $event.detail.value"
							color="#007AFF"
							style="transform: scale(0.85);"
						/>
					</view>
				</view>
				<view class="mf-save-wrap">
					<view class="mf-save-btn" :class="{ 'mf-save-loading': advSaving }" @click="saveAdvanced">
						<text v-if="!advSaving" class="mf-save-text">{{ $t('fwx_mac_filter.save') }}</text>
						<view v-else class="mf-spin"></view>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- user picker modal (whitelist add) -->
		<view v-if="pickerVisible" class="mf-overlay" @click.stop="pickerVisible = false">
			<view class="mf-picker-sheet" @click.stop>
				<view class="mf-picker-head">
					<text class="mf-picker-title">{{ $t('fwx_mac_filter.select_user_title') }}</text>
					<view class="mf-picker-close" @click="pickerVisible = false">
						<text class="mf-picker-close-text">✕</text>
					</view>
				</view>
				<scroll-view scroll-y style="max-height: 600rpx; overflow: hidden;">
					<view v-if="usersLoading" style="padding: 60rpx; text-align: center;">
						<text class="mf-state-text">{{ $t('fwx_mac_filter.loading_users') }}</text>
					</view>
					<view v-else-if="filteredAllUsers.length === 0" style="padding: 60rpx; text-align: center;">
						<text class="mf-state-text">{{ $t('fwx_mac_filter.no_users') }}</text>
					</view>
					<view v-else>
						<view
							v-for="user in filteredAllUsers"
							:key="user.mac"
							class="mf-picker-item"
							@click="addToWhitelist(user)"
						>
							<view class="mf-user-info">
								<text class="mf-user-name">{{ user.nickname || user.hostname || user.mac }}</text>
								<text class="mf-user-sub">{{ user.mac }}</text>
							</view>
							<text class="mf-picker-plus">+</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'

export default {
	data() {
		return {
			device: null,
			ubusUrl: '',
			activeTab: 0,
			tabLoaded: [false, false, false],

			rulesLoading: false,
			rules: [],

			whitelistLoading: false,
			whitelist: [],
			pickerVisible: false,
			usersLoading: false,
			allUsers: [],

			advLoading: false,
			advEnabled: false,
			advSaving: false
		}
	},

	computed: {
		tabs() {
			return [
				this.$t('fwx_mac_filter.tab_rules'),
				this.$t('fwx_mac_filter.tab_whitelist'),
				this.$t('fwx_mac_filter.tab_advanced')
			]
		},
		filteredAllUsers() {
			const wlMacs = new Set(this.whitelist.map(u => u.mac))
			return this.allUsers.filter(u => !wlMacs.has(u.mac))
		}
	},

	onShow() {
		const device = DeviceManager.getCurrentDevice()
		if (!device) return
		this.device = device
		const protocol = device.useHttps ? 'https' : 'http'
		const host = DeviceManager.formatHostForUrl(device.ip)
		this.ubusUrl = `${protocol}://${host}:${device.port}/ubus`
		this.tabLoaded = [false, false, false]
		this.loadTab(this.activeTab)
	},

	methods: {
		goBack() { uni.navigateBack() },

		switchTab(i) {
			this.activeTab = i
			if (!this.tabLoaded[i]) this.loadTab(i)
		},

		loadTab(i) {
			if (i === 0) this.loadRules()
			else if (i === 1) this.loadWhitelist()
			else if (i === 2) this.loadAdvanced()
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

		async loadRules() {
			this.rulesLoading = true
			try {
				const data = await this.ubus('get_mac_filter_rules')
				this.rules = Array.isArray(data) ? data : (data?.list || [])
				this.tabLoaded[0] = true
			} catch (e) { /* ignore */ }
			finally { this.rulesLoading = false }
		},

		async loadWhitelist() {
			this.whitelistLoading = true
			try {
				const data = await this.ubus('get_mac_filter_whitelist')
				this.whitelist = data?.list || []
				this.tabLoaded[1] = true
			} catch (e) { /* ignore */ }
			finally { this.whitelistLoading = false }
		},

		async loadAdvanced() {
			this.advLoading = true
			try {
				const data = await this.ubus('get_mac_filter_adv')
				this.advEnabled = data?.enable === 1 || data?.enable === '1' || data?.enable === true
				this.tabLoaded[2] = true
			} catch (e) { /* ignore */ }
			finally { this.advLoading = false }
		},

		onNavAdd() {
			if (this.activeTab === 0) this.addRule()
			else if (this.activeTab === 1) this.openUserPicker()
		},

		addRule() {
			getApp().globalData._mfEditRule = null
			uni.navigateTo({ url: '/pages/fanchmwrt/apps/mac_filter_edit' })
		},

		editRule(rule) {
			getApp().globalData._mfEditRule = rule
			uni.navigateTo({ url: '/pages/fanchmwrt/apps/mac_filter_edit' })
		},

		confirmDeleteRule(rule) {
			uni.showModal({
				title: this.$t('fwx_mac_filter.delete_confirm_title'),
				content: this.$t('fwx_mac_filter.delete_confirm_content').replace('{name}', rule.name),
				confirmColor: '#FF3B30',
				success: async (res) => {
					if (!res.confirm) return
					try {
						await this.ubus('delete_mac_filter_rule', { id: rule.id })
						uni.showToast({ title: this.$t('fwx_mac_filter.delete_success'), icon: 'success' })
						this.loadRules()
					} catch (e) {
						uni.showToast({ title: this.$t('fwx_mac_filter.delete_failed'), icon: 'none' })
					}
				}
			})
		},

		async openUserPicker() {
			this.pickerVisible = true
			if (!this.allUsers.length) {
				this.usersLoading = true
				try {
					const data = await this.ubus('get_all_users', { flag: 2, page: 0 })
					this.allUsers = data?.list || []
				} catch (e) { /* ignore */ }
				finally { this.usersLoading = false }
			}
		},

		async addToWhitelist(user) {
			this.pickerVisible = false
			try {
				await this.ubus('add_mac_filter_whitelist', { mac_list: [user.mac] })
				uni.showToast({ title: this.$t('fwx_common.save_success'), icon: 'success' })
				this.loadWhitelist()
			} catch (e) {
				uni.showToast({ title: this.$t('fwx_common.save_failed'), icon: 'none' })
			}
		},

		confirmRemoveWhitelist(user) {
			uni.showModal({
				title: this.$t('fwx_mac_filter.delete_confirm_title'),
				content: this.$t('fwx_mac_filter.del_whitelist_confirm'),
				confirmColor: '#FF3B30',
				success: async (res) => {
					if (!res.confirm) return
					try {
						await this.ubus('del_mac_filter_whitelist', { mac: user.mac })
						uni.showToast({ title: this.$t('fwx_mac_filter.delete_success'), icon: 'success' })
						this.loadWhitelist()
					} catch (e) {
						uni.showToast({ title: this.$t('fwx_mac_filter.delete_failed'), icon: 'none' })
					}
				}
			})
		},

		async saveAdvanced() {
			this.advSaving = true
			try {
				await this.ubus('set_mac_filter_adv', { enable: this.advEnabled ? 1 : 0 })
				uni.showToast({ title: this.$t('fwx_mac_filter.save_success'), icon: 'success' })
			} catch (e) {
				uni.showToast({ title: this.$t('fwx_mac_filter.save_failed'), icon: 'none' })
			} finally {
				this.advSaving = false
			}
		},

		getTimeModeText(timeMode) {
			const m = parseInt(timeMode)
			if (m === 2) return this.$t('fwx_mac_filter.time_mode_duration')
			if (m === 3) return this.$t('fwx_mac_filter.time_mode_traffic')
			return this.$t('fwx_mac_filter.time_mode_range')
		},

		getTimeSummary(rule) {
			const m = parseInt(rule.time_mode)
			const dayKeys = ['wd_sun', 'wd_mon', 'wd_tue', 'wd_wed', 'wd_thu', 'wd_fri', 'wd_sat']
			const weekOrder = [1, 2, 3, 4, 5, 6, 0]
			if (m === 2) return this._limitSummary(rule.time_limit, 'min', weekOrder, dayKeys)
			if (m === 3) return this._limitSummary(rule.flow_limit, 'MB', weekOrder, dayKeys)
			const tr = rule.time_rules && rule.time_rules[0]
			if (!tr) return ''
			const days = (tr.weekdays || []).map(d => this.$t('fwx_mac_filter.' + dayKeys[d])).join('')
			return `${days} ${tr.start_time || '00:00'}-${tr.end_time || '23:59'}`
		},

		_limitSummary(limitStr, unit, weekOrder, dayKeys) {
			if (!limitStr) return ''
			const map = {}
			String(limitStr).split(',').forEach(pair => {
				const m = pair.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/)
				if (m) map[parseInt(m[1])] = parseInt(m[2])
			})
			return weekOrder.map(d => `${this.$t('fwx_mac_filter.' + dayKeys[d])}:${map[d] || 0}${unit}`).join(' ')
		}
	}
}
</script>

<style scoped>
.mf-page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }

/* nav */
.mf-nav { display: flex; align-items: center; padding: 88rpx 24rpx 20rpx; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.mf-back { width: 60rpx; display: flex; align-items: center; }
.mf-back-icon { width: 36rpx; }
.mf-nav-title { flex: 1; font-size: 32rpx; font-weight: 600; color: #1c1c1e; text-align: center; }
.mf-nav-action { width: 60rpx; display: flex; justify-content: flex-end; align-items: center; }
.mf-add-btn { width: 56rpx; height: 56rpx; background: #007AFF; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.mf-add-text { font-size: 36rpx; color: #fff; font-weight: 300; line-height: 1; }

/* tabs */
.mf-tabs { display: flex; background: #fff; border-bottom: 1rpx solid rgba(0,0,0,0.08); flex-shrink: 0; }
.mf-tab { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24rpx 0 20rpx; position: relative; }
.mf-tab-active::after { content: ''; position: absolute; bottom: 0; left: 20%; right: 20%; height: 4rpx; background: #007AFF; border-radius: 2rpx; }
.mf-tab-text { font-size: 26rpx; color: #8e8e93; }
.mf-tab-text-active { color: #007AFF; font-weight: 600; }

/* scroll + state */
.mf-scroll { background: #F2F2F7; }
.mf-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 40rpx; gap: 16rpx; }
.mf-state-text { font-size: 28rpx; color: #8e8e93; }
.mf-state-hint { font-size: 24rpx; color: #aeaeb2; }

/* rule cards */
.mf-list-wrap { padding: 24rpx; display: flex; flex-direction: column; gap: 20rpx; }
.mf-rule-card { background: #fff; border-radius: 20rpx; padding: 28rpx 28rpx 0; overflow: hidden; }
.mf-rc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.mf-rc-name { font-size: 30rpx; font-weight: 600; color: #1c1c1e; flex: 1; margin-right: 16rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mf-badge { padding: 4rpx 14rpx; border-radius: 20rpx; flex-shrink: 0; }
.mf-badge-on { background: rgba(52,199,89,0.15); }
.mf-badge-off { background: rgba(142,142,147,0.15); }
.mf-badge-text { font-size: 22rpx; font-weight: 500; }
.mf-badge-on .mf-badge-text { color: #34C759; }
.mf-badge-off .mf-badge-text { color: #8e8e93; }
.mf-rc-row { display: flex; align-items: center; gap: 12rpx; padding: 10rpx 0; border-top: 1rpx solid rgba(0,0,0,0.04); flex-wrap: wrap; }
.mf-rc-mode { font-size: 26rpx; color: #3c3c43; }
.mf-rc-user { font-size: 24rpx; color: #8e8e93; }
.mf-rc-tag { font-size: 22rpx; color: #fff; background: #5856D6; padding: 3rpx 12rpx; border-radius: 8rpx; flex-shrink: 0; }
.mf-rc-time { font-size: 24rpx; color: #3c3c43; flex: 1; }
.mf-rc-actions { display: flex; border-top: 1rpx solid rgba(0,0,0,0.06); margin: 0 -28rpx; }
.mf-rc-btn { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24rpx 0; }
.mf-rc-edit-btn { border-right: 1rpx solid rgba(0,0,0,0.06); }
.mf-rc-btn-text { font-size: 26rpx; color: #007AFF; }
.mf-rc-del-text { color: #FF3B30; }

/* whitelist */
.mf-wl-card { margin: 24rpx; background: #fff; border-radius: 20rpx; overflow: hidden; }
.mf-wl-item { display: flex; align-items: center; padding: 24rpx 28rpx; }
.mf-wl-item-border { border-top: 1rpx solid rgba(0,0,0,0.06); }
.mf-user-info { flex: 1; }
.mf-user-name { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; }
.mf-user-sub { font-size: 22rpx; color: #8e8e93; margin-top: 4rpx; display: block; }
.mf-del-btn { padding: 8rpx 16rpx; }
.mf-del-text { font-size: 26rpx; color: #FF3B30; }

/* advanced */
.mf-adv-wrap { padding: 24rpx; }
.mf-settings-card { background: #fff; border-radius: 20rpx; overflow: hidden; }
.mf-setting-row { display: flex; align-items: center; padding: 28rpx; gap: 16rpx; }
.mf-setting-info { flex: 1; }
.mf-setting-label { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; }
.mf-setting-desc { font-size: 22rpx; color: #8e8e93; margin-top: 4rpx; display: block; }
.mf-save-wrap { margin-top: 32rpx; }
.mf-save-btn { background: #007AFF; border-radius: 16rpx; height: 88rpx; display: flex; align-items: center; justify-content: center; }
.mf-save-loading { opacity: 0.7; }
.mf-save-text { font-size: 30rpx; font-weight: 600; color: #fff; }
.mf-spin { width: 40rpx; height: 40rpx; border: 4rpx solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* user picker */
.mf-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.mf-picker-sheet { background: #fff; border-radius: 24rpx 24rpx 0 0; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
.mf-picker-head { display: flex; align-items: center; justify-content: space-between; padding: 32rpx 32rpx 20rpx; border-bottom: 1rpx solid rgba(0,0,0,0.06); }
.mf-picker-title { font-size: 30rpx; font-weight: 600; color: #1c1c1e; }
.mf-picker-close { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }
.mf-picker-close-text { font-size: 28rpx; color: #8e8e93; }
.mf-picker-item { display: flex; align-items: center; padding: 24rpx 32rpx; border-bottom: 1rpx solid rgba(0,0,0,0.04); }
.mf-picker-plus { font-size: 36rpx; color: #007AFF; font-weight: 300; margin-left: 16rpx; }
</style>
