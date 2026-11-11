 require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

function sendTelegram(text){
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}`;
  return new Promise((resolve, reject)=>{
    https.get(url, res=>{
      let data=''; res.on('data', d=>data+=d); res.on('end', ()=>resolve(data));
    }).on('error', reject);
  });
}

app.post('/send', async (req, res) => {
  const {nom, phone, msg} = req.body;
  const date = new Date().toLocaleString('fr-CD', {timeZone:'Africa/Kinshasa'});
  
  // C) BASE DE DONNÉES - on sauvegarde tout
  const client = {date, nom, phone, msg};
  let db = [];
  if(fs.existsSync('clients.json')){
    db = JSON.parse(fs.readFileSync('clients.json'));
  }
  db.push(client);
  fs.writeFileSync('clients.json', JSON.stringify(db, null, 2));

  // Envoi Telegram
  const texte = `🔥 NOUVEAU CLIENT BACHELLE\n👤 Nom: ${nom}\n📞 Tel: ${phone}\n📝 Projet: ${msg}\n⏰ Date: ${date}\n📍 Kinshasa`;
  try{
    await sendTelegram(texte);
    console.log("Client sauvé + Telegram envoyé:", nom);
    res.json({ok:true});
  }catch(e){
    res.status(500).json({error:e.message});
  }
});

app.get('/admin', (req, res)=>{
  if(!fs.existsSync('clients.json')) return res.send("Aucun client encore");
  const db = JSON.parse(fs.readFileSync('clients.json'));
  let html = `<h1>BachElle - ${db.length} clients</h1><table border=1 cellpadding=10><tr><th>Date</th><th>Nom</th><th>Téléphone</th><th>Projet</th></tr>`;
  db.reverse().forEach(c=>{ html+=`<tr><td>${c.date}</td><td>${c.nom}</td><td>${c.phone}</td><td>${c.msg}</td></tr>`});
  html+=`</table>`;
  res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`BachElle PRO en ligne sur http://localhost:${PORT} | Admin: /admin`));