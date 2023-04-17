/**
 * Shared utility methods that don't necessarily warrant their own file
 */

import Block, { Gap } from "@/models/Block";
import Gene from "@/models/Gene";
import SVGConstants, { PANEL_SVG_STOP, PANEL_SVG_START, PANEL_HEIGHT } from "./SVGConstants";

// Don't render anything smaller than this
const SMALLEST_RENDERABLE_SVG_UNIT = 0.2; // 1/5th of an SVG unit

/**
 * Gets threshold based on how many basepairs = 0.25 SVG units
 * 
 * @param bpLength
 *   number of basepairs being rendered in the SVG view
 * @returns
 *   threshold (number)
 */
export function getThreshold(bpLength: number)
{
  return Math.round(bpLength / (PANEL_SVG_STOP - PANEL_SVG_START) * SMALLEST_RENDERABLE_SVG_UNIT);
}

/**
 * Determines whether or not a Block is in the specified viewport basepair range
 * 
 * @param targetBlock
 *   Block or Gap
 * @param backboneStart
 *   start bp of the backbone
 * @param backboneStop
 *   stop bp of the backbone
 * 
 * @returns
 *   True if block is partially in the viewport, False if not
 */
export function isGenomicDataInViewport(targetBlock: Block | Gap | Gene, backboneStart: number, backboneStop: number)
{
  return (targetBlock.backboneStart > backboneStart && targetBlock.backboneStart < backboneStop)
    || (targetBlock.backboneStop < backboneStop && targetBlock.backboneStop > backboneStart)
    || (targetBlock.backboneStart < backboneStart && targetBlock.backboneStop > backboneStop);
}

export function getDetailedPanelXPositionForDatatracks(order: number, index: number)
{
  return getDetailedPanelXPositionForSynteny(order) + 30 * (index + 1);
}

export function getDetailedPanelXPositionForSynteny(order: number)
{
  return (order * 120) + SVGConstants.selectedBackboneXPosition;
}

export function getDetailedPanelXPositionForBackboneDatatracks(backboneX2: number, datatrackSetIndex: number)
{
  return backboneX2 + (SVGConstants.backboneDatatrackXOffset * (datatrackSetIndex + 1)) + (SVGConstants.backboneDatatrackXOffset * datatrackSetIndex);
}

/**
 * Calculates and returns the "middle" SVG Y coordinate of a gene in the Detailed Panel
 */
export function calculateDetailedPanelSVGYPositionBasedOnBackboneAlignment(geneBackboneStart: number, geneBackboneStop: number, visibleBackboneStart: number, visibleBackboneStop: number)
{
  const svgToBackboneRatio = (PANEL_HEIGHT) / (visibleBackboneStop - visibleBackboneStart);

  const backboneStartDiff = geneBackboneStart - visibleBackboneStart;
  const backboneStopDiff = visibleBackboneStop - geneBackboneStop;

  const svgStart = PANEL_SVG_START + (backboneStartDiff * svgToBackboneRatio);
  const svgStop = PANEL_SVG_STOP - (backboneStopDiff * svgToBackboneRatio);

  return svgStart + ((svgStop - svgStart) / 2);
}