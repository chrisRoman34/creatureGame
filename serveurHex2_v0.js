const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server);
server.listen(8888, () => {console.log('Le serveur écoute sur le port 8888');});
let listJoueurs = [];
let couleur;
const nbJoueurs = 2;

app.get('/', (request, response) => {
    response.sendFile('clientHex2_v0.html', {root: __dirname});
});

io.on('connection', (socket) => {
    socket.on('demandeEntre', data => {
        if(listJoueurs.length<nbJoueurs){
            listJoueurs.push(data);
            io.emit('entre',listJoueurs);
            if(listJoueurs.length==2){
                io.emit('map');
            }
        }
        else{socket.emit('echec','echec de connection');}
    });

    socket.on("clic",data=>{
        x=data[0];y=data[1];
        ligne=Math.floor((y-84)/41)+1;
        colone=Math.floor(((x-20)-25*(ligne-1))/50)+1;
        if(data[2]==listJoueurs[0]){
            couleur="blue";
        }
        else{couleur="red";}
        caseSelect=[colone,ligne];
        centre=[colone*50-5,ligne*41+84,ligne,colone,couleur];
        io.emit('case',centre);
        console.log("Position x :",centre[0]," y ",centre[1],"[",caseSelect[0],"'",caseSelect[1],"]");
    })
    socket.on('demandeSortie', data => {
        for(let i=0;i<listJoueurs.length;i++){
            if(data==listJoueurs[i]){listJoueurs.splice(i,1);}
        }
    });
});


