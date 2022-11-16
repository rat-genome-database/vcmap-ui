import BackboneSection from './BackboneSection';
import SyntenySection from './SyntenySection';
import DatatrackSection from './DatatrackSection';
import Label from './Label';

interface SyntenySectionParams
{
  species: string;
}

//This model is used to store data for a syntenic section offbackbone
export default class SyntenyRegion
{
  syntenyGaps: SyntenySection[] = [];                         // synteny gaps occupying this section
  syntenyBlocks: SyntenySection[] = [];                       // synteny blocks occupying this section
  datatrackSections: DatatrackSection[] = [];                 // DatatrackSections belonging to this SyntenySection
  backboneSelection: BackboneSection | undefined;             // backbone section that this synteny section is aligned to
  species: string = '';                                       // species that this section is from
  //chromosome: Chromosome = new Chromosome();                // chromosome that this section is from
  // NOTE: We should evaluate if we want this, if its just a copy of the references to the labels in SyntenyRegion.datatrackSections
  datatrackLabels: Label[] = [];                               // array of Label objects associated with the datatrackSections

  constructor(params: SyntenySectionParams)
  {
    this.species = params.species;
  }

  public addSyntenyGap(syntenyGap: SyntenySection)
  {
    this.syntenyGaps.push(syntenyGap);
    this.syntenyGaps.sort((a, b) => a.posY1 - b.posY1);
  }

  public addSyntenyBlock(syntenyBlock: SyntenySection)
  {
    this.syntenyBlocks.push(syntenyBlock);
    this.syntenyBlocks.sort((a, b) => a.posY1 - b.posY1);
  }

  public addDatatrackSection(type: string, datatrackSection: DatatrackSection)
  {
    this.datatrackSections.push(datatrackSection);
  }
}