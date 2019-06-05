# saz2js

A utility to convert fiddler capture (`.saz`) to js object.

The code is inspired by [node-saz-parser](https://github.com/ludoviclefevre/node-saz-parser), updated to use [yauzl](https://github.com/thejoshwolfe/yauzl) instead of `unzip`.

## Usage

1. install the package `npm i saz2js`
2. sample script

```javascript
const parser = require('saz2js');
parser('test.saz', function(err, sessions) {
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
    }
  }
  ...
};

```

That's it, really!
