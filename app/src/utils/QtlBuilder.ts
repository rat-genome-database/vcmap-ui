// import DatatrackSection from "@/models/DatatrackSection";
// import { GenomicSectionFactory } from "@/models/GenomicSectionFactory";
// import { BackboneAlignment } from "@/models/GenomicSection";

// NOTE: Once QTLs are added, we will need to follow a similar pattern to how GeneDatatracks and VariantDensitys are created.
//  See DatatrackSection.ts and GenomicSectionFactory.ts

// export function createQtlDatatracks(factory: GenomicSectionFactory, qtls: any[], backboneSpecies: any, chromosome: any)
// {
//   const qtlDatatracks = qtls.map((qtl) => {
//     const backboneAlignment: BackboneAlignment = { start: qtl.start, stop: qtl.stop };
//     const newQtl = new DatatrackSection({
//       start: qtl.start,
//       stop: qtl.stop,
//       speciesName: factory.speciesName,
//       mapName: factory.mapName,
//       chromosome: factory.chromosome,
//       type: 'qtl',
//       color: 'blue',
//       backboneAlignment: backboneAlignment,
//       windowBasePairRange: factory.windowBasePairRange,
//       renderType: 'detailed'
//     });
//     newQtl.opacity = 0.01;
//     newQtl.adjustYPositionsBasedOnVisibleStartAndStop({start: 0, stop: chromosome.seqLength});
//     return newQtl;
//   });
//   return qtlDatatracks;
// }