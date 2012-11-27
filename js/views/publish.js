define([
    'module',
    'exports',
    'require',
    'jquery',
    'underscore',
    'url', 
    'gravatar',
    'handlebars',
    'couchr',
    'text!../../templates/publish.html',
],
function (module, exports, require, $, _) {
    var url = require('url'),
    	gravatar = require('gravatar'),
        handlebars = require('handlebars'),
        couchr = require('couchr');

    var templates = {
        'publish.html': handlebars.compile(
            require('text!../../templates/publish.html')
        )
    };
    exports.init = function () {
        document.title = 'Publish: - Jam Packages';

        var repo = url.resolve(window.location, 'repo');
        $('#content').html(templates['publish.html']({
        	repo : repo
        }));

    };
    return exports;
})