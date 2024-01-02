<template>
  <div class="grid">
    <div class="col-12 app-header border-bottom-1 border-bottom-solid">
      <img alt="VCMap Logo" class="logo" :class="{'clickable': isOnMainViewerPage}" src="../assets/images/vcmap_logo_v2.png" @click="goToConfigPage">
      <Tag class="vcmap-tag" icon="pi pi-tag" severity="info" rounded>v{{ VERSION }}</Tag>
      <a class="logo-link" href="https://rgd.mcw.edu/" target="_blank"><img class="rgd-logo" src="../assets/images/rgd_logo.png" alt="RGD logo"></a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VERSION } from '@/version';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isOnMainViewerPage = computed(() => {
  return router.currentRoute.value.name === 'Main';
});

const goToConfigPage = () => {
  router.push('/');
};
</script>

<style lang="scss" scoped>
.app-header
{
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  .header
  {
    margin-left: 2rem;
  }
  .rgd-logo {
    margin-left: auto;
    width: 50%;
  }
  .logo-link {
    margin-left: auto;
    text-align: right;
  }
}

.logo
{
  height: 2.8rem;
  &.clickable {
    cursor: pointer;
  }
}

.p-tag.vcmap-tag {
  font-size: 10px;
  margin-left: 0.5rem;
}
</style>