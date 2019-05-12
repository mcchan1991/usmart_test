//Load express module with `require` directive
const express = require('express');
const app = express();
const path = require('path');
const hbs=require('express-handlebars');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  hosts: [ 'http://elastic:changeme@elasticsearch:9200']
});
const WebSocket = require('ws');
const ws = new WebSocket('wss://ws.blockchain.info/inv');
// view engine setup
app.engine('hbs', hbs({extname:'hbs', defaultLayout: 'layout', layoutsDir: __dirname+'/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));

//index
app.get('/', function (req, res) {
  res.render('index');
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

client.ping({
  requestTimeout: 30000,
}, function(error) {
  if (error) {
    console.error('elasticsearch cluster is down!');
  } else {
    console.log('Everything is ok');
  }
});
//create tx index
client.indices.create({
  index: 'tx'
}, function(err, resp, status) {
  if (err) {
    console.log(err);
  } else {
    console.log("create", resp);
  }
});
//create block index
client.indices.create({
  index: 'block'
}, function(err, resp, status) {
  if (err) {
    console.log(err);
  } else {
    console.log("create", resp);
  }
});

//Subscribing to Unconfirmed transactions
//Subscribing to new Blocks
ws.on('open', function open() {
  ws.send('{"op":"unconfirmed_sub"}');
  ws.send('{"op":"blocks_sub"}');
});

//insert message, and index transaction and block in elasticsearch
ws.on('message', function incoming(data) {
  let jsonData =JSON.parse(data);
  if(jsonData.op==='utx'){
    client.index({
      index: 'tx',
      id: jsonData.hash,
      type: 'utx',
      body: jsonData.x
    }, function(err, resp, status) {
      console.log(resp);
    });
  }else if(jsonData.op==='block'){
    client.index({
      index: 'block',
      id: jsonData.x.hash,
      type: 'block',
      body: jsonData.x
    }, function(err, resp, status) {
      console.log(resp);
    });
  }
});

//Launch listening server on port 8081
app.listen(8081, function () {
  console.log('app listening on port 8081!')
})