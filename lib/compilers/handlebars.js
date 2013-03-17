var Handlebars = require('handlebars');

exports = module.exports = {
	name:'handlebars'
,	extensions:['handlebars']
,	process:function(file,options,callback){
		var fn = Handlebars.compile(file.content,options.handlebars || null);
		file.content = fn(options.locals);
		callback(null,file);
	}
}