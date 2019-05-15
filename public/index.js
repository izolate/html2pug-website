import { debounce, isSafari } from './utils.js'

const KEY_TAB = 'Tab'
const KEY_ESC = 'Escape'
const HTTP_METHOD_POST = 'post'
const API_URL = '/.netlify/functions/html2pug'
const DEBOUNCE_MS = 750
const TABS_SETTING = 'tabs'
const COMMAS_SETTING = 'commas'
const DOUBLE_QUOTES_SETTING = 'doubleQuotes'
const FRAGMENT_SETTING = 'fragment'
const THEME_SETTING = 'theme'
const MIME_TYPE_HTML = 'text/html'
const LOADING_TEXT = 'Loading...'
const ERROR_TEXT = `Oh no! Something went wrong :(

It could be a server fault, or it could be invalid HTML.
Please check your input and try again.`
const INCORRECT_FILE_TYPE_TEXT = 'Please select a valid HTML document to upload'

const state = {
  el: {
    main: null,
    input: null,
    output: null,
    menuBtn: null,
    settingsForm: null,
    uploadForm: null,
  },

  settings: {
    [THEME_SETTING]: 'black',
    [TABS_SETTING]: false,
    [COMMAS_SETTING]: true,
    [DOUBLE_QUOTES_SETTING]: false,
    [FRAGMENT_SETTING]: true,
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
      case TABS_SETTING:
      case COMMAS_SETTING:
      case DOUBLE_QUOTES_SETTING:
      case FRAGMENT_SETTING: {
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
      case TABS_SETTING:
      case COMMAS_SETTING:
      case FRAGMENT_SETTING:
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
  const { body } = document

  if (open) {
    body.classList.toggle('show-menu')
    return
  }

  // Toggle it closed but don't toggle it open
  if (body.classList.contains('show-menu')) {
    body.classList.remove('show-menu')
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

  let val = value

  switch (name) {
    case TABS_SETTING:
    case COMMAS_SETTING:
    case DOUBLE_QUOTES_SETTING:
    case FRAGMENT_SETTING:
      // Convert "1"/"0" to true/false for boolean settings
      val = Boolean(parseInt(value, 10))
    default:
      break
  }

  return updateSettingsField(name, val)
}

const handleMenuBtnClick = () => toggleMenu()

const handleUploadBtnClick = () => {
  const { uploadForm } = state.el
  const [input] = uploadForm.childNodes
  if (input) {
    input.click()
  }
}

const handleUploadFormChange = e => {
  const { target: input, currentTarget: form } = e
  const [file] = input.files

  if (file.type !== MIME_TYPE_HTML) {
    window.alert(INCORRECT_FILE_TYPE_TEXT)
    form.reset()
    return
  }

  const reader = new window.FileReader()
  reader.onload = async e => {
    const { result } = e.target
    state.el.input.value = result
    await convertToPug(result)
  }
  reader.readAsText(file)

  form.reset()
}

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
  state.el.uploadForm = document.getElementById('upload')

  const { input, menuBtn, uploadForm } = state.el

  input.addEventListener('keydown', handleInputKeyDown)
  input.addEventListener(
    'input',
    debounce(e => handleInputChange(e), DEBOUNCE_MS)
  )

  menuBtn.addEventListener('click', handleMenuBtnClick)

  // Upload document
  document
    .getElementById('upload-btn')
    .addEventListener('click', handleUploadBtnClick)

  uploadForm.addEventListener('change', handleUploadFormChange)

  // Clear inputs at launch
  document.querySelectorAll('textarea').forEach(input => {
    input.value = ''
  })

  // Get saved preferences from localStorage
  try {
    const prefs = JSON.parse(window.localStorage.getItem('settings'))
    if (typeof prefs !== 'object') {
      throw new Error('Expected object')
    }
    updateSettings({ ...state.settings, ...prefs })
  } catch (err) {
    window.localStorage.setItem('settings', JSON.stringify(state.settings))
  }

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
