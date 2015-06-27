[![Travis](https://img.shields.io/travis/OverloadUT/node-isy99.svg?style=flat-square)](https://travis-ci.org/OverloadUT/node-isy99)
[![Coveralls](https://img.shields.io/coveralls/OverloadUT/node-isy99.svg?style=flat-square)](https://coveralls.io/r/OverloadUT/node-isy99)

# node-isy99

Node module for accessing ISY99 home automation controller APIs.

## Installation

```bash
$ npm install isy99
```

## Usage

```javascript
var isy = require("isy99")({host:'hostname',
                            user:'username',
                            pass:'password'
                          });

isy.getDeviceInfo('11 22 33 4', function(err, device) {
  console.log(device.address); // '11 22 33 4'
  console.log(device.name); // 'Kitchen Lights'
  console.log(device.enabled); // true
  console.log(device.status); // 255
  console.log(device.statusFormatted); // 'On'
});

isy.sendDeviceCommand('11 22 33 4', 'DON', function(err, success) {
  if(success) {
    console.log('The light was turned on!')
  }
});

isy.sendProgramCommand('1023', 'runIf', function(err, success) {
  if(success) {
    console.log("The program's 'If' logic was run");
  }
});
```
