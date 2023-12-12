<template>
  <Dialog
    v-model:visible="isActive"
    :draggable="false"
    :closable="false"
    :modal="true"
  >
    <template #header>
      Settings
    </template>
    <template #footer>
      <Button
        label="Cancel"
        class="p-button-danger"
        @click="close"
      />
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
  show: boolean;
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
}

</script>
