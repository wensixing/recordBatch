const PubNub = require('pubnub');
const fs = require('fs');
const dateFormat = require('dateformat');
const os = require('os');
const request = require('request');
const comLog = require("./commonLog")

let recordInterval = 500; // 每隔500ms 记录数据

let path = '/v1/getboard';
let query = '';
let url = 'https://api.bitflyer.jp' + path + query;
let options = {
    url: url,
}
let askBook = new Map();
let bidBook = new Map();
let log = new comLog("trade_data");

// 初始化，记录所有orderBook
request(options, function (err, response, payload) {
    if (err) {
        log.error(JSON.stringify(err));
        throw err;
    }
    let data = JSON.parse(payload);
    let bids = data["bids"];
    let asks = data["asks"];
    for (let i = 0; i < bids.length; i ++) {
        bidBook.set(-[bids[i]["price"]], bids[i]["size"]);
    }
    for (let i = 0; i < asks.length; i ++) {
        askBook.set(asks[i]["price"], asks[i]["size"]);
    }
    startRecord();
    setTimeout(recordCurrentData, recordInterval);
});




/* ---------- functions ----------- */
// 设置pubnub, 接受新的order，更新本地orderBook
function startRecord() {
    let pubnub = new PubNub({
        subscribeKey: 'sub-c-52a9ab50-291b-11e5-baaa-0619f8945a4f'
    });
    pubnub.addListener({
        message: function (message) {
            if (!('message' in message)) {
                log.error(JSON.stringify(message));
                throw message;
            }
            let data = message.message;
            let bids = data["bids"];
            let asks = data["asks"];
            for (let i = 0; i < bids.length; i ++) {
                if (bids[i]["size"] == 0) {
                    bidBook.delete(- bids[i]['price']);
                    continue;
                }
                bidBook.set(-[bids[i]["price"]], bids[i]["size"]);
            }
            for (let i = 0; i < asks.length; i ++) {
                if (asks[i]["size"] == 0) {
                    askBook.delete(asks[i]['price']);
                    continue;
                }
                askBook.set([asks[i]["price"]], asks[i]["size"]);
            }
        }
    });
    pubnub.subscribe({
        channels: ['lightning_board_BTC_JPY']
    });
}

// 记录当前level 10 orderBook
function recordCurrentData() {
    let timestamp = new Date().getTime();
    let subfix = dateFormat(timestamp, "yyyy-mm-dd");
    let fileName = "./trade_data/trade_data_" + subfix + ".csv";
    if (!fs.existsSync(fileName)) {
        fs.closeSync(fs.openSync(fileName, 'w'));
    }
    let stats = fs.statSync(fileName)
    if (!stats["size"]) {
        fs.appendFileSync(fileName,
            "timestamp,"  +
            "localtime," +
            "askprice1,askvolume1,bidprice1,bidvolume1,askprice2,askvolume2,bidprice2,bidvolume2,askprice3,askvolume3,bidprice3,bidvolume3,askprice4,askvolume4,bidprice4,bidvolume4,askprice5,askvolume5,bidprice5,bidvolume5,askprice6,askvolume6,bidprice6,bidvolume6,askprice7,askvolume7,bidprice7,bidvolume7,askprice8,askvolume8,bidprice8,bidvolume8,askprice9,askvolume9,bidprice9,bidvolume9,askprice10,askvolume10,bidprice10,bidvolume10" + os.EOL);
    }
    let localtime = dateFormat(timestamp, "yyyymmdd HH:MM:ss:l Z");

    let asks = askBook.keys();
    let bids = bidBook.keys();
    let askbids = "";
    for (let i = 0; i < 10; i ++) {
        if (i < askBook.size) {
            let key = asks.next().value;
            askbids += key + ",";
            askbids += askBook.get(key) + ",";
        } else {
            askbids += "NaN,"
            askbids += "NaN,"

        }
        if (i < bidBook.size) {
            let key = bids.next().value;
            askbids += -key + ",";
            askbids += bidBook.get(key) + ",";
        } else {
            askbids += "NaN,"
            askbids += "NaN,"
        }
    }
    askbids = askbids.slice(0, -1);
    fs.appendFileSync(fileName,
        timestamp +
        "," +
        localtime +
        "," +
        askbids + os.EOL);
    setTimeout(recordCurrentData, recordInterval);
}


