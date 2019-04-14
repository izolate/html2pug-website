import { debounce } from './utils.js'

const KEY_TAB = 'Tab'
const HTTP_METHOD_POST = 'post'
const API_URL = '/.netlify/functions/html2pug'
const DEBOUNCE_MS = 500
const LOADING_TEXT = 'Loading...'
const IS_FRAGMENT_SETTING = 'isFragment'
const ERROR_TEXT = `Oh no! Something went wrong :(

It could be a server fault, or it could be invalid HTML.
Please check your input and try again.`

const state = {
  el: {
    main: null,
    input: null,
    output: null,
    menuBtn: null,
    settingsForm: null,
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

  if (res.status !== 200) {
    throw new Error(ERROR_TEXT)
  }

  const text = await res.text()
  return text
}

const setOutputValue = value => {
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

// Save a single settings change to state.
const updateSettingsField = (name, value) => {
  const { settings } = state
  if (Object.keys(settings).includes(name)) {
    settings[name] = value
    window.localStorage.setItem('settings', JSON.stringify(settings))
  }
}

// Save all settings to state and ensure radio inputs match.
const updateSettings = (settings = {}) => {
  state.settings = { ...state.settings, ...settings }

  const { settingsForm } = state.el
  const boolToNumber = bool => (bool ? 1 : 0)

  Object.entries(state.settings).forEach(([key, val]) => {
    switch (key) {
      case IS_FRAGMENT_SETTING:
        return
      default: {
        settingsForm[key].value = boolToNumber(val)
        return
      }
    }
  })
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

  // Do nothing if input is empty
  if (!input.value) {
    return setOutputValue(input.value)
  }

  setOutputValue(LOADING_TEXT)

  return convertToPug(input.value)
    .then(pug => setOutputValue(pug))
    .catch(err => {
      setOutputValue(ERROR_TEXT)
      // eslint-disable-next-line no-console
      console.error(err)
    })
}

const handleSettingsChange = e => {
  const { name, value } = e.target
  // Convert "1"/"0" to true/false
  return updateSettingsField(name, Boolean(parseInt(value, 10)))
}

const handleMenuBtnClick = () => {
  const { main } = state.el

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
  state.el.settingsForm = document.getElementById('settings')

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

  // Get saved preferences from localStorage
  const prefs = JSON.parse(window.localStorage.getItem('settings')) || {}
  updateSettings({ ...state.settings, ...prefs })

  // Listen for changes in settings
  document
    .getElementById('settings')
    .addEventListener('input', handleSettingsChange)
}

window.addEventListener('load', main)
