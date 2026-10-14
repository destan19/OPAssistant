<template>
	<view class="bl-page">
		<!-- nav -->
		<view class="bl-nav">
			<view class="bl-back" @click="goBack">
				<image src="/static/back.png" mode="widthFix" class="bl-back-icon" />
			</view>
			<text class="bl-nav-title">{{ $t('fwx_more.blacklist') }}</text>
			<view class="bl-add-btn" @click="openUserPicker">
				<text class="bl-add-text">+</text>
			</view>
		</view>

		<!-- list -->
		<scroll-view scroll-y style="flex: 1;" class="bl-scroll">
			<view v-if="loading" class="bl-state">
				<text class="bl-state-text">{{ $t('fwx_common.loading') }}</text>
			</view>
			<view v-else-if="list.length === 0" class="bl-state">
				<view class="bl-empty-icon">
					<text class="bl-empty-icon-text">🚫</text>
				</view>
				<text class="bl-state-text">{{ $t('fwx_blacklist.empty') }}</text>
				<text class="bl-state-hint">{{ $t('fwx_blacklist.hint') }}</text>
			</view>
			<view v-else class="bl-list-wrap">
				<view class="bl-card">
					<view
						v-for="(item, i) in list"
						:key="item.mac"
						class="bl-item"
						:class="{ 'bl-item-border': i > 0 }"
					>
						<view class="bl-item-icon">
							<text class="bl-item-icon-text">{{ (item.nickname && item.nickname !== '--') ? item.nickname.charAt(0) : (item.hostname && item.hostname !== '--') ? item.hostname.charAt(0) : '?' }}</text>
						</view>
						<view class="bl-item-info">
							<text class="bl-item-name">{{ (item.nickname && item.nickname !== '--') ? item.nickname : (item.hostname && item.hostname !== '--') ? item.hostname : item.mac }}</text>
							<text class="bl-item-mac">{{ item.mac }}</text>
							<text v-if="item.hostname && item.hostname !== '--' && item.hostname !== item.mac" class="bl-item-sub">{{ item.hostname }}</text>
						</view>
						<view class="bl-remove-btn" @click="confirmRemove(item)">
							<text class="bl-remove-text">{{ $t('fwx_blacklist.remove') }}</text>
						</view>
					</view>
				</view>
			</view>
			<view style="height: 40rpx;"></view>
		</scroll-view>

		<!-- user picker modal -->
		<view v-if="pickerVisible" class="bl-overlay" @click.stop="pickerVisible = false">
			<view class="bl-picker-sheet" @click.stop>
				<view class="bl-picker-head">
					<text class="bl-picker-title">{{ $t('fwx_blacklist.select_user_title') }}</text>
					<view class="bl-picker-close" @click="pickerVisible = false">
						<text class="bl-picker-close-text">✕</text>
					</view>
				</view>
				<scroll-view scroll-y style="max-height: 600rpx; overflow: hidden;">
					<view v-if="usersLoading" style="padding: 60rpx; text-align: center;">
						<text class="bl-state-text">{{ $t('fwx_blacklist.loading_users') }}</text>
					</view>
					<view v-else-if="availableUsers.length === 0" style="padding: 60rpx; text-align: center;">
						<text class="bl-state-text">{{ $t('fwx_blacklist.no_users') }}</text>
					</view>
					<view v-else>
						<view
							v-for="user in availableUsers"
							:key="user.mac"
							class="bl-picker-item"
							@click="confirmAdd(user)"
						>
							<view class="bl-picker-icon" :style="{ background: userColor(user) }">
								<text class="bl-picker-icon-text">{{ userInitial(user) }}</text>
							</view>
							<view class="bl-picker-info">
								<text class="bl-picker-name">{{ user.nickname || user.hostname || user.mac }}</text>
								<text class="bl-picker-sub">{{ user.mac }}{{ user.ip ? ' · ' + user.ip : '' }}</text>
							</view>
							<view class="bl-picker-status" :class="user.online ? 'bl-status-on' : 'bl-status-off'">
								<text class="bl-picker-status-text">{{ user.online ? $t('fwx_common.online') : $t('fwx_common.offline') }}</text>
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

const USER_COLORS = [
	'#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
	'#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1'
]

function hashColor(str) {
	if (!str) return USER_COLORS[0]
	let hash = 0
	for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
	return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

export default {
	data() {
		return {
			device: null,
			ubusUrl: '',

			loading: false,
			list: [],

			pickerVisible: false,
			usersLoading: false,
			allUsers: []
		}
	},

	computed: {
		availableUsers() {
			const blackMacs = new Set(this.list.map(u => u.mac.toUpperCase()))
			return this.allUsers.filter(u => !blackMacs.has((u.mac || '').toUpperCase()))
		}
	},

	onShow() {
		const device = DeviceManager.getCurrentDevice()
		if (!device) return
		this.device = device
		const protocol = device.useHttps ? 'https' : 'http'
		const host = DeviceManager.formatHostForUrl(device.ip)
		this.ubusUrl = `${protocol}://${host}:${device.port}/ubus`
		this.allUsers = []
		this.loadList()
	},

	methods: {
		goBack() { uni.navigateBack() },

		async ubus(api, data = {}) {
			const freshDevice = DeviceManager.getCurrentDevice()
			if (freshDevice?.sysauth) this.device = freshDevice
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

		async loadList() {
			this.loading = true
			try {
				const res = await this.ubus('get_mac_blacklist', {})
				this.list = res?.list || []
			} catch (e) { this.list = [] }
			finally { this.loading = false }
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

		confirmAdd(user) {
			this.pickerVisible = false
			uni.showModal({
				title: this.$t('fwx_blacklist.add_confirm_title'),
				content: this.$t('fwx_blacklist.add_confirm'),
				confirmColor: '#FF3B30',
				success: async (res) => {
					if (!res.confirm) return
					try {
						const r = await this.ubus('add_mac_blacklist', { mac_list: [user.mac] })
						if (r?.code === 2000) {
							uni.showToast({ title: this.$t('fwx_blacklist.add_success'), icon: 'success' })
							this.loadList()
						} else {
							uni.showToast({ title: this.$t('fwx_blacklist.add_failed'), icon: 'none' })
						}
					} catch (e) {
						uni.showToast({ title: this.$t('fwx_blacklist.add_failed'), icon: 'none' })
					}
				}
			})
		},

		confirmRemove(item) {
			uni.showModal({
				title: this.$t('fwx_blacklist.remove_confirm_title'),
				content: this.$t('fwx_blacklist.remove_confirm'),
				confirmColor: '#FF3B30',
				success: async (res) => {
					if (!res.confirm) return
					try {
						const r = await this.ubus('del_mac_blacklist', { mac: item.mac })
						if (r?.code === 2000) {
							uni.showToast({ title: this.$t('fwx_blacklist.remove_success'), icon: 'success' })
							this.loadList()
						} else {
							uni.showToast({ title: this.$t('fwx_blacklist.remove_failed'), icon: 'none' })
						}
					} catch (e) {
						uni.showToast({ title: this.$t('fwx_blacklist.remove_failed'), icon: 'none' })
					}
				}
			})
		},

		userColor(user) {
			return hashColor(user.mac || user.hostname || '')
		},

		userInitial(user) {
			const name = user.nickname || user.hostname || user.mac || '?'
			return name.charAt(0).toUpperCase()
		}
	}
}
</script>

<style scoped>
.bl-page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }

/* nav */
.bl-nav { display: flex; align-items: center; padding: 88rpx 24rpx 20rpx; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.bl-back { width: 60rpx; display: flex; align-items: center; }
.bl-back-icon { width: 36rpx; }
.bl-nav-title { flex: 1; font-size: 32rpx; font-weight: 600; color: #1c1c1e; text-align: center; }
.bl-add-btn { width: 56rpx; height: 56rpx; background: #FF3B30; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.bl-add-text { font-size: 36rpx; color: #fff; font-weight: 300; line-height: 1; }

/* scroll & state */
.bl-scroll { background: #F2F2F7; }
.bl-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 40rpx; gap: 16rpx; }
.bl-empty-icon { width: 120rpx; height: 120rpx; background: rgba(255,59,48,0.1); border-radius: 30rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx; }
.bl-empty-icon-text { font-size: 60rpx; }
.bl-state-text { font-size: 28rpx; color: #8e8e93; }
.bl-state-hint { font-size: 24rpx; color: #aeaeb2; }

/* list */
.bl-list-wrap { padding: 24rpx; }
.bl-card { background: #fff; border-radius: 20rpx; overflow: hidden; }
.bl-item { display: flex; align-items: center; padding: 24rpx 28rpx; gap: 20rpx; }
.bl-item-border { border-top: 1rpx solid rgba(0,0,0,0.06); }
.bl-item-icon { width: 72rpx; height: 72rpx; border-radius: 18rpx; background: rgba(255,59,48,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bl-item-icon-text { font-size: 28rpx; font-weight: 700; color: #FF3B30; }
.bl-item-info { flex: 1; min-width: 0; }
.bl-item-name { font-size: 28rpx; font-weight: 500; color: #1c1c1e; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bl-item-mac { font-size: 22rpx; color: #8e8e93; display: block; margin-top: 4rpx; font-family: monospace; }
.bl-item-sub { font-size: 22rpx; color: #aeaeb2; display: block; margin-top: 2rpx; }
.bl-remove-btn { padding: 10rpx 20rpx; border-radius: 10rpx; border: 1rpx solid rgba(255,59,48,0.4); flex-shrink: 0; }
.bl-remove-text { font-size: 24rpx; color: #FF3B30; }

/* user picker */
.bl-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.bl-picker-sheet { background: #fff; border-radius: 24rpx 24rpx 0 0; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
.bl-picker-head { display: flex; align-items: center; justify-content: space-between; padding: 32rpx 32rpx 20rpx; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.bl-picker-title { font-size: 30rpx; font-weight: 600; color: #1c1c1e; }
.bl-picker-close { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }
.bl-picker-close-text { font-size: 28rpx; color: #8e8e93; }
.bl-picker-item { display: flex; align-items: center; padding: 20rpx 32rpx; border-bottom: 1rpx solid rgba(0,0,0,0.04); gap: 20rpx; }
.bl-picker-icon { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bl-picker-icon-text { font-size: 28rpx; font-weight: 700; color: #fff; }
.bl-picker-info { flex: 1; min-width: 0; }
.bl-picker-name { font-size: 28rpx; color: #1c1c1e; font-weight: 500; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bl-picker-sub { font-size: 22rpx; color: #8e8e93; display: block; margin-top: 4rpx; }
.bl-picker-status { padding: 4rpx 14rpx; border-radius: 20rpx; flex-shrink: 0; }
.bl-status-on { background: rgba(52,199,89,0.15); }
.bl-status-off { background: rgba(142,142,147,0.12); }
.bl-picker-status-text { font-size: 22rpx; font-weight: 500; }
.bl-status-on .bl-picker-status-text { color: #34C759; }
.bl-status-off .bl-picker-status-text { color: #8e8e93; }
</style>
