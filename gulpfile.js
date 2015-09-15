'use strict';

var _          = require('lodash');
var gulp       = require('gulp');
var browserify = require('browserify');
var sass       = require('gulp-sass');
var coffeeify  = require('coffeeify');
var jade       = require('gulp-jade');
var notify     = require('gulp-notify');
// var jasmine    = require('gulp-jasmine');
var jasmineBr  = require('gulp-jasmine-browser');
var source     = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var watch      = require('gulp-watch');
var buffer     = require('vinyl-buffer');
var del        = require('del');


var options = {};

options['coffee'] = {
  src: './src/**/*.coffee',
  dst: './build',
  options: {
    debug: true,
    basedir: __dirname + '/src/scripts',
    paths: [__dirname + '/node_modules', __dirname + '/src/scripts'],
    dest: './build',
    extensions: ['.coffee']
  }
};

options['copy'] = {
  src: './src/**/!(*.coffee|*.scss|*.jade)',
  dst: './build'
}

options['sass'] = {
  src: './src/**/*.scss',
  dst: './build'
};

options['jade'] = {
  src: './src/**/*.jade',
  dst: './build',
  options: {
    pretty: false
  }
};

options['jasmine'] = {
  src: './test/test-bundle.js',
  options: {
    verbose: true,
    includeStackTrace: false
  }
};

options['build-tests'] = {
  src: './test/**/*.coffee',
  options: {
    debug: true,
    basedir: __dirname + '/test',
    paths: [
      __dirname + '/node_modules',
      __dirname + '/src/scripts',
      __dirname + '/test'
    ],
    extensions: ['.coffee'],
    entries: './test-bundle.coffee',
    outputName: 'test-bundle.js',
    transform: [coffeeify]
  }
};


gulp.task('default', ['build', 'watch']);
gulp.task('build', ['copy', 'coffee', 'jade', 'sass']);
// gulp.task('test', ['build', 'jasmine']);
gulp.task('watch-test', ['build', 'watch-scripts']);

gulp.task('coffee', function () {
  var bundle = browserify(_.extend(options.coffee.options, {
    entries: './KeyTree.coffee',
    outputName: 'app.js',
    transform: [coffeeify]
  })).bundle();

  bundle
    .on('error', notify.onError({
      title: "CoffeeScript error",
      message: '<%= error.message %>',
      sound: "Frog", // case sensitive
      icon: false
    }))
    .on('error', function (error) {
      console.log(error);
    });

  return bundle
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./build'));
});

gulp.task('copy', function () {
  return gulp.src(options.copy.src)
    .pipe(gulp.dest(options.copy.dst));
});

gulp.task('sass', function () {
  return gulp.src(options.sass.src)
    .pipe(sass())
      .on('error', notify.onError({
        title: "Sass error",
        message: '<%= error.message %>',
        sound: "Frog", // case sensitive
        icon: false
      }))
    .pipe(gulp.dest(options.sass.dst));
});

gulp.task('jade', ['sass'], function () {
  return gulp.src(options.jade.src)
    .pipe(jade(options.jade.options))
      .on('error', notify.onError({
          title: "Jade error",
          message: '<%= error.message %>',
          sound: "Frog", // case sensitive
          icon: false
        }))
    .pipe(gulp.dest(options.jade.dst))
});

gulp.task('build-tests', ['build'], function () {
  var bundle = browserify(options['build-tests'].options).bundle();

  bundle.on('error', onError);

  return bundle
    .pipe(source('test-bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./test'));
});

gulp.task('jasmine', function () {
  return gulp.src(options.jasmine.src)
    .pipe(watch(options.jasmine.src))
    .pipe(jasmineBr.specRunner(options.jasmine.options))
    .pipe(jasmineBr.server({port:8888}));
});

gulp.task('watch-scripts', function () {
  gulp.watch(options.copy.src, ['copy']);
  gulp.watch(options.coffee.src, ['coffee', 'build-tests']);
  gulp.watch(options['build-tests'].src, ['build-tests']);
});

gulp.task('watch', function () {
  gulp.watch(options.copy.src, ['copy']);
  gulp.watch(options.coffee.src, ['coffee']);
  gulp.watch(options.sass.src, ['sass', 'jade']);
  gulp.watch(options.jade.src, ['jade']);
});

gulp.task('clean', function () {
  del([
    'build/**'
  ]);
});

function onError (err) {
  console.log(err);
  notify.onError({
    message: 'Error: <%= error.message %>',
    sound: false // deactivate sound?
  })
  this.emit('end');
}