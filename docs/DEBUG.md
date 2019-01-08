# Debugging Guide  
## FAQ  
### My Electron Process Isn't Starting...  
If you're seeing the output `electron.1 Exited Successfully` when running via `npm run start`, and the electron process is failing to startup, this is because you're hitting a typescript compiler error. Running `tsc` within the root directory will compile the project and show the errors.  
