exports = module.exports = {
	handlers:{
		'**/*.js':['coffee','coco','ls']
	,	'**/*.css':['less','sass','scss','styl']
	,	'**/*.{html,htm}':['jade','handlebars']
	,	'**/*.ico':['png']
	}
,	conversions:{
		'**/*.{jade,handlebars}':'html'
	,	'**/*.{less,styl,scss,sass}':'css'
	,	'**/*.{coffee,coco,ls}':'js'
	}
,	rules:{
		'**/*.styl':['stylus']
	//,	'**/*.{sass,scss}':['sass']
	//,	'**/*.coffee':['coffeescript']
	//,	'**/*.coco':['coco']
	//,	'**/*.ls':['livescript']
	//,	'**/*.md':['markdown']
	,	'**/*.jade':['jade']
	,	'**/*.less':['less']
	,	'**/*.handlebars':['handlebars']
	}
,	directories:{
		root:'./site'
	,	out:'./out'
	}
,	options:{
		port:8125
	,	logLevel:0
	,	dev:true
	,	write:false
	,	serve:true
	,	build:false
	,	exit:false
	}
,	locals:{
		title:'test'
	,	youAreUsingJade:true
	}
}