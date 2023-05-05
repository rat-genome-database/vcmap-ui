import SVGConstants, { PANEL_SVG_START, PANEL_SVG_STOP } from "@/utils/SVGConstants";
import { SVGShape, VCMapSVGElement } from "./VCMapSVGElement";
import { DatatrackSectionType } from "./DatatrackSection";

export type RenderType = 'overview' | 'detailed';
type GenomicSectionType = 'gap' | DatatrackSectionType;

export type BackboneAlignment = {
  start: number;
  stop: number;
};

export type WindowBasePairRange = {
  start: number;
  stop: number;
};

export type GenomicSectionParams = {
  speciesName: string;
  mapName: string;
  chromosome: string;
  start: number;
  stop: number;
  type: GenomicSectionType;
  color: string;
  backboneAlignment: BackboneAlignment;
  windowBasePairRange: WindowBasePairRange;
  renderType: RenderType;
};

/**
 * Represents an individual Genomic Section of data. 
 * This could be an off-backbone syntenic section (block or gap), a backbone section, a datatrack section, etc...
 */
export default abstract class GenomicSection implements VCMapSVGElement
{
  // VCMapSVGElement props
  posX1: number = 0;
  posX2: number = 0;
  posY1: number = 0;
  posY2: number = 0;
  height: number = 0;
  width: number = 0;
  shape: SVGShape = 'rect';
  representation: string = '';
  isHovered: boolean = false;
  isSelected: boolean = false;
  elementColor: string = '';
  opacity: number = 1;

  // GenomicSection props
  speciesName: string;
  mapName: string;
  chromosome: string;
  speciesStart: number = 0;  // start basepair of the section on its original species
  speciesStop: number = 0;   // stop basepair of the section on its original species
  type: GenomicSectionType = 'block'; // TODO: see if we can remove this prop
  backboneAlignment: BackboneAlignment;
  windowBasePairRange: WindowBasePairRange;
  renderType: RenderType;
  
  constructor(params: GenomicSectionParams)
  {
    this.speciesName = params.speciesName;
    this.mapName = params.mapName;
    this.chromosome = params.chromosome;
    this.speciesStart = params.start;
    this.speciesStop = params.stop;
    this.type = params.type;
    this.backboneAlignment = params.backboneAlignment;
    this.windowBasePairRange = params.windowBasePairRange;
    this.renderType = params.renderType;

    this.calculateYPositionsBasedOnBackboneAlignment();

    // Set color and shape of VCMapSVGElement
    this.elementColor = params.color;
    if (params.type === 'block' || params.type === 'gene' || params.type === 'qtl')
    {
      this.shape = 'rect';
    }
    else
    {
      this.shape = 'line';
    }
  }

  /**
   * Length of this genomic section (in basepairs)
   */
  public get length()
  {
    return Math.abs(this.speciesStop - this.speciesStart);
  }

  public get backboneAlignmentLength()
  {
    return Math.abs(this.backboneAlignment.stop - this.backboneAlignment.start);
  } 

  /**
   * Ratio of backbone basepairs to this section's basepairs
   * e.g. if this section is 50bp and aligns against a backbone region that is 100bp long, the ratio would be 2
   */
  public get blockRatio()
  {
    return Math.abs(this.backboneAlignment.stop - this.backboneAlignment.start) / this.length;
  }

  /**
   * SVG start position of the visible part of the backbone
   */
  public get windowSVGStart()
  {
    return (this.renderType === 'overview') ? PANEL_SVG_START + SVGConstants.overviewTrackPadding : PANEL_SVG_START;
  }

  /**
   * SVG stop position of the visible part of the backbone
   */
  public get windowSVGStop()
  {
    return (this.renderType === 'overview') ? PANEL_SVG_STOP - SVGConstants.overviewTrackPadding : PANEL_SVG_STOP;
  }

  /**
   * SVG middle position of the visible part of the backbone
   */
  public get windowSVGMiddle()
  {
    return this.windowSVGStart + ((this.windowSVGStop - this.windowSVGStart) / 2);
  }

  /**
   * Backbone start basepair at top of the visible window
   */
  public get windowStart()
  {
    return this.windowBasePairRange.start;
  }

  /**
   * Backbone stop basepair at the bottom of the visible window
   */
  public get windowStop()
  {
    return this.windowBasePairRange.stop;
  }

  public adjustYPositionsBasedOnVisibleStartAndStop(visibleBackboneBasePairRange: WindowBasePairRange)
  {
    this.windowBasePairRange = visibleBackboneBasePairRange;
    this.calculateYPositionsBasedOnBackboneAlignment();
  }

  /**
   * Function determines the start and stop SVG positions of this genomic section by using the ratio of known windowStart and svgStart
   */
  private calculateYPositionsBasedOnBackboneAlignment()
  {
    // NOTE: Caching these function calls to avoid extra functions on the call stack
    const windowSVGStop = this.windowSVGStop, windowSVGStart = this.windowSVGStart;
    const windowStop = this.windowStop, windowStart = this.windowStart;

    const svgLength = windowSVGStop - windowSVGStart;
    const bpVisibleWindowLength = Math.abs(windowStop - windowStart);
    const bpToSVGRatio = bpVisibleWindowLength / svgLength;

    // Calculate the start and stop SVG positions of this backbone section
    const basepairDiff = Math.abs(windowStart - this.backboneAlignment.start);
    const svgDiff = basepairDiff / bpToSVGRatio;

    if (this.backboneAlignment.start < windowStart)
    {
      this.posY1 = windowSVGStart - svgDiff;
    }
    else if (this.backboneAlignment.start > windowStart)
    {
      this.posY1 = windowSVGStart + svgDiff;
    }
    else if (this.backboneAlignment.start === windowStart)
    {
      this.posY1 = windowSVGStart;
    }

    this.posY2 = this.posY1 + (this.backboneAlignmentLength / bpToSVGRatio);

    this.height = Math.abs(this.posY2 - this.posY1);
  }
}