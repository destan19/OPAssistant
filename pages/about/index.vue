<template>
	<view class="container">
		<view class="about-card">
			<view class="about-content">
				<view class="about-section">
					<text class="section-title">{{ $t('about.version_info') }}</text>
					<view class="section-item">
						<text class="item-title">{{ $t('about.version_number') }}</text>
						<text class="item-desc">{{ version }}</text>
					</view>
				</view>
				<view class="about-section">
					<text class="section-title">{{ $t('about.developer_info') }}</text>
					<view class="section-item">
						<text class="item-title">{{ $t('about.author') }}</text>
						<text class="item-desc">{{ $t('about.author_name') }}</text>
					</view>
					<view class="section-item">
						<text class="item-title">{{ $t('about.introduction') }}</text>
						<text class="item-desc">{{ $t('about.introduction_desc') }}</text>
					</view>
					<view class="section-item">
						<text class="item-title">{{ $t('about.website') }}</text>
						<text class="item-desc">{{ $t('about.website_url') }}</text>
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
			version: '1.1.0'
		}
	},
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('about.title')
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
@import '@/styles/common.scss';

.container {
	padding: 15rpx;
}


.about-card {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 20rpx;
	padding: 60rpx 40rpx;
	margin-top: 50rpx;
	text-align: center;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.about-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.about-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 40rpx;
}

.about-content {
	text-align: left;
}

.about-section {
	margin-bottom: 40rpx;
}

.about-section:last-child {
	margin-bottom: 0;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 20rpx;
	border-left: 4rpx solid #007aff;
	padding-left: 20rpx;
}

.section-item {
	margin-bottom: 20rpx;
}

.section-item:last-child {
	margin-bottom: 0;
}

.item-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 10rpx;
}

.item-desc {
	font-size: 26rpx;
	color: #666;
	line-height: 1.6;
	display: block;
}
</style>
