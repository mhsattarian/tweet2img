<script>
  import { createEventDispatcher } from "svelte";
  import Footer from "./footer.svelte";

  const dispatch = createEventDispatcher();
  let tweetUrl = "";
  let dark = false;
  let liked = false;
  let removeComments = false;

  function emitSubmit() {
    dispatch("formsubmit", {
      tweetUrl,
      dark,
      liked,
      removeComments
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

  article#query {
    display: grid;
    grid-template-rows: auto 60px;
    width: 100%;
    grid-template-columns: 1fr;
    justify-items: center;

  }

  article#query form {
    height: 10em;
    width: 90%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    position: relative;
  }

  #url {
    width: 100%;
    position: relative;
    height: 4em;
  }

  article#query form input[type="text"] {
    width: 100%;
    height: 100%;
    line-height: 20px;
    color: #24292e;
    vertical-align: middle;
    background-color: #fff;
    background-repeat: no-repeat;
    background-position: right 8px center;
    border: 1px solid #d1d5da;
    border-radius: 3em;
    outline: none;
    box-shadow: inset 0 1px 2px rgba(27, 31, 35, 0.075);
    padding: 1em;
  }

  article#query form button[type="submit"] {
    font-family: "Anicons Color", sans-serif;
    position: absolute;
    right: 0.5em;
    width: 3em;
    height: 3em;
    top: 50%;
    transform: translateY(-50%);
    -webkit-appearance: none;
    border: none;
    background: white;
    border-radius: 10px;
    padding: 1em;
  }

  article#query form button[type="submit"] .icon {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 3em;
    cursor: pointer;
  }

  #options {
    width: 100%;
    padding: 0 1em;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8em, 1fr));
    gap: 1em;
  }

  .icon {
    font-variation-settings: "TIME" 1;
    transition: font-variation-settings 0.4s ease;
  }
  .icon:hover {
    font-variation-settings: "TIME" 100;
  }

  @media only screen and (max-width: 800px) {
    #query {
      margin-top: 1em;
    }
  }
</style>

<article id="query">
  <form on:submit|preventDefault={emitSubmit}>
    <div id="url">
      <input
        bind:value={tweetUrl}
        type="text"
        placeholder="Tweet link"
        autocomplete="url"
        autofocus />
      <button type="submit">
        <span class="icon">I</span>
      </button>
    </div>
    <div id="options">
      <label title="enable dark theme">
        <input bind:checked={dark} type="checkbox" />
        Dark
      </label>
      <label title="make tweet liked">
        <input bind:checked={liked} type="checkbox" />
        liked
      </label>
      <label title="make tweet liked">
        <input bind:checked={removeComments} type="checkbox" />
        remove Comments
      </label>
    </div>
  </form>

  <Footer />
</article>
