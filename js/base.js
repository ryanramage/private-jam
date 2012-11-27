define('js/base', [
    'js/session_menu',
    'jquery'
],
function (session_menu, $) {

    return {
        init: function () {
            require(['bootstrap/js/bootstrap-dropdown'], function () {
                // init dropdowns
            });
            session_menu.init();
        }
    };

});
