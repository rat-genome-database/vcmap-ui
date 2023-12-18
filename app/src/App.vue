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

.label.small
{
  font: normal 8px sans-serif;
}

.label.medium
{
  font: normal 11px sans-serif;
}

.label.bold
{
  font-style: bold;
}

/**
 * Make font size of floating input labels a little larger
 * when the input is filled
 */
.p-float-label
{
  .p-inputwrapper-filled ~ label {
    font-size: 1rem;
  }
}

button.p-button.p-component
{
  border-radius: 7px;
}
</style>
