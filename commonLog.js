const Log = require('log');
const fs = require('fs');
const dateFormat = require('dateformat');


module.exports = class comLog {
    constructor(file) {
        this.file = file;
    }
    logName()  {
        let timestamp = new Date().getTime();
        let subfix = dateFormat(timestamp, "yyyy-mm-dd");
        let fileName = "./log/" + this.file + "_" + subfix + ".log";
        return fileName;
    }
    info(txt) {
        let cur = new Log('debug', fs.createWriteStream(this.logName()));
        cur.info(txt);
    }
    error(txt) {
        let cur = new Log('debug', fs.createWriteStream(this.logName()));
        cur.error(txt);
    }
}
