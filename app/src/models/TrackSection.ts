import { Formatter } from '@/utils/Formatter';
import BackboneSelection, { SelectedRegion } from './BackboneSelection';
import Chromosome from './Chromosome';
import Gene from './Gene';

interface TrackSectionParams
{
  start: number; // starting base pair of this section, following the direction of its orientation (start could be larger than stop if inverted)
  stop: number; // ending base pair of this section, following the direction of its orientation (stop could be smaller than start if inverted)
  backboneStart: number; // base pair on the backbone that this section's starting base pair lines up with
  backboneStop: number; // base pair on the backbone that this section's ending base pair lines up with
  chromosome: string; // chromosome name
  cutoff: number; // last base pair that is displayed for the backbone
  offsetCount?: number; // number of base pairs before this section should begin, useful for knowing when to begin drawing the section
  basePairToHeightRatio: number; // number of base pairs per unit of height in the SVG, use the Resolution module to get the correct ratio
  svgY?: number; // the Y position of the section on the SVG
  color?: string; // explicitly defined color of the section
  shape: 'rect' | 'line';
  gene?: Gene; // optional - the gene that this section represents
  hiddenGenes?: TrackSection[]; // optional - list of gene track sections that are hidden due to threshold or contained by this section
  combinedGenes?: TrackSection[]; // optional - list of gene track sections that are combined into this section label
  isComparativeGene?: boolean; // optional - whether this section is a comparative section
  chainLevel?: number;
  isInverted?: boolean;
  isVisible?: boolean;
  blockId?: number;  //used to identify the block in the synteny track when processing genes
}

export default class TrackSection
{
  sectionStart: number = 0;
  sectionStop: number = 0;
  backboneStart: number = 0;
  backboneStop: number = 0;
  chromosome: string = '';
  chainLevel?: number;
  gene?: Gene;
  trackColor: string = '';
  isHovered: boolean = false;
  isSelected: boolean = false;
  hiddenGenes?: TrackSection[] = [];
  combinedGenes?: TrackSection[] = [];
  altLabels: {rgdId: number, text: string}[] = [];
  showAltLabel: boolean = false;
  isComparativeGene?: boolean = false;
  shape: 'rect' | 'line' = 'rect';
  svgY: number = 0;
  adjustedHeight?: number = 0;
  isInverted: boolean = false;
  isVisible: boolean = true;
  _offsetCount: number = 0;
  blockId?: number;
  _backboneCutoff: number = 0;
  _BPToHeightRatio: number = 0;
  _displayBackboneStart: number = 0; // the displayed starting base pair position on the backbone that this section lines up with
  _displayBackboneStop: number = 0; // the displayed ending base pair position on the backbone that this section lines up with

  constructor(params: TrackSectionParams)
  {
    this.sectionStart = params.start;
    this.sectionStop = params.stop;
    this.backboneStart = params.backboneStart;
    this.backboneStop = params.backboneStop;
    this.chromosome = params.chromosome;
    this.gene = params.gene;
    this.trackColor = params.color ?? '';
    this.hiddenGenes = [...params.hiddenGenes || []];
    this.combinedGenes = [...params.hiddenGenes || []];
    this.altLabels = params.hiddenGenes ? params.hiddenGenes.map((section) => {
      return {rgdId: section.gene?.rgdId || -1, text: section.gene?.symbol || ''};
    }) : [];
    this.altLabels.unshift({rgdId: params.gene?.rgdId || -1, text: params.gene?.symbol || ''});
    this.isComparativeGene = params.isComparativeGene;
    this.shape = params.shape;
    this._backboneCutoff = params.cutoff;
    this._offsetCount = params.offsetCount ?? 0;
    this._BPToHeightRatio = params.basePairToHeightRatio;
    this.chainLevel = params.chainLevel;
    this.isInverted = params.isInverted ?? false;
    this.isVisible = params.isVisible ?? true;
    this.blockId = params.blockId;
    params.svgY ? this.svgY = params.svgY : this.svgY = 0;

    // Calculate the display start BP and stop BP relative to the backbone that this section might aligning against:
    this.calculateDisplayedBPRegionRelativeToBackbone();
  }

  public get color()
  {
    let color;
    color = Chromosome.getColor(this.chromosome);
    this.trackColor == '' ? color : color = this.trackColor;
    return color;
  }

  public get startBPLabel()
  {
    if (this._displayBackboneStart !== this.backboneStart)
    {
      return Formatter.convertBasePairToLabel(this.sectionStart + (this._displayBackboneStart - this.backboneStart));
    }

    return Formatter.convertBasePairToLabel(this.sectionStart);
  }

  public get stopBPLabel()
  {
    if (this._displayBackboneStop !== this.backboneStop)
    {
      return Formatter.convertBasePairToLabel(this.sectionStop - (this.backboneStop - this._displayBackboneStop));
    }

    return Formatter.convertBasePairToLabel(this.sectionStop);
  }

  public get regionLabel()
  {
    const start = this.isInverted ? this.sectionStop : this.sectionStart;
    const stop = this.isInverted ? this.sectionStart : this.sectionStop;

    return Formatter.addCommasToBasePair(start) + ' - ' + Formatter.addCommasToBasePair(stop);
  }

  public get geneLabel()
  {
    if (this.gene)
    {
      let geneName = this.gene.symbol;
      let truncatedGenes = '';

      if (!this.combinedGenes && !this.hiddenGenes)
      {
        return geneName;
      }

      if (this.combinedGenes && this.combinedGenes.length > 0)
      {
        // Combined genes for this section includes hidden genes plus the added combined
        // So the number of genes represented is combined + 1 (the gene itself)
        truncatedGenes = `...(${this.combinedGenes.length + 1})`;
      }
      else if (this.hiddenGenes && this.hiddenGenes.length > 0)
      {
        truncatedGenes = `...(${this.hiddenGenes.length})`;
      }
      
      if (truncatedGenes.length > 0)
      {
        truncatedGenes.length > 9 ? geneName = geneName.substring(0, 4) : geneName = geneName.substring(0, 5);
        geneName += truncatedGenes;
      }
      else
      {
        if (geneName.length > 9)
        {
          geneName = geneName.substring(0, 10) + '...';
        }
      }
      return geneName;
    }
  }

  // Getter for the height of this section in SVG units
  public get height()
  {
    if (!this.isVisible)
    {
      return 0;
    }
    let height = (this._displayBackboneStop - this._displayBackboneStart) / this._BPToHeightRatio;
    if (this.adjustedHeight)
    {
      height = this.adjustedHeight;
    }
    return height;
  }

  // Getter for the ending SVG Y point
  public get svgY2()
  {
    let svgY2 = this.svgY + this.height;
    if (this.adjustedHeight)
    {
      svgY2 = this.svgY + this.adjustedHeight;
    }
    return svgY2;
  }

  public get offsetHeight()
  {
    // offset height cannot be negative (happens if synteny block starts before start of the backbone region)
    return (this._offsetCount >= 0) ? (this._offsetCount / this._BPToHeightRatio) : 0;
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
    const startingSVGY = this.svgY + (start - this.sectionStart) / basePairToHeightRatio;
    const svgHeight = (stop - start) / basePairToHeightRatio;

    const selection = new BackboneSelection(new SelectedRegion(startingSVGY, svgHeight, start, stop), chromosome);
    selection.generateInnerSelection(start, stop, basePairToHeightRatio);
    return selection;
  }

  private calculateDisplayedBPRegionRelativeToBackbone()
  {
    // The display start and stop BP can be different than the actual start/stop BPs of this section. The display is used
    // to calculate the how tall the section is on the screen. If the base pair region of this section extends before or
    // after the base pair region of the backbone it is being compared to, we want to modify the display BPs so that they line
    // up appropriately with that region. This is why we use a `_backboneCutoff` prop when calculating the `displayStopBP` and why we
    // might need to adjust the `displayStartBP` when the `_offsetCount` is negative (indicating that the start of this section extends
    // above the backbone region).
    this._displayBackboneStop = (this.backboneStop > this._backboneCutoff) ? this._backboneCutoff : this.backboneStop;
    this._displayBackboneStart = (this._offsetCount >= 0) ? this.backboneStart : this.backboneStart - this._offsetCount;

    if (this._displayBackboneStop < this._displayBackboneStart)
    {
      if (this.backboneStop > this._displayBackboneStart)
      {
        this._displayBackboneStop = this.backboneStop;
      }
      
    }
  }
}