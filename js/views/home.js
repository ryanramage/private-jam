define([
    'module',
    'exports',
    'require',
    'jquery',
    'underscore',
    '../utils',
    'gravatar',
    'handlebars',
    'handlebars-helpers',
    'text!../../templates/home.html',
    'text!../../templates/categories.html',
    'text!../../templates/top-submittors.html',
    'text!../../templates/most-depended-on.html',
    'text!../../templates/latest-updates.html',
    'text!../../templates/search-results.html',
    'jquery-throttle-debounce',
    'couchr'
],
function (module, exports, require, $, _) {

    var gravatar = require('gravatar'),
        handlebars = require('handlebars'),
        couchr = require('couchr'),
        utils = require('../utils');

    var dburl = '';

    var templates = {
        'home.html': handlebars.compile(
            require('text!../../templates/home.html')
        ),
        'categories.html': handlebars.compile(
            require('text!../../templates/categories.html')
        ),
        'top-submittors.html': handlebars.compile(
            require('text!../../templates/top-submittors.html')
        ),
        'most-depended-on.html': handlebars.compile(
            require('text!../../templates/most-depended-on.html')
        ),
        'latest-updates.html': handlebars.compile(
            require('text!../../templates/latest-updates.html')
        ),
        'search-results.html': handlebars.compile(
            require('text!../../templates/search-results.html')
        )
    };

    // set to true when updating the page inline but changing the url
    // for back button / bookmarking support
    exports.ignore_next_hashchange = false;

    exports.init = function (q) {
        document.title = q ? 'Search: ' + q + ' - Jam Packages': 'Jam Packages';

        if (exports.ignore_next_hashchange) {
            // already showing home page, it will have updated inline
            // without redrawing. do nothing on hash change.
            exports.ignore_next_hashchange = false;
        }
        else {
            // clean up any open modal dialogs
            $('.modal-backdrop').remove();

            $('#content').html(templates['home.html']({}));
            $('#categories').html(
                templates['categories.html']({})
            );
            exports.bindSearchForm();

            // initial load or came from another page, redraw
            if (q) {
                q = decodeURIComponent(q);
                $('#package-search-q').val(q);
                exports.searchPackages(q);
            }
            else {
                // only update these on first page load, update recent activity
                // whenever showing overview details (after clearing the
                // search box)
                exports.populateMostDependedOn();
                exports.populateTopSubmittors();
                exports.showOverview();
            }
            // add category list counts if not yet populated
            if (!$('#categories').hasClass('loaded-counts')) {
                exports.populateCategories();
            }
        }
    };

    exports.showOverview = function () {
        if (window.location.hash !== '#/') {
            exports.ignore_next_hashchange = true;
            window.location = '#/';
        }
        $('#package-search-form .control-group').removeClass('error');
        $('#package-search-form .help-inline').text('');
        $('#package-search-submit').button('reset');
        $('#searchResults').hide();
        $('#overview').show();
        exports.populateLatestUpdates();
    };


    exports.CACHED_CATEGORY_COUNTS = [];
    exports.renderCategoryCounts = function (categories) {
        _.each(categories, function (c) {
            $('#categories li[rel="' + c.name + '"] .count').text(
                '(' + c.count + ')'
            );
        });
        $('#categories').addClass('loaded-counts');
    };
    exports.populateCategories = function (/*optional*/callback) {
        if (exports.CACHED_CATEGORY_COUNTS) {
            exports.renderCategoryCounts(exports.CACHED_CATEGORY_COUNTS);
        }
        couchr.get(
            dburl + '_ddoc2/_view/packages_by_category',
            {reduce: true, group_level: 1},
            function (err, data) {
                if (err) {
                    return console.error(err);
                    if (callback) {
                        return callback(err);
                    }
                }
                var categories = [
                    {name: 'All', count: 0},
                    {name: 'AJAX & Websockets', count: 0},
                    {name: 'API Clients', count: 0},
                    {name: 'CSS', count: 0},
                    {name: 'Crypto', count: 0},
                    {name: 'DOM', count: 0},
                    {name: 'Data', count: 0},
                    {name: 'Effects', count: 0},
                    {name: 'Events', count: 0},
                    {name: 'Frameworks', count: 0},
                    {name: 'Geographic', count: 0},
                    {name: 'Graphics', count: 0},
                    {name: 'Loader plugins', count: 0},
                    {name: 'Media', count: 0},
                    {name: 'Parsers & Compilers', count: 0},
                    {name: 'Routing', count: 0},
                    {name: 'Shims', count: 0},
                    {name: 'Storage', count: 0},
                    {name: 'Templating', count: 0},
                    {name: 'Testing', count: 0},
                    {name: 'UI', count: 0},
                    {name: 'Utilities', count: 0},
                    {name: 'Validation', count: 0},
                    {name: 'Visualization', count: 0},
                    {name: 'Uncategorized', count: 0}
                ];
                _.each(data.rows, function (r) {
                    _.each(categories, function (c) {
                        if (c.name === r.key[0]) {
                            c.count = r.value;
                        }
                    });
                });
                exports.CACHED_CATEGORY_COUNTS = categories;
                exports.renderCategoryCounts(categories);
                if (callback) {
                    return callback();
                }
            }
        );
    };

    exports.populateLatestUpdates = function () {
        $.ajax({
            url: dburl + '_ddoc2/_view/packages_activity',
            type: 'GET',
            data: {
                limit: 10,
                descending: true
            },
            dataType: 'json',
            success: function (data) {
                var usernames = _.uniq(_.map(data.rows, function (r) {
                    return r.value.user;
                }));
                utils.getGravatars(usernames, 32, function (err, gravatars) {
                    var html = '<ol class="package-list latest-updates">';

                    var rows = _.map(data.rows, function (r) {
                        var v = r.value;
                        r.gravatar_url = gravatars[v.user];
                        r.pp_modified = utils.prettyDate(v.time);
                        return r;
                    });
                    $('#latest-updates').html(templates['latest-updates.html']({
                        rows: rows
                    }));
                });
            }
        });
    };

    exports.populateMostDependedOn = function () {
        $.ajax({
            url: dburl + '_ddoc2/_view/package_dependents',
            type: 'GET',
            data: {
                reduce: true,
                group_level: 1
            },
            dataType: 'json',
            success: function (data) {
                var rows = data.rows.sort(function (a, b) {
                    return b.value - a.value;
                });
                $('#most-depended-on').html(templates['most-depended-on.html']({
                    rows: rows.slice(0, 10)
                }));
            }
        });
    };

    exports.populateTopSubmittors = function () {
        $.ajax({
            url: dburl + '_ddoc2/_view/submittor_packages',
            type: 'GET',
            data: {
                reduce: true,
                group_level: 1
            },
            dataType: 'json',
            success: function (data) {
                var rows = data.rows.sort(function (a, b) {
                    return b.value - a.value;
                });
                $('#top-submittors').html(templates['top-submittors.html']({
                    rows: rows.slice(0, 10)
                }));
            }
        });
    };

    /***** SEARCH *****/

    var PAGE_LENGTH = 10,    // number of results to display
        prev_search = null;  // to stop queries for the same results


    exports.bindSearchForm = function () {
        $('#package-search-form').submit(function (ev) {
            ev.preventDefault();
            var q = $('#package-search-q', this).val();
            if (q !== prev_search) {
                exports.searchPackages(q);
            }
            prev_search = q;
            return false;
        });
        $('#package-search-q').keyup($.debounce(500, function () {
            var q = $(this).val();
            if (q !== prev_search) {
                exports.searchPackages(q);
            }
            prev_search = q;
        }));
        $('#package-search-q').focus();
    };

    exports.searchPackages = function (q, skip) {
        if (!q) {
            return exports.showOverview();
        }
        var newurl = '#/search/' + encodeURIComponent(q);
        if (window.location.hash !== newurl) {
            exports.ignore_next_hashchange = true;
            window.location = newurl;
        }

        $('#overview').hide();
        $('#searchResults').html('').show();
        $('#package-search-form .control-group').removeClass('error');
        $('#package-search-form .help-inline').text('');
        $('#package-search-submit').button('loading');
        if (!/\s/.test(q)) {
            // if only a single word add a wildcard
            if (q.substr(q.length-1, 1) !== '*') {
                q += '*';
            }
        }

    };

    exports.bindSearchNav = function (q, data) {
        $('#package-list-nav .prev-link').on('click', function (ev) {
            ev.preventDefault();
            if (!$(this).hasClass('disabled')) {
                exports.searchPackages(q, Math.max(0, data.skip - PAGE_LENGTH));
            }
            return false;
        });
        $('#package-list-nav .next-link').on('click', function (ev) {
            ev.preventDefault();
            if (!$(this).hasClass('disabled')) {
                exports.searchPackages(q, data.skip + data.rows.length);
            }
            return false;
        });
    };

});
