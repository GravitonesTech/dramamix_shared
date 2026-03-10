const constants = {
	LOGIN_TYPE:['guest', 'facebook', 'google', 'apple'],
	SOCIAL_TYPE:['facebook', 'google', 'apple'],
	TICKET_STATUS:['Pending','In Progress','Completed','Invalid'],
	REWARD_TYPE:[
		'link_whatsapp', 
		'follow_us_on_facebook',
		'follow_us_on_youtube', 
		'follow_us_on_instagram', 
		'turn_on_notification', 
	],
	REWARD_TYPE_MESSAGE:{
		'link_whatsapp' : 'Link Whatsapp', 
		'follow_us_on_facebook' : 'Follow us on facebook',
		'follow_us_on_youtube' : 'Follow us on youtube', 
		'follow_us_on_instagram' : 'Follow us on instagram', 
		'turn_on_notification' : 'turn on notification'
	},
	ENVATO_TOKEN:"zfiFjgoRZnR0Lon4Ddzyly8Lqdoc3nOz",
	ENVATO_API:'https://api.envato.com/v3/market/buyer/purchase',
	TYPE: ['user', 'admin']
};

module.exports = constants;
