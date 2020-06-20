<script>
  export let src;
  export let downloadLink;
  let exampleSrc = '/img?url=https://twitter.com/fermatslibrary/status/1273977843937169413';
</script>

<style>
  article {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  article#image {
    background-color: #fbfbfb;
    padding: 2em;
  }

  img {
    max-width: 100%;
    max-height: 100%;
    cursor: pointer;
  }

  #image-wrapper {
  }
</style>

<article id="image">
  <div id="image-wrapper">
    <a href={downloadLink || '#'} download={downloadLink ? 'tweet.jpg' : null} ><img src={src || exampleSrc} /></a>
    {#if src.length}
      <p>click image to download</p>
    {:else}
      <p>Example</p>
    {/if}
  </div>
</article>
