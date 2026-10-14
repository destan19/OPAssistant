<template>
	<view class="afe-page">
		<!-- nav -->
		<view class="afe-nav">
			<view class="afe-back" @click="goBack">
				<image src="/static/back.png" mode="widthFix" class="afe-back-icon" />
			</view>
			<text class="afe-nav-title">{{ editingRule ? $t('fwx_app_filter.edit_rule_title') : $t('fwx_app_filter.add_rule_title') }}</text>
			<view style="width: 60rpx;"></view>
		</view>

		<scroll-view scroll-y style="flex: 1;" class="afe-scroll">
			<!-- ── 基本设置 ────────────────────── -->
			<view class="afe-section">
				<!-- rule name -->
				<view class="afe-card">
					<view class="afe-field">
						<text class="afe-field-label">{{ $t('fwx_app_filter.rule_name') }}</text>
						<input
							class="afe-input"
							v-model="form.name"
							:placeholder="$t('fwx_app_filter.rule_name_placeholder')"
							maxlength="32"
						/>
					</view>
					<view v-if="errors.name" class="afe-field-error">
						<text class="afe-error-text">{{ errors.name }}</text>
					</view>
				</view>

				<!-- enable + filter_quic toggles -->
				<view class="afe-card afe-card-gap">
					<view class="afe-toggle-row">
						<text class="afe-toggle-label">{{ $t('fwx_app_filter.rule_enabled_label') }}</text>
						<switch :checked="form.enabled" @change="form.enabled = $event.detail.value" color="#007AFF" style="transform: scale(0.85);" />
					</view>
					<view class="afe-toggle-row afe-row-border">
						<view class="afe-toggle-info">
							<text class="afe-toggle-label">{{ $t('fwx_app_filter.filter_quic') }}</text>
							<text class="afe-toggle-desc">{{ $t('fwx_app_filter.filter_quic_desc') }}</text>
						</view>
						<switch :checked="form.filterQuic" @change="form.filterQuic = $event.detail.value" color="#007AFF" style="transform: scale(0.85);" />
					</view>
				</view>

				<!-- mode selector -->
				<view class="afe-card afe-card-gap">
					<text class="afe-section-label">{{ $t('fwx_app_filter.mode_label') }}</text>
					<view class="afe-mode-row">
						<view
							class="afe-mode-btn"
							:class="{ 'afe-mode-btn-active': form.mode === 1 }"
							@click="form.mode = 1"
						>
							<text class="afe-mode-text" :class="{ 'afe-mode-text-active': form.mode === 1 }">{{ $t('fwx_app_filter.mode_all') }}</text>
						</view>
						<view
							class="afe-mode-btn"
							:class="{ 'afe-mode-btn-active': form.mode === 2 }"
							@click="form.mode = 2"
						>
							<text class="afe-mode-text" :class="{ 'afe-mode-text-active': form.mode === 2 }">{{ $t('fwx_app_filter.mode_single') }}</text>
						</view>
					</view>
				</view>

				<!-- user selector (single user mode only) -->
				<view v-if="form.mode === 2" class="afe-card afe-card-gap">
					<view class="afe-field">
						<text class="afe-field-label">{{ $t('fwx_app_filter.select_user') }}</text>
						<view class="afe-user-pick" @click="openUserPicker">
							<view v-if="form.userMac" class="afe-picked-user">
								<text class="afe-picked-name">{{ form.userName || form.userMac }}</text>
								<text class="afe-picked-mac">{{ form.userMac }}</text>
							</view>
							<text v-else class="afe-pick-placeholder">{{ $t('fwx_app_filter.user_not_selected') }}</text>
							<text class="afe-pick-arrow">›</text>
						</view>
					</view>
					<view v-if="errors.user" class="afe-field-error">
						<text class="afe-error-text">{{ errors.user }}</text>
					</view>
				</view>
			</view>

			<!-- ── 时间规则 ────────────────────── -->
			<view class="afe-section">
				<view class="afe-section-header">
					<text class="afe-section-title">{{ $t('fwx_app_filter.section_time') }}</text>
					<view class="afe-section-add" @click="addTimeGroup">
						<text class="afe-section-add-text">+ {{ $t('fwx_app_filter.add_time_group') }}</text>
					</view>
				</view>

				<view
					v-for="(tg, ti) in form.timeRules"
					:key="ti"
					class="afe-card afe-tg-card"
					:class="{ 'afe-card-gap': ti > 0 }"
				>
					<view class="afe-tg-head">
						<text class="afe-tg-title">{{ $t('fwx_app_filter.time_group_label').replace('{n}', ti + 1) }}</text>
						<view v-if="form.timeRules.length > 1" class="afe-tg-del" @click="removeTimeGroup(ti)">
							<text class="afe-tg-del-text">{{ $t('fwx_app_filter.del_time_group') }}</text>
						</view>
					</view>

					<!-- weekday toggles -->
					<view class="afe-wd-row">
						<view
							v-for="(wd, wi) in weekdays"
							:key="wi"
							class="afe-wd-btn"
							:class="{ 'afe-wd-btn-active': tg.weekdays.includes(wi) }"
							@click="toggleWeekday(ti, wi)"
						>
							<text class="afe-wd-text" :class="{ 'afe-wd-text-active': tg.weekdays.includes(wi) }">{{ wd }}</text>
						</view>
					</view>

					<!-- start / end time -->
					<view class="afe-time-row">
						<view class="afe-time-field">
							<text class="afe-time-label">{{ $t('fwx_app_filter.start_time') }}</text>
							<picker
								mode="time"
								:value="tg.start_time"
								start="00:00"
								end="23:59"
								@change="tg.start_time = $event.detail.value"
							>
								<view class="afe-time-pick">
									<text class="afe-time-val">{{ tg.start_time }}</text>
								</view>
							</picker>
						</view>
						<text class="afe-time-sep">—</text>
						<view class="afe-time-field">
							<text class="afe-time-label">{{ $t('fwx_app_filter.end_time') }}</text>
							<picker
								mode="time"
								:value="tg.end_time"
								start="00:00"
								end="23:59"
								@change="tg.end_time = $event.detail.value"
							>
								<view class="afe-time-pick">
									<text class="afe-time-val">{{ tg.end_time }}</text>
								</view>
							</picker>
						</view>
					</view>
				</view>
			</view>

			<!-- ── 过滤应用 ────────────────────── -->
			<view class="afe-section">
				<view class="afe-section-header">
					<text class="afe-section-title">{{ $t('fwx_app_filter.section_apps') }}</text>
				</view>

				<view v-if="appsLoading" class="afe-card afe-apps-state">
					<text class="afe-state-text">{{ $t('fwx_app_filter.loading_apps') }}</text>
				</view>
				<view v-else-if="classList.length === 0" class="afe-card afe-apps-state">
					<text class="afe-state-text">{{ $t('fwx_app_filter.no_apps') }}</text>
				</view>
				<view v-else>
					<view
						v-for="(cat, ci) in classList"
						:key="ci"
						class="afe-card"
						:class="{ 'afe-card-gap': ci > 0 }"
					>
						<!-- category header -->
						<view class="afe-cat-head" @click="toggleCat(ci)">
							<view class="afe-cat-info">
								<text class="afe-cat-name">{{ cat.name }}</text>
								<text class="afe-cat-count">{{ catSelectedCount(ci) }}/{{ cat.app_list.length }}</text>
							</view>
							<view class="afe-cat-right">
								<view class="afe-cat-selall" @click.stop="toggleCatAll(ci)">
									<text class="afe-cat-selall-text">
										{{ catSelectedCount(ci) === cat.app_list.length ? $t('fwx_app_filter.deselect_all') : $t('fwx_app_filter.select_all') }}
									</text>
								</view>
								<text class="afe-cat-arrow" :class="{ 'afe-cat-arrow-open': expandedCats.includes(ci) }">›</text>
							</view>
						</view>

						<!-- app list -->
						<view v-if="expandedCats.includes(ci)" class="afe-app-list">
							<view
								v-for="(app, ai) in cat.app_list"
								:key="ai"
								class="afe-app-item"
								:class="{ 'afe-app-item-border': ai > 0 }"
								@click="toggleApp(app)"
							>
								<view class="afe-app-check" :class="{ 'afe-app-check-on': selectedAppIds.includes(getAppId(app)) }">
									<text v-if="selectedAppIds.includes(getAppId(app))" class="afe-check-mark">✓</text>
								</view>
								<image
									v-if="!iconErrors[getAppId(app)]"
									:src="getAppIconUrl(getAppId(app))"
									class="afe-app-icon"
									mode="scaleToFill"
									@error="onIconError(getAppId(app))"
								/>
								<view v-else class="afe-app-icon-fb" :style="{ background: appColor(getAppName(app)) }">
									<text class="afe-app-icon-fb-text">{{ getAppName(app).charAt(0) }}</text>
								</view>
								<text class="afe-app-name">{{ getAppName(app) }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- save / cancel buttons -->
			<view class="afe-bottom">
				<view class="afe-cancel-btn" @click="goBack">
					<text class="afe-cancel-text">{{ $t('fwx_common.cancel') }}</text>
				</view>
				<view class="afe-save-btn" :class="{ 'afe-save-loading': saving }" @click="save">
					<text v-if="!saving" class="afe-save-text">{{ $t('fwx_common.save') }}</text>
					<view v-else class="afe-spin"></view>
				</view>
			</view>

			<view style="height: 40rpx;"></view>
		</scroll-view>

		<!-- user picker modal -->
		<view v-if="userPickerVisible" class="afe-overlay" @click.stop="userPickerVisible = false">
			<view class="afe-picker-sheet" @click.stop>
				<view class="afe-picker-head">
					<text class="afe-picker-title">{{ $t('fwx_app_filter.select_user_title') }}</text>
					<view class="afe-picker-close" @click="userPickerVisible = false">
						<text class="afe-picker-close-text">✕</text>
					</view>
				</view>
				<scroll-view scroll-y style="max-height: 600rpx; overflow: hidden;">
					<view v-if="usersLoading" style="padding: 60rpx; text-align: center;">
						<text class="afe-state-text">{{ $t('fwx_app_filter.loading_users') }}</text>
					</view>
					<view v-else-if="allUsers.length === 0" style="padding: 60rpx; text-align: center;">
						<text class="afe-state-text">{{ $t('fwx_app_filter.no_users') }}</text>
					</view>
					<view v-else>
						<view
							v-for="user in allUsers"
							:key="user.mac"
							class="afe-picker-item"
							@click="selectUser(user)"
						>
							<view class="afe-user-info">
								<text class="afe-user-name">{{ user.nickname || user.hostname || user.mac }}</text>
								<text class="afe-user-sub">{{ user.mac }}</text>
							</view>
							<view class="afe-pick-check" :class="{ 'afe-pick-check-on': form.userMac === user.mac }">
								<text v-if="form.userMac === user.mac" class="afe-check-mark">✓</text>
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
import { getFanchmwrtAppIconUrl } from '@/utils/fanchmwrtAppIcon.js'

const APP_COLORS = [
	'#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
	'#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1'
]

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

function compressAppIds(ids) {
	if (!ids.length) return []
	const sorted = [...new Set(ids)].map(Number).sort((a, b) => a - b)
	const result = []
	let s = sorted[0], e = sorted[0]
	for (let i = 1; i < sorted.length; i++) {
		if (sorted[i] === e + 1) {
			e = sorted[i]
		} else {
			result.push(s === e ? String(s) : `${s}-${e}`)
			s = e = sorted[i]
		}
	}
	result.push(s === e ? String(s) : `${s}-${e}`)
	return result
}

export default {
	data() {
		return {
			device: null,
			ubusUrl: '',

			editingRule: null,
			form: {
				name: '',
				enabled: true,
				filterQuic: false,
				mode: 1,
				userMac: '',
				userName: '',
				timeRules: [{ weekdays: [1, 2, 3, 4, 5], start_time: '08:00', end_time: '22:00' }]
			},
			errors: { name: '', user: '' },

			classList: [],
			appsLoading: false,
			expandedCats: [],
			selectedAppIds: [],
			iconErrors: {},

			allUsers: [],
			usersLoading: false,
			userPickerVisible: false,

			saving: false
		}
	},

	computed: {
		weekdays() {
			return [
				this.$t('fwx_app_filter.wd_sun'),
				this.$t('fwx_app_filter.wd_mon'),
				this.$t('fwx_app_filter.wd_tue'),
				this.$t('fwx_app_filter.wd_wed'),
				this.$t('fwx_app_filter.wd_thu'),
				this.$t('fwx_app_filter.wd_fri'),
				this.$t('fwx_app_filter.wd_sat')
			]
		}
	},

	onLoad() {
		const globalData = getApp().globalData
		this.editingRule = globalData._afEditRule || null

		const cachedList = globalData._afClassList
		if (cachedList && cachedList.length) {
			this.classList = cachedList
		}
		// Do NOT call loadClassList() here — ubusUrl is not set until onShow

		if (this.editingRule) {
			const r = this.editingRule
			this.form.name = r.name || ''
			this.form.enabled = r.enabled === 1 || r.enabled === true
			this.form.filterQuic = r.filter_quic === 1 || r.filter_quic === true
			this.form.mode = r.mode || 1
			this.form.userMac = r.user_mac || ''
			this.form.userName = r.user_name || ''
			this.form.timeRules = (r.time_rules && r.time_rules.length)
				? r.time_rules.map(t => ({
					weekdays: Array.isArray(t.weekdays) ? [...t.weekdays] : [],
					start_time: t.start_time || '08:00',
					end_time: t.end_time || '22:00'
				}))
				: [{ weekdays: [1, 2, 3, 4, 5], start_time: '08:00', end_time: '22:00' }]

			if (r.app_ids && r.app_ids.length) {
				this.selectedAppIds = expandAppIds(r.app_ids)
			}
		}
	},

	onShow() {
		const device = DeviceManager.getCurrentDevice()
		if (!device) return
		this.device = device
		const protocol = device.useHttps ? 'https' : 'http'
		const host = DeviceManager.formatHostForUrl(device.ip)
		this.ubusUrl = `${protocol}://${host}:${device.port}/ubus`
		// Now ubusUrl is ready — load class list if not passed from parent
		if (!this.classList.length) {
			this.loadClassList()
		}
	},

	methods: {
		goBack() { uni.navigateBack() },

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

		async loadClassList() {
			this.appsLoading = true
			try {
				const data = await this.ubus('class_list')
				console.log('[app_filter_edit] class_list raw:', JSON.stringify(data))
				this.classList = data?.class_list || []
				console.log('[app_filter_edit] classList length:', this.classList.length)
			} catch (e) {
				console.error('[app_filter_edit] class_list error:', e)
			} finally {
				this.appsLoading = false
			}
		},

		async openUserPicker() {
			this.userPickerVisible = true
			if (!this.allUsers.length) {
				this.usersLoading = true
				try {
					const data = await this.ubus('get_all_users', { flag: 2, page: 0 })
					console.log('[app_filter_edit] get_all_users raw:', JSON.stringify(data))
					this.allUsers = data?.list || []
					console.log('[app_filter_edit] allUsers length:', this.allUsers.length)
				} catch (e) {
					console.error('[app_filter_edit] get_all_users error:', e)
				} finally {
					this.usersLoading = false
				}
			}
		},

		selectUser(user) {
			this.form.userMac = user.mac
			this.form.userName = user.nickname || user.hostname || ''
			this.userPickerVisible = false
			this.errors.user = ''
		},

		addTimeGroup() {
			this.form.timeRules.push({
				weekdays: [1, 2, 3, 4, 5],
				start_time: '08:00',
				end_time: '22:00'
			})
		},

		removeTimeGroup(i) {
			this.form.timeRules.splice(i, 1)
		},

		toggleWeekday(ti, wi) {
			const tg = this.form.timeRules[ti]
			const idx = tg.weekdays.indexOf(wi)
			if (idx >= 0) {
				tg.weekdays.splice(idx, 1)
			} else {
				tg.weekdays.push(wi)
				tg.weekdays.sort((a, b) => a - b)
			}
		},

		toggleCat(ci) {
			const idx = this.expandedCats.indexOf(ci)
			if (idx >= 0) this.expandedCats.splice(idx, 1)
			else this.expandedCats.push(ci)
		},

		toggleCatAll(ci) {
			const cat = this.classList[ci]
			const allIds = cat.app_list.map(a => parseInt(a.split(',')[0]))
			const allSelected = allIds.every(id => this.selectedAppIds.includes(id))
			if (allSelected) {
				this.selectedAppIds = this.selectedAppIds.filter(id => !allIds.includes(id))
			} else {
				const toAdd = allIds.filter(id => !this.selectedAppIds.includes(id))
				this.selectedAppIds = [...this.selectedAppIds, ...toAdd]
			}
		},

		toggleApp(app) {
			const id = parseInt(app.split(',')[0])
			const idx = this.selectedAppIds.indexOf(id)
			if (idx >= 0) {
				this.selectedAppIds.splice(idx, 1)
			} else {
				this.selectedAppIds.push(id)
			}
		},

		getAppId(app) { return parseInt(app.split(',')[0]) },
		getAppName(app) { return app.split(',')[1] || '' },

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

		catSelectedCount(ci) {
			const cat = this.classList[ci]
			return (cat.app_list || []).filter(a => this.selectedAppIds.includes(parseInt(a.split(',')[0]))).length
		},

		validate() {
			let ok = true
			this.errors.name = ''
			this.errors.user = ''
			if (!this.form.name.trim()) {
				this.errors.name = this.$t('fwx_app_filter.rule_name_required')
				ok = false
			}
			if (this.form.mode === 2 && !this.form.userMac) {
				this.errors.user = this.$t('fwx_app_filter.user_not_selected')
				ok = false
			}
			return ok
		},

		async save() {
			if (!this.validate()) return
			this.saving = true
			try {
				const ruleData = {
					name: this.form.name.trim(),
					mode: this.form.mode,
					user_mac: this.form.mode === 2 ? this.form.userMac : '',
					user_name: this.form.mode === 2 ? this.form.userName : '',
					time_rules: this.form.timeRules.map(tg => ({
						weekdays: [...tg.weekdays],
						start_time: tg.start_time,
						end_time: tg.end_time
					})),
					app_ids: compressAppIds([...this.selectedAppIds]),
					enabled: this.form.enabled ? 1 : 0,
					filter_quic: this.form.filterQuic ? 1 : 0
				}

				if (this.editingRule) {
					ruleData.id = this.editingRule.id
					await this.ubus('update_filter_rule', ruleData)
				} else {
					await this.ubus('add_filter_rule', ruleData)
				}

				uni.showToast({ title: this.$t('fwx_common.save_success'), icon: 'success' })
				setTimeout(() => uni.navigateBack(), 800)
			} catch (e) {
				uni.showToast({ title: this.$t('fwx_common.save_failed'), icon: 'none' })
			} finally {
				this.saving = false
			}
		}
	}
}
</script>

<style scoped>
.afe-page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }

/* nav */
.afe-nav { display: flex; align-items: center; padding: 88rpx 24rpx 20rpx; background: #fff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.afe-back { width: 60rpx; display: flex; align-items: center; }
.afe-back-icon { width: 36rpx; }
.afe-nav-title { flex: 1; font-size: 32rpx; font-weight: 600; color: #1c1c1e; text-align: center; }

.afe-scroll { background: #F2F2F7; }

/* section */
.afe-section { padding: 24rpx 24rpx 0; }
.afe-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.afe-section-title { font-size: 24rpx; font-weight: 600; color: #8e8e93; letter-spacing: 1rpx; }
.afe-section-label { font-size: 24rpx; font-weight: 600; color: #8e8e93; margin-bottom: 16rpx; display: block; }
.afe-section-add { padding: 4rpx 0; }
.afe-section-add-text { font-size: 26rpx; color: #007AFF; }

/* cards */
.afe-card { background: #fff; border-radius: 20rpx; overflow: hidden; }
.afe-card-gap { margin-top: 16rpx; }

/* fields */
.afe-field { display: flex; align-items: center; padding: 24rpx 28rpx; }
.afe-field-label { font-size: 28rpx; color: #1c1c1e; width: 160rpx; flex-shrink: 0; font-weight: 500; }
.afe-input { flex: 1; font-size: 28rpx; color: #1c1c1e; text-align: right; }
.afe-field-error { padding: 0 28rpx 16rpx; }
.afe-error-text { font-size: 24rpx; color: #FF3B30; }

/* toggle rows */
.afe-toggle-row { display: flex; align-items: center; padding: 20rpx 28rpx; }
.afe-row-border { border-top: 1rpx solid rgba(0,0,0,0.06); }
.afe-toggle-info { flex: 1; }
.afe-toggle-label { font-size: 28rpx; color: #1c1c1e; font-weight: 500; flex: 1; display: block; }
.afe-toggle-desc { font-size: 22rpx; color: #8e8e93; margin-top: 2rpx; display: block; }

/* mode selector */
.afe-mode-row { display: flex; gap: 16rpx; padding: 0 28rpx 28rpx; }
.afe-mode-btn { flex: 1; height: 72rpx; border-radius: 14rpx; border: 2rpx solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }
.afe-mode-btn-active { border-color: #007AFF; background: rgba(0,122,255,0.06); }
.afe-mode-text { font-size: 26rpx; color: #8e8e93; }
.afe-mode-text-active { color: #007AFF; font-weight: 600; }

/* user pick */
.afe-user-pick { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 8rpx; }
.afe-picked-user { flex: 1; display: flex; flex-direction: column; align-items: flex-end; }
.afe-picked-name { font-size: 26rpx; color: #1c1c1e; }
.afe-picked-mac { font-size: 22rpx; color: #8e8e93; margin-top: 2rpx; }
.afe-pick-placeholder { flex: 1; font-size: 26rpx; color: #c7c7cc; text-align: right; }
.afe-pick-arrow { font-size: 32rpx; color: #c7c7cc; margin-left: 4rpx; }

/* time group card */
.afe-tg-card { padding: 24rpx 28rpx; }
.afe-tg-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.afe-tg-title { font-size: 26rpx; font-weight: 600; color: #3c3c43; }
.afe-tg-del { padding: 4rpx 0; }
.afe-tg-del-text { font-size: 24rpx; color: #FF3B30; }

/* weekday buttons */
.afe-wd-row { display: flex; gap: 10rpx; margin-bottom: 20rpx; }
.afe-wd-btn { flex: 1; height: 60rpx; border-radius: 10rpx; border: 2rpx solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }
.afe-wd-btn-active { border-color: #007AFF; background: #007AFF; }
.afe-wd-text { font-size: 22rpx; color: #8e8e93; }
.afe-wd-text-active { color: #fff; }

/* time row */
.afe-time-row { display: flex; align-items: center; gap: 16rpx; }
.afe-time-field { flex: 1; }
.afe-time-label { font-size: 22rpx; color: #8e8e93; display: block; margin-bottom: 8rpx; }
.afe-time-pick { height: 72rpx; border-radius: 12rpx; background: #F2F2F7; display: flex; align-items: center; justify-content: center; }
.afe-time-val { font-size: 28rpx; color: #1c1c1e; font-weight: 500; }
.afe-time-sep { font-size: 28rpx; color: #8e8e93; margin-top: 28rpx; }

/* app category */
.afe-apps-state { padding: 40rpx; display: flex; align-items: center; justify-content: center; }
.afe-state-text { font-size: 26rpx; color: #8e8e93; }
.afe-cat-head { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 28rpx; }
.afe-cat-info { flex: 1; display: flex; align-items: center; gap: 12rpx; }
.afe-cat-name { font-size: 28rpx; color: #1c1c1e; font-weight: 500; }
.afe-cat-count { font-size: 22rpx; color: #8e8e93; }
.afe-cat-right { display: flex; align-items: center; gap: 16rpx; }
.afe-cat-selall { padding: 4rpx 12rpx; background: #F2F2F7; border-radius: 8rpx; }
.afe-cat-selall-text { font-size: 22rpx; color: #007AFF; }
.afe-cat-arrow { font-size: 32rpx; color: #c7c7cc; transition: transform 0.2s; }
.afe-cat-arrow-open { transform: rotate(90deg); }
.afe-app-list { border-top: 1rpx solid rgba(0,0,0,0.06); }
.afe-app-item { display: flex; align-items: center; padding: 20rpx 28rpx; gap: 16rpx; }
.afe-app-item-border { border-top: 1rpx solid rgba(0,0,0,0.04); }
.afe-app-check { width: 40rpx; height: 40rpx; border-radius: 8rpx; border: 2rpx solid rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.afe-app-check-on { background: #007AFF; border-color: #007AFF; }
.afe-check-mark { font-size: 24rpx; color: #fff; font-weight: 700; }
.afe-app-icon { width: 56rpx; height: 56rpx; border-radius: 12rpx; flex-shrink: 0; display: block; }
.afe-app-icon-fb { width: 56rpx; height: 56rpx; border-radius: 12rpx; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.afe-app-icon-fb-text { font-size: 22rpx; color: #fff; font-weight: 700; }
.afe-app-name { font-size: 26rpx; color: #3c3c43; }

/* bottom buttons */
.afe-bottom { display: flex; gap: 20rpx; padding: 32rpx 24rpx 16rpx; }
.afe-cancel-btn { flex: 1; height: 88rpx; border-radius: 16rpx; border: 2rpx solid rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; }
.afe-cancel-text { font-size: 30rpx; color: #3c3c43; }
.afe-save-btn { flex: 2; height: 88rpx; border-radius: 16rpx; background: #007AFF; display: flex; align-items: center; justify-content: center; }
.afe-save-loading { opacity: 0.7; }
.afe-save-text { font-size: 30rpx; font-weight: 600; color: #fff; }
.afe-spin { width: 40rpx; height: 40rpx; border: 4rpx solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* user picker modal */
.afe-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.afe-picker-sheet { background: #fff; border-radius: 24rpx 24rpx 0 0; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
.afe-picker-head { display: flex; align-items: center; justify-content: space-between; padding: 32rpx 32rpx 20rpx; border-bottom: 1rpx solid rgba(0,0,0,0.06); }
.afe-picker-title { font-size: 30rpx; font-weight: 600; color: #1c1c1e; }
.afe-picker-close { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }
.afe-picker-close-text { font-size: 28rpx; color: #8e8e93; }
.afe-picker-item { display: flex; align-items: center; padding: 24rpx 32rpx; border-bottom: 1rpx solid rgba(0,0,0,0.04); }
.afe-user-info { flex: 1; }
.afe-user-name { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; }
.afe-user-sub { font-size: 22rpx; color: #8e8e93; margin-top: 4rpx; display: block; }
.afe-pick-check { width: 40rpx; height: 40rpx; border-radius: 50%; border: 2rpx solid rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; margin-left: 16rpx; }
.afe-pick-check-on { background: #007AFF; border-color: #007AFF; }
</style>
