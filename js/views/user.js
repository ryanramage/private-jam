define([
    'module',
    'exports',
    'require',
    'jquery',
    'underscore',
    '../utils',
    'gravatar',
    'handlebars',
    'text!../../templates/user.html',
    'text!../../templates/user-package-list.html'
],
function (module, exports, require, $, _) {

    var handlebars = require('handlebars'),
        gravatar = require('gravatar'),
        utils = require('../utils');

    var templates = {
        'user.html': handlebars.compile(
            require('text!../../templates/user.html')
        ),
        'user-package-list.html': handlebars.compile(
            require('text!../../templates/user-package-list.html')
        )
    };

    var apiurl ='_db/';

    exports.init = function (name) {
        // clean up any open modal dialogs
        $('.modal-backdrop').remove();

        document.title = name + ' - Jam Packages';
        var profile = {};

        $('#content').html(templates['user.html']({

        }));
        $.ajax({
            type: 'GET',
            dataType: 'json',
            data: {
                startkey: JSON.stringify([name]),
                endkey: JSON.stringify([name, {}])
            },
            url: apiurl + '/_design/jam-packages/_view/packages_by_user',
            success: function (data) {
                var rows_by_mtime = _.sortBy(data.rows, function (r) {
                    return r.value.modified;
                });
                var last = _.last(rows_by_mtime);
                var last_update = 'Never';
                if (last) {
                    last_update = new Date(last.value.modified).toString();
                }
                var rows = _.sortBy(data.rows, function (r) {
                    return r.value.name;
                });

                rows = _.map(rows, function (r) {
                    r.pp_modified = utils.prettyDate(r.value.modified);
                    return r;
                });

                $('#user-packages-info').html(
                    templates['user-package-list.html']({
                        rows: rows,
                        last_update: last_update
                    })
                );
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $('#content').html('<div class="container-fluid"/>');
                $('#content .container-fluid').html('<h1>Error</h1>');
                $('#content .container-fluid').append(
                    $('<p/>').text(errorThrown)
                );
            }
        });
            
    };

});
