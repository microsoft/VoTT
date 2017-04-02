//random set http://stackoverflow.com/questions/2380019/generate-unique-random-numbers-between-1-and-100 there has to be a set way of doing this
module.exports.generateTestIndecies = function(percent, taggedFramesCount, cb) {
    var testIndecies = [];
    while(testIndecies.length < Math.ceil(percent * taggedFramesCount)){
        var randomnumber = Math.ceil(Math.random() * taggedFramesCount)
        if(testIndecies.indexOf(randomnumber) > -1) continue;
        testIndecies[testIndecies.length] = randomnumber;
    }
    cb(null, testIndecies);
}
// http://stackoverflow.com/questions/21194934/node-how-to-create-a-directory-if-doesnt-exist
module.exports.ensureDirExists = function(path, cb) {
    fs.mkdir(path, 0777, (err) => {
        if (err) {
            if (err.code == 'EEXIST') { 
                return cb(); // ignore the error if the folder already exists
            }
            return cb(err);
        }
        cb();
    });
}
module.exports.deleteFileIfExists = function(path, cb) {
    fs.unlink(path, (err) => {
        if (err) {
            if (err.code == 'ENOENT') {
                return cb();
            }
            return cb(err);
        }
        cb();
    });
}