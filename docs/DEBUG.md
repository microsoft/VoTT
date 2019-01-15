# Debugging Guide  
## Electron Process  
TODO: create a vscode launch.json configuration that attaches to the elctron process. https://stackoverflow.com/a/41073851   

## Renderer Process  
### Chrome Debugger  
1. Start app: `npm run start`.  
2. Open Chrome Dev Tools: `F12` in browser, `Ctrl + Shift + I` in electron.  
3. Open `Sources` tab.  
4. `Ctrl + Shift + F` and search for the file/function/code you would like to break into.  
5. Place breakpoint.  
6. Trigger breakpoint.  
> Note: Reloading the page may be required if the code executes at startup.  

### VSCode Debugger  
1. Download & install the `Debugger for Chrome` VSCode plugin.  
2. Start app: `npm run start`.  
3. `F5`  
4. Select `Chrome`  
5. Change `http://localhost:8080` to `http://localhost:3000`  
6. `F5`  
7. Chrome should startup pointed at the app running at `http://localhost:3000`, and breakpoints in VSCode should work as expected.  

## Unit Tests  
### Happy Path
1. Download & install the `Jest` VSCode plugin.  
2. Open the test's source file.  
3. A `Debug` button should appear above every test. Place breakpoints, and click debug.  
> Note: If this button does not appear, here are some troubleshooting steps...  
> 1. `Ctrl + Shift + P` and select `Jest: Start Runner`.  
> 2. Restarting VSCode.  

### Alternate Proof  
1. Download & install the `Jest` VSCode plugin.  
2. Open the test's source file.  
3. Place breakpoints.  
4. Go to the Debug view, select the `Jest All` configuration.  
5. `F5` or press the green play button.  
6. Your breakpoint should now be hit.  
