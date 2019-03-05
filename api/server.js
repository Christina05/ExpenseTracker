var express = require('express');
var app = express();
var fs = require('fs');
var csvWriter = require('csv-write-stream')
var writer = csvWriter({sendHeaders: false})
var Tesseract = require('tesseract.js')
var multer = require('multer');
var bodyParser= require("body-parser");
app.use(bodyParser.urlencoded({extended: true}))

app.use(function (req, res, next) {

  // Dozvoljene stranice
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Dozvoljene metode
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Dozvoljeni tipovi zaglavlja
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // kada stranica salje cookies (za sesije)
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  next();
});
//datum, ako ga korisnik ne unese
var autoDate = require('date-and-time');
autoDate=(autoDate.format(new Date(),"DD/MM/YYYY"));
app.use(bodyParser.urlencoded({
  parameterLimit: 100000,
  limit: '50mb',
  extended: true
}));

var storage=multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'E:/github/ExpenseTracker/api/pics')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
 
var upload = multer({ storage: storage })

//spremanje novih korisnika
app.put("/signIn",function(req,res){
  var csvFileName="users.csv";
  //gledamo jel postoji csv sa korisnicima, ako ne postoji radimo ga
  if (!fs.existsSync(csvFileName)) {
    writer = csvWriter({sendHeaders: false});
    writer.pipe(fs.createWriteStream(csvFileName));
    writer.write({
      header1: 'UserId',
      header2: 'UserName',
      header3: 'UserMail',
      header4: 'Password'
    });
    writer.end();
  } 

  //provjeravamo je li se mail već korisi
  var allUserMail=[];
  fs.readFile('users.csv', 'utf8',function (err, data) {
    if (err) throw err;
    //ajde po file-u i uzmi samo mailove
    data=data.split('\n');
    for(var i=1;i<data.length;i++){
      allUserMail.push(data[i].split(',')[1]);
    }
    var userId=allUserMail.length;
    var name=req.query.name;
    var mail=req.query.mail;
    var password=req.query.password;
    //ako se mail već koristi pošalji false
    if(allUserMail.indexOf(mail)>-1){
      res.send("false");
    }
    //ako se mail ne koristi
    else{
      //upiši korisnika
      writer = csvWriter({sendHeaders: false});
      writer.pipe(fs.createWriteStream(csvFileName, {flags: 'a'}));
      writer.write({
        header1: userId,
        header2: name,
        header3: mail,
        header4: password
      });
      writer.end();
      
      //napravi njegov csv
      var userDataCsv=__dirname+ "/users_data/"+userId+"_data.csv";
      writer = csvWriter({sendHeaders: false});
      writer.pipe(fs.createWriteStream(userDataCsv));
      writer.write({
        header1: 'Data',
        header2: 'Name',
        header3: 'Value'
    });
    writer.end();
      res.send(userId+","+name);
    }
  });
})

//login
app.get("/login",function(req,res){
  var mail=req.query.mail;
  var password=req.query.password;
  
  //prošetaj po mailovima
  fs.readFile('users.csv','utf8',function(err,data){
    if (err) throw err;
    data=data.split('\n');
    for(var i= 1;i<data.length;i++){
      if(data[i].split(',')[2]==mail){
        if(data[i].split(',')[3]==password){
          console.log("Logged user: "+mail);
          res.send(data[i].split(',')[0]+","+data[i].split(',')[1]);//posalji mail promini neka salje ime i id
          return;
        }
      }
    }
    res.send("false");
  })
})

//save data
app.put("/save",function(req,res){
  // Dohvaćamo podatke korisnika
  var userId=req.query.userId;
  var date = req.query.date;
  var name = req.query.name;
  var value = req.query.value;  
  if(date=="" || date==null){
    date=autoDate;
  }
    //promjena
  var csvFileName=__dirname+"/users_data/"+userId+"_data.csv";
    // Ispisujemo poruku u konzolu
    console.log("Data saved");
    writer = csvWriter({sendHeaders: false});
    writer.pipe(fs.createWriteStream(csvFileName, {flags: 'a'}));
    writer.write({
      header1: date,
      header2: name,
      header3: value
    });
    writer.end();
    
    
    // Šaljemo odgovor korisniku
    res.send("Data stored");

});

app.get("/loadData",function(req,res){
  var userId=req.query.userId;
  var userCsv=__dirname+"/users_data/"+userId+"_data.csv";
  // Otvori datoteku
  fs.readFile(userCsv, 'utf8',function (err, data) {
      if (err) throw err;
        // return all data
        console.log(data);
      res.send(data);
    });
  console.log("data loaded");
})

app.get("/deleteExpense",function(req,res){
  var selected=req.query.selected;
  var userId=req.query.userId;
  var csvFileName=__dirname+"/users_data/"+userId+"_data.csv";
  var data=fs.readFileSync(csvFileName).toString().split("\n");
  console.log(data);
  writer = csvWriter({sendHeaders: false});
  writer.pipe(fs.createWriteStream(csvFileName));
  writer.write({
    header1: 'Data',
    header2: 'Name',
    header3: 'Value'
  });

  writer.end();

  for(var i = 1; i<data.length-1;i++){
    var expense=data[i].split(',')
    if(i!=parseInt(selected)){
      writer = csvWriter({sendHeaders: false});
      writer.pipe(fs.createWriteStream(csvFileName, {flags: 'a'}));
      writer.write({
      header1: expense[0],
      header2: expense[1],
      header3: expense[2]
      });
      writer.end();
    }
  }
  fs.readFile(csvFileName, 'utf8',function (err, data) {
    if (err) throw err;
      // return all data
    res.send(data);
  });
  console.log("data loaded");
})

app.post("/upload",upload.single('myFile'),(req,res,next)=>{
  //ovo ok sa file
  var img= fs.readFileSync(req.file.path);
  var encode_image = img.toString('base64');
  
  fs.writeFile("out.png",encode_image,'base64', function(err){
   console.log("Error: " + err);
  });
  
    Tesseract.recognize(__dirname+"/out.png")
      .progress(function  (p) {  })
      .catch(err => console.error(err))
      .then(function (result) {
        var text=result.text;
        console.log("Recognized text:");
        console.log(text);
        var data=text.split("\n");
        var price=0;
        var name=data[0].split(" ")[0];
        var datum= text.match(/([0-3]?\d(\s|\.|\s){1})([01]?\d(\s|\.|\s){1})([12]{1}\d{3}\.?)/g);
        var total = text.match(/^.*(?:ukup|ukupno).*/igm);
        var price= "";
        var allPrices = text.match(/\d+(\.|\s)\d{2}(\s|\n)/igm);
        if(total!=null){
          total=total[0];
          price=total.match(/\d+(\.|\s)\d{2}/igm);
          if(price!=null){
          price=price[0].replace(" ",".");
          }
          else{
            var prices=[];
            for(var i=0; i<allPrices.length;i++){
              var onePrice=allPrices[i].replace("\n","").replace(" ",".");
              prices.push(parseFloat(onePrice));
            } 
            price=Math.max(prices);
          }
        }
      var date= correctDateInput(datum);
      data = name+","+date+","+price;
      console.log("sending response");
      res.send(data);
    })
  });



function correctDateInput(date){
  if(date!=null){
    date=date[0].split(".");
    date=date[2]+"-"+date[1]+"-"+date[0];
  }
  else{
    date=autoDate;
    date=date.split("/");
    date=date[2]+"-"+date[1]+"-"+date[0];
  }
  return date;
}
var server = app.listen(4000, function(){
  console.log('Server listening on port 4000');
});