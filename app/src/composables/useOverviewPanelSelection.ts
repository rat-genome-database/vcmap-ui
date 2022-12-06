import { onMounted, ref } from "vue";
import { getMousePosSVG } from '@/utils/SVGHelpers';
import { Store } from "vuex";
import { VCMapState } from "@/store";
import TrackSet from "@/models/TrackSet";
import BackboneSelection, { SelectedRegion } from "@/models/BackboneSelection";
import BackboneSection from "@/new_models/BackboneSection";

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

  const completeOverviewSelection = (overviewBackbone?: BackboneSection) => {
    if (!inSelectMode || !overviewBackbone) return;

    inSelectMode = false;

    if (startOverviewSelectionY.value != null && stopOverviewSelectionY.value != null)
    {
      // Calculate start/stop base pairs based on bp to height ratio in the overview panel
      const startingBasePairCountFromStartOfBackbone = Math.floor((startOverviewSelectionY.value - overviewBackbone.posY1) * store.state.overviewBasePairToHeightRatio);
      let basePairStart = startingBasePairCountFromStartOfBackbone + overviewBackbone.windowStart;

      const stoppingBasePairCountFromStartOfBackbone = Math.floor((stopOverviewSelectionY.value - overviewBackbone.posY1) * store.state.overviewBasePairToHeightRatio);
      let basePairStop = stoppingBasePairCountFromStartOfBackbone + overviewBackbone.windowStart;

      let startSVGY = startOverviewSelectionY.value;
      if (basePairStart < overviewBackbone.windowStart)
      {
        basePairStart = overviewBackbone.windowStart;
        startSVGY = overviewBackbone.posY1;
      }

      let stopSVGY = stopOverviewSelectionY.value;
      if (basePairStop > overviewBackbone.windowStop)
      {
        basePairStop = overviewBackbone.windowStop;
        stopSVGY = overviewBackbone.posY2;
      }

      const selectedBackboneRegion = new BackboneSelection(new SelectedRegion(startSVGY, stopSVGY - startSVGY, basePairStart, basePairStop), store.state.chromosome ?? undefined);
      selectedBackboneRegion.generateInnerSelection(basePairStart, basePairStop, store.state.overviewBasePairToHeightRatio);
      store.dispatch('setBackboneSelection', selectedBackboneRegion);
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