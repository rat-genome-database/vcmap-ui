<template>
    <div class="history-panel">
      <Dropdown
        v-model="selectedHistory" 
        :options="formattedHistory" 
        optionLabel="label" 
        @change="onHistorySelect($event.value)"
        placeholder="Select from history..." 
        :virtualScrollOptions="{itemSize: 30}"
        showClear
      >
      <template #option="slotProps">
        <div class="history-item">
          <div>
            {{ formattedHistory.length - slotProps.option.value }}. {{ slotProps.option.label }}
          </div>
          <div class="subscript">
            {{`${Formatter.timeAgo(slotProps.option.timestamp)}: ${slotProps.option.position.start}bp - ${slotProps.option.position.stop}bp `}}
          </div>
        </div>
      </template>
    </Dropdown>

      <template>
</template>

    </div>
  </template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import UserHistory from '@/models/UserHistory';
import { Formatter } from '../utils/Formatter';
import { BasePairRange } from '@/models/BackboneSelection';

interface HistoryItem {
  label: string;
  index: number;
  timestamp: number;
  position: BasePairRange;
  value: number;
}

const store = useStore(key);

const selectedHistory = ref<HistoryItem | null>(null);

watch(selectedHistory, (newHistoryItem) => {
  console.log('watch history', newHistoryItem);
});

const history = computed(() => store.state.history);

const formattedHistory = computed((): HistoryItem[] => {
  const historyLength = store.state.history.length;
  return store.state.history.map((entry, index) => {
    return {
      label: entry.source,
      index: historyLength - index,
      timestamp: entry.timestamp,
      position: entry.range,
      value: index
    };
  });
});



const onHistorySelect = ( selectedItem: HistoryItem ) => {
  if (selectedItem && selectedItem.value !== null) {
    selectedHistory.value = selectedItem;
    const entry: UserHistory = history.value[selectedItem.value];
    store.dispatch('setBackboneSelection', entry.backbone);
    store.dispatch('setDetailedBasePairRange', entry.range);
  }
};

</script>

<style lang="scss" scoped>

.history-item {
  display: flex;
  flex-direction: column;
  align-items: start;
}

.subscript {
  margin-top: 4px;
  font-size: smaller;
  font-style: italic;
}
</style>
