import { onMounted, ref } from "vue";
import { getMousePosSVG } from "@/utils/SVGHelpers";

export default function useMouseBasePairPos() {
  let svg: SVGSVGElement | null;
  const mouseYPos = ref<number>();

  onMounted(() => {
    svg = document.querySelector('svg');
  });
  
  /**
   * Method to calculate the basepair position by SVG position
   */
  const getBasePairPositionFromSVG = (svgY: number, svgStart: number, svgStop: number, basePairStart: number, basePairStop: number) => {
    mouseYPos.value = svgY;
    return basePairStart + (svgY - svgStart) * ((basePairStop - basePairStart) / (svgStop - svgStart));
  };

  /**
   * Method to calculate the basepair position from a MouseEvent
   */
  const getBasePairPositionFromMouseEvent = (event: MouseEvent, svgStart: number, svgStop: number, basePairStart: number, basePairStop: number) => {
    const mousePos = getMousePosSVG(svg, event);
    mouseYPos.value = mousePos.y;
    return basePairStart + (mousePos.y - svgStart) * ((basePairStop - basePairStart) / (svgStop - svgStart));
  };

  return {
    getBasePairPositionFromSVG,
    getBasePairPositionFromMouseEvent,
    mouseYPos,
  };
}