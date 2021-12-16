<template>
  <div class="grid unpadded col-2">
    <div class="col-12">
      <h4>Data Tracks Loaded <span v-if="backboneDataTracks">({{backboneDataTracks.length}})</span></h4>
      <div class="data-tracks">
        <div v-for="dataTrack, index in backboneDataTracks" class="grid" :key="dataTrack.name">
          <div class="p-field-checkbox">
            <Checkbox v-model="dataTrack.isDisplayed" :id="dataTrack.name" @input="updateVisibility($event, index)" :binary="true"/>
            <label style="padding-left: .5em " :for="dataTrack.name">{{ dataTrack.name }}</label>
          </div>
          <div class="col-3">
            <ColorPicker :defaultColor="dataTrack.color" @change="updateColor($event, index)" />
          </div>
        </div>
        <div v-if="backboneDataTracks.length === 0">
          <p>No Data Tracks Loaded</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import DataTrack from '@/models/DataTrack';
import { ref, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

let backboneDataTracks = ref<DataTrack[]>([]);

watch(() => store.getters.getBackboneDataTracks, (newVal, oldVal) => {
  if (newVal !== oldVal)
  {
    backboneDataTracks.value = store.getters.getBackboneDataTracks;
  }
});

const updateColor = (event: any, index: number) => {
  let dataTrack = backboneDataTracks.value[index];
  dataTrack.color = event.value;
};

const updateVisibility = (value: any, index: number) => {
  let dataTrack = backboneDataTracks.value[index] as DataTrack;
  dataTrack.isDisplayed = value;

  updateStoreDataTracks(dataTrack);
};

const updateStoreDataTracks = (track: DataTrack) => {
  store.commit('changeDataTrack', track);
};

</script>

<style lang="scss" scoped>
.data-tracks
{
  margin-top: 1rem;
}

.track-color
{
  color: white;
  font-weight: bold;
  border-radius: 1rem;
}

.grid.unpadded
{
  padding: 0;
  div[class^="col-"]
  {
    padding-top: 0;
    padding-bottom: 0;
  }
}
</style>
