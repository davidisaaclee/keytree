'use strict';

var _          = require('lodash');
var gulp       = require('gulp');
var browserify = require('browserify');
var sass       = require('gulp-sass');
var coffeeify  = require('coffeeify');
var jade       = require('gulp-jade');
var source     = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
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


gulp.task('default', ['build', 'watch']);

gulp.task('build', ['copy', 'coffee', 'jade', 'sass']);

gulp.task('coffee', function () {
  var bundle = browserify(_.extend(options.coffee.options, {
    entries: './app.coffee',
    outputName: 'app.js',
    transform: [coffeeify]
  })).bundle();

  bundle.on('error', function (err) {
    console.log(err);
    // bundle.end();
    this.emit('end');
  });

  var c = coffeeify();
  c.on('error', function (err) {
    console.log(err);
    c.end();
  });

  return bundle
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    // .pipe(coffeeify())
    .pipe(c)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./build'));
})

gulp.task('copy', function () {
  return gulp.src(options.copy.src)
    .pipe(gulp.dest(options.copy.dst));
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
  gulp.watch(options.copy.src, ['copy']);
  gulp.watch(options.coffee.src, ['coffee']);
  gulp.watch(options.sass.src, ['sass']);
  gulp.watch(options.jade.src, ['jade']);
});

gulp.task('clean', function () {
  del([
    'build/**'
  ]);
});

function onError (err) {
  console.log(err);
  this.emit('end');
}