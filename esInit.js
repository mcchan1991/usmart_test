const createIndex=(client) =>{
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
};

const wsInit= (client) =>{
    const WebSocket = require('ws');
    const ws = new WebSocket('wss://ws.blockchain.info/inv');
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

    ws.onclose = () => {
        console.log("connection closed");
        ws.terminate()
        wsInit(client);
    };
}

exports.start = (client) => {
    const esInterval =setInterval(function() {
        client.ping({
            requestTimeout: 30000,
        }, function(error) {
            if (error) {
                console.error('elasticsearch cluster is down!');
            } else {
                console.log('Everything is ok');
                createIndex(client);
                wsInit(client);
                clearInterval(esInterval);
            }
        });
    },5000);
}