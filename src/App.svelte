<script>
  import nprogress from "nprogress";
  import "nprogress/nprogress.css";

  import ImageView from "./components/imageView.svelte";
  import Form from "./components/form.svelte";

  let imgSrc = "";

  async function handleSubmit(e) {
    const tweetUrl = e.detail.tweetUrl;
    if (!tweetUrl.length) return;

    nprogress.start();
    fetch(`/img?url=${tweetUrl}`)
      .then(response => response.blob())
      .then(blob => {
        var reader = new FileReader();
        reader.addEventListener("loadend", () => {
          let contents = reader.result;
          imgSrc = contents;
          nprogress.done();
        });
        reader.readAsDataURL(blob);
      });
  }

  function downloadImage() {
    if (!imgSrc.length) return;
    
    var url = imgSrc.replace(
      /^data:image\/[^;]+/,
      "data:application/octet-stream"
    );
    console.log(url);
    window.open(url);
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
  <ImageView src={imgSrc} on:click={downloadImage} />
</main>
