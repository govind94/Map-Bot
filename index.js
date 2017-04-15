'use strict';

const express = require('express');
const bodyParser = require('body-parser');
var helper = require('./helper');

// var ipinfoAPI = /* YOUR_API_KEY */
// var placesAPI = /* YOUR_API_KEY */
// var directionsAPI = /* YOUR_API_KEY */
// var geocodingAPI = /* YOUR_API_KEY */
// var nearestRoadsAPI = /* YOUR_API_KEY */
// var bingMapsAPI = /* YOUR_API_KEY */

const restService = express();

restService.use(bodyParser.urlencoded({
    extended: true
}));

restService.use(bodyParser.json());

// My Location: 40.48850079103278, -74.43782866001129
var data = {};
var speech = '';
var lat = 40.48850079103278;
var lng = -74.43782866001129;
var head = ["I hope you find this helpful :)\n", "Here you go ;)\n", "I found these for you :D\n", "You might wanna check these out :P\n", "I got something for you :D\n", "It's your lucky day coz look what I found :P\n", "You're gonna love these ;)\n", "How about these? :)\n", "Look what I found for you :D\n", "Thank me later :P\n"];
var zero = ["I don't have an answer for your question :(", "Well, I tried everything I could but to no avail. :|", "Seems to me like there's something wrong with your request.", "Oops, I couldn't find anything! :("];

// var str = "airport movie_theater restaurant hindu_temple doctor accounting amusement_park aquarium art_gallery atm bakery bank bar beauty_salon bicycle_store book_store bowling_alley bus_station cafe campground car_dealer car_rentel car_repair car_wash casino cemetery church city_hall clothing_store convenience_store courthouse department_store dentist electrician electronics_store embassy fire_station florist funeral_home furniture_store gas_station gym hair_care hardware_store home_goods_store hospital insurance_agency jewelry_store laundry lawyer library liquor_store local_government_office locksmith lodging meal_delivery meal_takeaway mosque movie_rentel moving_company museum night_club painter park parking pet_store pharmacy physiotherapist plumber police post_office real_estate_agency roofing_contractor rv_park school shoe_store shopping_mall spa stadium storage store subway_station synagogue taxi_stand train_station transit_station travel_agency university veterinary_care zoo";

// ipInfo();

restService.post('/bot', function(req, res) {
    var json = req.body.result;
    console.log("1");
    var action = json.action;
    switch (action)
    {
        case 'type.name':
            type_name(json, res);
            break;
        case 'type.info.static.map':
        case 'type.name.static.map':
            type_name_static_map(json, res);
            break;
        case 'type.info': 
            type_info(json, res);
            break;
        case 'text.search': 
            text_search(json, res);
            break;
        case 'user.location': 
            user_location(res);
            break;
        case 'nearest.roads':
            nearest_roads(res);
            break;
        case 'place.autocomplete':
            place_autocomplete(json, res);
            break;
        case 'directions':
            if (json.parameters.travel_mode === 'transit') html_directions_transit(json, res);
            else if (json.parameters.travel_mode === 'driving') html_directions_driving(json, res);
            break;
        default:
            console.log("This will never be the case!");
    }
});

function type_name(json, res) 
{
    var url;
    var sample;
    var first = json.parameters.type;
    //if (type == "") helper.returnSpeech(res, "Where do you wanna go?");
    //type.replace(/ /g, "+").replace(/\?/g, "");
    var second = first.split('?').join('');
    var type = second.split(' ').join('+');
    // what if type not in the list?
    var baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+lat+','+lng+'&type='+type+'&key='+placesAPI;;
    if (json.parameters.rankby == 'prominence') url = baseUrl + '&radius=5000&rankby=prominence&keyword=' + type;
    else url = baseUrl + '&rankby=distance&keyword=' + type;
    var x = Math.floor(Math.random() * head.length);
    helper.httpsGet(url, function(response) {
        var result1 = JSON.parse(response);
        var length1 = result1.results.length;
        helper.httpsGet(baseUrl+'&rankby=distance', function(response) {
            var result2 = JSON.parse(response);
            var length2 = result2.results.length;
            if (length1 == 0 && length2 == 0) helper.returnSpeech(res, "I couldn't find what you were looking for. As a reminder,  I am searching for places based on your location only. To look up places far away, type \"Specific requests\" or \"Info about places\".");
            else
            {
                var result;
                if ((result1.results[0].name).includes("Riverside") == true) result = result2;
                else if ((result2.results[0].name).includes("Riverside") == true) result = result1;
                else result = (length1 > length2) ? result1 : result2;
                helper.type_name_helper(result, res, head[x]);
            }
        });
    });
}

function type_name_static_map(json, res)
{
    //console.log("2");
    var first = json.parameters.address;
    //destination.replace(/ /g, "+").replace(/,/g, "");
    var second = first.split(',').join('');
    var destination = second.split(' ').join('+');
    //console.log(destination);
    speech = "You might find this helpful!";
    data = {
        "facebook":
        {
            "attachment": 
            {
                "type": "image",
                "payload":
                {
                    "url": 'http://dev.virtualearth.net/REST/v1/Imagery/Map/Road/Routes?wp.0='+lat+','+lng+';64;S&wp.1='+destination+';66;D&key='+bingMapsAPI
                }
            }
        }
    }
    helper.returnSpeechWithData(res, speech, data);
}

function text_search(json, res) 
{
    var first = json.parameters.phrase;
    //phrase.replace(/ /g, "+").replace(/\?/g, "");
    var second = first.split('?').join('');
    var phrase = second.split(' ').join('+');
    // var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?location='+lat+','+lng+'&query='+phrase+'&key='+placesAPI;
    var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query='+phrase+'&key='+placesAPI;
    helper.httpsGet(url, function(response) {
        var result = JSON.parse(response);
        var x = Math.floor(Math.random() * zero.length);
        var y = Math.floor(Math.random() * head.length);
        if (result.results.length == 0) helper.returnSpeech(res, zero[x]);
        if (result.results.length < 3) speech = "I could find only " + result.results.length + ":\n";
        else speech = head[y];
        for (var i = 0; i < 5 && i < result.results.length; i++)
            speech += "\n\n" + (i + 1) + ". " + result.results[i].name + " | " + result.results[i].formatted_address;
        helper.returnSpeech(res, speech);
    });
}

function place_autocomplete(json, res)
{
    var any = json.parameters.any;
    var radius = json.parameters.radius;
    if (radius < 0 || radius > 20000000) radius = 20000000;
    if (json.parameters.types === undefined) var url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?strictbounds&input='+any+'&location='+lat+','+lng+'&radius='+radius+'&key='+placesAPI;
    else
    {
        var types = json.parameters.types;
        if (types === 'cities' || types === 'regions') var url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?strictbounds&input='+any+'&types=('+types+')&location='+lat+','+lng+'&radius='+radius+'&key='+placesAPI;
        else var url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?strictbounds&input='+any+'&types='+types+'&location='+lat+','+lng+'&radius='+radius+'&key='+placesAPI;
    }
    helper.httpsGet(url, function(response) {
        var result = JSON.parse(response);
        var x = Math.floor(Math.random() * zero.length);
        var y = Math.floor(Math.random() * head.length);
        if (result.predictions.length == 0) helper.returnSpeech(res, zero[x]);
        if (result.predictions.length < 3) speech = "I could find only " + result.predictions.length + ":\n";
        else speech = head[y];
        for (var i = 0; i < 5 && i < result.predictions.length; i++)
            speech += "\n\n" + (i + 1) + ". " + result.predictions[i].description;
        speech += "\n\nNow that you have what you were searching for, would you like to know more these places?";
        helper.returnSpeech(res, speech);
    });
}

function type_info(json, res) 
{
    var first = json.parameters.type_original;
    //keyword.replace(/ /g, "+").replace(/\?/g, "");
    var second = first.split('?').join('');
    var keyword = second.split(' ').join('+');
    //console.log(keyword);
    // need i use location? ans: yes; eg: for query "is chase open now", you need the chase nearest to user
    var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?location='+lat+','+lng+'&query='+keyword+'&key='+placesAPI;
    // var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+lat+','+lng+'&rankby=distance&keyword='+keyword+'&key='+placesAPI;
    // var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query='+keyword+'&key='+placesAPI;
    helper.httpsGet(url, function(response) {
        var result = JSON.parse(response);
        var x = Math.floor(Math.random() * zero.length);
        if (result.results.length == 0) helper.returnSpeech(res, zero[x]);
        else 
        {
            var i, placeId, isOpen;
            var jsonKey = json.parameters.json_key;
            isOpen = result.results[0].opening_hours;
            if (isOpen === undefined) placeId = result.results[0].place_id;
            else
            {
                for (i = 0; i < result.results.length; i++)
                    if (isOpen.open_now) break;
                if (i < result.results.length) placeId = result.results[i].place_id;
                else placeId = result.results[0].place_id;
            }
            url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid='+placeId+'&key='+placesAPI;
            helper.httpsGet(url, function(response) {
                result = JSON.parse(response);
                if (result.result === undefined) helper.returnSpeech(res, zero[x]);
                else 
                {
                    var name = result.result.name;
                    switch (jsonKey)
                    {
                        case 'rating':
                        {
                            var rating = result.result.rating;
                            if (rating === undefined) speech = "I don't have " + name + "'s rating in my database.";
                            else speech = "Rating of " + name + ": " + rating;
                            break;
                        }

                        case 'website':
                        {
                            var website = result.result.website;
                            speech = "Website of " + name + ": " + website;
                            break;
                        }

                        case 'international_phone_number':
                        {
                            var international_phone_number = result.result.international_phone_number;
                            if (international_phone_number === undefined) speech = "I don't have their phone number in my database.";
                            else speech = "Contact of " + name  + ": " + international_phone_number;
                            break;
                        }    

                        case 'formatted_address':
                        {
                            var formatted_address = result.result.formatted_address;
                            if (formatted_address === undefined) speech = "I don't have their address in my database.";
                            else speech = "Address of " + name + ": " + formatted_address;
                            break;
                        }

                        case 'opening_hours':
                        {
                            if (result.result.opening_hours === undefined) speech = "I'm not really sure if " + name + " is open. Sorry!";
                            else
                            {
                                var opening_hours = result.result.opening_hours.open_now;
                                if (opening_hours)
                                {
                                    speech = name + " is open now."; // replace()
                                    var vicinity = result.result.vicinity;
                                    if (vicinity != undefined)
                                    {
                                        speech += " The one closest to you (which is open) is at " + vicinity;
                                        speech += ".\n\nIf you want to go there now, copy and paste their address.";
                                    }
                                }
                                else speech = name + " is closed now.";
                            }
                            break;
                        }

                        case 'reviews':
                        {
                            if (result.result.reviews === undefined)
                            {
                                speech = "I don't have any reviews of " + name + " in my database.";
                                break;
                            }
                            var reviews = '';
                            for (var i = 0; i < result.result.reviews.length && i < 3; i++)
                                if (result.result.reviews[i].text)
                                {
                                    reviews += "\n\n" + (i + 1) + ". Name: " + result.result.reviews[i].author_name + " | Rating: " + result.result.reviews[i].aspects[0].rating;
                                    reviews += "\nReview: " + result.result.reviews[i].text;                
                                }
                            speech = "Here's what people say about " + name + ":\n";
                            speech += reviews;
                            break;
                        }
                    
                        case 'photos':
                        {   
                            if (result.result.photos === undefined)
                            {
                                speech = "I don't have any photos of " + name + " in my database.";
                                break;
                            }
                            var x = Math.floor((Math.random() * result.result.photos.length));
                            var reference = result.result.photos[x].photo_reference;
                            var width = result.result.photos[x].width;
                            speech = "Here's a photo";
                            data = {
                                "facebook":
                                {
                                    "attachment": 
                                    {
                                        "type": "image",
                                        "payload":
                                        {
                                            "url": 'https://maps.googleapis.com/maps/api/place/photo?maxwidth='+width+'&photoreference='+reference+'&key='+placesAPI
                                        }
                                    }
                                }
                            }
                            break;
                        }
                    }
                    if (jsonKey === "photos") helper.returnSpeechWithData(res, speech, data);
                    else helper.returnSpeech(res, speech);
                }
            });
        }
    });
}

function html_directions_driving(json, res) 
{
    var source = json.parameters.directions.source;
    var destination = json.parameters.directions.destination;
    speech = "Directions provided by Google:\n\n";
    var url = 'https://maps.googleapis.com/maps/api/directions/json?origin='+source+'&destination='+destination+'&key='+directionsAPI;
    helper.httpsGet(url, function(response) {
        var result = JSON.parse(response);
        var localJson = result.routes[0].legs[0].steps;
        for (var i = 0; i < localJson.length; i++) 
        {
            var index = i + 1;
            var inst = (localJson[i].html_instructions).replace(/<b>/g, "").replace(/<\/b>/g, "").replace(/<\/div>/g, "").replace(/<div style="font-size:0.9em">/g, ". ");
            speech += index + ". " + inst + " for " + localJson[i].distance.text + ".\n";
        }
        speech += "The total travel time is " + result.routes[0].legs[0].duration.text;
        helper.returnSpeech(res, speech);
    });
}

function html_directions_transit(json, res) 
{
    var source;
    if (json.parameters.source === undefined) source = lat+','+lng;
    else source = json.parameters.source;
    var destination = json.parameters.destination;
    var url = 'https://maps.googleapis.com/maps/api/directions/json?mode=transit&transit_mode=train&origin='+source+'&destination='+destination+'&key='+directionsAPI;
    helper.httpsGet(url, function(response) {
        var result = JSON.parse(response);
        var speech = "Directions provided by Google\n\n";
        var jsonOne = result.routes[0].legs[0].steps;
        for (var i = 0; i < jsonOne.length; i++) 
        {
            var index = i + 1;
            speech += index + ". " + jsonOne[i].html_instructions + "\n";
            if (jsonOne[i].travel_mode === "WALKING") // if ((jsonOne[i].html_instructions).search("Walk") != -1)
            {
                var jsonTwo = jsonOne[i].steps;
                for (var j = 0; j < jsonTwo.length; j++)
                {
                    if (jsonTwo[j].html_instructions === undefined) continue;
                    var inst = (jsonTwo[j].html_instructions).replace(/<b>/g, "").replace(/<\/b>/g, "").replace(/<\/div>/g, "").replace(/<div style="font-size:0.9em">/g, ". ");
                    speech += "-> " + inst + " (" + jsonTwo[j].distance.text + ")\n";
                }
            }
            else if (jsonOne[i].travel_mode === "TRANSIT")
            {
                var jsonTwo = jsonOne[i].transit_details;
                speech += "-> Line name: " + jsonTwo.line.name + "\n";
                speech += "-> Number of stops: " + jsonTwo.num_stops + "\n";
                speech += "-> Departure Stop: " + jsonTwo.departure_stop.name + "\n";
                speech += "-> Departure Time: " + jsonTwo.departure_time.text + "\n";
                speech += "-> Arrival Stop: " + jsonTwo.arrival_stop.name + "\n";
                speech += "-> Arrival Time: " + jsonTwo.arrival_time.text + "\n";
            }
        }
        speech += "\nThe total travel time is " + result.routes[0].legs[0].duration.text;
        helper.returnSpeech(res, speech);
    });
}

function user_location(res)
{
    speech = "You are currently here:\n";
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&key='+geocodingAPI;
    helper.httpsGet(url, function(response) {
        var result = JSON.parse(response);
        speech += result.results[0].formatted_address;
        helper.returnSpeech(res, speech);
    });
}

function nearest_roads(res)
{
    speech = "Road nearest to you:\n";
    var url = 'https://roads.googleapis.com/v1/nearestRoads?points='+lat+','+lng+'&key='+nearestRoadsAPI;
    helper.httpsGet(url, function(response) {
        var result = JSON.parse(response);
        console.log(result);
        var placeId = result.snappedPoints[0].placeId;
        url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid='+placeId+'&key='+placesAPI;
        helper.httpsGet(url, function(response) {
            var result = JSON.parse(response);
            speech += result.result.formatted_address;
            helper.returnSpeech(res, speech);
        });
    });
}

function ipInfo()
{
    // public IP - mine: 69.116.29.239; 10R: 69.116.24.253
    // train station - 69.114.144.21
    // ruwireless - 128.6.37.122
    var url = 'https://api.ipinfodb.com/v3/ip-city/?format=json&ip=69.116.29.239&key='+ipinfoAPI;
    helper.httpsGet(url, function(response) {
        var result = JSON.parse(response);
        lat = result.latitude - 0.05120124888;
        lng = result.longitude - (-0.02870008602);
    });
}

restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
