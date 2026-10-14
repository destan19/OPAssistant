<template>
  <view class="page_tab_bar">
    <view
      v-for="(item, index) in tabs"
      :key="item.value !== undefined ? String(item.value) : String(index)"
      :class="['page_tab_item', is_active(item, index) ? 'active' : '']"
      @click="handle_tab_click(item, index)"
    >
      <text class="page_tab_text">{{ item.label }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'page_tab',
  props: {
    value: {
      type: [Number, String],
      default: 0
    },
    tabs: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    get_tab_value(item, index) {
      return item && item.value !== undefined ? item.value : index
    },
    is_active(item, index) {
      return this.get_tab_value(item, index) === this.value
    },
    handle_tab_click(item, index) {
      const next_value = this.get_tab_value(item, index)
      if (next_value === this.value) return
      this.$emit('input', next_value)
      this.$emit('change', {
        value: next_value,
        index,
        item
      })
    }
  }
}
</script>

<style scoped>
.page_tab_bar {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 36rpx;
  margin-bottom: 20rpx;
  padding: 0;
  background: transparent;
}

.page_tab_item {
  flex: 0 0 auto;
  text-align: left;
  position: relative;
  padding: 12rpx 0 14rpx;
  background: transparent;
}

.page_tab_text {
  font-size: 26rpx;
  line-height: 1;
  color: #64748b;
  font-weight: 500;
}

.page_tab_item.active .page_tab_text {
  color: #2563eb;
  font-weight: 600;
}

.page_tab_item.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1rpx;
  height: 5rpx;
  border-radius: 999rpx;
  background: #2563eb;
}
</style>
