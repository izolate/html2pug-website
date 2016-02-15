import React, { Component } from 'react'
import uuid from 'uuid'
import Editor from './editor'

class App extends Component {
  constructor () {
    super()
    this.state = { id: uuid.v1(), pug: '' }
  }

  componentWillMount () {
    if (!window.io) return

    this.socket = window.io.connect()
    this.socket.on('connect', () => console.info('Connected to socket'))
    this.socket.emit('join', this.state.id)
    this.socket.on('compilation:response', pug => this.setState({ pug }))
  }

  requestCompilation (html, room=this.state.id) {
    // Only ping server if editor has content
    if (!html.length) this.setState({ pug: '' })
    else this.socket.emit('compilation:request', { html, room })
  }

  render () {
    return (
      <main>
        <header>
          <h1>HTML2Pug</h1>
        </header>
        <section>
          <Editor
            readOnly={false}
            initialValue='<h1>Hello World!</h1>' />
          <Editor
            readOnly={true} />
        </section>
        <footer>
          Scratch
        </footer>
      </main>
    )
  }
}

export default App
