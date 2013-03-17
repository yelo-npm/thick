var stylus = require('stylus');


exports = module.exports = {
	name:'stylus'
,	extensions:['styl']
,	process:function(file,opts,callback,globals){
		var n
		,	stylusOptions = globals._.merge({
					filename: file.filePath
				}
				,opts.options.stylus
			)
		,	s = stylus(file.content);

		for(n in stylusOptions){
			s.set(n,stylusOptions[n]);
		}
		for(n in opts.locals){
			s.define(n,opts.locals[n]);
		}
		s.render(function(err,css){
			if(err){return callback(err,file);}
			file.content = css;
			callback(null,file);
		})
	}
}