var express = require('express');
var router = express.Router();
var fs = require('fs');
var es = require('event-stream');
var os = require('os');
var unzipper = require('unzipper');
var mysql = require('mysql');
const path = require('path');

var con = mysql.createConnection({
    host: "db4free.net",
    port: 3306,
    user: "hima123",
    password: "Qwer1234$",
    database: "testingprod"
  });

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

var pivotData = {};

router.get('/test2', (req, res) => {
    res.render('upload');
});

router.use('/test', (req, res) => {
    console.log('Request Intercepted');

    var multiparty = require('multiparty');
    var form = new multiparty.Form();
    
    form.parse(req, function(err, fields, files) {  
        var imgArray = files.ufile;

        for (var i = 0; i < imgArray.length; i++) {
            var newPathold = './public/uploads/';
            var singleImg = imgArray[i];
            var newPath = newPathold + singleImg.originalFilename;
            readAndWriteFile(singleImg, newPath, (status) => {
                fs.createReadStream(newPath)
                .pipe(unzipper.Parse())
                .on('entry', function (entry) {
                    var fileName = entry.path;
                    var type = entry.type; // 'Directory' or 'File'
                    
                    if (/\/$/.test(fileName)) {
                    console.log('[DIR]', fileName, type);
                    return;
                    }

                    console.log('[FILE]', fileName, type);

                    // TODO: probably also needs the security check
                    entry.pipe(fs.createWriteStream(newPathold + fileName));
                    // NOTE: To ignore use entry.autodrain() instead of entry.pipe()
                    var common = [];
                    let count = 0;
                    console.log('file exists :::: ' + fs.existsSync(newPathold + fileName))
                    console.log('file Path ::::' + newPathold + fileName);
                    
                    setTimeout(() => {
                        res.send("File uploaded to: " + newPath);
                        var s = fs.createReadStream(newPathold + fileName)
                        .pipe(es.split())
                        .pipe(es.mapSync(function(line) {
                            //pause the readstream
                            s.pause();
                            //console.log("line:", line);
                            evaluateLineData(common, line, (res) => {
                                //console.log('line evaluated = ' + ++count);
                                s.resume();
                            });
                        })
                        .on('error', function(err) {
                            console.log('Error:', err);
                        })
                        .on('end', function() {
                            console.log('Finish reading.');

                            databaseInsertion(common, (dd) => {
                                fs.readdir(newPathold, (err, files) => {
                                    if (err) throw err;
                                  
                                    for (const file of files) {
                                      fs.unlink(path.join(newPathold, file), err => {
                                        if (err) throw err;
                                      });
                                    }
                                  });
                                  common = [];
                                  pivotData = {};
                                console.log('done everything');
                            });
                        })
                        );
                    }, 1000);
                });
            });           
        }
    });
});

function databaseInsertion(common, callback) {
    
        con.query('DELETE FROM logs');
        var sql = "INSERT INTO logs (ip, date, req_resource, code, unknown_number, referrer, user_agent) VALUES ?";
        var values = [];
        common.forEach((inner) => {
            values.push([inner.ip, inner.time, inner.requestedResource, inner.status, inner.unknownNumber, inner.referer, inner.userAgent]);
        });

        var count1 = values.length;
        var start = 0;
        var end = 50001;
        dbinsert(common, sql, values, start, end, count1, callback);
    
}

function dbinsert(common, sql, values, start, end, count1, callback) {
    console.log('getting records from ::: ' + start + ' to ' + end + ' and count = ' + count1);
    var newValues = values.slice(start, end);
    con.query(sql, [newValues], function (err, result) {
        if (err) throw err;
        console.log("Number of records inserted: " + result.affectedRows);
        if(end + 1 > count1)
        {
            callback(true);
            common = [];
            values = [];
            newValues = null;
        }
        else {
            start = end;
            end = end + 50000;
            //count1 = count1 - 1000;
            dbinsert(common, sql, values, start, end, count1, callback);
        }
    });
}

function readAndWriteFile(singleImg, newPath, callback) {
    
    fs.readFile(singleImg.path , function(err,data) {
        fs.writeFile(newPath,data, function(err) {
            if (err) console.log('ERRRRRR!! :'+err);
            console.log('Fitxer: '+singleImg.originalFilename +' - '+ newPath);
            callback(true);
        })
    })
}

function evaluateLineData(common, data, callback) {
    pivotData = {};
    if(data)
    {
        let splitted = data.split('"');
        let first = splitted[0].split(' ')[0];
        pivotData.ip = first;
        let second = splitted[0].split(' ')[3] + ' ' + splitted[0].split(' ')[4];
        pivotData.time = second;
        let third = splitted[1];
        pivotData.requestedResource = third;
        let fourth = splitted[2].split(' ')[1];
        pivotData.status = fourth;
        let fifth = splitted[2].split(' ')[2];
        pivotData.unknownNumber = fifth;
        let sixth = splitted[3];
        pivotData.referer = sixth;
        let seventh = splitted[5];
        pivotData.userAgent = seventh;
        common.push(pivotData);
        //console.log(common);
    }
    callback(true);
}

module.exports = router;