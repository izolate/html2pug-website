import { debounce } from './utils'

const KEY_TAB = 'Tab'
const API_URL = '/.netlify/functions/html2pug'

const state = {
  input: null,
  output: null,
  settings: {
    tabs: false,
  },
}

const convertToPug = async (html = '') => {
  if (!state.output) {
    state.output = document.getElementById('output')
  }

  // Send HTML to server for conversion
  const res = await fetch(API_URL, { body: html })
  const text = await res.text()
  return text
}

const updateOutput = value => {
  const { output } = state
  if (output) {
    output.value = value
  }
}

const indentForward = el => {
  const s = el.selectionStart
  const tab = state.settings.tab ? '\t' : ' '.repeat(2)

  const start = el.value.substring(0, s)
  const end = el.value.substring(el.selectionEnd)

  el.value = `${start}${tab}${end}`
  el.selectionEnd = s + tab.length
}

const handleInputKeyDown = e => {
  const { key, shiftKey, target: input } = e
  if (key === KEY_TAB) {
    e.preventDefault()
    input.focus()

    if (!shiftKey) {
      return indentForward(input)
    }
  }
}

const handleInputChange = e => {
  const { target: input } = e
  return convertToPug(input.value)
    .then(pug => updateOutput(pug))
    .catch(err => {
      // TODO
      console.error(err)
    })
}

function main() {
  if (!state.input) {
    state.input = document.getElementById('input')
  }

  state.input.addEventListener('keydown', e => handleInputKeyDown(e))
  state.input.addEventListener(
    'input',
    debounce(e => handleInputChange(e), 200)
  )
}

window.addEventListener('load', main)
