import { Post, Bot, log } from './lib'

let post
let users = []
const getUser = (id) => { return users.find(r => r.id == id) }

Bot.onText(/\/new/, msg => {
  if (users.find(r => r.id == msg.chat.id)) {
    console.log(`@${getUser(msg.chat.id).post.username} (${getUser(msg.chat.id).post.userid}): Old record for user was deleted`);
    users = users.filter(r => r.id !== msg.chat.id)
  }
  users.push({id: msg.chat.id, post: new Post(msg)})
  users.map(r => console.log(`Starting new post for uid: ${r.post.userid}`))
  Bot.sendMessage(msg.chat.id, `Новое объявление в группу продажи автомобилей "Avto Market" @avtomarket77. Добавьте фотографию автомобиля для объявления:`)
  console.log(`@${getUser(msg.chat.id).post.username} (${getUser(msg.chat.id).post.userid}): Started new post`);
});
Bot.onText(/\/start/, msg => {
  Bot.sendMessage(msg.chat.id, 'Бот для добавления объявлений в группу продажи автомобилей @avtomarket77. Создание нового объявления: /new')
});
Bot.onText(/\/help/, msg => {
  Bot.sendMessage(msg.chat.id, 'Создание нового объявления в группу продажи автомобилей @avtomarket77: /new или наберите команду на клавиатуре')
});

Bot.onText(/(.+)/, (msg, match) => {
  if (match[0].length > 199) {
    Bot.sendMessage(msg.chat.id, 'Сделайте объявление короче (возможно только 200 знаков). Подробную информацию можно предоставить в личном чате.')
    return
  }
  if (!getUser(msg.chat.id).post.isCommand(match[1]) && !getUser(msg.chat.id).post.textAdded && getUser(msg.chat.id).post.picAdded) {
    getUser(msg.chat.id).post.text = match[1]
    getUser(msg.chat.id).post.textAdded = true
    getUser(msg.chat.id).post.toModerate(msg)
    log(users)
  }
  if (!getUser(msg.chat.id).post.isCommand(match[1]) && !getUser(msg.chat.id).post.textAdded && !getUser(msg.chat.id).post.picAdded) {
    Bot.sendMessage(msg.chat.id, 'Добавьте фотографию автомобиля:')
  }
  console.log(`@${getUser(msg.chat.id).post.username} (${getUser(msg.chat.id).post.userid}): Adding text`);
  });

Bot.on('photo', (msg) => {
  if (!getUser(msg.chat.id).post.picAdded && !getUser(msg.chat.id).post.textAdded) {
    getUser(msg.chat.id).post.addPic(msg)
    Bot.sendMessage(msg.chat.id, 'Фотография добавлена! Введите текст объявления (марка, год выпуска, пробег, цена, комментарий):')
  }
  else {
    getUser(msg.chat.id).post.newMsg = msg
    Bot.sendMessage(msg.chat.id, 'Вы уже добавили фотографию объявления! Заменить на новую?', {
      reply_markup: {
        inline_keyboard: [[{
          text: "Да, заменить",
          callback_data: "applyLastPic",
        }],
        [{
          text: "Нет, не заменять",
          callback_data: "applyLastPicCancel",
        }]
      ],
      },
    })

  }
  console.log(`@${getUser(msg.chat.id).post.username} (${getUser(msg.chat.id).post.userid}): Adding photo`);
});

Bot.on('callback_query', callbackQuery => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  };

  if (action === 'notAllowed') {
    let user = users.find(r => r.post.autopic == callbackQuery.message.photo[callbackQuery.message.photo.length-1].file_id)
    Bot.sendMessage(user.id, 'Не прошло модерацию. Прочитайте помощь для корректного добавления объявления /help. Новый пост: /new')
    Bot.sendMessage(msg.chat.id, 'Не прошло модерацию')
    log(getUser(user.id))
    console.log(`@${getUser(user.id).post.username} (${getUser(user.id).post.userid}): Post was not allowed by admin`);
    users = users.filter(r => r.id !== user.id)
  }
  if (action === 'sendToGroup') {
    let user = users.find(r => r.post.autopic == callbackQuery.message.photo[callbackQuery.message.photo.length-1].file_id)
    getUser(user.id).post.sendToGroup()
    Bot.sendMessage(user.id, 'Опубликовано в группе @avtomarket77. Создание нового объявления: /new')
    Bot.sendMessage(msg.chat.id, 'Опубликовано в группе @avtomarket77')
    console.log(`@${getUser(user.id).post.username} (${getUser(user.id).post.userid}): Post was published`);
    users = users.filter(r => r.id !== user.id)
  }
  if (action === 'toadmin') {
    getUser(msg.chat.id).post.sendToAdmin()
    getUser(msg.chat.id).post.from = msg
    Bot.editMessageText('Отправлено на модерацию', opts)
    console.log(`@${getUser(msg.chat.id).post.username} (${getUser(msg.chat.id).post.userid}): Post was sent to admin`);
  }
  if (action === 'applyLastPic') {
    getUser(msg.chat.id).post.addPic(getUser(msg.chat.id).post.newMsg)
    Bot.sendMessage(opts.chat_id, 'Фотография заменена. Введите текст объявления:')
    console.log(`@${getUser(msg.chat.id).post.username} (${getUser(msg.chat.id).post.userid}): Changed photo`);
  }
  if (action === 'applyLastPicCancel') {
    getUser(msg.chat.id).post.newMsg = ''
    Bot.sendMessage(opts.chat_id, 'Введите текст объявления:')
    console.log(`@${getUser(msg.chat.id).post.username} (${getUser(msg.chat.id).post.userid}): Cancel changing photo`);
  }
  if (action === 'cancel') {
    Bot.editMessageText('Отмена. Создание нового объявления: /new', opts)
    console.log(`@${getUser(msg.chat.id).post.username} (${getUser(msg.chat.id).post.userid}): Cancel creation new post`);
    users = users.filter(r => r.id !== msg.chat.id)
  }
});
