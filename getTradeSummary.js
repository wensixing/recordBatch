const PubNub = require('pubnub');
const fs = require('fs');
const dateFormat = require('dateformat');
const os = require('os');
var pubnub = new PubNub({
    subscribeKey: 'sub-c-52a9ab50-291b-11e5-baaa-0619f8945a4f'
});
var turnover = 0;
var volume = 0;
pubnub.addListener({
    message: function (message) {
        var data = message.message;
        for (var i = 0; i < data.length; i ++) {
            var price = data[i]["price"];
            var size  = data[i]["size"];
            volume += size;
            turnover += price * size;
        }
    }
});
pubnub.subscribe({
    channels: ['lightning_executions_BTC_JPY']
});

setTimeout(recordCurrentData, 500);

function recordCurrentData() {
    var fileName = "./trade_data/trade_summary.csv";
    if (!fs.existsSync(fileName)) {
        fs.closeSync(fs.openSync(fileName, 'w'));
    }
    var stats = fs.statSync(fileName)
    if (!stats["size"]) {
        fs.appendFileSync(fileName,
            "timestamp, localtime, turnover, volume" + os.EOL);
    }
    var timestamp = new Date().getTime();
    var localtime = dateFormat(timestamp, "yyyymmdd HH:MM:ss:l Z");
    fs.appendFileSync(fileName,
        timestamp +
        "," +
        localtime +
        "," +
        turnover +
        "," +
        volume + os.EOL);
    console.log(volume);
    setTimeout(recordCurrentData, 500);
}