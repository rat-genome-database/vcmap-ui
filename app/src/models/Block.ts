import Chromosome from "@/models/Chromosome";
import Gene from "@/models/Gene";

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
  backboneStart?: number;
  backboneStop?: number;
}
export class Gap
{
  start: number = -1;
  stop: number = -1;
  backboneStart: number | null = null;
  backboneStop: number | null = null;
  constructor(params: GapParams)
  {
    this.start = params.start;
    this.stop = params.stop;
    this.backboneStart = params.backboneStart ?? this.backboneStart;
    this.backboneStop = params.backboneStop ?? this.backboneStop;
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
   */
  addGaps(newgaps: Gap[]): void
  {
    const origLen = this.gaps.length;
    // NOTE: Avoiding callback based forEach here for performance reasons
    for (let i = 0, len = newgaps.length; i < len; i++)
    {
      // Unless this gap is already represented, add it (ignoring backbone positioning)
      if (this.gaps.filter(
          (g) => { return g.start == newgaps[i].start && g.stop == newgaps[i].stop; }
      ).length == 0)
        this.gaps.push(newgaps[i]);
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
}
