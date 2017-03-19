var express = require('express')
var app = express()
var EventParser = require('./parser')

app.get('/', (req, res) => {
  res.send({
    message: 'Hello World!'
  })
})

app.get('/api/event/:event_id', (req, res) => {
  let event_id = req.params.event_id

  EventParser.getEvent(event_id)
  .then(event => {
    res.send(event)
  })
  .catch(error => {
    res.send(error)
  })

})

app.get('/api/page/:page', (req, res) => {
  let page = parseInt(req.params.page)

  if (!page && page != 0) {
    res.send({
      error: 'Invalid page'
    })
    return
  }

  EventParser.getPage(page)
  .then(events => {
    res.send(events)
  }).catch(error => {
    res.send(error)
  })

})

app.listen(3000, () => {
  console.log('Running on port 3000')
})
