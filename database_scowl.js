var fs=require('fs');
var DATABASE_DIR='./scowl/';
var files=fs.readdirSync(DATABASE_DIR);
var DB={};
var count=0;
for(var i=0;i<files.length;i++){
  var file=files[i];
  var rank=parseInt(file.match(/[0-9]+$/));
  if(!rank){
    console.log(file);
    continue;
  }
  var words=fs.readFileSync(DATABASE_DIR+file).toString().split(/\r?\n/);
  for(var j=0;j<words.length;j++){
    var key='#'+words[j];
    var prev=DB[key];
    if(!prev||rank<prev)DB[key]=rank;
  }
}

DB.find=function(word){
  return DB['#'+word];
}

var NUMBER_SUFFIX_LIST='kg/g/mg/m/cm/mm/inch'.split('/')
var NUMBER_ORDER_LIST='1st/2nd/3rd/4th/5th/6th/7th/8th/9th/0th'.split('/')
function wordRank(word){
  if(word.match(/^[0-9]+/)){
    if(word.match(/^[0-9\.]+$/))return 0;
    var suffix=word.match(/[^0-9].+$/);
    if(suffix&&NUMBER_SUFFIX_LIST.indexOf(suffix.toString())>=0)return 0;
    var order=word.match(/[0-9][^0-9].+$/);
    if(order&&NUMBER_ORDER_LIST.indexOf(order.toString())>=0)return 0;
  }
  return DB.find(word)||100;
}

module.exports={
  database: DB,
  analize: function(words){
    var ranks = [];
    for(var i=0;i<words.length;i++){
      var word = words[i];
      var rank = wordRank(word);
      var downcase = wordRank(word.toLowerCase());
      var upcase = wordRank(word.toUpperCase());
      var obj = {word: word, rank: rank};
      if(downcase < rank)obj.downcase = downcase;
      if(upcase < rank)obj.upcase = upcase;
      ranks.push(obj);
    }
    return ranks
  }
}