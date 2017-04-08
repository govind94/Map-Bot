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

function type_name_helper(result, res, head)
{
    speech = (result.results.length < 3) ? ("I could find only " + result.results.length + ":\n\n") : head;
    for (var i = 0; i < 5 && i < result.results.length; i++)
        speech += "\n\n" + (i + 1) + ". " + result.results[i].name + " | " + result.results[i].vicinity;
    returnSpeech(res, speech);
}

exports.httpsGet = httpsGet;
exports.returnSpeech = returnSpeech;
exports.returnSpeechWithData = returnSpeechWithData;
exports.type_name_helper = type_name_helper;
