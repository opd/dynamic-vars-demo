<template>
  <div id="app">
    <div class="container">
      <div class="test-mix" />
      <span>Primary:</span>
      <input v-model="palette.primary" />
      <br />
      <span>Danger:</span>
      <input v-model="palette.danger" />
      <br />
      <button class="btn btn-primary" @click="onClick">Apply style</button>

      <div class="alert alert-danger" role="alert">
        <b>Alert</b> danger
      </div>

      <div>
        <!-- Single button -->
        <div class="btn-group">
          <button class="btn btn-primary">Primary</button>
          <button class="btn btn-success">Success</button>
          <button class="btn btn-info">Info</button>
          <button class="btn btn-warning">Warning</button>
          <button class="btn btn-danger">Danger</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import renderCss from "./colors";
import dynamicVars from "./assets/scss/site.dcss";


export default {
  name: 'app',
  components: {
  },
  data() {
    return {
      palette: {
        primary: "#0000ff",
        danger:  "#ff0000",
      },
    }
  },
  methods: {
    calculateStyle() {
      const style = renderCss(
        dynamicVars.template,
        dynamicVars.rules,
        this.palette,
        '#app',
      );
      return style;
    },
    onClick() {
      document.getElementById('page-style').innerHTML = this.calculateStyle();
    },
  },
}
</script>

<style lang="scss">
@import "./assets/scss/site";
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
