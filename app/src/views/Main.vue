<template>
  <HeaderPanel />
  <div class="grid">
    <div class="col-9">
      <SVGViewbox />
    </div>
    <div class="col-3">
      <SelectedDataPanel :selected-data="store.state.selectedData"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import SVGViewbox from '@/components/SVGViewbox.vue';
import HeaderPanel from '@/components/HeaderPanel.vue';
import SelectedDataPanel from '@/components/SelectedDataPanel.vue';
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);
</script>