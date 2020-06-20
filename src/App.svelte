<script>
  import nprogress from "nprogress";
  import "nprogress/nprogress.css";

  import ImageView from "./components/imageView.svelte";
  import Form from "./components/form.svelte";

  let imgSrc = "";
  let downloadLink = "";

  async function handleSubmit(e) {
    const {tweetUrl, liked, dark, removeComments} = e.detail;

    console.log({tweetUrl, liked, dark, removeComments});

    if (!tweetUrl.length) return;

    nprogress.start();
    let url = `/img?url=${tweetUrl}${dark ? '&theme=dark' : ''}${liked ? '&liked=true' : ''}${removeComments ? '&removeComments=true' : ''}`;
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

  function downloadImage() {
    if (!imgSrc.length) return;
    URL.revokeObjectURL(imgSrc);
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
  <ImageView src={imgSrc} downloadLink={downloadLink} on:click={downloadImage} />
</main>
