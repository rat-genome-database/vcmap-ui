import Label from './Label';
import SVGConstants, { PANEL_SVG_START } from '@/utils/SVGConstants';
import { Formatter } from '@/utils/Formatter';
import Chromosome from './Chromosome';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import Gene from '@/models/Gene';
import GenomicSection, { RenderType, WindowBasePairRange } from './GenomicSection';
import Species from './Species';

export type BackboneSectionParams = {
  start: number;
  stop: number;
  windowBasePairRange: WindowBasePairRange;
  chromosome: string;
  species: Species;
  renderType: RenderType;
  createLabels?: boolean;
}

export default class BackboneSection extends GenomicSection
{
  labels: Label[] = []; // BP labels for the backbone section
  renderType: RenderType = 'overview';
  hasLabels: boolean = false;
  backboneGenes?: Gene[]; // All Genes that fit within this backbone section

  constructor(params: BackboneSectionParams)
  {
    super({
      speciesName: params.species.name,
      mapName: params.species.activeMap.name,
      chromosome: params.chromosome,
      start: params.start,
      stop: params.stop,
      type: 'block',
      color: Chromosome.getColor(params.chromosome ?? ''),
      backboneAlignment: {
        start: params.start,
        stop: params.stop,
      },
      windowBasePairRange: params.windowBasePairRange,
      renderType: params.renderType,
    });

    this.renderType = params.renderType;
    this.hasLabels = params.createLabels ?? false;

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

  public recalculateLabelYPositions(): void
  {
    if (this.hasLabels)
    {
      this.createLabels();
    } 
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
    const startingSVGY = this.posY1 + (start - this.speciesStart) / basePairToHeightRatio;
    const svgHeight = (stop - start) / basePairToHeightRatio;

    //calculate full chromosome selection
    const fullBackboneChr = new SelectedRegion(PANEL_SVG_START, ( chromosome.seqLength / basePairToHeightRatio ), 0, chromosome.seqLength);

    const selection = new BackboneSelection(new SelectedRegion(startingSVGY, svgHeight, start, stop), chromosome, fullBackboneChr);
    selection.setViewportSelection(start, stop, basePairToHeightRatio);
    return selection;
  }

  private createLabels()
  {
    let startBPLabel: Label;
    let stopBPLabel: Label;

    if (this.renderType === 'overview')
    {
      startBPLabel = new Label({
        posX: SVGConstants.backboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.windowSVGStart - 3,
        text: Formatter.convertBasePairToLabel(this.windowStart) ?? ''
      });

      stopBPLabel = new Label({
        posX: SVGConstants.backboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.windowSVGStop + 7,
        text: Formatter.convertBasePairToLabel(this.windowStop) ?? ''
      });
    }
    else
    {
      startBPLabel = new Label({
        posX: SVGConstants.selectedBackboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.windowSVGStart + 10,
        text: Formatter.convertBasePairToLabel(this.windowStart) ?? ''
      });

      stopBPLabel = new Label({
        posX: SVGConstants.selectedBackboneXPosition - (SVGConstants.trackWidth / 2 ),
        posY: this.windowSVGStop - 10,
        text: Formatter.convertBasePairToLabel(this.windowStop) ?? ''
      });
    }
    
    this.labels = [startBPLabel, stopBPLabel];
  }
}