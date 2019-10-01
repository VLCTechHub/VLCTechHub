const http = require('http')
const https = require('https')
const marked = require('marked')

module.exports = (options = {}) => {
  const { apiRoot, collection, layout } = {
    apiRoot: 'uri-goes-here',
    collection: 'jobs',
    layout: 'job.njk',
    ...options
  }

  return function(files, metalsmith, done) {
    let url = `${apiRoot}/jobs/`

    console.log('Consuming', url)

    let protocol = apiRoot.startsWith('https://') ? https : http
    const req = protocol.get(url, res => {
      let body = ''
      res.on('data', chunk => {
        body += chunk
      })
      res.on('end', () => {
        let jobs = JSON.parse(body).jobs
        jobs.forEach(e => {
          let page = {
            file: 'job/board/' + e.id + '.md',
            layout: layout,
            collection: collection,
            title: e.title,
            contents: Buffer.from(e.description),
            howToApply: marked(e.how_to_apply || '', { sanitize: true, smartLists: true }),
            salary: e.salary,
            publishedAt: e.published_at.toString(),
            sourceUrl: e.link,
            tags: e.tags,
            slug: e.id,
            companyName: e.company.name,
            pageTitle: e.title,
            seo: {
              ogTitle: e.title,
              ogDescription: e.description,
              ogUrl: apiRoot + 'job/board/' + e.id + '/'
            }
          }
          files[page.file] = page
        })
        done()
      })
    })
    req.on('error', error => {
      console.error(error)
    })
    req.end()
  }
}
