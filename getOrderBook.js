const PubNub = require('pubnub');
const fs = require('fs');
const dateFormat = require('dateformat');
const os = require('os');
const request = require('request');
var sortedMap = require("collections/sorted-map");

var path = '/v1/getboard';
var query = '';
var url = 'https://api.bitflyer.jp' + path + query;
var options = {
    url: url,
}
var askBook = {};
var bidBook = {};

request(options, function (err, response, payload) {
    var data = JSON.parse(payload);
    var bids = data["bids"];
    var asks = data["asks"];
    for (var i = 0; i < bids.length; i ++) {
        bidBook[bids[i]['price']] = bids[i];
    }
    for (var i = 0; i < asks.length; i ++) {
        askBook[asks[i]['price']] = asks[i];
    }
    startRecord();
    setTimeout(recordCurrentData, 500);
});

function startRecord() {
    var pubnub = new PubNub({
        subscribeKey: 'sub-c-52a9ab50-291b-11e5-baaa-0619f8945a4f'
    });
    pubnub.addListener({
        message: function (message) {
            var data = message.message;
            var bids = data["bids"];
            var asks = data["asks"];
            for (var i = 0; i < bids.length; i ++) {
                if (bids[i]["size"] == 0) {
                    delete bidBook[bids[i]['price']];
                    continue;
                }
                bidBook[bids[i]['price']] = bids[i]["size"];
            }
            for (var i = 0; i < asks.length; i ++) {
                if (asks[i]["size"] == 0) {
                    delete askBook[asks[i]['price']];
                    continue;
                }
                askBook[asks[i]['price']] = asks[i]["size"];
            }
        }
    });
    pubnub.subscribe({
        channels: ['lightning_board_BTC_JPY']
    });
}

function recordCurrentData() {
    var fileName = "./trade_data/trade_data.csv";
    if (!fs.existsSync(fileName)) {
        fs.closeSync(fs.openSync(fileName, 'w'));
    }
    var req = new Date();
    var stats = fs.statSync(fileName)
    if (!stats["size"]) {
        fs.appendFileSync(fileName,
            "timestamp,"  +
            "localtime," +
            "askprice1,askvolume1,bidprice1,bidvolume1,askprice2,askvolume2,bidprice2,bidvolume2,askprice3,askvolume3,bidprice3,bidvolume3,askprice4,askvolume4,bidprice4,bidvolume4,askprice5,askvolume5,bidprice5,bidvolume5,askprice6,askvolume6,bidprice6,bidvolume6,askprice7,askvolume7,bidprice7,bidvolume7,askprice8,askvolume8,bidprice8,bidvolume8,askprice9,askvolume9,bidprice9,bidvolume9,askprice10,askvolume10,bidprice10,bidvolume10" + os.EOL);
    }
    var timestamp = new Date().getTime();
    var localtime = dateFormat(timestamp, "yyyymmdd HH:MM:ss:l Z");



    for (var i = 0; i < 10; i++) {
        askbids += asks[i]["price"] + ",";
        askbids += asks[i]["size"] + ",";
        askbids += bids[i]["price"] + ",";
        askbids += bids[i]["size"] + ",";
    }




    fs.appendFileSync(fileName,
        timestamp +
        "," +
        localtime +
        "," +
        + os.EOL);
    setTimeout(recordCurrentData, 500);
}


