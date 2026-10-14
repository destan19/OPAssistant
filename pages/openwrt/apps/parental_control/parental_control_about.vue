<template>
	<view class="container">
		<view class="about-card">
			
			
			<view class="about-content">
				<text class="about-text">{{ $t('parental_control.about_text') }}</text>
                <text class="about-text">{{ $t('parental_control.visit_oaf_website') }}</text>
                <text class="about-link" @click="openWebsite">https://www.openappfilter.com</text>
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
	onLoad() {
		uni.setNavigationBarTitle({
			title: this.$t('parental_control.title')
		})
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		openWebsite() {
			// 在外部浏览器中打开网站
			plus.runtime.openURL('https://www.openappfilter.com')
		}
	}
}
</script>

<style scoped>
@import '@/styles/common.scss';

.container {
	padding: 5rpx;
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
	width: 200rpx;
	height: 200rpx;
	margin: 0 auto 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 20rpx;
}

.app-icon-image {
	width: 150rpx;
	height: 150rpx;
}

.about-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 30rpx;
}

.about-content {
	margin-bottom: 50rpx;
}

.about-text {
	font-size: 28rpx;
	color: #666;
	line-height: 1.6;
	text-align: left;
	display: block;
	margin-bottom: 20rpx;
}

.about-link {
	font-size: 28rpx;
	color: #007aff;
	line-height: 1.6;
	text-align: left;
	display: block;
	text-decoration: underline;
	cursor: pointer;
	margin-top: 20rpx;
}

.about-actions {
	display: flex;
	justify-content: center;
}

.back-btn {
	background: linear-gradient(135deg, #007aff 0%, #5ac8fa 100%);
	color: white;
	border: none;
	border-radius: 25rpx;
	padding: 20rpx 60rpx;
	font-size: 32rpx;
	font-weight: bold;
	box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.3);
	transition: all 0.3s ease;
}

.back-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.3);
}

.back-btn-text {
	color: white;
	font-size: 32rpx;
	font-weight: bold;
}
</style>
