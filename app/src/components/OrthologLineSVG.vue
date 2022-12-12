<template>
  <line
    class="ortholog-line"
    :stroke="(line.isSelected ? SELECTED_HIGHLIGHT_COLOR : 'lightgray')"
    :x1="line.posX1" :x2="line.posX2"
    :y1="line.posY1" :y2="line.posY2" 
  />
</template>

<script lang="ts" setup>
import OrthologLine from '@/models/OrthologLine';

const SELECTED_HIGHLIGHT_COLOR = '#FF4822';

interface Props
{
  line: OrthologLine;
}

defineProps<Props>();
</script>