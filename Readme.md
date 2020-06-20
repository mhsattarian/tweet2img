# tweet2img

![Loading...](/assets/header.jpeg)

Generate an image from a tweet, so that it can be easier to share! ¯\\\_(ツ)_/¯

this project uses twitter embed public API, so there is **no need for apiKey** or such thing. it is running on a **netlify serverless funciton** and uses *puppeteer* to open the embed page and take a *screenshot*.

## Usage

copy link of a tweet and place at the end:

```
https://tweet2img.netlify.app/img?url=<HERE>
```

## Params

- `theme=dark` enables dark theme.
- `liked=true` makes tweet liked.
- `removeComments=true` removes comments section.

## examples

live example of [this tweet](https://twitter.com/Mehdi70501002/status/1262117721090785280):

```
https://tweet2img.netlify.app/img?url=https://twitter.com/Mehdi70501002/status/1262117721090785280&removeComments=true
```

![Loading...](https://tweet2img.netlify.app/img?url=https://twitter.com/Mehdi70501002/status/1262117721090785280&removeComments=true)

live example of [this tweet](https://twitter.com/fermatslibrary/status/1271069698088632321?s=19):

```
https://tweet2img.netlify.app/img?theme=dark&url=https://twitter.com/fermatslibrary/status/1271069698088632321?s=19
```

![Loading...](https://tweet2img.netlify.app/img?theme=dark&url=https://twitter.com/fermatslibrary/status/1271069698088632321?s=19)

