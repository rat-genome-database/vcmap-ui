import { Formatter } from '@/utils/Formatter';
import { Resolution } from '@/utils/Resolution';
import Chromosome from './Chromosome';

export default class TrackSection
{
  startBP: number = 0; // starting base pair position
  stopBP: number = 0; // ending base pair position
  private _offsetBPCount: number = 0; // number of base pairs before this section should begin, used when drawing the sections against the backbone track
  private _cutoffBP: number = 0; // The absolute cutoff position of this section
  isHighlighted: boolean = false;
  chromosome: string = '';

  constructor(startBP: number, stopBP: number, chromosome: string, cutoffBP: number, offsetBPCount?: number)
  {
    this.startBP = startBP;
    this.stopBP = stopBP;
    this.chromosome = chromosome;
    this._cutoffBP = cutoffBP;
    this._offsetBPCount = offsetBPCount ?? 0;
  }

  public get color()
  {
    return Chromosome.getColor(this.chromosome);
  }

  public get startBPLabel()
  {
    return Formatter.convertBasePairToLabel(this.startBP);
  }

  public get stopBPLabel()
  {
    return Formatter.convertBasePairToLabel(this.stopBP);
  }

  public get height()
  {
    const displayStopBP = (this.stopBP > this._cutoffBP) ? this._cutoffBP : this.stopBP;
    return (displayStopBP - this.startBP) / Resolution.getBasePairToHeightRatio();
  }

  public get offsetHeight()
  {
    return (this._offsetBPCount / Resolution.getBasePairToHeightRatio());
  }
}