export const siteFakerData = [
	{
		stationName: '成都东客站监测点',
		lon: 104.137,
		lat: 30.638,
		address: '四川省成都市成华区青衣江路',
		status: 1,
	},
	{
		stationName: '武侯祠空气监测站',
		lon: 104.058,
		lat: 30.634,
		address: '四川省成都市武侯区武侯祠大街',
		status: 1,
	},
	{
		stationName: '都江堰水源监测站',
		lon: 103.616,
		lat: 30.985,
		address: '四川省成都市都江堰市灌口镇',
		status: 1,
	},
	{
		stationName: '崇州工业园环境监测',
		lon: 103.66,
		lat: 30.64,
		address: '四川省成都市崇州市经济开发区',
		status: 1,
	},
	{
		stationName: '双流机场噪音监测',
		lon: 103.953,
		lat: 30.575,
		address: '四川省成都市双流区机场路',
		status: 1,
	},
	{
		stationName: '青白江区环境监测站',
		lon: 104.25,
		lat: 30.85,
		address: '四川省成都市青白江区凤翔大道',
		status: 1,
	},
	{
		stationName: '温江区农田监测站',
		lon: 103.82,
		lat: 30.7,
		address: '四川省成都市温江区芙蓉大道',
		status: 1,
	},
	{
		stationName: '郫都区高新西区监测点',
		lon: 103.88,
		lat: 30.76,
		address: '四川省成都市郫都区西区大道',
		status: 1,
	},
	{
		stationName: '龙泉驿区东安湖监测',
		lon: 104.27,
		lat: 30.56,
		address: '四川省成都市龙泉驿区成洛大道',
		status: 1,
	},
	{
		stationName: '新都区大学城监测站',
		lon: 104.14,
		lat: 30.79,
		address: '四川省成都市新都区新都大道',
		status: 1,
	},
];

export const siteTypeFakerData = [
	{
		name: 'stationName',
		type: 'input',
		placeholder: '站点名称',
		label: '站点名称',
	},
	{
		name: 'lon',
		type: 'input',
		placeholder: '经度',
		label: '经度',
	},
	{
		name: 'lat',
		type: 'input',
		placeholder: '纬度',
		label: '纬度',
	},
	{
		name: 'address',
		type: 'textarea',
		placeholder: '站点地址',
		label: '站点地址',
	},
	{
		name: 'status',
		type: 'select',
		placeholder: '状态',
		label: '状态',
	},
];

export const deviceFakerData = [
	{
		mn: `MN${Date.now() + 1}`, // 使用当前时间戳，并加1以示区别
		deviceName: 'VOCs在线监测系统',
		password: '123456',
		deviceCategory: 'OTHER',
		overdueTime: '2026-03-11',
		stationId: '2031189145417900033',
	},
	{
		mn: `MN${Date.now() + 2}`,
		deviceName: '智慧农业环境传感器',
		password: '123456',
		deviceCategory: 'OTHER',
		overdueTime: '2026-03-11',
		stationId: '2031189145417900033',
	},
	{
		mn: `MN${Date.now() + 3}`,
		deviceName: '工业废水排放监测仪',
		password: '123456',
		deviceCategory: 'OTHER',
		overdueTime: '2026-03-11',
		stationId: '2031189145417900033',
	},
	{
		mn: `MN${Date.now() + 4}`,
		deviceName: '智能垃圾分类回收设备',
		password: '123456',
		deviceCategory: 'OTHER',
		overdueTime: '2026-03-11',
		stationId: '2031189145417900033',
	},
	{
		mn: `MN${Date.now() + 5}`,
		deviceName: '城市内涝监测预警系统',
		password: '123456',
		deviceCategory: 'OTHER',
		overdueTime: '2026-03-11',
		stationId: '2031189145417900033',
	},
];

export const deviceTypeFakerData = [
	{
		name: 'mn',
		type: 'input',
		placeholder: 'MN编码',
		label: 'MN编码',
	},
	{
		name: 'deviceName',
		type: 'input',
		placeholder: '设备名称',
		label: '设备名称',
	},
	{
		name: 'password',
		type: 'input',
		placeholder: '设备密码',
		label: '设备密码',
	},
	{
		name: 'deviceCategory',
		type: 'select',
		placeholder: '设备分类',
		label: '设备分类',
	},
	{
		name: 'overdueTime',
		type: 'date',
		placeholder: '过期时间',
		label: '过期时间',
	},
	{
		name: 'stationId',
		type: 'select',
		placeholder: '所属站点',
		label: '所属站点',
	},
];
