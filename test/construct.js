/* jshint node: true */
'use strict';
var sinon = require('sinon');
var chai = require('chai');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);
var expect = require('chai').expect;

describe('ISY constructor', function () {

	it('should construct with default options', function () {
		var isy = require('../index.js')();

		expect(isy).to.be.an.object;
	});
	it('should construct with custom options', function () {
		var isy = require('../index.js')({
			host: 'anotherhost',
			port: '8080',
			https: 'true',
			user: 'user',
			pass: 'pass'
		});

        // TODO test that all of these options actually get used!
        expect(isy).to.be.an.object;
	});
});

describe('getDeviceInfo', function(){
	var isy = require('../index.js')();
    var stubRestGet;

	beforeEach(function(){
		stubRestGet = sinon.stub(isy._restClient, "get", function(path, callback){
            if (path.match(/device 1/)) {
                callback(
                    '<nodeInfo><node flag="128"><address>1</address><name>Device 1</name><parent type="3">8555</parent><type>1.32.64.0</type><enabled>true</enabled><deviceClass>0</deviceClass><wattage>0</wattage><dcPeriod>0</dcPeriod><pnode>1C AB 43 1</pnode><ELK_ID>A03</ELK_ID><property id="ST" value="255" formatted="On" uom="%/on/off"/></node><properties><property id="OL" value="255" formatted="100" uom="%/on/off"/><property id="RR" value="28" formatted="0.5 " uom="seconds"/><property id="ST" value="255" formatted="On" uom="%/on/off"/></properties></nodeInfo>',
                    {statusCode: 200}
                );
            } else if (path.match(/device 2/)) {
                callback(
                    '<nodeInfo><node flag="128"><address>2</address><name>Device 2</name><parent type="3">8555</parent><type>1.32.64.0</type><enabled>true</enabled><deviceClass>0</deviceClass><wattage>0</wattage><dcPeriod>0</dcPeriod><pnode>1C AB 43 1</pnode><ELK_ID>A03</ELK_ID><property id="ST" value="0" formatted="Off" uom="%/on/off"/></node><properties><property id="OL" value="255" formatted="100" uom="%/on/off"/><property id="RR" value="28" formatted="0.5 " uom="seconds"/><property id="ST" value="0" formatted="Off" uom="%/on/off"/></properties></nodeInfo>',
                    {statusCode: 200}
                );
            } else if (path.match(/server error/)) {
                callback(
                    '',
                    {statusCode: 500}
                );
            } else if (path.match(/malformed response/)) {
                callback(
                    'this is not XML',
                    {statusCode: 200}
                );
            } else if (path.match(/unexpected XML/)) {
                callback(
                    "<thisisxml>But it's not the data we're expecting</thisisxml>",
                    {statusCode: 200}
                );
            } else {
                callback(
                    '',
                    {statusCode: 404}
                );
            }
        });
	});

    afterEach(function() {
        stubRestGet.restore();
    });

	it("should get Device 1's info from API", function(done) {
		isy.getDeviceInfo("device 1", function(err, device){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.not.exist;
			expect(device.address).to.equal("1");
			expect(device.name).to.equal("Device 1");
			expect(device.status).to.equal('255');
			expect(device.statusFormatted).to.equal("On");
			done();
		});
	});

	it("should get Device 2's info from API", function(done) {
		isy.getDeviceInfo("device 2", function(err, device){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.not.exist;
			expect(device.address).to.equal("2");
			expect(device.name).to.equal("Device 2");
			expect(device.status).to.equal('0');
			expect(device.statusFormatted).to.equal("Off");
			done();
		});
	});

	it("should gracefully handle a server error (non-200 HTTP response)", function(done) {
		isy.getDeviceInfo("server error", function(err, device){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.exist
                .and.be.instanceOf(Error);
            expect(device).to.not.exist;
			done();
		});
	});

	it("should gracefully handle an unexpected response from the API (non-XML)", function(done) {
		isy.getDeviceInfo("malformed response", function(err, device){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.exist
                .and.be.instanceOf(Error);
            expect(device).to.not.exist;
			done();
		});
	});

	it("should gracefully handle an unexpected response from the API (XML, but not what we expect)", function(done) {
		isy.getDeviceInfo("unexpected XML", function(err, device){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.exist
                .and.be.instanceOf(Error);
            expect(device).to.not.exist;
			done();
		});
	});
});

describe('sendDeviceCommand', function(){
	var isy = require('../index.js')();
    var stubRestGet;

	beforeEach(function(done){
        stubRestGet = sinon.stub(isy._restClient, "get", function(path, callback){
            if (path.match(/device 1.*DON/)) {
                callback('<RestResponse succeeded="true"><status>200</status></RestResponse>', {statusCode: 200});
            } else if (path.match(/device 2.*DOF/)) {
                callback('<RestResponse succeeded="true"><status>200</status></RestResponse>', {statusCode: 200});
            } else if (path.match(/device 3.*DON/)) {
                callback('<RestResponse succeeded="false"><status>200</status></RestResponse>', {statusCode: 200});
            } else if (path.match(/server error/)) {
                callback('', {statusCode: 500});
            } else if (path.match(/malformed response/)) {
                callback('I am not XML', {statusCode: 200});
            } else if (path.match(/unexpected XML/)) {
                callback("<thisisxml>But it's not the data we're expecting</thisisxml>", {statusCode: 200});
            } else {
                callback('<RestResponse succeeded="false"><status>404</status></RestResponse>', {statusCode: 404});
            }
        });
		done();
	});

    afterEach(function() {
        stubRestGet.restore();
    });

	it('should send a DON command to a device', function(done) {
		isy.sendDeviceCommand("device 1", "DON", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
			expect(err).to.not.exist;
			expect(succeeded).to.be.true;
			done();
		});
	});

	it('should send a DOF command to a different device', function(done) {
		isy.sendDeviceCommand("device 2", "DOFF", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.not.exist;
			expect(succeeded).to.be.true;
			done();
		});
	});

	it('should report failure if the ISY says it could not issue the command', function(done) {
		isy.sendDeviceCommand("device 3", "DON", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.not.exist;
			expect(succeeded).to.be.false;
			done();
		});
	});

    it("should gracefully handle a server error (non-200 HTTP response)", function(done) {
        isy.sendDeviceCommand("server error", "DON", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.exist
                .and.be.instanceOf(Error);
            expect(succeeded).to.not.exist;
            done();
        });
    });

    it("should gracefully handle an unexpected response from the API (non-XML)", function(done) {
        isy.sendDeviceCommand("malformed response", "DON", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.exist
                .and.be.instanceOf(Error);
            expect(succeeded).to.not.exist;
            done();
        });
    });

    it("should gracefully handle an unexpected response from the API (XML, but not what we expect)", function(done) {
        isy.sendDeviceCommand("unexpected XML", "DON", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.exist
                .and.be.instanceOf(Error);
            expect(succeeded).to.not.exist;
            done();
        });
    });
});

describe('Program Commands', function(){
	var isy = require('../index.js')();
    var stubRestGet;

    beforeEach(function(done){
        stubRestGet = sinon.stub(isy._restClient, "get", function(path, callback){
            if (path.match(/program 1.*runIf/)) {
                callback('<RestResponse succeeded="true"><status>200</status></RestResponse>', {statusCode: 200});
            } else if (path.match(/program 2.*runElse/)) {
                callback('<RestResponse succeeded="true"><status>200</status></RestResponse>', {statusCode: 200});
            } else if (path.match(/program 3.*runThen/)) {
                callback('<RestResponse succeeded="false"><status>200</status></RestResponse>', {statusCode: 200});
            } else if (path.match(/server error/)) {
                callback('', {statusCode: 500});
            } else if (path.match(/malformed response/)) {
                callback('I am not XML', {statusCode: 200});
            } else if (path.match(/unexpected XML/)) {
                callback("<thisisxml>But it's not the data we're expecting</thisisxml>", {statusCode: 200});
            } else {
                callback('<RestResponse succeeded="false"><status>404</status></RestResponse>', {statusCode: 404});
            }
        });
        done();
    });

    afterEach(function() {
        stubRestGet.restore();
    });

    it('should send a runIf command to a device', function(done) {
        isy.sendProgramCommand("program 1", "runIf", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.not.exist;
            expect(succeeded).to.be.true;
            done();
        });
    });

    it('should send a runElse command to a different device', function(done) {
        isy.sendProgramCommand("program 2", "runElse", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.not.exist;
            expect(succeeded).to.be.true;
            done();
        });
    });

    it('should report failure if the ISY says it could not issue the command', function(done) {
        isy.sendProgramCommand("program 3", "runThen", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.not.exist;
            expect(succeeded).to.be.false;
            done();
        });
    });

    it("should gracefully handle a server error (non-200 HTTP response)", function(done) {
        isy.sendProgramCommand("server error", "DON", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.exist
                .and.be.instanceOf(Error);
            expect(succeeded).to.not.exist;
            done();
        });
    });

    it("should gracefully handle an unexpected response from the API (non-XML)", function(done) {
        isy.sendProgramCommand("malformed response", "DON", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.exist
                .and.be.instanceOf(Error);
            expect(succeeded).to.not.exist;
            done();
        });
    });

    it("should gracefully handle an unexpected response from the API (XML, but not what we expect)", function(done) {
        isy.sendProgramCommand("unexpected XML", "DON", function(err, succeeded){
            expect(stubRestGet).to.have.been.calledOnce;
            expect(err).to.exist
                .and.be.instanceOf(Error);
            expect(succeeded).to.not.exist;
            done();
        });
    });
});