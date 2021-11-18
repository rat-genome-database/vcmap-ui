import { Formatter } from '@/utils/Formatter';
import { ResolutionController } from '@/utils/ResolutionController';
import Chromosome from './Chromosome';

export default class TrackSection
{
  private _startBP: number = 0; // starting base pair position
  private _stopBP: number = 0; // ending base pair position
  private _offsetBPCount: number = 0; // number of base pairs before this section should begin, used when drawing the sections against the backbone track
  private _cutoffBP: number = 0; // The absolute cutoff position of this section
  isHighlighted: boolean = false;
  chromosome: string = '';

  constructor(startBP: number, stopBP: number, chromosome: string, cutoffBP: number, offsetBPCount?: number)
  {
    this._startBP = startBP;
    this._stopBP = stopBP;
    this.chromosome = chromosome;
    this._cutoffBP = cutoffBP;
    this._offsetBPCount = offsetBPCount ?? 0;
  }

  public get color()
  {
    return Chromosome.getColor(this.chromosome);
  }

  public get startBP()
  {
    return Formatter.convertBasePairToLabel(this._startBP);
  }

  public get stopBP()
  {
    return Formatter.convertBasePairToLabel(this._stopBP);
  }

  public get height()
  {
    const displayStopBP = (this._stopBP > this._cutoffBP) ? this._cutoffBP : this._stopBP;
    // Return height rounded to 2 decimal places
    return Math.round(((displayStopBP - this._startBP) / ResolutionController.getBasePairToHeightRatio()) * 100) / 100;
  }

  public get offsetHeight()
  {
    // Return height rounded to 2 decimal places
    return Math.round((this._offsetBPCount / ResolutionController.getBasePairToHeightRatio()) * 100) / 100;
  }
}