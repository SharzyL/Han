import { root, body } from "./vars"
import { renderHanging } from "./inline/hanging";
import { correctBiaodian } from "./typography/biaodian";
import { renderJiya, revertJiya } from "./inline/jiya";
import { initCond } from "./locale/init-cond";
import { renderElem } from "./locale/normalize";
import { renderHWS, renderHWSStrict } from "./inline/hws";
import { renderRuby } from "./locale/h-ruby";
import { renderDecoLine, renderEm } from "./locale/normalize";
import { substCombLigaWithPUA } from "./inline/subst";

const VERSION = '@VERSION'

const defaultRoutine = [
  // Initialise the condition with feature-detecting
  // classes (Modernizr-alike), binding onto the root
  // element, possibly `<html>`.
  'initCond',

  // Address element normalisation
  'renderElem',

  // Handle Biaodian
  /* 'jinzify', */
  'renderJiya',
  'renderHanging',

  // Address Biaodian correction
  'correctBiaodian',

  // Address Hanzi and Western script mixed spacing
  'renderHWS',

  // Address presentational correction to combining ligatures
  'substCombLigaWithPUA'

  // Address semantic correction to inaccurate characters
  // **Note:** inactivated by default
  /* 'substInaccurateChar', */
]

export default class Han {
  static version = VERSION

  static allSteps = {
    initCond,
    renderElem, renderRuby, renderDecoLine, renderEm,
    renderJiya, revertJiya,
    renderHanging,
    correctBiaodian,
    renderHWS, renderHWSStrict,
    substCombLigaWithPUA
  }

  constructor(context, condition) {
    this.context = context || body
    this.condition = condition || root
    this.routine = defaultRoutine
  }

  setRoutine(routine) {
    if (Array.isArray(routine)) {
      this.routine = routine
    }
    return this
  }

  // Note that the routine set up here will execute
  // only once. The method won't alter the routine in
  // the instance or in the prototype chain.
  render(routine) {
    this.condition.classList.add('han-js-rendered');
    (routine || this.routine).forEach(method => {
      const step = Han.allSteps[method]
      if (step === undefined) {
        throw Error(`cannot find step of name '${method}'`)
      } else {
        step(this.context)
      }
    })
    return this
  }
}
