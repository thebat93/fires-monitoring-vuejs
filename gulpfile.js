var gulp = require('gulp'),
    concat = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
    uglify = require('gulp-uglifyjs'), // Подключаем gulp-uglifyjs (для сжатия JS)
    cssnano = require('gulp-cssnano'), // Подключаем пакет для минификации CSS
    babel = require('gulp-babel'),
    rename = require('gulp-rename'); // Подключаем библиотеку для переименования файлов



gulp.task('scripts', function() {
  return gulp.src([ // Берем все необходимые библиотеки
      'assets/js/leaflet.js',
      'assets/js/vue.min.js',
      'assets/js/bingLayer.js',
      'assets/js/leaflet.groupedlayercontrol.min.js',
      'assets/js/leaflet-ruler.js',
      'assets/js/mousePosition.js',
      'assets/js/flatpickr.js',
      'assets/js/ru.js',
      ])
      .pipe(concat('libs.min.js')) // Собираем их в кучу в новом файле libs.min.js
      .pipe(uglify()) // Сжимаем JS файл
      .pipe(gulp.dest('assets/js')); // Выгружаем в папку app/js
});

gulp.task('css-libs', function() {
  return gulp.src([
      'assets/css/flatpickr.min.css',
      'assets/css/leaflet.css',
      'assets/css/leaflet.groupedlayercontrol.min.css',
      'assets/css/leaflet-ruler.css',
      'assets/css/font-awesome.min.css'
      ]) // Выбираем файлы для минификации
      .pipe(concat('libs.min.css'))
      .pipe(cssnano()) // Сжимаем
      .pipe(gulp.dest('assets/css')); // Выгружаем в папку app/css
});

gulp.task('babel', function() {
    return gulp.src('app.js')
    .pipe(babel({
        presets: ['env']
    }))
    .pipe(gulp.dest('assets/js'))
});

gulp.task('minify', function() {
    return gulp.src('assets/js/app.js')
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(''));
});