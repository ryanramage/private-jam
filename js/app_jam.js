define([
    'module',
    'exports',
    'require',
    'director',
    './replicate',
    './views/home',
    './views/details',
    './views/user',
    './views/category',
    './views/publish',
    'lessc!css/main.less'
],
function (module, exports, require, director, replicate) {

    exports.init = function () {
        var router = director.Router({
            '/':                require('./views/home').init,
            '/search/*':        require('./views/home').init,
            '/category/*':      require('./views/category').init,
            '/details/*':       require('./views/details').init,
            '/details/*/*':     require('./views/details').init,
            '/user/:name':      require('./views/user').init,
            '/publish':         require('./views/publish').init
        });
        router.init();
        if (!window.location.hash || window.location.hash === '#') {
            window.location = '#/';
            $(window).trigger('hashchange');
        }

        replicate.have_replicated_ddoc(function(err, replicated){
            if (!replicated) {
                replicate.pull_main_ddoc(function(err){

                })
            }
        });
               
    };

});
