### thick

A static file compiler for super-thick clients that do not care about server-side stuff

Currently compiles

	- jade
	- handlebars
	- less
	- stylus

Plans to support as much as possible from the node ecosystem

## Installation

``````
npm install -g thick
``````
or in your local directory (be sure to add node_modules/.bin to your $PATH)

``````
npm install thick
``````


## Usage

``````
$ mkdir project
$ cd project
$ mkdir site
$ echo 'div.test' > ./site/index.jade
$ thick

``````

 Server will be listening for changes and compiling on the fly (on port 8888 by default).  
 Navigate with your browser to http://localhost:8888/ and see the rendered index.html  

 You can build all your files by running

``````
$ thick -b
``````

 Other options below:

``````
  Usage: thick [options] [dir]

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -o, --out <dir>      output of the compiled files [./out]
    -d, --dev <boolean>  dev mode (debug & log) [true] 
    -c, --config <file>  specifies a config file to use [./thick.js]
    -p, --port <port>    specify test server port [8125]
    -w, --write          compile files to out directory [false]
    -b, --build          compiles all files to out dir before anything [false]
    -e, --exit           exits right after building (no server) [false]

use thick to serve jade,less, and other template files and compile them on the fly
you can pass more options by creating a local ./thick.js file
config options are overwritten by command-line options

  Examples:

    # create test server and begin watching local dir for changes
    $ thick ./
    (note that you do not have to specify the local directoy)

    # write files in ./out on change (directory must exist)
    $ thick -o ./out -c ./

    # compile all files in ./out and exit
    $ thick -o ./out -be

``````

## License

BSD