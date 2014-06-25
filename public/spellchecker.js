var SpellChecker={};
SpellChecker.URL='http://spellfoo2013.herokuapp.com/';
SpellChecker.overrides={
  cant: 80,
  i: 80,
  cafe: 20,
  Japan: 10,
};
SpellChecker.tokenize=function(buf){
  var match_word_normal = /^[a-zA-Z0-9]['a-zA-Z0-9]*/
  var match_word_squote = /^[a-zA-Z0-9]['a-zA-Z0-9]*[a-zA-Z0-9]|^[a-zA-Z0-9]+/
  var match_quote = /^['"]/
  var match_else = /^[^a-zA-Z0-9'"]+/
  var tokens = [];
  var squote = false;
  while(buf){
    var match, type;
    var match_word = squote ? match_word_squote : match_word_normal
    if(match=buf.match(match_word)){
      type='word'
    }else if(match=buf.match(match_else)){
      type='else'
    }else if(match=buf.match(match_quote)){
      type='quote'
      if(buf[0]=="'")squote=!squote;
    }
    var text = match[0];
    buf = buf.substring(text.length);
    tokens.push({text: text, type: type});
  }
  return tokens;
}

SpellChecker.syntaxCheck=function(tokens){
  if(tokens.length&&tokens[tokens.length-1].type!='else'){
    tokens.push({text: ' ', type: 'else'});
  }
  for(var i=0;i<tokens.length;i++){
    var token = tokens[i];
    SpellChecker.tokenChecker[token.type](token, tokens[i-1],tokens[i+1]);
  }
}
SpellChecker.tokenChecker={
  word:function(token, prev){
    var uncapitalized = token.text.match(/^[a-z]/)
    var capitalized = token.text.match(/^[A-Z]/)
    var firstsentence = !prev;
    var quoteword = prev&&prev.type=='quote';
    var bracketword = prev&&prev.text.match(/[\(\[\{]/);
    var aftersentence = prev&&prev.text.match(/[.!?]/)
    if(firstsentence || quoteword || aftersentence || bracketword){
      if(!quoteword&&!bracketword)token.error = uncapitalized&&true;
      token.capitalized = capitalized&&true;
    }
  },
  quote:function(){},
  else:function(token, prev, next){
    if(token.text.match(/[ \t]{2}/))token.error=true;
    if(token.text.match(/[.,!?]$/)&&next&&next.type=='word'&&!next.text.match(/^[0-9]/))token.error=true;
    if(token.text.match(/[ \t\n][.,!?]/))token.error=true;
    if(!next&&!token.text.match(/[.!?]/))token.error=true;
  }
}

SpellChecker.words=function(text){
  var hash={};
  var words=[], tokens=SpellChecker.tokenize(text);
  for(var i=0;i<tokens.length;i++){
    if(tokens[i].type!='word')continue;
    var word=tokens[i].text;
    if(hash['#'+word])continue;
    hash['#'+word]=1;
    words.push(word)
  }
  return words;
}
SpellChecker.text=function(el, text, rank){
  var span=document.createElement('span');
  var color=(
    rank==100?'red':
    rank>=80?'orange':
    rank>=50?'yellow':
    null
  );
  if(color){
    span.style.padding='0 2px';
    span.style.marginLeft='1px';
    span.style.background=color;
  }
  var escaped=(span.textContent=text,span.innerHTML.replace(/\n/g,'<br>\n'));
  span.innerHTML=escaped.charAt(0)+escaped.substr(1).replace(/ /g,'&nbsp;');
  el.appendChild(span);
  return color;
}

SpellChecker.createElement=function(data, text){
  var dict={};
  for(var i=0;i<data.length;i++){
    dict[data[i].word]=data[i]
  }
  for(var word in SpellChecker.overrides){
    var rank = SpellChecker.overrides[word];
    dict[word] = {word: word, rank: rank};
  }
  console.log(dict)
  var tokens=SpellChecker.tokenize(text);
  SpellChecker.syntaxCheck(tokens);
  var el=document.createElement('div');
  for(var i=0;i<tokens.length;i++){
    var token=tokens[i];
    var rank=token.error?100:0;
    if(token.type=='word'){
      var data=dict[token.text];
      rank=data.rank;
      if(token.capitalized&&data.downcase<rank&&token.text.match(/^[A-Z][a-z0-9']*$/))rank=data.downcase
      if(rank==100&&(data.downcase<100||data.upcase<100))rank=90;
    }
    if(token.text.match(/[^\r\n\t\x20-\x7f]+/))rank=100;
    if(SpellChecker.text(el, token.text, token.error?100:rank)){
      el.className='error'
    }
  }
  return el;
}

SpellChecker.check=function(text, callback){
  var http = new XMLHttpRequest();
  http.open('POST', SpellChecker.URL, true);
  http.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
  var words = SpellChecker.words(text);
  http.send('q='+encodeURIComponent(JSON.stringify(words)));
  http.onreadystatechange=function(){
    if(http.readyState!=4)return;
    var data=http.responseText;
    if(data)callback(JSON.parse(data), text);
  }
  return http;
}

SpellChecker.Loader=function(callback){
  var http=null;
  var text=null;
  var timer=null;
  function cb(data, text){
    http=null;
    callback(data, text);
  }
  this.update=function(txt){
    if(text==txt)return false;
    text=txt;
    if(timer){clearTimeout(timer);timer=null;}
    if(http){http.abort();http=null;}
    console.log('update');
    timer=setTimeout(
      function(){
        console.log('timer');
        http=SpellChecker.check(text, cb);
        timer=null;
      }, 500
    );
    return true;
  }
}

