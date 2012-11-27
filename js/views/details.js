define([
    'module',
    'exports',
    'require',
    'jquery',
    'underscore',
    '../utils',
    'couchr',
    'handlebars',
    'text!../../templates/details.html',
    'text!../../templates/owner-li.html',
    '../showdown-custom',
    'bootstrap/js/bootstrap-modal',
    'bootstrap/js/bootstrap-button',
    'spin-js'
],
function (module, exports, require, $, _) {

    var dburl = '_db/';

    var utils = require('../utils'),
        couchr = require('couchr'),
        handlebars = require('handlebars'),
        showdown = require('../showdown-custom'),
        Spinner = require('spin-js').Spinner;

    var templates = {
        'details.html': handlebars.compile(
            require('text!../../templates/details.html')
        ),
        'owner-li.html': handlebars.compile(
            require('text!../../templates/owner-li.html')
        )
    };

    exports.init = function (name, v) {
        // clean up any open modal dialogs
        $('.modal-backdrop').remove();

        document.title = name + (v ? ' (' + v + ')': '') + ' - Jam Packages';

        var url = dburl + encodeURIComponent(name);
        couchr.get(url, function (err, doc) {

            if (err) {
                $('#content').html('<div class="container-fluid"/>');
                $('#content .container-fluid').html('<h1>Error</h1>');
                $('#content .container-fluid').append(
                    $('<p/>').text(err.message || err.toString())
                );
                return;
            }

            var version = v || doc.tags.latest,
                cfg = doc.versions[version],
                dependencyList = null,
                github = utils.gitHubURL(cfg);

            if (cfg.dependencies) {
                dependencyList = _.keys(cfg.dependencies).sort();
            }

            $('#content').html(templates['details.html']({
                doc: doc,
                version: version,
                cfg: cfg,
                published: new Date(doc.time[version]).toString(),
                dependencyList: dependencyList,
                versionList: _.keys(doc.versions).sort().reverse(),
                github: github
            }));

            // add github watchers count
            utils.gitHubWatchers(cfg, function (err, watchers) {
                if (typeof watchers === 'number') {
                    var span = $('<span/>').text(
                        ' - ' + watchers + ' watchers'
                    );
                    $('tr.github td').append(span);
                }
            });

            couchr.get('/_session', function (err, session) {
                var userCtx = {};
                if (!err) {
                    userCtx = session.userCtx;
                }
                else {
                    // ignore errors and assume logged out, but log to console
                    console.error(err);
                }
                exports.addOwners(doc, userCtx);
                exports.checkOwner(doc, userCtx);
                exports.fetchReadme(doc, version, $('#readme'));
            });
        });
    };

    exports.escapeHTML = function (s) {
        s = ('' + s); /* Coerce to string */
        s = s.replace(/&/g, '&amp;');
        s = s.replace(/</g, '&lt;');
        s = s.replace(/>/g, '&gt;');
        s = s.replace(/"/g, '&quot;');
        s = s.replace(/'/g, '&#39;');
        return s;
    };

    exports.fetchReadme = function (doc, version, el) {
        var att;
        var dir = 'docs/' + version + '/';
        for (var k in doc._attachments) {
            if (k.substr(0, dir.length) === dir) {
                att = k;
            }
        }

        if (att) {
            var basename = _.last(att.split('/'));
            el.prepend(
                '<h3 class="filename">' +
                    '<i class="icon-book"></i> ' +
                    exports.escapeHTML(basename) +
                '</h3>'
            );
            var url = dburl + encodeURIComponent(doc._id) + '/' + att;

            $.get(url, function (data) {
                var ext = _.last(basename.split('.'));
                if (ext === 'md' || ext === 'markdown') {
                    var html = showdown.convert(data);
                    el.append('<div class="data">' + html + '</div>');
                    utils.syntaxHighlight();
                }
                else {
                    var pre = $('<pre class="data"></pre>');
                    el.append(pre.text(data));
                }
            });
        }
    };

    exports.addOwners = function (doc, userCtx) {
        utils.getGravatars(doc.owners, 18, function (err, gravatars) {
            if (err) {
                console.error(err);
            }
            _.each(doc.owners, function (o) {
                $('.package-details-table .owners td ul').append(
                    templates['owner-li.html']({
                        userCtx: userCtx,
                        owner: o,
                        gravatar: err ? null: gravatars[o]
                    })
                );
            });
            _.each(doc.owners, function (o) {
                $('#ownersModal ul.user-list').append(
                    templates['owner-li.html']({
                        userCtx: userCtx,
                        owner: o,
                        gravatar: err ? null: gravatars[o],
                        remove_link: true
                    })
                );
            });
            $('#ownersModal').on('click', '.remove-link', function (ev) {
                ev.preventDefault();

                var el = $(this);
                var username = el.parents('li').attr('rel');
                doc.owners = _.without(doc.owners, username);

                var mb = el.parents('.modal-body');
                $('.alert', mb).remove();

                var li = $(el).parents('li');
                var avatar = $('img', li).remove();

                var target = document.createElement('div');
                $(target).addClass("spinnerContainer");
                var spinner = new Spinner({
                    lines: 9,
                    length: 2,
                    width: 2,
                    radius: 4,
                    rotate: 0,
                    trail: 60,
                    speed: 1.0,
                    top: 0,
                    left: 0
                }).spin(target);
                li.prepend(target);

                var url = dburl + encodeURIComponent(doc._id);
                couchr.put(url, doc, function (err, data) {
                    // remove spinner
                    $(target).remove();

                    if (err) {
                        // add user back into owners array
                        doc.owners.push(username);

                        // replace avatar
                        $('a.user-link', el.parents('li')).prepend(avatar);

                        var a = $(
                            '<div class="alert alert-error">' +
                              '<button class="close" data-dismiss="alert">' +
                                  '×' +
                              '</button>' +
                              '<strong>Error:</strong> ' + err.toString() +
                            '</div>'
                        );
                        $('button', a).click(function (ev) {
                            ev.preventDefault();
                            a.remove();
                            return false;
                        });
                        el.parents('.modal-body').prepend(a);
                    }
                    else {
                        doc._rev = data.rev;
                        var lis = $('li.owner[rel=' + username + ']');
                        console.log(['lis', lis]);
                        lis.fadeOut('fast', function () { lis.remove(); });
                    }
                });
                return false;
            });

            $('#ownersModal .form-add-owner').submit(function (ev) {
                ev.preventDefault();
                var el = $(this);

                // clear error messages
                $('.help-inline', el).text('');
                $('.control-group', el).removeClass('error');

                var val = $('input[type=text]', el).val();
                if (!val) {
                    $('.control-group', el).addClass('error');
                    $('.help-inline', el).text('Must enter a username');
                    return;
                }

                if (_.include(doc.owners, val)) {
                    $('.control-group', el).addClass('error');
                    $('.help-inline', el).text('Already an owner');
                    return;
                }

                $('button', el).button('loading');

                var apiurl = window.Packages_api || '/api/';
                var profile_url = apiurl + 'users/' + encodeURIComponent(val);
                couchr.head(profile_url, function (err, profile) {
                    if (err) {
                        $('.control-group', el).addClass('error');
                        if (err.status === 404) {
                            $('.help-inline', el).text('User not found');
                        }
                        else {
                            $('.help-inline', el).text(err.toString());
                        }
                        $('button', el).button('reset');
                        return;
                    }

                    // add new owner to doc
                    doc.owners.push(val);
                    doc.owners = _.uniq(doc.owners);

                    var url = dburl + encodeURIComponent(doc._id);
                    couchr.put(url, doc, function (err, data) {
                        if (err) {
                            // remove invalid owner
                            doc.owners = _.without(doc.owners, val);

                            $('.control-group', el).addClass('error');
                            $('.help-inline', el).text('Must enter a username');
                            $('button', el).button('reset');
                            return;
                        }
                        doc._rev = data.rev;
                        utils.getGravatars([val], 18, function (err, gravatars) {
                            // update owners list on details page
                            $('.package-details-table .owners td ul').append(
                                templates['owner-li.html']({
                                    userCtx: userCtx,
                                    owner: val,
                                    gravatar: err ? null: gravatars[val]
                                })
                            );
                            // update owners list in modal
                            $('#ownersModal ul.user-list').append(
                                templates['owner-li.html']({
                                    userCtx: userCtx,
                                    owner: val,
                                    gravatar: err ? null: gravatars[val],
                                    remove_link: true
                                })
                            );
                            $('input[type=text]', el).val('');
                            $('button', el).button('reset');
                        });
                    });
                });

                return false;
            });
        });
    };

    exports.checkOwner = function (doc, userCtx) {
        if (userCtx.name && _.include(doc.owners, userCtx.name)) {
            $('.package-details-table .owners td').append(
                '<a href="#" class="owners-btn btn btn-mini">' +
                    '<i class="icon-user"></i> ' +
                    'Manage owners' +
                '</a>'
            );
            $('.owners-btn').click(function (ev) {
                ev.preventDefault();
                $('#ownersModal').modal('show');
                $('#ownersModal .form-add-owner input[type=text]').focus();
                return false;
            });
        }
    };

});
