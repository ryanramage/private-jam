define(['exports', 'gravatar', 'jquery'], function (exports, gravatar, $) {

    /*
     * Takes an ISO time or Date object and returns a string representing how
     * long ago the date represents in human-friendly terms. If the date is over
     * one month ago, returns the date in the form YYYY-MM-DD
     *
     * Adapted from John Resig's prettyDate function:
     * http://ejohn.org/blog/javascript-pretty-date/
     */

    exports.prettyDate = function (d) {
        if (typeof d === 'string') {
            d = new Date(d);
        }
        var now = new Date(),
            diff = ((now.getTime() - d.getTime()) / 1000),
            day_diff = Math.floor(diff / 86400);

        if (isNaN(day_diff) || day_diff < 0) {
            return;
        }

        if (day_diff === 0) {
            if (diff < 60)    return "just now";
            if (diff < 120)   return "1 minute ago";
            if (diff < 3600)  return Math.floor( diff / 60 ) + " minutes ago";
            if (diff < 7200)  return "1 hour ago";
            if (diff < 86400) return Math.floor( diff / 3600 ) + " hours ago";
        }
        if (day_diff === 1) return "yesterday";
        if (day_diff < 7)   return day_diff + " days ago";
        if (day_diff < 31)  return Math.ceil( day_diff / 7 ) + " weeks ago";

        var yyyy = d.getFullYear();
        var mm = d.getMonth();
        var dd = d.getDate();

        return yyyy + '-' + mm + '-' + dd;
    };

    exports.bulkGetProfiles = function (usernames, callback) {
        callback(null, {rows: []});
    };

    exports.getGravatars = function (usernames, size, callback) {
        exports.bulkGetProfiles(usernames, function (err, profiles) {
            if (err) {
                return callback(err);
            }
            var gravatars = {};
            _.each(profiles.rows, function (r) {
                if (!r.error) {
                    gravatars[r.key] = gravatar.avatarURL({
                        hash: r.doc.gravatar || 'default',
                        size: size,
                        default_image: 'identicon'
                    });
                }
            });
            callback(null, gravatars);
        });
    };

    exports.syntaxHighlight = function () {
        if (typeof hljs !== 'undefined') {
            $('pre > code').each(function () {
                if (this.className) {
                    $(this).html(
                        hljs.highlight(this.className, $(this).text()).value
                    );
                }
            });
        }
    };

    // try to determine the github url for a package doc
    exports.gitHubURL = function (doc) {
        if (doc.github) {
            return doc.github;
        }
        var gh_re = /^(?:https?|git):\/\/github.com\/[^\/]+\/[^\/]+(?:\.git)?$/;
        if (doc.repository && doc.repository.url) {
            if (gh_re.test(doc.repository.url)) {
                return doc.repository.url.replace(/\.git$/, '');
            }
        }
        if (doc.repositories) {
            for (var i = 0; i < doc.repositories.length; i++) {
                var r = doc.repositories[i];
                if (r.url && gh_re.test(r.url)) {
                    return r.url.replace(/\.git$/, '');
                }
            }
        }
        return null;
    };

    exports.gitHubWatchers = function (doc, callback) {
        var github = exports.gitHubURL(doc);
        if (!github) {
            return callback();
        }
        var re = /^https?:\/\/github.com\/([^\/]+)\/([^\/]+)$/;
        var match = re.exec(github);
        if (match) {
            var ghuser = match[1];
            var ghrepo = match[2];
            $.ajax({
                dataType: 'jsonp',
                url: 'https://api.github.com/repos/' + ghuser + '/' + ghrepo,
                success: function (data) {
                    if (data.data && data.data.watchers !== undefined) {
                        callback(null, data.data.watchers);
                    }
                    else {
                        callback();
                    }
                }
            });
        }
    };


    exports.current_db_info = function (callback) {
        $.getJSON('_db', function(data){
            callback(null, data);
        })
    }
});
