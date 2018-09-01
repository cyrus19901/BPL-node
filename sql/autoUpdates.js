'use strict';

var AutoUpdatesSql = {

	getByTransactionId: 'SELECT * FROM autoupdates WHERE "transactionId" = ${transactionId}',

	getAllById: 'SELECT "transactionId" FROM autoupdates',

	getByTriggerHeight: 'SELECT * FROM autoupdates WHERE "triggerHeight" = ${height} AND "verifyingTransactionId" IS NOT NULL',

	getDuplicate: function (params) {
		return [
			'SELECT "transactionId" FROM autoupdates ',
			(params.where.length ? 'WHERE ' + params.where.join(' AND ') : '')
		].filter(Boolean).join(' ');
	}
};

module.exports = AutoUpdatesSql;
