import Track from "./Track";
import OrthologLine from "./OrthologLine";

export default class DataTrack
{
  type: string;
  name: string;
  color: string;
  track: Track;
  isDisplayed: boolean;
  isComparativeView: boolean;
  orthologLines: OrthologLine[];

  constructor(type: string, name: string, track: Track, color: string)
  {
    this.type = type;
    this.name = name;
    this.track = track;
    this.color = color;
    this.isDisplayed = false;
    this.isComparativeView = false;
    this.orthologLines = [];
  }

  public setIsDisplayed(isDisplayed: boolean)
  {
    this.isDisplayed = isDisplayed;
  }

  public setIsComparativeView(isComparativeView: boolean)
  {
    this.isComparativeView = isComparativeView;
  }

  public setColor(color: string)
  {
    this.color = color;
  }

  public setOrthologLines(orthologLines: OrthologLine[])
  {
    this.orthologLines = orthologLines;
  }
}