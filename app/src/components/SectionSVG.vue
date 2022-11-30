<template>
  <!-- SVG definitions -->
  <defs>
    <linearGradient id="selectedStripes" gradientUnits="userSpaceOnUse"
      x2="5" spreadMethod="repeat" gradientTransform="rotate(-45)">
      <stop offset="0" stop-color="gray"/>
      <stop offset="0.40" stop-color="gray"/>
      <stop offset="0.40" stop-color="lightgray"/>
      <stop offset="1.0" stop-color="lightgray"/>
    </linearGradient>
  </defs>

  <!-- SVG content -->
  <template v-for="(blockSection, index) in region.syntenyBlocks" :key="index">
    <rect
      :y="blockSection.posY1"
      :x="posX"
      :width="width"
      :height="blockSection.height"
      :fill="'#00000'"
      :fill-opacity=".7"
    />
  </template>

  <template v-for="(datatrack, index) in region.datatrackSections" :key="index">
    <rect
      :y="datatrack.posY1"
      :x="posX + 50"
      :width="width/2"
      :height="datatrack.height"
      :fill="'#00000'"
      :fill-opacity=".7"
    />
  </template>

  <template v-for="(gapSection, index) in region.syntenyGaps" :key="index">
    <line
      class="section gap"
      :x1="posX + (width / 2)" :x2="posX + (width / 2)" 
      :y1="gapSection.posY1" :y2="gapSection.posY2" />
    />
  </template>
  
  <template v-if="!width">
    <template v-for="(section, index) in track.sections" :key="index">
      <!-- Level 1 or unleveled section -->
      <rect v-if="section.shape !== 'line' && section.chainLevel !== 2"
        data-test="track-section-svg"
        class="section"
        @mouseenter="onMouseEnter($event, section, 'trackSection')"
        @mouseleave="onMouseLeave(section, 'trackSection')"
        @click="onClick($event, section, 'trackSection')"
        :fill="getSectionFill(section)"
        :fill-opacity="geneDataTrack ? .7 : 1"
        :x="posX" :y="section.svgY" 
        :width="width" 
        :height="section.height" />
      <!-- Level 1 Gaps -->
      <line v-else-if="section.shape === 'line' && section.chainLevel !== 2"
        data-test="track-section-svg"
        class="section gap"
        :x1="posX + (width / 2)" :x2="posX + (width / 2)" 
        :y1="section.svgY" :y2="section.svgY2" />
      <!-- Level 2 -->
      <rect v-else-if="section.shape !== 'line'"
        data-test="track-section-svg"
        class="section level-2"
        @mouseenter="onMouseEnter($event, section, 'trackSection')"
        @mouseleave="onMouseLeave(section, 'trackSection')"
        :fill="section.isHovered ? HOVER_HIGHLIGHT_COLOR : section.color"
        :x="posX + ((width * (1 - LEVEL_2_WIDTH_MULTIPLIER)) / 2)" :y="section.svgY" 
        :width="width * LEVEL_2_WIDTH_MULTIPLIER" 
        :height="section.height" />
      <!-- Level 2 Gaps -->
      <line v-else-if="section.shape === 'line'"
        data-test="track-section-svg"
        class="section gap"
        :x1="posX + (width / 2)" :x2="posX + (width / 2)" 
        :y1="section.svgY" :y2="section.svgY2" />

      <!-- Chromosome Label -->
      <text v-if="showChromosome && section.height > 15 && section.shape !== 'line'" 
        class="chromosome-label" 
        :x="posX + (width / 2)" 
        :y="section.svgY + (section.height / 2)"
        dominant-baseline="middle"
        text-anchor="middle">
        {{section.chromosome}}
      </text>

      <!-- Syntenic Lines -->
      <template v-if="showSyntenyOnHover">
        <line v-if="section.isHovered"
        class="section connection-line"
        :x1="posX + width" :x2="SVGConstants.backboneXPosition" 
        :y1="section.svgY" :y2="(section.isInverted) ? section.svgY2 : section.svgY" />
      <line v-if="section.isHovered"
        class="section connection-line"
        :x1="posX + width" :x2="SVGConstants.backboneXPosition" 
        :y1="section.svgY2" :y2="(section.isInverted) ? section.svgY : section.svgY2" />
      </template>
    </template>
  </template>

</template>


<script lang="ts" setup>
  import { watch, onMounted} from 'vue';
  import SelectedData from '@/models/SelectedData';
  import OrthologLine from '@/models/OrthologLine';
  import SyntenyRegion from '@/new_models/SyntenyRegion';
  import SyntenySection from '@/new_models/SyntenicSection';
  import { toRefs } from '@vue/reactivity';
  import { useStore } from 'vuex';
  import SVGConstants from '@/utils/SVGConstants';
  import { key } from '@/store';
  import { sortGeneList, getNewSelectedData } from '@/utils/DataPanelHelpers';
  
  const LEVEL_2_WIDTH_MULTIPLIER = 0.75;
  const LABEL_Y_OFFSET = 3;
  const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
  const SELECTED_HIGHLIGHT_COLOR = '#FF4822';
  
  const store = useStore(key);
  
  interface Props 
  {
    showSyntenyOnHover?: boolean;
    showStartStop?: boolean;
    showChromosome?: boolean;
    showGeneLabel?: boolean;
    posX: number;
    width: number;
    lines?: OrthologLine[] | undefined;
    region?: SyntenyRegion;
  }
  const props = defineProps<Props>();
  
  //Converts each property in this object to its own reactive prop
  toRefs(props);



  const getLabelText = (label: any) => {
    if (!label.section.showAltLabel) {
      return label.text;
    } else {
      const selectedGeneIds = store.state.selectedGeneIds;
      const altLabelOptions = label.section.altLabels.filter((label) => selectedGeneIds.includes(label.rgdId));
      let newLabelText = label.text;
      for (let i = 0; i < altLabelOptions.length; i++) {
        newLabelText = altLabelOptions[i].text;
        // For now, just find the first label not starting iwth LOC
        // Unless its the only selected gene available
        if (!newLabelText.startsWith('LOC')) {
          break;
        }
      }
      return newLabelText;
    }
  };
</script>

<style lang="scss" scoped>

.section.gap
{
  stroke-width: 1;
  stroke: black;
}
</style>