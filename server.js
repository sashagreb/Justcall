const WebSocket = require('ws');
const wss = new WebSocket.Server({ port:3000 });
let clients = {};

wss.on('connection', ws=>{
    ws.on('message', msg=>{
        const data = JSON.parse(msg);
        if(data.type==='join') { ws.id=data.user; clients[ws.id]=ws; }
        if(['message','offer','answer','candidate','joinCall'].includes(data.type)){
            for(let id in clients){ if(clients[id]!==ws) clients[id].send(JSON.stringify({...data, from:ws.id})); }
        }
    });
    ws.on('close',()=>{delete clients[ws.id];});
});