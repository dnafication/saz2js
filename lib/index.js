const yauzl = require('yauzl');
const _ = require('lodash');

const filenamePattern = /^raw\/([0-9]+)_([cs])\.txt$/;
const lineBreak = '\r\n';

let sessions = {};

function headerSplit(header) {
  return header.split(': ');
}

function parseRequestUrlData(urlData) {
  var arr = urlData.split(' ');
  return {
    method: arr[0],
    url: arr[1],
    protocol: arr[2]
  };
}

function parseResponseUrlData(urlData) {
  var arr = urlData.split(' ');
  return {
    protocol: arr[0],
    statusCode: arr[1],
    status: arr[2]
  };
}

function parseContent(sessionId, type, responseString) {
  const splittedResponse = responseString.split(lineBreak + lineBreak);
  const splittedHeaders = splittedResponse[0].split(lineBreak);

  if (!(sessionId in sessions)) {
    sessions[sessionId] = {
      request: {},
      response: {}
    };
  }

  let session = sessions[sessionId];

  const headersArray = splittedHeaders.slice(1).map(headerSplit);
  const zipped = _.zip(...headersArray);
  const headers = _.zipObject(...zipped);

  const body = splittedResponse[1];

  if (type === 'c') {
    const urlData = parseRequestUrlData(_.first(splittedHeaders));
    _.merge(session.request, urlData);
    session.request.headers = headers;
    session.request.content = body;
  } else if (type === 's') {
    const urlData = parseResponseUrlData(_.first(splittedHeaders));
    _.merge(session.response, urlData);
    session.response.headers = headers;
    session.response.content = body;
  }
}

function parser(filePath, callback) {
  yauzl.open(filePath, { lazyEntries: true }, function(err, zipfile) {
    if (err) {
      if (
        err.message.startsWith(
          'end of central directory record signature not found'
        )
      ) {
        console.log('not a valid zip/saz archive');
      }
      callback(err);
    }
    zipfile.readEntry();
    zipfile.on('error', function(err) {
      callback(err);
    });
    zipfile.on('entry', function(entry) {
      if (/\/$/.test(entry.fileName)) {
        // Directory file names end with '/'.
        // Note that entires for directories themselves are optional.
        // An entry's fileName implicitly requires its parent directories to exist.
        zipfile.readEntry();
      } else {
        // file entry
        if (filenamePattern.test(entry.fileName)) {
          let matches = filenamePattern.exec(entry.fileName);

          if (!matches || matches.length !== 3) {
            zipfile.readEntry();
            return;
          }

          let sessionId = matches[1];
          let type = matches[2];
          let responseString = '';

          zipfile.openReadStream(entry, function(err, readStream) {
            if (err) callback(err);
            readStream.on('data', function(chunk) {
              responseString += chunk.toString('utf8');
            });
            readStream.on('end', function() {
              parseContent(sessionId, type, responseString);
              zipfile.readEntry();
            });
          });
        } else {
          zipfile.readEntry();
        }
      }
    });
    zipfile.on('close', function() {
      callback(null, sessions);
    });
  });
}

module.exports = parser;
