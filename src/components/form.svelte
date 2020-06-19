<script>
  import { createEventDispatcher } from "svelte";
  import Footer from './footer.svelte';

  const dispatch = createEventDispatcher();
  let tweetUrl = "";

  function emitSubmit() {
    dispatch("formsubmit", {
      tweetUrl
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
    height: 4em;
    width: 90%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: relative;
  }

  article#query form input {
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
  }

  article#query form input[type="text"] {
    padding: 1em;
  }

  article#query form button[type="submit"] {
    font-family: "Anicons Color", sans-serif;
    position: absolute;
    right: 0.5em;
    width: 4em;
    height: 3em;
    -webkit-appearance: none;
    border: none;
    background: white;
    border-radius: 10px;
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
    <input bind:value={tweetUrl} type="text" placeholder="Tweet link" autocomplete="url" autofocus />
    <button type="submit">
      <span class="icon">I</span>
    </button>
  </form>

  <Footer />
</article>
