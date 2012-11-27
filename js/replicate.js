define(['couchr', 'underscore', './utils'], function(couchr, _, utils){
	var replicate = {},
		main_repo = 'http://jamjs.org/repository/',
		ddoc_id = '_design/jam-packages'
		db_name = null;




	replicate.current_db = function(callback) {
		utils.current_db_info(function(err, data){
			db_name = data.db_name;
			callback();
		});		
	}


	replicate.have_replicated_ddoc = function(callback) {
		couchr.head('_db/' + ddoc_id, function(err, resp) {
			if (err && err.status === 404) {
				return callback(null, false);
			}
			if (err) return callback(err);
			return callback(null, true)
		});
	}


	replicate.pull_main_ddoc = function(callback) {
		replicate.current_db(function(err, data){
			var request = {
				source: main_repo,
				target: db_name,
				doc_ids: [ddoc_id]
			}
			couchr.post('_couch/_replicate', request, callback);
		});
	}

	replicate.full_replicate_status = function(callback) {
		couchr.get('_couch/_replicator/_all_docs', {include_docs: true}, function(err, resp){
			if (err) return callback(err);
			_.each(resp.rows, function(row){
				if (row.doc && row.doc.is_jam_pull) {
					callback(null, row.doc);
				}
			});
			callback(null, "No replicaton with " + main_repo);
		})
	}

	replicate.create_pull_replication = function(callback) {
		var request = {
			source: main_repo,
			target: db_name,
			is_jam_pull : true
		}
		couchr.post('_couch/_replicator', request, callback);
	}



	return replicate;
})