import { writeOnCanvas, compareCanvases } from "../locale/detect-font";
import { Finder } from "../find";
import { TYPESET } from "../regex";
import $ from "../method"

const SELECTOR_TO_IGNORE = 'textarea, code, kbd, samp, pre'

function createCompareFactory(font, treat, control) {
  return function () {
    if (!document) return true
    var a = writeOnCanvas(treat, font)
    var b = writeOnCanvas(control, font)
    return compareCanvases(a, b)
  }
}

export function isVowelCombLigaNormal() {
  return createCompareFactory('"Romanization Sans"', '\u0061\u030D', '\uDB80\uDC61')
}

export function isVowelICombLigaNormal() {
  return createCompareFactory('"Romanization Sans"', '\u0069\u030D', '\uDB80\uDC69')
}

export function isZhuyinCombLigaNormal() {
  return createCompareFactory('"Zhuyin Kaiti"', '\u31B4\u0307', '\uDB8C\uDDB4')
}

function createSubstFactory(regexToSubst) {
  return function (context) {
    context = context || document
    const finder = new Finder(context).avoid(SELECTOR_TO_IGNORE)

    regexToSubst
      .forEach(function (pattern) {
        finder
          .replace(
            new RegExp(pattern[0], 'ig'),
            function (portion, match) {
              const ret = charCombLiga()

              // Put the original content in an inner container
              // for better presentational effect of hidden text
              ret.innerHTML = '<h-inner>' + match[0] + '</h-inner>'
              ret.setAttribute('display-as', pattern[1])
              return portion.index === 0 ? ret : ''
            }
          )
      })
    return finder
  }
}

function charCombLiga() {
  return $.create('h-char', 'comb-liga')
}

export const substVowelCombLiga = createSubstFactory(TYPESET['display-as']['comb-liga-vowel'])
export const substVowelICombLiga = createSubstFactory(TYPESET['display-as']['comb-liga-vowel-i'])
export const substZhuyinCombLiga = createSubstFactory(TYPESET['display-as']['comb-liga-zhuyin'])
export const substCombLigaWithPUA = createSubstFactory(TYPESET['display-as']['comb-liga-pua'])

export function substInaccurateChar(context) {
  context = context || document
  const finder = new Finder(context)

  finder.avoid(SELECTOR_TO_IGNORE)

  return TYPESET['inaccurate-char']
    .forEach(pattern =>
      finder
        .replace(
          new RegExp(pattern[0], 'ig'),
          pattern[1]
        )
    )
}

export const subst = {
  'comb-liga-vowel': null,
  'comb-liga-vowel-i': null,
  'comb-liga-zhuyin': null,
  'inaccurate-char': null,

  substVowelCombLiga: function () {
    this['comb-liga-vowel'] = substVowelCombLiga(this.context)
    return this
  },

  substVowelICombLiga: function () {
    this['comb-liga-vowel-i'] = substVowelICombLiga(this.context)
    return this
  },

  substZhuyinCombLiga: function () {
    this['comb-liga-zhuyin'] = substZhuyinCombLiga(this.context)
    return this
  },

  substCombLigaWithPUA: function () {
    if (!isVowelCombLigaNormal()) {
      this['comb-liga-vowel'] = substVowelCombLiga(this.context)
    } else if (!isVowelICombLigaNormal()) {
      this['comb-liga-vowel-i'] = substVowelICombLiga(this.context)
    }

    if (!isZhuyinCombLigaNormal()) {
      this['comb-liga-zhuyin'] = substZhuyinCombLiga(this.context)
    }
    return this
  },

  revertVowelCombLiga: function () {
    try {
      this['comb-liga-vowel'].revert('all')
    } catch (e) {
    }
    return this
  },

  revertVowelICombLiga: function () {
    try {
      this['comb-liga-vowel-i'].revert('all')
    } catch (e) {
    }
    return this
  },

  revertZhuyinCombLiga: function () {
    try {
      this['comb-liga-zhuyin'].revert('all')
    } catch (e) {
    }
    return this
  },

  revertCombLigaWithPUA: function () {
    try {
      this['comb-liga-vowel'].revert('all')
      this['comb-liga-vowel-i'].revert('all')
      this['comb-liga-zhuyin'].revert('all')
    } catch (e) {
    }
    return this
  },

  substInaccurateChar: function () {
    this['inaccurate-char'] = substInaccurateChar(this.context)
    return this
  },

  revertInaccurateChar: function () {
    try {
      this['inaccurate-char'].revert('all')
    } catch (e) {
    }
    return this
  }
}
