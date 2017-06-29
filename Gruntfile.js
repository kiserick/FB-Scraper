// Hook in Babel for transpiling ES6 on the fly
require("babel-core/register");

// Configure Grunt
module.exports = function(grunt) {

	// Load the plugins
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-line-remover');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-replace');

	// Project configuration.
	grunt.initConfig({

		// Provide properties (particular pkg.name and pkg.version)
		pkg : grunt.file.readJSON('package.json'),

		// JSHint to do code check
		jshint : {
			main : [ 'Gruntfile.js', 
			         'src/**/*.js', 
			         'src/**/*.es6',
			         // Ignored due to deconstructed constructor
			         // (Waiting on: https://github.com/jshint/jshint/issues/1941)
			         '!src/data/*',
			         '!src/facebook/data/*'
			         ],
			options : {
				// options here to override JSHint defaults
				asi : true,
				esnext : true,
				globals : {
					console : true,
					document : true,
					jQuery : true,
					module : true
				},
				unused : "vars"
			}
		},

		// Run the tests
		mochaTest : {
			test : {
				options : {
					reporter : 'spec',
					clearRequireCache : true
				},
				src : [ 'test/**/*.js', 'test/**/*.es6']
			},
			integrationFacebook : {
				options : {
					reporter : 'spec',
					clearRequireCache: true
				},
				src : [ 'test-integration/facebookDriverIntegrationTest.es6' ]
			},
			instagration : {
				options : {
					reporter : 'spec',
					clearRequireCache: true
				},
				src : [ 'test-integration/instagramDriverIntegrationTest.es6' ]
			},
			integrationSmagger : {
				options : {
					reporter : 'spec',
					clearRequireCache: true
				},
				src : [ 'test-integration/smaggerIntegrationTest.es6' ]
			},
			integrationOAuth : {
				options : {
					clearRequireCache: true,
					reporter: 'spec'
				},
				src: [ 'test-integration/oauthHttpIntegrationTest.es6' ]
			},
			integrationTwitter : {
				options : {
					reporter : 'spec',
					clearRequireCache: true
				},
				src : [ 'test-integration/twitterDriverIntegrationTest.es6' ]
			},
			integrateApollo : {
			  options : {
			    reporter : 'spec',
			    clearRequireCache: true
			  },
			  src : [ 'test-integration/apolloDriverIntegrationTest.es6' ]
			},
			scrapeFacebook : {
			  options: {
			    reporter : 'spec',
			    clearRequireCache: true
			  },
			  src : [ 'test-integration/facebookScrapeTest.es6' ]
			},
			individual : {
			  options: {
			    reporter : 'spec',
			    clearRequireCache: true
			  },
			  src : [ 'test/NetworkDriverTest.es6' ]
			}
		},

		// Generate the browserify version
		browserify: {
			ios : {
				src : [ 'src/*.es6', 'src/data/*es6', 'src/parsers/*.es6', 'src/env/ios.es6' ],
				dest : 'iosBundle.js'
			},
			options : {
				transform: [ 'babelify' ]
			}
		},
		
		// Copy the files over to smagger-ios
		copy : {
			ios : {
				src : 'iosBundle.js',
				dest : '../Apollo-ios/Apollo/iosBundle.js'
			}
		},
		
		// Make it possible to override http/https of OAuth module
		lineremover : {
			formData : {
				files : {
					'node_modules/form-data/lib/form_data.js' : 'node_modules/form-data/lib/form_data.js'
				},
				options : {
					exclusionPattern: /var https?\s*=\s*require\('https?\'\);/g
				}
			},
			oauth : {
				files : {
					'node_modules/oauth/lib/oauth.js' : 'node_modules/oauth/lib/oauth.js'
				},
				options : {
					exclusionPattern: /\s*https?\s*=\s*require\('https?\'\),/g
				}
			}
		},

		// Twerk that import!
		replace : {
			oauth : {
		    options: {
		      patterns : [{
		        match: /httpModel\s*=\s*http/,
		        replacement: "httpModel = global.http"
		      }, {
		        match: /httpModel\s*=\s*https/,
		        replacement: "httpModel = global.https"
		      }]
		    },
		    files : [{
		      src: ['node_modules/oauth/lib/oauth.js'],
		      dest: 'node_modules/oauth/lib/oauth.js'
		    }]
		  },
		  formData : {
		    options : {
		      patterns : [{
		        match: /request\s*=\s*https.request\(options\);/g,
		        replacement: "request = global.formData.request(options);"
		      }, {
		        match: /request\s*=\s*http.request\(options\);/g,
		        replacement: "request = global.formData.request(options);"
		      }]
		    },
		    files : [{
		      src: ['node_modules/form-data/lib/form_data.js'],
		      dest: 'node_modules/form-data/lib/form_data.js'
		    }]
		  },
		  formDataNotUsePreconfigureBrowserifyData : {
		    options : {
		      patterns : [{
		        match: /"browser": ".\/lib\/browser",/g,
		        replacement: ""
		      }]
		    },
		    files : [{
		      src: ['node_modules/form-data/package.json'],
		      dest: 'node_modules/form-data/package.json'
		    }]
		  },
		  email : {
		    options : {
		      patterns : [{
		        match: /require\('request'\)/g,
		        replacement: "require('./../../../src/email.es6').request"
		      }, {
		        match: /require\('xml2js'\)/g,
		        replacement: "require('./../../../src/email.es6').xml2js"
		      }]
		    },
		    files : [{
		      src: ['node_modules/node-ses/lib/ses.js'],
		      dest: 'node_modules/node-ses/lib/ses.js'
		    }]
		  }
		},

		// Provide watch on files
		// Note: must not spawn so below event is in same context.
		watch : {
			js : {
				options : {
					spawn : false,
				},
				files : [ '**/*.js', '**/*.es6' ],
				tasks : [ 'test' ]
			}
		}
	});

	/*
	 * On watch events, if the changed file is a test file then configure
	 * mochaTest to only run the tests from that file. Otherwise run all the
	 * tests
	 */
	var defaultTestSrc = grunt.config('mochaTest.test.src');
	grunt.event.on('watch', function(action, filepath) {
		grunt.config('mochaTest.test.src', defaultTestSrc);
		if (filepath.match('test/')) {
			grunt.config('mochaTest.test.src', filepath);
		}
	});

	// Grunt command line tasks
	grunt.registerTask('default', [ 'jshint', 'mochaTest:test', 'browserify:angular' ]);
	grunt.registerTask('test', [ 'jshint', 'mochaTest:test' ]);
    grunt.registerTask('test-individual', [ 'jshint', 'mochaTest:individual' ]);
	grunt.registerTask('integrate-facebook', [ 'mochaTest:integrationFacebook' ]);
	grunt.registerTask('integrate-instagram', [ 'mochaTest:instagration' ]);
	grunt.registerTask('integrate-oauth', [ 'mochaTest:integrationOAuth' ]);
	grunt.registerTask('integrate-smagger', [ 'mochaTest:integrationSmagger' ]);
	grunt.registerTask('integrate-twitter', [ 'mochaTest:integrationTwitter' ]);
	grunt.registerTask('integrate-apollo', [ 'mochaTest:integrateApollo' ]);
	grunt.registerTask('integrate', [ 'mochaTest:integrationFacebook', 'mochaTest:instagration', 'mochaTest:integrationOAuth', 'mochaTest:integrationSmagger', 'mochaTest:integrationTwitter', 'mochaTest:integrateApollo' ]);
	grunt.registerTask('scrape-facebook', [ 'mochaTest:scrapeFacebook' ])
	grunt.registerTask('ng', [ 'browserify:angular' ]);
	grunt.registerTask('ios', [ 'browserify:ios', 'copy' ]);
	grunt.registerTask('init', [ 'lineremover', 'replace' ]);

};
