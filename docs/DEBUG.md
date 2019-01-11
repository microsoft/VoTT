# Debugging Guide  
## Electron Process  
TODO: create a vscode launch.json configuration that attaches to the elctron process. https://stackoverflow.com/a/41073851   

## Renderer Process  
1. Start app: `npm run start`.  
2. Open Chrome Dev Tools: `F12` in browser, `Ctrl + Shift + I` in electron.  
3. Open `Sources` tab.  
4. `Ctrl + Shift + F` and search for the file/function/code you would like to break into.  
5. Place breakpoint.  
6. Trigger breakpoint.  
> Note: Reloading the page may be required if the code executes at startup.  

## Unit Tests  
1. Download & install `Jest` VSCode plugin.  
2. Open the test's source file.  
3. A `Debug` button should appear above every test. Place breakpoints, and click debug.  
> Note: Restarting VSCode may be required.  
