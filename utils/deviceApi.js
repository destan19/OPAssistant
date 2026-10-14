import GlobalState from './globalState.js'
import DeviceManager from './deviceManager.js'

class DeviceApi {

	static async getSystemStatus() {
		try {
			const device = GlobalState.getCurrentDeviceFull()
			if (!device) {
				throw new Error('device not found')
			}
			
			const formattedHost = DeviceManager.formatHostForUrl(device.ip)
			const protocol = device.useHttps ? 'https' : 'http'
			const url = `${protocol}://${formattedHost}:${device.port}/cgi-bin/luci/admin/status/overview`
			const response = await DeviceManager.requestWithAuth(device, url)
			
			return response
		} catch (error) {
			throw error
		}
	}
	

	static async getNetworkInterfaces() {
		try {
			const device = GlobalState.getCurrentDeviceFull()
			if (!device) {
				throw new Error('device not found')
			}
			
			const formattedHost = DeviceManager.formatHostForUrl(device.ip)
			const protocol = device.useHttps ? 'https' : 'http'
			const url = `${protocol}://${formattedHost}:${device.port}/cgi-bin/luci/admin/network/network`
			const response = await DeviceManager.requestWithAuth(device, url)
			
			return response
		} catch (error) {
			throw error
		}
	}

	static async getSystemLoad() {
		try {
			const device = GlobalState.getCurrentDeviceFull()
			if (!device) {
				throw new Error('device not found')
			}
			
			const formattedHost = DeviceManager.formatHostForUrl(device.ip)
			const protocol = device.useHttps ? 'https' : 'http'
			const url = `${protocol}://${formattedHost}:${device.port}/cgi-bin/luci/admin/status/overview`
			const response = await DeviceManager.requestWithAuth(device, url)
			
			return response
		} catch (error) {
			throw error
		}
	}
	

	static async getDeviceInfo() {
		try {
			const device = GlobalState.getCurrentDeviceFull()
			if (!device) {
				throw new Error('device not found')
			}
			
			const formattedHost = DeviceManager.formatHostForUrl(device.ip)
			const protocol = device.useHttps ? 'https' : 'http'
			const url = `${protocol}://${formattedHost}:${device.port}/cgi-bin/luci/admin/system/admin`
			const response = await DeviceManager.requestWithAuth(device, url)
			
			return response
		} catch (error) {
			throw error
		}
	}
	

	static async customRequest(path, options = {}) {
		try {
			const device = GlobalState.getCurrentDeviceFull()
			if (!device) {
				throw new Error('device not found')
			}
			
			const formattedHost = DeviceManager.formatHostForUrl(device.ip)
			const protocol = device.useHttps ? 'https' : 'http'
			const url = `${protocol}://${formattedHost}:${device.port}${path}`
			const response = await DeviceManager.requestWithAuth(device, url, options)
			
			return response
		} catch (error) {
			throw error
		}
	}
	

	static async checkConnection() {
		try {
			const device = GlobalState.getCurrentDeviceFull()
			if (!device) {
				return { success: false, message: 'device not found' }
			}
			
			const result = await DeviceManager.checkAndLoginDevice(device)
			return result
		} catch (error) {
			return { success: false, message: error.message }
		}
	}
	

	static getCurrentDeviceInfo() {
		return {
			ip: GlobalState.getCurrentIp(),
			username: GlobalState.getCurrentUsername(),
			name: GlobalState.getCurrentDeviceName(),
			port: GlobalState.getCurrentPort(),
			hasDevice: GlobalState.hasCurrentDevice()
		}
	}
}

export default DeviceApi