// @ts-check
const fetch = require('node-fetch').default;

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 503, body: 'Unsupported Request Method' };
  }
  const session = JSON.parse(event.body.trim());

  callback(null, { statusCode: 204, body: 'Success' });

  // TODO: #8 Check scheduledMessages.list for updated mob and remove scheduledMessage and rerun mob-scheduler @tbauman88
};
