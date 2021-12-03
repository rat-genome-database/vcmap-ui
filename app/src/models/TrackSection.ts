import { Formatter } from '@/utils/Formatter';
import Chromosome from './Chromosome';

interface TrackSectionParams
{
  start: number; // starting base pair of this section (ex: starting bp of synteny block, data block, etc)
  stop: number; // ending base pair of this section
  backboneStart: number; // base pair on the backbone that this section's starting base pair lines up with
  backboneStop: number; // base pair on the backbone that this section's ending base pair lines up with
  chromosome: string; // chromosome name
  cutoff: number; // last base pair that is displayed for the backbone
  offsetCount?: number; // number of base pairs before this section should begin, useful for knowing when to begin drawing the section
  basePairToHeightRatio: number; // number of base pairs per unit of height in the SVG, use the Resolution module to get the correct ratio
}

export default class TrackSection
{
  sectionStart: number = 0;
  sectionStop: number = 0;
  backboneStart: number = 0;
  backboneStop: number = 0;
  chromosome: string = '';
  isHighlighted: boolean = false;
  private _offsetCount: number = 0;
  private _backboneCutoff: number = 0;
  private _BPToHeightRatio: number = 0;
  private _displayBackboneStart: number = 0; // the displayed starting base pair position on the backbone that this section lines up with
  private _displayBackboneStop: number = 0; // the displayed ending base pair position on the backbone that this section lines up with

  constructor(params: TrackSectionParams)
  {
    this.sectionStart = params.start;
    this.sectionStop = params.stop;
    this.backboneStart = params.backboneStart;
    this.backboneStop = params.backboneStop;
    this.chromosome = params.chromosome;
    this._backboneCutoff = params.cutoff;
    this._offsetCount = params.offsetCount ?? 0;
    this._BPToHeightRatio = params.basePairToHeightRatio;

    // Calculate the display start BP and stop BP relative to the backbone that this section might aligning against:
    this.calculateDisplayedBPRegionRelativeToBackbone();
  }

  public get color()
  {
    return Chromosome.getColor(this.chromosome);
  }

  public get startBPLabel()
  {
    if (this._displayBackboneStart !== this.backboneStart)
    {
      return Formatter.convertBasePairToLabel(this.sectionStart + (this._displayBackboneStart - this.backboneStart));
    }

    return Formatter.convertBasePairToLabel(this.sectionStart);
  }

  public get stopBPLabel()
  {
    if (this._displayBackboneStop !== this.backboneStop)
    {
      return Formatter.convertBasePairToLabel(this.sectionStop - (this.backboneStop - this._displayBackboneStop));
    }

    return Formatter.convertBasePairToLabel(this.sectionStop);
  }

  public get height()
  {
    return (this._displayBackboneStop - this._displayBackboneStart) / this._BPToHeightRatio;
  }

  public get offsetHeight()
  {
    // offset height cannot be negative (happens if synteny block starts before start of the backbone region)
    return (this._offsetCount >= 0) ? (this._offsetCount / this._BPToHeightRatio) : 0;
  }

  private calculateDisplayedBPRegionRelativeToBackbone()
  {
    // The display start and stop BP can be different than the actual start/stop BPs of this section. The display is used
    // to calculate the how tall the section is on the screen. If the base pair region of this section extends before or
    // after the base pair region of the backbone it is being compared to, we want to modify the display BPs so that they line
    // up appropriately with that region. This is why we use a `_backboneCutoff` prop when calculating the `displayStopBP` and why we
    // might need to adjust the `displayStartBP` when the `_offsetCount` is negative (indicating that the start of this section extends
    // above the backbone region).
    this._displayBackboneStop = (this.backboneStop > this._backboneCutoff) ? this._backboneCutoff : this.backboneStop;
    this._displayBackboneStart = (this._offsetCount >= 0) ? this.backboneStart : this.backboneStart - this._offsetCount;
  }
}