<template>
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
  height: 4rem;
}

.version-label
{
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.grid
{
  &.unpadded
  {
    padding: 0;
    div[class^="col-"]
    {
      padding-top: 0.1rem;
      padding-bottom: 0;
    }
  }

  div.bold
  {
    font-weight: bold;
  }
}
</style>
