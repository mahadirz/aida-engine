"use strict";

var fs = require('fs');

var Train = require('./src/train');
var Brain = require('./src/brain');
var Ears = require('./src/ears');
var builtinPhrases = require('./builtins');

var Aida = {
  Brain: new Brain()
};

var customPhrasesText;
var customPhrases;
try {
  customPhrasesText = fs.readFileSync(__dirname + '/custom-phrases.json').toString();
} catch (err) {
  throw new Error('Uh oh, Aida could not find the ' +
    'custom-phrases.json file, did you move it?');
}
try {
  customPhrases = JSON.parse(customPhrasesText);
} catch (err) {
  throw new Error('Uh oh, custom-phrases.json was ' +
    'not valid JSON! Fix it, please? :)');
}

console.log('Aida is learning...');
Aida.Teach = Aida.Brain.teach.bind(Aida.Brain);
eachKey(customPhrases, Aida.Teach);
eachKey(builtinPhrases, Aida.Teach);
Aida.Brain.think();
console.log('Aida finished learning, time to listen...');


let Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});

// Add the route
server.route({
    method: 'POST',
    path:'/api/nlp',
    handler: function (request, reply) {

        console.log(request.payload);
        var message = request.payload.message;
        var response = reply().hold();
        var speech =  {
            reply : function (msg,txt) {
                console.log(txt);
                response.source = txt;
                response.send();
                return response;
            }

        };

        var interpretation = Aida.Brain.interpret(message);
        console.log('Aida heard: ' + message.text);
        console.log('Aida interpretation: ', interpretation);
        if (interpretation.guess) {
            console.log('Invoking skill: ' + interpretation.guess);
            Aida.Brain.invoke(interpretation.guess, interpretation, speech, message);
            console.log("After invoking");
        } else {
            console.log( 'Hmm... I don\'t have not learn about about this!... I\'ll save it and try to learn about it later.');
            speech.reply('', 'Hmm... I don\'t have not learn about about this!... I\'ll save it and try to learn about it later.');
            // speech.reply(message, '```\n' + JSON.stringify(interpretation) + '\n```');

            // append.write [message.text] ---> to a file
            fs.appendFile('phrase-errors.txt', '\nChannel: ' + message.channel + ' User:'+ message.user + ' - ' + message.text, function (err) {
                console.log('\n\tBrain Err: Appending phrase for review\n\t\t' + message.text + '\n');
            });
        }
    }
});

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});



function eachKey(object, callback) {
  Object.keys(object).forEach(function(key) {
    callback(key, object[key]);
  });
}
