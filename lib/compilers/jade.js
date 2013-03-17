var jade = require('jade');

exports = module.exports = {
	name:'jade'
,	extensions:['jade']
,	process:function(file,options,callback){
		var fn = jade.compile(file.content,options.jade || null);
		file.content = fn(options.locals);
		callback(null,file);
	}
}