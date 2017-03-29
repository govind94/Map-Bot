var https = require('https');

function ipInfo()
{
    // public IP
    var url = 'https://api.ipinfodb.com/v3/ip-city/?format=json&ip=69.116.29.239&key='+ipinfoAPI;
    helper.httpsGet(url, function(response) {
        var result = JSON.parse(response);
        lat = result.latitude - 0.051;
        lng = result.longitude - (-0.0282);
    });
}

function httpsGet(url, callback) 
{
    https.get(url, function(res) {
        var body = '';
        res.on('data', function(data) {
            body += data;
        });
        res.on('end', function() {
            callback(body);
        });
    });
};

function returnSpeech(res, speech)
{
    return res.json({
        speech: speech,
        displayText: speech,
        source: 'googleapis'
    });
}

exports.ipInfo = ipInfo;
exports.httpsGet = httpsGet;
exports.returnSpeech = returnSpeech;