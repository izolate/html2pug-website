import React, { Component } from 'react'

class TextArea extends Component {
  handleChange (e) {
    if (!this.props.submit) return
    else return this.props.submit(e.target.value)
  }

  render () {
    return (
      <textarea
        disabled={this.props.disabled}
        onChange={this.handleChange.bind(this)}
        value={this.props.value} />
    )
  }
}

export default TextArea
