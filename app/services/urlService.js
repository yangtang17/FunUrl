var UrlModel = require('../models/urlModel');
var redis = require('redis');

var port = process.env.REDIS_PORT_6379_TCP_PORT;
var host = process.env.REDIS_PORT_6379_TCP_ADDR;

var redisClient = redis.createClient(port, host);


// ================== Redis monitoring code for debugging ==================

redisClient.monitor(function(err, res) {
    console.log("Entering monitoring mode.");
});

redisClient.on("monitor", function(time, args, raw_reply) {
    console.log(time + ": " + args);
});

// output all keys to check if old memory exists
redisClient.keys('*', function(err, replies) {
    replies.forEach(function(reply) {
        redisClient.get(reply, function(err, val) {
            console.log('key: ' + reply + ', value: ' + val + 'of type ' + typeof(val));
        });
    });
});

// flush all memory in case old records cause mistakes
redisClient.flushall();

// ============================= emoji resources ==============================
var emojiDict = [
    '😀', '😁', '😂', '🤣', '😅', '😆', '😍', '😘', '😎', '😙',
    '🤗', '🙄', '😪', '🤑', '😜', '😭', '😵', '😡', '😇', '🤡',
    '😈', '👹', '👻', '💩', '👾', '🤖', '😸', '😹', '😻', '😿',
    '🙈', '🖖', '👌', '👍', '👎', '🙏', '💅', '👀', '💋', '💘',
    '❤', '💓', '💔', '💕', '💚', '💢', '💣', '💥', '🐈', '🐴',
    '🦄', '🐷', '🐭', '🐣', '🐧', '🕊', '🐸', '🐢', '🦎', '🐳',
    '🐬', '🐙', '🌹', '🌻', '🌵', '🍁', '🍇', '🍈', '🍉', '🍊',
    '🍋', '🍌', '🍍', '🍎', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅',
    '🥑', '🍆', '🌽', '🍄', '🌰', '🥞', '🧀', '🍖', '🍔', '🍟',
    '🍕', '🌮', '🍲', '🍦', '🍩', '🍰', '🍵', '🍹', '🌍', '🛩',
    '🚀', '🌛', '🌞', '🌬', '🌈', '💧', '🎉', '🎃', '🎗', '🏀',
    '🏈', '🥋'
];


var chineseStr = '的 一 是 了 我 不 人 在 他 有 这 个 上 们 来 到 时 大 地 为 子 中 你 说 生 国 年 着 就 那 和 要 她 出 也 得 里 后 自 以 会 家 可 下 而 过 天 去 能 对 小 多 然 于 心 学 么 之 都 好 看 起 发 当 没 成 只 如 事 把 还 用 第 样 道 想 作 种 开 美 总 从 无 情 己 面 最 女 但 现 前 些 所 同 日 手 又 行 意 动 方 期 它 头 经 长 儿 回 位 分 爱 老 因 很 给 名 法 间 斯 知 世 什 两 次 使 身 者 被 高 已 亲 其 进 此 话 常 与 活 正 感 见 明 问 力 理 尔 点 文 几 定 本 公 特 做 外 孩 相 西 果 走 将 月 十 实 向 声 车 全 信 重 三 机 工 物 气 每 并 别 真 打 太 新 比 才 便 夫 再 书 部 水 像 眼 等 体 却 加 电 主 界 门 利 海 受 听 表 德 少 克 代 员 许 稜 先 口 由 死 安 写 性 马 光 白 或 住 难 望 教 命 花 结 乐 色 更 拉 东 神 记 处 让 母 父 应 直 字 场 平 报 友 关 放 至 张 认 接 告 入 笑 内 英 军 候 民 岁 往 何 度 山 觉 路 带 万 男 边 风 解 叫 任 金 快 原 吃 妈 变 通 师 立 象 数 四 失 满 战 远 格 士 音 轻 目 条 呢 病 始 达 深 完 今 提 求 清 王 化 空 业 思 切 怎 非 找 片 罗 钱 紶 吗 语 元 喜 曾 离 飞 科 言 干 流 欢 约 各 即 指 合 反 题 必 该 论 交 终 林 请 医 晚 制 球 决 窢 传 画 保 读 运 及 则 房 早 院 量 苦 火 布 品 近 坐 产 答 星 精 视 五 连 司 巴';

var chineseDict = chineseStr.split(' ');


// ======================= Main logic==========================================
// get shortUrl from given longUrl
var getShortUrl = function(longUrl, urlType, callback) {
    // handle url without 'http://'
    if (longUrl.indexOf('http') === -1) {
        longUrl = 'http://' + longUrl;
    }

    // for longUrl, needs to store urlType as well, use 'redisClient.hgetall'
    redisClient.hgetall(longUrl, function(err, hash) {
        if (hash && hash.urlType === urlType) { // found shortUrl in redis
            // console.log('found shortUrl: ' + hash.shortUrl + '; type: ' + hash.urlType);
            callback({
                shortUrl: hash.shortUrl,
                longUrl: longUrl,
                urlType: hash.urlType
            });
        } else { // if not, check mongodb
            UrlModel.findOne({ longUrl: longUrl, urlType: urlType }, function(err, url) {
                if (url) { // found in mongodb, callback and save to redis
                    callback(url);
                    redisClient.set(url.shortUrl, url.longUrl);
                    redisClient.hmset(url.longUrl, 'shortUrl', url.shortUrl, 'urlType', url.urlType);
                } else { // not found, generate new shortUrl
                    generateShortUrl(urlType, function(shortUrl) {
                        url = new UrlModel({
                            shortUrl: shortUrl,
                            longUrl: longUrl,
                            urlType: urlType
                        });

                        // save to mongodb
                        url.save();

                        // callback
                        callback(url);

                        // save to redis
                        redisClient.set(url.shortUrl, url.longUrl);
                        redisClient.hmset(url.longUrl, 'shortUrl', url.shortUrl, 'urlType', url.urlType);
                    });
                }
            });
        }
    });

};

// get longUrl from given shortUrl
var getLongUrl = function(shortUrl, callback) {
    redisClient.get(shortUrl, function(err, longUrl) {
        if (longUrl) { // found in redis
            callback({
                shortUrl: shortUrl,
                longUrl: longUrl
            });
        } else { // not found, check mongodb
            UrlModel.findOne({ shortUrl: shortUrl }, function(err, url) {
                // callback even if url is null, so callback knows not found
                callback(url);

                // only save to redis when url is not null
                if (url) {
                    redisClient.set(url.shortUrl, url.longUrl);
                    redisClient.hmset(url.longUrl, 'shortUrl', url.shortUrl, 'urlType', url.urlType);
                }
            });
        }
    });

};



//================================== Helpers =================================

// generate a new shortUrl for given longUrl
var generateShortUrl = function(urlType, callback) {
    var shortUrl = '';
    if (urlType === 'alphaNum') {
        UrlModel.count({}, function(err, num) {
            shortUrl = convertTo62(num);
        });
    } else if (urlType === 'emoji') {
        for (var i = 0; i < 6; i++) {
            var len = emojiDict.length;
            shortUrl += emojiDict[Math.floor(Math.random() * len)];
        }
    } else if (urlType === 'Chinese') {
        for (var i = 0; i < 3; i++) {
            var len = chineseDict.length;
            shortUrl += chineseDict[Math.floor(Math.random() * len)];
        }
    }
    //determine if having conflicts in mongoDB
    UrlModel.findOne({ shortUrl: shortUrl }, function(err, url) {
        if (url) { // have conflicts, re-generate
            generateShortUrl(urlType, callback);
        } else { // no conflicts, callback
            console.log('no conflict, shortUrl ' + shortUrl + ' successfully created!');
            callback(shortUrl);
        }
    });

};

// convert number from 10-base to 62-base (inverted order) string
function convertTo62(number) {
    // encode =['a',...,'z','A',...,'Z','0',...,'9'
    var encode = getSeq('a', 'z').concat(getSeq('A', 'Z'), getSeq('0', '9'));
    res = "";
    do { // need 2nd condition to ensure not to skip 0 input
        res += encode[number % 62];
        number = Math.floor(number / 62);
    } while (number);
    return res;
}

// generate a string sequence from a to b, e.g. getSeq('a','d') => 'abcd'
function getSeq(a, b) {
    var len = b.charCodeAt(0) - a.charCodeAt(0) + 1;
    return Array.apply(null, Array(len)).map(function(value, index) {
        return String.fromCharCode(index + a.charCodeAt(0));
    }).join("");
}

// ========================== Output ==========================================
module.exports = {
    getShortUrl: getShortUrl,
    getLongUrl: getLongUrl
};
