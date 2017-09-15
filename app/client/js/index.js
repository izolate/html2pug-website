'use strict'

import React, { Component } from 'react'
import { render } from 'react-dom'
import uuid from 'uuid'
import Editor from './editor'
import cleanHTML from 'htmlclean'

class App extends Component {
  constructor () {
    super()
    this.state = { id: uuid.v1(), pug: '' }
  }

  get dummyHTML () {
    return `<!doctype html>
<html lang='en'>
  <head>
    <meta charset='utf-8'>
    <title>foo</title>
  </head>
  <body class='html2pug'>
    <h1>bar</h1>
  </body>
</html>`
  }

  componentWillMount () {
    if (!window.io) return

    this.socket = window.io.connect()
    this.socket.on('connect', () => console.info('Connected to socket'))
    this.socket.on('compilation:response', pug => this.setState({ pug }))
    this.socket.emit('join', this.state.id)
  }

  requestCompilation (html, room=this.state.id) {
    // Only ping server if editor has content
    if (!html.length) this.setState({ pug: '' })
    else this.socket.emit('compilation:request', {
      html: cleanHTML(html), room
    })
  }

  render () {
    return (
      <main>
        <header>
          <img
            className='logo'
            src='/static/img/html2pug-logo.svg'
            alt='HTML2Pug logo' />
          <a className='repo' href='https://github.com/izolate/html2pug'>
            <img src='/static/img/github-logo.svg' alt='GitHub logo' />
          </a>
        </header>
        <section>
          <Editor
            mode='xml'
            readOnly={false}
            sendRequest={this.requestCompilation.bind(this)}
            initialValue={this.dummyHTML} />
          <Editor
            mode='pug'
            value={this.state.pug}
            readOnly={true} />
        </section>
      </main>
    )
  }
}

render(React.createElement(App), document.getElementById('app'))
