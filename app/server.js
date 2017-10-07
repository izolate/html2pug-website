'use strict'

const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const html2pug = require('html2jade')

// Configuration
app.set('port', process.env.NODE_PORT || 5000)
app.set('views', `${__dirname}/client/views`)
app.set('view engine', 'pug')
app.use('/static', express.static(`${__dirname}/client`))

// Socket.io
io.sockets.on('connection', socket => {
  socket.on('join', room => socket.join(room))

  socket.on('compilation:request', req => {
    const { room, html } = req
    const bodyless = html.indexOf('<body') > -1 ? false : true

    html2pug.convertHtml(html, { bodyless }, (err, pug) => {
      if (err) throw new Error(err)
      else io.sockets.in(room).emit('compilation:response', pug)
    })
  })
})

// Routes
app.get('/', (req, res) => res.render('home'))
app.get('*', (req, res) => res.redirect('/'))

// Run
server.listen(app.get('port'), err => {
  if (err) console.error(err)
  else console.log(`Server started: http://localhost:${app.get('port')}/`)
})
