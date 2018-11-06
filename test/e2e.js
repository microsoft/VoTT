var Application = require('spectron').Application
var assert = require('assert')
const electronPath = require('electron')
const path = require('path')

var app = new Application({
    path: electronPath,
    args: [path.join(__dirname, '..')]
})

app.start().then(function () {
    // Check if the window is visible
    return app.browserWindow.isVisible()
  }).then(function (isVisible) {
    // Verify the window is visible
    assert.equal(isVisible, true)
  }).then(function () {
    // Get the window's title
    return app.client.getTitle()
  }).then(function (title) {
    // Verify the window's title
    assert.equal(title, 'Visual Object Tagging Tool')
  }).then(function () {
    // Stop the application
    return app.stop()
  }).catch(function (error) {
    // Log any failures
    console.error('Test failed', error.message)
  })