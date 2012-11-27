define([
    'module',
    'exports',
    'require',
    'jquery',
    'underscore',
    'couchr',
    'handlebars',
    '../utils',
    './home',
    'text!../../templates/category.html',
    'text!../../templates/categories.html',
    'text!../../templates/category-list.html'
],
function (module, exports, require, $, _) {

    var couchr = require('couchr'),
        handlebars = require('handlebars'),
        utils = require('../utils'),
        home = require('./home');


    var dburl = "_db/";

    var templates = {
        'category.html': handlebars.compile(
            require('text!../../templates/category.html')
        ),
        'categories.html': handlebars.compile(
            require('text!../../templates/categories.html')
        ),
        'category-list.html': handlebars.compile(
            require('text!../../templates/category-list.html')
        )
    };


    exports.highlightCategory = function (category) {
        return function (err) {
            if (err) {
                return;
            }
            $('#categories li').each(function () {
                if ($(this).attr('rel') === category) {
                    $(this).addClass('active');
                }
            });
        };
    };

    exports.init = function (category) {
        category = decodeURIComponent(category);

        document.title = 'Category: ' + category + ' - Jam Packages';
        $('#content').html(templates['category.html']({
            category: category
        }));
        $('#categories').html(
            templates['categories.html']({})
        );

        // add category list counts if not yet populated
        if (!$('#categories').hasClass('loaded-counts')) {
            home.populateCategories(
                exports.highlightCategory(category)
            );
        }
        else {
            exports.highlightCategory(category)();
        }
        exports.populateList(category);
    };


    var PAGE_LENGTH = 10;

    exports.populateList = function (category, skip) {
        var url = dburl + '_design/jam-packages/_view/packages_by_category';
        couchr.get(url, {reduce: true, group_level: 1}, function (err, counts) {
            if (err) {
                return console.error(err);
            }
            var total = _.detect(counts.rows, function (c) {
                return c.key[0] === category;
            }).value;

            var q = {
                reduce: false,
                include_docs: true,
                startkey: [category],
                endkey: [category, {}],
                limit: PAGE_LENGTH,
                skip: skip || 0
            };
            console.log(['populateList', url, q]);
            couchr.get(url, q, function (err, data) {
                if (err) {
                    return console.error(err);
                }
                if (!data.skip) {
                    data.skip = skip || 0;
                }
                console.log(['ctx.nav', {
                    start: data.skip + 1,
                    end: data.skip + data.rows.length,
                    total: total,
                    prev: data.skip > 0,
                    next: (data.skip + data.rows.length) < total
                }]);
                $('#categoryPackages').html(templates['category-list.html']({
                    rows: data.rows.length ? data.rows: null,
                    category: category,
                    nav: {
                        start: data.skip + 1,
                        end: data.skip + data.rows.length,
                        total: total,
                        prev: data.skip > 0,
                        next: (data.skip + data.rows.length) < total
                    }
                }));
                _.each(data.rows, function (r) {
                    var doc = r.doc.versions[r.doc.tags.latest];
                    utils.gitHubWatchers(doc, function (err, watchers) {
                        if (typeof watchers === 'number') {
                            var span = $('<span/>').text(watchers).prepend(
                                '<i class="icon-github"></i> '
                            );
                            span.attr({title: 'Watchers on GitHub'});
                            $('li[rel="' + r.doc._id + '"] .extra').html(span);
                        }
                    });
                });
                exports.bindListNav(category, data);
            });
        });
    };

    exports.bindListNav = function (category, data) {
        $('#package-list-nav .prev-link').on('click', function (ev) {
            ev.preventDefault();
            if (!$(this).hasClass('disabled')) {
                exports.populateList(
                    category, Math.max(0, data.skip - PAGE_LENGTH)
                );
            }
            return false;
        });
        $('#package-list-nav .next-link').on('click', function (ev) {
            ev.preventDefault();
            if (!$(this).hasClass('disabled')) {
                exports.populateList(category, data.skip + data.rows.length);
            }
            return false;
        });
    };

});
