import { onMounted, ref } from "vue";
import { getMousePosSVG } from '@/utils/SVGHelpers';
import { Store } from "vuex";
import { VCMapState } from "@/store";
import TrackSet from "@/models/TrackSet";
import BackboneSelection, { SelectedRegion } from "@/models/BackboneSelection";

export default function useOverviewPanelSelection(store: Store<VCMapState>) {
  let inSelectMode = false;
  let startingPoint: DOMPoint | { y: number, x: number };
  const startOverviewSelectionY = ref<number>();
  const stopOverviewSelectionY = ref<number>();
  let svg: SVGSVGElement | null;

  onMounted(() => {
    svg = document.querySelector('svg');
  });

  const initOverviewSelection = (event: any) => {
    if (store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating)
    {
      // Don't allow a selection until both panels are done updating
      return;
    }

    inSelectMode = true;
    startingPoint = getMousePosSVG(svg, event);
    startOverviewSelectionY.value = startingPoint.y;
  };

  const updateOverviewSelection = (event: any) => {
    if (!inSelectMode) return;

    const currentSVGPoint = getMousePosSVG(svg, event);

    if (currentSVGPoint.y < startingPoint.y)
    {
      // We are moving above the starting point
      startOverviewSelectionY.value = currentSVGPoint.y;
      stopOverviewSelectionY.value = startingPoint.y;
    }
    else
    {
      // We are moving below the starting point
      stopOverviewSelectionY.value = currentSVGPoint.y;
    }
  };

  const completeOverviewSelection = (overviewTrackSets: TrackSet[]) => {
    if (!inSelectMode || overviewTrackSets.length === 0) return;

    inSelectMode = false;

    const backboneTracks = overviewTrackSets.filter(set => set.speciesTrack.type === 'backbone');
    if (backboneTracks.length === 0)
    {
      return;
    }

    // Only 1 backbone track section should exist in the overview track sets
    const backboneOverviewTrackSection = backboneTracks[0].speciesTrack.sections[0] ?? null;
    if (startOverviewSelectionY.value != null && stopOverviewSelectionY.value != null && backboneOverviewTrackSection != null)
    {
      // Calculate start/stop base pairs based on bp to height ratio in the detailed panel
      const startingBasePairCountFromStartOfBackbone = Math.floor((startOverviewSelectionY.value - backboneOverviewTrackSection.svgY) * store.state.overviewBasePairToHeightRatio);
      let basePairStart = startingBasePairCountFromStartOfBackbone + backboneOverviewTrackSection.sectionStart;

      const stoppingBasePairCountFromStartOfBackbone = Math.floor((stopOverviewSelectionY.value - backboneOverviewTrackSection.svgY) * store.state.overviewBasePairToHeightRatio);
      let basePairStop = stoppingBasePairCountFromStartOfBackbone + backboneOverviewTrackSection.sectionStart;

      let startSVGY = startOverviewSelectionY.value;
      if (basePairStart < backboneOverviewTrackSection.sectionStart)
      {
        basePairStart = backboneOverviewTrackSection.sectionStart;
        startSVGY = backboneOverviewTrackSection.svgY;
      }

      let stopSVGY = stopOverviewSelectionY.value;
      if (basePairStop > backboneOverviewTrackSection.sectionStop)
      {
        basePairStop = backboneOverviewTrackSection.sectionStop;
        stopSVGY = backboneOverviewTrackSection.svgY2;
      }

      const selectedBackboneRegion = new BackboneSelection(new SelectedRegion(startSVGY, stopSVGY - startSVGY, basePairStart, basePairStop), store.state.chromosome ?? undefined);
      selectedBackboneRegion.generateInnerSelection(basePairStart, basePairStop, store.state.overviewBasePairToHeightRatio);
      store.dispatch('setSelectedBackboneRegion', selectedBackboneRegion);
      store.dispatch('setDetailedBasePairRange', { start: basePairStart, stop: basePairStop });
    }

    // Clear selection box
    startOverviewSelectionY.value = undefined;
    stopOverviewSelectionY.value = undefined;
  };

  return {
    startOverviewSelectionY,
    stopOverviewSelectionY,
    initOverviewSelection,
    updateOverviewSelection,
    completeOverviewSelection
  };
}