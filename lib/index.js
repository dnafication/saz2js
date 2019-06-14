const yauzl = require('yauzl');
const _ = require('lodash');
const convert = require('xml-js');

const filenamePattern = /^raw\/([0-9]+)_([csm])\.(txt|xml)$/;
const lineBreak = '\r\n';

let sessions = {};
let defaultOptions = {
  req: true, // determines if the sessions object will contain request data
  res: true, // determines if the sessions object will contain response data
  meta: true // determines if the sessions object will contain meta information
}

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
      response: {},
      meta: {}
    };
  }

  let session = sessions[sessionId];

  const headersArray = splittedHeaders.slice(1).map(headerSplit);
  const zipped = _.zip(...headersArray);
  const headers = _.zipObject(...zipped);

  const body = splittedResponse[1];

  // for client (or request) file
  if (type === 'c') {
    if (defaultOptions.req) {
      const urlData = parseRequestUrlData(_.first(splittedHeaders));
      _.merge(session.request, urlData);
      session.request.headers = headers;
      session.request.content = body;
    }

  }
  // for server (or response) file 
  else if (type === 's') {
    if (defaultOptions.res) {
      const urlData = parseResponseUrlData(_.first(splittedHeaders));
      _.merge(session.response, urlData);
      session.response.headers = headers;
      session.response.content = body;
    }
  }
  // for meta information file
  else if (type === 'm') {
    if (defaultOptions.meta) {
      const result = convert.xml2js(responseString, { compact: true });
      session.meta = result;
    }
  }
}

/**
 * the main function which parses the saz file and does a callback with sessions
 * 
 * @param {*} filePath path of the saz file
 * @param {*} options an object pass in behaviour, default options object is defined above.
 * @param {*} callback function which gets invoked on completion of parsing
 */
function parser(filePath, options, callback) {
  Object.assign(defaultOptions, { ...options })
  yauzl.open(filePath, { lazyEntries: true }, function (err, zipfile) {
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
    zipfile.on('error', function (err) {
      callback(err);
    });
    zipfile.on('entry', function (entry) {
      if (/\/$/.test(entry.fileName)) {
        // Directory file names end with '/'.
        // Note that entires for directories themselves are optional.
        // An entry's fileName implicitly requires its parent directories to exist.
        zipfile.readEntry();
      } else {
        // file entry
        if (filenamePattern.test(entry.fileName)) {
          let matches = filenamePattern.exec(entry.fileName);

          if (!matches || matches.length < 3) {
            zipfile.readEntry();
            return;
          }

          let sessionId = matches[1];
          let type = matches[2];
          let responseString = '';

          zipfile.openReadStream(entry, function (err, readStream) {
            if (err) callback(err);
            readStream.on('data', function (chunk) {
              responseString += chunk.toString('utf8');
            });
            readStream.on('end', function () {
              parseContent(sessionId, type, responseString);
              zipfile.readEntry();
            });
          });
        }
        else if (entry.fileName === "_index.htm") {
          // parse the _index.htm file in future if required.
          // console.log(entry);
          zipfile.readEntry();

        }
        else {
          zipfile.readEntry();
        }
      }
    });
    zipfile.on('close', function () {
      callback(null, sessions);
    });
  });
}

module.exports = parser;
