class spectronHelper{
    initializeSpectron() {
        var Application = require('spectron').Application
        const electronPath = require('electron')
        const path = require('path')
    
        return new Application({
            path: electronPath,
            args: [path.join(__dirname, '../..')]
        })
    }
}
module.exports = new spectronHelper()