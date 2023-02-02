import { document, body } from "../vars";
import $ from "../method"

export function writeOnCanvas(text, font) {
  const canvas = $.create('canvas')
  let context

  canvas.width = '50'
  canvas.height = '20'
  canvas.style.display = 'none'

  body.appendChild(canvas)

  context = canvas.getContext('2d')
  context.textBaseline = 'top'
  context.font = '15px ' + font + ', sans-serif'
  context.fillStyle = 'black'
  context.strokeStyle = 'black'
  context.fillText(text, 0, 0)

  return {
    node: canvas,
    context: context,
    remove: function () {
      $.remove(canvas, body)
    }
  }
}

export function compareCanvases(treat, control) {
  let ret
  const a = treat.context
  const b = control.context

  try {
    for (let j = 1; j <= 20; j++) {
      for (let i = 1; i <= 50; i++) {
        if (
          typeof ret === 'undefined' &&
          a.getImageData(i, j, 1, 1).data[3] !== b.getImageData(i, j, 1, 1).data[3]
        ) {
          ret = false
          break
        } else if (typeof ret === 'boolean') {
          break
        }

        if (i === 50 && j === 20 && typeof ret === 'undefined') {
          ret = true
        }
      }
    }

    // Remove and clean from memory
    treat.remove()
    control.remove()
    treat = null
    control = null

    return ret
  } catch (e) {
  }
  return false
}

export function detectFont(treat, control, text) {
  if (!document) return true
  control = control || 'sans-serif'
  text = text || '辭Q'

  control = writeOnCanvas(text, control)
  treat = writeOnCanvas(text, treat)

  return !compareCanvases(treat, control)
}
