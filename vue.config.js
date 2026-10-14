module.exports = {
  devServer: {
    port: 8080,
    proxy: {
      '/ubus': {
        target: 'http://192.168.1.1',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onProxyReq(proxyReq, req) {
          console.log('[proxy] /ubus ->', 'http://192.168.1.1' + req.url)
        },
        onError(err) {
          console.error('[proxy] /ubus error:', err.message)
        }
      },
      '/cgi-bin/luci': {
        target: 'http://192.168.1.1',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onProxyReq(proxyReq, req) {
          console.log('[proxy] /cgi-bin/luci ->', 'http://192.168.1.1' + req.url)
        },
        onError(err) {
          console.error('[proxy] /cgi-bin/luci error:', err.message)
        }
      }
    }
  }
} 