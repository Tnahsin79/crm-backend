const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const mongodb = require("mongodb")
var bcryptjs = require("bcryptjs");
var nodemailer = require("nodemailer");
const mongoClient = mongodb.MongoClient;
const cors = require("cors");
require('dotenv').config();
//const url = "mongodb+srv://Tnahsin79:tnahsin79@guvi-zen.iisub.mongodb.net?retryWrites=true&w=majority";
const url = "mongodb+srv://Tnahsin79:tnahsin79@guvi-capstone.iisub.mongodb.net?retryWrites=true&w=majority";
app.use(bodyParser.json());
app.use(cors({
  origin: "http://localhost:3000"
}));

console.log("server started...");

//GET users listing. 
app.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

app.post("/signup", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("crm");
    var user = await db.collection("user").findOne({ Email: req.body.Email });
    if (!user) {
      //generate salt
      let salt = await bcryptjs.genSalt(10);
      //hash password
      let hash = await bcryptjs.hash(req.body.Password, salt);
      //store in db
      req.body.Password = hash;
      if (req.body.Type === "A")
        user = await db.collection("admins").insertOne(req.body);
      if (req.body.Type === "M")
        user = await db.collection("managers").insertOne(req.body);
      if (req.body.Type === "E")
        user = await db.collection("employees").insertOne(req.body);
      res.json({
        message: "New User Registered!"
      });
    }
    else {
      alert("Email aleady registrered!");
    }
  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.get("/login", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("crm");
    //find the user with email
    var admins, managers, employees, user;
    if (req.body.Type === "A") {
      user = await db.collection("admins").findOne({ Email: req.body.Email });
      managers = await db.collection("managers").find({}).toArray();
      employees = await db.collection("employees").find({}).toArray();
    }
    if (req.body.Type === "M") {
      user = await db.collection("managers").findOne({ Email: req.body.Email });
      employees = await db.collection("employees").find({}).toArray();
    }

    if (req.body.Type === "E") {
      user = await db.collection("employees").findOne({ Email: req.body.Email });
    }
    if (user) {
      //compare the password
      var result = await bcryptjs.compare(req.body.Password, user.Password);
      if (result) {
        //alert("ACCESS GRANTED :)");
        if (req.body.Type === "A")
          res.json({ user, List_of_mangers: managers, List_of_employees: employees });
        if (req.body.Type === "M")
          res.json({ user, List_of_employees: employees });
        if (req.body.Type === "E")
          res.json({ user });
      }
      else {
        //alert("ACCESS DENIED :( (incorrect username/password");
        res.json({
          access: "DENIED",
          message: "wrong email or password"
        });
      }
    }
    else {
      //alert("No such user exists, kindly register yourself!!!!");
      res.json({
        status: false,
        message: "No such user exists, kindly register yourself!!!! or activate account"
      });
    }
  }
  catch (error) {
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.get("/validate", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("crm");
    //var user = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.body.Id) });
    var user;
    if (req.body.Type === "A")
      user = await db.collection("admins").findOne({ Email: req.body.Email });
    if (req.body.Type === "M")
      user = await db.collection("managers").findOne({ Email: req.body.Email });
    if (req.body.Type === "E")
      user = await db.collection("employees").findOne({ Email: req.body.Email });
    if (user) {
      res.json({
        status: "validation mail sent"
      });
    }
    else {
      res.json({
        status: "no such account exists"
      });
    }
  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    });
  }
});

app.put("/reset/:type/:email", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("react-login");
    var user;
    if (req.params.type === "A")
      user = await db.collection("admins").findOne({ Email: req.params.email });
    if (req.params.type === "M")
      user = await db.collection("managers").findOne({ Email: req.params.email });
    if (req.params.type === "E")
      user = await db.collection("employees").findOne({ Email: req.params.email });
    if (user) {
      //generate salt
      let salt = await bcryptjs.genSalt(10);
      //hash password
      let hash = await bcryptjs.hash(req.body.new_password, salt);
      //store in db
      req.body.new_password = hash;
      if (req.params.Type === "A")
        await db.collection("admins")
          .findOneAndUpdate(
            { Email: req.params.email },
            {
              $set: {
                Password: req.body.new_password
              }
            }
          );
      if (req.params.Type === "M")
        await db.collection("mangers")
          .findOneAndUpdate(
            { Email: req.params.email },
            {
              $set: {
                Password: req.body.new_password
              }
            }
          );
      if (req.params.Type === "E")
        await db.collection("employees")
          .findOneAndUpdate(
            { Email: req.params.email },
            {
              $set: {
                Password: req.body.new_password
              }
            }
          );
      res.json({
        message: "Password changed successfully"
      })
    }
    else {
      res.json({
        message: "new password and confirm password does not match"
      })
    }
  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

const port = process.env.PORT || 3001;
app.listen(port);