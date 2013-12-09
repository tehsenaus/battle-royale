module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    shell: {
        bowerInstaller: {
            options: {
                stdout: true
            },
            command: require('path').join(__dirname, 'node_modules', '.bin', 'bower-installer')
        }
    },

    latte: {
      common: {
        inputDir: 'src/common',
        outputDir: 'lib/common'
      },
      server: {
        inputDir: 'src/server',
        outputDir: 'lib/server'
      },
      client: {
        inputDir: 'src/client',
        outputDir: 'lib/client'
      }
    },

    browserify: {
      client: {
        files: {
          'static/app.js': ['lib/client/app.js'],
        }
      }
    },

    mustache_render: {
      html: {
        options: {
          directory: 'src/web',
          extension: '.html'
        },
        files: [
          {
            data: 'package.json',
            template: 'src/web/index.html',
            dest: 'static/index.html'
          }
        ]
      }
    },

    less: {
      styles: {
        options: {
          paths: ["src/web"]
        },
        files: {
          "static/styles.css": "src/web/styles.less"
        }
      }
    },

    watch: {
      common: {
        files: ['src/common/**/*.latte'],
        tasks: ['latte:common']
      },
      server: {
        files: ['src/server/**/*.latte'],
        tasks: ['latte:server']
      },
      client: {
        files: ['src/client/**/*.latte', 'src/common/**/*.latte'],
        tasks: ['latte:client', 'browserify:client']
      },
      html: {
        files: ['src/web/**/*.html'],
        tasks: ['mustache_render:html']
      },
      less: {
        files: ['src/web/**/*.less'],
        tasks: ['less']
      }
    },

    nodemon: {
      dev: {
        options: {
          env: {
            
          }
        }
      }
    },

    concurrent: {
      dev: {
        tasks: ['nodemon:dev', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });

  grunt.loadNpmTasks('latte');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-mustache-render');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-less');
  

  grunt.registerTask('build', ['shell:bowerInstaller', 'latte', 'browserify', 'mustache_render:html', 'less']);

  grunt.registerTask('test', []);

  grunt.registerTask('run', ['build', 'concurrent:dev']);

  // Default task(s).
  grunt.registerTask('default', ['build', 'test']);
};
