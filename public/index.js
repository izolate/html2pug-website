import { debounce, isSafari } from './utils.js'

const KEY_TAB = 'Tab'
const KEY_ESC = 'Escape'
const HTTP_METHOD_POST = 'post'
const API_URL = '/.netlify/functions/html2pug'
const DEBOUNCE_MS = 750
const USE_TABS_SETTING = 'useTabs'
const USE_COMMAS_SETTING = 'useCommas'
const THEME_SETTING = 'theme'
const LOADING_TEXT = 'Loading...'
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
    theme: 'black',
    useTabs: false,
    useCommas: true,
    isFragment: true,
  },
}

// Send request to API
const sendApiRequest = async html => {
  const res = await fetch(API_URL, {
    method: HTTP_METHOD_POST,
    body: JSON.stringify({ html, settings: state.settings }),
  })

  const isSuccess = res.status >= 200 && res.status < 300
  if (!isSuccess) {
    // eslint-disable-next-line no-console
    console.error(res.statusText)
    throw new Error(res.statusText)
  }

  const text = await res.text()
  return text
}

const convertToPug = async (html = '') => {
  // Clear input if value is blank
  if (!html.length) {
    setOutputValue(html)
    return
  }

  setOutputValue(LOADING_TEXT)

  try {
    const pug = await sendApiRequest(html)
    setOutputValue(pug)
  } catch (err) {
    setOutputValue(ERROR_TEXT)
  }
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
const updateSettingsField = async (name, value) => {
  const { settings, el } = state

  if (Object.keys(settings).includes(name)) {
    settings[name] = value
    window.localStorage.setItem('settings', JSON.stringify(settings))

    switch (name) {
      case USE_TABS_SETTING:
      case USE_COMMAS_SETTING: {
        // Trigger re-complile
        const { input } = el
        if (input.value.length) {
          await convertToPug(input.value)
        }
        return
      }
      case THEME_SETTING:
        setTheme(value)
        return
      default:
        return
    }
  }
}

// Save all settings to state and ensure radio inputs match.
const updateSettings = (settings = {}) => {
  state.settings = { ...state.settings, ...settings }

  const { settingsForm } = state.el
  const boolToNumber = bool => (bool ? 1 : 0)

  window.localStorage.setItem('settings', JSON.stringify(state.settings))

  Object.entries(state.settings).forEach(([key, val]) => {
    switch (key) {
      case THEME_SETTING:
        settingsForm[key].value = val
        setTheme(val)
        return
      case USE_TABS_SETTING:
      case USE_COMMAS_SETTING:
        settingsForm[key].value = boolToNumber(val)
        return
      default:
        return
    }
  })
}

const setTheme = theme => {
  const { body } = document
  body.classList.forEach(cls => {
    if (cls.endsWith('-theme')) {
      body.classList.remove(cls)
    }
  })
  body.classList.add(`${theme}-theme`)
}

const toggleMenu = (open = true) => {
  const { main } = state.el

  if (open) {
    main.classList.toggle('show-menu')
    return
  }

  // Toggle it closed but don't toggle it open
  if (main.classList.contains('show-menu')) {
    main.classList.remove('show-menu')
  }
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

  return convertToPug(input.value)
}

const handleSettingsChange = e => {
  const { name, value } = e.target

  // Convert "1"/"0" to true/false for boolean settings
  const isBool = name === USE_TABS_SETTING || name === USE_COMMAS_SETTING
  const val = isBool ? Boolean(parseInt(value, 10)) : value

  return updateSettingsField(name, val)
}

const handleMenuBtnClick = () => toggleMenu()

const handleDocumentKeyUp = e => {
  const { key } = e
  if (key === KEY_ESC) {
    toggleMenu(false)
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

  // Close menu when clicking about link
  document
    .getElementById('about-link')
    .addEventListener('click', handleMenuBtnClick)

  document.addEventListener('keyup', handleDocumentKeyUp)

  // Safari placeholder doesn't support line breaks
  if (isSafari) {
    input.placeholder = '<h1 class="heading">Hello, world!</h1>'
  }
}

window.addEventListener('load', main)
