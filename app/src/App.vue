<template>
  <div class="row header">
    <div class="flex md12">
      <img alt="VCMap Logo" class="logo" src="./assets/images/vcmap_logo_v2.jpg">
    </div>
  </div>
  <va-divider />
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

.header.row
{
  padding: 0.5rem;
}

.row>.flex
{
  &.right-aligned
  {
    text-align: right;
  }
  &.left-aligned
  {
    text-align: left;
  }
  &.center-aligned
  {
    text-align: center;
  }
}
</style>
