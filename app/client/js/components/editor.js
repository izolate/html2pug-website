import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import CodeMirror from 'codemirror'

class Editor extends Component {
  constructor () {
    super()
  }

  get options () {
    return {
      mode: 'xml',
      theme: 'github',
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
    console.log('updated')
  }

  handleChange (e) {
    console.log(this.editor.getValue())
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
