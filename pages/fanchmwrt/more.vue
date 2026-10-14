<template>
	<view class="fm-page">
		<view class="fm-nav">
			<view style="width: 60rpx;"></view>
			<text class="fm-nav-title">{{ $t('fwx_more.title') }}</text>
			<view style="width: 60rpx;"></view>
		</view>

		<scroll-view scroll-y style="flex: 1;" class="fm-scroll">
			<view
				v-for="group in menuGroups"
				:key="group.id"
				class="fm-section"
			>
				<view class="fm-section-title">{{ group.title }}</view>
				<view class="fm-grid">
					<view
						v-for="item in group.items"
						:key="item.id"
						class="fm-app-item"
						@click="openApp(item)"
					>
						<view
							class="fm-app-icon"
						>
							<image
								v-if="item.icon"
								:src="item.icon"
								mode="aspectFit"
								class="fm-icon-img"
							/>
							<text v-else class="fm-icon-letter">{{ item.name.charAt(0) }}</text>
						</view>
						<text class="fm-app-name">{{ item.name }}</text>
					</view>
				</view>
			</view>

			<view style="height: 160rpx;"></view>
		</scroll-view>

		<fwx-tab-bar :current="4" />
	</view>
</template>

<script>
import FwxTabBar from '@/components/fwxTabBar.vue'

export default {
	components: { FwxTabBar },

	computed: {
		menuGroups() {
			return [
				{
					id: 'network',
					title: this.$t('fwx_more.group_network'),
					items: [
						{ id: 'network_interfaces', name: this.$t('fwx_more.network_interfaces'), icon: '/static/network-interface-w.svg', path: '/pages/fanchmwrt/apps/network?tab=interfaces' },
						{ id: 'network_devices',    name: this.$t('fwx_more.network_devices'),    icon: '/static/network-device-w.svg',    path: '/pages/fanchmwrt/apps/network?tab=devices'    },
						{ id: 'network_wireless',   name: this.$t('fwx_more.network_wireless'),   icon: '/static/network-wireless-w.svg', path: '/pages/fanchmwrt/apps/network?tab=wireless'   },
						{ id: 'route_table',        name: this.$t('fwx_more.route_table'),        icon: '/static/route-w.png', path: '/pages/fanchmwrt/apps/route/index'       }
					]
				},
				{
					id: 'parental',
					title: this.$t('fwx_more.group_parental'),
					items: [
						{ id: 'app_filter',       name: this.$t('fwx_more.app_filter'),       icon: '/static/app-filter-w.svg',       path: '/pages/fanchmwrt/apps/app_filter'       },
						{ id: 'mac_filter',       name: this.$t('fwx_more.mac_filter'),       icon: '/static/mac-filter-w.svg',       path: '/pages/fanchmwrt/apps/mac_filter'       },
						{ id: 'blacklist',        name: this.$t('fwx_more.blacklist'),        icon: '/static/blacklist-w.svg',        path: '/pages/fanchmwrt/apps/blacklist'        },
						{ id: 'internet_records', name: this.$t('fwx_more.internet_records'), icon: '/static/internet-records-w.svg', path: '/pages/fanchmwrt/apps/internet_records'  },
						{ id: 'app_record',       name: this.$t('fwx_more.app_record'),       icon: '/static/app-record-w.svg', path: '/pages/fanchmwrt/apps/app_record' }
					]
				},
				{
					id: 'advanced',
					title: this.$t('fwx_more.group_advanced'),
					items: [
						{ id: 'factory_reset', name: this.$t('fwx_more.factory_reset'), icon: '/static/reset-w.png',  path: '/pages/fanchmwrt/apps/factory_reset/index' },
						{ id: 'reboot',        name: this.$t('fwx_more.reboot'),        icon: '/static/reboot-w.png', path: '/pages/fanchmwrt/apps/reboot/index'        }
					]
				}
			]
		}
	},

	methods: {
		openApp(item) {
			uni.navigateTo({ url: item.path })
		}
	}
}
</script>

<style scoped>
.fm-page   { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }
.fm-nav    { display: flex; align-items: center; justify-content: space-between; padding: 88rpx 32rpx 20rpx; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.fm-nav-title { font-size: 28rpx; font-weight: 500; color: #1c1c1e; flex: 1; text-align: center; }
.fm-scroll { background: #F2F2F7; }

/* section */
.fm-section       { margin: 28rpx 24rpx 0; }
.fm-section-title { font-size: 24rpx; font-weight: 600; color: #8e8e93; letter-spacing: 1rpx; margin-bottom: 16rpx; padding-left: 4rpx; }

/* app grid — 4 columns */
.fm-grid     { background: #ffffff; border-radius: 20rpx; padding: 24rpx 16rpx; display: flex; flex-wrap: wrap; }
.fm-app-item { width: 25%; display: flex; flex-direction: column; align-items: center; gap: 12rpx; padding: 16rpx 0; }
.fm-app-icon { width: 108rpx; height: 108rpx; border-radius: 26rpx; display: flex; align-items: center; justify-content: center; background: #3B9BFF; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.10); }
.fm-icon-img { width: 64rpx; height: 64rpx; }
.fm-icon-letter { font-size: 44rpx; font-weight: 700; color: #ffffff; line-height: 1; }
.fm-app-name { font-size: 22rpx; color: #3c3c43; text-align: center; max-width: 120rpx; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
</style>
