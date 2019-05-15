//Load express module with `require` directive
const express = require('express');
const app = express();
const path = require('path');
const test = require('./esInit.js');
const hbs=require('express-handlebars');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  hosts: [ 'http://elastic:changeme@elasticsearch:9200']
});

// view engine setup
app.engine('hbs', hbs({extname:'hbs', defaultLayout: 'layout', layoutsDir: __dirname+'/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));


test.esInit(client);

//index
app.get('/', function (req, res) {
  res.render('index');
})


app.get('/delete_all', function (req, res) {
  client.indices.delete({
    index: '_all'
  }, function(err, res) {

    if (err) {
      console.error(err.message);
    } else {
      console.log('Indexes have been deleted!');
    }
  });
})

//api transaction get 8 recent transaction
app.get('/api/tx', function (req, res) {
  client.search({
    index: 'tx',
    type: 'utx',
    body: {
      size: '8',
      sort: [{ "time": { "order": "desc" } }]
    }
  }).then(function(resp) {
    let {hits, total} = resp.hits;
    res.json({hits, total});
  }, function(err) {
    console.trace(err.message);
  });
});
//search transaction by hashID
app.get('/api/search/:hashId', function (req, res) {
  client.search({
    index: 'tx',
    type: 'utx',
    body: {
      query: {
        match: {
          hash: req.params.hashId
        }
      }
    }
  }).then(function(resp) {
    let {hits} = resp.hits;
    res.json({hits});
  }, function(err) {
    console.trace(err.message);
  });
});
//api block get 5 recent block
app.get('/api/block', function (req, res) {
  client.search({
    index: 'block',
    type: 'block',
    body: {
      size: '5',
      sort: [{ "time": { "order": "desc" } }]
    }
  }).then(function(resp) {
    let {hits} =resp.hits;
    res.json({hits});
  }, function(err) {
    console.trace(err.message);
  });
})

//Launch listening server on port 8081
app.listen(8081, function () {
  console.log('app listening on port 8081!')
})