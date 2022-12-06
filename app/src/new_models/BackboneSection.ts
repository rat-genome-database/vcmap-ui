import { SVGShape, VCMapSVGElement } from './VCMapSVGElement';
import SyntenyRegion from './SyntenyRegion';
import DatatrackSection from './DatatrackSection';
import Label from './Label';
import SVGConstants, { PANEL_SVG_START, PANEL_SVG_STOP } from '@/utils/SVGConstants';
import { Formatter } from '@/utils/Formatter';
import Chromosome from './Chromosome';
import Species from './Species';

export type RenderType = 'overview' | 'detailed';

interface BackboneSectionParams
{
  start: number;
  stop: number;
  windowStart: number;
  windowStop: number;
  chromosome?: string;
  species?: Species;
  renderType: RenderType;
  createLabels?: boolean;
}

export default class BackboneSection implements VCMapSVGElement
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

  start: number = 0;   // start basepair of the section for the backbone
  stop: number = 0;    // stop basepair of the section for the backbone
  windowStart: number = 0;  // start basepair of the section for the backbone in the detailed view
  windowStop: number = 0;   // stop basepair of the section for the backbone in the detailed view
  windowRatio: number = 0;  // ratio of the window bp to svg unit height
  length: number = 0;  // length of the section for the backbone
  species?: Species;  // species that this section is from
  chromosome: string = '';  // chromosome that this section is from
  syntenyRegions: SyntenyRegion[] = [];
  datatrackSections: DatatrackSection[] = []; // TODO: Determine if we need this here or not
  labels: Label[] = []; // BP labels for the backbone section

  constructor(params: BackboneSectionParams)
  {
    this.start = params.start;
    this.stop = params.stop;
    this.length = this.stop - this.start;
    this.windowStart = params.windowStart;
    this.windowStop = params.windowStop;
    this.chromosome = params.chromosome ?? '';
    this.species = params.species;
    this.elementColor = Chromosome.getColor(this.chromosome);

    this.calculateSVGPosition(this.windowStart, this.windowStop, params.renderType);
    if (params.renderType && params.createLabels)
    {
      this.createLabels(params.renderType, params.windowStart, params.windowStop);
    }
  }

  /**
   * Function determines the start and stop SVG positions of this backbone section using the ratio of known windowStart and svgStart (55)
   * 
   * @param windowStart 
   * @param windowStop 
   */
  private calculateSVGPosition(windowStart: number, windowStop: number, renderType?: RenderType)
  {
    const svgStart = (renderType === 'overview') ? PANEL_SVG_START + SVGConstants.overviewTrackPadding : PANEL_SVG_START;
    const svgStop = (renderType === 'overview') ? PANEL_SVG_STOP - SVGConstants.overviewTrackPadding : PANEL_SVG_STOP;
    const svgLength = svgStop - svgStart;
    const windowLength = windowStop - windowStart;
    const ratio = windowLength / svgLength;

    // Calculate the start and stop SVG positions of this backbone section
    this.windowRatio = ratio;
    const basepairDiff =  this.start < windowStart ? windowStart - this.start : this.start - windowStart;
    const svgDiff = basepairDiff / ratio;

    if (this.start < windowStart)
    {
      this.posY1 = svgStart - svgDiff;
    }
    else if (this.start > windowStart)
    {
      this.posY1 = svgStart + svgDiff;
    }
    else if (this.start === windowStart)
    {
      this.posY1 = svgStart;
    }

    this.posY2 = this.posY1 + ( this.length / ratio );

    this.height = Math.abs(this.posY2 - this.posY1);

    // Calculate X positions of this backbone section
    if (renderType === 'overview')
    {
      this.posX1 = SVGConstants.backboneXPosition;
      this.posX2 = this.posX1 + SVGConstants.trackWidth;
    }
    else if (renderType === 'detailed')
    {
      this.posX1 = SVGConstants.selectedBackboneXPosition;
      this.posX2 = this.posX1 + SVGConstants.trackWidth;
    }

    this.width = Math.abs(this.posX2 - this.posX1);
  }

  private createLabels(renderType: RenderType, start: number, stop: number)
  {
    let startBPLabel: Label;
    let stopBPLabel: Label;

    if (renderType === 'overview')
    {
      startBPLabel = new Label({
        posX: SVGConstants.backboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.posY1 - 3,
        text: Formatter.convertBasePairToLabel(start) ?? ''
      });

      stopBPLabel = new Label({
        posX: SVGConstants.backboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.posY2 + 7,
        text: Formatter.convertBasePairToLabel(stop) ?? ''
      });
    }
    else
    {
      startBPLabel = new Label({
        posX: SVGConstants.selectedBackboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.posY1 + 3,
        text: Formatter.convertBasePairToLabel(start) ?? ''
      });

      stopBPLabel = new Label({
        posX: SVGConstants.backboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.posY2,
        text: Formatter.convertBasePairToLabel(stop) ?? ''
      });
    }
    
    this.labels = this.labels.concat([startBPLabel, stopBPLabel]);
  }
}