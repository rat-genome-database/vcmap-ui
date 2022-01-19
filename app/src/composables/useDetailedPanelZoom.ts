import { onMounted, ref } from "vue";
import { getMousePosSVG } from '@/utils/SVGHelpers';
import { Store } from "vuex";
import BackboneSelection from "@/models/BackboneSelection";
import { VCMapState } from "@/store";
import SVGConstants from "@/utils/SVGConstants";

export default function useDetailedPanelZoom(store: Store<VCMapState>) {
  let inSelectMode = false;
  let startingPoint: DOMPoint | { y: number, x: number };
  const startSelectionY = ref<number>();
  const stopSelectionY = ref<number>();
  let svg: SVGSVGElement | null;

  onMounted(() => {
    svg = document.querySelector('svg');
  });

  const initZoomSelection = (event: any) => {
    const selectedRegion = store.getters.getSelectedBackboneRegion as BackboneSelection;
    if (!selectedRegion.innerSelection)
    {
      console.warn('Cannot zoom on the detailed panel without a selection in the overview');
      return;
    }

    inSelectMode = true;
    startingPoint = getMousePosSVG(svg, event);
    startSelectionY.value = startingPoint.y;
  };

  const updateZoomSelection = (event: any) => {
    if (!inSelectMode) return;

    const currentSVGPoint = getMousePosSVG(svg, event);

    if (currentSVGPoint.y < startingPoint.y)
    {
      // We are moving above the starting point
      startSelectionY.value = currentSVGPoint.y;
      stopSelectionY.value = startingPoint.y;
    }
    else
    {
      // We are moving below the starting point
      stopSelectionY.value = currentSVGPoint.y;
    }
  };

  const completeZoomSelection = () => {
    if (!inSelectMode) return;

    inSelectMode = false;

    const selection = store.getters.getSelectedBackboneRegion as BackboneSelection;
    if (startSelectionY.value && stopSelectionY.value && selection.innerSelection)
    {
      // Calculate start/stop base pairs based on bp to height ratio in the detailed panel
      const basePairsFromInnerSelection1 = Math.floor((startSelectionY.value - SVGConstants.panelTitleHeight) * store.getters.getDetailedBasePairToHeightRatio);
      const basePairStart = basePairsFromInnerSelection1 + selection.innerSelection.basePairStart;

      const basePairsFromInnerSelection2 = Math.floor((stopSelectionY.value - SVGConstants.panelTitleHeight) * store.getters.getDetailedBasePairToHeightRatio);
      const basePairStop = basePairsFromInnerSelection2 + selection.innerSelection.basePairStart;

      // TODO: Dispatch action to zoom in on the selected region
      console.log('Selected region (bp): ', basePairStart, basePairStop);
    }

    // Clear selection box
    startSelectionY.value = undefined;
    stopSelectionY.value = undefined;
  };

  return {
    startSelectionY,
    stopSelectionY,
    initZoomSelection,
    updateZoomSelection,
    completeZoomSelection
  };
}