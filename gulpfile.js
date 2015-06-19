'use strict';

var gulp      = require('gulp');
var changed   = require('gulp-changed');
var source    = require('vinyl-source-stream');
var sass      = require('gulp-sass');
var coffeeify = require('gulp-coffeeify');
var jade      = require('gulp-jade');
var jasmine   = require('gulp-jasmine');


var options = {};

options['coffee'] = {
  src: './src/scripts/**/*.coffee',
  dst: './build/scripts',
  options: {
    options: {
      debug: true,
      paths: [__dirname + '/node_modules', __dirname + '/src/scripts']
    }
  }
};

options['coffeeSpec'] = {
  src: './src/spec/**/*.coffee',
  dst: './build/spec',
  options: {
    options: {
      debug: true,
      paths: [
        __dirname + '/node_modules',
        __dirname + '/src/scripts'
      ]
    }
  }
};

options['sass'] = {
  src: './src/*.scss',
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


gulp.task('default', ['scripts', 'jade', 'sass']);
gulp.task('compile-test', ['scripts', 'jasmine']);

gulp.task('scripts', function () {
  return gulp.src(options.coffee.src)
    .pipe(changed(options.coffee.dst))
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

gulp.task('build-tests', function () {
  return gulp.src(options.coffeeSpec.src)
    .pipe(changed(options.coffeeSpec.dst))
    .pipe(coffeeify(options.coffeeSpec.options))
    .pipe(gulp.dest(options.coffeeSpec.dst));
  });

gulp.task('jasmine', ['scripts', 'build-tests'], function () {
  return gulp.src(options.jasmine.src)
    .pipe(jasmine(options.jasmine.options));
});