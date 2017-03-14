'use strict';

const express = require('express');
const bodyParser = require('body-parser');
var https = require('https');
var placesAPI = 'AIzaSyCjuvR8Wfdzg2e3EVmU30Lun8hcmxyeSLo';

const restService = express();

restService.use(bodyParser.urlencoded({
    extended: true
}));

restService.use(bodyParser.json());

restService.post('/bot', function(req, res) {
    var speech = '';
    var json = req.body.result;
    if (json.action === 'type.name') 
    {
        var lat = 40.48850079103278;
        var lng = -74.43782866001129;
        var withRadius = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+lat+','+lng+'&radius=500&rankby=prominence&type='+type+'&key='+placesAPI;
        var withoutRadius = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+lat+','+lng+'&rankby=distance&type='+type+'&key='+placesAPI;
        var speech = "Based on " + json.parameters.rankby + ":";
        var url = (json.parameters.rankby == 'prominence') ? withRadius : withoutRadius;
        httpsGet(url, function(response) {
            var result = JSON.parse(response);
            for (var i = 0; i < 5 || i < result.results.length; i++)
                speech += "\n" + "Name: " + result.results[i].name + " | " + "Rating: " + result.results[i].rating;
            return res.json({
            speech: speech,
            displayText: speech,
            source: 'googleapis'
            });
        });
    }
    else 
    {
        var speech = "else part was called.";
        return res.json({
        speech: speech,
        displayText: speech,
        source: 'no source'
        });
    }
});

function httpsGet(url, callback) {
    https.get(url, function(res) {
        var body = '';
        res.on('data', function(data) {
            body += data;
        });
        res.on('end', function() {
            callback(body);
        });
    });
}

restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});