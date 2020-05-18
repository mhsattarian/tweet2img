const chrome = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const fetch = require("node-fetch");

const exePath = "/usr/bin/google-chrome";

async function getOptions(isDev) {
  let options;
  if (isDev) {
    options = {
      args: ["--incognito"],
      executablePath: exePath,
      headless: true,
    };
  } else {
    options = {
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    };
  }
  return options;
}

async function getScreenshot(html, isDev) {
  const options = await getOptions(isDev);
  console.log("📸");
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();

  await page.setViewport({ width: 720, height: 1080 });
  await page.setContent(html, {
    waitUntil: ["networkidle0"],
  });

  // calculate the content bbox
  const rect = await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    const { x, y, width, height } = element.getBoundingClientRect();
    return { left: x, top: y, width, height, id: element.id };
  }, ".twitter-tweet");

  // screen shot only the rect
  let padding = 0;
  return page.screenshot({
    type: "jpeg",
    quality: 100,
    clip: {
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    },
  });
}

// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
exports.handler = async (event, context, callback) => {
  const url = event.queryStringParameters.url;
  const r = await fetch(
    `https://publish.twitter.com/oembed?url=${url}&hide_thread=true`
  ).then((r) => r.json());

  try {
    console.log("Getting screenshot");
    const isDev = process.env.CHROME === 'local' ? true : false;
    console.log(process.env.CHROME, {isDev})
    const photoBuffer = await getScreenshot(r.html, isDev);
    return {
      statusCode: 200,
      body: photoBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: err.toString() };
  }
};
