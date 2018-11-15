const KittiExporter = require('../main.js').Exporter;
const path = require('path');

var exporter = new KittiExporter(path.join(__dirname, 'export_test'), ['cat', 'dog', 'mouse'], 1000, 1000);

var p = exporter.init();
p.then(() => {
    var p1 = exporter.exportFrame('1.jpg', 'test_data', 
        [{class : 'dog', x1 : 300, y1 : 250, x2 : 400, y2: 500}]);
    p1.then(()=> {
        var p2 = exporter.exportFrame('2.jpg', 'test_data_2', 
        [{class : 'mouse', x1 : 600, y1 : 310, x2 : 720, y2: 492}]);
        p2.then(() => {console.info('done')}, (err) => {console.info('err', err)});
    }, (err) => {console.info('err:', err)});
}, (err) => {
    console.info('Error occured during init:', err);    
});


