const html2pug = require('html2pug')

exports.handler = (event, context, callback) => {
  const { html, settings = {} } = JSON.parse(event.body)

  try {
    const pug = html2pug(html, settings)

    return callback(null, {
      statusCode: 200,
      body: pug,
    })
  } catch (err) {
    return callback(err)
  }
}
