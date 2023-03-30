import { PANEL_SVG_STOP, PANEL_SVG_START } from "./SVGConstants";

export function getThreshold(bpLength: number)
{
  return Math.round(bpLength / (PANEL_SVG_STOP - PANEL_SVG_START) / 4);
}