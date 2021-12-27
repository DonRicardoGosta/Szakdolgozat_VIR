const mongoose = require('mongoose');
const util = require('util');
const encoder = new util.TextEncoder('utf-8');
const startupDebugger = require('debug')('app:startup');
const dbDebugger = require('debug')('app:db');
const config = require('config');
const morgan = require('morgan');
const helmet = require('helmet');
const logger = require('./app/control/middleware/logger');
const pms_api = require('./app/control/roots/api/project_management');
const magori = require('./app/control/roots/magori');
const home = require('./app/control/roots/home');
const express = require('express');
const app =  express();

if(!config.get('jwtPrivateKey')){
    console.error('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

app.set('views', './app/views');
app.set('view engine', 'pug');

mongoose.connect('mongodb://localhost:27017/vir_szakdolgozat')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...',err))

app.use(express.json());
app.use('/static', express.static('./app/views/static'));
app.use(helmet());
app.use('/api/projects', pms_api);
app.use('/magori', magori)
app.use('/', home);

console.log('Application Name: '+config.get('name'));
console.log('Mail Server: '+config.get('mail.host'));
console.log('Mail Password: '+config.get('mail.password'));

if(app.get('env')==='production'){
    const cors = require('cors');
    const https = require('https');
    const http = require('http');
    const fs = require('fs');
    app.use(cors());
    const httpServer = http.createServer(app);
    const httpsServer = https.createServer({
        key: fs.readFileSync('../../etc/letsencrypt/live/metalcoding.eu/privkey.pem'),
        cert: fs.readFileSync('../../etc/letsencrypt/live/metalcoding.eu/fullchain.pem'),
    }, app);
    httpServer.listen(80, () => {
        console.log('HTTP Server running on port 80');
    });

    httpsServer.listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
}
else if(app.get('env')==='development'){
    app.use(morgan('tiny'));//kiírja a (defaultként)console-ra hogy milyen requestek történtek és hogy milyen státuszkóddal végződtek
    startupDebugger('Morgan enabled...');
    port = 3000;
    app.listen(port, ()=> console.log(`Listening in port ${port}...`));
}