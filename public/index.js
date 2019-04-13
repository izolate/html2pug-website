import { debounce } from './utils.js'

const KEY_TAB = 'Tab'
const HTTP_METHOD_POST = 'post'
const API_URL = '/.netlify/functions/html2pug'
const DEBOUNCE_MS = 500

const state = {
  el: {
    main: null,
    input: null,
    output: null,
    menuBtn: null,
  },

  settings: {
    useTabs: false,
    useCommas: true,
    isFragment: true,
  },
}

const convertToPug = async (html = '') => {
  // Send HTML to server for conversion
  const res = await fetch(API_URL, {
    method: HTTP_METHOD_POST,
    body: JSON.stringify({ html, settings: state.settings }),
  })
  const text = await res.text()
  return text
}

const updateOutput = value => {
  const { output } = state.el
  if (output) {
    output.value = value
  }
}

const indentForward = el => {
  const s = el.selectionStart
  const tab = state.settings.useTabs ? '\t' : ' '.repeat(2)

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

const handleMenuBtnClick = e => {
  const { currentTarget: btn } = e
  const { main } = state.el
  console.log(btn)

  if (main.classList.contains('narrow')) {
    main.classList.remove('narrow')
  } else {
    main.classList.add('narrow')
  }
}

function main() {
  state.el.main = document.getElementById('page')
  state.el.input = document.getElementById('input')
  state.el.output = document.getElementById('output')
  state.el.menuBtn = document.getElementById('menu-btn')

  const { input, menuBtn } = state.el

  input.addEventListener('keydown', handleInputKeyDown)
  input.addEventListener(
    'input',
    debounce(e => handleInputChange(e), DEBOUNCE_MS)
  )

  menuBtn.addEventListener('click', handleMenuBtnClick)

  // Clear inputs at launch
  document.querySelectorAll('textarea').forEach(input => {
    input.value = ''
  })
}

window.addEventListener('load', main)
