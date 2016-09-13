const gulp   = require('gulp');
const source = require('vinyl-source-stream');
const browserify = require('browserify');

gulp.task('build', function() {
    browserify('src/kintai.js'
    ).transform("babelify", {presets: ["es2015"]}
    ).bundle(
    ).pipe(
        source('kintai.js')
    ).pipe(gulp.dest('lib'));
});

gulp.task('watch', function() {
    gulp.watch('src/*.js', ['build']);
});

gulp.task('default', ['build']);
