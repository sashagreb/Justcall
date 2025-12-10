let username = null;
let localStream;
let peers = {};
const localVideo = document.getElementById('localVideo');
const videosContainer = document.getElementById('videos');
const ws = new WebSocket("wss://YOUR-SERVER.onrender.com");

function loginUser(){
    username = document.getElementById('login-name').value;
    if(!username) return;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('container').classList.remove('hidden');
    ws.send(JSON.stringify({type:'join', user:username}));
}

let currentChannel = 'general';
ws.onmessage = async msg=>{
    const data = JSON.parse(msg.data);
    if(data.type==='message') displayMessage(data.user,data.text);
    if(data.type==='offer') handleOffer(data.from,data.sdp);
    if(data.type==='answer') handleAnswer(data.from,data.sdp);
    if(data.type==='candidate') peers[data.from]?.addIceCandidate(new RTCIceCandidate(data.candidate));
};

function sendMessage(){
    const input = document.getElementById('msg');
    ws.send(JSON.stringify({type:'message', channel:currentChannel, text:input.value, user:username}));
    input.value='';
}

function displayMessage(user,text){
    const msgBox = document.getElementById('messages');
    msgBox.innerHTML += `<div class='msg'><b>${user}:</b> ${text}</div>`;
}

function joinChannel(channel){
    currentChannel = channel;
    document.getElementById('messages').innerHTML='';
}
function setTheme(t){document.body.className='theme-'+t;}
function adminBan(){alert('Ban user (demo)');}
function adminKick(){alert('Kick user (demo)');}
function adminMute(){alert('Mute user (demo)');}

async function startCall(){
    localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    localVideo.srcObject = localStream;
    ws.send(JSON.stringify({type:'joinCall', user:username}));
}
function leaveCall(){
    localStream.getTracks().forEach(t=>t.stop());
    for(let id in peers) peers[id].close();
    peers={};
    document.querySelectorAll('#videos video').forEach(v=>v!==localVideo?v.remove():null);
}
function createPeerConnection(userId){
    const pc = new RTCPeerConnection();
    peers[userId]=pc;
    localStream.getTracks().forEach(track=>pc.addTrack(track,localStream));
    pc.ontrack = e=>{
        const remoteVideo = document.createElement('video');
        remoteVideo.autoplay=true;
        remoteVideo.srcObject = e.streams[0];
        videosContainer.appendChild(remoteVideo);
    };
    pc.onicecandidate=e=>{if(e.candidate) ws.send(JSON.stringify({type:'candidate',to:userId,candidate:e.candidate}));};
    return pc;
}
async function handleOffer(from,sdp){
    const pc = createPeerConnection(from);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({type:'answer',to:from,sdp:pc.localDescription}));
}
async function handleAnswer(from,sdp){await peers[from].setRemoteDescription(new RTCSessionDescription(sdp));}
