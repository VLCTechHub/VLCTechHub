const Metalsmith = require('metalsmith');
const markdown = require('metalsmith-markdown');
const layouts = require('metalsmith-layouts');
const permalinks = require('metalsmith-permalinks');
const inplace = require('metalsmith-in-place');
const collections = require('metalsmith-collections');
const uglify = require('metalsmith-uglify');
const sass = require('metalsmith-sass');
const http = require('http');
const https = require('https');
const nunjucksDate = require('nunjucks-moment-timezone-filter');
const moment = require('moment');
const marked = require('marked');


const baseUrl = 'http:/vlctechhub.org/';

moment.locale('es');

function fromNow(date) {
  return moment(date).fromNow();
}

const inplaceConfig = {
  engineOptions: {
    filters: { date: nunjucksDate.dateFilter, newDate: nunjucksDate.newDate, fromNow: fromNow }
  }
};

const layoutConfig = {
  engineOptions: {
    filters: { date: nunjucksDate.dateFilter, newDate: nunjucksDate.newDate, fromNow: fromNow }
  },
  directory: 'templates/'
};

const createTwitterInfo = function(txt) {
  let twitter = {};
  if(txt && txt[0] === '@') {
    twitter.handle = txt.substring(1);
  }
  else if(txt && txt[0] === '#') {
    twitter.hashtag = txt.substring(1);
  }
  else {
    twitter.hashtag = txt;
  }
  return twitter;
}

let apiRoot = process.env.API_ROOT || 'http://localhost:5000/';

Metalsmith(__dirname)
  .metadata({
    seo: {
      ogTitle: "VLCTechHub",
      ogDescription: "VLCTechHub es el hub de eventos y empleo tecnológico en Valencia: eventos de programación, coding dojos, talleres, workshops o quedadas informales para fomentar una comunidad o compartir información de base tecnológica en Valencia o Castellón.",
      ogUrl: baseUrl
    },
    apiRoot: apiRoot
  })
  .source('./data')
  .destination('./dist')
  .clean(true)
  .use((files, metalsmith, done) => {
    let url = `${apiRoot}v1/events/?category=next`
    console.log('Consuming', url);
    let protocol = apiRoot.startsWith('https://')? https : http;
    const req = protocol.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let events = JSON.parse(body).events;
        events.forEach(e => {
          let page = {
            file: 'events/' + e.slug + '.md',
            title: e.title,
            contents: Buffer.from(e.description),
            startDate: e.date.toString(),
            layout: 'event.njk',
            twitter: createTwitterInfo(e.hashtag),
            slug: e.slug,
            sourceUrl: e.link,
            pageTitle: e.title,
            seo: {
              ogTitle: e.title,
              ogDescription: e.description,
              ogUrl: apiRoot + 'events/' + e.slug +'/'
            },
            collection: 'upcomingEvents'
          }
          files[page.file] = page;
        });
        done();
      });
    })
    req.on('error', (error) => {
      console.error(error)
    })
    req.end();
  })
  .use((files, metalsmith, done) => {
    let url = `${apiRoot}v1/jobs/`
    console.log('Consuming', url);
    let protocol = apiRoot.startsWith('https://')? https : http;
    const req = protocol.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let jobs = JSON.parse(body).jobs;
        jobs.forEach(e => {
          let page = {
            file: 'job/board/' + e.id + '.md',
            title: e.title,
            contents: Buffer.from(e.description),
            howToApply: marked(e.how_to_apply || '', { sanitize: true, smartLists: true }),
            salary: e.salary,
            publishedAt: e.published_at.toString(),
            sourceUrl: e.link,
            tags: e.tags,
            slug: e.id,
            companyName: e.company.name,
            layout: 'job.njk',
            pageTitle: e.title,
            seo: {
              ogTitle: e.title,
              ogDescription: e.description,
              ogUrl: apiRoot + 'job/board/' + e.id +'/'
            },
            collection: 'jobs'
          }
          files[page.file] = page;
        });
        done();
      });
    })
    req.on('error', (error) => {
      console.error(error)
    })
    req.end();
  })
  .use(collections(
    {
      jobs: {
        sortBy: 'publishedAt',
        reverse: true
      },
      upcomingEvents: {
        sortBy: 'startDate'
      }
    }
  ))
  .use(markdown({
    sanitize: true
  }))
  .use(inplace(inplaceConfig))
  .use(layouts(layoutConfig))
  .use(permalinks({}))
  .use(sass({
    outputDir: 'assets/css/'
  }))
  .use(uglify({
    es: true,
    concat: {
      file: 'vlctechhub-min.js',
      root: 'assets/js'
    },
    removeOriginal: true
  }))
  .build(function(err, files) {
    if (err) { throw err; }
  });

