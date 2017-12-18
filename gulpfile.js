var gulp = require('gulp')
    watch = require('gulp-watch')
    pug = require('gulp-pug')
    browserify = require('gulp-browserify')
    sass = require('gulp-sass')
    autoprefixer = require('gulp-autoprefixer')
    sourcemaps = require('gulp-sourcemaps')
    browserSync = require('browser-sync').create()
    py_files = '**/*.py'
    pug_files = ['templates/**/*.pug', 'templates/**/*.md']
    js_files = 'static/js/dev/**/*.js'
    sass_files = ['static/sass/**/*.sass', 'static/sass/**/*.scss']
    gratitude_files = ['gratitude/*.sass', 'gratitude/*.pug', 'gratitude/*.md', ]
    goals_files = ['goals/*.sass', 'goals/*.pug', 'goals/*.md', ]
    js_dest = 'static/js/dist'
    css_dest = 'static/css'
    reload = browserSync.reload
    exec = require('child_process').exec

gulp.task('pug', function(){
    return gulp.src(pug_files)
    .pipe(pug())
    .pipe(gulp.dest(''))
})

gulp.task('js', function(){
    return gulp.src(js_files)
    .pipe(browserify({debug: true}))
    .pipe(gulp.dest(js_dest))
})

gulp.task('js-watch', ['js'], function (done) {
    browserSync.reload();
    done();
});


gulp.task('sass', function(){
    return gulp
    .src(sass_files)
    .pipe(sourcemaps.init())
    .pipe(sass({debug: true, outputStyle: 'compressed'}))
    .pipe(sourcemaps.write())
    .pipe(autoprefixer())
    .pipe(gulp.dest(css_dest))
    .pipe(browserSync.stream())
})

gulp.task('pug-watch', ['pug'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('sass-watch', ['sass'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('browserSync', function(){
    browserSync.init(
        [pug_files, sass_files, js_files],
        // {
        //     proxy: 'localhost:3002',
        // }
        {
            server: {baseDir: "./"}
        }
        )
})


gulp.task('runserver', function() {
    var proc = exec('python app.py --debug --port 3002');
    var proc = exec('hug -f api.py --debug --port 3003');
});


gulp.task('pytest', function(){
    var proc = exec('pytest')
})

gulp.task('gratitude', function(){
    var proc = exec('gratitude.bat')
})

gulp.task('goals', function(){
    var proc = exec('goals.bat')
})

gulp.task('watch', ['js-watch', 'js', 'sass', 'browserSync', 'gratitude', 'goals'], function(){
    gulp.watch(pug_files, ['pug-watch'])
    gulp.watch(sass_files, ['sass-watch']);
    gulp.watch(js_files, ['js-watch'])
    gulp.watch(gratitude_files, ['gratitude'])
    gulp.watch(goals_files, ['goals'])
    gulp.watch([js_files, pug_files, gratitude_files, goals_files], reload)
})

gulp.task('default', ['watch'])