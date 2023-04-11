/**
 * Shared utility methods that don't necessarily warrant their own file
 */

import Block, { Gap } from "@/models/Block";
import SVGConstants, { PANEL_SVG_STOP, PANEL_SVG_START } from "./SVGConstants";

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
  return Math.round(bpLength / (PANEL_SVG_STOP - PANEL_SVG_START) / 4);
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
export function isGenomicDataInViewport(targetBlock: Block | Gap, backboneStart: number, backboneStop: number)
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