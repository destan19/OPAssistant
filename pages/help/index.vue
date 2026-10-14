<template>
	<view class="container">
		<view class="help-card">

			<view class="help-content">
				<view class="help-section">
					<text class="section-title">{{ $t('help.usage_scenarios') }}</text>
					<view class="section-item">
						<text class="item-title">{{ $t('help.supported_version') }}</text>
						<text class="item-desc">{{ $t('help.supported_version_desc') }}</text>
					</view>
					<view class="section-item">
						<text class="item-title">{{ $t('help.supported_devices') }}</text>
						<text class="item-desc">{{ $t('help.supported_devices_desc') }}</text>
					</view>
				</view>
				
				<view class="help-section">
					<text class="section-title">{{ $t('help.faq') }}</text>
					<view class="section-item">
						<text class="item-title">{{ $t('help.q1') }}</text>
						<text class="item-desc">{{ $t('help.a1') }}</text>
					</view>
					<view class="section-item ios-note-item">
						<text class="item-title">{{ ios_https_title }}</text>
						<text class="item-desc">{{ ios_https_desc }}</text>
					</view>
					<view class="section-item">
						<text class="item-title">{{ $t('help.q2') }}</text>
						<text class="item-desc">{{ $t('help.a2') }}</text>
					</view>
					<view class="section-item">
						<text class="item-title">{{ $t('help.q3') }}</text>
						<text class="item-desc">{{ $t('help.a3') }}</text>
					</view>
					<view class="section-item">
						<text class="item-title">{{ $t('help.q4') }}</text>
						<text class="item-desc">{{ $t('help.a4') }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
		}
	},
	computed: {
		is_en() {
			return this.$i18n && this.$i18n.locale === 'en'
		},
		ios_https_title() {
			return this.is_en ? 'Q: Why is HTTPS management not supported on iOS?' : 'Q: 为什么 iOS 不支持 HTTPS 管理？'
		},
		ios_https_desc() {
			return this.is_en
				? 'A: Due to iOS certificate trust restrictions, HTTPS management may fail for self-signed certificates. Please use HTTP management on iOS.'
				: 'A: 由于 iOS 对证书信任限制，使用自签名证书时 HTTPS 管理可能失败。iOS 端请使用 HTTP 方式管理。'
		}
	},
	onLoad() {
		// 动态设置页面标题
		uni.setNavigationBarTitle({
			title: this.$t('help.title')
		})
	},
	methods: {
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #f6f8fc;
	padding: 18rpx 16rpx 24rpx;
	box-sizing: border-box;
}

.help-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 26rpx 20rpx;
	margin-top: 8rpx;
	border: 1rpx solid #e4ebf5;
	box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.06);
}

.help-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.help-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 40rpx;
}

.help-content {
	text-align: left;
}

.help-section {
	margin-bottom: 26rpx;
}

.help-section:last-child {
	margin-bottom: 0;
}

.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #1f2937;
	display: block;
	margin-bottom: 14rpx;
	border-left: 5rpx solid #3b82f6;
	padding-left: 16rpx;
}

.section-item {
	margin-bottom: 12rpx;
	background: #f8fbff;
	border: 1rpx solid #e8eef8;
	border-radius: 14rpx;
	padding: 14rpx 14rpx 12rpx;
}

.section-item:last-child {
	margin-bottom: 0;
}

.item-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #1f2937;
	display: block;
	margin-bottom: 6rpx;
}

.item-desc {
	font-size: 24rpx;
	color: #4b5563;
	line-height: 1.6;
	display: block;
}

.ios-note-item {
	background: #f1f7ff;
	border-color: #d7e7ff;
}

</style> 
