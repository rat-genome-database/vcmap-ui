export interface IHoveredData {
  x: number; // mouse x position
  y: number; // mouse y position
  data: string[];
}

export interface IHoverableData {
  toHoveredData: () => string[];
}