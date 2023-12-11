import BackboneSelection, { BasePairRange } from "./BackboneSelection";

export default interface UserHistory {
    timestamp: number
    range: BasePairRange
    source: string
    backbone: BackboneSelection
}
