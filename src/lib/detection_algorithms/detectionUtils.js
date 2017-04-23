//fisherYates http://stackoverflow.com/questions/2380019/generate-unique-random-numbers-between-1-and-100 
module.exports.generateTestIndecies = function(percent, taggedFramesCount) {
    var splitSize = taggedFramesCount - 1 - Math.ceil(percent * taggedFramesCount),
        testIndecies = [];
    //range call http://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-an-array-based-on-suppl
    taggedFrameIndecies = Array.apply(null, Array(taggedFramesCount)).map(function (_, i) {return i;});
    for (i = taggedFramesCount-1; i > splitSize; i--){
        var t = taggedFrameIndecies[i];
        var r = Math.floor(Math.random() * i);
        testIndecies.push(r);
        taggedFrameIndecies[r] = t;
    }
    return testIndecies;
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
