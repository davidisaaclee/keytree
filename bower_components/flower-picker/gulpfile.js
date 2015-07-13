'use strict';

var gulp       = require('gulp');
var sass       = require('gulp-sass');
var coffeeify  = require('gulp-coffeeify');
var jade       = require('gulp-jade');


var options = {};

options['coffee'] = {
  src: './src/**/*.coffee',
  dst: './build',
  options: {
    options: {
      debug: true,
      paths: [__dirname + '/node_modules', __dirname + '/src/scripts']
    }
  }
};

options['sass'] = {
  src: './src/**/*.scss',
  dst: './build'
};

options['jade'] = {
  src: './src/**/*.jade',
  dst: './build/',
  options: {
    pretty: true
  }
};

options['jasmine'] = {
  src: './build/spec/**.js',
  options: {
    verbose: true
  }
};


gulp.task('default', ['scripts', 'jade', 'sass', 'watch']);

gulp.task('scripts', function () {
  return gulp.src(options.coffee.src)
    .pipe(coffeeify(options.coffee.options))
    .pipe(gulp.dest(options.coffee.dst));
});

gulp.task('sass', function () {
  return gulp.src(options.sass.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(options.sass.dst));
});

gulp.task('jade', function () {
  return gulp.src(options.jade.src)
    .pipe(jade(options.jade.options))
    .pipe(gulp.dest(options.jade.dst))
});

gulp.task('watch', function () {
  gulp.watch(options.coffee.src, ['scripts']);
  gulp.watch(options.sass.src, ['sass']);
  gulp.watch(options.jade.src, ['jade']);
});