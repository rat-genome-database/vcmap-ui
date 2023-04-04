import { onMounted, ref } from "vue";
import { getMousePosSVG } from '@/utils/SVGHelpers';
import { Store } from "vuex";
import { VCMapState } from "@/store";
import BackboneSection from "@/models/BackboneSection";
import constants, {PANEL_SVG_START, PANEL_SVG_STOP} from "@/utils/SVGConstants";

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
    if (!inSelectMode || !overviewBackbone || !store.state.chromosome) return;

    inSelectMode = false;
    const toastCount = store.state.selectionToastCount;

    if (startOverviewSelectionY.value != null && stopOverviewSelectionY.value != null)
    {
      const svgHeight = PANEL_SVG_STOP - PANEL_SVG_START - (2 * constants.overviewTrackPadding);
      const bpVisibleWindowLength = store.state.chromosome.seqLength;
      const pixelsPerBpRatio = svgHeight / bpVisibleWindowLength;
      const basePairStart = Math.floor((startOverviewSelectionY.value - PANEL_SVG_START  - constants.overviewTrackPadding) / pixelsPerBpRatio);
      const basePairStop = Math.floor((stopOverviewSelectionY.value - PANEL_SVG_START  - constants.overviewTrackPadding) / pixelsPerBpRatio);

      const selectedBackboneRegion = store.state.selectedBackboneRegion;
      if (selectedBackboneRegion && selectedBackboneRegion.setViewportSelection)
      {
        selectedBackboneRegion.setViewportSelection(basePairStart, basePairStop);
        //store.dispatch('setBackboneSelection', selectedBackboneRegion);
        store.dispatch('setSelectionToastCount', toastCount + 1);
        store.dispatch('setDetailedBasePairRequest', { start: basePairStart, stop: basePairStop });
      }
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