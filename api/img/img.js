// Code from https://github.com/leighhalliday/generate-og-image/blob/master/src/chromium.ts
// and https://github.com/wesbos/wesbos/blob/master/functions/ogimage/ogimage.js

const chrome = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const fetch = require("node-fetch");
const wait = require("waait");

const exePath = "/usr/bin/google-chrome";

async function getOptions(isDev) {
  let options;
  const awsOptions = chrome.args.push("--disable-web-security");
  if (isDev) {
    console.log("on dev");
    options = {
      args: ["--incognito", "--disable-web-security"],
      executablePath: exePath,
      headless: true,
    };
  } else {
    options = {
      args: awsOptions,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    };
  }
  return options;
}

async function getScreenshot(html, isDev, theme, liked, removeComments) {
  const options = await getOptions(isDev);
  console.log("📸");
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  // await page.addStyleTag({url: 'https://tweet2img.netlify.app/theme.css'});

  await page.setViewport({ width: 720, height: 1920, deviceScaleFactor: 1.5 });
  await page.setContent(html, {
    // waitUntil: ["networkidle0", "domcontentloaded"],
  });

  // calculate the content bbox
  const rect = await page.evaluate(
    (selector, liked, removeComments) => {
      const element = document.querySelector(selector);
      try {
        // element.shadowRoot.querySelector(".SandboxRoot").style.fontFamily =
        //   "Vazir";
        const _d = element.childNodes[0].contentDocument;
        // _d.head.innerHTML +=
        //   '<link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v26.0.2/dist/font-face.css">';
        var link = _d.createElement("link");
        link.id = "id2";
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v26.0.2/dist/font-face.css";
        _d.head.appendChild(link);
        // _d.body.style.fontFamily = "Vazir !important";

        var css = `div[lang="fa"] {
        font-family: Vazir !important;
        color: red;
        }`;
        style = document.createElement("style");

        _d.head.appendChild(style);

        style.type = "text/css";
        if (style.styleSheet) {
          // This is required for IE8 and below.
          style.styleSheet.cssText = css;
        } else {
          style.appendChild(document.createTextNode(css));
        }
      } catch (err) {
        console.log(err);
      }

      if (liked) {
        const heartEl = element.shadowRoot.querySelector(
          "a[title='Like'] div div"
        );
        heartEl.style.webkitMaskImage = window.getComputedStyle(
          heartEl
        ).backgroundImage;
        heartEl.style.webkitMaskSize = "18px";
        heartEl.style.backgroundColor = "red";
        heartEl.style.backgroundBlendMode = "lighten";
      }

      if (removeComments) {
        element.shadowRoot.querySelector(".CallToAction").remove();
      }

      const { x, y, width, height } = element.getBoundingClientRect();
      return { left: x, top: y, width, height, id: element.id };
    },
    ".twitter-tweet",
    liked,
    removeComments
  );

  await page.evaluate((theme) => {
    document.body.style.background = theme === "light" ? "white" : "black";
  }, theme);

  // if (isDev) await wait(700);
  // // local is slower to render font
  // else await wait(100);

  // await wait(700);
  await page.waitForNavigation({
    waitUntil: "networkidle0",
  });

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
  const theme = event.queryStringParameters.theme || "light";
  const liked = event.queryStringParameters.liked === "true" ? true : false;
  const removeComments =
    event.queryStringParameters.removeComments === "true" ? true : false;

  console.log(liked, removeComments);

  const r = await fetch(
    `https://publish.twitter.com/oembed?url=${url}&hide_thread=true&theme=${theme}`
  ).then((r) => r.json());

  try {
    const isDev = process.env.CHROME === "local" ? true : false;
    let html =
      '<link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v26.0.2/dist/font-face.css">' +
      r.html;

    // html.replace("https://platform.twitter.com", "");

    const photoBuffer = await getScreenshot(
      html,
      isDev,
      theme,
      liked,
      removeComments
    );
    return {
      statusCode: 200,
      body: photoBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    callback(err, null);
  }
};
