import { onMounted, ref } from "vue";
import { getMousePosSVG } from '@/utils/SVGHelpers';
import { Store } from "vuex";
import { VCMapState } from "@/store";
import SVGConstants, {PANEL_SVG_START, PANEL_SVG_STOP} from "@/utils/SVGConstants";
import { useLogger } from "vue-logger-plugin";

export default function useDetailedPanelZoom(store: Store<VCMapState>) {
  const $log = useLogger();

  let inSelectMode = false;
  let startingPoint: DOMPoint | { y: number, x: number };
  const startDetailedSelectionY = ref<number>();
  const stopDetailedSelectionY = ref<number>();
  let svg: SVGSVGElement | null;

  onMounted(() => {
    svg = document.querySelector('svg');
  });

  const getDetailedSelectionStatus = () => {
    return inSelectMode;
  };

  const detailedSelectionHandler = (event: any) => {
    if (store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating)
    {
      // Don't allow zoom until both panels are done updating
      return;
    }

    const selectedRegion = store.state.selectedBackboneRegion;
    if (selectedRegion && !selectedRegion.viewportSelection)
    {
      $log.warn('Cannot zoom on the detailed panel without a selection in the overview');
      return;
    }

    if (!inSelectMode) {
      inSelectMode = true;
      startingPoint = getMousePosSVG(svg, event);
      startDetailedSelectionY.value = startingPoint.y;
      return;
    }

    completeZoomSelection();
  };

  const initZoomSelection = (event: any) => {
    if (store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating)
    {
      // Don't allow zoom until both panels are done updating
      return;
    }

    if (!store.state.detailedBasePairRange)
    {
      $log.warn('Cannot zoom on the detailed panel without a selection in the overview');
      return;
    }

    inSelectMode = true;
    startingPoint = getMousePosSVG(svg, event);
    startDetailedSelectionY.value = startingPoint.y;
  };

  const updateZoomSelection = (event: any) => {
    if (!inSelectMode) return;

    const currentSVGPoint = getMousePosSVG(svg, event);

    if (currentSVGPoint.y < startingPoint.y)
    {
      // We are moving above the starting point
      startDetailedSelectionY.value = currentSVGPoint.y;
      stopDetailedSelectionY.value = startingPoint.y;
    }
    else
    {
      // We are moving below the starting point
      stopDetailedSelectionY.value = currentSVGPoint.y;
    }
  };

  const cancelDetailedSelection = () => {
    if (inSelectMode) {
      inSelectMode = false;
      // Clear selection box
      startDetailedSelectionY.value = undefined;
      stopDetailedSelectionY.value = undefined;
    }
  };

  const completeZoomSelection = () => {
    if (!inSelectMode) return;

    inSelectMode = false;

    if (startDetailedSelectionY.value != null && stopDetailedSelectionY.value != null && store.state.detailedBasePairRange)
    {
      const svgHeight = PANEL_SVG_STOP - PANEL_SVG_START;
      const bpVisibleWindowLength = Math.abs(store.state.detailedBasePairRange.stop - store.state.detailedBasePairRange.start);
      const pixelsPerBpRatio = svgHeight / bpVisibleWindowLength;
      // Calculate start/stop base pairs based on bp to height ratio in the detailed panel
      const basePairStart = Math.floor((startDetailedSelectionY.value - SVGConstants.panelTitleHeight) / pixelsPerBpRatio)
          + store.state.detailedBasePairRange.start;

      const basePairStop = Math.floor((stopDetailedSelectionY.value - SVGConstants.panelTitleHeight) / pixelsPerBpRatio)
          + store.state.detailedBasePairRange.start;

      console.log(`Requesting zoom to (${basePairStart}, ${basePairStop}) from Y:(${startDetailedSelectionY.value}, ${stopDetailedSelectionY.value})`);
      store.dispatch('setDetailedBasePairRequest', { start: basePairStart, stop: basePairStop });
      // store.dispatch('setDetailedBasePairRange', { start: basePairStart, stop: basePairStop });
    }

    // Clear selection box
    startDetailedSelectionY.value = undefined;
    stopDetailedSelectionY.value = undefined;
  };

  return {
    detailedSelectionHandler,
    startDetailedSelectionY,
    stopDetailedSelectionY,
    initZoomSelection,
    updateZoomSelection,
    cancelDetailedSelection,
    completeZoomSelection,
    getDetailedSelectionStatus
  };
}