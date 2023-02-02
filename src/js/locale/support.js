import $ from "../method"
import { detectFont } from "./detect-font";
import { document, body, root } from "../vars";
import { isSpaceFontLoaded } from "../inline/hanging";

const PREFIX = 'Webkit Moz ms'.split(' ')

// Create an element for feature detecting
// (in `testCSSProp`)
const elem = document && $.create('h-test')

function testCSSProp(prop) {
  if (!document) return true;
  const ucProp = prop.charAt(0).toUpperCase() + prop.slice(1)
  const allProp = (prop + ' ' + PREFIX.join(ucProp + ' ') + ucProp).split(' ')
  let ret

  allProp.forEach(function (prop) {
    if (typeof elem.style[prop] === 'string') {
      ret = true
    }
  })
  return ret || false
}

function injectElementWithStyle(rule, callback) {
  const fakeBody = body || $.create('body')
  const div = $.create('div')
  const container = body ? div : fakeBody
  callback = typeof callback === 'function' ? callback : () => {
  }
  let ret, docOverflow

  const style = ['<style>', rule, '</style>'].join('')

  container.innerHTML += style
  fakeBody.appendChild(div)

  if (!body) {
    fakeBody.style.background = ''
    fakeBody.style.overflow = 'hidden'
    docOverflow = root.style.overflow

    root.style.overflow = 'hidden'
    root.appendChild(fakeBody)
  }

  // Callback
  ret = callback(container, rule)

  // Remove the injected scope
  $.remove(container)
  if (!body) {
    root.style.overflow = docOverflow
  }
  return !!ret
}

function getStyle(elem, prop) {
  let ret

  if (window.getComputedStyle) {
    ret = document.defaultView.getComputedStyle(elem, null).getPropertyValue(prop)
  } else if (elem.currentStyle) {
    // for IE
    ret = elem.currentStyle[prop]
  }
  return ret
}

const support = {
  columnWidth: testCSSProp('columnWidth'),

  fontface: (function () {
    if (!document) return true;
    let ret

    injectElementWithStyle(
      '@font-face { font-family: font; src: url("//"); }',
      function (node, rule) {
        const style = $.qsa('style', node)[0]
        const sheet = style.sheet || style.styleSheet
        const cssText = sheet ?
          (sheet.cssRules && sheet.cssRules[0] ?
              sheet.cssRules[0].cssText : sheet.cssText || ''
          ) : ''

        ret = /src/i.test(cssText) &&
          cssText.indexOf(rule.split(' ')[0]) === 0
      }
    )

    return ret
  })(),

  ruby: (function () {
    if (!document) return true;
    let ruby = $.create('ruby')
    let rt = $.create('rt')
    let rp = $.create('rp')
    let ret

    ruby.appendChild(rp)
    ruby.appendChild(rt)
    root.appendChild(ruby)

    // Browsers that support ruby hide the `<rp>` via `display: none`
    ret = (
      getStyle(rp, 'display') === 'none' ||
      // but in IE, `<rp>` has `display: inline`, so the test needs other conditions:
      (getStyle(ruby, 'display') === 'ruby' && getStyle(rt, 'display') === 'ruby-text')
    )

    // Remove and clean from memory
    root.removeChild(ruby)
    ruby = null
    rt = null
    rp = null

    return ret
  })(),

  'ruby-display': (function () {
    if (!document) return true;
    const div = $.create('div')

    div.innerHTML = '<h-test-a style="display: ruby;"></h-test-a><h-test-b style="display: ruby-text-container;"></h-test-b>'
    return div.querySelector('h-test-a').style.display === 'ruby' && div.querySelector('h-test-b').style.display === 'ruby-text-container'
  })(),

  'ruby-interchar': (function () {
    if (!document) return true;
    const IC = 'inter-character'
    const div = $.create('div')

    div.innerHTML = '<h-test style="-moz-ruby-position:' + IC + ';-ms-ruby-position:' + IC + ';-webkit-ruby-position:' + IC + ';ruby-position:' + IC + ';"></h-test>'
    const css = div.querySelector('h-test').style
    return css.rubyPosition === IC || css.WebkitRubyPosition === IC || css.MozRubyPosition === IC || css.msRubyPosition === IC
  })(),

  textEmphasis: testCSSProp('textEmphasis'),

  // Address feature support test for `unicode-range` via
  // detecting whether it's Arial (supported) or
  // Times New Roman (not supported).
  unicodeRange: (function () {
    if (!document) return true;
    let ret

    injectElementWithStyle(
      '@font-face{font-family:test-for-unicode-range;src:local(Arial),local("Droid Sans")}@font-face{font-family:test-for-unicode-range;src:local("Times New Roman"),local(Times),local("Droid Serif");unicode-range:U+270C}',
      function () {
        ret = !detectFont(
          'test-for-unicode-range', // treatment group
          'Arial, "Droid Sans"',    // control group
          'Q'                       // ASCII characters only
        )
      }
    )
    return ret
  })(),

  writingMode: testCSSProp('writingMode'),

  // Assume that all devices support Heiti for we
  // use `sans-serif` to do the comparison.
  heiti: true,
  // 'heiti-gb': true,

  songti: detectFont('"Han Songti"'),
  'songti-gb': detectFont('"Han Songti GB"'),

  kaiti: detectFont('"Han Kaiti"'),
  // 'kaiti-gb': Han.detectFont( '"Han Kaiti GB"' ),

  fangsong: detectFont('"Han Fangsong"'),
  // 'fangsong-gb': Han.detectFont( '"Han Fangsong GB"' )

  'han-space': isSpaceFontLoaded,
}

export default support