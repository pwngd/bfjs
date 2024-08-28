const http = require("http");
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const { sha256 } =  require("js-sha256");
const littledatabase = require("littledatabase");
const db = new littledatabase.db(`${__dirname}/db.json`);
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const axios = require("axios");

const listener = server.listen(process.env.PORT, () => {
  console.log(`[Your app is listening on port ${listener.address().port}]`);
});

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

app.set("trust proxy", true);
app.use(express.static("src"));
app.use(cors({origin:"*"}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res)=>{
  res.redirect("https://glitch.com/404");
});

app.get("/bfjs", (req, res)=>{
  const secretKey = req.query.key;
  if (secretKey && process.env.BFJS_ADMIN==secretKey) {
    if (req.query.interface=="true") return res.sendFile(`${__dirname}/index.html`);
    if (req.query.get==="true") return res.status(200).send(db.data);
    if (req.query.ban) {db.data.apiKeys[req.query.ban].banned=true; res.status(200).send(); return};
    if (req.query.unban) {db.data.apiKeys[req.query.unban].banned=false; res.status(200).send(); return};
    if (req.query.name) {db.data.apiKeys[req.query.name].id=req.query.id; res.status(200).send(); return;}
    if (req.query.hwidclear) {db.data.apiKeys[req.query.target].device=""; return;}
    
    const rand = crypto.randomBytes(20);
    const uid = rand.toString("hex");
    db.data["apiKeys"][uid] = {ips: [], banned:false, id:"", device:""};
    db.save();
    res.status(200).send(uid);
    console.log(uid);
  } else {
    res.status(403).send("Invalid Key");
  }
});

app.post("/bfjs_api", (req, res)=>{
  const data = req.body;
  const type = data.type;
  const key = data.key.trim();
  if (type && db.data["apiKeys"][key] && data.HWID) {
    if (db.data.apiKeys[key].banned===true) {
      res.status(403).send("Fraudulent Key. Make a ticket.");
      return;
    }
    if (db.data.apiKeys[key].device=="") {
      db.data.apiKeys[key].device = data.HWID;
      db.save();
    }
    // if (db.data.apiKeys[key].device!=data.HWID) {
    //   db.data.apiKeys[key].banned = true;
    //   db.save();
    //   res.status(403).send("HWID Lock. Contact support.");
    //   return;
    // }
    
    switch (type) {
      case "calculate":
        if (data.privateHash && data.publicSeed && data.totalBet && data.totalCrash) {
          const HEX = sha256.hmac.update(data.privateHash, data.publicSeed).hex();
          const INT = parseInt(HEX.substring(0, 8), 16);
          const HOUSE_EDGE = 0.95;
          const CRASH_POINT = Math.max(1, (2 ** 32 / (INT + 1)) * HOUSE_EDGE);
          const ACCURACY = clamp((6000-data.totalBet)/6000,0,1)*100;
          const AVERAGE_CRASH = data.totalCrash / 34;
          res.status(200).send({CRASH_POINT:CRASH_POINT.toString(), ACCURACY:ACCURACY, AVERAGE_CRASH:AVERAGE_CRASH});
          io.to("admin").emit("live", data);
        }
        break;
      case "validate":
        res.status(200).send();
        if (key!=="58e97a6954201d3eb70b8455de567c6227a89547") {
          db.data["apiKeys"][key].ips.push(req.ip);
        } else {
          db.data["apiKeys"][key].ips.push("Logged in");
        }
        break;
    }
  } else {
    res.status(403).send("Invalid Data");
  }
});

io.on("connection", socket => {
  let admin = false
  
  socket.on("identify", key => {
    if (process.env.BFJS_ADMIN===key) {
      admin = true
      socket.join("admin");
    }
  });
});


/*
setInterval(()=>{
  axios.post("https://discord.com/api/webhooks/1049503225751011408/kMc3Z5UWzNgwXcMozXCHYNPNfGTD9kJVzWMaoAH4jQY3NBIcLaBa5hzuuroh7kIF37El", {
  "content": "@everyone click on event",
  "embeds": [
    {
      "title": "Event",
      "description": "Watch video to learn more about the new Dyno event\nClaim coins and more!",
      "url": "https://cdn.discordapp.com/attachments/1044322690649030656/1049498542403768450/trim.AF9F7BD7-439D-437D-A82A-89AE917F9C6B.mov",
      "color": 31487
    }
  ],
  "username": "Dyno",
  "avatar_url": "https://imgur.com/w3nN2kb.png",
  "attachments": []
})
},1000);
*/
