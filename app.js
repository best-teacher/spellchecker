var http=require('http');
var express=require('express');
var app=express();
var HTTP_PORT=process.env.PORT||3001;
var spellchecker=require('./database_scowl');
app.use(express.bodyParser());
app.use(express.static('./public'));

function assets(path){
  if(!assets[path])assets[path]=fs.readFileSync(path);
  return assets[path];
}

app.options('/',function(req,res){
  res.header('Access-Control-Allow-Methods','*');
  res.header('Access-Control-Allow-Headers','X-Requested-With');
  res.header('Access-Control-Allow-Origin','*');
  res.end();
});

app.post('/',function(req,res){
  var str=req.body.q;
  res.header('Access-Control-Allow-Methods','*');
  res.header('Access-Control-Allow-Headers','X-Requested-With');
  res.header('Access-Control-Allow-Origin','*');
  res.end(str&&JSON.stringify(spellchecker.analize(JSON.parse(str))));
})

var server=http.createServer(app).listen(HTTP_PORT);

process.on('uncaughtException',function(err){
  console.log('Caught exception:',err.stack);
});
