var less = require('less');

exports = module.exports = {
	name:'less'
,	extensions:['less']
,	process:function(file,opts,callback,globals){
		var o = {}
		,	lessOpts = {
		//,	paths: paths,
			filename: file.path
		,	optimization: opts.options.debug
		,	dumpLineNumbers: opts.options.debug
		};
		globals._.merge(lessOpts,opts.options.less);
		(new less.Parser(lessOpts)).parse(file.content,function(error,tree){
			if(error){return callback(error,file);}
			
			for(var n in opts.locals){
				o[n] = new (less.tree.Keyword)([opts.locals[n]]);
			}
			try{
				file.content = tree.toCSS(lessOpts,o);
				callback(null,file);
			}catch(e){
				callback(e,file);
			}
		});
	}
}