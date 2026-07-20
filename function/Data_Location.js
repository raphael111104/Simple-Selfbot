
"use strict";

const fs = require('fs')

const JSON_DATA = {
setting: JSON.parse(fs.readFileSync('./config.json')),
server_eror: JSON.parse(fs.readFileSync('./database/func_error.json')),
db_respon_list: JSON.parse(fs.readFileSync('./database/db_addlist.json')),
}

exports.setting_JSON = JSON_DATA.setting;
exports.server_eror_JSON = JSON_DATA.server_eror;
exports.db_respon_list_JSON = JSON_DATA.db_respon_list;
