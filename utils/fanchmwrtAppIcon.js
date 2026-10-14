import DeviceManager from './deviceManager.js'

const DEFAULT_APP_ICON_PATH = '/luci-static/resources/app_icons'
const OAF_APP_ICON_PATH = '/luci-static/resources/oaf/app_icons'

function isFanchmwrtDevice(device) {
	return !!device && (
		device.isFanchmwrt === true ||
		device.isFanchmwrt === 1 ||
		device.isFanchmwrt === '1' ||
		device.isFanchmwrt === 'true'
	)
}

export function getFanchmwrtAppIconPath(device) {
	const useOafIcons = isFanchmwrtDevice(device) && Number(device.oaf) === 1
	return useOafIcons ? OAF_APP_ICON_PATH : DEFAULT_APP_ICON_PATH
}

export function getFanchmwrtAppIconUrl(device, appId) {
	if (!device || appId === undefined || appId === null || appId === '') return ''
	const protocol = device.useHttps ? 'https' : 'http'
	const host = DeviceManager.formatHostForUrl(device.ip)
	const iconPath = getFanchmwrtAppIconPath(device)
	return `${protocol}://${host}:${device.port}${iconPath}/${appId}.png`
}
