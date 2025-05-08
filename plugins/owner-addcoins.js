import db from '../lib/database.js';
import MessageType from '@whiskeysockets/baileys';

let impts = 0;

let handler = async (m, { conn, text }) => {
    let who;
    if (m.isGroup) {
        if (m.mentionedJid.length > 0) {
            who = m.mentionedJid[0];
        } else {
            const quoted = m.quoted ? m.quoted.sender : null;
            who = quoted ? quoted : m.sender;
        }
    } else {
        who = m.sender;
    }
    
    if (!who) throw '❌ Por favor, menciona al usuario o responde a un mensaje.';
    
    let txt = text.replace('@' + who.split`@`[0], '').trim();
    if (!txt) throw '❌ Ingresa la cantidad que deseas añadir.';
    if (isNaN(txt)) throw '❌ Solo se permiten números.';
    
    let dmt = parseInt(txt);
    if (dmt < 1) throw '❌ La cantidad mínima es 1.';

    if (!global.db.data.users[who]) {
        global.db.data.users[who] = {
            exp: 0,
            coin: 0,
            diamond: 20,
            bank: 0,
            lastclaim: 0,
            registered: false,
            name: conn.getName(who),
            age: -1,
            regTime: -1,
            afk: -1,
            afkReason: "",
            banned: false,
            warn: 0,
            level: 0,
            role: "Novato",
            autolevelup: false,
            chatbot: false,
            genero: "Indeciso",
            language: "es",
            prem: false,
            premiumTime: 0,
            namebebot: "",
            isbebot: false
        };
    }

    global.db.data.users[who].coin += dmt;
    
    m.reply(`💸 *Añadido:*\n» ${dmt} coins\n@${who.split('@')[0]}, recibiste ${dmt} 💸`, null, { mentions: [who] });
};

handler.help = ['addcoins @usuario <cantidad>'];
handler.tags = ['owner'];
handler.command = ['añadircoin', 'addcoin', 'addcoins']; 
handler.rowner = true;

export default handler;
