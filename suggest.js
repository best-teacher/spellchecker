var spellchecker=require('./database_scowl');
var db=spellchecker.database;

var wordcounts=[];
for(var word in db){
  if(word[0]=='#')wordcounts.push([word.substr(1), db[word]]);
}
wordcounts.sort(function(a,b){return a[0]>b[0]?1:a[0]<b[0]?-1:0});

root=[];
function add(tree,word,n){
  if(tree.length==0){
    tree.push([word,n]);
    return;
  }
  var matchlen=0;
  var last=tree[tree.length-1];
  var pword=last[0];
  while(pword[matchlen]==word[matchlen])matchlen++;
  if(matchlen==0){
    tree.push([word,n]);
    return;
  }
  var match=word.substr(0,matchlen);
  if(matchlen==pword.length){
    if(last[1].length){
      add(last[1],word.substr(matchlen),n);
    }else{
      tree[tree.length-1]=[
        match,[
          ['',last[1]],
          [word.substr(matchlen),n]
          ]
      ];
    }
  }else{
    tree[tree.length-1]=[
      match,[
        [pword.substr(matchlen), last[1]],
        [word.substr(matchlen),n]
      ]
    ]
  }
}
function find(tree,word){
  for(var i=0;i<tree.length;i++){
    var node=tree[i];
    if(node[0]>word)return null;
    if(node[0]==word){
      if(node[1].length){
        var first=node[1][0];
        if(first[0]=='')return first[1];
        else return null;
      }else return node[1];
    }
    if(word.indexOf(node[0])==0){
      if(node[1].length)return find(node[1],word.substr(node[0].length));
    }
  }
  return null;
}
for(var i=0;i<wordcounts.length;i++){
  var wordcount=wordcounts[i];
  add(root,wordcount[0],wordcount[1]);
  if(i%10000==0)console.log(i);
}
console.log('end');
console.log(find(root, 'foo'))
console.log(find(root, 'foolish'))
console.log(find(root, 'a'))
console.log(find(root, 'apple'))
console.log(find(root, 'aab'))

function check(word, match){
  if(word.length+2<match.length)return false;
  var diff=0;
  var arr=[];
  for(var i=0;i<word.length;i++)arr[i]=word[i];
  var jarr=[];
  for(var i=0;i<match.length;i++){
    for(var j=0;j<=2;j++){
      if(arr[i+j]==match[i]){
        arr[i+j]=null;
        break;
      }
      if(arr[i-j]==match[i]){
        arr[i-j]=null;
        break;
      }
    }
    if(j==3)j=1;
    diff+=j;
    if(diff/word.length>0.1)return false;
  }
  if(word==match||match.length+2<word.length)return 1;
  return 2;
}

function suggest(root, suffix, word, out){
  for(var i=0;i<root.length;i++){
    var node=root[i];
    var match=suffix+node[0];
    var result=check(word, match)
    if(result){
      if(node[1].length)suggest(node[1], match, word, out);
      else if(result==2)out.push([match, node[1], result]);
    }
  }
  return out;
}

console.log(suggest(root,'','intenratoinalizatin',[]));
console.log(suggest(root,'','cant',[]));
console.log(suggest(root,'','itnernationalization',[]));


module.exports={
  root:root,
  find: function(word){return find(root, word)},
  suggest: function(word){return suggest(root, '', word, [])}
}


/*
['e','a','i','o','u','ia','io','ie','ou','ea','oo','ee','ai','au','ae','oi','ei','eu','ua','ui','eo','oa','ue','iu','oe','iou','eae','eou','ii','uo','aa','ao','aea','eau','aeo','uou','eia','ioi','iae','uie','eio','oea','uee','aeu','aia','eei','uia','ioe','uea','eoi','ieu','uai','oui','ooi','aei','oie','oua','uu','oeo','ooe']
*/
