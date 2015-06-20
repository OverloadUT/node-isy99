/* jshint node: true */
'use strict';
var expect = require('chai').expect;
var sinon = require('sinon');
var rest_client = require('../index.js').rest_client;

// TODO unexpected XML data

describe('ISY constructor', function () {
	it('construct with default options', function (done) {
		var isy = require('../index.js')();

		expect(isy._host).to.equal('isy');
		expect(isy._port).to.equal(80);
		expect(isy._https).to.equal(false);
		expect(isy._user).to.equal('admin');
		expect(isy._pass).to.equal('admin');
		done();
	});
	it('construct with custom options', function (done) {
		var isy = require('../index.js')({
			host: 'anotherhost',
			port: '8080',
			https: 'true',
			user: 'user',
			pass: 'pass'
		});
		expect(isy._host).to.equal('anotherhost');
		expect(isy._port).to.equal('8080');
		expect(isy._https).to.equal(true);
		expect(isy._user).to.equal('user');
		expect(isy._pass).to.equal('pass');
		done();
	});
});

describe('Get Device', function(){
	var isy = require('../index.js')();

	before(function(done){
		sinon
			.stub(isy._restClient, "get", function(device, callback){
				callback('<nodeInfo><node flag="128"><address>12 34 56 7</address><name>Device Name</name><parent type="3">8555</parent><type>1.32.64.0</type><enabled>true</enabled><deviceClass>0</deviceClass><wattage>0</wattage><dcPeriod>0</dcPeriod><pnode>1C AB 43 1</pnode><ELK_ID>A03</ELK_ID><property id="ST" value="255" formatted="On" uom="%/on/off"/></node><properties><property id="OL" value="255" formatted="100" uom="%/on/off"/><property id="RR" value="28" formatted="0.5 " uom="seconds"/><property id="ST" value="255" formatted="On" uom="%/on/off"/></properties></nodeInfo>', "");
			});
		done();
	});
	it('Should get Device info from API', function(done) {
		isy.getDeviceInfo("12 34 56 7", function(err, device){
			expect(device.address).to.equal("12 34 56 7");
			expect(device.name).to.equal("Device Name");
			expect(device.status).to.equal('255');
			expect(device.statusFormatted).to.equal("On");
			done();
		});
	});
});

describe('Device Commands', function(){
	var isy = require('../index.js')();
	
	before(function(done){
		sinon
			.stub(isy._restClient, "get", function(path, callback){
				if (path.match(/rest\/nodes\/[0-9A-F ]+\/cmd\/(DON|DOFF|DFON|DFOFF|[0-9]{1,3})/)) {
					callback('<RestResponse succeeded="true"><status>200</status></RestResponse>', "");
				} else {
					callback('<RestResponse succeeded="false"><status>404</status></RestResponse>', "");
				}
			});
		done();
	});
	it('turn on a light', function(done) {
		isy.sendDeviceCommand("12 34 56 7", "DON", function(err, statusCode){
			expect(err).to.be.null;
			expect(statusCode).to.equal("200");
			done();
		});
	});
	it('turn off a light', function(done) {
		isy.sendDeviceCommand("12 34 56 7", "DOFF", function(err, statusCode){
			expect(err).to.be.null;
			expect(statusCode).to.equal("200");
			done();
		});
	});
	it('turn fast on a light', function(done) {
		isy.sendDeviceCommand("12 34 56 7", "DOFF", function(err, statusCode){
			expect(err).to.be.null;
			expect(statusCode).to.equal("200");
			done();
		});
	});
	it('turn fast off a light', function(done) {
		isy.sendDeviceCommand("12 34 56 7", "DFOFF", function(err, statusCode){
			expect(err).to.be.null;
			expect(statusCode).to.equal("200");
			done();
		});
	});
	it('error on invalid command', function(done) {
		isy.sendDeviceCommand("12 34 56 7", "INVALID", function(err, statusCode){
			expect(err).to.be.an('Error');
			done();
		});
	});
});

describe('Program Commands', function(){
	var isy = require('../index.js')();
	
	before(function(done){
		sinon
			.stub(isy._restClient, "get", function(path, callback){
				if (path.match(/rest\/programs\/[0-9]+\/(runIf|runThen|runElse|stop|enable|disable)/)) {
					callback('<RestResponse succeeded="true"><status>200</status></RestResponse>', "");
				} else {
					callback('<RestResponse succeeded="false"><status>404</status></RestResponse>', "");
				}
			});
		done();
	});
	it('RunIf a program', function(done) {
		isy.sendProgramCommand("0001", "runIf", function(err, statusCode){
			expect(err).to.be.null;
			expect(statusCode).to.equal("200");
			done();
		});
	});
});