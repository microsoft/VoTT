const net = require('net');
const port = process.env.PORT ? (process.env.PORT - 100) : 3000;

process.env.ELECTRON_START_URL = `http://localhost:${port}`;

const client = new net.Socket();

let startedElectron = false;
const tryConnection = () => client.connect({ port: port }, () => {
    client.end();
    if (!startedElectron) {
        console.log('starting electron');
        startedElectron = true;
        const exec = require('child_process').exec;
        const electron = exec('npm run electron:run:dev', (error, stdout, stderr) => {
            console.log('Electron Process Terminated');
        });

        electron.stdout.on("data", (data) => {
            console.log(data);
        });

        electron.on("message", (message, sendHandle) => {
            console.log(message);
        });

        electron.on("error", (err) => {
            console.log(err);
        });

        electron.on("exit", (code, signal) => {
            console.log(`Exit-Code: ${code}`);
            console.log(`Exit-Signal: ${signal}`);
        });

        electron.on("close", (code, signal) => {
            console.log(`Close-Code: ${code}`);
            console.log(`Close-Signal: ${signal}`);
        });

        electron.on("disconnect", () => {
            console.log('Electron Process Disconnect')
        });
    }
}
);

tryConnection();

client.on('error', (error) => {
    setTimeout(tryConnection, 1000);
});