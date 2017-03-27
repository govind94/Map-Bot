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

var speech = '';
var lat = 40.48850079103278;
var lng = -74.43782866001129;

restService.post('/bot', function(req, res) {
    var json = req.body.result;
    console.log("1");
    if (json.action === 'type.name') type_name(json, res);
    else if (json.action === 'type.info') type_info(json, res);
    else if (json.action === 'text.search') text_search(json, res);
    else if (json.action === 'user.location') user_location(res);
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
};

function type_name(json, res)
{
    var url;
    var type = json.parameters.type; //update: removed // remove [0] if you uncheck 'IS LIST' in the intent
    var withRadius = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+lat+','+lng+'&radius=5000&rankby=prominence&type='+type+'&key='+placesAPI;
    var withoutRadius = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+lat+','+lng+'&rankby=distance&type='+type+'&key='+placesAPI;
    if (json.parameters.rankby == 'prominence')
    {
        speech = "Based on prominence: ";
        url = withRadius;
    }
    else
    {
        speech = "Based on distance: ";
        url = withoutRadius;
    }

    /*
    if (json.parameters.rankby.length == 2) 
    {
        speech = "Based on distance: ";
        url = withoutRadius;
    }
    else 
    {
        if (json.parameters.rankby == 'prominence') { speech = "Based on prominence: "; url = withRadius; }
        else { speech = "Based on distance: "; url = withoutRadius; }
    }
    */
    httpsGet(url, function(response) {
        var result = JSON.parse(response);
        for (var i = 0; i < 5 && i < result.results.length; i++)
            speech += "\n" + (i + 1) + ". " + result.results[i].name + " | " + result.results[i].vicinity;
        return res.json({
        speech: speech,
        displayText: speech,
        source: 'googleapis'
        });
    });
};

function type_info(json, res)
{
    var keyword = json.parameters.type_original;
    keyword.replace(/ /g, "+").replace(/\?/g, "");
    var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+lat+','+lng+'&rankby=distance&keyword='+keyword+'&key='+placesAPI;
    httpsGet(url, function(response) {
        var result = JSON.parse(response);
        var placeId = result.results[0].place_id;
        url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid='+placeId+'&key='+placesAPI;
        httpsGet(url, function(response) {
            result = JSON.parse(response);
            var name = result.result.name;
            if (json.parameters.json_key === 'rating')
            {
                var rating = result.result.rating;
                speech = "Rating of nearest " + json.parameters.type_original + " - " + name + ": " + rating;
            }
            else if (json.parameters.json_key === 'website')
            {
                var website = result.result.website;
                speech = "Website of nearest " + json.parameters.type_original + " - " + name + ": " + website;
            }
            else if (json.parameters.json_key === 'international_phone_number')
            {
                var international_phone_number = result.result.international_phone_number;
                speech = "Contact of nearest " + json.parameters.type_original + " - " + name  + ": " + international_phone_number;
            }
            else if (json.parameters.json_key === 'formatted_address')
            {
                var formatted_address = result.result.formatted_address;
                speech = "Address of nearest " + json.parameters.type_original + " - " + name + ": " + formatted_address;
            }
            else if (json.parameters.json_key === 'opening_hours')
            {
                if (result.result.opening_hours === undefined) speech = "I'm not sure if they're open. Sorry!";
                else
                {
                    var opening_hours = result.result.opening_hours.open_now;
                    if (opening_hours) speech = json.parameters.type_original + " is open now."; // replace()
                    else speech = "Nearest " + name /*json.parameters.type_original*/ + " is closed now.";
                }
            }
            else if (json.parameters.json_key === 'reviews')
            {
                var reviews = '';
                for (var i = 0; i < result.result.reviews.length && i < 3; i++)
                    if (result.result.reviews[i].text)
                    {
                        reviews += "\n" + (i + 1) + ". Name: " + result.result.reviews[i].author_name + " | Rating: " + result.result.reviews[i].aspects[0].rating;
                        reviews += "\nReview: " + result.result.reviews[i].text;                
                    }
                speech = "Reviews of nearest " + json.parameters.type_original + " - " + name + ":";
                speech += reviews;
            }
            // var photos;
            return res.json({
            speech: speech,
            displayText: speech,
            source: 'googleapis'
            });
        });
    });
}

function text_search(json, res) {
    var phrase = json.parameters.phrase;
    phrase.replace(/ /g, "+").replace(/\?/g, "");
    speech = phrase + ":\n";
    var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query='+phrase+'&key='+placesAPI;
    httpsGet(url, function(response) {
        var result = JSON.parse(response);
        for (var i = 0; i < 5 && i < result.results.length; i++)
            speech += "\n" + (i + 1) + ". " + result.results[i].name + " | " + result.results[i].formatted_address;
        return res.json({
        speech: speech,
        displayText: speech,
        source: 'googleapis'
        });
    });
}

function user_location(res)
{
    var lat, lng;
    var options = {
        "method": "POST",
        "hostname": "www.googleapis.com",
        "port": null,
        "path": "/geolocation/v1/geolocate?key=AIzaSyDv2mrisGGS-aYNzuPOu8rxe4U6Pa132qo"
        };
    var req = https.request(options, function (response) {
        //var chunks = '';
        var chunks = [];
        response.on("data", function (chunk) {
            //chunks += chunk;
            chunks.push(chunk);
        });
        response.on("end", function () {
            var body = Buffer.concat(chunks);
            speech = body.toString();
            /*var result = JSON.parse(chunks);
            lat = result.location.lat;
            lng = result.location.lng;
            var speech = "Latitude: " + lat + " | " + "Longitude: " + lng;*/
            return res.json({
            speech: speech,
            displayText: speech,
            source: 'googleapis'
            });
        });
    });
    req.end();
}

restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
