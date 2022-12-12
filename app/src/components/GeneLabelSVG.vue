<template>
  <text
    class="label small"
    :x="(label.posX + 5)"
    :y="(label.posY)"
    dominant-baseline="middle"
    text-anchor="start"
  >
    {{label.text}}
  </text>
</template>

<script lang="ts" setup>
import { GeneLabel } from '@/new_models/Label';

interface Props
{
  label: GeneLabel;
}
defineProps<Props>();

</script>