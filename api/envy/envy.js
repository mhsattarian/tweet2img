const fs = require('fs');

exports.handler = async (event, context, callback) => {
  const test = fs.readdirSync('./');
  return { statusCode: 200, body: JSON.stringify(test) || 'undefined' };
};
