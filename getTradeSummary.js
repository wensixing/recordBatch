const PubNub = require('pubnub');
const fs = require('fs');
const dateFormat = require('dateformat');
const os = require('os');
const redis = require("redis");
const comLog = require("./commonLog")
let log = new comLog("trade_data");

let client = redis.createClient();
client.on("error", function (err) {
    log.error("Error " + err);
});
let pubnub = new PubNub({
    subscribeKey: 'sub-c-52a9ab50-291b-11e5-baaa-0619f8945a4f'
});
let updateTurnOverInterval = 1000 * 60 * 10; // 每隔10分钟，删除过期数据
let recordInterval = 500; // 每隔500ms 记录turnover

let turnover = 0;
let buyturnover = 0;
let sellturnover = 0;
let volume = 0;
let buyvolume = 0;
let sellvolume = 0;

// 设置pubnub, 接受成交订单，存入redis, 更新turnover
pubnub.addListener({
    message: function (message) {
        let multi = client.multi();
        let data = message.message;
        let timestamp = new Date().getTime();
        for (let i = 0; i < data.length; i ++) {
            let price = data[i]["price"];
            let size  = data[i]["size"];
            volume += size;
            turnover += price * size;
            if (data[i]["side"] == "BUY") {
                buyvolume += size;
                buyturnover += price * size;
            } else {
                sellvolume += size;
                sellturnover += price * size;
            }
            data[i]["timestamp"] = timestamp;
            let redisData = ["TurnOver", timestamp, JSON.stringify(data[i])];
            multi.zadd(redisData);
        }
        multi.exec(function(err, replies) {
            if (err) {
                throw err;
            }
        });
    }
});
pubnub.subscribe({
    channels: ['lightning_executions_BTC_JPY']
});

setTimeout(recordCurrentData, recordInterval);  // 每隔500ms 记录turnover
setTimeout(updateTurnOver, updateTurnOverInterval); // 每隔10分钟，删除过期数据


/* ---------- functions ----------- */
// 维护24小时turnover
function updateTurnOver() {
    let timestamp = new Date().getTime();
    let onedayBefore = timestamp - 24 * 60 * 60 * 1000; // 24小时数据过期
    log.info("check expire" + onedayBefore);
    client.zrangebyscore("TurnOver", 0, onedayBefore, function (err, members) {
        if (err) {
            throw err;
        }
        for (let i = 0; i < members.length; i ++) {
            let mem = JSON.parse(members[i]);
            let size = mem["size"];
            let price = mem["price"];
            volume -= size;
            turnover -= Number(price) * size;
            if (mem["side"] == "BUY") {
                buyvolume -= size;
                buyturnover -= price * size;
            } else {
                sellvolume -= size;
                sellturnover -= price * size;
            }
        }
    });
    setTimeout(updateTurnOver, updateTurnOverInterval);
}
// 记录当前的turnover以及volume
function recordCurrentData() {
    let timestamp = new Date().getTime();
    let subfix = dateFormat(timestamp, "yyyy-mm-dd");
    let fileName = "./trade_data/trade_summary_" + subfix + ".csv";
    if (!fs.existsSync(fileName)) {
        fs.closeSync(fs.openSync(fileName, 'w'));
    }
    let stats = fs.statSync(fileName)
    if (!stats["size"]) {
        fs.appendFileSync(fileName,
            "timestamp, localtime, turnover, buyturnover, sellturnover, volume, buyvolume, sellvolume" + os.EOL);
    }
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
    setTimeout(recordCurrentData, recordInterval);
}