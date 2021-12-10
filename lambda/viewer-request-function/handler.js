const path = require('path')
const userAgent = require('useragent')
const querystring = require('querystring');

exports.handler = async (event, context, callback) => {
  const request = event.Records[0].cf.request
  const headers = request.headers

  // parse the querystrings key-value pairs. In our case it would be d=100x100
  const params = querystring.parse(request.querystring);

  // read the accept header to determine if webP is supported.
   const accept = headers['accept']?headers['accept'][0].value:"";

const userAgentString = headers['user-agent'] && headers['user-agent'][0] ? headers['user-agent'][0].value : null
const agent = userAgent.lookup(userAgentString)

// List is widely available on the web, Safair ommited due to OS incompatibilties
const browsersToInclude = [
  { browser: 'Chrome', version: 23 },
  { browser: 'Opera', version: 15 },
  { browser: 'Android', version: 53 },
  { browser: 'Chrome Mobile', version: 55 },
  { browser: 'Opera Mobile', version: 37 },
  { browser: 'UC Browser', version: 11 },
  { browser: 'Mobile Safari', version: 14 },
  { browser: 'Samsung Internet', version: 4 }
]

// Determine webp support
var supportingBrowser = false;
if (
    (accept.includes('webp')) 
    || ( browsersToInclude.find(browser => browser.browser === agent.family && agent.major >= browser.version))
  ) {
  supportingBrowser = true;
} 

  let fwdUri = request.uri
  request.headers['originalKey'] = [{
    key: 'originalKey',
    value: fwdUri.substring(1)
  }]

  // Default to no resize
  request.headers['dimensionIncluded'] = [{
    key: 'dimensionIncluded',
    value: 'false'
  }]

  if (supportingBrowser && params.d ) {
    // read the dimension parameter value = width x height and split it by 'x'
    const dimensionMatch = params.d.split("x");

    // set the width and height parameters
    let width = dimensionMatch[0];
    let height = dimensionMatch[1];

    request.headers['dimensionIncluded'] = [{
      key: 'dimensionIncluded',
      value: 'true'
    }]
    // fwdUri = url.join("/");
    fwdUri = fwdUri.replace(/(\.jpg|\.png|\.jpeg|\.webp)$/g, '_'+width+'x'+height+'.webp')
    // final modified url is of format image_100x100.webp
  } else if (supportingBrowser) {
    fwdUri = fwdUri.replace(/(\.jpg|\.png|\.jpeg)$/g, '.webp')
    // final modified url is of format image.webp
  }
  request.uri = fwdUri;
  request.query = request.querystring
  return callback(null, request)
}