<template>
  <VCMapDialog
    v-model:show="isActive"
    :wide="true"
    header="Settings"
  >
    <template #content>
      <Accordion :multiple="true">
        <AccordionTab header="Species Configuration">
          <SpeciesConfig @species-change="handleSpeciesChange"/>
        </AccordionTab>
        <AccordionTab header="Data Tracks">
          <LoadDataTrackControls
            :variant-positions-list="variantPositionsList"
            @variant-change="handleVariantChange"
            @remove-variants="handleRemovedVariants"
          />
        </AccordionTab>
      </Accordion>
    </template>
    <template #footer>
      <Button
        label="Cancel"
        class="p-button-danger"
        @click="close"
      />
      <Button
        label="Save"
        class="p-button-success"
        @click="save"
      />
    </template>
  </VCMapDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SpeciesConfig from './SpeciesConfig.vue';
import Species from '@/models/Species';
import VariantPositions from '@/models/VariantPositions';
import VCMapDialog from './VCMapDialog.vue';
import LoadDataTrackControls from './LoadDataTrackControls.vue';

/**
 * Can use v-model:show to do 2 way binding
 */
 interface Props 
{
  show: boolean;
  variantPositionsList: VariantPositions[];
}

interface Emits
{
  // eslint-disable-next-line
  (eventName: 'update:show', value: boolean): void
  (eventName: 'species-change', newSpeciesOrder: any, newComparativeSpecies: Species[]): void,
  (eventName: 'variant-change', newMapKeys: number[]): void,
  (eventName: 'remove-variants', removedMapKey: number): void,
  (eventName: 'save-click') : void,
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

const save = () => {
  emit('save-click');
  close();
};

const handleSpeciesChange = (newSpeciesOrder: any, newComparativeSpecies: Species[]) => {
  emit('species-change', newSpeciesOrder, newComparativeSpecies);
};

const handleVariantChange = (newMapkeys: number[]) => {
  emit('variant-change', newMapkeys);
};

const handleRemovedVariants = (removedMapKey: number) => {
  emit('remove-variants', removedMapKey);
}

</script>
