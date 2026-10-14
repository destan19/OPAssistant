<template>
  <view class="container">
    <view class="settings-card">
      <view class="settings-content">
        <view class="settings-section">
          <view class="section-header">
            <view class="language-title-row">
              <view class="language-icon-wrap">
                <text class="language-icon-text">Aa</text>
              </view>
              <text class="section-title">{{ $t('device_list.language_settings') }}</text>
            </view>
          </view>
          
          <view class="select-row">
            <text class="select-label">{{ $t('language.current_language') }}</text>
            <picker
              mode="selector"
              :range="languageList"
              range-key="label"
              :value="languageIndex"
              @change="onLanguageChange"
              class="language-picker"
            >
              <view class="picker-inner">
                <text class="picker-text">{{ languageList[languageIndex].label }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import I18nUtils from '@/utils/i18n.js'

export default {
  data() {
    return {
      currentLanguage: 'zh-Hans',
      languageList: [
        { value: 'zh-Hans', label: '中文' },
        { value: 'en', label: 'English' }
      ]
    }
  },
  
  computed: {
    languageIndex() {
      const idx = this.languageList.findIndex(item => item.value === this.currentLanguage)
      return idx >= 0 ? idx : 0
    }
  },
  
  onLoad() {
    uni.setNavigationBarTitle({
      title: this.$t('device_list.language_settings')
    })
    this.currentLanguage = I18nUtils.getCurrentLanguage()
  },
  
  methods: {
    onLanguageChange(e) {
      const index = Number(e.detail.value)
      const item = this.languageList[index]
      if (item && item.value !== this.currentLanguage) {
        this.switchLanguage(item.value)
      }
    },
    switchLanguage(locale) {
      if (locale === this.currentLanguage) return
      
      try {
        const success = I18nUtils.switchLanguage(locale)
        if (success) {
          this.currentLanguage = locale
          uni.showToast({
            title: this.$t('language.switch_success'),
            icon: 'success',
            duration: 2000
          })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }
      } catch (error) {
        console.log('切换语言时出错:', error)
      }
    }
  }
}
</script>

<style scoped>
@import '@/styles/common.scss';

.container {
  padding: 15rpx;
}

.settings-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24rpx;
  padding: 48rpx 40rpx;
  margin-top: 40rpx;
  text-align: left;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid rgba(0, 0, 0, 0.05);
}

.settings-content {
  text-align: left;
}

.settings-section {
  margin-bottom: 0;
}

.section-header {
  margin-bottom: 28rpx;
}

.language-title-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.language-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.language-icon-text {
  font-size: 26rpx;
  font-weight: 700;
  color: #1976d2;
  letter-spacing: -1rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.select-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
}

.select-label {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.language-picker {
  flex: 1;
  margin-left: 24rpx;
  max-width: 280rpx;
}

.picker-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: #f5f6f7;
  border: 2rpx solid #e9ecef;
  border-radius: 12rpx;
}

.picker-text {
  font-size: 28rpx;
  color: #1a1a1a;
}

.picker-arrow {
  font-size: 20rpx;
  color: #999;
  margin-left: 12rpx;
}
</style>