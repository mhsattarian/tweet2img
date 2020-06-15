const fs = require('fs');

exports.handler = async (event, context, callback) => {
  console.log(process.env);
  console.log(process.env.CHROME);
  const test = fs.readdirSync('./');
  return { statusCode: 200, body: JSON.stringify(test) || 'undefined' };
};
