let cheerio = require('cheerio')
let request = require('request')

function EventsParser () {
  let EP = {}

  function parseDate(date_text, start_end_text) {
    let months = {
      'januar': 'january',
      'februar': 'february',
      'marts': 'march',
      'april': 'april',
      'maj': 'may',
      'juni': 'june',
      'juli': 'july',
      'august': 'august',
      'september': 'september',
      'oktober': 'october',
      'november': 'november',
      'december': 'december'
    }

    let now = new Date()

    let [weekday, day, month, year] = date_text.split(' ')

    if (!year) {
      year = now.getFullYear()
    }

    let date = new Date([day, months[month], year].join(' '))
    let [start_time, end_time] = start_end_text.split(' til ').map(stamp => {
      return date.setHours(...stamp.split(':'))
    })

    return {
      start_time,
      end_time
    }
  }

  EP.getPage = function (page) {
    // Base URL for events (Hovedbiblioteket/Dokk1)
    let url = 'https://www.aakb.dk/bibliotek/12/arrangementer?page=' + page

    return EP.parseEvents(url)
  }

  EP.getCategoryPage = function (category_id, page) {
    let url = 'https://www.aakb.dk/bibliotek/12/arrangementer/' + category_id + '?page=' + page

    return EP.parseEvents(url)
  }

  EP.getEvent = function (event_id) {
    let url = 'https://www.aakb.dk/arrangementer/' + new Buffer(event_id, 'base64').toString('ascii')

    return new Promise(function (resolve, reject) {
      request(url, (error, response, body) => {
        if (! error) {
          let $ = cheerio.load(body)
          let now = new Date()

          let dates = $('body').find('.event-info p').eq(0).children().length
          let eventMeta = $('body').find('.event-info p')

          if (dates == 1) {
            let date_text = eventMeta.eq(0).text().trim()
            let start_end_text = eventMeta.eq(1).text().trim()
            console.log(date_text)
            var {start_time, end_time} = parseDate(date_text, start_end_text)
          }

          let price = eventMeta.eq(4).text().trim()

          let event = {
            event_id,
            url,
            price,
            start_time,
            end_time,
            title: $('body').find('.page-title').text().trim(),
            subtitle: $('body').find('.event-lead').text().trim(),
            text: $('body').find('.event-content .field-type-text-long').text().trim(),
            image: $('body').find('.event-image img').attr('src')
          }

          resolve(event)
        } else {
          reject(error)
        }
      })
    })
  }

  // Parse events on a event page
  EP.parseEvents = function (url) {
    return new Promise(function (resolve, reject) {
      request(url, (error, response, body) => {
        if (! error) {
          let events = []

          // Load source into cheerio
          let $ = cheerio.load(body)

          // Loop through each date header
          $('.event-list-leaf').each(function (i, el) {
            let months = {
              'januar': 'january',
              'februar': 'february',
              'marts': 'march',
              'april': 'april',
              'maj': 'may',
              'juni': 'june',
              'juli': 'july',
              'august': 'august',
              'september': 'september',
              'oktober': 'october',
              'november': 'november',
              'december': 'december'
            }
            // Fetch date
            let rawDate = $(this).find('.event-list-fulldate').text().trim().split(' ')
            let date = new Date([rawDate[1], months[rawDate[2]], rawDate[3]].join(' '))

            // Go through events on date above
            $(this).next('.event-list').children().each(function (i, el) {
              // Get start and end time
              let start_end = $(this).find('.event-list-time').text().trim().split(' til ')
              let start_time = date.setHours(...start_end[0].split(':')) / 1000
              let end_time = date.setHours(...start_end[1].split(':')) / 1000

              // URL
              let url = 'https://www.aakb.dk' + $(this).find('h3.heading a').attr('href')

              // Push event details to events arrays
              events.push({
                event_id: new Buffer(url.split('arrangementer/')[1]).toString('base64'),
                title: $(this).find('h3.heading a').text().trim(),
                text: $(this).find('div').eq(1).text().trim(),
                start_time,
                end_time,
                price: $(this).find('.event-list-price').text().trim(),
                image: $(this).find('.event-image-wrapper img').attr('src'),
                url
              })
            })
          })

          // Resolve promise and return events
          resolve(events)
        } else {
          reject(error)
        }
      })
    })
  }

  return EP
}

module.exports = new EventsParser()
