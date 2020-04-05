const chrome = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const waait = require("waait");

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

async function getScreenshot(url, isDev) {
  const options = await getOptions(isDev);
  console.log("📸");
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  // console.log(page);
  await page.setViewport({ width: 720, height: 720 });
  // await page.goto(url, {waitUntil: 'networkidle0'});
  await page.goto(url);
  await page.waitForSelector("article");
  let box = await page.evaluate(() => {
    let a = document.querySelectorAll("article")[0];
    let b = document.querySelector("#react-root");
    b.replaceWith(a);
    // document.querySelector(".r-k200y").remove();
    // document.querySelector(".r-a2tzq0").remove();

    const { x, y, width, height } = a.getBoundingClientRect();
    return {  x,  y, width, height };
  });
  await waait(2500);
  return page.screenshot({ type: "jpeg", quality: 100,  });
}

// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
exports.handler = async (event, context) => {
  try {
    console.log("Getting screenshot");
    const photoBuffer = await getScreenshot(
      "https://twitter.com/hosseinst/status/1205228752101355539",
      true
    );
    return {
      statusCode: 200,
      body: photoBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: err.toString() };
  }
};
