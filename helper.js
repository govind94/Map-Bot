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
    var len = result.results.length;
    if (len == 0) helper.returnSpeech(res, "I couldn't find what you were looking for. As a reminder,  I am searching for places based on your location only. To look up places far away, type \"Specific requests\" or \"Info about places\".");
    speech = (len < 3) ? ("I could find only " + (len == 1 ? "one" : "two") + ":\n\n") : head;
    for (var i = 0; i < 5 && i < result.results.length; i++)
        speech += "\n\n" + (i + 1) + ". " + result.results[i].name + " | " + result.results[i].vicinity;
    speech += "\n\nDo you want to go to any one of the above places? Just copy and paste the address associated with the place.";
    returnSpeech(res, speech);
}

exports.httpsGet = httpsGet;
exports.returnSpeech = returnSpeech;
exports.returnSpeechWithData = returnSpeechWithData;
exports.type_name_helper = type_name_helper;
