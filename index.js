/* jshint node: true */
'use strict';

var parseString = require("xml2js").parseString;
var Client = require('node-rest-client').Client;
var rest_client = new Client();

function ISY(options) {
    //hide "new"
    if (!(this instanceof ISY)) {
        return new ISY(options);
    }

    //make params optional
    options = options||{};

    console.log(options);

	this._host = options.host || 'isy'; // Default host is "isy" which will work if you are in the same network
	this._port = options.port || 80;
	this._https = options.https || false;
	this._user = options.user || 'admin';
	this._pass = options.pass || 'admin';

	this._restClient = new Client({user:this._user,password:this._pass});
}

ISY.prototype.request = function(path, callback) {
	var self = this;

	var fullpath = (this._https ? "https://" : "http://") +
					this._host + ":" + this._port + "/" + path;

	self._restClient.get(fullpath, function(data, response){

		if(response.statusCode >= 300 || response.statusCode < 200) {
			return callback(new Error('something bad happened'));
		}

		parseString(data.toString(), function(err, jsobj){
			callback(err, jsobj);
		});
	});
};

ISY.prototype.getNode = function(address, callback) {
	var self = this;

	self.request("rest/nodes/" + address, function(err, data){
		if(err) {
			return callback(err);
		}

		var Device = new ISYDevice(data);

		callback(null, Device);
	});
};

function ISYDevice(data) {
	this.address = data.nodeInfo.node[0].address;
	this.name = data.nodeInfo.node[0].name;
	this.enabled = data.nodeInfo.node[0].enabled == "true";
}

module.exports = ISY;
module.exports.rest_client = rest_client; // This is needed for tests