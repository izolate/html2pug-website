const html2pug = require('html2pug')

exports.handler = (event, context, callback) => {
  const { html, settings = {} } = JSON.parse(event.body)

  const pug = html2pug(html, settings)

  callback(null, {
    statusCode: 200,
    body: pug,
  })
}
