<template>
	<view class="fwx-page">
		<!-- 顶部导航 -->
		<view class="fwx-nav">
			<view style="width: 60rpx;"></view>
			<text class="fwx-nav-title">{{ $t('fwx_terminal.title') }}</text>
			<view style="width: 60rpx;"></view>
		</view>

		<!-- 加载中 -->
		<view v-if="loading" class="fwx-loading">
			<view class="fwx-spinner"></view>
			<text class="fwx-loading-text">{{ $t('fwx_common.loading') }}</text>
		</view>

		<!-- 用户列表 -->
		<scroll-view
			v-else
			class="fwx-scroll"
			scroll-y="true"
			show-scrollbar="false"
			style="flex: 1;"
		>
			<view class="fwx-list-inner" style="padding-bottom: calc(100rpx + env(safe-area-inset-bottom));">
				<!-- 统计条 -->
				<view class="fwx-summary">
					<text class="fwx-summary-text">{{ $t('fwx_terminal.summary', { total: users.length, online: onlineCount, active: activeCount }) }}</text>
				</view>

				<!-- 用户卡片 -->
				<view
					v-for="(user, i) in users"
					:key="user.mac"
					class="fwx-user-card"
					@click="showDetail(user)"
				>
					<!-- 卡片头 -->
					<view class="fwx-card-head">
						<view class="fwx-avatar" :style="{ background: macColor(user.mac) }">
							<text class="fwx-avatar-text">{{ userInitial(user) }}</text>
						</view>
						<view class="fwx-card-info">
							<view class="fwx-card-name-row">
								<text class="fwx-card-name">{{ displayName(user) }}</text>
								<view
									v-if="permStatusKey(user) !== 'unlimited'"
									class="fwx-perm-badge"
									:class="permBadgeClass(user)"
									@click.stop="showPermDetail(user)"
								>
									<text class="fwx-perm-text">{{ permText(user) }}</text>
								</view>
								<view class="fwx-status-badge" :class="statusClass(user)">
									<text class="fwx-status-text">{{ statusText(user) }}</text>
								</view>
							</view>
							<text class="fwx-card-sub">{{ user.ip || '--' }}</text>
						</view>
					</view>

					<!-- 速率 + 今日统计行 -->
					<view class="fwx-card-rates" v-if="user.online">
						<view class="fwx-rate-item">
							<text class="fwx-rate-arrow fwx-up">↑</text>
							<text class="fwx-rate-val">{{ formatRate(user.up_rate) }}</text>
						</view>
						<view class="fwx-rate-item">
							<text class="fwx-rate-arrow fwx-down">↓</text>
							<text class="fwx-rate-val">{{ formatRate(user.down_rate) }}</text>
						</view>
						<view class="fwx-today-stats" v-if="user.today_active_time || user.today_up_bytes || user.today_down_bytes">
							<text v-if="user.today_active_time" class="fwx-today-stat">⏱ {{ formatActiveTime(user.today_active_time) }}</text>
							<text v-if="user.today_up_bytes || user.today_down_bytes" class="fwx-today-stat">↕ {{ formatBytes((user.today_up_bytes || 0) + (user.today_down_bytes || 0)) }}</text>
						</view>
					</view>

					<!-- 今日统计行（离线设备） -->
					<view class="fwx-today-stats-row" v-if="!user.online && (user.today_active_time || user.today_up_bytes || user.today_down_bytes)">
						<text v-if="user.today_active_time" class="fwx-today-stat">⏱ {{ formatActiveTime(user.today_active_time) }}</text>
						<text v-if="user.today_up_bytes || user.today_down_bytes" class="fwx-today-stat">↕ {{ formatBytes((user.today_up_bytes || 0) + (user.today_down_bytes || 0)) }}</text>
					</view>

					<!-- 应用图标行：活跃应用 + 常用应用 + URL -->
					<view class="fwx-app-icons" v-if="user.app || user.url || (user.applist && user.applist.length)">
						<!-- 活跃应用图标（绿点指示，仅 app 有图标，url 不显示图标） -->
						<view class="fwx-icon-slot" v-if="user.app">
							<image
								v-if="getActiveAppId(user) && !iconErrors[getActiveAppId(user)]"
								:src="getAppIconUrl(getActiveAppId(user))"
								class="fwx-app-icon-img"
								mode="scaleToFill"
								@error="onIconError(getActiveAppId(user))"
							/>
							<view v-else class="fwx-app-icon-fb" :style="{ background: appColor(user.app) }">
								<text class="fwx-icon-fb-text">{{ user.app.charAt(0) }}</text>
							</view>
							<view class="fwx-icon-active-dot"></view>
						</view>
						<!-- 常用应用图标 -->
						<view
							v-for="(app, ai) in getCommonApps(user)"
							:key="'ca' + ai"
							class="fwx-icon-slot"
						>
							<image
								v-if="app.id && !iconErrors[app.id]"
								:src="getAppIconUrl(app.id)"
								class="fwx-app-icon-img"
								mode="scaleToFill"
								@error="onIconError(app.id)"
							/>
							<view v-else class="fwx-app-icon-fb" :style="{ background: appColor(app.name || '') }">
								<text class="fwx-icon-fb-text">{{ app.name ? app.name.charAt(0) : '?' }}</text>
							</view>
						</view>
						<!-- 正在访问的 URL（右侧文字） -->
						<text v-if="user.url" class="fwx-url-label">{{ user.url }}</text>
					</view>

				</view>

				<view v-if="!users.length" class="fwx-empty">
					<text class="fwx-empty-text">{{ $t('fwx_terminal.no_terminal') }}</text>
				</view>
			</view>
		</scroll-view>

		<!-- 详情面板 -->
		<view v-if="detail" class="fwx-detail-mask" @click.self="closeDetail">
			<view class="fwx-detail-panel">
				<!-- 面板头 -->
				<view class="fwx-detail-head">
					<view class="fwx-avatar fwx-detail-avatar" :style="{ background: macColor(detail.mac) }">
						<text class="fwx-avatar-text">{{ userInitial(detail) }}</text>
					</view>
					<view class="fwx-detail-title-wrap">
						<text class="fwx-detail-title">{{ displayName(detail) }}</text>
						<view class="fwx-status-badge" :class="statusClass(detail)">
							<text class="fwx-status-text">{{ statusText(detail) }}</text>
						</view>
					</view>
					<view class="fwx-detail-close" @click="closeDetail">
						<text class="fwx-detail-close-text">✕</text>
					</view>
				</view>

				<!-- Tab 切换栏 -->
				<scroll-view scroll-x class="fwx-detail-tabs" show-scrollbar="false">
					<view
						class="fwx-detail-tab"
						:class="{ 'fwx-detail-tab-active': detailTab === 0 }"
						@click="switchDetailTab(0)"
					>
						<text class="fwx-detail-tab-text">{{ $t('fwx_terminal.tab_basic') }}</text>
					</view>
					<view
						class="fwx-detail-tab"
						:class="{ 'fwx-detail-tab-active': detailTab === 1 }"
						@click="switchDetailTab(1)"
					>
						<text class="fwx-detail-tab-text">{{ $t('fwx_terminal.tab_rules') }}</text>
					</view>
					<view
						class="fwx-detail-tab"
						:class="{ 'fwx-detail-tab-active': detailTab === 2 }"
						@click="switchDetailTab(2)"
					>
						<text class="fwx-detail-tab-text">{{ $t('fwx_terminal.tab_app_visit') }}</text>
					</view>
					<view
						class="fwx-detail-tab"
						:class="{ 'fwx-detail-tab-active': detailTab === 3 }"
						@click="switchDetailTab(3)"
					>
						<text class="fwx-detail-tab-text">{{ $t('fwx_terminal.tab_traffic') }}</text>
					</view>
					<view
						class="fwx-detail-tab"
						:class="{ 'fwx-detail-tab-active': detailTab === 4 }"
						@click="switchDetailTab(4)"
					>
						<text class="fwx-detail-tab-text">{{ $t('fwx_terminal.tab_top_apps') }}</text>
					</view>
					<view
						class="fwx-detail-tab"
						:class="{ 'fwx-detail-tab-active': detailTab === 5 }"
						@click="switchDetailTab(5)"
					>
						<text class="fwx-detail-tab-text">{{ $t('fwx_terminal.tab_records') }}</text>
						<text v-if="appRecordsTotal > 0" class="fwx-detail-tab-count">{{ appRecordsTotal }}</text>
					</view>
				</scroll-view>

				<!-- Tab 0：基本信息 -->
				<scroll-view v-if="detailTab === 0" class="fwx-detail-scroll" scroll-y="true" show-scrollbar="false">
					<view class="fwx-detail-section">
						<text class="fwx-detail-section-title">{{ $t('fwx_terminal.section_basic') }}</text>
						<view class="fwx-detail-kv">
							<view class="fwx-kv-row"><text class="fwx-kv-lbl">MAC</text><text class="fwx-kv-val">{{ detail.mac }}</text></view>
							<view class="fwx-kv-row" v-if="detail.ip"><text class="fwx-kv-lbl">IP</text><text class="fwx-kv-val">{{ detail.ip }}</text></view>
							<view class="fwx-kv-row" v-if="detail.ipv6"><text class="fwx-kv-lbl">IPv6</text><text class="fwx-kv-val fwx-kv-small">{{ detail.ipv6 }}</text></view>
							<view class="fwx-kv-row" v-if="detail.is_wireless"><text class="fwx-kv-lbl">{{ $t('fwx_terminal.conn_type') }}</text><text class="fwx-kv-val">{{ $t('fwx_terminal.wireless') }}</text></view>
							<view class="fwx-kv-row" v-if="detail.is_wireless && detail.band"><text class="fwx-kv-lbl">{{ $t('fwx_terminal.band') }}</text><text class="fwx-kv-val">{{ detail.band.toUpperCase() }}</text></view>
							<view class="fwx-kv-row" v-if="detail.is_wireless && detail.rssi != null"><text class="fwx-kv-lbl">{{ $t('fwx_terminal.signal') }}</text><text class="fwx-kv-val">{{ detail.rssi }} dBm</text></view>
							<view class="fwx-kv-row" v-if="detail.is_wireless && detail.rx_rate"><text class="fwx-kv-lbl">{{ $t('fwx_terminal.wireless_rate') }}</text><text class="fwx-kv-val">↓{{ (detail.rx_rate / 1000).toFixed(1) }} Mbps · ↑{{ (detail.tx_rate / 1000).toFixed(1) }} Mbps</text></view>
						</view>
					</view>

					<view class="fwx-detail-section" v-if="detail.today_up_bytes || detail.today_down_bytes || detail.today_active_time">
						<text class="fwx-detail-section-title">{{ $t('fwx_terminal.section_today') }}</text>
						<view class="fwx-today-grid">
							<view class="fwx-today-item">
								<text class="fwx-today-label">{{ $t('fwx_terminal.today_up') }}</text>
								<text class="fwx-today-value fwx-up-color">{{ formatBytes(detail.today_up_bytes) }}</text>
							</view>
							<view class="fwx-today-item">
								<text class="fwx-today-label">{{ $t('fwx_terminal.today_down') }}</text>
								<text class="fwx-today-value fwx-down-color">{{ formatBytes(detail.today_down_bytes) }}</text>
							</view>
							<view class="fwx-today-item" v-if="detail.today_active_time">
								<text class="fwx-today-label">{{ $t('fwx_terminal.today_active') }}</text>
								<text class="fwx-today-value">{{ formatActiveTime(detail.today_active_time) }}</text>
							</view>
						</view>
					</view>

					<view class="fwx-detail-section" v-if="detail.applist && detail.applist.length">
						<text class="fwx-detail-section-title">{{ $t('fwx_terminal.section_apps') }}</text>
						<view class="fwx-app-chips fwx-app-chips-detail">
							<view v-for="(app, ai) in detail.applist" :key="ai" class="fwx-app-chip">
								<text class="fwx-app-chip-text">{{ app.name }}</text>
							</view>
						</view>
					</view>

					<view style="height: 40rpx;"></view>
				</scroll-view>

				<!-- Tab 1：管控规则 -->
				<scroll-view v-if="detailTab === 1" class="fwx-detail-scroll" scroll-y="true" show-scrollbar="false">
					<view v-if="behaviorRulesLoading" class="fwx-tab-state">
						<text class="fwx-loading-text">{{ $t('fwx_common.loading') }}</text>
					</view>
					<template v-else-if="behaviorRules">
						<!-- 白名单提示 -->
						<view v-if="behaviorRules.af_whitelist == 1 || behaviorRules.mf_whitelist == 1" class="fwx-br-hint-wrap">
							<view v-if="behaviorRules.af_whitelist == 1" class="fwx-br-hint">
								<text class="fwx-br-hint-text">{{ $t('fwx_terminal.br_whitelist_af') }}</text>
							</view>
							<view v-if="behaviorRules.mf_whitelist == 1" class="fwx-br-hint">
								<text class="fwx-br-hint-text">{{ $t('fwx_terminal.br_whitelist_mf') }}</text>
							</view>
						</view>
						<!-- 规则列表 -->
						<view v-if="behaviorRules.list && behaviorRules.list.length" class="fwx-detail-section">
							<view
								v-for="(rule, ri) in behaviorRules.list"
								:key="ri"
								class="fwx-br-item"
								:class="{ 'fwx-br-item-border': ri > 0 }"
							>
								<!-- 头部：模块 + 规则名 + 权限 -->
								<view class="fwx-br-head">
									<text class="fwx-br-module">{{ brModuleText(rule.module) }}</text>
									<text class="fwx-br-rule-name">{{ rule.rule_name || ('#' + rule.rule_id) }}</text>
									<view class="fwx-perm-badge" :class="'fwx-perm-' + (rule.permission_key || 'unlimited')">
										<text class="fwx-perm-text">{{ permTextFromKey(rule.permission_key || 'unlimited') }}</text>
									</view>
								</view>
								<!-- 生效条件 -->
								<view class="fwx-br-cond-row">
									<text class="fwx-br-cond-lbl">{{ $t('fwx_terminal.br_condition') }}</text>
									<text class="fwx-br-cond-val">{{ brConditionText(rule) }}</text>
								</view>
								<!-- 今日状态 -->
								<view class="fwx-br-status-row">
									<text class="fwx-br-cond-lbl">{{ $t('fwx_terminal.br_today_status') }}</text>
									<template v-if="brIsProgress(rule)">
										<view class="fwx-br-progress-wrap">
											<view class="fwx-br-progress-track">
												<view
													class="fwx-br-progress-fill"
													:class="{ 'fwx-br-progress-exceeded': rule.today_status && rule.today_status.exceeded }"
													:style="{ width: brProgressPct(rule) + '%' }"
												></view>
											</view>
											<text class="fwx-br-progress-text">{{ brProgressText(rule) }}</text>
										</view>
									</template>
									<template v-else>
										<text class="fwx-br-status-text" :class="brStatusClass(rule)">{{ brStatusText(rule) }}</text>
									</template>
								</view>
							</view>
						</view>
						<view v-else class="fwx-tab-state">
							<text class="fwx-empty-text">{{ $t('fwx_terminal.br_no_rules') }}</text>
						</view>
					</template>
					<view style="height: 40rpx;"></view>
				</scroll-view>

				<!-- Tab 2：App统计（饼图） -->
				<scroll-view v-if="detailTab === 2" class="fwx-detail-scroll" scroll-y="true" show-scrollbar="false">
					<view v-if="appVisitLoading" class="fwx-tab-state">
						<text class="fwx-loading-text">{{ $t('fwx_common.loading') }}</text>
					</view>
					<template v-else-if="appVisitSorted.length">
						<view class="fwx-detail-section fwx-pie-section">
							<text class="fwx-pie-title">{{ $t('fwx_terminal.tab_app_visit') }}</text>
							<view class="fwx-pie-canvas-wrap">
								<canvas canvas-id="appPieChart" class="fwx-pie-canvas"></canvas>
							</view>
						</view>
						<view class="fwx-detail-section fwx-pie-legend-section">
							<view
								v-for="(app, ai) in appVisitSorted"
								:key="ai"
								class="fwx-pie-legend-row"
								:class="{ 'fwx-pie-legend-border': ai > 0 }"
							>
								<view class="fwx-pie-legend-marker" :style="{ background: pieColors[ai % pieColors.length] }"></view>
								<view class="fwx-pie-legend-main">
									<text class="fwx-pie-legend-name">{{ app.name }}</text>
									<view class="fwx-pie-legend-track">
										<view
											class="fwx-pie-legend-fill"
											:style="{
												width: (appVisitTotal > 0 ? Math.max(4, app.t / appVisitTotal * 100) : 0) + '%',
												background: pieColors[ai % pieColors.length]
											}"
										></view>
									</view>
								</view>
								<view class="fwx-pie-legend-meta">
									<text class="fwx-pie-legend-pct">{{ appVisitTotal > 0 ? Math.round(app.t / appVisitTotal * 100) + '%' : '0%' }}</text>
									<text class="fwx-pie-legend-time">{{ formatAppTime(app.t) }}</text>
								</view>
							</view>
						</view>
					</template>
					<view v-else-if="!appVisitLoading" class="fwx-tab-state">
						<text class="fwx-empty-text">{{ $t('fwx_terminal.av_no_data') }}</text>
					</view>
					<view style="height: 40rpx;"></view>
				</scroll-view>

				<!-- Tab 3：今日流量 -->
				<scroll-view v-if="detailTab === 3" class="fwx-detail-scroll" scroll-y="true" show-scrollbar="false">
					<view v-if="hourlyStatsLoading" class="fwx-tab-state">
						<text class="fwx-loading-text">{{ $t('fwx_common.loading') }}</text>
					</view>
					<template v-else-if="hourlyStats">
						<!-- 汇总卡 -->
						<view class="fwx-detail-section fwx-trf-summary">
							<view class="fwx-today-grid">
								<view class="fwx-today-item">
									<text class="fwx-today-label">{{ $t('fwx_terminal.trf_total_up') }}</text>
									<text class="fwx-today-value fwx-up-color">{{ formatBytes(hourlyTotalUp) }}</text>
								</view>
								<view class="fwx-today-item">
									<text class="fwx-today-label">{{ $t('fwx_terminal.trf_total_down') }}</text>
									<text class="fwx-today-value fwx-down-color">{{ formatBytes(hourlyTotalDown) }}</text>
								</view>
							</view>
						</view>
						<!-- 各小时 -->
						<view v-if="hourlyTrafficRows.length" class="fwx-detail-section">
							<text class="fwx-detail-section-title">{{ $t('fwx_terminal.trf_title') }}</text>
							<view
								v-for="row in hourlyTrafficRows"
								:key="row.hour"
								class="fwx-trf-row"
							>
								<text class="fwx-trf-hour">{{ row.hour }}:00</text>
								<view class="fwx-trf-bars">
									<view class="fwx-trf-bar-row">
										<view class="fwx-trf-bar-fill fwx-trf-up" :style="{ width: (hourlyTrafficMax > 0 ? row.upBytes / hourlyTrafficMax * 100 : 0) + '%' }"></view>
										<text class="fwx-trf-val fwx-up-color">{{ formatBytes(row.upBytes) }}</text>
									</view>
									<view class="fwx-trf-bar-row">
										<view class="fwx-trf-bar-fill fwx-trf-down" :style="{ width: (hourlyTrafficMax > 0 ? row.downBytes / hourlyTrafficMax * 100 : 0) + '%' }"></view>
										<text class="fwx-trf-val fwx-down-color">{{ formatBytes(row.downBytes) }}</text>
									</view>
								</view>
							</view>
						</view>
						<view v-else class="fwx-tab-state">
							<text class="fwx-empty-text">{{ $t('fwx_terminal.trf_no_data') }}</text>
						</view>
					</template>
					<view style="height: 40rpx;"></view>
				</scroll-view>

				<!-- Tab 4：今日常用App（按小时时间线） -->
				<scroll-view v-if="detailTab === 4" class="fwx-detail-scroll" scroll-y="true" show-scrollbar="false">
					<view v-if="hourlyStatsLoading" class="fwx-tab-state">
						<text class="fwx-loading-text">{{ $t('fwx_common.loading') }}</text>
					</view>
					<view v-else-if="hourlyTopAppsRows.length" class="fwx-detail-section">
						<text class="fwx-detail-section-title">{{ $t('fwx_terminal.tab_top_apps') }}</text>
						<view
							v-for="(row, ri) in hourlyTopAppsRows"
							:key="row.hour"
							class="fwx-ta-hour-block"
							:class="{ 'fwx-ta-hour-border': ri > 0 }"
						>
							<text class="fwx-trf-hour">{{ row.hour }}:00</text>
							<view class="fwx-ta-apps">
								<view
									v-for="(app, ai) in row.apps"
									:key="ai"
									class="fwx-ta-app-row"
								>
									<view class="fwx-ta-app-icon-wrap">
										<image
											v-if="app.appid && !iconErrors[String(app.appid)]"
											:src="getAppIconUrl(String(app.appid))"
											class="fwx-ta-app-icon"
											mode="scaleToFill"
											@error="onIconError(String(app.appid))"
										/>
										<view v-else class="fwx-ta-app-letter" :style="{ background: appColor(app.name) }">
											<text class="fwx-ta-app-letter-text">{{ (app.name || '?').charAt(0) }}</text>
										</view>
									</view>
									<text class="fwx-ta-app-name">{{ app.name }}</text>
									<view class="fwx-ta-bar-track">
										<view
											class="fwx-ta-bar-fill"
											:style="{ width: (row.maxTime > 0 ? app.time / row.maxTime * 100 : 0) + '%', background: pieColors[ai % pieColors.length] }"
										></view>
									</view>
									<text class="fwx-ta-time">{{ formatAppTime(app.time) }}</text>
								</view>
							</view>
						</view>
					</view>
					<view v-else-if="!hourlyStatsLoading" class="fwx-tab-state">
						<text class="fwx-empty-text">{{ $t('fwx_terminal.av_no_data') }}</text>
					</view>
					<view style="height: 40rpx;"></view>
				</scroll-view>

				<!-- Tab 5：应用记录 -->
				<scroll-view v-if="detailTab === 5" class="fwx-detail-scroll" scroll-y="true" show-scrollbar="false">
					<view class="fwx-detail-section">
						<view v-if="appRecordsLoading && appRecords.length === 0" class="fwx-records-loading">
							<text class="fwx-loading-text">{{ $t('fwx_common.loading') }}</text>
						</view>
						<view v-else-if="appRecords.length">
							<view
								v-for="(rec, ri) in appRecords"
								:key="ri"
								class="fwx-record-row"
								:class="{ 'fwx-record-last': ri === appRecords.length - 1 && !appRecordsHasMore }"
							>
								<view class="fwx-record-app-icon-wrap">
									<image
										v-if="getRecordAppId(rec) && !iconErrors[getRecordAppId(rec)]"
										:src="getAppIconUrl(getRecordAppId(rec))"
										class="fwx-record-app-icon"
										mode="scaleToFill"
										@error="onIconError(getRecordAppId(rec))"
									/>
									<view v-else class="fwx-record-app-letter" :style="{ background: appColor(rec.name) }">
										<text class="fwx-record-app-letter-text">{{ (rec.name || '?').charAt(0) }}</text>
									</view>
								</view>
								<view class="fwx-record-left">
									<text class="fwx-record-name">{{ rec.name }}</text>
									<text class="fwx-record-time">{{ formatRecordTime(rec.ft) }} · {{ formatDuration(rec.tt) }}</text>
								</view>
								<view class="fwx-record-online-dot" v-if="rec.online"></view>
							</view>
							<!-- 加载更多 -->
							<view class="fwx-load-more" v-if="appRecordsHasMore" @click="loadMoreRecords">
								<view v-if="appRecordsLoadingMore" class="fwx-load-more-spinner"></view>
								<text class="fwx-load-more-text">{{ appRecordsLoadingMore ? $t('fwx_common.loading_more') : $t('fwx_common.load_more') }}</text>
							</view>
						</view>
						<view v-else class="fwx-empty">
							<text class="fwx-empty-text">{{ $t('fwx_terminal.no_app_records') }}</text>
						</view>
					</view>

					<view style="height: 40rpx;"></view>
				</scroll-view>

				<!-- 黑名单操作栏 -->
				<view class="fwx-bl-bar">
					<view
						v-if="!isBlacklisted(detail.mac)"
						class="fwx-bl-btn fwx-bl-add"
						:class="{ 'fwx-bl-btn-disabled': blacklistActing }"
						@click="addToBlacklist"
					>
						<text class="fwx-bl-btn-text">{{ $t('fwx_terminal.blacklist_add') }}</text>
					</view>
					<view
						v-else
						class="fwx-bl-btn fwx-bl-remove"
						:class="{ 'fwx-bl-btn-disabled': blacklistActing }"
						@click="removeFromBlacklist"
					>
						<text class="fwx-bl-btn-text">{{ $t('fwx_terminal.blacklist_remove') }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 权限规则详情弹窗 -->
		<view v-if="pcDetail" class="fwx-pc-mask" @click.self="closePcDetail">
			<view class="fwx-pc-sheet">
				<view class="fwx-pc-head">
					<text class="fwx-pc-title">{{ $t('fwx_terminal.perm_detail_title') }}</text>
					<view class="fwx-pc-close" @click="closePcDetail"><text class="fwx-pc-close-text">✕</text></view>
				</view>
				<scroll-view scroll-y style="max-height: 60vh;">
					<view class="fwx-pc-body">
						<view v-if="pcDetailLoading" class="fwx-pc-loading">
							<text class="fwx-loading-text">{{ $t('fwx_common.loading') }}</text>
						</view>
						<template v-else>
							<!-- 权限状态 -->
							<view class="fwx-pc-row">
								<text class="fwx-pc-lbl">{{ $t('fwx_terminal.perm_label') }}</text>
								<view class="fwx-perm-badge" :class="'fwx-perm-' + pcDetail.statusKey">
									<text class="fwx-perm-text">{{ permTextFromKey(pcDetail.statusKey) }}</text>
								</view>
							</view>
							<!-- 无匹配规则 -->
							<view v-if="!pcDetail.matchedRule" class="fwx-pc-row">
								<text class="fwx-pc-lbl">{{ $t('fwx_terminal.perm_rule_detail') }}</text>
								<text class="fwx-pc-val">{{ $t('fwx_terminal.perm_no_rule') }}</text>
							</view>
							<template v-else>
								<!-- 规则类型 -->
								<view class="fwx-pc-row">
									<text class="fwx-pc-lbl">{{ $t('fwx_terminal.perm_rule_type') }}</text>
									<text class="fwx-pc-val">{{ pcDetail.matchedRule.type === 'appfilter' ? $t('fwx_terminal.perm_appfilter') : $t('fwx_terminal.perm_macfilter') }}</text>
								</view>
								<!-- 规则名称 -->
								<view class="fwx-pc-row">
									<text class="fwx-pc-lbl">{{ $t('fwx_terminal.perm_rule_name') }}</text>
									<text class="fwx-pc-val">{{ pcDetail.matchedRule.rule.rule_name || '--' }}</text>
								</view>
								<!-- 应用管控：受限分类 -->
								<view v-if="pcDetail.matchedRule.type === 'appfilter'" class="fwx-pc-row">
									<text class="fwx-pc-lbl">{{ $t('fwx_terminal.perm_restricted_apps') }}</text>
									<text class="fwx-pc-val">{{ formatCategories(pcDetail.matchedRule.rule.category_stats) }}</text>
								</view>
								<!-- 访问控制：限制类型 -->
								<view v-if="pcDetail.matchedRule.type === 'macfilter'" class="fwx-pc-row">
									<text class="fwx-pc-lbl">{{ $t('fwx_terminal.perm_match_type') }}</text>
									<text class="fwx-pc-val">{{ formatMatchType(pcDetail.matchedRule.rule.match_type) }}</text>
								</view>
								<!-- 时长用量 -->
								<view v-if="pcDetail.matchedRule.type === 'macfilter' && pcDetail.matchedRule.rule.match_type === 'duration'" class="fwx-pc-row">
									<text class="fwx-pc-lbl">{{ $t('fwx_terminal.perm_usage') }}</text>
									<text class="fwx-pc-val">{{ pcDetail.matchedRule.rule.used_minutes || 0 }} / {{ pcDetail.matchedRule.rule.limit_minutes || 0 }} min</text>
								</view>
								<!-- 流量用量 -->
								<view v-if="pcDetail.matchedRule.type === 'macfilter' && pcDetail.matchedRule.rule.match_type === 'flow'" class="fwx-pc-row">
									<text class="fwx-pc-lbl">{{ $t('fwx_terminal.perm_usage') }}</text>
									<text class="fwx-pc-val">{{ pcDetail.matchedRule.rule.used_mb || 0 }} / {{ pcDetail.matchedRule.rule.limit_mb || 0 }} MB</text>
								</view>
								<!-- 生效时段 -->
								<view v-if="formatRuleTime(pcDetail.matchedRule.rule) !== '--'" class="fwx-pc-row">
									<text class="fwx-pc-lbl">{{ $t('fwx_terminal.perm_time_rule') }}</text>
									<text class="fwx-pc-val">{{ formatRuleTime(pcDetail.matchedRule.rule) }}</text>
								</view>
							</template>
						</template>
					</view>
				</scroll-view>
			</view>
		</view>

		<fwx-tab-bar :current="2" />
	</view>
</template>

<script>
import DeviceManager from '@/utils/deviceManager.js'
import { getFanchmwrtAppIconUrl } from '@/utils/fanchmwrtAppIcon.js'
import { APP_MODE } from '@/config/appMode.js'
import FwxTabBar from '@/components/fwxTabBar.vue'

const USER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']
const APP_COLORS = [
	'#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
	'#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1'
]

export default {
	components: { FwxTabBar },
	data() {
		return {
			loading: true,
			device: null,
			ubusUrl: '',
			refreshTimer: null,
			users: [],
			detail: null,
			detailTab: 0,
			appRecords: [],
			appRecordsLoading: false,
			appRecordsLoadingMore: false,
			appRecordsPage: 1,
			appRecordsTotal: 0,
			appRecordsHasMore: false,
			iconErrors: {},
			blacklistMacs: {},
			blacklistActing: false,
			pcDetail: null,
			pcDetailLoading: false,
			behaviorRules: null,
			behaviorRulesLoading: false,
			appVisitData: null,
			appVisitLoading: false,
			hourlyStats: null,
			hourlyStatsLoading: false,
			pieColors: ['#34d399','#22c55e','#06b6d4','#60a5fa','#a78bfa','#f472b6','#fb923c','#fbbf24','#10b981','#3b82f6','#8b5cf6','#ec4899']
		}
	},

	computed: {
		onlineCount() { return this.users.filter(u => u.online).length },
		activeCount()  { return this.users.filter(u => u.online && u.active).length },

		appVisitSorted() {
			if (!this.appVisitData) return []
			return [...this.appVisitData].sort((a, b) => (b.t || 0) - (a.t || 0))
		},
		appVisitTotal() {
			return (this.appVisitData || []).reduce((s, a) => s + (a.t || 0), 0)
		},

		hourlyTopAppsRows() {
			if (!this.hourlyStats) return []
			return this.hourlyStats
				.filter(s => s.apps && s.apps.some(a => a.time > 0))
				.map(s => {
					const apps = [...(s.apps || [])]
						.filter(a => a.time > 0)
						.sort((a, b) => b.time - a.time)
						.slice(0, 3)
					return { hour: s.hour, apps, maxTime: apps.length ? apps[0].time : 1 }
				})
				.sort((a, b) => a.hour - b.hour)
		},

		hourlyTrafficRows() {
			if (!this.hourlyStats) return []
			return this.hourlyStats
				.filter(s => s.traffic && (s.traffic.up_bytes || s.traffic.down_bytes))
				.map(s => ({ hour: s.hour, upBytes: s.traffic.up_bytes || 0, downBytes: s.traffic.down_bytes || 0 }))
				.sort((a, b) => a.hour - b.hour)
		},
		hourlyTrafficMax() {
			if (!this.hourlyTrafficRows.length) return 1
			return Math.max(...this.hourlyTrafficRows.map(r => Math.max(r.upBytes, r.downBytes)), 1)
		},
		hourlyTotalUp() {
			return (this.hourlyStats || []).reduce((s, r) => s + (r.traffic ? r.traffic.up_bytes || 0 : 0), 0)
		},
		hourlyTotalDown() {
			return (this.hourlyStats || []).reduce((s, r) => s + (r.traffic ? r.traffic.down_bytes || 0 : 0), 0)
		},

	},

	watch: {
		appVisitData(val) {
			if (val && this.detailTab === 2) this.$nextTick(() => setTimeout(() => this.drawAppPieChart(), 80))
		},
		detailTab(val) {
			if (val === 2 && this.appVisitSorted.length) this.$nextTick(() => setTimeout(() => this.drawAppPieChart(), 80))
		}
	},

	onLoad() {
		this.device = DeviceManager.getCurrentDevice()
		if (!this.device) { uni.reLaunch({ url: APP_MODE === 'h5_single' ? '/pages/single/login' : '/pages/device_list' }); return }
		const protocol = this.device.useHttps ? 'https' : 'http'
		const host = DeviceManager.formatHostForUrl(this.device.ip)
		this.ubusUrl = `${protocol}://${host}:${this.device.port}/ubus`
		this.fetchUsers(false)
	},
	onShow()   { this.startTimer() },
	onHide()   { this.stopTimer() },
	onUnload() { this.stopTimer() },

	methods: {
		startTimer() {
			this.stopTimer()
			this.refreshTimer = setInterval(() => this.fetchUsers(true), 3000)
		},
		stopTimer() {
			if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null }
		},

		fetchUsers(silent) {
			uni.request({
				url: this.ubusUrl, method: 'POST',
				header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
				data: {
					jsonrpc: '2.0', id: 1, method: 'call',
					params: [this.device.sysauth, 'fwx', 'common', {
						api: 'get_all_users',
						CopyRight: 'www.fanchmwrt.com',
						data: { flag: 3, page: 1, page_size: 50 }
					}]
				},
				timeout: 5000,
				success: (res) => {
					if (res.data && res.data.result && res.data.result[0] === 0) {
						const payload = res.data.result[1]
						const data = (payload && payload.data) ? payload.data : payload
						const list = Array.isArray(data.list) ? data.list : []
						list.sort((a, b) => {
							const rankA = (a.online && a.active) ? 2 : a.online ? 1 : 0
							const rankB = (b.online && b.active) ? 2 : b.online ? 1 : 0
							return rankB - rankA
						})
						this.users = list
					}
					this.loading = false
				},
				fail: () => { this.loading = false }
			})
		},

		showDetail(user) {
			this.detail = user
			this.detailTab = 0
			this.appRecords = []
			this.appRecordsPage = 1
			this.appRecordsTotal = 0
			this.appRecordsHasMore = false
			this.behaviorRules = null
			this.appVisitData = null
			this.hourlyStats = null
			this.fetchBlacklist()
		},
		closeDetail() {
			this.detail = null
			this.appRecords = []
			this.appRecordsPage = 1
			this.appRecordsTotal = 0
			this.appRecordsHasMore = false
			this.behaviorRules = null
			this.appVisitData = null
			this.hourlyStats = null
		},
		switchDetailTab(idx) {
			this.detailTab = idx
			const mac = this.detail && this.detail.mac
			if (!mac) return
			if (idx === 1 && !this.behaviorRules && !this.behaviorRulesLoading) {
				this.fetchBehaviorRules(mac)
			}
			if (idx === 2 && !this.appVisitData && !this.appVisitLoading) {
				this.fetchAppVisitTime(mac)
			}
			if ((idx === 3 || idx === 4) && !this.hourlyStats && !this.hourlyStatsLoading) {
				this.fetchHourlyStats(mac)
			}
			if (idx === 5 && this.appRecords.length === 0 && !this.appRecordsLoading) {
				this.fetchAppRecords(mac, 1, false)
			}
		},

		fetchAppRecords(mac, page, append) {
			if (append) {
				this.appRecordsLoadingMore = true
			} else {
				this.appRecordsLoading = true
			}
			const PAGE_SIZE = 15
			uni.request({
				url: this.ubusUrl, method: 'POST',
				header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
				data: {
					jsonrpc: '2.0', id: 2, method: 'call',
					params: [this.device.sysauth, 'fwx', 'common', {
						api: 'dev_visit_list',
						CopyRight: 'www.fanchmwrt.com',
						data: { mac, page, page_size: PAGE_SIZE }
					}]
				},
				timeout: 5000,
				success: (res) => {
					this.appRecordsLoading = false
					this.appRecordsLoadingMore = false
					if (res.data && res.data.result && res.data.result[0] === 0) {
						const payload = res.data.result[1]
						const data = (payload && payload.data) ? payload.data : payload
						const list = Array.isArray(data.list) ? data.list : []
						const total = data.total || list.length
						this.appRecordsTotal = total
						this.appRecordsPage = page
						if (append) {
							this.appRecords = this.appRecords.concat(list)
						} else {
							this.appRecords = list
						}
						this.appRecordsHasMore = this.appRecords.length < total
					}
				},
				fail: () => {
					this.appRecordsLoading = false
					this.appRecordsLoadingMore = false
				}
			})
		},
		loadMoreRecords() {
			if (this.appRecordsLoadingMore || !this.appRecordsHasMore) return
			this.fetchAppRecords(this.detail.mac, this.appRecordsPage + 1, true)
		},

		async fetchBehaviorRules(mac) {
			this.behaviorRulesLoading = true
			try {
				const res = await this.ubus('get_user_parental_control_rules', { mac })
				this.behaviorRules = res || { list: [], af_whitelist: 0, mf_whitelist: 0 }
			} catch (e) {
				this.behaviorRules = { list: [], af_whitelist: 0, mf_whitelist: 0 }
			} finally {
				this.behaviorRulesLoading = false
			}
		},

		async fetchAppVisitTime(mac) {
			this.appVisitLoading = true
			try {
				const res = await this.ubus('dev_visit_time', { mac })
				this.appVisitData = Array.isArray(res && res.list) ? res.list : (Array.isArray(res) ? res : [])
			} catch (e) {
				this.appVisitData = []
			} finally {
				this.appVisitLoading = false
			}
		},

		async fetchHourlyStats(mac) {
			this.hourlyStatsLoading = true
			try {
				const res = await this.ubus('get_hourly_top_apps', { mac })
				this.hourlyStats = Array.isArray(res && res.hourly_stats) ? res.hourly_stats : []
			} catch (e) {
				this.hourlyStats = []
			} finally {
				this.hourlyStatsLoading = false
			}
		},

		// --- 行为规则 format ---
		brModuleText(module) {
			const map = { appfilter: this.$t('fwx_terminal.perm_appfilter'), macfilter: this.$t('fwx_terminal.perm_macfilter'), blacklist: this.$t('fwx_terminal.perm_mt_blacklist') }
			return map[module] || module || '--'
		},
		brConditionText(rule) {
			const ct = rule.condition_type
			const cond = rule.condition || {}
			const DAY = ['日','一','二','三','四','五','六']
			const fmtDays = (weekdays) => {
				if (!Array.isArray(weekdays) || !weekdays.length) return ''
				return weekdays.map(d => '周' + (DAY[d] !== undefined ? DAY[d] : d)).join(',')
			}
			if (ct === 'blacklist') return this.$t('fwx_terminal.perm_mt_blacklist')
			if (ct === 'duration') {
				const rules = cond.duration_rules || []
				if (!rules.length) return this.$t('fwx_terminal.perm_mt_duration')
				return rules.map(r => {
					const days = fmtDays(r.weekdays)
					const mins = parseInt(r.duration_minutes, 10)
					return `${days} ${isNaN(mins) || mins <= 0 ? '不限' : mins + 'min'}`
				}).join('; ')
			}
			if (ct === 'flow') {
				const rules = cond.flow_rules || []
				if (!rules.length) return this.$t('fwx_terminal.perm_mt_flow')
				return rules.map(r => {
					const days = fmtDays(r.weekdays)
					const mb = parseFloat(r.flow_mb)
					return `${days} ${isNaN(mb) || mb <= 0 ? '不限' : mb + 'MB'}`
				}).join('; ')
			}
			const rules = cond.time_rules || []
			if (!rules.length) return this.$t('fwx_terminal.perm_mt_time')
			return rules.map(r => {
				const days = fmtDays(r.weekdays)
				return `${days} ${r.start_time || '--'}-${r.end_time || '--'}`
			}).join('; ')
		},
		brIsProgress(rule) {
			const s = rule.today_status || {}
			const ct = rule.condition_type
			if (ct !== 'duration' && ct !== 'flow') return false
			if (!s.effective_today || s.unlimited) return false
			const limit = ct === 'duration' ? parseInt(s.limit, 10) : parseFloat(s.limit)
			return !isNaN(limit) && limit > 0
		},
		brProgressPct(rule) {
			const s = rule.today_status || {}
			const pct = parseInt(s.progress_percent, 10)
			if (isNaN(pct) || pct < 0) return 0
			return Math.min(pct, 100)
		},
		brProgressText(rule) {
			const s = rule.today_status || {}
			const ct = rule.condition_type
			if (ct === 'duration') {
				const used = parseInt(s.used, 10) || 0
				const limit = parseInt(s.limit, 10) || 0
				return `${used} / ${limit} min`
			}
			const used = parseFloat(s.used) || 0
			const limit = parseFloat(s.limit) || 0
			return `${used.toFixed(1)} / ${limit} MB`
		},
		brStatusText(rule) {
			const s = rule.today_status || {}
			const ct = rule.condition_type
			if (ct === 'duration' || ct === 'flow') {
				if (!s.effective_today) return this.$t('fwx_terminal.br_not_effective')
				if (s.unlimited) return this.$t('fwx_terminal.br_unlimited_today')
				if (s.exceeded) return this.$t('fwx_terminal.br_exceeded')
			}
			return s.matched ? this.$t('fwx_terminal.br_matched') : this.$t('fwx_terminal.br_not_matched')
		},
		brStatusClass(rule) {
			const s = rule.today_status || {}
			const ct = rule.condition_type
			if (ct === 'duration' || ct === 'flow') {
				if (!s.effective_today || s.unlimited) return 'fwx-br-muted'
				if (s.exceeded) return 'fwx-br-exceeded'
			}
			return s.matched ? 'fwx-br-matched' : 'fwx-br-muted'
		},

		formatAppTime(seconds) {
			if (!seconds || seconds <= 0) return '--'
			const h = Math.floor(seconds / 3600)
			const m = Math.floor((seconds % 3600) / 60)
			if (h > 0) return `${h}h${m > 0 ? m + 'm' : ''}`
			if (m > 0) return `${m}m`
			return `${seconds}s`
		},

		drawAppPieChart() {
			const data = this.appVisitSorted
			if (!data.length) return
			const total = this.appVisitTotal
			if (total <= 0) return
			const SIZE = 250
			const cx = SIZE / 2, cy = SIZE / 2
			const outerR = 88, innerR = 73
			const COLORS = this.pieColors
			const ctx = uni.createCanvasContext('appPieChart', this)
			ctx.clearRect(0, 0, SIZE, SIZE)
			ctx.beginPath()
			ctx.arc(cx, cy, outerR, 0, 2 * Math.PI)
			ctx.arc(cx, cy, innerR, 0, 2 * Math.PI, true)
			ctx.setFillStyle('rgba(148, 163, 184, 0.12)')
			ctx.fill()
			let startAngle = -Math.PI / 2
			data.forEach((app, i) => {
				const sweep = (app.t / total) * 2 * Math.PI
				const endAngle = startAngle - sweep
				ctx.beginPath()
				ctx.arc(cx, cy, outerR, startAngle, endAngle, true)
				ctx.arc(cx, cy, innerR, endAngle, startAngle, false)
				ctx.closePath()
				ctx.setFillStyle(COLORS[i % COLORS.length])
				ctx.fill()
				ctx.setStrokeStyle('#ffffff')
				ctx.setLineWidth(1.5)
				ctx.stroke()
				startAngle = endAngle
			})
			// Center label, matching the LuCI chart's total-time emphasis.
			ctx.beginPath()
			ctx.arc(cx, cy, innerR - 5, 0, 2 * Math.PI)
			ctx.setFillStyle('#ffffff')
			ctx.fill()
			const totalStr = this.formatAppTime(total)
			ctx.setTextAlign('center')
			ctx.setTextBaseline('middle')
			ctx.setFontSize(16)
			ctx.setFillStyle('#1c1c1e')
			ctx.fillText(totalStr, cx, cy - 7)
			ctx.setFontSize(10)
			ctx.setFillStyle('#8e8e93')
			ctx.fillText(this.$t('fwx_terminal.av_total'), cx, cy + 12)
			ctx.draw()
		},

		// --- 显示辅助 ---
		displayName(user) {
			return user.nickname || user.hostname || user.mac || '--'
		},
		userInitial(user) {
			const name = user.nickname || user.hostname || user.mac || '?'
			return name.charAt(0).toUpperCase()
		},
		macColor(mac) {
			if (!mac) return USER_COLORS[0]
			let hash = 0
			for (let i = 0; i < mac.length; i++) hash = ((hash * 31) + mac.charCodeAt(i)) >>> 0
			return USER_COLORS[hash % USER_COLORS.length]
		},
		statusClass(user) {
			if (user.online && user.active) return 'fwx-status-active'
			if (user.online) return 'fwx-status-online'
			return 'fwx-status-offline'
		},
		statusText(user) {
			if (user.online && user.active) return this.$t('fwx_common.active')
			if (user.online) return this.$t('fwx_common.online')
			return this.$t('fwx_common.offline')
		},
		formatRate(bps) {
			if (!bps || bps <= 0) return '0 B/s'
			const KB = 1024, MB = KB * 1024
			if (bps >= MB) return (bps / MB).toFixed(1) + ' MB/s'
			if (bps >= KB) return (bps / KB).toFixed(1) + ' KB/s'
			return Math.round(bps) + ' B/s'
		},
		formatBytes(bytes) {
			if (!bytes || bytes <= 0) return '0 B'
			const KB = 1024, MB = KB * 1024, GB = MB * 1024
			if (bytes >= GB) return (bytes / GB).toFixed(2) + ' GB'
			if (bytes >= MB) return (bytes / MB).toFixed(1) + ' MB'
			if (bytes >= KB) return (bytes / KB).toFixed(1) + ' KB'
			return bytes + ' B'
		},
		formatActiveTime(seconds) {
			if (!seconds) return '--'
			const h = Math.floor(seconds / 3600)
			const m = Math.floor((seconds % 3600) / 60)
			if (h > 0) return `${h}${this.$t('fwx_terminal.hour')}${m}${this.$t('fwx_terminal.minute_short')}`
			return `${m}${this.$t('fwx_terminal.minute')}`
		},
		formatDuration(seconds) {
			if (!seconds) return '--'
			const h = Math.floor(seconds / 3600)
			const m = Math.floor((seconds % 3600) / 60)
			const s = seconds % 60
			if (h > 0) return `${h}h${m}m`
			if (m > 0) return `${m}m${s}s`
			return `${s}s`
		},
		formatRecordTime(ts) {
			if (!ts) return '--'
			const d = new Date(Number(ts) * 1000)
			const p = n => String(n).padStart(2, '0')
			return `${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
		},
		getAppIconUrl(appId) {
			return getFanchmwrtAppIconUrl(this.device, appId)
		},
		getRecordAppId(rec) {
			if (!rec) return null
			const appId = rec.appid || rec.app_id || rec.appId
			if (appId) return String(appId)
			const name = rec.name || ''
			const applist = (this.detail && this.detail.applist) ? this.detail.applist : []
			const matched = applist.find(app => app && app.name === name)
			return matched && matched.id ? String(matched.id) : null
		},
		onIconError(appId) {
			this.$set(this.iconErrors, appId, true)
		},
		ubus(api, data) {
			return new Promise((resolve, reject) => {
				const freshDevice = DeviceManager.getCurrentDevice()
				if (freshDevice?.sysauth) this.device = freshDevice
				uni.request({
					url: this.ubusUrl, method: 'POST',
					header: { 'Content-Type': 'application/json', 'x-uniauth': 'true' },
					data: { jsonrpc: '2.0', id: 1, method: 'call', params: [this.device.sysauth, 'fwx', 'common', { api, CopyRight: 'www.fanchmwrt.com', data }] },
					timeout: 8000,
					success: (res) => {
						const payload = res?.data?.result?.[1]
						resolve((payload && payload.data) ? payload.data : payload)
					},
					fail: reject
				})
			})
		},

		fetchBlacklist() {
			this.ubus('get_mac_blacklist', {}).then(res => {
				const map = {}
				;(res?.list || []).forEach(item => {
					if (item.mac) map[item.mac.toUpperCase()] = true
				})
				this.blacklistMacs = map
			}).catch(() => {})
		},

		isBlacklisted(mac) {
			return !!(mac && this.blacklistMacs[(mac).toUpperCase()])
		},

		addToBlacklist() {
			const mac = this.detail && this.detail.mac
			if (!mac || this.blacklistActing) return
			uni.showModal({
				title: this.$t('fwx_blacklist.add_confirm_title'),
				content: this.$t('fwx_blacklist.add_confirm'),
				confirmColor: '#FF3B30',
				success: async (res) => {
					if (!res.confirm) return
					this.blacklistActing = true
					try {
						const r = await this.ubus('add_mac_blacklist', { mac_list: [mac] })
						if (r?.code === 2000) {
							this.$set(this.blacklistMacs, mac.toUpperCase(), true)
							uni.showToast({ title: this.$t('fwx_blacklist.add_success'), icon: 'success' })
						} else {
							uni.showToast({ title: this.$t('fwx_blacklist.add_failed'), icon: 'none' })
						}
					} catch (e) {
						uni.showToast({ title: this.$t('fwx_blacklist.add_failed'), icon: 'none' })
					} finally {
						this.blacklistActing = false
					}
				}
			})
		},

		permStatusKey(user) {
			const key = (user && (user.pc_status_key || user.pc_status)) || 'unlimited'
			if (key === 'app_limited' || key === 'mac_blocked') return key
			return 'unlimited'
		},
		permText(user) {
			return this.permTextFromKey(this.permStatusKey(user))
		},
		permTextFromKey(key) {
			if (key === 'app_limited') return this.$t('fwx_terminal.perm_app_limited')
			if (key === 'mac_blocked') return this.$t('fwx_terminal.perm_mac_blocked')
			return this.$t('fwx_terminal.perm_unlimited')
		},
		permBadgeClass(user) {
			return 'fwx-perm-' + this.permStatusKey(user)
		},

		showPermDetail(user) {
			this.pcDetail = { mac: user.mac, statusKey: this.permStatusKey(user), matchedRule: null }
			this.pcDetailLoading = true
			this.ubus('get_parental_control_detail', { mac: user.mac }).then(res => {
				const detail = res || {}
				const statusKey = detail.pc_status_key || detail.pc_status || 'unlimited'
				const appRules = Array.isArray(detail.appfilter_rules) ? detail.appfilter_rules : []
				const macRules = Array.isArray(detail.macfilter_rules) ? detail.macfilter_rules : []
				this.pcDetail = {
					mac: user.mac,
					statusKey: statusKey === 'app_limited' || statusKey === 'mac_blocked' ? statusKey : 'unlimited',
					matchedRule: this.pickMatchedRule(statusKey, appRules, macRules)
				}
			}).catch(() => {}).finally(() => { this.pcDetailLoading = false })
		},
		closePcDetail() { this.pcDetail = null },

		pickMatchedRule(statusKey, appRules, macRules) {
			const sort = (a, b) => (parseInt(a.rule_id) || 0) - (parseInt(b.rule_id) || 0)
			const appRule = appRules.length ? [...appRules].sort(sort)[0] : null
			const sortedMac = [...macRules].sort(sort)
			const macRule = sortedMac[0] || null
			const blRule = sortedMac.find(r => r.match_type === 'blacklist') || null
			if (statusKey === 'app_limited' && appRule) return { type: 'appfilter', rule: appRule }
			if (statusKey === 'mac_blocked') {
				if (blRule) return { type: 'macfilter', rule: blRule }
				if (macRule) return { type: 'macfilter', rule: macRule }
			}
			if (blRule) return { type: 'macfilter', rule: blRule }
			if (macRule) return { type: 'macfilter', rule: macRule }
			if (appRule) return { type: 'appfilter', rule: appRule }
			return null
		},

		formatCategories(stats) {
			if (!Array.isArray(stats) || !stats.length) return '--'
			return stats.map(s => s.name || ('Class-' + s.id)).filter(Boolean).join(', ')
		},
		formatMatchType(matchType) {
			const map = { duration: this.$t('fwx_terminal.perm_mt_duration'), flow: this.$t('fwx_terminal.perm_mt_flow'), blacklist: this.$t('fwx_terminal.perm_mt_blacklist'), time: this.$t('fwx_terminal.perm_mt_time') }
			return map[matchType] || matchType || '--'
		},
		formatRuleTime(rule) {
			if (!rule) return '--'
			const rules = rule.time_rules || rule.duration_rules || rule.flow_rules || []
			if (!rules.length) return '--'
			const DAY = ['日','一','二','三','四','五','六']
			return rules.map(r => {
				const days = (r.weekdays || []).map(d => '周' + (DAY[d] !== undefined ? DAY[d] : d)).join(',')
				if (r.start_time && r.end_time) return `${days} ${r.start_time}-${r.end_time}`
				if (r.duration_minutes) return `${days} ${this.$t('fwx_terminal.perm_daily')}${r.duration_minutes}min`
				if (r.flow_mb) return `${days} ${this.$t('fwx_terminal.perm_daily')}${r.flow_mb}MB`
				return days
			}).filter(Boolean).join('; ') || '--'
		},

		removeFromBlacklist() {
			const mac = this.detail && this.detail.mac
			if (!mac || this.blacklistActing) return
			uni.showModal({
				title: this.$t('fwx_blacklist.remove_confirm_title'),
				content: this.$t('fwx_blacklist.remove_confirm'),
				confirmColor: '#FF3B30',
				success: async (res) => {
					if (!res.confirm) return
					this.blacklistActing = true
					try {
						const r = await this.ubus('del_mac_blacklist', { mac })
						if (r?.code === 2000) {
							this.$delete(this.blacklistMacs, mac.toUpperCase())
							uni.showToast({ title: this.$t('fwx_blacklist.remove_success'), icon: 'success' })
						} else {
							uni.showToast({ title: this.$t('fwx_blacklist.remove_failed'), icon: 'none' })
						}
					} catch (e) {
						uni.showToast({ title: this.$t('fwx_blacklist.remove_failed'), icon: 'none' })
					} finally {
						this.blacklistActing = false
					}
				}
			})
		},

		appColor(name) {
			if (!name) return APP_COLORS[0]
			let hash = 0
			for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
			return APP_COLORS[Math.abs(hash) % APP_COLORS.length]
		},
		getActiveAppId(user) {
			if (!user.app || !user.applist) return null
			const item = user.applist.find(a => a.name === user.app)
			return item ? (item.id || null) : null
		},
		getCommonApps(user) {
			const applist = user.applist || []
			const max = user.app ? 4 : 5
			if (user.app) return applist.filter(a => a.name !== user.app).slice(0, max)
			return applist.slice(0, max)
		}
	}
}
</script>

<style scoped>
.fwx-page { min-height: 100vh; background: #F2F2F7; display: flex; flex-direction: column; }

/* 导航 */
.fwx-nav { display: flex; align-items: center; justify-content: space-between; padding: 88rpx 32rpx 20rpx; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.fwx-nav-title { font-size: 28rpx; font-weight: 400; color: #1c1c1e; flex: 1; text-align: center; }

/* 加载 */
.fwx-loading { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; padding-bottom: 160rpx; }
.fwx-spinner { width: 60rpx; height: 60rpx; border: 4rpx solid #e5e5e5; border-top-color: #007AFF; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.fwx-loading-text { font-size: 26rpx; color: #999; }

/* 列表 */
.fwx-scroll { flex: 1; }
.fwx-list-inner { padding: 20rpx 24rpx 0; box-sizing: border-box; }

.fwx-summary { padding: 12rpx 4rpx 16rpx; }
.fwx-summary-text { font-size: 24rpx; color: #8e8e93; }

/* 用户卡片 */
.fwx-user-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx 26rpx;
	margin-bottom: 16rpx;
	box-sizing: border-box;
}
.fwx-user-card:active { opacity: 0.85; }

.fwx-card-head { display: flex; align-items: center; gap: 20rpx; margin-bottom: 16rpx; }
.fwx-avatar { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fwx-avatar-text { font-size: 32rpx; color: #fff; font-weight: 700; }
.fwx-card-info { flex: 1; min-width: 0; }
.fwx-card-name-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 6rpx; }
.fwx-card-name { font-size: 28rpx; font-weight: 600; color: #1c1c1e; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fwx-card-sub { font-size: 22rpx; color: #8e8e93; }

/* 状态 badge */
.fwx-status-badge { padding: 6rpx 14rpx; border-radius: 20rpx; flex-shrink: 0; display: flex; align-items: center; }
.fwx-status-active { background: #dcfce7; }
.fwx-status-online  { background: #dbeafe; }
.fwx-status-offline { background: #f3f4f6; }
.fwx-status-text { font-size: 20rpx; font-weight: 600; line-height: 1; }
.fwx-status-active .fwx-status-text  { color: #16a34a; }
.fwx-status-online  .fwx-status-text  { color: #2563eb; }
.fwx-status-offline .fwx-status-text { color: #6b7280; }

/* 速率 */
.fwx-card-rates { display: flex; align-items: center; gap: 20rpx; margin-bottom: 12rpx; }
.fwx-rate-item { display: flex; align-items: center; gap: 4rpx; }
.fwx-rate-arrow { font-size: 24rpx; font-weight: 700; }
.fwx-up { color: #00c4cc; }
.fwx-down { color: #4facfe; }
.fwx-rate-val { font-size: 24rpx; color: #3c3c43; font-weight: 500; }
.fwx-today-stats { margin-left: auto; display: flex; align-items: center; gap: 10rpx; }
.fwx-today-stats-row { display: flex; align-items: center; gap: 10rpx; margin-bottom: 12rpx; }
.fwx-today-stat { font-size: 22rpx; color: #8e8e93; background: #F2F2F7; padding: 4rpx 10rpx; border-radius: 8rpx; line-height: 1; }

/* App chips (detail panel) */
.fwx-app-chips { display: flex; flex-wrap: wrap; gap: 10rpx; }
.fwx-app-chips-detail { margin-top: 4rpx; }
.fwx-app-chip { background: #f0f4ff; border-radius: 8rpx; padding: 6rpx 16rpx; display: flex; align-items: center; }
.fwx-app-chip-text { font-size: 22rpx; color: #3b82f6; line-height: 1; }

/* 应用图标行 */
.fwx-app-icons { display: flex; align-items: center; gap: 10rpx; margin-top: 4rpx; }
.fwx-icon-slot { position: relative; flex-shrink: 0; }
.fwx-app-icon-img { width: 42rpx; height: 42rpx; border-radius: 9rpx; display: block; }
.fwx-app-icon-fb { width: 42rpx; height: 42rpx; border-radius: 9rpx; display: flex; align-items: center; justify-content: center; }
.fwx-icon-fb-text { font-size: 18rpx; color: #fff; font-weight: 700; }
.fwx-icon-active-dot { position: absolute; top: -3rpx; left: -3rpx; width: 14rpx; height: 14rpx; background: #22c55e; border-radius: 50%; border: 3rpx solid #fff; }
.fwx-url-label { margin-left: auto; font-size: 22rpx; color: #8e8e93; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; }

/* 空状态 */
.fwx-empty { padding: 40rpx 0 20rpx; text-align: center; }
.fwx-empty-text { font-size: 26rpx; color: #c7c7cc; }

/* 详情面板 */
.fwx-detail-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; flex-direction: column; justify-content: flex-end; }
.fwx-detail-panel { background: #F2F2F7; border-radius: 24rpx 24rpx 0 0; height: 80vh; display: flex; flex-direction: column; padding-bottom: env(safe-area-inset-bottom); }

.fwx-detail-head { display: flex; align-items: center; gap: 20rpx; padding: 32rpx 30rpx 24rpx; background: #ffffff; border-radius: 24rpx 24rpx 0 0; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.fwx-detail-avatar { width: 72rpx; height: 72rpx; border-radius: 18rpx; }
.fwx-detail-title-wrap { flex: 1; display: flex; align-items: center; gap: 14rpx; min-width: 0; }
.fwx-detail-title { font-size: 30rpx; font-weight: 700; color: #1c1c1e; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fwx-detail-close { width: 56rpx; height: 56rpx; background: #F2F2F7; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fwx-detail-close-text { font-size: 24rpx; color: #8e8e93; }

.fwx-detail-scroll { flex: 1; height: 0; }

.fwx-detail-section { background: #ffffff; border-radius: 16rpx; margin: 16rpx 20rpx 0; padding: 24rpx 26rpx; }
.fwx-detail-section-title { font-size: 26rpx; font-weight: 700; color: #1c1c1e; display: block; margin-bottom: 16rpx; }

/* KV rows */
.fwx-detail-kv { display: flex; flex-direction: column; }
.fwx-kv-row { display: flex; align-items: center; justify-content: space-between; padding: 10rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.05); }
.fwx-kv-row:last-child { border-bottom: none; }
.fwx-kv-lbl { font-size: 24rpx; color: #8e8e93; flex-shrink: 0; min-width: 130rpx; }
.fwx-kv-val { font-size: 26rpx; color: #1c1c1e; font-weight: 500; flex: 1; text-align: right; word-break: break-all; }
.fwx-kv-small { font-size: 22rpx; }

/* 今日数据格子 */
.fwx-today-grid { display: flex; gap: 16rpx; }
.fwx-today-item { flex: 1; background: #F8F8F8; border-radius: 12rpx; padding: 18rpx 16rpx; display: flex; flex-direction: column; gap: 8rpx; align-items: center; }
.fwx-today-label { font-size: 22rpx; color: #8e8e93; }
.fwx-today-value { font-size: 26rpx; font-weight: 700; color: #1c1c1e; }
.fwx-up-color { color: #00c4cc; }
.fwx-down-color { color: #4facfe; }

/* Tab 切换栏 */
.fwx-detail-tabs { display: flex; background: #ffffff; border-bottom: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; white-space: nowrap; }
.fwx-detail-tab { display: inline-flex; align-items: center; justify-content: center; gap: 8rpx; padding: 22rpx 28rpx 20rpx; position: relative; flex-shrink: 0; }
.fwx-detail-tab-text { font-size: 26rpx; color: #8e8e93; font-weight: 500; }
.fwx-detail-tab-count { font-size: 20rpx; color: #8e8e93; background: #f0f0f0; border-radius: 20rpx; padding: 2rpx 10rpx; line-height: 1; }
.fwx-detail-tab-active .fwx-detail-tab-text { color: #007AFF; }
.fwx-detail-tab-active .fwx-detail-tab-count { color: #007AFF; background: #e8f0fe; }
.fwx-detail-tab-active::after { content: ''; position: absolute; bottom: 0; left: 25%; right: 25%; height: 4rpx; background: #007AFF; border-radius: 4rpx; }

/* 通用 tab 空状态 */
.fwx-tab-state { display: flex; align-items: center; justify-content: center; padding: 80rpx 40rpx; }

/* 管控规则 tab */
.fwx-br-hint-wrap { padding: 16rpx 20rpx 0; }
.fwx-br-hint { background: rgba(59,130,246,0.08); border: 1rpx solid rgba(59,130,246,0.25); border-radius: 10rpx; padding: 14rpx 18rpx; margin-bottom: 10rpx; }
.fwx-br-hint-text { font-size: 24rpx; color: #3b82f6; line-height: 1.5; }
.fwx-br-item { padding: 20rpx 0; }
.fwx-br-item-border { border-top: 1rpx solid rgba(0,0,0,0.06); }
.fwx-br-head { display: flex; align-items: center; gap: 10rpx; flex-wrap: wrap; margin-bottom: 12rpx; }
.fwx-br-module { font-size: 26rpx; font-weight: 600; color: #1c1c1e; }
.fwx-br-rule-name { font-size: 24rpx; color: #8e8e93; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fwx-br-cond-row { display: flex; align-items: flex-start; gap: 12rpx; margin-bottom: 10rpx; }
.fwx-br-status-row { display: flex; align-items: center; gap: 12rpx; }
.fwx-br-cond-lbl { font-size: 22rpx; color: #8e8e93; flex-shrink: 0; min-width: 80rpx; }
.fwx-br-cond-val { font-size: 24rpx; color: #3c3c43; flex: 1; }
.fwx-br-progress-wrap { flex: 1; }
.fwx-br-progress-track { height: 6rpx; background: rgba(142,142,147,0.2); border-radius: 6rpx; overflow: hidden; margin-bottom: 6rpx; }
.fwx-br-progress-fill { height: 100%; background: #34C759; border-radius: 6rpx; }
.fwx-br-progress-fill.fwx-br-progress-exceeded { background: #FF3B30; }
.fwx-br-progress-text { font-size: 22rpx; color: #8e8e93; }
.fwx-br-status-text { font-size: 24rpx; }
.fwx-br-matched { color: #34C759; font-weight: 500; }
.fwx-br-muted { color: #8e8e93; }
.fwx-br-exceeded { color: #FF3B30; font-weight: 500; }

/* App统计环形图 */
.fwx-pie-section { padding: 24rpx 26rpx 18rpx; display: flex; flex-direction: column; align-items: stretch; }
.fwx-pie-title { font-size: 28rpx; font-weight: 600; color: #1c1c1e; margin-bottom: 4rpx; }
.fwx-pie-canvas-wrap { display: flex; justify-content: center; align-items: center; height: 500rpx; }
.fwx-pie-canvas { width: 250px; height: 250px; display: block; }
.fwx-pie-legend-section { padding: 4rpx 26rpx 6rpx; }
.fwx-pie-legend-row { display: flex; align-items: center; gap: 16rpx; padding: 18rpx 0; }
.fwx-pie-legend-border { border-top: 1rpx solid rgba(148,163,184,0.18); }
.fwx-pie-legend-marker { width: 18rpx; height: 18rpx; border-radius: 4rpx; flex-shrink: 0; box-shadow: 0 0 0 2rpx rgba(255,255,255,0.9); }
.fwx-pie-legend-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8rpx; }
.fwx-pie-legend-name { font-size: 26rpx; color: #1c1c1e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fwx-pie-legend-track { width: 100%; height: 6rpx; border-radius: 6rpx; background: rgba(148,163,184,0.16); overflow: hidden; }
.fwx-pie-legend-fill { height: 100%; border-radius: 6rpx; min-width: 4rpx; }
.fwx-pie-legend-meta { width: 112rpx; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; }
.fwx-pie-legend-pct { font-size: 24rpx; color: #8e8e93; line-height: 1; }
.fwx-pie-legend-time { font-size: 24rpx; color: #3c3c43; font-weight: 500; line-height: 1; }

/* 常用App时间线 */
.fwx-ta-hour-block { padding: 16rpx 0; }
.fwx-ta-hour-border { border-top: 1rpx solid rgba(0,0,0,0.06); }
.fwx-ta-apps { margin-top: 10rpx; display: flex; flex-direction: column; gap: 10rpx; }
.fwx-ta-app-row { display: flex; align-items: center; gap: 12rpx; }
.fwx-ta-app-icon-wrap { width: 36rpx; height: 36rpx; flex-shrink: 0; }
.fwx-ta-app-icon { width: 36rpx; height: 36rpx; border-radius: 8rpx; }
.fwx-ta-app-letter { width: 36rpx; height: 36rpx; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; }
.fwx-ta-app-letter-text { font-size: 16rpx; font-weight: 700; color: #fff; }
.fwx-ta-app-name { font-size: 24rpx; color: #3c3c43; min-width: 120rpx; max-width: 160rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; }
.fwx-ta-bar-track { flex: 1; height: 8rpx; background: rgba(142,142,147,0.15); border-radius: 8rpx; overflow: hidden; }
.fwx-ta-bar-fill { height: 100%; border-radius: 8rpx; min-width: 4rpx; }
.fwx-ta-time { font-size: 22rpx; color: #8e8e93; min-width: 70rpx; text-align: right; flex-shrink: 0; }

/* 今日流量 tab */
.fwx-trf-summary { margin-bottom: 0; }
.fwx-trf-row { display: flex; align-items: center; gap: 16rpx; padding: 12rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.04); }
.fwx-trf-row:last-child { border-bottom: none; }
.fwx-trf-hour { font-size: 24rpx; color: #8e8e93; min-width: 70rpx; flex-shrink: 0; }
.fwx-trf-bars { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.fwx-trf-bar-row { display: flex; align-items: center; gap: 10rpx; }
.fwx-trf-bar-fill { height: 6rpx; border-radius: 6rpx; min-width: 2rpx; }
.fwx-trf-up { background: #5470c6; }
.fwx-trf-down { background: #91cc75; }
.fwx-trf-val { font-size: 20rpx; min-width: 80rpx; text-align: right; flex-shrink: 0; }

/* 加载更多 */
.fwx-load-more { display: flex; align-items: center; justify-content: center; gap: 12rpx; padding: 24rpx 0 8rpx; border-top: 1rpx solid rgba(0,0,0,0.05); margin-top: 4rpx; }
.fwx-load-more:active { opacity: 0.7; }
.fwx-load-more-spinner { width: 28rpx; height: 28rpx; border: 3rpx solid #e5e5e5; border-top-color: #007AFF; border-radius: 50%; animation: spin 0.8s linear infinite; }
.fwx-load-more-text { font-size: 24rpx; color: #007AFF; }

/* 应用记录 */
.fwx-records-loading { padding: 20rpx 0; text-align: center; }
.fwx-record-row { display: flex; align-items: center; justify-content: space-between; gap: 14rpx; padding: 14rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.05); }
.fwx-record-last { border-bottom: none; }
.fwx-record-app-icon-wrap { width: 42rpx; height: 42rpx; flex-shrink: 0; }
.fwx-record-app-icon { width: 42rpx; height: 42rpx; border-radius: 9rpx; display: block; }
.fwx-record-app-letter { width: 42rpx; height: 42rpx; border-radius: 9rpx; display: flex; align-items: center; justify-content: center; }
.fwx-record-app-letter-text { font-size: 18rpx; font-weight: 700; color: #fff; }
.fwx-record-left { flex: 1; min-width: 0; }
.fwx-record-name { font-size: 26rpx; color: #1c1c1e; font-weight: 500; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fwx-record-time { font-size: 22rpx; color: #8e8e93; display: block; margin-top: 4rpx; }
.fwx-record-online-dot { width: 14rpx; height: 14rpx; border-radius: 50%; background: #22c55e; flex-shrink: 0; margin-left: 16rpx; }

/* permission badge */
.fwx-perm-badge { padding: 6rpx 14rpx; border-radius: 20rpx; flex-shrink: 0; display: flex; align-items: center; }
.fwx-perm-unlimited { background: rgba(52,199,89,0.15); }
.fwx-perm-unlimited .fwx-perm-text { color: #34C759; }
.fwx-perm-app_limited { background: rgba(255,149,0,0.15); }
.fwx-perm-app_limited .fwx-perm-text { color: #FF9500; }
.fwx-perm-mac_blocked { background: rgba(255,59,48,0.15); }
.fwx-perm-mac_blocked .fwx-perm-text { color: #FF3B30; }
.fwx-perm-text { font-size: 22rpx; font-weight: 600; line-height: 1; }

/* permission detail sheet */
.fwx-pc-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 300; display: flex; align-items: flex-end; }
.fwx-pc-sheet { background: #fff; border-radius: 24rpx 24rpx 0 0; width: 100%; padding-bottom: env(safe-area-inset-bottom); }
.fwx-pc-head { display: flex; align-items: center; justify-content: space-between; padding: 32rpx 32rpx 20rpx; border-bottom: 1rpx solid rgba(0,0,0,0.06); }
.fwx-pc-title { font-size: 30rpx; font-weight: 600; color: #1c1c1e; }
.fwx-pc-close { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }
.fwx-pc-close-text { font-size: 28rpx; color: #8e8e93; }
.fwx-pc-body { padding: 8rpx 32rpx 24rpx; }
.fwx-pc-loading { padding: 60rpx; text-align: center; }
.fwx-pc-row { display: flex; align-items: center; justify-content: space-between; padding: 18rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.05); gap: 16rpx; }
.fwx-pc-row:last-child { border-bottom: none; }
.fwx-pc-lbl { font-size: 26rpx; color: #8e8e93; flex-shrink: 0; min-width: 140rpx; }
.fwx-pc-val { font-size: 26rpx; color: #1c1c1e; font-weight: 500; text-align: right; flex: 1; word-break: break-all; }

/* blacklist bar */
.fwx-bl-bar { padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); background: #ffffff; border-top: 1rpx solid rgba(0,0,0,0.06); flex-shrink: 0; }
.fwx-bl-btn { height: 80rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; }
.fwx-bl-add { background: #FF3B30; }
.fwx-bl-remove { background: #f0f0f0; }
.fwx-bl-btn-text { font-size: 28rpx; font-weight: 600; }
.fwx-bl-add .fwx-bl-btn-text { color: #ffffff; }
.fwx-bl-remove .fwx-bl-btn-text { color: #3c3c43; }
.fwx-bl-btn-disabled { opacity: 0.5; }
</style>
