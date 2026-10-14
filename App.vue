<script>
	import { APP_MODE } from '@/config/appMode.js'
	import DeviceManager from '@/utils/deviceManager.js'

	export default {
		globalData: {
			_afEditRule: null,
			_afClassList: []
		},
		onLaunch: function() {
			this.initI18n()
			if (APP_MODE === 'h5_single') {
				const device = DeviceManager.getCurrentDevice()
				if (device && device.sysauth) {
					// Has a valid session.
					// #ifdef H5
					// In H5 the hash router will naturally restore the current page on refresh.
					// Only force-navigate when on a page that must not appear in single mode.
					const hash = window.location.hash || ''
					// If the user is on the login page, let it load as-is (they may want to re-login).
					if (!hash.includes('single/login')) {
						// Redirect away from root or device_list (invalid in single mode).
						const mustRedirect = !hash || hash === '#/' || hash.includes('device_list')
						if (mustRedirect) {
							const target = device.isFanchmwrt === true
								? '/pages/fanchmwrt/dashboard'
								: '/pages/openwrt/home'
							uni.reLaunch({ url: target })
						}
						// Otherwise: do nothing ¡ª let the hash router restore the current page.
					}
					// #endif
					// #ifndef H5
					const target = device.isFanchmwrt === true
						? '/pages/fanchmwrt/dashboard'
						: '/pages/openwrt/home'
					uni.reLaunch({ url: target })
					// #endif
				} else {
					// #ifdef H5
					// Already on login page, no need to reLaunch.
					const hash = window.location.hash || ''
					if (!hash.includes('single/login')) {
						uni.reLaunch({ url: '/pages/single/login' })
					}
					// #endif
					// #ifndef H5
					uni.reLaunch({ url: '/pages/single/login' })
					// #endif
				}
			}
		},
		onShow: function() {
		
		},
		onPageNotFound: function() {
	
		},
		onHide: function() {
		
		},
		
		methods: {

    
			initI18n() {

				const savedLocale = uni.getStorageSync('locale')
				if (savedLocale) {
					
					uni.setStorageSync('locale', savedLocale)
				}
			},

		}
	}

	uni.addInterceptor('request', {
		invoke(args) {
			if (args.header['x-uniauth'] === 'true') {
				args.sslVerify = false
			}
			return args;
		}
	});
</script>

<style>
/* #ifdef H5 */
/* In H5 the browser handles its own status bar, so the 88rpx top padding
   used in native to absorb the status bar becomes unwanted blank space. */
.fw-nav, .fwx-nav, .fn-nav, .fm-nav, .nav-header,
.af-nav, .mf-nav, .bl-nav, .ir-nav, .afe-nav, .mfe-nav {
	padding-top: 20rpx !important;
}
/* #endif */
</style>
