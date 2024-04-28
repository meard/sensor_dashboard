let browserify = require('browserify'),
  gulp = require('gulp'),
  source = require('vinyl-source-stream'),
  buffer = require('vinyl-buffer'),
  del = require('del'),
  uglify = require('gulp-uglify'),
  babel = require('gulp-babel'),
  rename = require('gulp-rename'),
  connect = require('gulp-connect'),
  livereload   = require('gulp-livereload'),
  open = require('gulp-open'),
  sass = require('gulp-sass');

//=============
//  CLEAN
//=============

// Clean all dist/ folders in all experiments
gulp.task('clean', () => {
  del('./dist', {
    force: true
  });
});


//=============
//  BUILD
//=============

// Build JS
gulp.task('build:js', () => {
  let b = browserify({
    entries: './js/entry.js',
    debug: true
  });
  
  return (b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    // .pipe(uglify())
    .pipe(rename('scripts.min.js'))
    .pipe(gulp.dest('./dist'))
    .pipe(connect.reload()));
});

// Build CSS
gulp.task('build:css', () => {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(rename('styles.min.css'))
    .pipe(gulp.dest('./dist'));
});

// Build all
gulp.task('build', ['clean', 'build:js', 'build:css']);


//=============
//  WATCH
//=============

gulp.task('watch', () => {
  gulp.watch('./sass/**/*.scss', ['build:css']);
  gulp.watch('./js/**/*.js', ['build:js']);
});


//=============
//  SERVE
//=============

gulp.task('serve', () => {
  connect.server({
    root: './',
    port: '5050',
    open: true,
    livereload: true
  });
});

gulp.task('open', () => {
  return gulp.src('./index.html')
    .pipe(open({
      uri: 'http://localhost:5050'
    }));
});


//=============
//  DEFAULT
//=============

gulp.task('default', ['build', 'serve', 'open', 'watch']);