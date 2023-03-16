import { onMounted, ref } from "vue";
import { getMousePosSVG } from '@/utils/SVGHelpers';
import { Store } from "vuex";
import { VCMapState } from "@/store";
import BackboneSection from "@/models/BackboneSection";

export default function useOverviewPanelSelection(store: Store<VCMapState>) {
  let inSelectMode = false;
  let startingPoint: DOMPoint | { y: number, x: number };
  const startOverviewSelectionY = ref<number>();
  const stopOverviewSelectionY = ref<number>();
  let svg: SVGSVGElement | null;

  onMounted(() => {
    svg = document.querySelector('svg');
  });

  const getOverviewSelectionStatus = () => {
    return inSelectMode;
  };

  const overviewSelectionHandler = (event: any, overviewBackbone?: BackboneSection) => {
    if (store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating)
    {
      // Don't allow a selection until both panels are done updating
      return;
    }

    if (!inSelectMode) {
      inSelectMode = true;
      startingPoint = getMousePosSVG(svg, event);
      startOverviewSelectionY.value = startingPoint.y;
      return;
    }

    completeOverviewSelection(overviewBackbone);
  };

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

  const cancelOverviewSelection = () => {
    if (inSelectMode) {
      inSelectMode = false;
      // Clear selection box
      startOverviewSelectionY.value = undefined;
      stopOverviewSelectionY.value = undefined;
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

      if (basePairStart < overviewBackbone.windowStart)
      {
        basePairStart = overviewBackbone.windowStart;
      }

      if (basePairStop > overviewBackbone.windowStop)
      {
        basePairStop = overviewBackbone.windowStop;
      }

      const selectedBackboneRegion = store.state.selectedBackboneRegion;
      if (selectedBackboneRegion && selectedBackboneRegion.setViewportSelection)
      {
        selectedBackboneRegion.setViewportSelection(basePairStart, basePairStop, store.state.overviewBasePairToHeightRatio);
        //store.dispatch('setBackboneSelection', selectedBackboneRegion);
        store.dispatch('setDetailedBasePairRequest', { start: basePairStart, stop: basePairStop });
      }
      // TODO (TEMP):
      else { console.error("FIXME HERE TEMP", selectedBackboneRegion); }
    }

    // Clear selection box
    startOverviewSelectionY.value = undefined;
    stopOverviewSelectionY.value = undefined;
  };

  return {
    overviewSelectionHandler,
    startOverviewSelectionY,
    stopOverviewSelectionY,
    initOverviewSelection,
    updateOverviewSelection,
    cancelOverviewSelection,
    completeOverviewSelection,
    getOverviewSelectionStatus
  };
}