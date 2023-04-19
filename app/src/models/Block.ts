import Chromosome from "@/models/Chromosome";
import Gene from "@/models/Gene";
import {SyntenyComponent} from "@/api/SyntenyApi";
import VariantPositions from "./VariantPositions";

// Generic type to represent position of any genomic data
export type GenomicPosition = {
  start: number;
  stop: number;
  backboneStart: number;
  backboneStop: number;
};

interface BlockParams
{
  backbone: Chromosome;
  chromosome: Chromosome;
  chainLevel?: number;
  start: number;
  stop: number;
  backboneStart?: number;
  backboneStop?: number;
  orientation?: '+' | '-';
  gaps?: Gap[];
  genes?: Gene[];
}

interface GapParams
{
  start: number;
  stop: number;
  backboneStart: number;
  backboneStop: number;
  chainLevel: number;
}
export class Gap
{
  start: number = -1;
  stop: number = -1;
  backboneStart: number = -1;
  backboneStop: number = -1;
  chainLevel: number = 1;

  constructor(params: GapParams)
  {
    this.start = params.start;
    this.stop = params.stop;
    this.backboneStart = params.backboneStart;
    this.backboneStop = params.backboneStop;
    this.chainLevel = params.chainLevel;
  }
}

export default class Block
{
  backbone: Chromosome;
  chromosome: Chromosome;
  // Defaults
  chainLevel: number = 1;
  start: number = 0;
  stop: number = 0;
  backboneStart: number = -1;
  backboneStop: number = -1;
  orientation: "+" | "-" = '+';
  gaps: Gap[] = [];
  genes: Gene[] = [];
  variantPositions?: VariantPositions;

  // Constructor
  constructor(params: BlockParams)
  {
    this.backbone = params.backbone;
    this.chromosome = params.chromosome;
    this.chainLevel = params.chainLevel ?? this.chainLevel;
    this.start = params.start;
    this.stop = params.stop;
    this.backboneStart = params.backboneStart ?? this.backboneStart;
    this.backboneStop = params.backboneStop ?? this.backboneStop;
    this.orientation = params.orientation ?? this.orientation;
    this.gaps = params.gaps ?? this.gaps;
    this.genes = params.genes ?? this.genes;
  }


  /**
   * FIXME: Add unit tests for
   *   1) ensuring duplicate Gaps aren't added
   *   2) ensuring duplicate Gaps aren't added
   *   3) ensuring Gap order is correct
   *   4) Gaps added adjust downstream Gene backbone positions
   *   5) ensuring Genes don't extend beyond the start/stop of a Block
   *   6) ensuring Genes are in sorted order
   */

  /**
   * Helper function to ensure gaps are added in descending start order.
   * TODO: Adjust downstream gene "backbone" positions based on the increase in block length.
   // NOTE: insertion sort here would be ideal, instead of this implementation
   */
  addGaps(newgaps: SyntenyComponent[], visibleBackboneStart: number, visibleBackboneStop: number): void
  {
    const origLen = this.gaps.length;

    // TODO TEST: If we sort the list from the API here, could we be more efficient in our insertion?

    //
    // Find all gaps that are new information
    // NOTE: Avoiding callback based forEach here for performance reasons
    for (let idx = 0, len = newgaps.length; idx < len; idx++)
    {
      // TODO TEST: Only add gaps that are going to be visible anyway
      if (newgaps[idx].backboneStart > visibleBackboneStop || newgaps[idx].backboneStop < visibleBackboneStart)
        continue;
      // end TEST

      // Unless this gap is already represented, add it (ignoring backbone positioning)
      // NOTE: sorted gaps allow us to quickly short-circuit this search, assuming the
      //   API didn't send any duplicates
      let duplicate = false, added = false;
      for (let idx2 = 0, len2 = this.gaps.length; idx2 < len2; idx2++)
      {
        if (this.gaps[idx2].start === newgaps[idx].start && this.gaps[idx2].stop === newgaps[idx].stop)
        {
          // We found a duplicate gap (identical start/stop)
          duplicate = true;
          break;
        }
        else if (this.gaps[idx2].start > newgaps[idx].start)
        {
          // We went past all the gaps upstream of "newgap[idx]" w/o finding a duplicate
          // So it must be new: add it
          added = true;
          this.gaps.push(new Gap({
            start: newgaps[idx].start,
            stop: newgaps[idx].stop,
            backboneStart: newgaps[idx].backboneStart,
            backboneStop: newgaps[idx].backboneStop,
            chainLevel: newgaps[idx].chainLevel,
          }));
          break;
        }
      }

      // If we didn't find a dup, or add it -- must be a new last gap: add it now
      if (!duplicate && !added)
      {
        this.gaps.push(new Gap({
          start: newgaps[idx].start,
          stop: newgaps[idx].stop,
          backboneStart: newgaps[idx].backboneStart,
          backboneStop: newgaps[idx].backboneStop,
          chainLevel: newgaps[idx].chainLevel,
        }));
      }
    }

    // Only perform the expensive sort if we added something
    if (origLen < this.gaps.length)
    {
      // Sort smaller gaps earlier, otherwise just
      this.gaps.sort((a, b) => {
        const compared = a.start - b.start;
        return (compared == 0) ? (a.stop - b.stop) : (compared);
      });
    }
  }

  // Helper function to convert orientation to boolen if the block is inverted
  isBlockInverted()
  {
    return this.orientation === '-';
  }
}
