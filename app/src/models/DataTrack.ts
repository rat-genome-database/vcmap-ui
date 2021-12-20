import Track from "./Track";

export default class DataTrack
{
  type: string;
  name: string;
  color: string;
  track: Track;
  isDisplayed: boolean;
  isComparativeView: boolean;

  constructor(type: string, name: string, track: Track, color: string)
  {
    this.type = type;
    this.name = name;
    this.track = track;
    this.color = color;
    this.isDisplayed = false;
    this.isComparativeView = false;
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
}