<template>
    <div class="history-panel">
      History
      <!-- <ul>
        <li v-for="(entry, index) in history" :key="index" @click="revertToState(entry)">
          {{ formatHistoryEntry(entry) }}
        </li>
      </ul> -->
      <Dropdown
        v-model="selectedHistory"
        :options="formattedHistory"
        optionLabel="label"
        :virtualScrollOptions="{itemSize: 30}"
        showClear
        @change="onHistorySelect($event.value)"
        placeholder="Select From History"
      />
    </div>
  </template>

<script setup lang="ts">
import UserHistory from '@/models/UserHistory';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);

const selectedHistory = ref(null);

const history = computed(() => store.state.history);
console.log('HISTORY', history.value);

const formattedHistory = computed(() => {
  return store.state.history.map((entry, index) => {
    return {
      label: entry.source,
      value: index
    };
  });
});

const onHistorySelect = ( selectedItem ) => {
  if (selectedItem && selectedItem.value !== null) {
    const entry: UserHistory = history.value[selectedItem.value];
  
    store.dispatch('setBackboneSelection', entry.backbone);
    store.dispatch('setDetailedBasePairRange', entry.range);
  }
};

// const formatHistoryEntry = (entry: UserHistory) => {
//   console.log('ENTRY', entry);
//   return `${entry.source}`;
// };

// const clearHistory = () => {
//   store.dispatch('clearUserHistory');
// };

// const revertToState = (entry: UserHistory) => {
//   store.dispatch('setBackboneSelection', entry.backbone);
//   store.dispatch('setDetailedBasePairRange', entry.range);
// };
</script>

<style lang="scss" scoped>
.history-panel {
  margin: 10px;
  padding: 10px;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin: 5px 0;
  cursor: pointer;
}
li:hover {
  background-color: #79b0f4;
}
</style>
