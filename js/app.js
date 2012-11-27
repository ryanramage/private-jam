define([
    'jquery',
    'underscore',
    'async',
    'couchr',
    'director',
    './replicate',
    'hbt!templates/index',
    'lessc!css/main.less'
],
function($, _, async, couchr, director, replicate, index_t){
    var exports = {},
        routes = {
            '/' : index,
            '/details/*' : details,
            '/search/*' : search,
            '/search' : search,
            '/settings' : settings
        },
        router = director.Router(routes);
    /**
     * This is where you will put things you can do before the dom is loaded.
     */
    exports.init = function(callback) {
        replicate.init(function(err){
            callback(err);
        });
       
    }

    /**
     * This that occur after the dom has loaded.
     */
    exports.on_dom_ready = function(){
        router.init('/');

    }

    function index() {
        $('.main').html(index_t());
    }

    function details(package_name) {

    }

    function search(q) {

    }

    function settings() {

    }


    return exports;
});