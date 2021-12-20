<template>
  <div class="grid unpadded col-2">
    <div class="col-12">
      <h4>Data Tracks Loaded <span v-if="backboneDataTracks">({{backboneDataTracks.length}})</span></h4>
      <div class="data-tracks">
        <div v-for="dataTrack, index in backboneDataTracks" class="grid" :key="dataTrack.name">
          <div v-if="!showComparativeTracks && !dataTrack.isComparativeView" class="grid">
            <div class="p-field-checkbox" style="height: 2.5em">
              <Checkbox style="margin-left: .2em;" v-model="dataTrack.isDisplayed" :id="dataTrack.name" @input="updateVisibility($event, index)" :binary="true"/>
              <label style="padding-left: .5em;" :for="dataTrack.name">{{ dataTrack.name }}</label>
            </div>
            <!-- <div class="col-2" style="height: 3em">
              <ColorPicker :defaultColor="dataTrack.color" @change="updateColor($event, index)" />
            </div> -->
          </div>
          <div v-else-if="showComparativeTracks" class="grid">
            <div class="p-field-checkbox" style="height: 2.5em">
              <Checkbox v-model="dataTrack.isDisplayed" :id="dataTrack.name" @input="updateVisibility($event, index)" :binary="true"/>
              <label style="padding-left: .5em;" :for="dataTrack.name">{{ dataTrack.name }}</label>
            </div>
            <!-- <div class="col-2" style="height: 3em">
              <ColorPicker :defaultColor="dataTrack.color" @change="updateColor($event, index)" />
            </div> -->
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
import { ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

let backboneDataTracks = ref<DataTrack[]>([]);
let showComparativeTracks = ref<boolean>(false);

onMounted(() => {
  if (store.getters.getBackboneDataTracks) {
    backboneDataTracks.value = store.getters.getBackboneDataTracks;
  }
});

watch(() => store.getters.getBackboneDataTracks, (newVal, ) => {
  backboneDataTracks.value = newVal;
});

watch(() => store.getters.getSelectedBackboneRegion, (newVal) => {
  if (newVal && backboneDataTracks.value.length)
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
  let dataTrack = backboneDataTracks.value[index] as DataTrack;
  dataTrack.isDisplayed = value;

  updateStoreDataTracks(dataTrack);
};

const updateStoreDataTracks = (track: DataTrack) => {
  store.commit('changeBackboneDataTrack', track);
};

</script>

<style lang="scss" scoped>
.data-tracks
{
  margin-top: 1rem;
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
