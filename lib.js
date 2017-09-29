import { TOKEN, ADMIN_CHAT, CHANNEL } from './common'
import Datastore from 'nedb'

const TelegramBot = require('node-telegram-bot-api');
export const Bot = new TelegramBot(TOKEN, {polling: true});

// TODO: create db to store users posts
let db = new Datastore({filename: 'users'})
db.loadDatabase()
// db.find({id: 1}, (error, docs) => {
//   if (!docs) {
//
//   } else {
//     db.insert({id: 1, name: username || ''})
//   }
// })

// detail log, usage: log(var1, var2, ...)
export const log = (val, ...args) => {
  let output = (arg, i) => {
    console.log(`---------------------`);
    console.log(`#${i} type: ${typeof arg}`);
    console.log(arg)
  }
  output(val, 1)
  if (args) {
    args.map((arg, i) => output(arg, i+2))
  }
  console.log(`---------------------`);
}


export class Post {

  constructor(msg) {
    this.autopic = ''
    this.autotext = ''
    this.picAdded = false
    this.textAdded = false
    this.username = msg.chat.username || msg.from.id
    this.userid = msg.from.id
    this.commands = ['/new', '/start', '/help']
  }

  get pic() {
    return this.autopic
  }
  get text() {
    return this.autotext
  }

  set pic(id) {
    this.autopic = id
  }
  set text(text) {
    this.autotext = text
  }

  isCommand(match) {
    let result = false
    this.commands.map(c => {
      if (match.indexOf(c) == 0) result = true
    })
    return result
  }

  addPic(msg) {
    this.autopic = msg.photo[msg.photo.length-1].file_id
    this.picAdded = true
  }

  toModerate(msg) {
    Bot.sendPhoto(msg.chat.id, this.autopic, {caption: this.autotext})
    .then(() => {
      Bot.sendMessage(msg.chat.id, "Отправить объявление в группу?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Да", callback_data: "toadmin" }],
            // [{ text: "Change pic", callback_data: "changePic" },
            //  { text: "Change text", callback_data: "changeText" }],
            [{ text: "Отмена", callback_data: "cancel" }]],
        }})
    })
  }

  sendToAdmin() {
    Bot.sendPhoto(ADMIN_CHAT, this.autopic, {caption: this.autotext,
      reply_markup: {
        inline_keyboard: [[{
          text: "Yes",
          callback_data: "sendToGroup",
        }],
        [{
          text: "No",
          callback_data: "notAllowed",
        }]
      ],
      }
    }).then(() => {
      Bot.sendMessage(ADMIN_CHAT, `added by ${this.username} (${this.userid}) to ${CHANNEL}`)
    })
  }

  sendToGroup() {
    Bot.sendPhoto(CHANNEL, this.autopic, {caption: this.autotext,  }).then(() => {
      Bot.sendMessage(CHANNEL, `Добавлено [@${this.username}](tg://user?id=${this.userid})`, {parse_mode:'Markdown'})
    })
  }
}
