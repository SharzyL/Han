import support from "./support";
import { root } from "../vars";

export function initCond(target) {
  target = target || root
  let ret = ''

  for (const feature in support) {
    const clazz = (support[feature] ? '' : 'no-') + feature

    target.classList.add(clazz)
    ret += clazz + ' '
  }

  return ret
}
