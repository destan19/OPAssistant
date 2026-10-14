import App from './App'
import en from './locale/en.json'
import zhHans from './locale/zh-Hans.json'

const messages = {
	en,
	'zh-Hans': zhHans
}

function getDefaultLocale() {
  try {
    const storedLocale = uni.getStorageSync('locale')
    console.log('[Language] Stored locale from storage:', storedLocale)

    if (storedLocale) {
      console.log('[Language] Using stored locale:', storedLocale)
      return storedLocale
    }
  } catch (error) {
    console.log('[Language] Failed to get stored locale:', error)
  }

  // Get system language
  var locale = uni.getLocale()
  let result
  if (locale == 'zh-Hans') {
    result = 'zh-Hans'
  } else {
    result = 'en'
  }
  
  console.log('[Language] Final selected locale:', result)
  return result
}


let i18nConfig = {
  locale: getDefaultLocale(),
  messages
}


// #ifndef VUE3
import Vue from 'vue'
import VueI18n from 'vue-i18n'
Vue.use(VueI18n)
const i18nVue2 = new VueI18n(i18nConfig)
Vue.config.productionTip = false
App.mpType = 'app'
import tabBar from "components/tabBar.vue"
Vue.component('tabBar',tabBar)

try {
  function isPromise(obj) {
    return (
      !!obj &&
      (typeof obj === "object" || typeof obj === "function") &&
      typeof obj.then === "function"
    );
  }
  uni.addInterceptor({
    returnValue(res) {
      if (!isPromise(res)) {
        return res;
      }
      return new Promise((resolve, reject) => {
        res.then((res) => {
          if (res[0]) {
            reject(res[0]);
          } else {
            resolve(res[1]);
          }
        });
      });
    },
  });
} catch (error) { }

const app = new Vue({
  i18n: i18nVue2,
  ...App
})
app.$mount()



// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { createI18n } from 'vue-i18n'// v9.x

const i18nVue3 = createI18n(i18nConfig)
export function createApp() {
  const app = createSSRApp(App)
  app.use(i18nVue3)
  return {
    app
  }
}// #endif
