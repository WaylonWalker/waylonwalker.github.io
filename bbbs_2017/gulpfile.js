var gulp = require('gulp')
    watch = require('gulp-watch')
    pug = require('gulp-pug')
    sass = require('gulp-sass')
    browserSync = require('browser-sync').create()
    pug_files = 'templates/**/*.pug'
    sass_files = ['static/sass/**/*.sass', 'static/sass/**/*.scss', 'css/*.sass', 'css/*.scss']
    css_dest = 'css'
    reload = browserSync.reload
    plumberNotifier = require('gulp-plumber-notifier');
    autoprefixer = require('gulp-autoprefixer')

gulp.task('pug', function(){
    return gulp
    .src(pug_files)
    .pipe(plumberNotifier())
    .pipe(pug({pretty:true,}))
    .pipe(gulp.dest(''))
})

gulp.task('sass', function(){
    return gulp
    .src(sass_files)
    .pipe(plumberNotifier())
    .pipe(sass({debug: true, outputStyle: 'compressed'}))
    .pipe(autoprefixer())
    .pipe(gulp.dest(css_dest))
    .pipe(browserSync.stream())
})

gulp.task('sass-watch', ['sass'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('pug-watch', ['pug'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('browserSync', function(){
    browserSync.init(
        [pug_files, sass_files],
        {
            server: {baseDir: "./"}
        }
        )
})

gulp.task('watch', ['pug', 'sass', 'browserSync'], function(){
    gulp.watch(pug_files, ['pug-watch'])
    gulp.watch(sass_files, ['sass-watch', 'pug-watch']);
    gulp.watch([sass_files, pug_files, css_dest, ''], reload)
})

gulp.task('default', ['watch'])
