<template>
	<view class="af-page">
		<!-- nav -->
		<view class="af-nav">
			<view class="af-back" @click="goBack">
				<image src="/static/back.png" mode="widthFix" class="af-back-icon" />
			</view>
			<text class="af-nav-title">{{ $t('fwx_more.app_filter') }}</text>
			<view class="af-nav-action">
				<view v-if="activeTab === 0 || activeTab === 1" class="af-add-btn" @click="onNavAdd">
					<text class="af-add-text">+</text>
				</view>
				<view v-else style="width: 60rpx;"></view>
			</view>
		</view>

		<!-- segment tabs -->
		<view class="af-tabs">
			<view
				v-for="(tab, i) in tabs"
				:key="i"
				class="af-tab"
				:class="{ 'af-tab-active': activeTab === i }"
				@click="switchTab(i)"
			>
				<text class="af-tab-text" :class="{ 'af-tab-text-active': activeTab === i }">{{ tab }}</text>
			</view>
		</view>

		<!-- ── Tab 0: 过滤规则 ─────────────────── -->
		<scroll-view v-if="activeTab === 0" scroll-y style="flex: 1;" class="af-scroll">
			<view v-if="rulesLoading" class="af-state">
				<text class="af-state-text">{{ $t('fwx_common.loading') }}</text>
			</view>
			<view v-else-if="rules.length === 0" class="af-state">
				<text class="af-state-text">{{ $t('fwx_app_filter.no_rules') }}</text>
				<text class="af-state-hint">{{ $t('fwx_app_filter.add_rule_hint') }}</text>
			</view>
			<view v-else class="af-list-wrap">
				<view v-for="rule in rules" :key="rule.id" class="af-rule-card">
					<!-- header: name + status badge -->
					<view class="af-rc-head">
						<text class="af-rc-name">{{ rule.name }}</text>
						<view class="af-badge" :class="rule.enabled ? 'af-badge-on' : 'af-badge-off'">
							<text class="af-badge-text">{{ rule.enabled ? $t('fwx_app_filter.rule_enabled') : $t('fwx_app_filter.rule_disabled') }}</text>
						</view>
					</view>

					<!-- mode row -->
					<view class="af-rc-row">
						<text class="af-rc-mode">{{ rule.mode === 1 ? $t('fwx_app_filter.mode_all') : $t('fwx_app_filter.mode_single') }}</text>
						<text v-if="rule.mode === 2 && rule.user_name" class="af-rc-user">{{ rule.user_name }}</text>
						<text v-else-if="rule.mode === 2 && rule.user_mac" class="af-rc-user">{{ rule.user_mac }}</text>
					</view>

					<!-- first time rule -->
					<view v-if="rule.time_rules && rule.time_rules.length" class="af-rc-row">
						<text class="af-rc-time">{{ formatTimeRule(rule.time_rules[0]) }}</text>
						<text v-if="rule.time_rules.length > 1" class="af-rc-more"> +{{ rule.time_rules.length - 1 }}</text>
					</view>

					<!-- app summary -->
					<view v-if="getAppSummary(rule)" class="af-rc-row">
						<text class="af-rc-apps">{{ getAppSummary(rule) }}</text>
					</view>

					<!-- actions -->
					<view class="af-rc-actions">
						<view class="af-rc-btn af-rc-edit-btn" @click="editRule(rule)">
							<text class="af-rc-btn-text">{{ $t('device_list.edit') }}</text>
						</view>
						<view class="af-rc-btn af-rc-del-btn" @click="confirmDeleteRule(rule)">
							<text class="af-rc-btn-text af-rc-del-text">{{ $t('device_list.delete') }}</text>
						</view>
					</view>
				</view>
			</view>
			<view style="height: 40rpx;"></view>
		</scroll-view>

		<!-- ── Tab 1: 白名单 ─────────────────────── -->
		<scroll-view v-if="activeTab === 1" scroll-y style="flex: 1;" class="af-scroll">
			<view v-if="whitelistLoading" class="af-state">
				<text class="af-state-text">{{ $t('fwx_common.loading') }}</text>
			</view>
			<view v-else-if="whitelist.length === 0" class="af-state">
				<text class="af-state-text">{{ $t('fwx_app_filter.no_whitelist') }}</text>
				<text class="af-state-hint">{{ $t('fwx_app_filter.whitelist_hint') }}</text>
			</view>
			<view v-else class="af-list-wrap">
				<view class="af-wl-card">
					<view
						v-for="(user, i) in whitelist"
						:key="user.mac"
						class="af-wl-item"
						:class="{ 'af-wl-item-border': i > 0 }"
					>
						<view class="af-user-info">
							<text class="af-user-name">{{ user.nickname || user.hostname || user.mac }}</text>
							<text class="af-user-sub">{{ user.mac }}</text>
						</view>
						<view class="af-del-btn" @click="confirmRemoveWhitelist(user)">
							<text class="af-del-text">{{ $t('device_list.delete') }}</text>
						</view>
					</view>
				</view>
			</view>
			<view style="height: 40rpx;"></view>
		</scroll-view>

		<!-- ── Tab 2: 高级设置 ─────────────────── -->
		<scroll-view v-if="activeTab === 2" scroll-y style="flex: 1;" class="af-scroll">
			<view v-if="advLoading" class="af-state">
				<text class="af-state-text">{{ $t('fwx_common.loading') }}</text>
			</view>
			<view v-else class="af-adv-wrap">
				<view class="af-settings-card">
					<view class="af-setting-row">
						<view class="af-setting-info">
							<text class="af-setting-label">{{ $t('fwx_app_filter.adv_enable') }}</text>
							<text class="af-setting-desc">{{ $t('fwx_app_filter.adv_enable_desc') }}</text>
						</view>
						<switch
							:checked="advEnabled"
							@change="advEnabled = $event.detail.value"
							color="#007AFF"
							style="transform: scale(0.85);"
						/>
					</view>
				</view>
				<view class="af-save-wrap">
					<view class="af-save-btn" :class="{ 'af-save-loading': advSaving }" @click="saveAdvanced">
						<text v-if="!advSaving" class="af-save-text">{{ $t('fwx_app_filter.save') }}</text>
						<view v-else class="af-spin"></view>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- user picker modal (for whitelist add) -->
		<view v-if="pickerVisible" class="af-overlay" @click.stop="pickerVisible = false">
			<view class="af-picker-sheet" @click.stop>
				<view class="af-picker-head">
					<text class="af-picker-title">{{ $t('fwx_app_filter.select_user_title') }}</text>
					<view class="af-picker-close" @click="pickerVisible = false">
						<text class="af-picker-close-text">✕</text>
					</view>
				</view>
				<scroll-view scroll-y style="max-height: 600rpx; overflow: hidden;">
					<view v-if="usersLoading" style="padding: 60rpx; text-align: center;">
						<text class="af-state-text">{{ $t('fwx_app_filter.loading_users') }}</text>
					</view>
					<view v-else-if="filteredAllUsers.length === 0" style="padding: 60rpx; text-align: center;">
						<text class="af-state-text">{{ $t('fwx_app_filter.no_users') }}</text>
					</view>
					<view v-else>
						<view
							v-for="user in filteredAllUsers"
							:key="user.mac"
							class="af-picker-item"
							@click="addToWhitelist(user)"
						>
							<view class="af-user-info">
								<text class="af-user-name">{{ user.nickname || user.hostname || user.mac }}</text>
								<text class="af-user-sub">{{ user.mac }}</text>
							</view>
							<text class="af-picker-plus">+</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'

function expandAppIds(appIds) {
	const result = []
	if (!appIds) return result
	for (const item of appIds) {
		const s = String(item)
		if (s.includes('-')) {
			const [a, b] = s.split('-')
			for (let i = parseInt(a); i <= parseInt(b); i++) result.push(i)
		} else {
			result.push(parseInt(s))
		}
	}
	return result
}

export default {
	data() {
		return {
			device: null,
			ubusUrl: '',
			activeTab: 0,
			tabLoaded: [false, false, false],

			rulesLoading: false,
			rules: [],
			classList: [],

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
				this.$t('fwx_app_filter.tab_rules'),
				this.$t('fwx_app_filter.tab_whitelist'),
				this.$t('fwx_app_filter.tab_advanced')
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
			console.log("api = ", api)
			console.log("res = ", JSON.stringify(res))
			const payload = res?.data?.result?.[1]
			console.log("payload = " , payload)
			if (!payload || (payload.code !== undefined && Number(payload.code) !== 2000)) {
				throw new Error(`ubus ${api} failed: ${payload?.code ?? 'invalid response'}`)
			}
			return (payload && payload.data) ? payload.data : payload
		},

		async loadRules() {
			this.rulesLoading = true
			try {
				if (!this.classList.length) {
					const cd = await this.ubus('class_list')
					console.log('[app_filter] class_list raw:', JSON.stringify(cd))
					this.classList = cd?.class_list || []
					console.log('[app_filter] classList length:', this.classList.length)
				}
				const data = await this.ubus('get_filter_rules')
				this.rules = Array.isArray(data) ? data : (data?.list || [])
				this.tabLoaded[0] = true
			} catch (e) {
				/* ignore */
			} finally {
				this.rulesLoading = false
			}
		},

		async loadWhitelist() {
			this.whitelistLoading = true
			try {
				const data = await this.ubus('get_appfilter_whitelist')
				this.whitelist = data?.list || []
				this.tabLoaded[1] = true
			} catch (e) {
				/* ignore */
			} finally {
				this.whitelistLoading = false
			}
		},

		async loadAdvanced() {
			this.advLoading = true
			try {
				const data = await this.ubus('get_app_filter_adv')
				this.advEnabled = data?.enable === 1 || data?.enable === '1' || data?.enable === true
				this.tabLoaded[2] = true
			} catch (e) {
				/* ignore */
			} finally {
				this.advLoading = false
			}
		},

		onNavAdd() {
			if (this.activeTab === 0) this.addRule()
			else if (this.activeTab === 1) this.openUserPicker()
		},

		addRule() {
			getApp().globalData._afClassList = this.classList
			getApp().globalData._afEditRule = null
			uni.navigateTo({ url: '/pages/fanchmwrt/apps/app_filter_edit' })
		},

		editRule(rule) {
			getApp().globalData._afClassList = this.classList
			getApp().globalData._afEditRule = rule
			uni.navigateTo({ url: '/pages/fanchmwrt/apps/app_filter_edit' })
		},

		confirmDeleteRule(rule) {
			uni.showModal({
				title: this.$t('fwx_app_filter.delete_confirm_title'),
				content: this.$t('fwx_app_filter.delete_confirm_content').replace('{name}', rule.name),
				confirmColor: '#FF3B30',
				success: async (res) => {
					if (!res.confirm) return
					try {
						await this.ubus('delete_filter_rule', { id: rule.id })
						uni.showToast({ title: this.$t('fwx_app_filter.delete_success'), icon: 'success' })
						this.loadRules()
					} catch (e) {
						uni.showToast({ title: this.$t('fwx_app_filter.delete_failed'), icon: 'none' })
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
					console.log('[app_filter] get_all_users raw:', JSON.stringify(data))
					this.allUsers = data?.list || []
					console.log('[app_filter] allUsers length:', this.allUsers.length)
				} catch (e) {
					console.error('[app_filter] get_all_users error:', e)
				} finally {
					this.usersLoading = false
				}
			}
		},

		async addToWhitelist(user) {
			this.pickerVisible = false
			try {
				await this.ubus('add_appfilter_whitelist', { mac_list: [user.mac] })
				uni.showToast({ title: this.$t('fwx_common.save_success'), icon: 'success' })
				this.loadWhitelist()
			} catch (e) {
				uni.showToast({ title: this.$t('fwx_common.save_failed'), icon: 'none' })
			}
		},

		confirmRemoveWhitelist(user) {
			uni.showModal({
				title: this.$t('fwx_app_filter.delete_confirm_title'),
				content: this.$t('fwx_app_filter.del_whitelist_confirm'),
				confirmColor: '#FF3B30',
				success: async (res) => {
					if (!res.confirm) return
					try {
						await this.ubus('del_appfilter_whitelist', { mac: user.mac })
						uni.showToast({ title: this.$t('fwx_app_filter.delete_success'), icon: 'success' })
						this.loadWhitelist()
					} catch (e) {
						uni.showToast({ title: this.$t('fwx_app_filter.delete_failed'), icon: 'none' })
					}
				}
			})
		},

		async saveAdvanced() {
			this.advSaving = true
			try {
				await this.ubus('set_app_filter_adv', { enable: this.advEnabled ? 1 : 0 })
				uni.showToast({ title: this.$t('fwx_app_filter.save_success'), icon: 'success' })
			} catch (e) {
				uni.showToast({ title: this.$t('fwx_app_filter.save_failed'), icon: 'none' })
			} finally {
				this.advSaving = false
			}
		},

		formatTimeRule(tr) {
			const keys = ['wd_sun', 'wd_mon', 'wd_tue', 'wd_wed', 'wd_thu', 'wd_fri', 'wd_sat']
			const dayStr = (tr.weekdays || []).map(d => this.$t('fwx_app_filter.' + keys[d])).join('')
			return `${dayStr} ${tr.start_time || '00:00'}-${tr.end_time || '23:59'}`
		},

		getAppSummary(rule) {
			if (!rule.app_ids || !rule.app_ids.length || !this.classList.length) return ''
			const ids = new Set(expandAppIds(rule.app_ids))
			const parts = []
			for (const cat of this.classList) {
				const cnt = (cat.app_list || []).filter(a => ids.has(parseInt(a.split(',')[0]))).length
				if (cnt > 0) parts.push(`${cat.name}(${cnt})`)
			}
			return parts.join('  ')
		}
	}
}
</script>

<style scoped>
.af-page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }

/* nav */
.af-nav { display: flex; align-items: center; padding: 88rpx 24rpx 20rpx; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.af-back { width: 60rpx; display: flex; align-items: center; }
.af-back-icon { width: 36rpx; }
.af-nav-title { flex: 1; font-size: 32rpx; font-weight: 600; color: #1c1c1e; text-align: center; }
.af-nav-action { width: 60rpx; display: flex; justify-content: flex-end; align-items: center; }
.af-add-btn { width: 56rpx; height: 56rpx; background: #007AFF; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.af-add-text { font-size: 36rpx; color: #fff; font-weight: 300; line-height: 1; }

/* tabs */
.af-tabs { display: flex; background: #fff; border-bottom: 1rpx solid rgba(0,0,0,0.08); flex-shrink: 0; }
.af-tab { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24rpx 0 20rpx; position: relative; }
.af-tab-active::after { content: ''; position: absolute; bottom: 0; left: 20%; right: 20%; height: 4rpx; background: #007AFF; border-radius: 2rpx; }
.af-tab-text { font-size: 26rpx; color: #8e8e93; }
.af-tab-text-active { color: #007AFF; font-weight: 600; }

/* scroll + state */
.af-scroll { background: #F2F2F7; }
.af-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 40rpx; gap: 16rpx; }
.af-state-text { font-size: 28rpx; color: #8e8e93; }
.af-state-hint { font-size: 24rpx; color: #aeaeb2; }

/* rule cards */
.af-list-wrap { padding: 24rpx; display: flex; flex-direction: column; gap: 20rpx; }
.af-rule-card { background: #fff; border-radius: 20rpx; padding: 28rpx 28rpx 0; overflow: hidden; }
.af-rc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.af-rc-name { font-size: 30rpx; font-weight: 600; color: #1c1c1e; flex: 1; margin-right: 16rpx; }
.af-badge { padding: 4rpx 14rpx; border-radius: 20rpx; }
.af-badge-on { background: rgba(52,199,89,0.15); }
.af-badge-off { background: rgba(142,142,147,0.15); }
.af-badge-text { font-size: 22rpx; font-weight: 500; }
.af-badge-on .af-badge-text { color: #34C759; }
.af-badge-off .af-badge-text { color: #8e8e93; }
.af-rc-row { display: flex; align-items: center; gap: 12rpx; padding: 8rpx 0; border-top: 1rpx solid rgba(0,0,0,0.04); }
.af-rc-mode { font-size: 26rpx; color: #3c3c43; }
.af-rc-user { font-size: 24rpx; color: #8e8e93; }
.af-rc-time { font-size: 24rpx; color: #3c3c43; flex: 1; }
.af-rc-more { font-size: 22rpx; color: #007AFF; }
.af-rc-apps { font-size: 24rpx; color: #3c3c43; }
.af-rc-actions { display: flex; gap: 0; border-top: 1rpx solid rgba(0,0,0,0.06); margin: 0 -28rpx; }
.af-rc-btn { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24rpx 0; }
.af-rc-edit-btn { border-right: 1rpx solid rgba(0,0,0,0.06); }
.af-rc-btn-text { font-size: 26rpx; color: #007AFF; }
.af-rc-del-text { color: #FF3B30; }

/* whitelist */
.af-wl-card { margin: 24rpx; background: #fff; border-radius: 20rpx; overflow: hidden; }
.af-wl-item { display: flex; align-items: center; padding: 24rpx 28rpx; }
.af-wl-item-border { border-top: 1rpx solid rgba(0,0,0,0.06); }
.af-user-info { flex: 1; }
.af-user-name { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; }
.af-user-sub { font-size: 22rpx; color: #8e8e93; margin-top: 4rpx; display: block; }
.af-del-btn { padding: 8rpx 16rpx; }
.af-del-text { font-size: 26rpx; color: #FF3B30; }

/* advanced */
.af-adv-wrap { padding: 24rpx; }
.af-settings-card { background: #fff; border-radius: 20rpx; overflow: hidden; }
.af-setting-row { display: flex; align-items: center; padding: 28rpx; gap: 16rpx; }
.af-setting-info { flex: 1; }
.af-setting-label { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; }
.af-setting-desc { font-size: 22rpx; color: #8e8e93; margin-top: 4rpx; display: block; }
.af-save-wrap { margin-top: 32rpx; }
.af-save-btn { background: #007AFF; border-radius: 16rpx; height: 88rpx; display: flex; align-items: center; justify-content: center; }
.af-save-loading { opacity: 0.7; }
.af-save-text { font-size: 30rpx; font-weight: 600; color: #fff; }
.af-spin { width: 40rpx; height: 40rpx; border: 4rpx solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* user picker modal */
.af-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.af-picker-sheet { background: #fff; border-radius: 24rpx 24rpx 0 0; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
.af-picker-head { display: flex; align-items: center; justify-content: space-between; padding: 32rpx 32rpx 20rpx; border-bottom: 1rpx solid rgba(0,0,0,0.06); }
.af-picker-title { font-size: 30rpx; font-weight: 600; color: #1c1c1e; }
.af-picker-close { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }
.af-picker-close-text { font-size: 28rpx; color: #8e8e93; }
.af-picker-item { display: flex; align-items: center; padding: 24rpx 32rpx; border-bottom: 1rpx solid rgba(0,0,0,0.04); }
.af-picker-plus { font-size: 36rpx; color: #007AFF; font-weight: 300; margin-left: 16rpx; }
</style>
