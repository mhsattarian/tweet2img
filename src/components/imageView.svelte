<script>
import { CopyIcon } from "svelte-feather-icons";

  export let src;
  export let downloadLink;
  export let url;

  let exampleSrc = '/img?url=https://twitter.com/fermatslibrary/status/1273977843937169413';
  let copyText = 'Permalink'

  function copy() {
    let prevCopyText = copyText;
    navigator.clipboard.writeText(location.origin + url).then(function() {
      copyText = 'Copied!';
      setTimeout(() => {
      copyText = prevCopyText;
    }, 700);
    /* clipboard successfully set */
  }, function() {
    copyText = 'Copy failed! :(';
      setTimeout(() => {
      copyText = prevCopyText;
    }, 700);
    /* clipboard write failed */
  });
}
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
      <p>click image to download - <a href={url} target="_blank" on:click|preventDefault={copy}><CopyIcon size="1x" /> {copyText}</a></p>
    {:else}
      <p>Example</p>
    {/if}
  </div>
</article>
