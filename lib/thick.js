var version = require('../package').version
,	_ = require('lodash')
,	Minimatch = require('minimatch').Minimatch
,	http = require('http')
,	watch = require('node-watch')
,	walk = require('walk')
,	mkdirp = require('mkdirp')
,	fs = require('fs')
,	path = require('path')
,	defaults = require('./config')
,	opts = {
		handlers:[]
	,	rules:[]
	,	conversions:[]
	,	directories:{}
	,	options:{
			level:0
		}
	,	locals:{}
	}
,	l = function(){
		var args = Array.prototype.slice.call(arguments);
		var level = (typeof args[0] == 'number') ? args.shift() : null;
		if(level == null || level >= opts.options.level){
			console.log.apply(console,args);
		}
	}
,	globals = {
		_:_
	,	l:l
	}
;

var FakeMinimMatch = function(expression,modifiers){
	this._reg = new RegExp(expression,modifiers);
}
FakeMinimMatch.prototype = {
	makeRe:function(){return this._reg;}
,	match:function(str){return str.match(this._reg) == null ? false : true;}
}

var makeHandler = function(pattern,handlers){
	var ret = {pattern:null, handlers:handlers}
	if(pattern[0] = '/' && pattern[pattern.length-1] == '/'){
		pattern = pattern.split('/');
		ret.pattern = new  FakeMinimMatch(pattern[1],pattern[2]||'i');
	}else{
		ret.pattern = new Minimatch(pattern,{nocase:true});
	}
	return ret;
}

var processOptions = function(options){
	var n,i,obj,rule;
	options = _.merge({},defaults,options||{});
	
	for(n in options.handlers){
		opts.handlers.push(makeHandler(n,options.handlers[n]));
	}
	for(n in options.conversions){
		opts.conversions.push(makeHandler(n,options.conversions[n]));
	}
	for(n in options.rules){
		rule = makeHandler(n,options.rules[n]);
		for(i=0;i<rule.handlers.length;i++){
			if(typeof rule.handlers[i] == 'string'){
				rule.handlers[i] = require('./compilers/'+rule.handlers[i]);
			}
		}
		opts.rules.push(rule);
	}
	for(n in options.directories){
		opts.directories[n] = path.relative('./',path.resolve(options.directories[n]))+ '/';
	}
	_.merge(opts.locals,options.locals);
	_.merge(opts.options,options.options);
}


var getMimeType = function(extname){
	switch (extname.toLowerCase()){
		case 'js': return 'application/javascript';
		case 'css': return 'text/css';
		case 'html':
		case 'htm': return 'text/html';
		case 'jpg':
		case 'jpeg': return 'image/jpg';
		case 'png':return 'image/png';
		case 'tif':
		case 'tiff':return 'image/tiff';
		case 'svg':return 'text/svg';
		case 'ico':return 'image/ico';
		case 'gif':return 'image/gif';
		default: break;
	}
	return 'text/plain';
}

function httpError(num,error,response,file){
	response.writeHead(num);
	var str = 'ERROR while processing: '+file.originalPath+' -> '+file.path+'\n\nmessage: ';
	if(error && error.message){
		str+=error.message
	}else{
		str+=error;
	}
	if(file){
		str+='\n\ndump:\n'+JSON.stringify(file);	
	}
	response.end(str,'utf-8');
}

function fileError(error,response,file){
	httpError(500,error,response,file);
}

function fileNotFound(error,response,file){
	httpError(404,file.path+': file not found',response,file);
}

var files = {};

function fileProcess(filePath,callback){
	
	function process(file,callback){
		var rules = file.rules.slice();
		l(50,file.path,'->',file.originalPath);
		if(!rules || !rules.length){
			l(50,file.path,': has no processors, serving raw');
			return callback(null,file);
		}
		(function next(file){
			var rule = rules.shift();
			if(!rule){
				file.isProcessed = true;
				l(50,file.path,': processed');
				if(!opts.options.write){return callback ? callback(null,file) : null;}

				mkdirp(opts.directories.out+file.dir,function(err){
					if(err){throw err;}
					return fs.writeFile(opts.directories.out+file.originalPath,file.content,function(err){
						if(err){throw err;}
						l(50,file.path,': wrote file to',opts.directories.out+file.originalPath)
						return callback ? callback(null,file) : null;
					})
				});
				return;
				
			}
			rule.process(file,opts,function(error,file){
				if(error){return callback(error,file);}
				next(file);
			},globals)
		})(file);
	}

	if(files[filePath]){
		if(files[filePath].isProcessed){
			l(50,files[filePath].path,': serving cached file');
			return callback(null,files[filePath]);
		}
		l(50,files[filePath].path,': needs recompilation');
		return process(files[filePath],callback);
	}

	return fileGet(filePath,function(error,file){
		l(50,filePath,': loading from disk');
		if(error){return callback(error,file);}
		files[filePath] = file;
		watch(file.path, function(filename) {
			fs.readFile(file.path, 'utf-8', function(error,content){
				file.isProcessed = false;
				file.raw = file.content = content;
				l(50,filename,': changed');
			});
		});
		return process(file,callback);
	});
	
}

function fileGet(filePath,callback){
	var i, j
	,	h = opts.handlers
	,	possibilities = []
	,	ext = (path.extname(filePath) || '.').split('.').pop()
	,	contentType = getMimeType(ext)
	,	dir = path.dirname(filePath)
	,	name = filePath.slice(0,filePath.length - ext.length -1)
	;
	for(i=0;i<h.length;i++){
		if(h[i].pattern.match(filePath)){
			for(j=0;j<h[i].handlers.length;j++){
				possibilities.push(opts.directories.root+name+'.'+h[i].handlers[j]);
			}
		}
	}
	possibilities.push(opts.directories.root+filePath);
	(function next(){
		var poss = possibilities.shift();
		if(!poss || (typeof poss == 'undefined')){
			return callback(404,{
					content: null
				,	raw: null
				,	type: contentType
				,	path:filePath
				,	dir:dir
				,	originalPath:filePath
				,	extension: ext
				,	name:name
				,	rules:[]
				,	isProcessed:false
			});
		}
		fs.exists(poss, function(exists){
			if(!exists){return next();}
			fs.readFile(poss, 'utf-8', function(error,content){
				if(error){return callback(error);}
				var i, r = opts.rules, rules = false;
				for(i = 0; i < r.length; i++){
					if(r[i].pattern.match(poss)){
						rules = r[i].handlers; break;
					}
				}
				callback(null,{
					content: content
				,	raw: content
				,	type: contentType
				,	dir:dir
				,	path:poss
				,	originalPath:filePath
				,	extension: ext
				,	name:name
				,	rules:rules
				,	isProcessed:false
				})
			});
		});
	})();

}

var tree = function(filename){
	var stats = fs.lstatSync(filename)
	,	info = {path:filename,name:path.basename(filename)}
	;
	if(stats.isDirectory()){
		info.type = 'dir';
		info.children = fs.readdirSync(filename).map(function(child){return tree(filename + '/' + child);});
	}
	else{
		info.type = "file";
	}

	return info;
}

var serve = function(o){
	if(o){processOptions(o);}

	http.createServer(function (request, response) {

		if(request.url == '/favicon.ico'){
			response.writeHead(404);
			response.end();
			return;
		}
		l(50,'request for',request.url);

		fileProcess(request.url.slice(1) || 'index.html',function(err,file){
		if(err){
				l(50,file.path ,'error',err);
				if(err==404){return fileNotFound(404,response,file);}
				return fileError(err,response,file);
			}
			l(1000,file.originalPath,': serving file')
			response.writeHead(200, { 'Content-Type': file.type });
			response.end(file.content,'utf-8');
		});
	}).listen(opts.options.port);
	 
	l(50,'Server running at http://127.0.0.1:'+opts.options.port+'/');
}

var compile = function(o){
	if(o){processOptions(o);}
}

var run = function(o){
	processOptions(o);
	if(opts.options.build){
		opts.options.write = true;
		var root = opts.directories.root.replace(/\/$/,'')
		,	t = tree(root)
		,	n
		;
		root = new RegExp('^'+root);
		(function processTree(node){
			var location = node.path.replace(root,'').replace(/^\//,'')
			,	destination = opts.directories.out + location
			,	ext = location.split('.').pop()
			,	name = path.basename(location.slice(0, location.length + (ext ? - ext.length -1 : 0)))
			,	dir = path.dirname(location)
			;
			if(location == 'node_modules' || location[0] == '.'){return;}
			children = function(err){
				if(err){throw err;}
				if(node.children){
					for(var n in node.children){
						processTree(node.children[n]);
					}
				}
			}
			if(node.type == 'dir'){
				return mkdirp(destination,children);
			}
			for(n in opts.conversions){
				if(opts.conversions[n].pattern.match(location)){
					location = (dir + '/' + name).replace(/^\.\//,'');
					location+='.'+opts.conversions[n].handlers;
					break;
				}
			}
			return fileProcess(location,children);
		})(t);
	}
	serve();
}


exports.serve = serve;
exports.compile = compile;
exports.version = version;
exports.run = run;