# saz2js

A utility to convert fiddler capture (`.saz`) to js object.

The code is inspired by [node-saz-parser](https://github.com/ludoviclefevre/node-saz-parser), updated to use [yauzl](https://github.com/thejoshwolfe/yauzl) instead of `unzip`.

## Usage

1. install the package `npm i saz2js`
2. sample node script

```javascript
const parser = require('saz2js');

const options = {
  req: true, // determines if the sessions object will contain request data
  res: true, // determines if the sessions object will contain response data
  meta: true // determines if the sessions object will contain meta information
}

parser('test.saz', options, function(err, sessions) {
  if (err) throw err;
  console.log(sessions);
});

// sessions object
{
  '09': {
    request: {
      method: 'GET',
      url: 'https://example.com?refresh=Refresh&url=true',
      protocol: 'HTTP/1.1',
      headers: {
        'Accepted': ''
        ...
      },
      content: 'body of request'
    },
    response: {
      protocol: 'HTTP/1.1',
      statusCode: '200',
      status: 'OK',
      headers: {
        ...
      },
      content: 'body of response'
    },
    meta: {
      _declaration: {
        _attributes: {
          version: "1.0",
          encoding: "utf-8"
        }
      },
      Session: {
        _attributes: {
          SID: "167",
          BitFlags: "19"
        },
      SessionTimers: {
          _attributes: {
            ClientConnected: "2019-06-07T11:24:55.8156275+10:00",
            ...
          }
        },
      PipeInfo: {
          _attributes: {
            CltReuse: "true",
            Reused: "true"
          }
        },
      SessionFlags: {
        SessionFlag: [
            {
              _attributes: {
                N: "x-processinfo",
                V: "chrome:6152"
              }
            },
            ...
          ]
        }
      }
    }
  }
  }
  ...
};

```

That's it, really!


