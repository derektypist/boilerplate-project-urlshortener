'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
}); 


app.listen(port, function () {
  console.log('Node.js listening ...');
});

// Database Connection
let uri = process.env.DB_URI;
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});

let urlSchema = new mongoose.Schema({
  original_url: {type: String, required: true},
  short_url: Number
});

let Url = mongoose.model('Url', urlSchema);

let bodyParser = require('body-parser');
let responseObject = {};

app.post("/api/shorturl/new", bodyParser.urlencoded({extended: false}), function (req, response) {
   let inputUrl = req.body['url'];
  let urlRegex = new RegExp(/https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}/gi);

   if (!inputUrl.match(urlRegex)) {
     response.json({error: "invalid url"});
     return;
   }

   responseObject['original_url'] = inputUrl;
   let inputShort = 1;
   Url.findOne({})
   .sort({short_url: 'desc'})
   .exec(function (error, result) {
     if (!error && result != undefined) {
       inputShort = result.short_url + 1;
     }

    if (!error) {
      Url.findOneAndUpdate(
        {original_url: inputUrl},
        {original_url: inputUrl, short_url: inputShort},
        {new: true, upsert: true},
        function (error, savedUrl) {
          if (!error) {
            responseObject['short_url'] = savedUrl.short_url;
            response.json(responseObject);
          }
        }
      );
    }


   });

});

app.get("/api/shorturl/:short_url", function (req, response) {
  let input = req.params.short_url;
  Url.findOne({short_url: input}, function (error, result) {
    if (!error && result != undefined) {
      response.redirect(result.original_url);
    } else {
      response.json("URL Not Found");
    }
  });
});


