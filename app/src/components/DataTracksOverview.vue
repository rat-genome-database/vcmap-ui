<template>
  <div class="grid unpadded col-2">
    <div class="col-12">
      <h4>Data Tracks Loaded <span v-if="store.state.backboneDataTracks">({{store.state.backboneDataTracks?.length}})</span></h4>
      <div class="grid unpadded">
        <div v-for="dataTrack, index in store.state.backboneDataTracks" class="col-12" :key="dataTrack.name">
          <div v-if="!showComparativeTracks && !dataTrack.isComparativeView">
            <div class="p-field-checkbox data-track-checkbox">
              <Checkbox v-model="dataTrack.isDisplayed" :id="dataTrack.name" @input="updateVisibility($event, index)" :binary="true"/>
              <label :for="dataTrack.name">{{ dataTrack.name }}</label>
            </div>
            <!-- <div class="col-2" style="height: 3em">
              <ColorPicker :defaultColor="dataTrack.color" @change="updateColor($event, index)" />
            </div> -->
          </div>
          <div v-else-if="showComparativeTracks">
            <div class="p-field-checkbox data-track-checkbox">
              <Checkbox v-model="dataTrack.isDisplayed" :id="dataTrack.name" @input="updateVisibility($event, index)" :binary="true"/>
              <label :for="dataTrack.name">{{ dataTrack.name }}</label>
            </div>
            <!-- <div class="col-2" style="height: 3em">
              <ColorPicker :defaultColor="dataTrack.color" @change="updateColor($event, index)" />
            </div> -->
          </div>   
        </div>
        <div v-if="store.state.backboneDataTracks == null || store.state.backboneDataTracks.length === 0">
          <p>No Data Tracks Loaded</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import DataTrack from '@/models/DataTrack';
import { key } from '@/store';
import { ref, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore(key);

let showComparativeTracks = ref<boolean>(true);

watch(() => store.state.selectedBackboneRegion, (newVal) => {
  if (newVal && store.state.backboneDataTracks?.length)
  {
    showComparativeTracks.value = true;
  }
});

/* const updateColor = (event: any, index: number) => {
  let dataTrack = backboneDataTracks.value[index];
  dataTrack.color = event.value;
  console.log(dataTrack);
}; */

const updateVisibility = (value: any, index: number) => {
  let dataTrack = store.state.backboneDataTracks[index] as DataTrack;
  dataTrack.isDisplayed = value;

  updateStoreDataTracks(dataTrack);
};

const updateStoreDataTracks = (track: DataTrack) => {
  store.commit('changeBackboneDataTrack', track);
};

</script>

<style lang="scss" scoped>
.data-track-checkbox
{
  height: 2em;
  label
  {
    padding-left: 0.5em;
  }
}
</style>
