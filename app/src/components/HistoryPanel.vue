<template>
    <div class="history-panel">
      History
      <ul>
        <li v-for="(entry, index) in history" :key="index" @click="revertToState(entry)">
          {{ formatHistoryEntry(entry) }}
        </li>
      </ul>
      <Button
              @click="clearHistory"
            />
    </div>
  </template>

<script setup lang="ts">
import UserHistory from '@/models/UserHistory';
import { computed } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);

const history = computed(() => store.state.history);

console.log('HISTORY', history.value);

const formatHistoryEntry = (entry: UserHistory) => {
  console.log('ENTRY', entry);
  return `Entry`;
};

const clearHistory = () => {
  store.dispatch('clearUserHistory');
};

const revertToState = (entry: UserHistory) => {
  // store.dispatch('setDetailedBasePairRequest', entry.range);
};
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
  background-color: #f0f0f0;
}
</style>
