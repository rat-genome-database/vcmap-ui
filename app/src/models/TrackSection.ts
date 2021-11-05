const BASE_PAIR_TO_PIXEL_RATIO = 250000;

export default class TrackSection
{
  private _startBP: number = 0; // starting base pair position
  private _stopBP: number = 0; // ending base pair position
  private _offsetBPCount: number = 0; // number of base pairs before this section should begin, used when drawing the sections against the backbone track
  color: string = 'white'; // css color string

  constructor(startBP: number, stopBP: number, color: string, offsetBPCount?: number)
  {
    this._startBP = startBP;
    this._stopBP = stopBP;
    this.color = color;
    this._offsetBPCount = offsetBPCount ?? 0;
  }

  public get startBP()
  {
    return this.convertBasePairToLabel(this._startBP);
  }

  public get stopBP()
  {
    return this.convertBasePairToLabel(this._stopBP);
  }

  public get height()
  {
    return Math.ceil((this._stopBP - this._startBP) / BASE_PAIR_TO_PIXEL_RATIO);
  }

  public get offsetHeight()
  {
    return Math.ceil(this._offsetBPCount / BASE_PAIR_TO_PIXEL_RATIO);
  }

  private convertBasePairToLabel(bp: number)
  {
    if (bp >= 1000000)
    {
      return (bp / 1000000).toFixed(2) + 'Mbp';
    }
    else if (bp >= 1000)
    {
      return (bp / 1000).toFixed(2) + 'Kbp';
    }
    else
    {
      return bp + 'bp';
    }
  }
}