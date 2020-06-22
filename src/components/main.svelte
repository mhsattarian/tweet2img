<script>
  import nprogress from "nprogress";
  import "nprogress/nprogress.css";

  import ImageView from "./imageView.svelte";
  import Form from "./form.svelte";

  import { getNotificationsContext } from "svelte-notifications";
  const { addNotification } = getNotificationsContext();

  let imgSrc = "";
  let downloadLink = "";
  let url = "";

  async function handleSubmit(e) {
    const { tweetUrl, liked, dark, removeComments } = e.detail;

    if (!tweetUrl.length) return;
    else if (!new URL(tweetUrl).hostname.endsWith('twitter.com')) {
      addNotification({
        text: "Invalid URL",
        type: "danger",
        position: "bottom-right",
        removeAfter: 1500
      });

      return;
    }


    if (!imgSrc.length) URL.revokeObjectURL(imgSrc);

    nprogress.start();
    url = `/img?url=${tweetUrl}${dark ? "&theme=dark" : ""}${
      liked ? "&liked=true" : ""
    }${removeComments ? "&removeComments=true" : ""}`;
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        imgSrc = URL.createObjectURL(blob);
        nprogress.done();

        downloadLink = imgSrc;

        // var reader = new FileReader();
        // reader.addEventListener("loadend", () => {
        //   let contents = reader.result;
        //   imgSrc = contents;
        //   nprogress.done();
        // });
        // reader.readAsDataURL(blob);
      });
  }
</script>

<style>
  main {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    justify-content: space-between;
    align-items: center;
  }

  @media only screen and (max-width: 800px) {
    main {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr 1fr;
    }
  }
</style>

<main>
  <Form on:formsubmit={handleSubmit} />
  <ImageView src={imgSrc} {downloadLink} {url} />
</main>
