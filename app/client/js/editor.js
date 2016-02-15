import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import CodeMirror from 'codemirror'

import 'codemirror/mode/htmlmixed/htmlmixed'
import 'codemirror/mode/jade/jade'

class Editor extends Component {
  constructor () {
    super()
  }

  get options () {
    return {
      mode: this.props.mode,
      readOnly: !!this.props.readOnly,
      extraKeys: {
        Tab (cm) {
          // 2 space soft tabs
          if (cm.somethingSelected()) cm.indentSelection('add')
          else cm.replaceSelection(cm.getOption('indentWithTabs') ? '\t'
            : Array(cm.getOption('indentUnit') + 1).join(' '), 'end', '+input')
        }
      }
    }
  }

  componentDidMount () {
    const DOMNode = ReactDOM.findDOMNode(this)
    this.editor = CodeMirror.fromTextArea(DOMNode.firstChild, this.options)
    this.editor.on('change', this.handleChange.bind(this))
    this.editor.setValue(this.props.initialValue || '')
  }

  componentDidUpdate () {
    if ('value' in this.props) this.editor.setValue(this.props.value)
  }

  handleChange (e) {
    if (!this.props.sendRequest) return
    else this.props.sendRequest(this.editor.getValue())
  }

  render () {
    return (
      <div className='editor-container'>
        <textarea
          onChange={this.handleChange.bind(this)} />
      </div>
    )
  }
}

export default Editor
