<template>
  <HeaderPanel />
  <div class="grid">
    <div class="col-9">
      <SVGViewbox />
    </div>
    <div class="col-3">
      <TooltipSVG :tooltip-data="store.state.tooltipData"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import SVGViewbox from '@/components/SVGViewbox.vue';
import HeaderPanel from '@/components/HeaderPanel.vue';
import TooltipSVG from '@/components/TooltipSVG.vue';
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);
</script>