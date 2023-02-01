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
  const getBasePairPositionFromSVG = (event: any, svgStart: number, svgStop: number, basePairStart: number, basePairStop: number) => {
    const mousePos = getMousePosSVG(svg, event);
    mouseYPos.value = mousePos.y;
    return basePairStart + (mousePos.y - svgStart) * ((basePairStop - basePairStart) / (svgStop - svgStart));
  };

  const resetMousePos = () => {
    mouseYPos.value = undefined;
  };

  return {
    getBasePairPositionFromSVG,
    mouseYPos,
  };
}