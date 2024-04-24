const express = require('express');
const app = express();
const http = require('http');
const { stdout } = require('process');
const { DEFAULT_ECDH_CURVE } = require('tls');
const server = http.createServer(app);
const io = new require("socket.io")(server);

server.listen(8888, ()=> {console.log('le serveur est lance seu le port 8888');});
let listJoueurs = [];
let positionTanieres=[[182,351],[782,351],[632,597],[332,105]];
let couleur = ['red','maroon','fuchsia','purple','blue','navy','lime','green'];
let nbJoueurs = 0;
let nbJoueursMax=5;
let listCouleurs=[];
let lands=['gray','aqua','chartreuse'];
let alea = Math.floor(Math.random() * 3);
let listCreatures=[];
let stats=[]
let numJoueur;
let force;
let vision;
let reprod;
let listCoupPossibles;
let newCoo;
let a;
let b;
let coo;
let newCouleur;
let partenaire=false;
let t=0;

class Creature{
    constructor(x,y,force,vision,reproduction,sexe,couleur){
        this.x=x;
        this.y=y;
        this.reproduction=reproduction;
        this.vision=vision;
        this.force=force;
        this.sexe=sexe;
        this.satiete=4;
        this.hydratation=4;
        this.couleur=couleur;
        this.fertile=false;
    }
    getX(){
        return this.x;
    }
    setX(val){
        return this.x=val;
    }
    getY(){
        return this.y;
    }
    setY(val){
        return this.y=val;
    }
    getForce(){
        return this.force;
    }
    getVision(){
        return this.vision;
    }
    getReproduction(){
        return this.reproduction;
    }
    getSexe(){
        return this.sexe;
    }
    getCouleur(){
        return this.couleur;
    }
    getSatiete(){
        return this.satiete;
    }
    setSatiete(val){
        return this.satiete=val;
    }
    getHydratation(){
        return this.hydratation;
    }
    setHydratation(val){
        return this.hydratation=val;
    }
    getFertile(){
        return this.fertile;
    }
    setFertile(val){
        return this.fertile=val;
    }
}
function creerCreature(x,y,force,vision,reproduction,sexe,couleur,numJoueur){
    let crea = new Creature(x,y,force,vision,reproduction,sexe,couleur);
    listCreatures[numJoueur-1].push(crea);
}
function tour(){
    for(let i=0;i<listCreatures.length;i++){
        for(let j=0;j<listCreatures[i].length;j++){
            if(listCreatures[i][j]){
                choix(listCreatures[i][j]);
                verifTour(i,j);
            }
        }
    }
    io.emit("tour",[nbJoueursMax,listCouleurs,listCreatures])
    t++;
    gagnant(t);
}
function verifTour(i,j){
    let creature=listCreatures[i][j];
    newCoo=coordonneesToInt(creature.getX(),creature.getY());
    if(listCouleurs[newCoo[1]][newCoo[0]]=='chartreuse'){
        creature.setSatiete(creature.getSatiete()+3);
        
    }
    if(listCouleurs[newCoo[1]][newCoo[0]]=='aqua'){
        creature.setHydratation(creature.getHydratation()+3);
    }
    if(creature.getHydratation()>6 && creature.getSatiete()>6){
        creature.setFertile(true);
    }
    if(creature.getFertile()){
        if(creature.getCouleur()=='red'||creature.getCouleur()=='maroon'){numJ=1;}
        else if(creature.getCouleur()=='fuchsia'||creature.getCouleur()=='purple'){numJ=2;}
        else if(creature.getCouleur()=='blue'||creature.getCouleur()=='navy'){numJ=3;}
        else{numJ=4;}
        if(creature.getX()==positionTanieres[numJ-1][0] && creature.getY()==positionTanieres[numJ-1][1]){  
            if(creature.getSexe()==0){
                let taille=listCreatures[i].length;
                for(let k=0;k<taille;k++){
                    if(listCreatures[i][k].getSexe()==1 && listCreatures[i][k].getX()==creature.getX() && listCreatures[i][k].getY()==listCreatures[i][j].getY()){
                        partenaire=true;
                    }
                }
                if(partenaire){
                    partenaire=false
                    creature.setFertile(false);   
                    for(let l=0;l<creature.getReproduction();l++){
                        let sexe=Math.floor(Math.random() * 2)
                        if(sexe==0){
                            newCouleur=couleur[(numJ-1)*2];
                        }
                        else{
                            newCouleur=couleur[(numJ-1)*2+1];
                        }
                        creerCreature(creature.getX(),creature.getY(),creature.getForce(),creature.getVision(),creature.getReproduction(),sexe,newCouleur,numJ);
                    }
                }
            }
            else{
                for(let k=0;k<listCreatures[i].length;k++){
                    if(listCreatures[i][k].getSexe()==1 && listCreatures[i][k].getX()==creature.getX() && listCreatures[i][k].getY()==creature.getY()){
                        creature.setFertile(false);
                    }
                }
            }
        }
    }              
    listCreatures[i][j].setHydratation(listCreatures[i][j].getHydratation()-1);
    listCreatures[i][j].setSatiete(listCreatures[i][j].getSatiete()-1);
    if(listCreatures[i][j].getHydratation()<1||listCreatures[i][j].getSatiete()<1){
        listCreatures[i].splice(j,1);
        console.log("la creature est morte");
    }
        
}
function choix(creature){
    coo=coordonneesToInt(creature.getX(),creature.getY());
    listCoup=coupDansVision(coo);
    if(creature.getFertile()){
        if(!goTo('base',listCoup,creature)){
            console.log("erreur:base1");
        }
    }
    else if(creature.getSatiete()<creature.getHydratation()){
        if(!goTo('chartreuse',listCoup,creature)){
            console.log('n as pas trouver a manger');
            if(!goTo('aqua',listCoup,creature)){
                console.log('n as pas trouver a boire');
                if(!goTo('base',listCoup,creature)){
                    console.log("erreur:base");
                }
            }
        }
    }
    else{
        if(!goTo('aqua',listCoup,creature)){
            console.log('n as pas trouver a boire');
            if(!goTo('chartreuse',listCoup,creature)){
                console.log('n as pas trouver a manger');
                if(!goTo('base',listCoup,creature)){
                    console.log("erreur:base");
                }
            }
        }
    }
}
function goTo(direction,listCoup,creature){
    if(direction=='base'){
        if(creature.getCouleur()=='red'||creature.getCouleur()=='maroon'){
            let listBonCoups=[];
            for(let k=0;k<listCoup.length;k++){
                newCoo=intToCoordonnees(listCoup[k][0],listCoup[k][1]);
                if(Math.abs(Math.abs(newCoo[1]-351)==Math.abs(creature.getY()-351) && newCoo[0]-182)<Math.abs(creature.getX()-182)||Math.abs(newCoo[1]-351)<Math.abs(creature.getY()-351)){
                    listBonCoups.push(listCoup[k]);
                } 
            }
            if(listBonCoups.length>0){
                newCoo=listBonCoups[Math.floor(Math.random() * listBonCoups.length)];
                newCoo=intToCoordonnees(newCoo[0],newCoo[1]);
                creature.setX(newCoo[0]);
                creature.setY(newCoo[1]);
                return true;
            }
        }
        else if(creature.getCouleur()=='fuchsia'||creature.getCouleur()=='purple'){
            let listBonCoups=[];
            for(let k=0;k<listCoup.length;k++){
                newCoo=intToCoordonnees(listCoup[k][0],listCoup[k][1]);
                if(Math.abs(newCoo[0]-782)<Math.abs(creature.getX()-782)||Math.abs(newCoo[1]-351)<Math.abs(creature.getY()-351)){
                    listBonCoups.push(listCoup[k]);
                } 
            }
            if(listBonCoups.length>0){
                newCoo=listBonCoups[Math.floor(Math.random() * listBonCoups.length)];
                newCoo=intToCoordonnees(newCoo[0],newCoo[1]);
                creature.setX(newCoo[0]);
                creature.setY(newCoo[1]);
                return true;
            }
        }
        else if(creature.getCouleur()=='blue'||creature.getCouleur()=='navy'){
            let listBonCoups=[];
            for(let k=0;k<listCoup.length;k++){
                newCoo=intToCoordonnees(listCoup[k][0],listCoup[k][1]);
                if(Math.abs(newCoo[0]-632)<Math.abs(creature.getX()-632)||Math.abs(newCoo[1]-597)<Math.abs(creature.getY()-597)){
                    listBonCoups.push(listCoup[k]);
                } 
            }
            if(listBonCoups.length>0){
                newCoo=listBonCoups[Math.floor(Math.random() * listBonCoups.length)];
                newCoo=intToCoordonnees(newCoo[0],newCoo[1]);
                creature.setX(newCoo[0]);
                creature.setY(newCoo[1]);
                return true;
            }
        }
        else{
            let listBonCoups=[];
            for(let k=0;k<listCoup.length;k++){
                newCoo=intToCoordonnees(listCoup[k][0],listCoup[k][1]);
                if(Math.abs(newCoo[0]-332)<Math.abs(creature.getX()-332)||Math.abs(newCoo[1]-105)<Math.abs(creature.getY()-105)){
                    listBonCoups.push(listCoup[k]);
                } 
            }
            if(listBonCoups.length>0){
                newCoo=listBonCoups[Math.floor(Math.random() * listBonCoups.length)];
                newCoo=intToCoordonnees(newCoo[0],newCoo[1]);
                creature.setX(newCoo[0]);
                creature.setY(newCoo[1]);
                return true;
            }
        }
    }
    else if(direction=='chartreuse'){
        let listBonCoups=[];
        for(let k=0;k<listCoup.length;k++){
            if(listCouleurs[listCoup[k][1]][listCoup[k][0]]=='chartreuse'){
                listBonCoups.push(listCoup[k]);
            }
        }
        if(listBonCoups.length>0){
            newCoo=listBonCoups[Math.floor(Math.random() * listBonCoups.length)];
            newCoo=intToCoordonnees(newCoo[0],newCoo[1]);
            creature.setX(newCoo[0]);
            creature.setY(newCoo[1]);
            return true;
        }
    }
    else{
        let listBonCoups=[];
        for(let k=0;k<listCoup.length;k++){
            if(listCouleurs[listCoup[k][1]][listCoup[k][0]]=='aqua'){
                listBonCoups.push(listCoup[k]);
            }
        }
        if(listBonCoups.length>0){
            newCoo=listBonCoups[Math.floor(Math.random() * listBonCoups.length)];
            newCoo=intToCoordonnees(newCoo[0],newCoo[1]);
            creature.setX(newCoo[0]);
            creature.setY(newCoo[1]);
            return true;
        }
    }
    return false;
}
function debutTour(x,y,satiete,hydratation,fertile){

}
function coupDansVision([a,b]){
    listCoupPossibles=[];
    if(sortieTerrain(a-1,b)){
        listCoupPossibles.push([a-1,b]);
    }
    if(sortieTerrain(a+1,b)){
        listCoupPossibles.push([a+1,b]);
    }
    if(sortieTerrain(a,b-1)){
        listCoupPossibles.push([a,b-1]);
    }
    if(sortieTerrain(a+1,b-1)){
        listCoupPossibles.push([a+1,b-1]);
    }
    if(sortieTerrain(a-1,b+1)){
        listCoupPossibles.push([a-1,b+1]);
    }
    if(sortieTerrain(a,b+1)){
        listCoupPossibles.push([a,b+1]);
    }
    return listCoupPossibles;
}
function sortieTerrain(a,b){
    if(a<0||a>12||b<0||b>12){
        return false;
    }
    else return true;
}
function coordonneesToInt(x,y){
    b=Math.floor((y-105)/41);
    a=Math.floor(((x-32)-25*(b))/50);
    return [a,b];
}
function intToCoordonnees(a,b){
    x=a*50+32+25*b;
    y=b*41+105;
    return [x,y];
}
function gagnant(t){
    let score=[];
    for(let i=0;i<listCreatures.length;i++){
        score.push([couleur[i*2],listCreatures[i].length]);
    }
    console.log("tour ",t,' score: ',score);
}
app.get('/', (request, response)=>{
    response.sendFile('clientProjet.html', {root: __dirname});
});

app.get('/', (request, response)=>{
    response.sendFile('creationEspece.html', {root: __dirname});
});

io.on('connection', (socket)=>{

    socket.on('commencer', ()=>{
        const intervalId = setInterval(tour, 1000);
        io.emit('listCreatures',listCreatures);
        setTimeout(() => {
            clearInterval(intervalId);
        }, 20000);
        gagnant();
    })
    socket.on('r', data=>{
        console.log(data);
    })
    socket.on('demandeEntre', data =>{
        if(listJoueurs.length==0){
            listJoueurs.push(data);
            listCreatures.push([]);
            stats.push([]);
            nbJoueurs=1;
            io.emit('connection',listJoueurs);
            socket.emit('adminGame');
            socket.emit('monNum',1);
        }
        else if(listJoueurs.length<nbJoueursMax){
            listJoueurs.push(data);
            listCreatures.push([]);
            stats.push([]);
            nbJoueurs+=1;
            socket.emit('monNum',nbJoueurs);
            io.emit('connection',listJoueurs);
        }
        else{
            socket.emit('echec','echec de connection');
        }
        if(listJoueurs.length==nbJoueursMax && nbJoueursMax!=5){
            for(let i=0;i<13;i++){
                listCouleurs.push([]);
                for(let j=0;j<13;j++){
                    listCouleurs[i].push(lands[Math.floor(Math.random() * 3)]);
                }
            }
            io.emit('partieCommence');
        }
    });
    socket.on('choixAdmin', data =>{
        nbJoueursMax=data;
        if(nbJoueursMax==1){
            for(let i=0;i<13;i++){
                listCouleurs.push([]);
                for(let j=0;j<13;j++){
                    listCouleurs[i].push(lands[Math.floor(Math.random() * 3)]);
                }
            }
            io.emit('partieCommence');
        }
    });
    socket.on('stats', data =>{
        numJoueur=data[0];
        force=data[1];
        vision=data[2];
        reprod=data[3];

        stats[numJoueur-1].push(force);
        stats[numJoueur-1].push(vision);
        stats[numJoueur-1].push(reprod);
        let lancer=true;
        creerCreature(positionTanieres[numJoueur-1][0],positionTanieres[numJoueur-1][1],force,vision,reprod,0,couleur[(numJoueur-1)*2],numJoueur);
        creerCreature(positionTanieres[numJoueur-1][0],positionTanieres[numJoueur-1][1],force,vision,reprod,1,couleur[(numJoueur-1)*2+1],numJoueur);
        
        for(let i=0;i<nbJoueursMax;i++){
            if(stats[i].length==0){
                lancer=false;
            }
        }
        if(lancer){
            io.emit('listCreatures',listCreatures);
            io.emit('map',[nbJoueursMax,listCouleurs]);

        }
    })
    socket.on('demandeSortie', data =>{
        for(let i=0;i<listJoueurs.length;i++){
            if(data[0]==listJoueurs[i]){listJoueurs.splice(i,1);}
        }
        stats.splice(data[1],1);

    });
});

