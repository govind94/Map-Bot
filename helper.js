var https = require('https');

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

function returnSpeechWithData(res, speech, data)
{
    return res.json({
        speech: speech,
        data: data,
        displayText: speech,
        source: 'googleapis'
    });
}

exports.httpsGet = httpsGet;
exports.returnSpeech = returnSpeech;
exports.returnSpeechWithData = returnSpeechWithData;
