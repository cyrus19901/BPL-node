'use strict';

var Router = require('../helpers/router.js');
var transactionTypes = require('../helpers/transactionTypes.js');
var AutoUpdate = require('../logic/autoUpdate.js');
var sql = require('../sql/autoUpdates.js');
var schema = require('../schema/autoUpdates.js');
var spawn = require('child_process').spawn;

// Private fields
var modules, library, self, __private = {}, shared = {};

__private.assetTypes = {};

// Constructor
function AutoUpdates (cb, scope) {
	library = scope;
	self = this;
	__private.assetTypes[transactionTypes.AUTOUPDATE] = library.logic.transaction.attachAssetType(transactionTypes.AUTOUPDATE, new AutoUpdate());
	return cb(null, self);
}

// Private methods
__private.attachApi = function () {
	var router = new Router();

	router.use(function (req, res, next) {
		if (modules) { return next(); }
		res.status(500).send({success: false, error: 'Blockchain is loading'});
	});

	router.map(shared, {
		'get /get': 'getAutoUpdate',
		'get /getLatest': 'getLatest'
	});

	router.use(function (req, res, next) {
		res.status(500).send({success: false, error: 'API endpoint not found'});
	});

	library.network.app.use('/api/autoUpdates', router);
	library.network.app.use(function (err, req, res, next) {
		if (!err) { return next(); }
		library.logger.error(`API error ${  req.url}`, err);
		res.status(500).send({success: false, error: 'API error', message: err.message});
	});
};


__private.switchCodebase = function () {
	console.log('Switch codebase >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
	//TODO port number to be required from config file
	//TODO handle spawn callback
	spawn('bash',['scripts/switchCodebase.sh', process.env.CONFIG_NAME, process.env.GENESIS_NAME, 4000]);
};

// Shared
shared.getLatest = function (req, cb) {
	library.db.query(sql.getAllById).then(function (rows) {
		if(rows.length) {
			var lastRow = rows[rows.length-1];

			library.db.query(sql.getByTransactionId, { transactionId:lastRow.transactionId}).then(function (row) {
				if(row.length) {
					return cb(null, { update: row[0] });
				}

				return cb('Couldn\'t find auto update: '+req.body.id);
			}).catch(function (err) {
				library.logger.error('stack', err.stack);
				return cb('Couldn\'t find latest auto update.');
			});
		}
		else {
			return cb('Couldn\'t find latest auto update.');
		}
	}).catch(function (err) {
		library.logger.error('stack', err.stack);
		return cb('Failed to get latest update.');
	});
};

shared.getAutoUpdate = function (req, cb) {
	library.schema.validate(req.body, schema.getAutoUpdate, function (err) {
		if (err) {
			return cb(err[0].message);
		}

		library.db.query(sql.getByTransactionId, { transactionId:req.body.id}).then(function (row) {
			if(row.length) {
				return cb(null, { update: row[0] });
			}

			return cb('Couldn\'t find auto update: '+req.body.id);
		}).catch(function (err) {
			library.logger.error('stack', err.stack);
			return cb('Failed to get update.');
		});
	});
};

AutoUpdates.prototype.verifyTransactionAsset = function (data, cb) {
	console.log('verifyTransactionAsset >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
	library.db.query(sql.getByTransactionId, { transactionId: data.verifyingTransactionId}).then(function (rows) {
		if (rows.length) {
			var valid = true, msg = '';

			for (var prop in rows[0]) {
				switch (prop) {
				case 'versionLabel': if(data.versionLabel !== rows[0].versionLabel) {
					valid = false;
					msg = 'Invalid transaction version label asset.';
				}
					break;
				case 'triggerHeight': if(data.triggerHeight !== rows[0].triggerHeight) {
					valid = false;
					msg = 'Invalid transaction trigger height asset.';
				}
					break;
				case 'ipfsHash': if(data.ipfsHash !== rows[0].ipfsHash) {
					valid = false;
					msg = 'Invalid transaction IPFS hash asset.';
				}
					break;
				default: break;
				}
				if (!valid) {
					return cb(msg);
				}
			}
			return cb(null);
		}
		return cb ('Invalid verifying transaction id.');
	}).catch(function (err) {
		library.logger.error('stack', err.stack);
		return cb('Failed to get verifying transaction.');
	});
};

AutoUpdates.prototype.checkAutoUpdate = function (height) {
	console.log('In checkAutoUpdate >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
	library.db.query(sql.getByTriggerHeight, { height: height}).then(function (rows) {
		if (rows.length) {
			var cancelUpdate = false;
			for (var i=0; i<rows.length; i++) {
				if (rows[i].cancellationStatus) {
					cancelUpdate = rows[i].cancellationStatus;
					break;
				}
			}

			if (!cancelUpdate) {
				self.verifyTransactionAsset(rows[0], function (err) {
					if (!err) {
						__private.switchCodebase();
					}
				});
			}
		}
	}).catch(function (err) {
		library.logger.error('stack', err.stack);
	});
}


// Events
//
//__EVENT__ `onBind`

//
AutoUpdates.prototype.onBind = function (scope) {
	modules = scope;
	__private.assetTypes[transactionTypes.AUTOUPDATE].bind({
		modules, library
	});
};


// Events
//
//__EVENT__ `onAttachPublicApi`

//
AutoUpdates.prototype.onAttachPublicApi = function () {
	__private.attachApi();
};

// Export
module.exports = AutoUpdates;
