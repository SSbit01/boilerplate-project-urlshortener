require('dotenv').config();
const express = require('express');
const cors = require('cors');
// 
const bodyParser = require("body-parser");
const dns = require("dns");
const mongoose = require("mongoose");
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);
const urlSchema = new mongoose.Schema({
  url: {type:String, required:true}
});
let urlModel = mongoose.model("urlshortener", urlSchema);
//
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

//
app.use(bodyParser.urlencoded({extended:false}));
//

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//
app.post("/api/shorturl/new", (req,res) => {
  let error = {error: "Invalid URL"}
  try {
    let url = new URL(req.body.url);
    dns.lookup(url.hostname, (err,address,family) => {
      if (err || !/http/.test(url.protocol)) {
        res.json(error);
      } else {
        urlModel.findOne({url:req.body.url}, (err,data) => {
          if (data === null) {
            let nURL = new urlModel({
              url: req.body.url
            }); 
            nURL.save((err,d) => {
              res.json({original_url:d.url,short_url:d.id});
            });
          } else {
            res.json({original_url:data.url,short_url:data.id});
          }
        });
      }
    });
  } catch(e) {
    res.json(error);
  }
});

app.get("/api/shorturl/:short_url", (req,res) => {
  urlModel.findById(req.params.short_url, (err,data) => {
    if (err) {
      res.json({error:"No short URL found for the given input"});
    } else {
      res.redirect(data.url);
    }
  });
});
// 

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});