
var gulp = require('gulp');
var changed = require('gulp-changed');
var sass = require('gulp-sass');
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
let uglify = require('gulp-uglify-es').default;
let modernizr = require('gulp-modernizr');
var pkg = require('./package.json');

// Set the banner content
var banner = ['/*!\n',
  ' * <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2018 - SkiCycleRun' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> repository <%= pkg.repository.url %>\n',
  ' */\n',
  ''
].join('');

// Minify compiled CSS
gulp.task('sass', function(done) {
  return gulp.src('./scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    //.pipe(changed('../css'))
    //.pipe(changed('./scss/*.scss'))
    .pipe(gulp.dest('../css'));

  done();

});

// moderizr
gulp.task('modernizr', function() {
  return gulp.src('./js/*.js')
    .pipe(modernizr())
    .pipe(gulp.dest('./js'))
});

// Minify custom JS
gulp.task('minify-js', function(done) {
  //return gulp.src(['js/skicyclerun.js', 'js/alpha.js', 'js/alphamap.js', 'js/skicyclerunmap.js'])
  return gulp.src('./js/*.js')
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    //.pipe(changed('../js'))
    .pipe(gulp.dest('../js'))

  done();

});

// Copy vendor files from /node_modules into /vendor
// NOTE: requires `npm install` before running!
gulp.task('copy', function(done) {

  gulp.src(['node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.js'])
    .pipe(changed('../vendor/jquery'))
    .pipe(gulp.dest('../vendor/jquery'))

  gulp.src(['node_modules/jquery.easing/*.js'])
    .pipe(changed('../vendor/jquery-easing'))
    .pipe(gulp.dest('../vendor/jquery-easing'))

  gulp.src(['node_modules/normalize.css/*.css'])
    .pipe(changed('../vendor/normalize.css'))
    .pipe(gulp.dest('../vendor/normalize.css'))

  // masonry-layout for photo GRID CSS
  gulp.src(['node_modules/masonry-layout/dist/masonry.pkgd.min.js'])
    .pipe(changed('../vendor/masonry'))
    .pipe(gulp.dest('../vendor/masonry'))

  done();

})

// Default Task
gulp.task('default', gulp.series(['sass', 'modernizr', 'minify-js', 'copy'], function(done) {
  // do more stuff
  done();
}));
