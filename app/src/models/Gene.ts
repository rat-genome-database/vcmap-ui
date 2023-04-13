import Block from "@/models/Block";

interface GeneParams
{
  mapKey: number;
  speciesName?: string;
  symbol: string;
  name: string;
  rgdId: number;
  chromosome: string;
  start: number;
  stop: number;
  backboneStart?: number;
  backboneStop?: number;
  orthologs?: number[];
  block?: Block;
}

export default class Gene
{
  mapKey: number;
  speciesName: string = '';
  symbol: string = '';
  name: string = '';
  rgdId: number = 0;
  chromosome: string = '';
  start: number = 0;
  stop: number = 0;
  backboneStart: number = 0;
  backboneStop: number = 0;
  // RGD IDs -- Note: will only be populated if Gene was received from the Synteny API with the includeOrthologs param
  // TODO: Switch to "null" here to indicate not yet obtained.
  orthologs: number[] = [];
  block: Block | null = null;
  constructor(params: GeneParams)
  {
    this.mapKey = params.mapKey;
    this.speciesName = params.speciesName ?? this.speciesName;
    this.symbol = params.symbol;
    this.name = params.name;
    this.rgdId = params.rgdId;
    this.chromosome = params.chromosome;
    this.start = params.start;
    this.stop = params.stop;
    this.backboneStart = params.backboneStart ?? this.backboneStart;
    this.backboneStop = params.backboneStop ?? this.backboneStop;
    this.orthologs = params.orthologs ?? [];
    this.block = params.block?? this.block;
  }

  /**
   * Operation to create a copy of this object WITHOUT references to its parent Block.
   * This must be used before the Object is placed on the store to avoid a large /
   * circular data structure getting pushed to our immutable store.
   *
   * When previously set, backboneStart / Stop are copied as well as the list of
   * Ortholog rgdIds. If they weren't set previously, they will be null on the clone
   * as well. Block is always set to `null` on the clone.
   * @return
   *   A copy of the Gene without reference to its parent Block.
   */
  clone(): Gene
  {
    const clone = new Gene({
      mapKey: this.mapKey,
      speciesName: this.speciesName,
      symbol: this.symbol,
      name: this.name,
      rgdId: this.rgdId,
      chromosome: this.chromosome,
      start: this.start,
      stop: this.stop,
    });
    if (this.backboneStart) clone.backboneStart = this.backboneStart;
    if (this.backboneStop) clone.backboneStop = this.backboneStop;
    if (this.orthologs.length > 0) clone.orthologs = this.orthologs;
    return clone;
  }

  /**
   * Returns the size of the Gene in basepairs
   */
  public get size()
  {
    return Math.abs(this.stop - this.start);
  }
}