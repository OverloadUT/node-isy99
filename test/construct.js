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
			port: 8080,
			https: true,
			user: 'user',
			pass: 'pass'
		});
		expect(isy._host).to.equal('anotherhost');
		expect(isy._port).to.equal(8080);
		expect(isy._https).to.equal(true);
		expect(isy._user).to.equal('user');
		expect(isy._pass).to.equal('pass');
		done();
	});
});

describe('Get Nodes', function(){
	before(function(done){
		sinon
			.stub(rest_client, "get", function(device, args, callback){
				callback('<nodeInfo><node flag="128"><address>1C AB 43 1</address><name>LR Track Lights Rear</name><parent type="3">8555</parent><type>1.32.64.0</type><enabled>true</enabled><deviceClass>0</deviceClass><wattage>0</wattage><dcPeriod>0</dcPeriod><pnode>1C AB 43 1</pnode><ELK_ID>A03</ELK_ID><property id="ST" value="255" formatted="On" uom="%/on/off"/></node><properties><property id="OL" value="255" formatted="100" uom="%/on/off"/><property id="RR" value="28" formatted="0.5 " uom="seconds"/><property id="ST" value="255" formatted="On" uom="%/on/off"/></properties></nodeInfo>', "");
			});
		done();
	});
	it('get a node', function(done) {
		var isy = require('../index.js')();
		isy.getNode("1C AB 43 1", function(err, device){
			expect(device.address).to.equal("1C AB 43 1");
			done();
		});
	});
});