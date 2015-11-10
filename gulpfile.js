var BatchStream = require('batch-stream2');
var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-minify-css');
var bower = require('gulp-main-bower-files');
var less = require('gulp-less');
var livereload = require('gulp-livereload');
var include = require('gulp-include');
var concat = require('gulp-concat');
var browserify = require('gulp-browserify');
var gulpFilter = require('gulp-filter');
var watch = require('gulp-watch');
var rename = require('gulp-rename');
var debug = require('gulp-debug');
var eslint = require('gulp-eslint');
var requirejsOptimize = require('gulp-requirejs-optimize');

var src = {
    less : ['assets/**/*.less'],
    css : ['assets/**/*.css'],
    es6 : ['assets/**/*.es6'],
    js : ['assets/**/*.js'],
    bower : ['bower.json', '.bowerrc']
}
src.styles = src.less.concat(src.css)
    src.scripts = src.es6.concat(src.js)

    var publishdir = 'public'
    var dist = {
    all : [publishdir + '/**/*'],
    css : publishdir + '/static/',
    js : publishdir + '/static/',
    vendor : publishdir + '/static/'
}

gulp.task('test-bower', function () {
    return gulp.src('./bower.json')
    .pipe(bower())
    .pipe()
    .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(debug({
            title : 'bower:'
        }))
    .pipe(gulp.dest('./dist'));
});

//
// concat *.js to `vendor.js`
// and *.css to `vendor.css`
// rename fonts to `fonts/*.*`
//
gulp.task('bower', function () {
    var jsFilter = gulpFilter('**/*.js', {
            restore : true
        });
    var cssFilter = gulpFilter('**/*.css', {
            restore : true
        });
    return gulp.src('./bower.json')
    .pipe(bower())
    .pipe(jsFilter)
    .pipe(concat('vendor.js'))
    .pipe(uglify())
    .pipe(gulp.dest(dist.js))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest(dist.css))
    .pipe(cssFilter.restore)
    .pipe(rename(function (path) {
            if (~path.dirname.indexOf('fonts')) {
                path.dirname = '/fonts'
            }
        }))
    .pipe(gulp.dest(dist.vendor))
})

function buildCSS() {
    return gulp.src(src.styles)
    .pipe(less({}))
    .pipe(concat('app.css'))
    .pipe(gulp.dest(dist.css))
}

function buildJS() {
    return gulp.src(src.scripts)
    .pipe(include())

    .pipe(eslint({ // eslint() attaches the lint output to the "eslint" property of the file obj so it can be used by other modules.
            ecmaFeatures : { // see http://eslint.org/docs/user-guide/configuring
                classes : true,
                modules : true,
                blockBindings : true,
                arrowFunctions : true,
                defaultParams : true
            }
        }))

    .pipe(eslint.format()) // eslint.format() outputs the lint results to the console.
    .pipe(eslint.failAfterError()) // To have the process exit with an error code (1) on error.

    .pipe(babel({
            presets : ['es2015'],   // to be installed: babel-preset-es2015
            moduleRoot: 'main',
            moduleIds: true,
            plugins: ["transform-es2015-modules-amd"]   // force module system to amd
        }))
    .pipe(debug({
            title : 'babel output'
        }))
    /*.pipe(browserify({
            insertGlobals : true,
            extensions : ['.js'],
            debug : true,
            read: true
        }))*/
    /*.pipe(requirejsOptimize({
            optimize: 'none',
            insertRequire: ['foo/bar/bop'],
        }))*/
    .pipe(concat('app.js'))
    .pipe(gulp.dest(dist.js))
}

gulp.task('css', buildCSS)
gulp.task('js', buildJS)

gulp.task('test-es6', function () {
    return gulp.src(src.scripts)
    .pipe(babel({
            presets : ['es2015']
        }))
    .pipe(gulp.dest('dist'));

});

gulp.task('watch', function () {
    gulp.watch(src.bower, ['bower'])
    watch({
        glob : src.styles,
        name : 'app.css'
    }, buildCSS)
    watch({
        glob : src.scripts,
        name : 'app.js'
    }, buildJS)
});

//
// live reload can emit changes only when at lease one build is done
//
gulp.task('livereload', ['bower', 'css', 'js', 'watch'], function () {
    var server = livereload()
        var batch = new BatchStream({
            timeout : 100
        })
        gulp.watch(dist.all).on('change', function change(file) {
            // clear directories
            var urlpath = file.path.replace(__dirname + '/' + publishdir, '')
                // also clear the tailing index.html
                urlpath = urlpath.replace('/index.html', '/')
                batch.write(urlpath)
        })
        batch.on('data', function (files) {
            server.changed(files.join(','))
        })
})
gulp.task('compress-css', ['css'], function () {
    return gulp.src(dist.css)
    .pipe(cssmin())
    .pipe(gulp.dest(dist.min.css))
})
gulp.task('compress-js', ['js'], function () {
    return gulp.src(dist.js)
    .pipe(uglify())
    .pipe(gulp.dest(dist.min.js))
})
gulp.task('compress', ['compress-css', 'compress-js'])

gulp.task('default', ['bower', 'css', 'js', 'livereload']) // development
gulp.task('build', ['bower', 'compress']) // build for production


/*

links:

    https://viget.com/extend/gulp-browserify-starter-faq


*/




