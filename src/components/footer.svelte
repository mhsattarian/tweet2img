<script>
  import { TwitterIcon, GithubIcon, ZapIcon } from "svelte-feather-icons";
</script>

<style>
footer {
      width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
  #creds {
    display: grid;
    width: 50%;
    height: 100%;
    grid-template-columns: repeat(auto-fit, 1.5em);
    grid-gap: 1em;
    justify-content: center;
    align-items: center;
  }
  #logo {
    display: inline-block;
    width: 1.5em;
    height: 1.5em;
    background: url(http://mhsattarian.com/src/assets/logo.png) no-repeat center
      center;
    background-size: cover;
  }
</style>

<footer>
  <div id="creds">
    <a href="https://mhsattarian.com"><i id="logo" /></a>
    <a href="https://twitter.com/mh_sattarian"><TwitterIcon size="1.5x" /></a>
    <a href="https://github.com/mhsattarian/tweet2img"><GithubIcon size="1.5x" /></a>
    <a href="https://t.me/tweet2img_bot"><ZapIcon size="1.5x" /></a>
  </div>
</footer>
