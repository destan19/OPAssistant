<template>
	<view class="fwx-tabbar">
		<view
			v-for="(tab, i) in tabs"
			:key="i"
			class="fwx-tab-item"
			:class="{ 'fwx-tab-active': current === i }"
			@click="switchTab(i)"
		>
			<image
				:src="current === i ? tab.selectedIcon : tab.icon"
				mode="widthFix"
				class="fwx-tab-icon"
			/>
			<text class="fwx-tab-text" :class="{ 'fwx-tab-text-active': current === i }">{{ tab.text }}</text>
		</view>
	</view>
</template>

<script>
const TAB_PATHS = [
	'/pages/fanchmwrt/dashboard',
	'/pages/fanchmwrt/monitor',
	'/pages/fanchmwrt/terminal',
	'/pages/fanchmwrt/network',
	'/pages/fanchmwrt/more'
]
const TAB_ICONS = [
	{ icon: '/static/home.png',         selectedIcon: '/static/home-selected.png'         },
	{ icon: '/static/align-bottom.png', selectedIcon: '/static/align-bottom-selected.png' },
	{ icon: '/static/user.png',         selectedIcon: '/static/user-selected.png'         },
	{ icon: '/static/network.png',      selectedIcon: '/static/network-selected.png'      },
	{ icon: '/static/system.png',       selectedIcon: '/static/system-selected.png'       }
]

export default {
	name: 'FwxTabBar',
	props: {
		current: { type: Number, default: 0 }
	},
	computed: {
		tabs() {
			const keys = ['dashboard', 'monitor', 'terminal', 'network', 'more']
			return keys.map((k, i) => ({
				text: this.$t('fwx_tabbar.' + k),
				icon: TAB_ICONS[i].icon,
				selectedIcon: TAB_ICONS[i].selectedIcon,
				path: TAB_PATHS[i]
			}))
		}
	},
	methods: {
		switchTab(index) {
			if (index === this.current) return
			uni.reLaunch({ url: TAB_PATHS[index] })
		}
	}
}
</script>

<style scoped>
.fwx-tabbar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	height: calc(100rpx + env(safe-area-inset-bottom));
	padding-bottom: env(safe-area-inset-bottom);
	background: #ffffff;
	border-top: 1rpx solid rgba(0, 0, 0, 0.08);
	display: flex;
	flex-direction: row;
	align-items: stretch;
	z-index: 100;
	box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.fwx-tab-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	padding-top: 10rpx;
}
.fwx-tab-item:active { opacity: 0.7; }
.fwx-tab-icon { width: 48rpx; height: 48rpx; }
.fwx-tab-text {
	font-size: 20rpx;
	color: #8e8e93;
	line-height: 1;
}
.fwx-tab-text-active { color: #007AFF; }
</style>
