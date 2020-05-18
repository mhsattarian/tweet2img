exports.handler = async (event, context, callback) => {
  console.log(process.env.CHROME);
  return { statusCode: 200, body: process.env.CHROME || 'undefined' };
};
