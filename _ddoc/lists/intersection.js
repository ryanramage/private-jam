function intersection(head, req) {

    var _ = require('views/lib/underscore')._;
    var extraKeys = [];
    if (req.query.extra_keys) {
        var split = req.query.extra_keys.split(' ');
        extraKeys = extraKeys.concat(split);
    }

    extraKeys = _.uniq(_.map(extraKeys, function(key) {return key.toLowerCase()}));

    var realJson = true;
    if (req.query.streamJson) {
        realJson = false;
    }

    start({'headers' : {'Content-Type' : 'application/json'}});
    if (realJson) send('[\n');
    var count = 0;
    var row;
    while ((row = getRow())) {


        var doc_intersection = _.intersection(row.value.keywords, extraKeys);
        if (doc_intersection.length == extraKeys.length) {
            var pre = '';
            if (count++ > 0 && realJson) pre = ',';
            delete row.value.keywords;
            send(pre + JSON.stringify(row) + '\n');
        }
    }
    if (realJson) send(']');
}
