require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const {MongoClient} = require('mongodb');
const dns = require('dns');

const Client = new MongoClient(process.env.DB_URL);
const db = Client.db("urlshortener");
const urls = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', function(req, res) {
  const url = req.body.url;
  
  try {
    // New URL parsing method using WHATWG URL API
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    dns.lookup(hostname, async (error, address) => {
      if (!address) {
        res.json({error: "Invalid URL"});
      } else {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount
        };
        const result = await urls.insertOne(urlDoc);
        console.log(result)
        res.json({original_url: url, short_url: urlCount});
      }
    });
  } catch (err) {
    res.json({error: "Invalid URL"});
  }
});

app.get("/api/shorturl/:short_url", async (req,res) => {
  const shorturl= req.params.short_url
  const urlDoc = await urls.findOne({short_url:+shorturl})
  res.redirect(urlDoc.url)
});



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});