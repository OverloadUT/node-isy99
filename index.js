/* jshint node: true */
'use strict';

var parseString = require("xml2js").parseString;
var restClient = require('node-rest-client').Client;

function ISY(options) {
    //hide "new"
    if (!(this instanceof ISY)) {
        return new ISY(options);
    }

    //make params optional
    options = options||{};

	this._host = options.host || 'isy'; // Default host is "isy" which will work if you are in the same network
	this._port = options.port || 80;
	this._https = options.https == 'true';
	this._user = options.user || 'admin';
	this._pass = options.pass || 'admin';

	this._restClient = new restClient({user:this._user,password:this._pass});
}

ISY.prototype.request = function(path, callback) {
	var self = this;

	var fullpath = (this._https ? "https://" : "http://") +
					this._host + ":" + this._port + "/" + path;

	self._restClient.get(fullpath, function(data, response){

		if(response.statusCode >= 300 || response.statusCode < 200) {
			return callback(new Error('Got a non-200 HTTP status code', response.statusCode));
		}

		parseString(data.toString(), {explicitArray: false}, function(err, jsobj){
			callback(err, jsobj);
		});
	});
};

ISY.prototype.getDeviceInfo = function(address, callback) {
	var self = this;

	self.request("rest/nodes/" + address, function(err, data){
		if(err) {
			return callback(err);
		}

        if(typeof data.nodeInfo === 'undefined') {
            return callback(new Error('Error parsing response from ISY'));
        } else {
            var Device = new ISYDevice(data.nodeInfo);
            callback(null, Device);
        }
	});
};

// TODO should we abstract out the different command types?
ISY.prototype.sendDeviceCommand = function(address, command, callback) {
	var self = this;

	self.request("rest/nodes/"+address+"/cmd/"+command, function(err, data){
		if(err) {
			return callback(err);
		}

		if(!('RestResponse' in data)) {
			return callback(new Error("Unexpected response from server (no 'RestResponse' XML node)", data));
		}

        var succeeded = data.RestResponse.$.succeeded === 'true';
		callback(null, succeeded);
	});
};

ISY.prototype.sendProgramCommand = function(address, command, callback) {
	var self = this;

	self.request("rest/programs/"+address+"/"+command, function(err, data){
		if(err) {
			return callback(err);
		}

		if(!('RestResponse' in data)) {
			return callback(new Error("Unexpected response from server (no 'RestResponse' XML node)", data));
		}

        var succeeded = data.RestResponse.$.succeeded === 'true';
        callback(null, succeeded);
	});
};

function ISYDevice(nodeInfo) {
	var node = nodeInfo.node;
	this.address = node.address;
	this.name = node.name;
	this.enabled = node.enabled == "true";
	this.status = node.property.$.value;
	this.statusFormatted = node.property.$.formatted;
}

module.exports = ISY;
