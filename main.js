//https://stackoverflow.com/questions/22062115/nodejs-how-to-send-a-file-via-request-post
// Modules to control application life and create native browser window

/**
 * gerar exe
 * npx electron-packager ./  --platform=win32 --arch=x62
 * npx electron-packager ./  --platform=win32 --arch=ia32
 * */

const {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    Menu,
    Tray,
    Notification
} = require('electron')
const path = require('path')
const buffer = require('buffer').Buffer;
const http = require('http');
const dirTree = require("directory-tree");
const glob = require("glob");
const fs = require("fs");
const xml2js = require('xml2js');
const util = require('util')


const database = require('./db');
const Produto = require('./Models/produto');
const UploadedFile = require('./Models/uploadedFile');
const XML = require('./func/XML');
const TOKEN = require('./func/TOKEN');
const CONFIGMODEL = require('./func/CONFIG');
const DATE = require('./func/DATE');

const gotTheLock = app.requestSingleInstanceLock();

if (gotTheLock) {

    /*(async () => {
        var r = XML.isValid( path.join(__dirname, 'xmls/51220509573174000118650010001251801672015444.xml') );
        if(r)
            await XML.saveAsSent(path.join(__dirname, 'xmls/51220509573174000118650010001251801672015444.xml'));
    })();*/


    /*try {
        //const resultado = await database.sync({ alter: true });
        //const resultado = await database.sync();

        try {
            //const resultado = await database.sync();
            //console.log(resultado);

            const resultadoCreate = await Produto.create({
                nome: 'Monitor',
                preco: 1500.99,
                descricao: 'Um belo de um monitor'
            })
            console.log(resultadoCreate);
        } catch (error) {
            console.log(error);
        }

    } catch (error) {
        console.log(error);
    }
    */


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
    let mainWindow;
    let hostname = 'xml.webgestores.com.br';
    let url_api = 'http://' + hostname + '/api/';

    function getDateBr(d, s) {
        s = s ? s : '/';
        if (d)
            var df = new Date(d);
        else
            var df = new Date();

        return ((df.getDate() + "").padStart(2, '0')) + s + (((df.getMonth() + 1) + "").padStart(2, '0')) + s + (df.getFullYear()) + " " + ((df.getHours() + "").padStart(2, '0')) +
            ":" + ((df.getMinutes() + "").padStart(2, '0'));
    }

    var isQuiting = false;

    function createWindow() {
        // Create the browser window.
        mainWindow = new BrowserWindow({
            width: 700,
            height: 600,
            icon: __dirname + './assets/tray_icon1.png',
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: true,
                //enableRemoteModule: false,
                contextIsolation: false,
                //sandbox: true,
            },
            resizable: false,
            autoHideMenuBar: true,
            show: false
        });

        mainWindow.on('minimize', function (event) {
            event.preventDefault();
            mainWindow.hide();
        });

        mainWindow.on('close', function (evt) {
            if (!isQuiting) {
                evt.preventDefault();
                mainWindow.hide();
            }
            isQuiting = false;
        });

        //mainWindow.webContents.openDevTools();
        mainWindow.loadFile('index.html')

        mainWindow.on('closed', function () {
            mainWindow = null
        })
    }

//var getDirectories = function(src, callback) {
    //glob(src + '/**/*', callback);
//};

    var FormData = require('form-data');
    var request = require('request');

    const axios = require('axios');

    async function getUser() {
        try {
            var response = await axios.post(url_api + 'auth', {
                login_user: CONFIG.login, password_user: CONFIG.password
            });
            USER = response.data;
        } catch (error) {
            //console.log(error.response);
        }

    }

    async function upload(filepath, url) { //cb(error)
        var token = await TOKEN.get();
        var form = new FormData();
        var r = false;
        form.append('files', fs.createReadStream(filepath));
        await axios.post(url, form, {
            headers: {
                'Id-Enterprise': CONFIG.id_enterprise,
                'Authorization': 'Bearer ' + token,
                ...form.getHeaders()
            }
        }).then(function () {
            r = true;
            //console.log('SUCCESS!!');
        })
            .catch(function (error) {
                console.log('ERROR!!');
                console.log(error.response.data);
            });
        return r;
    }

    var lastUpdate;

    function syncfiles() {
        //var fs = require('fs');

        if (CONFIG.lastUpdate && !lastUpdate)
            lastUpdate = CONFIG.lastUpdate;
        else if (!lastUpdate)
            lastUpdate = '1970/01/01 00:00';
        //console.log(lastUpdate);
        var d = new Date();
        var nextUpdate =
            (d.getFullYear()) +
            "/" + (((d.getMonth() + 1) + "").padStart(2, '0')) +
            "/" + ((d.getDate() + "").padStart(2, '0')) +
            " " + ((d.getHours() + "").padStart(2, '0')) +
            ":" + ((d.getMinutes() + "").padStart(2, '0'));

        var dir_uploaded_files = 'uploaded_files';
        if (!fs.existsSync(dir_uploaded_files)) {
            fs.mkdirSync(dir_uploaded_files);
        }


        getDirectories(CONFIG.paths, function (err, files) {
            files.sort(function (a, b) {
                return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
            });

            if (err) {
                //console.log('Error', err);
            } else {
                (async () => {
                    var count = 0;
                    for (const file of files) {
                        if (!fs.lstatSync(file).isDirectory()) {
                            var isValid = await XML.isValid(file, CONFIG.upload_after_AAMM);

                            var exist = false;
                            if (isValid)
                                var exist = await XML.exists(file);

                            if (isValid && !exist) {
                                count++;
                                var r_upload = await upload(file, url_api + "enterprises/" + CONFIG.id_enterprise + "/upload");
                                if (r_upload) {
                                    var xml = await XML.saveAsSent(file);
                                    console.log(count + ' enviado :', file);
                                }
                            } else {
                                //console.log('já enviado : ['+file+']');
                            }


                            //upload(file,url_api+"enterprises/"+CONFIG.id_enterprise+"/upload");
                            /*
                            var timestamp = fs.statSync(file).mtime.getTime() ;
                            var df = new Date(timestamp);

                            var date =
                                ( df.getFullYear() ) +
                                "/"+( ((df.getMonth()+1)+"").padStart(2, '0') )+
                                "/"+( (df.getDate()+"").padStart(2, '0') )+
                                " "+( (df.getHours()+"").padStart(2, '0') )+
                                ":"+( (df.getMinutes()+"").padStart(2, '0') );

                            if(!lastUpdate || date >= lastUpdate){

                                console.log(lastUpdate+': enviando arquivo ...');
                                console.log(file);

                                upload(file,url_api+"enterprises/"+CONFIG.id_enterprise+"/upload");
                            }
                            */
                        }
                    }
                    lastUpdate = nextUpdate;
                    setTimeout(function () {
                        //console.log('Update after: >= '+lastUpdate);
                        syncfiles();
                    }, (1000 * 5));
                })();
            }
        });


        try {
            CONFIG.lastUpdate = lastUpdate;

            var bFile = buffer.from(JSON.stringify(CONFIG), 'utf8');
            var base64d = bFile.toString('base64');
            fs.writeFileSync(pathConfig, base64d, 'utf-8');

            mainWindow.webContents.send('main/sendLastUpdate', {
                status: 200,
                lastUpdate: lastUpdate
            });

        } catch (e) {
            console.log(e);
        }

    }

    let tray = null;
    var CONFIG = null;
    app.whenReady().then(() => {

        tray = new Tray(path.join(__dirname, './assets/tray_icon1.png'))
        var contextMenu = Menu.buildFromTemplate([{
            label: 'Ver configurações',
            click: function () {
                mainWindow.show();
            }
        },
            {
                label: 'Fechar',
                click: function () {
                    isQuiting = true;
                    app.isQuiting = true;
                    app.quit();
                }
            }
        ]);
        tray.setToolTip('Brajan sync')
        tray.setContextMenu(contextMenu)


        if (fs.existsSync(pathConfig)) {
            var aux_c = fs.readFileSync(pathConfig, 'utf8');
            try {
                CONFIG = JSON.parse(Buffer.from(aux_c.toString(), 'base64').toString('ascii'));
            } catch ($e) {
                CONFIG = {};
            }

            mainWindow.webContents.on('did-finish-load', function () {
                mainWindow.webContents.send('main/sendConfig', {
                    status: 200,
                    msg: CONFIG
                });
            });

            (async () => {
                upload_after_AAMM = await CONFIGMODEL.get('upload_after_AAMM');
                if (!upload_after_AAMM) {
                    var n = new Date();
                    await CONFIGMODEL.set('upload_after_AAMM', DATE.prevMonth());
                    upload_after_AAMM = await CONFIGMODEL.get('upload_after_AAMM');
                }
                CONFIG.upload_after_AAMM = upload_after_AAMM;
                CONFIG.url_api = url_api;
                TOKEN.config = CONFIG;
                syncfiles();
            })();


        } else {
            //let bufferFile = buffer.from('{"login":"jheizer","password":"37632044"}', 'utf8');
            //let base64data = bufferFile.toString('base64');
            //fs.writeFileSync('config.txt', base64data, 'utf-8');
            mainWindow.show();
        }
    })

    app.on('ready', createWindow)
    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') app.quit()
    })

    app.on('activate', function () {
        if (mainWindow === null) createWindow()
    })


    function getEnterprises(event) {
        const options = {
            hostname: hostname,
            path: '/api/users/' + USER.user.id_user + '/enterprises',
            port: '80',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + USER.token
            }
        }

        const req = http.request(options, (res) => {
            if (res.statusCode) {
                res.on('data', (d) => {
                    event.reply('main/sendEnterprises', {
                        status: 200,
                        msg: JSON.parse(d)
                    });
                });
            }
        })
        req.on('error', (error) => {
            console.log(error);
            event.reply('main/sendEnterprises', {
                status: 200,
                msg: [],
                error: error
            });
        })
        req.end()
    }

    ipcMain.on('logar', async (event, arg) => {
        const data = JSON.stringify(arg);
        const options = {
            hostname: hostname,
            path: '/api/auth',
            port: '80',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }
        const req = http.request(options, (res) => {
            if (res.statusCode == 200) {
                res.on('data', (d) => {
                    USER = JSON.parse(d);
                    getEnterprises(event);
                })
            } else {
                event.reply('main/sendEnterprises', {
                    status: 200,
                    msg: [],
                    error: 'login_invalid'
                });
            }
        })
        req.on('error', (error) => {
            console.error(error)
        })
        req.write(data)
        req.end()
    })

    ipcMain.on('hideMainWindow', async (event, arg) => {
        mainWindow.hide();
    });

    ipcMain.on('saveConfig', async (event, arg) => {
        let bufferFile = buffer.from(arg.json, 'utf8');
        let base64data = bufferFile.toString('base64');
        try {
            fs.writeFileSync(pathConfig, base64data, 'utf-8');
            event.reply('main/resSaveConfig', {
                status: 'success'
            });
            CONFIG = JSON.parse(arg.json);
            lastUpdate = CONFIG.lastUpdate;

            (async () => {
                upload_after_AAMM = await CONFIGMODEL.get('upload_after_AAMM');
                if (!upload_after_AAMM) {
                    var n = new Date();
                    await CONFIGMODEL.set('upload_after_AAMM', DATE.prevMonth());
                    upload_after_AAMM = await CONFIGMODEL.get('upload_after_AAMM');
                }
                CONFIG.upload_after_AAMM = upload_after_AAMM;
                CONFIG.url_api = url_api;
                TOKEN.config = CONFIG;
                console.log(CONFIG);
                syncfiles();
            })();

        } catch (e) {
            event.reply('main/resSaveConfig', {
                status: 'error'
            });
        }
    });


    /* RECEBE AÇÃO DO BOTÃO PARA SELECIOAR E LER PASTA */

    var getDirectories = function (arr_src, callback) {

        var files = [];
        var extract = function (arr) {
            for (item of arr) {
                if (!item.children)
                    files.push(item.path);
                else {
                    extract(item.children);
                }
            }
        }
        for (folder of arr_src) {
            var tree = dirTree(folder);
            extract(tree.children);
        }

        callback(null, files);

        //for(const src of arr_src) {
        //glob(src + '/**/*', callback);
        //}

    };

    ipcMain.on('select-dirs', async (event, arg) => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        })

        if (result.filePaths[0])
            event.reply('main/sendPath', {
                status: 200,
                msg: result.filePaths[0]
            });

        /*getDirectories(result.filePaths[0], function (err, files) {
          if (err) {
            console.log('Error', err);
          } else {
            var filePaths = [] ;
            for(const file of files) {
              if(!fs.lstatSync(file).isDirectory()){
                 filePaths.push(file);
              }
            }
            event.reply('main/sendfilePaths', { status: 200, msg: filePaths })
          }
        });*/
    })
    /* END */


    //let bufferFile = buffer.from('{"login":"jheizer","password":"37632044"}', 'utf8');
    //let base64data = bufferFile.toString('base64');
    //console.log(base64data);
    let pathConfig = path.join(__dirname, 'config.txt')


    //try { fs.writeFileSync('config.text', '{"login":"jheizer","password":"37632044"}', 'utf-8'); }
    //catch(e) { console.log('Failed to save the file !'); }
} else {
    app.exit();

}
