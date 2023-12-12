/**
 * Shared utility methods that don't necessarily warrant their own file
 */
import Block, { Gap, GenomicPosition } from "@/models/Block";
import Gene from "@/models/Gene";
import SVGConstants, { PANEL_SVG_STOP, PANEL_SVG_START, PANEL_HEIGHT } from "./SVGConstants";
import { BackboneAlignment } from "@/models/GenomicSection";
import logger from "@/logger";

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

export function getDetailedPanelXPositionForDatatracks(order: number, index: number, overviewWidth: number)
{
  return getDetailedPanelXPositionForSynteny(order, overviewWidth) + SVGConstants.trackWidth
    + SVGConstants.backboneDatatrackXOffset * (index + 1) + (SVGConstants.backboneDatatrackXOffset * index);
}

export function getOverviewPanelXPosition(order: number)
{
  return (order * 80) + SVGConstants.backboneXPosition;
}

export function getDetailedPanelXPositionForSynteny(order: number, overviewWidth: number)
{
  return (order * 140) + overviewWidth + SVGConstants.detailedRightPadding;
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

/**
 * Determines gene backbone alignments while taking into account the gaps of the target block. This is important for
 * properly positioning genes that are in view. This function relies on gaps being sorted in ascending order.
 *
 * @param gene
 * @param targetBlock
 */
export function processAlignmentsOfGeneInsideOfViewport(start: number, stop: number, targetBlock: Block): BackboneAlignment
{
  // Only use gaps at the same level as the target block
  // NOTE: This should really always be level 1, since we only process genes that come back on level 1 blocks
  //   We will need to adjust the implementation to handle overlapping gaps if we start needing to process 
  //   level 2 stuff...
  const gaps = targetBlock.gaps.filter(g => g.chainLevel === targetBlock.chainLevel);
  if (gaps.length === 0)
  {
    // Process gene alignments for gapless blocks just like how we'd process alignments
    // that are outside of the viewport
    return processAlignmentsOfGeneOutsideOfViewport(start, stop, targetBlock);
  }

  // Find the block/gap where the gene starts, and the block/gap where the gene ends
  let startingSection: GenomicPosition | undefined;
  let endingSection: GenomicPosition | undefined;
  let previousGap: Gap | undefined;
  for (let i = 0; i < gaps.length; i++)
  { 
    const gap = gaps[i];
    if (!startingSection)
    {
      // Looking for starting section...
      if (start < gap.start)
      {
        // Starts before this gap
        // TODO: The logic for determining backboneStart/Stop here can be kind of confusing to wrap your head around. I wonder if
        //   there is a clearer way to code this. previousGap and gap flip-flop depending on orientation of the block.
        startingSection = {
          start: previousGap?.stop ?? targetBlock.start,
          stop: gap.start,
          backboneStart: (targetBlock.orientation === '-') ? gap.backboneStop : previousGap?.backboneStop ?? targetBlock.backboneStart,
          backboneStop: (targetBlock.orientation === '-') ? previousGap?.backboneStart ?? targetBlock.backboneStop : gap.backboneStart,
        };
      }
      else if (start >= gap.start && start <= gap.stop)
      {
        // Starts inside of this gap
        startingSection = {
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart,
          backboneStop: gap.backboneStop,
        };
      }
    }
    
    // NOTE: Not using an else here because the endingSection might be the same as the startingSection.
    //   Need to evaluate the same gap even if startingSection has just been found.
    if (startingSection && !endingSection)
    {
      // Looking for ending section...
      if (stop < gap.start)
      {
        // Ends before this gap
        // TODO: The logic for determining backboneStart/Stop here can be kind of confusing to wrap your head around. I wonder if
        //   there is a clearer way to code this. previousGap and gap flip-flop depending on orientation of the block.
        endingSection = {
          start: previousGap?.stop ?? targetBlock.start,
          stop: gap.start,
          backboneStart: (targetBlock.orientation === '-') ? gap.backboneStop : previousGap?.backboneStop ?? targetBlock.backboneStart,
          backboneStop: (targetBlock.orientation === '-') ? previousGap?.backboneStart ?? targetBlock.backboneStop : gap.backboneStart,
        };
      }
      else if (stop >= gap.start && stop <= gap.stop)
      {
        // Ends inside of this gap
        endingSection = {
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart,
          backboneStop: gap.backboneStop,
        };
      }
    }

    if (i === gaps.length - 1 && targetBlock.stop > gap.stop && (!startingSection || !endingSection))
    {
      // If the last gap was just analyzed and no starting/ending section has been found, then
      // the missing section(s) should be the final "block" after the last gap
      const lastSection = {
        start: gap.stop,
        stop: targetBlock.stop,
        backboneStart: (targetBlock.orientation === '-') ? targetBlock.backboneStart : gap.backboneStop,
        backboneStop: (targetBlock.orientation === '-') ? gap.backboneStart : targetBlock.backboneStop,
      };

      if (!startingSection) startingSection = lastSection;
      if (!endingSection) endingSection = lastSection;
    }

    previousGap = gap;

    if (startingSection && endingSection)
    {
      break;
    }
  }

  if (!startingSection || !endingSection)
  {
    // Something went wrong...
    logger.error(`Gene backbone alignment could not be determined based on block with gaps. See debug logs.`);
    logger.debug(start, stop, targetBlock);
    // Fallback to processing without accounting for gaps
    return processAlignmentsOfGeneOutsideOfViewport(start, stop, targetBlock);
  }

  // Calculate backbone alignments based on starting/ending section blockRatios and orientations
  const startingSectionRatio = Math.abs(startingSection.backboneStop - startingSection.backboneStart) / Math.abs(startingSection.stop - startingSection.start);
  const endingSectionRatio = Math.abs(endingSection.backboneStop - endingSection.backboneStart) / Math.abs(endingSection.stop - endingSection.start);

  let backboneStart;
  let backboneStop;
  if (targetBlock.orientation === '+')
  {
    // Forward oriented block
    // TODO: Some edge cases might not be handled properly with this simplification
    backboneStart = Math.floor(startingSection.backboneStart + (start - startingSection.start) * startingSectionRatio);
    backboneStop = Math.floor(endingSection.backboneStart + (stop - endingSection.start) * endingSectionRatio);
  }
  else
  {
    // Reverse oriented block
    // TODO: Some edge cases might not be handled properly with this simplification
    backboneStart = Math.floor(endingSection.backboneStart + (endingSection.stop - stop) * endingSectionRatio);
    backboneStop = Math.floor(startingSection.backboneStart + (startingSection.stop - start) * startingSectionRatio);
  }

  // Ensure genes don't extend beyond the range of our block
  // NOTE: This is very important for small block sections near break points
  if (backboneStart < targetBlock.backboneStart) backboneStart = targetBlock.backboneStart;
  if (backboneStop > targetBlock.backboneStop) backboneStop = targetBlock.backboneStop;

  return { start: backboneStart, stop: backboneStop };
}

/**
 * Determines gene backbone alignments without taking gaps into account. This should be good enough
 * to approximate the angle of ortholog lines as they go off screen.
 *
 * @param start
 * @param stop
 * @param targetBlock
 */
export function processAlignmentsOfGeneOutsideOfViewport(start: number, stop: number, targetBlock: Block): BackboneAlignment
{
  // Calculate gene backbone position
  let backboneStart;
  let backboneStop;
  const blockRatio = Math.abs(targetBlock.backboneStop - targetBlock.backboneStart) / Math.abs(targetBlock.stop - targetBlock.start);
  if (targetBlock.orientation == '+')
  {
    // Forward oriented block
    // TODO: Some edge cases might not be handled properly with this simplification
    backboneStart = Math.floor(targetBlock.backboneStart + (start - targetBlock.start) * blockRatio);
    backboneStop = Math.floor(targetBlock.backboneStart + (stop - targetBlock.start) * blockRatio);
  }
  else
  {
    // Reverse oriented block
    // TODO: Some edge cases might not be handled properly with this simplification
    backboneStart = Math.floor(targetBlock.backboneStart + (targetBlock.stop - stop) * blockRatio);
    backboneStop = Math.floor(targetBlock.backboneStart + (targetBlock.stop - start) * blockRatio);
  }

  // Ensure genes don't extend beyond the range of our block
  // NOTE: This is very important for small block sections near break points
  if (backboneStart < targetBlock.backboneStart) backboneStart = targetBlock.backboneStart;
  if (backboneStop > targetBlock.backboneStop) backboneStop = targetBlock.backboneStop;

  return { start: backboneStart, stop: backboneStop };
}

/**
 * Determines the width of the overview panel based on the number of species visible
 * @param numComparativeSpecies
 * @returns width of the overview panel
 */
export function calculateOverviewWidth(numComparativeSpecies: number) {
  return 60 + numComparativeSpecies * 80;
}
