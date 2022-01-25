/**
 *  Custom Error Messages for VCMap 
 */

export const backboneOverviewError = new Error('Cannot render the overview panel without valid species, chromosome, and start/stop for the backbone');

export const backboneDetailedError = new Error('Cannot render the detailed panel without valid species and chromosome for the backbone');

export const noRegionLengthError = new Error('Region length must be greater than zero');

export const missingComparativeSpeciesError = new Error('Cannot load synteny without any comparative species maps selected');