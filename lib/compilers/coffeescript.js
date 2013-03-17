var cs = require('coffee-script').compile;


exports = module.exports = {
	name:'coffeescript'
,	extensions:['coffee']
,	process:function(file,options,callback){
		file.content = cs(file.content,options.coffee || {});
		callback(null,file);
	}
}