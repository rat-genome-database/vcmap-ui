<template>
  <div class="grid">
    <div class="col-12">
      <img alt="VCMap Logo" class="logo" src="./assets/images/vcmap_logo_v2.jpg">
    </div>
  </div>
  <Divider />
  <router-view/>
</template>

<style lang="scss">
/** Project wide SCSS */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.logo
{
  max-height: 100px;
}
</style>
