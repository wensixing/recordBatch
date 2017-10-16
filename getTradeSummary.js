const PubNub = require('pubnub');
const fs = require('fs');
const dateFormat = require('dateformat');
const os = require('os');
let pubnub = new PubNub({
    subscribeKey: 'sub-c-52a9ab50-291b-11e5-baaa-0619f8945a4f'
});
let turnover = 0;
let buyturnover = 0;
let sellturnover = 0;
let volume = 0;
let buyvolume = 0;
let sellvolume = 0;
pubnub.addListener({
    message: function (message) {
        let data = message.message;
        for (let i = 0; i < data.length; i ++) {
            let price = data[i]["price"];
            let size  = data[i]["size"];
            volume += size;
            turnover += price * size;
            if (data[i]["side"] == "BUY") {
                buyvolume += size;
                buyturnover = price * size;
            } else {
                sellvolume += size;
                sellturnover = price * size;
            }
        }
    }
});
pubnub.subscribe({
    channels: ['lightning_executions_BTC_JPY']
});

setTimeout(recordCurrentData, 500);

function recordCurrentData() {
    let fileName = "./trade_data/trade_summary.csv";
    if (!fs.existsSync(fileName)) {
        fs.closeSync(fs.openSync(fileName, 'w'));
    }
    let stats = fs.statSync(fileName)
    if (!stats["size"]) {
        fs.appendFileSync(fileName,
            "timestamp, localtime, turnover, buyturnover, sellturnover, volume, buyvolume, sellvolume" + os.EOL);
    }
    let timestamp = new Date().getTime();
    let localtime = dateFormat(timestamp, "yyyymmdd HH:MM:ss:l Z");
    fs.appendFileSync(fileName,
        timestamp +
        "," +
        localtime +
        "," +
        turnover + "," + buyturnover + "," + sellturnover +
        "," +
        volume  + "," + buyvolume + "," + sellvolume
        + os.EOL);
    setTimeout(recordCurrentData, 500);
}