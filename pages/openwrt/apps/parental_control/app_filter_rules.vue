<template>
	<view class="container">


		<page-tab :value="currentTab" :tabs="tab_list" @change="on_tab_change" />

		<view v-if="currentTab === 0">
			<view v-if="loading" class="loading-overlay">
				<view class="loading-content">
					<view class="loading-spinner"></view>
					<text class="loading-text">{{ $t('parental_control.loading_apps') }}</text>
				</view>
			</view>

			<view v-else class="rules-container">
			<view v-if="supportsWeekdayPerSlot" class="rules-options">
				<view class="rules-option-row">
					<text class="rules-option-label">{{ $t('parental_control.filter_mode') }}:</text>
					<picker
						:value="getFilterModePickerIndex()"
						:range="filterModeOptions"
						range-key="text"
						@change="onAppFilterModeChange"
					>
						<view class="rules-option-picker">
							<text class="rules-option-value">{{ getFilterModeText(baseConfig.app_filter_mode) }}</text>
							<text class="rules-option-arrow">▼</text>
						</view>
					</picker>
				</view>
				<view v-if="baseConfig.app_filter_mode === 0" class="rules-option-row">
					<text class="rules-option-label">{{ $t('parental_control.filter_quic') }}:</text>
					<switch
						:checked="baseConfig.disable_quic === 1"
						@change="onDisableQuicChange"
						color="#007AFF"
					/>
				</view>
			</view>
			<view v-if="baseConfig.app_filter_mode === 0" class="category-list">
				<view v-for="(category, categoryIndex) in categories" :key="categoryIndex" class="category-card">
					<view class="category-header" @click="toggleCategory(categoryIndex)">
						<view class="category-left">
							<image 
								class="category-arrow" 
								:src="category.expanded ? '/static/align-bottom.png' : '/static/right.png'" 
								mode="widthFix" 
								style="width: 24rpx; height: 24rpx; margin-right: 15rpx;" 
							/>
							<view class="category-info">
								<text class="category-name">{{ category.name }}</text>
								<text class="category-count">({{ category.apps.length }})</text>
							</view>
						</view>
						<view class="category-right">
							<text class="selected-count">{{ getSelectedCount(category) }}/{{ category.apps.length }}</text>
						</view>
					</view>

					<view v-if="category.expanded" class="app-list">
						<view class="category-select-all">
							<switch 
								:checked="category.allSelected" 
								@change="toggleCategorySelect(categoryIndex)"
								color="#007AFF"
							/>
							<text class="select-all-text">{{ $t('parental_control.select_all') }}</text>
						</view>
						
						<view v-for="(app, appIndex) in category.apps" :key="app.id" class="app-item">
							<view class="app-left">
								<image 
									:src="getAppIconUrl(app.id)" 
									mode="aspectFit" 
									class="app-icon"
									@error="onIconError($event, app.id)"
								/>
								<text v-if="app.iconError" class="app-icon-fallback">📱</text>
								<text class="app-name">{{ app.name }}</text>
							</view>
							<view class="app-right">
								<switch 
									:checked="app.selected" 
									@change="toggleAppSelect(categoryIndex, appIndex)"
									color="#007AFF"
								/>
							</view>
						</view>
					</view>
				</view>
			</view>
			<view v-else class="all-apps-mode-hint">
				<text class="all-apps-mode-hint-text">{{ $t('parental_control.filter_mode_all_apps_hint') }}</text>
			</view>

			<view class="save-button-container">
				<button 
					class="save-button" 
					@click="saveRules"
					:disabled="saving"
				>
					<text class="save-button-text">{{ saving ? $t('parental_control.saving') : $t('parental_control.save') }}</text>
				</button>
			</view>
			</view>
		</view>

		<view v-if="currentTab === 1" class="time-config-container">
			<!-- 加载状态 -->
			<view v-if="loading" class="loading-overlay">
				<view class="loading-content">
					<view class="loading-spinner"></view>
					<text class="loading-text">{{ $t('parental_control.loading_settings') }}</text>
				</view>
			</view>

			<view v-else class="config-content">
				<view class="config-section">
					<view class="section-title">{{ $t('parental_control.time_mode') }}</view>
					<picker
						mode="selector"
						:range="timeModeOptions"
						:value="timeModePickerValue"
						@change="onTimeModePickerChange"
					>
						<view class="mode-dropdown">
							<text class="mode-dropdown-text">{{ timeModeOptions[timeModePickerValue] || timeModeOptions[0] }}</text>
							<text class="mode-dropdown-arrow">▼</text>
						</view>
					</picker>
				</view>

				<view v-if="timeConfig.mode === 2" class="config-section">
					<view class="section-title">{{ $t('parental_control.current_time') }}: {{ timeConfig.current_time || '--' }}</view>
					<view class="duration-mode-desc">{{ $t('parental_control.duration_mode_desc') }}</view>
					<view class="today-usage-card">
						<view class="today-usage-title">{{ $t('parental_control.today_usage') }}</view>
						<view class="today-weekday">{{ $t('parental_control.today_is') }}: {{ getWeekdayNameForDaily(timeConfig.current_weekday) }}</view>
						<view class="usage-row">
							<text class="usage-label">{{ $t('parental_control.morning') }}</text>
							<template v-if="(timeConfig.current_am_limit || 0) <= 0">
								<text class="usage-no-limit">{{ $t('parental_control.no_limit') }}</text>
							</template>
							<template v-else>
								<view class="usage-bar-wrap">
									<view class="usage-bar" :style="amUsageBarStyle"></view>
								</view>
								<text class="usage-text-below">{{ amUsageText }}</text>
							</template>
						</view>
						<view class="usage-row">
							<text class="usage-label">{{ $t('parental_control.afternoon') }}</text>
							<template v-if="(timeConfig.current_pm_limit || 0) <= 0">
								<text class="usage-no-limit">{{ $t('parental_control.no_limit') }}</text>
							</template>
							<template v-else>
								<view class="usage-bar-wrap">
									<view class="usage-bar pm" :style="pmUsageBarStyle"></view>
								</view>
								<text class="usage-text-below">{{ pmUsageText }}</text>
							</template>
						</view>
						<view class="today-usage-actions">
							<button class="clear-usage-btn" @click="clearTodayUsage">{{ $t('parental_control.clear') }}</button>
						</view>
					</view>
					<view class="daily-table-wrap">
						<view class="daily-table-header">
							<text class="daily-th weekday-col">{{ $t('parental_control.weekdays') }}</text>
							<text class="daily-th enable-col">{{ $t('parental_control.enable') }}</text>
							<text class="daily-th am-col">{{ $t('parental_control.morning_limit_min') }}</text>
							<text class="daily-th pm-col">{{ $t('parental_control.afternoon_limit_min') }}</text>
						</view>
						<view 
							v-for="idx in dailyDisplayOrder" 
							:key="idx" 
							class="daily-table-row"
							:class="{ current: timeConfig.current_weekday === idx }"
						>
							<text class="daily-td weekday-col">{{ getWeekdayNameForDaily(idx) }}</text>
							<view class="daily-td enable-col">
								<switch 
									:checked="(timeConfig.daily_time_list || [])[idx] && (timeConfig.daily_time_list[idx].enable === 1)" 
									@change="e => setDailyEnable(idx, e.detail.value)"
									color="#007AFF"
								/>
							</view>
							<view class="daily-td am-col">
								<input type="number" class="daily-input" :value="(timeConfig.daily_time_list || [])[idx] ? timeConfig.daily_time_list[idx].am_time : ''" @input="e => setDailyAmTime(idx, e.detail.value)" />
							</view>
							<view class="daily-td pm-col">
								<input type="number" class="daily-input" :value="(timeConfig.daily_time_list || [])[idx] ? timeConfig.daily_time_list[idx].pm_time : ''" @input="e => setDailyPmTime(idx, e.detail.value)" />
							</view>
						</view>
					</view>
					<view class="duration-hint">{{ $t('parental_control.duration_hint') }}</view>
					<view class="duration-actions">
						<button class="duration-save-btn" @click="saveTimeConfig" :disabled="saving">
							<text class="duration-save-text">{{ saving ? $t('parental_control.saving') : $t('parental_control.save') }}</text>
						</button>
					</view>
				</view>

				<view v-if="timeConfig.mode === 0" class="config-section">
					<view class="section-title">{{ $t('parental_control.time_slots') }}</view>
					<view class="time-slots">
						<view v-for="(slot, index) in timeConfig.time_list" :key="index" class="time-slot-wrap">
							<!-- 6.1.6+：第一排为星期 -->
							<view v-if="supportsWeekdayPerSlot && slot.weekday_list" class="slot-weekdays-row">
								<view class="slot-weekdays">
									<view 
										v-for="day in 7" 
										:key="day - 1"
										class="slot-weekday-pill"
										:class="{ active: slot.weekday_list.includes(day - 1) }"
										@click="toggleWeekdayForSlot(index, day - 1)"
									>
										<text class="slot-weekday-label">{{ getWeekdayName(day - 1) }}</text>
									</view>
								</view>
								<view class="slot-remove-btn" @click="removeTimeSlot(index)">
									<text class="slot-remove-icon">×</text>
								</view>
							</view>
							<!-- 第二排为时间（无每时间段星期时，本行左侧为时间、右侧为删除） -->
							<view class="time-slot-row" :class="{ 'has-weekdays': supportsWeekdayPerSlot && slot.weekday_list }">
								<view class="time-pickers">
									<picker 
										mode="time" 
										:value="slot.start" 
										@change="slot.start = $event.detail.value"
									>
										<view class="time-picker">{{ slot.start }}</view>
									</picker>
									<text class="time-separator">-</text>
									<picker 
										mode="time" 
										:value="slot.end" 
										@change="slot.end = $event.detail.value"
									>
										<view class="time-picker">{{ slot.end }}</view>
									</picker>
								</view>
								<view v-if="!supportsWeekdayPerSlot || !slot.weekday_list" class="remove-btn" @click="removeTimeSlot(index)">
									<text class="remove-text">×</text>
								</view>
							</view>
						</view>
						<view class="add-slot-btn" @click="addTimeSlot">
							<text class="add-text">+ {{ $t('parental_control.add_time_slot') }}</text>
						</view>
					</view>
				</view>

				<view v-if="timeConfig.mode === 1" class="config-section">
					<view class="section-title">{{ $t('parental_control.dynamic_settings') }}</view>
					<view class="dynamic-settings">
						<view class="setting-item">
							<text class="setting-label">{{ $t('parental_control.allow_time') }}</text>
							<input 
								type="number" 
								v-model="timeConfig.allow_time" 
								class="setting-input"
								placeholder="20"
							/>
							<text class="setting-unit">{{ $t('parental_control.minutes') }}</text>
						</view>
						<view class="setting-item">
							<text class="setting-label">{{ $t('parental_control.deny_time') }}</text>
							<input 
								type="number" 
								v-model="timeConfig.deny_time" 
								class="setting-input"
								placeholder="60"
							/>
							<text class="setting-unit">{{ $t('parental_control.minutes') }}</text>
						</view>
						<view class="setting-item">
							<text class="setting-label">{{ $t('parental_control.start_time') }}</text>
							<picker 
								mode="time" 
								:value="timeConfig.start_time" 
								@change="timeConfig.start_time = $event.detail.value"
							>
								<view class="time-picker">{{ timeConfig.start_time }}</view>
							</picker>
						</view>
						<view class="setting-item">
							<text class="setting-label">{{ $t('parental_control.end_time') }}</text>
							<picker 
								mode="time" 
								:value="timeConfig.end_time" 
								@change="timeConfig.end_time = $event.detail.value"
							>
								<view class="time-picker">{{ timeConfig.end_time }}</view>
							</picker>
						</view>
					</view>
				</view>

				<view v-if="showGlobalWeekdays" class="config-section">
					<view class="section-title">{{ $t('parental_control.weekdays') }}</view>
					<view class="weekday-selector">
						<view 
							v-for="day in 7" 
							:key="day - 1"
							class="weekday-item"
							:class="{ active: timeConfig.weekday_list.includes(day - 1) }"
							@click="toggleWeekday(day - 1)"
						>
							<text class="weekday-text">{{ getWeekdayName(day - 1) }}</text>
						</view>
					</view>
				</view>

				<view v-if="timeConfig.mode !== 2" class="save-button-container">
					<button 
						class="save-button" 
						@click="saveTimeConfig"
						:disabled="saving"
					>
						<text class="save-button-text">{{ saving ? $t('parental_control.saving') : $t('parental_control.save') }}</text>
					</button>
				</view>
			</view>
		</view>

		<view v-if="currentTab === 2" class="user-config-container">
			<view v-if="loading" class="loading-overlay">
				<view class="loading-content">
					<view class="loading-spinner"></view>
					<text class="loading-text">{{ $t('parental_control.loading_settings') }}</text>
				</view>
			</view>

			<view v-else class="config-content">
				<view class="config-section">
					<view class="section-title">{{ $t('parental_control.user_mode') }}</view>
					<view class="mode-selector">
						<view 
							class="mode-item"
							:class="{ active: userConfig.mode === 0 }"
							@click="switchUserMode(0)"
						>
							<text class="mode-text">{{ $t('parental_control.auto_mode') }}</text>
						</view>
						<view 
							class="mode-item"
							:class="{ active: userConfig.mode === 1 }"
							@click="switchUserMode(1)"
						>
							<text class="mode-text">{{ $t('parental_control.manual_mode') }}</text>
						</view>
					</view>
				</view>

				<view v-if="userConfig.mode === 0" class="config-section">
					<view class="section-title">{{ $t('parental_control.all_users') }}</view>
					<view class="user-list">
						<view v-for="user in allUsers" :key="user.mac" class="user-item">
							<view class="user-info">
								<text class="user-name">{{ getUserDisplayName(user) }}</text>
								<text class="user-mac">{{ user.mac }}</text>
							</view>
							<view class="user-status">
								<text class="status-text" :class="{ online: user.online }">
									{{ user.online ? $t('parental_control.online') : $t('parental_control.offline') }}
								</text>
							</view>
						</view>
					</view>
				</view>

				<view v-if="userConfig.mode === 1" class="config-section">
					<view class="section-title" @click="toggleManualUsers">
						<view class="title-left">
							<image 
								class="expand-arrow" 
								:src="manualUsersExpanded ? '/static/align-bottom.png' : '/static/right.png'" 
								mode="widthFix" 
								style="width: 24rpx; height: 24rpx; margin-right: 15rpx;" 
							/>
							<text>{{ $t('parental_control.manual_users') }}</text>
						</view>
						<text class="user-count">({{ userConfig.list.length }})</text>
					</view>
					
					<view v-if="manualUsersExpanded" class="manual-users">
						<view v-for="(user, index) in userConfig.list" :key="index" class="manual-user-item">
							<view class="user-info">
								<text class="user-name">{{ getUserDisplayName(user) }}</text>
								<text class="user-mac">{{ user.mac }}</text>
							</view>
							<view class="remove-btn" @click="removeUserFromManual(index)">
								<text class="remove-text">×</text>
							</view>
						</view>
					</view>
					
					<view class="add-user-section">
						<view class="section-title">{{ $t('parental_control.add_user') }}</view>
						<view class="available-users">
							<view 
								v-for="user in getAvailableUsers()" 
								:key="user.mac"
								class="available-user-item"
								@click="addUserToManual(user)"
							>
								<view class="user-info">
									<text class="user-name">{{ getUserDisplayName(user) }}</text>
									<text class="user-mac">{{ user.mac }}</text>
								</view>
								<view class="add-btn">
									<text class="add-text">+</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<view class="save-button-container">
					<button 
						class="save-button" 
						@click="saveUserConfig"
						:disabled="saving"
					>
						<text class="save-button-text">{{ saving ? $t('parental_control.saving') : $t('parental_control.save') }}</text>
					</button>
				</view>
			</view>
		</view>
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
			loading: false,
			saving: false,
			deviceInfo: {},
			session: '',
			url: '/ubus',
			categories: [],
			selectedAppIds: [],
			/** base config from get_app_filter_base (for filter_mode & disable_quic) */
			baseConfig: {
				enable: 0,
				record_enable: 0,
				work_mode: 0,
				disable_quic: 0,
				app_filter_mode: 0
			},
			filterModeOptions: [
				{ value: 0, text: this.$t('parental_control.filter_mode_0') },
				{ value: 1, text: this.$t('parental_control.filter_mode_1') }
			],
			currentTab: 0,
			/** 应用过滤插件版本号，用于兼容 6.1.6+ 每时间段星期配置 */
			appFilterVersion: '',
			/** 大于此版本时支持在每个时间段内单独设置星期 */
			WEEKDAY_PER_SLOT_MIN_VERSION: '6.1.6',
			timeConfig: {
				mode: 0,
				time_list: [],
				weekday_list: [],
				allow_time: 20,
				deny_time: 60,
				start_time: '00:00',
				end_time: '23:59',
				daily_time_list: [],
				current_time: '',
				current_weekday: 0,
				current_am_limit: 0,
				current_pm_limit: 0,
				current_am_used_time: 0,
				current_pm_used_time: 0,
				current_day_enabled: 0
			},
			userConfig: {
				mode: 0, 
				list: [] 
			},
			allUsers: [],
			manualUsersExpanded: false,
			/** Timer for refreshing duration usage in mode 2 */
			durationRefreshTimer: null
		}
	},
	onShow() {
		if (this.currentTab === 1 && Number(this.timeConfig.mode) === 2) {
			this.startDurationRefreshTimer()
		}
	},
	onHide() {
		this.clearDurationRefreshTimer()
	},
	onUnload() {
		this.clearDurationRefreshTimer()
	},
	computed: {
		tab_list() {
			return [
				{ value: 0, label: this.$t('parental_control.app_filter_rules') },
				{ value: 1, label: this.$t('parental_control.time_config') },
				{ value: 2, label: this.$t('parental_control.user_config') }
			]
		},
		/** 版本 > 6.1.6 时，固定时间模式下星期按时间段配置，否则为全局 */
		supportsWeekdayPerSlot() {
			if (!this.appFilterVersion || this.appFilterVersion === '--') return false
			return this.compareVersions(this.appFilterVersion, this.WEEKDAY_PER_SLOT_MIN_VERSION) > 0
		},
		/** 固定时间模式下是否显示全局星期选择（仅 <=6.1.6 或 动态时间模式）；mode 2 不显示 */
		showGlobalWeekdays() {
			if (this.timeConfig.mode === 2) return false
			if (this.timeConfig.mode === 1) return true
			return !this.supportsWeekdayPerSlot
		},
		/** 上网时长模式表格显示顺序：API 0=周日，将周日放最后显示为 周一..周六, 周日 */
		dailyDisplayOrder() {
			return [1, 2, 3, 4, 5, 6, 0]
		},
		/** 时间模式下拉选项；仅版本 > 6.1.6 时包含上网时长模式 */
		timeModeOptions() {
			const opts = [
				this.$t('parental_control.fixed_time'),
				this.$t('parental_control.dynamic_time')
			]
			if (this.supportsWeekdayPerSlot) {
				opts.push(this.$t('parental_control.duration_mode'))
			}
			return opts
		},
		/** 时间模式 picker 当前下标（选项少于 3 时 mode=2 映射到有效下标） */
		timeModePickerValue() {
			const len = this.timeModeOptions.length
			const mode = Number(this.timeConfig.mode) || 0
			return Math.min(mode, len - 1)
		},
		amUsageBarStyle() {
			const limit = this.timeConfig.current_am_limit || 0
			const used = Math.min(Number(this.timeConfig.current_am_used_time) || 0, limit || 1)
			const pct = limit > 0 ? (used / limit) * 100 : 0
			return { width: pct + '%' }
		},
		pmUsageBarStyle() {
			const limit = this.timeConfig.current_pm_limit || 0
			const used = Math.min(Number(this.timeConfig.current_pm_used_time) || 0, limit || 1)
			const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
			return { width: pct + '%' }
		},
		amUsageText() {
			const used = Number(this.timeConfig.current_am_used_time) || 0
			const limit = Number(this.timeConfig.current_am_limit) || 0
			const min = this.$t('parental_control.minutes')
			if (limit <= 0) return '0/' + limit + min
			return used + '/' + limit + min
		},
		pmUsageText() {
			const used = Number(this.timeConfig.current_pm_used_time) || 0
			const limit = Number(this.timeConfig.current_pm_limit) || 0
			const min = this.$t('parental_control.minutes')
			if (limit <= 0) return '0/' + limit + min
			if (used >= limit) return this.$t('parental_control.used_up_total') + ': ' + limit + min + ')'
			return used + '/' + limit + min
		}
	},
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('parental_control.app_filter_rules')
		})
		
		this.deviceInfo = DeviceManager.getCurrentDevice()
		this.session = this.deviceInfo.sysauth
		const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
		const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
		this.url = `${protocol}://${formattedHost}:${this.deviceInfo.port}/ubus`
		
		this.loadData()
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		on_tab_change(payload) {
			const index = payload && payload.value !== undefined ? payload.value : 0
			this.switchTab(index)
		},

		switchTab(index) {
			if (this.currentTab === 1 && index !== 1) this.clearDurationRefreshTimer()
			this.currentTab = index
			if (index === 0 && this.categories.length === 0) {
				this.loadData()
			} else if (index === 1) {
				this.loadTimeConfig()
			} else if (index === 2) {
				this.loadUserConfig()
			}
		},
		
		loadData() {
			this.loading = true
			this.loadAppFilterBase()
				.then(() => this.loadAppCategories())
				.then(() => this.loadSelectedApps())
				.finally(() => {
					this.loading = false
				})
		},

		loadAppFilterBase() {
			return new Promise((resolve) => {
				uni.request({
					method: 'POST',
					url: this.url,
					data: {
						jsonrpc: '2.0',
						id: 0,
						method: 'call',
						params: [this.session, 'appfilter', 'get_app_filter_base', {}]
					},
					header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
					timeout: 5000,
					success: (res) => {
						if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
							const data = res.data.result[1].data
							// Keep all fields from get so save does not affect other fields
							this.baseConfig = { ...data }
							this.baseConfig.enable = data.enable === 1 ? 1 : 0
							this.baseConfig.record_enable = data.record_enable === 1 ? 1 : 0
							this.baseConfig.work_mode = data.work_mode != null ? Number(data.work_mode) : 0
							this.baseConfig.disable_quic = data.disable_quic === 1 ? 1 : 0
							this.baseConfig.app_filter_mode = data.app_filter_mode != null ? Number(data.app_filter_mode) : 0
						}
						resolve()
					},
					fail: () => resolve()
				})
			})
		},

		getFilterModePickerIndex() {
			const i = this.filterModeOptions.findIndex(opt => opt.value === this.baseConfig.app_filter_mode)
			return i >= 0 ? i : 0
		},

		getFilterModeText(mode) {
			const opt = this.filterModeOptions.find(o => o.value === mode)
			return opt ? opt.text : '--'
		},

		onAppFilterModeChange(e) {
			const idx = e.detail.value != null ? parseInt(e.detail.value, 10) : 0
			const opt = this.filterModeOptions[idx]
			if (opt) this.baseConfig.app_filter_mode = opt.value
		},

		onDisableQuicChange(e) {
			this.baseConfig.disable_quic = e.detail.value ? 1 : 0
		},
		
		loadAppCategories() {
			return new Promise((resolve, reject) => {
				uni.request({
					method: 'POST',
					url: this.url,
					data: {
						jsonrpc: '2.0',
						id: 1,
						method: 'call',
						params: [this.session, 'appfilter', 'class_list', {}]
					},
					header: {
						'Content-Type': 'application/json',
						'x-uniauth': 'true'
					},
					timeout: 5000,
					success: (res) => {
						if (res.data && res.data.result && res.data.result[1] && res.data.result[1].class_list) {
							this.categories = res.data.result[1].class_list.map(category => ({
								name: category.name,
								expanded: false,
								allSelected: false,
								apps: category.app_list.map(appStr => {
									const [id, name, icon] = appStr.split(',')
									return {
										id: parseInt(id),
										name: name,
										icon: parseInt(icon),
										selected: false,
										iconError: false
									}
								})
							}))
						}
						resolve()
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		
		loadSelectedApps() {
			return new Promise((resolve, reject) => {
				uni.request({
					method: 'POST',
					url: this.url,
					data: {
						jsonrpc: '2.0',
						id: 2,
						method: 'call',
						params: [this.session, 'appfilter', 'get_app_filter', {}]
					},
					header: {
						'Content-Type': 'application/json',
						'x-uniauth': 'true'
					},
					timeout: 5000,
					success: (res) => {
						if (res.data && res.data.result && res.data.result[1] && res.data.result[1].app_list) {
							this.selectedAppIds = res.data.result[1].app_list
							this.$nextTick(() => {
								this.updateAppSelection()
							})
						}
						resolve()
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		
		updateAppSelection() {
			this.categories.forEach(category => {
				category.apps.forEach(app => {
					app.selected = this.selectedAppIds.includes(app.id)
				})
				this.updateCategorySelection(category)
			})
		},
		
		updateCategorySelection(category) {
			const selectedCount = category.apps.filter(app => app.selected).length
			category.allSelected = selectedCount === category.apps.length && category.apps.length > 0
		},
		
		toggleCategory(index) {
			this.categories[index].expanded = !this.categories[index].expanded
		},
		
		toggleCategorySelect(index) {
			const category = this.categories[index]
			const newState = !category.allSelected
			
			
			category.apps.forEach(app => {
				app.selected = newState
			})
			
			category.allSelected = newState
		},
		
		toggleAppSelect(categoryIndex, appIndex) {
			const app = this.categories[categoryIndex].apps[appIndex]
			app.selected = !app.selected
			this.updateCategorySelection(this.categories[categoryIndex])
		},
		
		getSelectedCount(category) {
			return category.apps.filter(app => app.selected).length
		},

		/** 比较版本号，返回值：>0 表示 v1>v2，<0 表示 v1<v2，0 表示相等 */
		compareVersions(version1, version2) {
			const v1Parts = (version1 || '').split('.').map(Number)
			const v2Parts = (version2 || '').split('.').map(Number)
			while (v1Parts.length < 3) v1Parts.push(0)
			while (v2Parts.length < 3) v2Parts.push(0)
			for (let i = 0; i < 3; i++) {
				if (v1Parts[i] > v2Parts[i]) return 1
				if (v1Parts[i] < v2Parts[i]) return -1
			}
			return 0
		},

		loadTimeConfig() {
			this.loading = true
			// 先获取版本号，再拉取时间配置，用于兼容 6.1.6+ 每时间段星期
			const fetchVersion = () => {
				return new Promise((resolve) => {
					uni.request({
						method: 'POST',
						url: this.url,
						data: {
							jsonrpc: '2.0',
							id: 40,
							method: 'call',
							params: [this.session, 'appfilter', 'get_oaf_status', {}]
						},
						header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
						timeout: 5000,
						success: (res) => {
							if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
								this.appFilterVersion = res.data.result[1].data.version || '--'
								console.log('[时间配置] get_oaf_status 返回 version:', this.appFilterVersion, 'raw:', res.data.result[1].data)
							} else {
								console.log('[时间配置] get_oaf_status 返回异常:', res.data)
							}
							resolve()
						},
						fail: (err) => {
							console.log('[时间配置] get_oaf_status 请求失败:', err)
							resolve()
						}
					})
				})
			}
			const fetchTimeConfig = () => {
				console.log('[时间配置] 请求 get_app_filter_time', { url: this.url })
				return new Promise((resolve) => {
					uni.request({
						method: 'POST',
						url: this.url,
						data: {
							jsonrpc: '2.0',
							id: 4,
							method: 'call',
							params: [this.session, 'appfilter', 'get_app_filter_time', {}]
						},
						header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
						timeout: 5000,
						success: (res) => {
							if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
								const data = res.data.result[1].data
								console.log('[时间配置] get_app_filter_time 返回:', JSON.stringify(data))
								this.timeConfig = data
								this.normalizeTimeConfigAfterLoad()
							} else {
								console.log('[时间配置] get_app_filter_time 返回异常:', res.data)
							}
							resolve()
						},
						fail: (err) => {
							console.log('[时间配置] get_app_filter_time 请求失败:', err)
							resolve()
						}
					})
				})
			}
			// 必须先拿到版本号再拉取时间配置并渲染，否则 supportsWeekdayPerSlot 判断会错
			fetchVersion()
				.then(() => fetchTimeConfig())
				.then(() => {
					if (Number(this.timeConfig.mode) === 2) this.startDurationRefreshTimer()
				})
				.finally(() => {
					this.loading = false
				})
		},

		/** 上网时长模式下静默刷新当前时长数据（仅更新 current_* 等展示字段） */
		refreshDurationUsage() {
			if (Number(this.timeConfig.mode) !== 2) return
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 4,
					method: 'call',
					params: [this.session, 'appfilter', 'get_app_filter_time', {}]
				},
				header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
				timeout: 5000,
				success: (res) => {
					if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
						const data = res.data.result[1].data
						this.timeConfig.current_time = data.current_time
						this.timeConfig.current_weekday = data.current_weekday
						this.timeConfig.current_am_limit = data.current_am_limit
						this.timeConfig.current_pm_limit = data.current_pm_limit
						this.timeConfig.current_am_used_time = data.current_am_used_time
						this.timeConfig.current_pm_used_time = data.current_pm_used_time
						this.timeConfig.current_day_enabled = data.current_day_enabled
					}
				}
			})
		},

		startDurationRefreshTimer() {
			this.clearDurationRefreshTimer()
			this.durationRefreshTimer = setInterval(() => {
				if (this.currentTab !== 1 || Number(this.timeConfig.mode) !== 2) {
					this.clearDurationRefreshTimer()
					return
				}
				this.refreshDurationUsage()
			}, 3000)
		},

		clearDurationRefreshTimer() {
			if (this.durationRefreshTimer) {
				clearInterval(this.durationRefreshTimer)
				this.durationRefreshTimer = null
			}
		},

		/** 加载后根据版本/模式规范化 */
		normalizeTimeConfigAfterLoad() {
			if (this.timeConfig.mode === 2) {
				const list = this.timeConfig.daily_time_list || []
				const defaultDay = () => ({ enable: 0, am_time: 0, pm_time: 0 })
				while (list.length < 7) list.push(defaultDay())
				this.timeConfig.daily_time_list = list.slice(0, 7)
				return
			}
			if (!this.timeConfig.time_list || !Array.isArray(this.timeConfig.time_list)) return
			if (this.supportsWeekdayPerSlot) {
				this.timeConfig.time_list.forEach(slot => {
					if (!Array.isArray(slot.weekday_list)) {
						slot.weekday_list = [0, 1, 2, 3, 4, 5, 6]
					}
				})
			} else {
				this.timeConfig.time_list.forEach(slot => {
					delete slot.weekday_list
				})
			}
		},
		
		loadUserConfig() {
			this.loading = true
			Promise.all([
				this.getUserConfig(),
				this.getAllUsers()
			]).finally(() => {
				this.loading = false
			})
		},
		
		getUserConfig() {
			return new Promise((resolve, reject) => {
				uni.request({
					method: 'POST',
					url: this.url,
					data: {
						jsonrpc: '2.0',
						id: 5,
						method: 'call',
						params: [this.session, 'appfilter', 'get_app_filter_user', {}]
					},
					header: {
						'Content-Type': 'application/json',
						'x-uniauth': 'true'
					},
					timeout: 5000,
					success: (res) => {

						if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
							this.userConfig = res.data.result[1].data
						}
						resolve()
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		
		getAllUsers() {
			return new Promise((resolve, reject) => {
				uni.request({
					method: 'POST',
					url: this.url,
					data: {
						jsonrpc: '2.0',
						id: 6,
						method: 'call',
						params: [this.session, 'appfilter', 'get_all_users', { flag: 3 }]
					},
					header: {
						'Content-Type': 'application/json',
						'x-uniauth': 'true'
					},
					timeout: 5000,
					success: (res) => {
						if (res.data && res.data.result && res.data.result[1] && res.data.result[1].data) {
							this.allUsers = res.data.result[1].data.list || []
						}
						resolve()
					},
					fail: (err) => {
						reject(err)
					}
				})
			})
		},
		
		saveTimeConfig() {
			const payload = this.buildTimeConfigPayload()
			console.log('[时间配置] 请求 set_app_filter_time 提交:', JSON.stringify(payload))
			this.saving = true
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 7,
					method: 'call',
					params: [this.session, 'appfilter', 'set_app_filter_time', payload]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 5000,
				success: (res) => {
					console.log('[时间配置] set_app_filter_time 返回:', res.data)
					if (res.data && res.data.result && res.data.result[0] === 0) {
						uni.showToast({
							title: this.$t('parental_control.save_success'),
							icon: 'success'
						})
					} else {
						uni.showToast({
							title: this.$t('parental_control.save_failed'),
							icon: 'error'
						})
					}
					this.saving = false
				},
				fail: (err) => {
					console.log('[时间配置] set_app_filter_time 请求失败:', err)
					uni.showToast({
						title: this.$t('parental_control.save_failed'),
						icon: 'error'
					})
					this.saving = false
				}
			})
		},
		
		saveUserConfig() {
			this.saving = true
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 8,
					method: 'call',
					params: [this.session, 'appfilter', 'set_app_filter_user', { mode: this.userConfig.mode }]
				},
				header: {
					'Content-Type': 'application/json',
					'x-uniauth': 'true'
				},
				timeout: 5000,
				success: (res) => {
					if (res.data && res.data.result && res.data.result[0] === 0) {
						uni.showToast({
							title: this.$t('parental_control.save_success'),
							icon: 'success'
						})
					} else {
						uni.showToast({
							title: this.$t('parental_control.save_failed'),
							icon: 'error'
						})
					}
					this.saving = false
				},
				fail: (err) => {
					uni.showToast({
						title: this.$t('parental_control.save_failed'),
						icon: 'error'
					})
					this.saving = false
				}
			})
		},
		
		switchTimeMode(mode) {
			this.timeConfig.mode = mode
			if (Number(mode) !== 2) this.clearDurationRefreshTimer()
			else this.startDurationRefreshTimer()
			if (mode === 2 && (!this.timeConfig.daily_time_list || this.timeConfig.daily_time_list.length < 7)) {
				const defaultDay = () => ({ enable: 0, am_time: 0, pm_time: 0 })
				this.timeConfig.daily_time_list = Array.from({ length: 7 }, (_, i) => {
					const existing = (this.timeConfig.daily_time_list || [])[i]
					return existing ? { ...existing } : defaultDay()
				})
			}
		},
		onTimeModePickerChange(e) {
			const index = e.detail.value != null ? Number(e.detail.value) : 0
			this.switchTimeMode(index)
		},
		
		switchUserMode(mode) {
			this.userConfig.mode = mode
		},
		
		/** 保存时按版本/模式组装 */
		buildTimeConfigPayload() {
			const config = { ...this.timeConfig }
			if (!this.supportsWeekdayPerSlot && config.mode === 2) {
				config.mode = 1
			}
			const list = (config.time_list || []).map(slot => ({ ...slot }))
			if (this.timeConfig.mode === 0) {
				if (this.supportsWeekdayPerSlot) {
					config.time_list = list.map(slot => ({
						start: slot.start,
						end: slot.end,
						weekday_list: Array.isArray(slot.weekday_list) ? slot.weekday_list : [0, 1, 2, 3, 4, 5, 6]
					}))
				} else {
					config.time_list = list.map(slot => {
						const { weekday_list, ...rest } = slot
						return rest
					})
				}
			}
			if (this.timeConfig.mode === 2) {
				config.daily_time_list = (this.timeConfig.daily_time_list || []).slice(0, 7).map(d => ({
					enable: d.enable === 1 ? 1 : 0,
					am_time: Math.max(0, parseInt(d.am_time, 10) || 0),
					pm_time: Math.max(0, parseInt(d.pm_time, 10) || 0)
				}))
			}
			return config
		},

		addTimeSlot() {
			const slot = { start: '00:00', end: '23:59' }
			if (this.supportsWeekdayPerSlot) {
				slot.weekday_list = [0, 1, 2, 3, 4, 5, 6]
			}
			this.timeConfig.time_list.push(slot)
		},
		
		removeTimeSlot(index) {
			this.timeConfig.time_list.splice(index, 1)
		},
		
		toggleWeekday(day) {
			const index = this.timeConfig.weekday_list.indexOf(day)
			if (index > -1) {
				this.timeConfig.weekday_list.splice(index, 1)
			} else {
				this.timeConfig.weekday_list.push(day)
			}
		},

		/** 6.1.6+ 固定时间下，切换某时间段的星期 */
		toggleWeekdayForSlot(slotIndex, day) {
			const slot = this.timeConfig.time_list[slotIndex]
			if (!slot || !Array.isArray(slot.weekday_list)) return
			const idx = slot.weekday_list.indexOf(day)
			if (idx > -1) {
				slot.weekday_list.splice(idx, 1)
			} else {
				slot.weekday_list.push(day)
			}
		},
		
		getWeekdayName(day) {
			const weekdays = [
				this.$t('parental_control.sunday'),
				this.$t('parental_control.monday'),
				this.$t('parental_control.tuesday'),
				this.$t('parental_control.wednesday'),
				this.$t('parental_control.thursday'),
				this.$t('parental_control.friday'),
				this.$t('parental_control.saturday')
			]
			return weekdays[day]
		},
		/** daily_time_list index: 0=Sun, 1=Mon, ..., 6=Sat (API). Display name by index. */
		getWeekdayNameForDaily(apiIndex) {
			if (apiIndex === undefined || apiIndex === null) return '--'
			const i = parseInt(apiIndex, 10)
			if (i < 0 || i > 6) return '--'
			return this.getWeekdayName(i)
		},
		setDailyEnable(idx, checked) {
			const list = this.timeConfig.daily_time_list || []
			if (!list[idx]) return
			list[idx].enable = checked ? 1 : 0
		},
		setDailyAmTime(idx, val) {
			const list = this.timeConfig.daily_time_list || []
			if (!list[idx]) return
			list[idx].am_time = Math.max(0, parseInt(val, 10) || 0)
		},
		setDailyPmTime(idx, val) {
			const list = this.timeConfig.daily_time_list || []
			if (!list[idx]) return
			list[idx].pm_time = Math.max(0, parseInt(val, 10) || 0)
		},
		clearTodayUsage() {
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 41,
					method: 'call',
					params: [this.session, 'appfilter', 'cmd', { action: 'clear_active_time' }]
				},
				header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
				timeout: 5000,
				success: (res) => {
					if (res.data && res.data.result) {
						this.refreshDurationUsage()
						uni.showToast({ title: this.$t('parental_control.clear'), icon: 'success' })
					} else {
						uni.showToast({ title: 'Failed', icon: 'none' })
					}
				},
				fail: () => {
					uni.showToast({ title: 'Failed', icon: 'none' })
				}
			})
		},
		
		addUserToManual(user) {
			this.saving = true
				uni.request({
					method: 'POST',
					url: this.url,
					data: {
						jsonrpc: '2.0',
						id: 9,
						method: 'call',
						params: [this.session, 'appfilter', 'add_app_filter_user', { mac_list: [user.mac] }]
					},
					header: {
						'Content-Type': 'application/json',
						'x-uniauth': 'true'
					},
				timeout: 5000,
				success: (res) => {
					if (res.data && res.data.result && res.data.result[0] === 0) {
						this.userConfig.list.push({
							mac: user.mac,
							nickname: user.nickname || '',
							hostname: user.hostname || ''
						})
						uni.showToast({
							title: this.$t('parental_control.save_success'),
							icon: 'success'
						})
					} else {
						uni.showToast({
							title: this.$t('parental_control.save_failed'),
							icon: 'error'
						})
					}
					this.saving = false
				},
				fail: (err) => {
					uni.showToast({
						title: this.$t('parental_control.save_failed'),
						icon: 'error'
					})
					this.saving = false
				}
			})
		},
		
		removeUserFromManual(index) {
			const user = this.userConfig.list[index]
			if (user) {
				this.saving = true
				uni.request({
					method: 'POST',
					url: this.url,
					data: {
						jsonrpc: '2.0',
						id: 10,
						method: 'call',
						params: [this.session, 'appfilter', 'del_app_filter_user', { mac: user.mac }]
					},
					header: {
						'Content-Type': 'application/json',
						'x-uniauth': 'true'
					},
					timeout: 5000,
					success: (res) => {
						if (res.data && res.data.result && res.data.result[0] === 0) {
							this.userConfig.list.splice(index, 1)
							uni.showToast({
								title: this.$t('parental_control.save_success'),
								icon: 'success'
							})
						} else {
							uni.showToast({
								title: this.$t('parental_control.save_failed'),
								icon: 'error'
							})
						}
						this.saving = false
					},
					fail: (err) => {
						uni.showToast({
							title: this.$t('parental_control.save_failed'),
							icon: 'error'
						})
						this.saving = false
					}
				})
			}
		},
		

		getUserDisplayName(user) {
			return user.nickname || user.hostname || user.mac
		},
		

		getAvailableUsers() {
			const manualUserMacs = this.userConfig.list.map(user => user.mac)
			return this.allUsers.filter(user => !manualUserMacs.includes(user.mac))
		},
		

		toggleManualUsers() {
			this.manualUsersExpanded = !this.manualUsersExpanded
		},
		
		getAppIconUrl(appId) {
			const protocol = this.deviceInfo.useHttps ? 'https' : 'http'
			const formattedHost = DeviceManager.formatHostForUrl(this.deviceInfo.ip)
			return `${protocol}://${formattedHost}:${this.deviceInfo.port}/luci-static/resources/app_icons/${appId}.png`
		},
		
		onIconError(event, appId) {
			this.categories.forEach(category => {
				category.apps.forEach(app => {
					if (app.id === appId) {
						app.iconError = true
					}
				})
			})
		},
		
		saveRules() {
			this.saving = true
			
			const selectedIds = []
			this.categories.forEach(category => {
				category.apps.forEach(app => {
					if (app.selected) {
						selectedIds.push(app.id)
					}
				})
			})
			
			// Send full base config from get to avoid affecting other fields
			const baseParams = { ...this.baseConfig }
			uni.request({
				method: 'POST',
				url: this.url,
				data: {
					jsonrpc: '2.0',
					id: 3,
					method: 'call',
					params: [this.session, 'appfilter', 'set_app_filter_base', baseParams]
				},
				header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
				timeout: 5000,
				success: (res) => {
					uni.request({
						method: 'POST',
						url: this.url,
						data: {
							jsonrpc: '2.0',
							id: 4,
							method: 'call',
							params: [this.session, 'appfilter', 'set_app_filter', { app_list: selectedIds }]
						},
						header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
						timeout: 5000,
						success: (r) => {
							this.saving = false
							if (r.data && r.data.result && r.data.result[0] === 0) {
								uni.showToast({ title: this.$t('parental_control.save_success'), icon: 'success' })
								setTimeout(() => uni.navigateBack(), 1500)
							} else {
								uni.showToast({ title: this.$t('parental_control.save_failed'), icon: 'none' })
							}
						},
						fail: () => {
							this.saving = false
							uni.showToast({ title: this.$t('parental_control.save_failed'), icon: 'none' })
						}
					})
				},
				fail: () => {
					this.saving = false
					uni.showToast({ title: this.$t('parental_control.save_failed'), icon: 'none' })
				}
			})
		}
	}
}
</script>

<style scoped>
@import '@/styles/common.scss';

.tab-container {

	display: flex;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 12rpx;
	padding: 8rpx;
}
.container {
	padding: 20rpx;
}
.tab-item {
	flex: 1;
	text-align: center;
	padding: 15rpx 0;
	border-radius: 8rpx;
	transition: all 0.3s ease;
}

.tab-item.active {
	background: rgba(255, 255, 255, 0.2);
}

.tab-text {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.8);
	font-weight: 500;
}

.tab-item.active .tab-text {
	color: #fff;
	font-weight: 600;
}

.time-config-container,
.user-config-container {
	padding: 10rpx;
}

.config-content {
	padding-bottom: 40rpx;
}

.config-section {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.section-title {
	font-size: 32rpx;
	color: #333;
	font-weight: 600;
	margin-bottom: 20rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.title-left {
	display: flex;
	align-items: center;
}

.user-count {
	font-size: 28rpx;
	color: #666;
	font-weight: 500;
}

.mode-selector {
	display: flex;
	background: rgba(0, 0, 0, 0.05);
	border-radius: 12rpx;
	padding: 6rpx;
}

.mode-item {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	border-radius: 8rpx;
	transition: all 0.3s ease;
}

.mode-item.active {
	background: #007AFF;
}

.mode-text {
	font-size: 28rpx;
	color: #666;
	font-weight: 500;
}

.mode-item.active .mode-text {
	color: #fff;
	font-weight: 600;
}

.mode-selector-three .mode-item {
	padding: 16rpx 8rpx;
}
.mode-selector-three .mode-text {
	font-size: 24rpx;
}

.mode-dropdown {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12rpx 16rpx;
	background: rgba(0, 0, 0, 0.05);
	border-radius: 10rpx;
	border: 1rpx solid rgba(0, 0, 0, 0.08);
	margin-top: 12rpx;
}
.mode-dropdown-text {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
	flex: 1;
}
.mode-dropdown-arrow {
	font-size: 18rpx;
	color: #666;
	margin-left: 8rpx;
}

.duration-mode-desc {
	font-size: 26rpx;
	color: #666;
	line-height: 1.5;
	margin-bottom: 24rpx;
}

.today-usage-card {
	border: 2rpx solid rgba(0, 122, 255, 0.3);
	border-radius: 12rpx;
	padding: 24rpx;
	margin-bottom: 24rpx;
	background: rgba(0, 122, 255, 0.04);
}

.today-usage-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 12rpx;
}

.today-weekday {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 20rpx;
}

.usage-row {
	margin-bottom: 24rpx;
}

.usage-label {
	display: block;
	font-size: 26rpx;
	color: #333;
	margin-bottom: 8rpx;
}

.usage-bar-wrap {
	width: 100%;
	height: 24rpx;
	background: rgba(0, 0, 0, 0.08);
	border-radius: 12rpx;
	overflow: hidden;
	margin-bottom: 6rpx;
}

.usage-bar {
	height: 100%;
	background: #007AFF;
	border-radius: 12rpx;
	transition: width 0.2s;
}

.usage-bar.pm {
	background: #007AFF;
}

.usage-text-below {
	display: block;
	font-size: 24rpx;
	color: #666;
}

.usage-no-limit {
	font-size: 24rpx;
	color: #007AFF;
	font-weight: 500;
}

.today-usage-actions {
	margin-top: 20rpx;
}

.clear-usage-btn {
	font-size: 26rpx;
	color: #ff4757;
	background: transparent;
	border: 1rpx solid #ff4757;
	border-radius: 8rpx;
	padding: 12rpx 24rpx;
}

.daily-table-wrap {
	margin-bottom: 20rpx;
	overflow-x: auto;
}

.daily-table-header {
	display: flex;
	align-items: center;
	padding: 16rpx 12rpx;
	background: rgba(0, 0, 0, 0.06);
	border-radius: 8rpx 8rpx 0 0;
	font-size: 24rpx;
	font-weight: 600;
	color: #333;
}

.daily-table-row {
	display: flex;
	align-items: center;
	padding: 16rpx 12rpx;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
	font-size: 26rpx;
}

.daily-table-row.current {
	background: rgba(0, 122, 255, 0.08);
}

.daily-th, .daily-td {
	box-sizing: border-box;
}

.weekday-col {
	flex: 0 0 140rpx;
}

.enable-col {
	flex: 0 0 100rpx;
	display: flex;
	align-items: center;
}

.am-col, .pm-col {
	flex: 1;
	min-width: 0;
}

.daily-input {
	width: 100%;
	padding: 8rpx 12rpx;
	font-size: 26rpx;
	border: 1rpx solid #ddd;
	border-radius: 8rpx;
	text-align: center;
}

.duration-hint {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 24rpx;
	line-height: 1.4;
}

.duration-actions {
	padding: 40rpx 20rpx 0;
}

.duration-save-btn {
	width: 100%;
	height: 88rpx;
	background: #007AFF;
	border: none;
	border-radius: 16rpx;
	display: flex;
	justify-content: center;
	align-items: center;
}

.duration-save-btn:active {
	opacity: 0.9;
}

.duration-save-btn[disabled] {
	background: #ccc;
}

.duration-save-text {
	font-size: 32rpx;
	color: #fff;
	font-weight: 600;
}

.time-slots {
	margin-top: 20rpx;
}

.time-slot-wrap {
	margin-bottom: 24rpx;
	background: #fff;
	border-radius: 16rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

/* 第一排：星期 + 删除（6.1.6+ 每时间段星期时显示） */
.slot-weekdays-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6rpx 16rpx 8rpx;
	background: linear-gradient(180deg, rgba(0, 122, 255, 0.06) 0%, rgba(255,255,255,0) 100%);
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
}

.slot-weekdays {
	display: flex;
	flex-wrap: nowrap;
	gap: 6rpx;
	flex: 1;
	min-width: 0;
}

.slot-weekday-pill {
	flex: 1;
	min-width: 0;
	padding: 2rpx 2rpx;
	text-align: center;
	border-radius: 6rpx;
	background: rgba(0, 0, 0, 0.04);
	border: 1rpx solid rgba(0, 0, 0, 0.06);
	transition: all 0.2s ease;
}

.slot-weekday-pill.active {
	background: #007AFF;
	border-color: #007AFF;
	box-shadow: 0 2rpx 6rpx rgba(0, 122, 255, 0.35);
}

.slot-weekday-label {
	font-size: 18rpx;
	color: #666;
	font-weight: 500;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	line-height: 1.2;
}

.slot-weekday-pill.active .slot-weekday-label {
	color: #fff;
	font-weight: 600;
}

.slot-remove-btn {
	width: 44rpx;
	height: 44rpx;
	margin-left: 12rpx;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 71, 87, 0.12);
	border-radius: 10rpx;
	transition: background 0.2s;
}

.slot-remove-btn:active {
	background: rgba(255, 71, 87, 0.25);
}

.slot-remove-icon {
	color: #ff4757;
	font-size: 28rpx;
	font-weight: 300;
	line-height: 1;
}

/* 第二排：时间选择 */
.time-slot-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 24rpx;
	background: #fff;
}

.time-slot-row.has-weekdays {
	background: #fafbfc;
}

.time-pickers {
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
}

.time-picker {
	padding: 10rpx 15rpx;
	background: #fff;
	border-radius: 8rpx;
	font-size: 28rpx;
	color: #333;
	border: 1rpx solid #ddd;
}

.time-separator {
	margin: 0 20rpx;
	font-size: 28rpx;
	color: #666;
}

.remove-btn {
	width: 56rpx;
	height: 56rpx;
	flex-shrink: 0;
	background: rgba(255, 71, 87, 0.12);
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-left: 20rpx;
	transition: background 0.2s;
}

.remove-btn:active {
	background: rgba(255, 71, 87, 0.25);
}

.remove-text {
	color: #ff4757;
	font-size: 36rpx;
	font-weight: 300;
	line-height: 1;
}

.add-slot-btn {
	padding: 20rpx;
	background: rgba(0, 122, 255, 0.1);
	border-radius: 12rpx;
	text-align: center;
	border: 2rpx dashed #007AFF;
}

.add-text {
	font-size: 28rpx;
	color: #007AFF;
	font-weight: 500;
}

.dynamic-settings {
	margin-top: 20rpx;
}

.setting-item {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
	padding: 20rpx;
	background: rgba(0, 0, 0, 0.05);
	border-radius: 12rpx;
}

.setting-label {
	font-size: 28rpx;
	color: #333;
	width: 200rpx;
}

.setting-input {
	flex: 1;
	padding: 15rpx 20rpx;
	background: #fff;
	border-radius: 8rpx;
	font-size: 28rpx;
	color: #333;
	border: 1rpx solid #ddd;
	margin: 0 20rpx;
}

.setting-unit {
	font-size: 24rpx;
	color: #666;
}

.weekday-selector {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
	margin-top: 12rpx;
}

.weekday-item {
	padding: 4rpx 14rpx;
	background: rgba(0, 0, 0, 0.05);
	border-radius: 8rpx;
	border: 1rpx solid transparent;
	transition: all 0.3s ease;
}

.weekday-item.active {
	background: #007AFF;
	border-color: #007AFF;
}

.weekday-text {
	font-size: 22rpx;
	color: #666;
	font-weight: 500;
	line-height: 1.3;
}

.weekday-item.active .weekday-text {
	color: #fff;
	font-weight: 600;
}

/* 用户列表 */
.user-list,
.manual-users,
.available-users {
	margin-top: 20rpx;
}

.user-item,
.manual-user-item,
.available-user-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	background: rgba(0, 0, 0, 0.05);
	border-radius: 12rpx;
	margin-bottom: 15rpx;
}

.user-info {
	flex: 1;
}

.user-name {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	display: block;
	margin-bottom: 8rpx;
}

.user-mac {
	font-size: 24rpx;
	color: #666;
}

.user-status {
	display: flex;
	align-items: center;
}

.status-text {
	font-size: 24rpx;
	color: #999;
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	background: rgba(0, 0, 0, 0.1);
}

.status-text.online {
	color: #27ae60;
	background: rgba(39, 174, 96, 0.1);
}

.add-btn {
	width: 60rpx;
	height: 60rpx;
	background: #27ae60;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.add-text {
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
}

.add-user-section {
	margin-top: 30rpx;
	padding-top: 30rpx;
	border-top: 1rpx solid #f0f0f0;
}

.loading-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 9999;
}

.loading-content {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	padding: 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.loading-spinner {
	width: 60rpx;
	height: 60rpx;
	border: 4rpx solid #f3f3f3;
	border-top: 4rpx solid #007AFF;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 20rpx;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.loading-text {
	font-size: 28rpx;
	color: #666;
}

.rules-container {
}

.rules-options {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 12rpx;
	padding: 20rpx 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.rules-option-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12rpx 0;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
}

.rules-option-row:last-child {
	border-bottom: none;
}

.rules-option-label {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.rules-option-picker {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 16rpx;
	background: rgba(0, 0, 0, 0.05);
	border-radius: 8rpx;
	font-size: 26rpx;
	color: #333;
}

.rules-option-value {
	flex: 1;
}

.rules-option-arrow {
	font-size: 20rpx;
	color: #666;
}

.all-apps-mode-hint {
	margin: 24rpx 0;
	padding: 24rpx;
	background: rgba(255, 152, 0, 0.1);
	border-radius: 12rpx;
	border: 1rpx solid rgba(255, 152, 0, 0.3);
}

.all-apps-mode-hint-text {
	font-size: 26rpx;
	color: #e65100;
	line-height: 1.5;
}

.category-list {
	margin-bottom: 20rpx;
}

.category-card {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
	overflow: hidden;
}

.category-header {
	padding: 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1rpx solid #f0f0f0;
}

.category-left {
	flex: 1;
	display: flex;
	align-items: center;
}

.category-info {
	flex: 1;
}

.category-name {
	font-size: 32rpx;
	color: #333;
	font-weight: 600;
	margin-right: 10rpx;
}

.category-count {
	font-size: 24rpx;
	color: #666;
}

.category-right {
	display: flex;
	align-items: center;
}

.selected-count {
	font-size: 28rpx;
	color: #007AFF;
	font-weight: 600;
}

.app-list {
	padding: 0 30rpx 20rpx;
}

.category-select-all {
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
}

.select-all-text {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
	margin-left: 15rpx;
}

.app-item {
	padding: 20rpx 0;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1rpx solid #f8f8f8;
}

.app-item:last-child {
	border-bottom: none;
}

.app-left {
	flex: 1;
	display: flex;
	align-items: center;
}

.app-icon {
	width: 60rpx;
	height: 60rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
	background: #f8f8f8;
}

.app-icon-fallback {
	width: 60rpx;
	height: 60rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
	background: #f8f8f8;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
}

.app-name {
	font-size: 28rpx;
	color: #333;
	flex: 1;
}

.app-right {
	display: flex;
	align-items: center;
}

.save-button-container {
	padding: 40rpx 20rpx;
}

.save-button {
	width: 100%;
	height: 88rpx;
	background: #007AFF;
	border-radius: 16rpx;
	border: none;
	display: flex;
	justify-content: center;
	align-items: center;
}

.save-button:disabled {
	background: #ccc;
}

.save-button-text {
	font-size: 32rpx;
	color: #fff;
	font-weight: 600;
}
</style>
