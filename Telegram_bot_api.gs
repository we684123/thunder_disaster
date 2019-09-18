//=================================================================================
function getpath(id, Telegram_bot_key) {
  if (Telegram_bot_key === void 0) {
    var base_json = base()
    var Telegram_bot_key = base_json.Telegram_bot_key
  }
  url = "https://api.telegram.org/bot" + Telegram_bot_key + "/getFile?file_id=" + id
  var html = UrlFetchApp.fetch(url);
  html = JSON.parse(html);
  var path = html.result.file_path
  return path;
}
//=================================================================================
function TGdownloadURL(path, Telegram_bot_key) {
  if (Telegram_bot_key === void 0) {
    var base_json = base()
    var Telegram_bot_key = base_json.Telegram_bot_key
  }
  var TGDurl = "https://api.telegram.org/file/bot" + Telegram_bot_key + "/" + path
  return TGDurl;
}
//=================================================================================

/**
 * downloadFromTG - 從TG下載到google_drive
 *
 * @param  {String} Telegram_bot_key TG_token
 * @param  {String} Id               tg_file_id
 * @param  {String} fileName         檔名
 * @param  {Folder} Folder           塞入哪個資料夾
 * @return {String}                  新檔案的googel_id
 */
function downloadFromTG(Telegram_bot_key, tg_file_id, fileName, Folder) {
  var K = Telegram_bot_key
  var url = TGdownloadURL(getpath(tg_file_id, K), K)
  var blob = UrlFetchApp.fetch(url);
  var f = Folder.createFile(blob).setName(fileName)
  return f.getId()
}
//=================================================================================
function get_time_txt(timestamp, GMT) {
  var formattedDate = Utilities.formatDate(new Date(timestamp), GMT, "yyyy-MM-dd' 'HH:mm:ss");
  return formattedDate;
}
//=================================================================================
function sendtext(chat_id, ct, reply_to_message_id) {
  reply_to_message_id === void 0 ? reply_to_message_id : ''

  if (chat_id === void 0)
    throw new Error("chat_id未給")
  if (ct === void 0)
    throw new Error("ct未給")
  try {
    var notification = ct["notification"]
    var parse_mode = ct["parse_mode"]
    if (notification == undefined || notification != true)
      var notification = false
    if (parse_mode == undefined)
      var parse_mode = ""
  } catch (e) {
    var notification = false
    var parse_mode = ""
  }
  if (ct["text"] == undefined) {
    var text = String(ct)
  } else if (typeof ct["text"] === 'object') {
    var text = ''
    ct["text"].forEach(function(element) {
      text += element
    });
  } else {
    var text = ct["text"]
  }

  var payload = {
    "method": "sendMessage",
    'chat_id': String(chat_id),
    'text': text,
    'disable_notification': notification,
    "parse_mode": parse_mode,
    'reply_to_message_id': reply_to_message_id
  }
  return start(payload);
}
//=================================================================
function forwardMessage(chat_id, from_chat_id, disable_notification, message_id) {
  if (chat_id === void 0)
    throw new Error("chat_id未給")
  if (from_chat_id === void 0)
    throw new Error("from_chat_id未給")
  if (disable_notification === void 0)
    disable_notification = disable_notification || false
  if (from_chat_id === void 0)
    throw new Error("from_chat_id未給")

  var payload = {
    "method": "forwardMessage",
    "chat_id":String(chat_id),
    'from_chat_id': String(from_chat_id),
    'disable_notification': disable_notification,
    'message_id': message_id
  }
  return start(payload);


}
//=================================================================
function sendPhoto(chat_id, url, notification, caption) {
  if (notification == undefined)
    notification = false
  caption = caption || ""
  var payload = {
    "method": "sendPhoto",
    'chat_id': String(chat_id),
    'photo': url,
    'disable_notification': notification,
    'caption': caption
  }
  return start(payload);
}
//=================================================================================
function sendAudio(chat_id, url_or_bolb, notification, caption, duration) {
  if (notification === void 0)
    notification = false
  if (caption === void 0)
    caption = ''
  if (duration === void 0)
    duration = 0
  var payload = {
    "method": "sendAudio",
    'chat_id': String(chat_id),
    'audio': url_or_bolb,
    'disable_notification': notification,
    'caption': caption,
    'duration': duration
  }
  return start(payload);
}
//=================================================================
function sendVideo(chat_id, url_or_bolb, notification, caption) {
  if (notification == undefined)
    notification = false
  caption = caption || ""
  var payload = {
    "method": "sendVideo",
    'chat_id': String(chat_id),
    'video': url_or_bolb,
    'disable_notification': notification,
    'caption': caption
  }
  return start(payload);
}
//=================================================================
function sendVoice(chat_id, url, notification, caption) {
  if (notification == undefined)
    notification = false
  caption = caption || ""
  var payload = {
    "method": "sendVoice",
    'chat_id': String(chat_id),
    'voice': url,
    'disable_notification': notification,
    'caption': caption
  }
  return start(payload);
}
//=================================================================
function sendDocument(chat_id, url_or_bolb, notification, caption) {
  if (notification === void 0)
    notification = false
  if (caption === void 0)
    caption = ''
  var payload = {
    "method": "sendDocument",
    'chat_id': String(chat_id),
    'document': url_or_bolb,
    'disable_notification': notification,
    'caption': caption
  }
  return start(payload);
}
//=================================================================================
function sendAnimation(chat_id, url, notification, caption) {
  /* Use this method to send animation files
   * (GIF or H.264/MPEG-4 AVC video without sound).
   *  On success, the sent Message is returned.
   * Bots can currently send animation files of up to 50 MB in size,
   *  this limit may be changed in the future.
   */
  if (notification == undefined)
    notification = false
  caption = caption || ""
  var payload = {
    "method": "sendAnimation",
    'chat_id': String(chat_id),
    'animation': url,
    'disable_notification': notification,
    'caption': caption
  }
  start(payload);
}
//=================================================================
function sendLocation(chat_id, latitude, longitude, notification) {
  if (notification == undefined)
    notification = false
  var payload = {
    "method": "sendLocation",
    "chat_id": String(chat_id),
    "latitude": latitude,
    "longitude": longitude,
    'disable_notification': notification
  }
  return start(payload);
}
//=================================================================
function deleteMessage(chat_id, message_id) {
  var payload = {
    "method": "deleteMessage",
    "chat_id": String(chat_id),
    "message_id": String(message_id)
  }
  return start(payload);
}
//=================================================================
function TG_leaveChat(chat_id) {
  var payload = {
    "method": "leaveChat",
    "chat_id": String(chat_id)
  }
  return start(payload);
}
//=================================================================
function ReplyKeyboardRemove(chat_id, ct) {
  if (chat_id === void 0)
    throw new Error("chat_id未給")
  if (ct === void 0)
    throw new Error("ct未給")
  try {
    var notification = ct["notification"]
    var parse_mode = ct["parse_mode"]
    if (notification == undefined || notification != true)
      var notification = false
    if (parse_mode == undefined)
      var parse_mode = ""
  } catch (e) {
    var notification = false
    var parse_mode = ""
  }
  if (ct["text"] == undefined) {
    var text = String(ct)
  } else if (typeof ct["text"] === 'object') {
    var text = ''
    ct["text"].forEach(function(element) {
      text += element
    });
  } else {
    var text = ct["text"]
  }

  var ReplyKeyboardRemove = {
    'remove_keyboard': true,
    'selective': false
  }
  var payload = {
    "method": "sendMessage",
    'chat_id': String(chat_id),
    'text': text,
    "parse_mode": parse_mode,
    "notification": notification,
    'reply_markup': JSON.stringify(ReplyKeyboardRemove)
  }
  return start(payload);
}
//=================================================================================
function ReplyKeyboardMakeup(chat_id, keyboard, resize_keyboard, one_time_keyboard, ct) {
  if (chat_id === void 0)
    throw new Error("chat_id未給")
  if (ct === void 0)
    throw new Error("ct未給")
  try {
    var notification = ct["notification"]
    var parse_mode = ct["parse_mode"]
    if (notification == undefined || notification != true)
      var notification = false
    if (parse_mode == undefined)
      var parse_mode = ""
  } catch (e) {
    var notification = false
    var parse_mode = ""
  }
  if (ct["text"] == undefined) {
    var text = String(ct)
  } else if (typeof ct["text"] === 'object') {
    var text = ''
    ct["text"].forEach(function(element) {
      text += element
    });
  } else {
    var text = ct["text"]
  }

  if (resize_keyboard == undefined) {
    resize_keyboard = true
  }
  if (one_time_keyboard = undefined) {
    one_time_keyboard = false
  }
  var ReplyKeyboardMakeup = {
    'keyboard': keyboard,
    'resize_keyboard': resize_keyboard,
    'one_time_keyboard': one_time_keyboard,
  }
  var payload = {
    "method": "sendMessage",
    'chat_id': String(chat_id), // 這裡不改是突然想到非主控
    'text': text,
    'parse_mode': parse_mode,
    'disable_notification': notification,
    'reply_markup': JSON.stringify(ReplyKeyboardMakeup)
  }
  return start(payload);
}
//=================================================================================
//喔乾，感謝 Kevin Tseng 開源這個用法
//來源:
// https://kevintsengtw.blogspot.com/2011/09/javascript-stringformat.html?
// showComment=1536387871696#c7569907085658128584
//可在Javascript中使用如同C#中的string.format (對jQuery String的擴充方法)
//使用方式 : var fullName = 'Hello. My name is {0} {1}.'.format('FirstName', 'LastName');
String.prototype.format = function() {
  var txt = this.toString();
  for (var i = 0; i < arguments.length; i++) {
    var exp = getStringFormatPlaceHolderRegEx(i);
    txt = txt.replace(exp, (arguments[i] == null ? "" : arguments[i]));
  }
  return cleanStringFormatResult(txt);
}
//讓輸入的字串可以包含{}
function getStringFormatPlaceHolderRegEx(placeHolderIndex) {
  return new RegExp('({)?\\{' + placeHolderIndex + '\\}(?!})', 'gm')
}
//當format格式有多餘的position時，就不會將多餘的position輸出
//ex:
// var fullName = 'Hello. My name is {0} {1} {2}.'.format('firstName', 'lastName');
// 輸出的 fullName 為 'firstName lastName', 而不會是 'firstName lastName {2}'
function cleanStringFormatResult(txt) {
  if (txt == null) return "";
  return txt.replace(getStringFormatPlaceHolderRegEx("\\d+"), "");
}
//=================================================================================
// 我印象中有找到一種方式來分割字串的，但不知道是哪個指令...
// 用法是 text.xxxx(10) -> 回傳 [字串前10個字 , 後10個到底的字]
String.prototype.nslice = function() {
  var txt = this.toString();
  var t1 = txt.substr(0, arguments[0])
  var t2 = txt.slice(arguments[0])
  return [t1, t2];
}
//============================================================================
function setWebhook() {
  var base_json = base()
  var Telegram_bot_key = base_json.Telegram_bot_key
  var gsURL = base_json.gsURL
  UrlFetchApp.fetch("https://api.telegram.org/bot" + Telegram_bot_key + "/setWebhook?url=" + gsURL + "&max_connections=1")
}
//=================================================================================
function start(payload) {
  var base_json = base()
  var Telegram_bot_key = base_json.Telegram_bot_key
  var data = {
    "method": "post",
    "payload": payload
  }

  //*/  <- 只要刪除或增加最前面的"/"就能切換模式了喔(*´∀`)~♥
  // throw new Error("強制停止!")
  return UrlFetchApp.fetch("https://api.telegram.org/bot" + Telegram_bot_key + "/", data);
  /*/  為了速度和穩定 不必要就算了
  var sheet_key = base_json.sheet_key
  var d = new Date();
  var SpreadSheet = SpreadsheetApp.openById(sheet_key);
  var Sheet = SpreadSheet.getSheetByName("紀錄發送的訊息");
  var LastRow = Sheet.getLastRow();
  Sheet.getRange(LastRow + 1, 1).setValue(d);
  Sheet.getRange(LastRow + 1, 3).setValue(data);
  Logger.log("ZZZZ = ", payload)
  var returned = UrlFetchApp.fetch("https://api.telegram.org/bot" + Telegram_bot_key + "/", data);
  Sheet.getRange(LastRow + 1, 2).setValue(returned); //確認有發成功
  //*/
}
//=================================================================================
