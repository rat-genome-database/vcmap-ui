import Track from "./Track";

export default class DataTrack
{
  name: string;
  color: string;
  track: Track;
  isDisplayed: boolean;

  constructor(name: string, track: Track, color: string)
  {
    this.name = name;
    this.track = track;
    this.color = color;
    this.isDisplayed = false;
  }

  public setIsDisplayed(isDisplayed: boolean)
  {
    this.isDisplayed = isDisplayed;
  }

  public setColor(color: string)
  {
    this.color = color;
  }
}