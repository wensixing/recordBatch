const request = require('request');
const fs = require('fs');
const dateFormat = require('dateformat');
const os = require('os');
const sleep = require('sleep');


for(var i = 0; i < 1000; i ++) {
    recordTradeData();
    sleep.msleep(200);
}

function recordTradeData() {
    var path = '/v1/getboard';
    var query = '';
    var url = 'https://api.bitflyer.jp' + path + query;
    var fileName = "./trade_data/trade_history.csv";
    var options = {
        url: url,
    }
    if (!fs.existsSync(fileName)) {
        fs.closeSync(fs.openSync(fileName, 'w'));
    }
    var req = new Date();
    var stats = fs.statSync(fileName)
    if (!stats["size"]) {
        fs.appendFileSync(fileName,
            "requesttime,"  +
            "responsetime," +
            "averagetime," +
            "askprice1,askvolume1,bidprice1,bidvolume1,askprice2,askvolume2,bidprice2,bidvolume2,askprice3,askvolume3,bidprice3,bidvolume3,askprice4,askvolume4,bidprice4,bidvolume4,askprice5,askvolume5,bidprice5,bidvolume5,askprice6,askvolume6,bidprice6,bidvolume6,askprice7,askvolume7,bidprice7,bidvolume7,askprice8,askvolume8,bidprice8,bidvolume8,askprice9,askvolume9,bidprice9,bidvolume9,askprice10,askvolume10,bidprice10,bidvolume10" + os.EOL);
    }
    request(options, function (err, response, payload) {
        var resp = new Date();
        var reqstamp = req.getTime();
        var respstamp = resp.getTime();
        var averageStamp = reqstamp + (respstamp - reqstamp) / 2;
        var avg = dateFormat(averageStamp, "yyyymmdd HH:MM:ss:l Z");

        var data = JSON.parse(payload);
        var bids = data["bids"].slice(0, 10);
        var asks = data["asks"].slice(0, 10);
        var askbids = "";
        for (var i = 0; i < 10; i++) {
            askbids += asks[i]["price"] + ",";
            askbids += asks[i]["size"] + ",";
            askbids += bids[i]["price"] + ",";
            askbids += bids[i]["size"] + ",";
        }
        askbids = askbids.slice(0, -1);
        fs.appendFileSync(fileName,
            reqstamp +
            "," +
            respstamp +
            "," +
            avg +
            "," +
            askbids + os.EOL);
    });
}