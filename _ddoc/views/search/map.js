function map(doc) {
    if (doc.type === 'package') {

	    var Tokenizer = require('views/lib/tokenizer'),
	        _ = require('views/lib/underscore')._,
	    	tokenizer = new Tokenizer(),
	    	name_tokens = tokenizer.tokenize(doc.name),
	    	desc_tokens = tokenizer.tokenize(doc.description),
	    	keys_tokens = doc.keywords || [],
	    	result = {
	    		name        : doc.name,
	    		description : doc.description,
	    		keywords    : _.uniq(_.union(name_tokens, desc_tokens, keys_tokens)),
	    	};

	    for (var i=0; i < result.keywords.length; i++) {
	        emit(result.keywords[i], result);
	    }	    
    }
}