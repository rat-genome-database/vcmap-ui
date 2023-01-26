import { SVGShape, VCMapSVGElement } from './VCMapSVGElement';
import SyntenyRegion from './SyntenyRegion';
import Label from './Label';
import SVGConstants, { PANEL_SVG_START, PANEL_SVG_STOP } from '@/utils/SVGConstants';
import { Formatter } from '@/utils/Formatter';
import Chromosome from './Chromosome';
import Species from './Species';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import Gene from '@/models/Gene';

export type RenderType = 'overview' | 'detailed';


export interface BackboneSectionParams
{
  start: number;
  stop: number;
  windowStart: number;
  windowStop: number;
  chromosome?: string;
  species?: Species;
  speciesName?: string;
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
  speciesName: string = ''; // species name
  chromosome: string = '';  // chromosome that this section is from
  syntenyRegions: SyntenyRegion[] = [];
  labels: Label[] = []; // BP labels for the backbone section
  renderType: RenderType = 'overview';
  hasLabels: boolean = false;
  backboneGenes?: Gene[]; // All Genes that fit within this backbone section

  constructor(params: BackboneSectionParams)
  {
    this.start = params.start;
    this.stop = params.stop;
    this.length = Math.abs(this.stop - this.start);
    this.windowStart = params.windowStart;
    this.windowStop = params.windowStop;
    this.chromosome = params.chromosome ?? '';
    this.species = params.species;
    this.speciesName = params.speciesName ?? '';
    this.elementColor = Chromosome.getColor(this.chromosome);
    this.renderType = params.renderType;
    this.hasLabels = params.createLabels ?? false;

    this.calculateYPositions();
    if (this.hasLabels)
    {
      this.createLabels();
    }
  }

  public setBackboneGenes(backboneGenes: Gene[])
  {
    this.backboneGenes = backboneGenes;
  }

  public addBackboneGenes(backboneGenes: Gene[])
  {
    this.backboneGenes = this.backboneGenes?.concat(backboneGenes) ?? backboneGenes;
  }

  /**
   * Change the windowStart, windowStop of the backbone and regenerate SVG Y positions.
   * windowStart and windowStop are analagous to the inner selection start/stop.
   * 
   * @param windowStart number (bp)
   * @param windowStop number (bp)
   */
  public changeWindowStartAndStop(windowStart: number, windowStop: number)
  {
    this.windowStart = windowStart;
    this.windowStop = windowStop;
    this.calculateYPositions();
    if (this.hasLabels)
    {
      this.createLabels();
    }
  }

  public expandBaseStartAndStop(start: number, stop: number)
  {
    start < this.start ? this.start = start : null;
    stop > this.stop ? this.stop = stop : null;
  }

  /**
   * Creates a BackboneSelection object based on a desired selected region
   * @param start starting basepair
   * @param stop stopping basepair
   * @param basePairToHeightRatio the ratio of bp/svg height units (depends on what panel the track section is rendered in)
   * @param chromosome backbone chromosome model
   * @returns a BackboneSelection object containing an inner selection of the same region
   */
  public generateBackboneSelection(start: number, stop: number, basePairToHeightRatio: number, chromosome: Chromosome)
  {
    const startingSVGY = this.posY1 + (start - this.start) / basePairToHeightRatio;
    const svgHeight = (stop - start) / basePairToHeightRatio;

    //calculate full chromosome selection
    const fullBackboneChr = new SelectedRegion(PANEL_SVG_START, ( chromosome.seqLength / basePairToHeightRatio ), 0, chromosome.seqLength);

    const selection = new BackboneSelection(new SelectedRegion(startingSVGY, svgHeight, start, stop), chromosome, fullBackboneChr);
    selection.generateInnerSelection(start, stop, basePairToHeightRatio);
    return selection;
  }

  /**
   * Function determines the start and stop SVG positions of this backbone section using the ratio of known windowStart and svgStart (55)
   * 
   * @param windowStart 
   * @param windowStop 
   */
  private calculateYPositions()
  {
    const svgStart = this.getWindowSVGStart();
    const svgStop = this.getWindowSVGStop();
    const svgLength = svgStop - svgStart;
    const windowLength = Math.abs(this.windowStop - this.windowStart);
    const ratio = windowLength / svgLength;

    // Calculate the start and stop SVG positions of this backbone section
    this.windowRatio = ratio;
    const basepairDiff =  this.start < this.windowStart ? this.windowStart - this.start : this.start - this.windowStart;
    const svgDiff = basepairDiff / ratio;

    if (this.start < this.windowStart)
    {
      this.posY1 = svgStart - svgDiff;
    }
    else if (this.start > this.windowStart)
    {
      this.posY1 = svgStart + svgDiff;
    }
    else if (this.start === this.windowStart)
    {
      this.posY1 = svgStart;
    }

    this.posY2 = this.posY1 + ( this.length / ratio );

    this.height = Math.abs(this.posY2 - this.posY1);
  }

  private createLabels()
  {
    let startBPLabel: Label;
    let stopBPLabel: Label;

    if (this.renderType === 'overview')
    {
      startBPLabel = new Label({
        posX: SVGConstants.backboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.getWindowSVGStart() - 3,
        text: Formatter.convertBasePairToLabel(this.windowStart) ?? ''
      });

      stopBPLabel = new Label({
        posX: SVGConstants.backboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.getWindowSVGStop() + 7,
        text: Formatter.convertBasePairToLabel(this.windowStop) ?? ''
      });
    }
    else
    {
      startBPLabel = new Label({
        posX: SVGConstants.selectedBackboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.getWindowSVGStart() + 10,
        text: Formatter.convertBasePairToLabel(this.windowStart) ?? ''
      });

      stopBPLabel = new Label({
        posX: SVGConstants.selectedBackboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.getWindowSVGStop() - 10,
        text: Formatter.convertBasePairToLabel(this.windowStop) ?? ''
      });
    }
    
    this.labels = [startBPLabel, stopBPLabel];
  }

  private getWindowSVGStart()
  {
    return (this.renderType === 'overview') ? PANEL_SVG_START + SVGConstants.overviewTrackPadding : PANEL_SVG_START;
  }

  private getWindowSVGStop()
  {
    return (this.renderType === 'overview') ? PANEL_SVG_STOP - SVGConstants.overviewTrackPadding : PANEL_SVG_STOP;
  }
}