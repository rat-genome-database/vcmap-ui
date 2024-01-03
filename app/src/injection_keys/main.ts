// Injection keys for the Main.vue component

import Chromosome from "@/models/Chromosome";
import { InjectionKey } from "vue";

export const querySyntenyForSearchZoomKey = Symbol() as InjectionKey<(
  chr: Chromosome,
  windowStart: number,
  windowStop: number,
  geneMapKey: number
) => Promise<void>>;