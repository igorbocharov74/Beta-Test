var dataDir = 'F:\\GitHub\\Beta-Test\\Data';
var resultsDir = 'F:\\GitHub\\Beta-Test\\Results';

var express = require('express');
var app = express();

var fs = require("fs");
var fName = '';

var path = require('path')

var bodyParser = require('body-parser');
app.use( bodyParser.json() );

var jsonfile = require('jsonfile');
jsonfile.spaces = 4

app.use(function(request, response, next) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/api/list', function (request, response) {
    fs.readFile( dataDir + "\\" + "quiz-list.json", 'utf8', function (err, data) {
        response.setHeader("Content-Type", "application/json");
        console.log(data);
        response.send(data);
    });
});

app.get('/api/quiz/:quizId', function (request, response) {
    var fileString = fs.readFileSync( dataDir + "\\" + "quiz-list.json", 'utf8');
    var quizList = JSON.parse(fileString);
    fName = quizList.quiz[request.params.quizId - 1].fileName;

    var responseString = fs.readFileSync( dataDir + "\\" + fName, 'utf8');

    response.setHeader("Content-Type", "application/json");
    response.send(responseString);
});

app.post('/api/result', function(request, response) {
    var data = request.body;
    var file = path.join(resultsDir, data.name + '_' + data.settings.id + '.json');

    if (!fs.existsSync(resultsDir)){
        fs.mkdirSync(resultsDir);
    }
    jsonfile.writeFileSync(file, data);
    response.send();
});

var server = app.listen(8081);
