var _ = require('views/lib/underscore')._;

var stemmer = require('views/lib/porter_stemmer');

var TreebankWordTokenizer = function() {
};

TreebankWordTokenizer.prototype.trim = function(array) {
    if(array[array.length - 1] == '')
        array.pop();

    if(array[0] == '')
        array.shift();

    return array;
};



var contractions2 = [
    /(.)('ll|'re|'ve|n't|'s|'m|'d)\b/ig,
    /\b(can)(not)\b/ig,
    /\b(D)('ye)\b/ig,
    /\b(Gim)(me)\b/ig,
    /\b(Gon)(na)\b/ig,
    /\b(Got)(ta)\b/ig,
    /\b(Lem)(me)\b/ig,
    /\b(Mor)('n)\b/ig,
    /\b(T)(is)\b/ig,
    /\b(T)(was)\b/ig,
    /\b(Wan)(na)\b/ig];

var contractions3 = [
    /\b(Whad)(dd)(ya)\b/ig,
    /\b(Wha)(t)(cha)\b/ig
];


// a list of commonly used words that have little meaning and can be excluded
// from analysis.
var stopwords = [
    'about', 'after', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'app', 'are', 'as', 'at', 'be',
    'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'can',
    'come', 'could', 'did', 'do', 'each', 'for', 'from', 'get', 'got', 'has', 'had',
    'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'how', 'if', 'in', 'into',
    'is', 'it', 'like', 'make', 'many', 'me', 'might', 'more', 'most', 'much', 'must',
    'my', 'never', 'now', 'of', 'on', 'only', 'or', 'other', 'our', 'out', 'over',
    'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than',
    'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'to', 'too', 'under', 'up', 'very', 'was', 'way', 'we', 'well', 'were',
    'what', 'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
    'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '$', '1',
    '2', '3', '4', '5', '6', '7', '8', '9', '0', '_'];



TreebankWordTokenizer.prototype.tokenize = function(text) {
    contractions2.forEach(function(regexp) {
	    text = text.replace(regexp,"$1 $2");
    });

    contractions3.forEach(function(regexp) {
	    text = text.replace(regexp,"$1 $2 $3");
    });

    // most punctuation
    text = text.replace(/([^\w\.\'\-\/\+\<\>,&])/g, " $1 ");



    // commas if followed by space
    text = text.replace(/(,\s)/g, " $1");

    // single quotes if followed by a space
    text = text.replace(/('\s)/g, " $1");

    // periods before newline or end of string
    text = text.replace(/\. *(\n|$)/g, " . ");

    // words with periods at the end
    text = text.replace(/\./g, '');

    // single quotes
    text = text.replace(/'/g, "");

    text = _.without(text.split(/\s+/), '');

    var result = [];
    text.forEach(function(token) {
        if(stopwords.indexOf(token) == -1)
            result.push(token);
            var stemmed = stemmer.stem(token);
            if (stemmed !== token) result.push(stemmed);
    });


    return  result;
};

module.exports = TreebankWordTokenizer;
