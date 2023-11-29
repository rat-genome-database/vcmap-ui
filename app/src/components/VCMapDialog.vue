<template>
  <Dialog 
    :header="props.header" 
    v-model:visible="isActive" 
    :class="wide ? 'vcmap-dialog-wide' : 'vcmap-dialog'"
    :breakpoints="{'960px': '75vw', '640px': '100vw'}"
    :draggable="false"
    :closable="false"
    :modal="true">
    <slot name="content">
      <p>{{props.message}}</p>
    </slot>
    <template #footer>
      <slot name="footer">
        <div class="grid">
          <div v-if="props.showBackButton" class="col-6 text-left">
            <Button label="Back to Configuration" :class="{'p-button-danger': (props.theme === 'error')}" class="p-button-outlined" @click="goToConfiguration" />
          </div>
          <div :class="props.showBackButton ? 'col-6' : 'col-12'">
            <Button :label="(props.showBackButton) ? 'Ok, proceed anyway' : 'Ok'" :class="{'p-button-danger': (props.theme === 'error')}" @click="onConfirm" autofocus />
          </div>
        </div>
      </slot>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

/**
 * Can use v-model:show to do 2 way binding
 */
interface Props 
{
  header: string;
  message?: string;
  show: boolean;
  theme?: 'error' | 'normal';
  showBackButton?: boolean;
  wide?: boolean;
  onConfirmCallback?: () => void;
}

interface Emits
{
  // eslint-disable-next-line
  (eventName: 'update:show', value: boolean): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const router = useRouter();

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

const goToConfiguration = () => {
  close();
  router.push('/');
};

const onConfirm = () => {
  close();
  if (props.onConfirmCallback)
  {
    props.onConfirmCallback();
  }
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

.vcmap-dialog-wide
{
  width: 90vw;
}
</style>