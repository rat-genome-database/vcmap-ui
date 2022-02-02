<template>
  <Dialog 
    :header="props.header" 
    v-model:visible="isActive" 
    class="vcmap-dialog" 
    :breakpoints="{'960px': '75vw', '640px': '100vw'}"
    :draggable="false"
    :closable="false"
    :modal="true">
    <p>{{props.message}}</p>
    <slot name="content">
      <p>{{props.message}}</p>
    </slot>
    <template #footer>
      <slot name="footer">
        <Button label="Ok" :class="{'p-button-danger': (props.theme === 'error')}" @click="close" autofocus />
      </slot>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * Can use v-model:show to do 2 way binding
 */
interface Props 
{
  header: string;
  message?: string;
  show: boolean;
  theme?: 'error' | 'normal'
}

interface Emits
{
  // eslint-disable-next-line
  (eventName: 'update:show', value: boolean): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isActive = computed({
  get() {
    return props.show;
  },
  set(value: boolean) {
    emit('update:show', value);
  }
});

const close = () => {
  emit('update:show', false);
};
</script>

<style lang="scss">
.vcmap-dialog
{
  width: 50vw;

  p
  {
    margin: 0;
  }
}
</style>