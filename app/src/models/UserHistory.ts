import BackboneSelection, { BasePairRange } from "./BackboneSelection";

export default interface UserHistory {
    timestamp: Date
    range: BasePairRange
    source: string
    backbone: BackboneSelection
};
