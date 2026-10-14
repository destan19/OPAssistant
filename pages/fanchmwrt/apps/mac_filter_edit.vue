<template>
	<view class="mfe-page">
		<!-- nav -->
		<view class="mfe-nav">
			<view class="mfe-back" @click="goBack">
				<image src="/static/back.png" mode="widthFix" class="mfe-back-icon" />
			</view>
			<text class="mfe-nav-title">{{ isEdit ? $t('fwx_mac_filter.edit_rule_title') : $t('fwx_mac_filter.add_rule_title') }}</text>
			<view style="width: 60rpx;"></view>
		</view>

		<scroll-view scroll-y style="flex: 1;" class="mfe-scroll">
			<!-- ── 基本设置 ────────────────────── -->
			<view class="mfe-section">
				<!-- rule name -->
				<view class="mfe-card">
					<view class="mfe-field">
						<text class="mfe-field-label">{{ $t('fwx_mac_filter.rule_name') }}</text>
						<input
							class="mfe-input"
							v-model="form.name"
							:placeholder="$t('fwx_mac_filter.rule_name_placeholder')"
							maxlength="32"
						/>
					</view>
					<view v-if="errors.name" class="mfe-field-error">
						<text class="mfe-error-text">{{ errors.name }}</text>
					</view>
				</view>

				<!-- enable toggle -->
				<view class="mfe-card mfe-card-gap">
					<view class="mfe-toggle-row">
						<text class="mfe-toggle-label">{{ $t('fwx_mac_filter.rule_enabled_label') }}</text>
						<switch :checked="form.enabled" @change="form.enabled = $event.detail.value" color="#007AFF" style="transform: scale(0.85);" />
					</view>
				</view>

				<!-- mode selector -->
				<view class="mfe-card mfe-card-gap">
					<text class="mfe-section-label">{{ $t('fwx_mac_filter.mode_label') }}</text>
					<view class="mfe-mode-row">
						<view
							class="mfe-mode-btn"
							:class="{ 'mfe-mode-btn-active': form.mode === 1 }"
							@click="form.mode = 1"
						>
							<text class="mfe-mode-text" :class="{ 'mfe-mode-text-active': form.mode === 1 }">{{ $t('fwx_mac_filter.mode_all') }}</text>
						</view>
						<view
							class="mfe-mode-btn"
							:class="{ 'mfe-mode-btn-active': form.mode === 2 }"
							@click="form.mode = 2"
						>
							<text class="mfe-mode-text" :class="{ 'mfe-mode-text-active': form.mode === 2 }">{{ $t('fwx_mac_filter.mode_single') }}</text>
						</view>
					</view>
				</view>

				<!-- user selector -->
				<view v-if="form.mode === 2" class="mfe-card mfe-card-gap">
					<view class="mfe-field">
						<text class="mfe-field-label">{{ $t('fwx_mac_filter.select_user') }}</text>
						<view class="mfe-user-pick" @click="openUserPicker">
							<view v-if="form.userMac" class="mfe-picked-user">
								<text class="mfe-picked-name">{{ form.userName || form.userMac }}</text>
								<text class="mfe-picked-mac">{{ form.userMac }}</text>
							</view>
							<text v-else class="mfe-pick-placeholder">{{ $t('fwx_mac_filter.user_not_selected') }}</text>
							<text class="mfe-pick-arrow">›</text>
						</view>
					</view>
					<view v-if="errors.user" class="mfe-field-error">
						<text class="mfe-error-text">{{ errors.user }}</text>
					</view>
				</view>
			</view>

			<!-- ── 限制模式 ────────────────────── -->
			<view class="mfe-section">
				<view class="mfe-section-header">
					<text class="mfe-section-title">{{ $t('fwx_mac_filter.time_mode_label') }}</text>
				</view>
				<view class="mfe-card">
					<view class="mfe-mode3-row">
						<view
							class="mfe-tm-btn"
							:class="{ 'mfe-tm-btn-active': form.timeMode === 1 }"
							@click="form.timeMode = 1"
						>
							<text class="mfe-tm-text" :class="{ 'mfe-tm-text-active': form.timeMode === 1 }">{{ $t('fwx_mac_filter.time_mode_range') }}</text>
						</view>
						<view
							class="mfe-tm-btn"
							:class="{ 'mfe-tm-btn-active': form.timeMode === 2 }"
							@click="form.timeMode = 2"
						>
							<text class="mfe-tm-text" :class="{ 'mfe-tm-text-active': form.timeMode === 2 }">{{ $t('fwx_mac_filter.time_mode_duration') }}</text>
						</view>
						<view
							class="mfe-tm-btn"
							:class="{ 'mfe-tm-btn-active': form.timeMode === 3 }"
							@click="form.timeMode = 3"
						>
							<text class="mfe-tm-text" :class="{ 'mfe-tm-text-active': form.timeMode === 3 }">{{ $t('fwx_mac_filter.time_mode_traffic') }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- ── 时间段模式 (timeMode=1) ─────── -->
			<view v-if="form.timeMode === 1" class="mfe-section">
				<view class="mfe-section-header">
					<text class="mfe-section-title">{{ $t('fwx_mac_filter.section_time') }}</text>
					<view class="mfe-section-add" @click="addTimeGroup">
						<text class="mfe-section-add-text">+ {{ $t('fwx_mac_filter.add_time_group') }}</text>
					</view>
				</view>

				<view
					v-for="(tg, ti) in form.timeRules"
					:key="ti"
					class="mfe-card mfe-tg-card"
					:class="{ 'mfe-card-gap': ti > 0 }"
				>
					<view class="mfe-tg-head">
						<text class="mfe-tg-title">{{ $t('fwx_mac_filter.section_time') }} {{ ti + 1 }}</text>
						<view v-if="form.timeRules.length > 1" class="mfe-tg-del" @click="removeTimeGroup(ti)">
							<text class="mfe-tg-del-text">{{ $t('fwx_mac_filter.del_time_group') }}</text>
						</view>
					</view>

					<!-- weekday chips -->
					<view class="mfe-wd-row">
						<view
							v-for="(wd, wi) in weekdayLabels"
							:key="wi"
							class="mfe-wd-btn"
							:class="{ 'mfe-wd-btn-active': tg.weekdays.includes(wi) }"
							@click="toggleWeekday(ti, wi)"
						>
							<text class="mfe-wd-text" :class="{ 'mfe-wd-text-active': tg.weekdays.includes(wi) }">{{ wd }}</text>
						</view>
					</view>

					<!-- time pickers -->
					<view class="mfe-time-row">
						<view class="mfe-time-field">
							<text class="mfe-time-label">{{ $t('fwx_app_filter.start_time') }}</text>
							<picker
								mode="time"
								:value="tg.start_time"
								start="00:00"
								end="23:59"
								@change="tg.start_time = $event.detail.value"
							>
								<view class="mfe-time-pick">
									<text class="mfe-time-val">{{ tg.start_time }}</text>
								</view>
							</picker>
						</view>
						<text class="mfe-time-sep">—</text>
						<view class="mfe-time-field">
							<text class="mfe-time-label">{{ $t('fwx_app_filter.end_time') }}</text>
							<picker
								mode="time"
								:value="tg.end_time"
								start="00:00"
								end="23:59"
								@change="tg.end_time = $event.detail.value"
							>
								<view class="mfe-time-pick">
									<text class="mfe-time-val">{{ tg.end_time }}</text>
								</view>
							</picker>
						</view>
					</view>
				</view>

				<view v-if="errors.timeRules" class="mfe-error-row">
					<text class="mfe-error-text">{{ errors.timeRules }}</text>
				</view>
			</view>

			<!-- ── 每日时长/流量模式 (timeMode=2/3) ── -->
			<view v-if="form.timeMode === 2 || form.timeMode === 3" class="mfe-section">
				<view class="mfe-section-header">
					<text class="mfe-section-title">
						{{ form.timeMode === 2 ? $t('fwx_mac_filter.duration_label') : $t('fwx_mac_filter.traffic_label') }}
					</text>
				</view>
				<view class="mfe-card">
					<view
						v-for="(dayIdx, i) in weekOrder"
						:key="dayIdx"
						class="mfe-limit-row"
						:class="{ 'mfe-limit-row-border': i > 0 }"
					>
						<text class="mfe-limit-day">{{ weekdayLabels[dayIdx] }}</text>
						<input
							class="mfe-limit-input"
							type="number"
							:value="String(form.weekLimits[dayIdx] || 0)"
							@input="onLimitInput(dayIdx, $event)"
						/>
						<text class="mfe-limit-unit">{{ form.timeMode === 2 ? 'min' : 'MB' }}</text>
					</view>
				</view>
			</view>

			<!-- bottom buttons -->
			<view class="mfe-bottom">
				<view class="mfe-cancel-btn" @click="goBack">
					<text class="mfe-cancel-text">{{ $t('fwx_common.cancel') }}</text>
				</view>
				<view class="mfe-save-btn" :class="{ 'mfe-save-loading': saving }" @click="save">
					<text v-if="!saving" class="mfe-save-text">{{ $t('fwx_common.save') }}</text>
					<view v-else class="mfe-spin"></view>
				</view>
			</view>

			<view style="height: 40rpx;"></view>
		</scroll-view>

		<!-- user picker modal -->
		<view v-if="userPickerVisible" class="mfe-overlay" @click.stop="userPickerVisible = false">
			<view class="mfe-picker-sheet" @click.stop>
				<view class="mfe-picker-head">
					<text class="mfe-picker-title">{{ $t('fwx_mac_filter.select_user_title') }}</text>
					<view class="mfe-picker-close" @click="userPickerVisible = false">
						<text class="mfe-picker-close-text">✕</text>
					</view>
				</view>
				<scroll-view scroll-y style="max-height: 600rpx; overflow: hidden;">
					<view v-if="usersLoading" style="padding: 60rpx; text-align: center;">
						<text class="mfe-state-text">{{ $t('fwx_mac_filter.loading_users') }}</text>
					</view>
					<view v-else-if="allUsers.length === 0" style="padding: 60rpx; text-align: center;">
						<text class="mfe-state-text">{{ $t('fwx_mac_filter.no_users') }}</text>
					</view>
					<view v-else>
						<view
							v-for="user in allUsers"
							:key="user.mac"
							class="mfe-picker-item"
							@click="selectUser(user)"
						>
							<view class="mfe-picker-user-info">
								<text class="mfe-picker-user-name">{{ user.nickname || user.hostname || user.mac }}</text>
								<text class="mfe-picker-user-sub">{{ user.mac }}</text>
							</view>
							<view class="mfe-pick-check" :class="{ 'mfe-pick-check-on': form.userMac === user.mac }">
								<text v-if="form.userMac === user.mac" class="mfe-check-mark">✓</text>
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

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

function parseLimitString(str) {
	const map = {}
	if (!str) return map
	String(str).split(',').forEach(pair => {
		const m = pair.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/)
		if (m) map[parseInt(m[1])] = parseInt(m[2])
	})
	return map
}

function buildLimitString(map) {
	return WEEK_ORDER.map(d => `${d}:${map[d] || 0}`).join(',')
}

export default {
	data() {
		return {
			device: null,
			ubusUrl: '',

			isEdit: false,
			editId: null,

			form: {
				name: '',
				enabled: true,
				mode: 1,
				userMac: '',
				userName: '',
				timeMode: 1,
				timeRules: [{ weekdays: [1, 2, 3, 4, 5], start_time: '09:00', end_time: '22:00' }],
				weekLimits: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
			},
			errors: { name: '', user: '', timeRules: '' },

			allUsers: [],
			usersLoading: false,
			userPickerVisible: false,

			saving: false
		}
	},

	computed: {
		weekdayLabels() {
			return [
				this.$t('fwx_mac_filter.wd_sun'),
				this.$t('fwx_mac_filter.wd_mon'),
				this.$t('fwx_mac_filter.wd_tue'),
				this.$t('fwx_mac_filter.wd_wed'),
				this.$t('fwx_mac_filter.wd_thu'),
				this.$t('fwx_mac_filter.wd_fri'),
				this.$t('fwx_mac_filter.wd_sat')
			]
		},
		weekOrder() { return WEEK_ORDER }
	},

	onLoad() {
		const rule = getApp().globalData._mfEditRule
		if (rule) {
			this.isEdit = true
			this.editId = rule.id
			this.form.name = rule.name || ''
			this.form.enabled = rule.enabled === 1 || rule.enabled === true
			this.form.mode = rule.mode || 1
			this.form.userMac = rule.user_mac || ''
			this.form.userName = rule.user_name || ''
			this.form.timeMode = parseInt(rule.time_mode) || 1

			if (this.form.timeMode === 1) {
				if (rule.time_rules && rule.time_rules.length) {
					this.form.timeRules = rule.time_rules.map(t => ({
						weekdays: Array.isArray(t.weekdays) ? [...t.weekdays] : [],
						start_time: t.start_time || '09:00',
						end_time: t.end_time || '22:00'
					}))
				}
			} else if (this.form.timeMode === 2) {
				this.form.weekLimits = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, ...parseLimitString(rule.time_limit) }
			} else if (this.form.timeMode === 3) {
				this.form.weekLimits = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, ...parseLimitString(rule.flow_limit) }
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

		async openUserPicker() {
			this.userPickerVisible = true
			if (!this.allUsers.length) {
				this.usersLoading = true
				try {
					const data = await this.ubus('get_all_users', { flag: 2, page: 0 })
					this.allUsers = data?.list || []
				} catch (e) { /* ignore */ }
				finally { this.usersLoading = false }
			}
		},

		selectUser(user) {
			this.form.userMac = user.mac
			this.form.userName = user.nickname || user.hostname || ''
			this.userPickerVisible = false
			this.errors.user = ''
		},

		addTimeGroup() {
			this.form.timeRules.push({ weekdays: [1, 2, 3, 4, 5], start_time: '09:00', end_time: '22:00' })
		},

		removeTimeGroup(i) {
			this.form.timeRules.splice(i, 1)
		},

		toggleWeekday(ti, wi) {
			const tg = this.form.timeRules[ti]
			const idx = tg.weekdays.indexOf(wi)
			if (idx >= 0) tg.weekdays.splice(idx, 1)
			else { tg.weekdays.push(wi); tg.weekdays.sort((a, b) => a - b) }
		},

		onLimitInput(dayIdx, e) {
			const val = parseInt(e.detail.value) || 0
			this.$set(this.form.weekLimits, dayIdx, val)
		},

		validate() {
			let ok = true
			this.errors.name = ''
			this.errors.user = ''
			this.errors.timeRules = ''
			if (!this.form.name.trim()) {
				this.errors.name = this.$t('fwx_mac_filter.rule_name_required')
				ok = false
			}
			if (this.form.mode === 2 && !this.form.userMac) {
				this.errors.user = this.$t('fwx_mac_filter.user_not_selected')
				ok = false
			}
			if (this.form.timeMode === 1 && this.form.timeRules.length === 0) {
				this.errors.timeRules = this.$t('fwx_mac_filter.time_rules_required')
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
					enabled: this.form.enabled ? 1 : 0,
					mode: this.form.mode,
					user_mac: this.form.mode === 2 ? this.form.userMac : '',
					user_name: this.form.mode === 2 ? this.form.userName : '',
					time_mode: this.form.timeMode
				}

				if (this.form.timeMode === 1) {
					ruleData.time_rules = this.form.timeRules.map(tg => ({
						weekdays: [...tg.weekdays],
						start_time: tg.start_time,
						end_time: tg.end_time
					}))
				} else if (this.form.timeMode === 2) {
					ruleData.time_limit = buildLimitString(this.form.weekLimits)
				} else if (this.form.timeMode === 3) {
					ruleData.flow_limit = buildLimitString(this.form.weekLimits)
				}

				if (this.isEdit) {
					ruleData.id = this.editId
					await this.ubus('update_mac_filter_rule', ruleData)
				} else {
					await this.ubus('add_mac_filter_rule', ruleData)
				}

				uni.showToast({ title: this.$t('fwx_mac_filter.save_success'), icon: 'success' })
				setTimeout(() => uni.navigateBack(), 800)
			} catch (e) {
				uni.showToast({ title: this.$t('fwx_mac_filter.save_failed'), icon: 'none' })
			} finally {
				this.saving = false
			}
		}
	}
}
</script>

<style scoped>
.mfe-page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }

/* nav */
.mfe-nav { display: flex; align-items: center; padding: 88rpx 24rpx 20rpx; background: #fff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.mfe-back { width: 60rpx; display: flex; align-items: center; }
.mfe-back-icon { width: 36rpx; }
.mfe-nav-title { flex: 1; font-size: 32rpx; font-weight: 600; color: #1c1c1e; text-align: center; }

.mfe-scroll { background: #F2F2F7; }

/* section */
.mfe-section { padding: 24rpx 24rpx 0; }
.mfe-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.mfe-section-title { font-size: 24rpx; font-weight: 600; color: #8e8e93; letter-spacing: 1rpx; }
.mfe-section-label { font-size: 24rpx; font-weight: 600; color: #8e8e93; margin-bottom: 16rpx; display: block; }
.mfe-section-add { padding: 4rpx 0; }
.mfe-section-add-text { font-size: 26rpx; color: #007AFF; }

/* cards */
.mfe-card { background: #fff; border-radius: 20rpx; overflow: hidden; }
.mfe-card-gap { margin-top: 16rpx; }

/* fields */
.mfe-field { display: flex; align-items: center; padding: 24rpx 28rpx; }
.mfe-field-label { font-size: 28rpx; color: #1c1c1e; width: 160rpx; flex-shrink: 0; font-weight: 500; }
.mfe-input { flex: 1; font-size: 28rpx; color: #1c1c1e; text-align: right; }
.mfe-field-error { padding: 0 28rpx 16rpx; }
.mfe-error-text { font-size: 24rpx; color: #FF3B30; }
.mfe-error-row { padding: 12rpx 0; }

/* toggle */
.mfe-toggle-row { display: flex; align-items: center; padding: 20rpx 28rpx; }
.mfe-toggle-label { font-size: 28rpx; color: #1c1c1e; font-weight: 500; flex: 1; }

/* mode selector (2 buttons) */
.mfe-mode-row { display: flex; gap: 16rpx; padding: 0 28rpx 28rpx; }
.mfe-mode-btn { flex: 1; height: 72rpx; border-radius: 14rpx; border: 2rpx solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }
.mfe-mode-btn-active { border-color: #007AFF; background: rgba(0,122,255,0.06); }
.mfe-mode-text { font-size: 26rpx; color: #8e8e93; }
.mfe-mode-text-active { color: #007AFF; font-weight: 600; }

/* time mode selector (3 buttons) */
.mfe-mode3-row { display: flex; gap: 12rpx; padding: 24rpx; }
.mfe-tm-btn { flex: 1; height: 68rpx; border-radius: 12rpx; border: 2rpx solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }
.mfe-tm-btn-active { border-color: #5856D6; background: rgba(88,86,214,0.06); }
.mfe-tm-text { font-size: 24rpx; color: #8e8e93; }
.mfe-tm-text-active { color: #5856D6; font-weight: 600; }

/* user pick */
.mfe-user-pick { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 8rpx; }
.mfe-picked-user { flex: 1; display: flex; flex-direction: column; align-items: flex-end; }
.mfe-picked-name { font-size: 26rpx; color: #1c1c1e; }
.mfe-picked-mac { font-size: 22rpx; color: #8e8e93; margin-top: 2rpx; }
.mfe-pick-placeholder { flex: 1; font-size: 26rpx; color: #c7c7cc; text-align: right; }
.mfe-pick-arrow { font-size: 32rpx; color: #c7c7cc; margin-left: 4rpx; }

/* time group card */
.mfe-tg-card { padding: 24rpx 28rpx; }
.mfe-tg-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.mfe-tg-title { font-size: 26rpx; font-weight: 600; color: #3c3c43; }
.mfe-tg-del { padding: 4rpx 0; }
.mfe-tg-del-text { font-size: 24rpx; color: #FF3B30; }

/* weekday chips */
.mfe-wd-row { display: flex; gap: 10rpx; margin-bottom: 20rpx; }
.mfe-wd-btn { flex: 1; height: 60rpx; border-radius: 10rpx; border: 2rpx solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }
.mfe-wd-btn-active { border-color: #007AFF; background: #007AFF; }
.mfe-wd-text { font-size: 22rpx; color: #8e8e93; }
.mfe-wd-text-active { color: #fff; }

/* time pickers */
.mfe-time-row { display: flex; align-items: center; gap: 16rpx; }
.mfe-time-field { flex: 1; }
.mfe-time-label { font-size: 22rpx; color: #8e8e93; display: block; margin-bottom: 8rpx; }
.mfe-time-pick { height: 72rpx; border-radius: 12rpx; background: #F2F2F7; display: flex; align-items: center; justify-content: center; }
.mfe-time-val { font-size: 28rpx; color: #1c1c1e; font-weight: 500; }
.mfe-time-sep { font-size: 28rpx; color: #8e8e93; margin-top: 28rpx; }

/* per-day limit rows */
.mfe-limit-row { display: flex; align-items: center; padding: 20rpx 28rpx; gap: 20rpx; }
.mfe-limit-row-border { border-top: 1rpx solid rgba(0,0,0,0.06); }
.mfe-limit-day { font-size: 26rpx; color: #1c1c1e; font-weight: 500; width: 40rpx; text-align: center; }
.mfe-limit-input { flex: 1; font-size: 28rpx; color: #1c1c1e; background: #F2F2F7; border-radius: 10rpx; padding: 12rpx 20rpx; text-align: right; }
.mfe-limit-unit { font-size: 24rpx; color: #8e8e93; width: 60rpx; }

/* bottom buttons */
.mfe-bottom { display: flex; gap: 20rpx; padding: 32rpx 24rpx 16rpx; }
.mfe-cancel-btn { flex: 1; height: 88rpx; border-radius: 16rpx; border: 2rpx solid rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; }
.mfe-cancel-text { font-size: 30rpx; color: #3c3c43; }
.mfe-save-btn { flex: 2; height: 88rpx; border-radius: 16rpx; background: #007AFF; display: flex; align-items: center; justify-content: center; }
.mfe-save-loading { opacity: 0.7; }
.mfe-save-text { font-size: 30rpx; font-weight: 600; color: #fff; }
.mfe-spin { width: 40rpx; height: 40rpx; border: 4rpx solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* state text */
.mfe-state-text { font-size: 26rpx; color: #8e8e93; }

/* user picker modal */
.mfe-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.mfe-picker-sheet { background: #fff; border-radius: 24rpx 24rpx 0 0; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
.mfe-picker-head { display: flex; align-items: center; justify-content: space-between; padding: 32rpx 32rpx 20rpx; border-bottom: 1rpx solid rgba(0,0,0,0.06); }
.mfe-picker-title { font-size: 30rpx; font-weight: 600; color: #1c1c1e; }
.mfe-picker-close { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }
.mfe-picker-close-text { font-size: 28rpx; color: #8e8e93; }
.mfe-picker-item { display: flex; align-items: center; padding: 24rpx 32rpx; border-bottom: 1rpx solid rgba(0,0,0,0.04); }
.mfe-picker-user-info { flex: 1; }
.mfe-picker-user-name { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; }
.mfe-picker-user-sub { font-size: 22rpx; color: #8e8e93; margin-top: 4rpx; display: block; }
.mfe-pick-check { width: 40rpx; height: 40rpx; border-radius: 50%; border: 2rpx solid rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; margin-left: 16rpx; }
.mfe-pick-check-on { background: #007AFF; border-color: #007AFF; }
.mfe-check-mark { font-size: 24rpx; color: #fff; font-weight: 700; }
</style>
