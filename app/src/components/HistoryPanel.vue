<template>
    <div class="history-panel">
      <Dropdown
        v-model="selectedHistory" 
        :options="formattedHistory" 
        optionLabel="label" 
        @change="onHistorySelect($event.value)" 
        @focus="refreshHistory"
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
            {{`${slotProps.option.timestamp}: ${slotProps.option.position.start}bp - ${slotProps.option.position.stop}bp `}}
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

const store = useStore(key);

const selectedHistory = ref(null);

// Used to cause a refresh each time dropdown is used for accurate time
const refreshCounter = ref(0);
const refreshHistory = () => refreshCounter.value++;
watch(refreshCounter, () => {
});

const history = computed(() => store.state.history);

const formattedHistory = computed(() => {
  console.log(refreshCounter.value);
  const historyLength = store.state.history.length;
  return store.state.history.map((entry, index) => {
    return {
      label: entry.source,
      index: historyLength - index,
      timestamp: Formatter.timeAgo(entry.timestamp),
      position: entry.range,
      value: index
    };
  });
});



const onHistorySelect = ( selectedItem: any ) => {
  if (selectedItem && selectedItem.value !== null) {
    selectedHistory.value = selectedItem;
    const entry: UserHistory = history.value[selectedItem.value];
    store.dispatch('setBackboneSelection', entry.backbone);
    store.dispatch('setDetailedBasePairRange', entry.range);
  } else {
    selectedHistory.value = null;
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
