import React, { Component } from 'react'
import uuid from 'uuid'
import TextArea from './textarea'

class App extends Component {
  constructor () {
    super()
    this.state = { id: uuid.v1(), pug: null }
  }

  componentWillMount () {
    if (!window.io) return
    this.socket = window.io.connect()
    this.socket.on('connect', () => console.info('Connected to socket'))
    this.socket.emit('join', this.state.id)
    this.socket.on('compilation:response', pug => this.setState({ pug }))
  }

  requestCompilation (html) {
    this.socket.emit('compilation:request', {
      html,
      room: this.state.id,
    })
  }

  render () {
    return (
      <main>
        <header>
          <h1>HTML2Pug</h1>
        </header>
        <section>
          <TextArea
            disabled={false}
            submit={this.requestCompilation.bind(this)} />
          <TextArea
            value={this.state.pug}
            disabled={true}
            submit={null} />
        </section>
        <footer>
          Scratch
        </footer>
      </main>
    )
  }
}

export default App
