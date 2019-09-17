function doPost(e) {
  //嘗試lock
  var lock = LockService.getScriptLock();
  var success = lock.tryLock(5 * 1000);

  var base_json = base();
  var debug = 0; // 0=沒有要debug、1=模擬Telegram、2=模擬Line
  //模擬Telegram的話記得把要模擬的東西複製到分頁debug中的B1
  //模擬Line的話記得把要模擬的東西複製到分頁debug中的B2

  if (debug == 1) { //模擬Telegram
    var sheet_key = base_json.sheet_key
    var SpreadSheet = SpreadsheetApp.openById(sheet_key);
    var SheetD = SpreadSheet.getSheetByName("Debug");
    var e = SheetD.getRange(1, 2).getDisplayValue(); //讀取debug分頁中的模擬資訊
    var estringa = JSON.parse(e);
    var ee = JSON.stringify(estringa);
    Logger.log("=====Debug=====")
  } else {
    var estringa = JSON.parse(e.postData.contents);
    var ee = JSON.stringify(estringa);
  }

  //各種預設
  var text = "";
  var sheet_key = base_json.sheet_key
  var doc_key = base_json.doc_key
  var Telegram_bot_key = base_json.Telegram_bot_key
  var Telegram_id = base_json.Telegram_id
  var Log_page = "Log"


  //開啟doc
  var doc = DocumentApp.openById(doc_key)
  var f = doc.getText()
  try {
    var ALL = JSON.parse(f);
  } catch (d) {
    console.log(f)
    console.log("doc error!")
    var Dlen = f.search('}{"');
    var ff = f.substring(0, Dlen + 1)
    var r = ff;
    doc.setText(r); //寫入
    var ALL = JSON.parse(r);
  }

  /*/ debug用
  var SpreadSheet = SpreadsheetApp.openById(sheet_key);
  var SheetD = SpreadSheet.getSheetByName("Debug");
  var LastRowD = SheetD.getLastRow();
  //SheetD.getRange(LastRowD + 1, 2).setValue("ggggggggggg LastRowD= " + );
  //Logger.log("這裡被執行了! ");
  //*/

  //取得基本資料
  var em = estringa.message
  var emt = em.text
  var chat_id = String(em.chat.id)
  var message_id = em.message_id
  var username = em.from.username
  var chat_type = em.chat.type
  var caption = em.caption
  var entities = em['entities']
  var caption_entities = em['caption_entities']
  var media_group_id = String(em.media_group_id)
  Log(ee, username, sheet_key, Log_page); //log

  //嘗試先取得keys
  var keys = Object.keys(ALL[chat_id]['transport'])


  //以下正式開始=================================================================
  if (estringa.update_id) { //以下來自telegram //嘛，其實gs網址應該是不會外流的吧

    //擁有者檢查=================================================================
    if (Telegram_id != chat_id && chat_type == "private") {
      //如果不是 發一段話即結束
      lock.releaseLock(); //先結束鎖不影響
      var text = "您好!這是私人用的bot，不對他人開放"
      sendtext(chat_id, text)
      return 0;
    }

    //來源檢查==================================================================
    if (chat_type == "supergroup" || chat_type == "group") {
      //現在只剩 群組、超級群組 的可能
      if (!ALL[chat_id]) { //不在ALL裡面群組
        TG_leaveChat(chat_id)
        return 0
      }

      //下面開始動作
      if (entities && !em.reply_to_message) {
        // 有 hashtag + 不是"回覆"
        var url_result = get_entities_by_type(emt, entities, 'url')
        var hashtag_result = get_entities_by_type(emt, entities, 'hashtag')

        var to_chat_id = get_to_chat_id_by_hashtag_result(hashtag_result, chat_id, ALL)
        if ((!hashtag_result) && url_result && ALL[chat_id]['turn_on_preset']) {
          to_chat_id.push(ALL[chat_id]['preset'])
        }

        if (to_chat_id == []) {
          lock.releaseLock();
          return 0;
        }

        //依類別分別取出f_id並發送
        for (var j in to_chat_id) {
          forwardMessage(String(to_chat_id[j]),chat_id,false,message_id)
        }

      } else if (em.entities && em.reply_to_message) {
        //  回覆文字中有 hastag
        var to_chat_id = []
        var hashtag_result = get_entities_by_type(em.text, em.entities, 'hashtag')
        var hashtag_result_A = get_entities_by_type(em.text, em.entities, 'hashtag', 'A')
        var url_result_A = get_entities_by_type(em.text, em.entities, 'url', 'A')
        // 前置完畢

        //先搞定發送對象
        if (em.reply_to_message) {
          // "回覆" 兩種狀況 一種是回覆 "純媒體"，另一種是 "純網址"
          // 或許未來新增 /delete ?
          var emr = em.reply_to_message

          // 回覆純媒體
          if ((emr.photo || emr.animation || emr.video) && !(emr.text)) {
            if (hashtag_result) { // 設 to_chat_id
              for (var i in keys) {
                if (hashtag_result.indexOf(keys[i]) != -1) {
                  to_chat_id.push(ALL[chat_id]['transport'][keys[i]])
                }
              }
            } else if (url_result && ALL[chat_id]['turn_on_preset']) {
              to_chat_id.push(ALL[chat_id]['preset'])
            }

            if (to_chat_id == []) {
              lock.releaseLock();
              return 0;
            }
            if (!emr.caption) {
              //如果 被回覆的照片 沒有註解
              //那發到頻道的照片內容，就用回覆的內容
              var caption2 = em.text
            } else {
              var caption2 = emr.caption
            }

            for (var j in to_chat_id) {
              if (emr.photo) {
                var p = emr.photo
                var max = p.length - 1;
                var f_id = p[max].file_id
                sendPhoto(to_chat_id[j], f_id, false, caption2)
              } else if (emr.animation) {
                var f_id = emr.animation.file_id
                sendAnimation(to_chat_id[j], f_id, false, caption2)
              } else if (emr.video) {
                var f_id = emr.video.file_id
                sendVideo(to_chat_id[j], f_id, false, caption2)
              }
            }
            lock.releaseLock();
            return 0;
          }

          // 回覆純網址
          var R_hashtag_result_A = get_entities_by_type(emr.text, emr.entities, 'hashtag', 'A')
          var R_url_result_A = get_entities_by_type(emr.text, emr.entities, 'url', 'A')
          if (A_have(R_url_result_A) && !(A_have(R_hashtag_result_A) || emr.photo || emr.animation || emr.video)) {
            var to_chat_id = get_to_chat_id_by_hashtag_result(hashtag_result_A, chat_id, ALL)
            if (to_chat_id == []) { //如果沒有就 hashtag_result_A 閃人
              lock.releaseLock();
              return 0;
            }
            try {
              use_web_tansport(to_chat_id, R_url_result_A, chat_id, em)
            } catch (e) {
              console.log(e);
            }
            lock.releaseLock();
            return 0;
          }
        } else { // 沒reply了啦
          // 網址發糧 ( hashtag + url )
          if (A_have(hashtag_result_A) && A_have(url_result_A)) { //兩個都有才有可能是
            var to_chat_id = get_to_chat_id_by_hashtag_result(hashtag_result_A, chat_id, ALL)
            if (to_chat_id == []) { //如果沒有就 hashtag_result_A 閃人
              lock.releaseLock();
              return 0;
            }
            try {
              use_web_tansport(to_chat_id, url_result_A, chat_id, em)
            } catch (e) {
              console.log(e);
            }
          }
          lock.releaseLock();
          return 0;
        }
        // 沒了(?
      } else {
        lock.releaseLock();
        return 0;
      }

    } else if (chat_type == "private") {
      //自己跟bot對話(設定用途?)
      if (estringa.message.text) { //如果是文字訊息
        sendtext(chat_id, "030")
      }
    }
  }
  lock.releaseLock();
  //throw new Error("強制停止!")
  return 0;
}

//以下各類函式支援
//==============================================================================
function Log(ee, username, sheet_key, Log_page) {
  var d = new Date();
  var SpreadSheet = SpreadsheetApp.openById(sheet_key);
  var Sheet = SpreadSheet.getSheetByName(Log_page);
  var SheetLastRow = Sheet.getLastRow();
  var wt = [
    [d, username, ee]
  ]
  Sheet.getRange("A{0}:C{0}".format(String(SheetLastRow + 1))).setValues(wt);
  return SpreadSheet
}
//=================================================================================
function write_ALL(ALL, doc) {
  try {
    var r = JSON.stringify(ALL); //別刪，這是源頭啦!!!
    doc.setText(r); //寫入
  } catch (e) {
    return e
  }
  return ALL
}
//=================================================================================
function send_wait_media() {
  var lock = LockService.getScriptLock();
  var success = lock.tryLock(5 * 1000);
  var base_json = base();
  var doc2_key = base_json.doc2_key
  var wait_doc = DocumentApp.openById(doc2_key)
  var f = wait_doc.getText()
  try {
    var wait_doc_json = JSON.parse(f);
  } catch (d) {
    console.log(f)
    console.log("doc error!")
    var Dlen = f.search('}{"');
    var r = f.substring(0, Dlen + 1)
    wait_doc.setText(r); //寫入
    var wait_doc_json = JSON.parse(r);
  }

  var keys = Object.keys(wait_doc_json)
  for (var i in keys) {
    var aims = wait_doc_json[keys[i]]
    var time_difference = new Date().getTime() - aims['create_time']
    if (time_difference > 20 * 1000) {
      var media = []
      for (var l in aims['f_data']) { // 負責先整理好 media
        var t8 = {
          "type": aims['f_data'][l]['type'],
          "media": aims['f_data'][l]['media'],
          "caption": aims['f_data'][l]['caption'],
        }
        media.push(t8)
      }
      media = JSON.stringify(media)

      for (k in aims['to']) { //負責發送
        var to = aims['to'][k]
        sendMediaGroup(to, media)
      }

      deleteTrigger(aims['tgr']) // 清 triggers

      // 收尾清 wait_doc
      delete wait_doc_json[keys[i]]
      write_ALL(wait_doc_json, wait_doc) //寫入
    }
    continue;
  }
}
//==============================================================================
function sendMediaGroup(chat_id, media, disable_notification, reply_to_message_id) {
  if (chat_id === void 0)
    throw new Error("chat_id未給")
  if (media === void 0)
    throw new Error("media未給")
  //if (typeof media !== 'object')
  //  throw new Error("media非為正確型態物件")
  if (disable_notification === void 0)
    disable_notification = false
  if (typeof disable_notification !== 'boolean')
    throw new Error("disable_notification非為正確型態布零值")
  if (reply_to_message_id === void 0)
    reply_to_message_id = ''
  var t = typeof reply_to_message_id
  if (t != 'number' && t != 'string') {
    throw new Error("reply_to_message_id非為正確型態數值或字串")
  }
  //------------------------------------------
  var payload = {
    "method": "sendMediaGroup",
    'chat_id': String(chat_id),
    'media': media,
    'disable_notification': disable_notification,
    'reply_to_message_id': reply_to_message_id
  }
  return start(payload);
}
//==============================================================================
function get_entities_by_type(text, entities, entities_type, return_type) {
  var j = ''
  var k = []
  for (var i = 0; i < entities.length; i++) {
    if (entities[i]["type"] != entities_type) {
      continue
    }
    var st = parseInt(entities[i]["offset"])
    var t_len = parseInt(entities[i]["length"])
    j += (text.substr(st, t_len) + ' ')
    k.push(text.substr(st, t_len))
  }
  if (return_type == 'A') {
    return k
  }
  return j
}
//============================================================================
function Deletes_all_triggers() {
  // Deletes all triggers in the current project.
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}
//==============================================================================
/**
 * Deletes a trigger.
 * @param {string} triggerId The Trigger ID.
 */
function deleteTrigger(triggerId) {
  // Loop over all triggers.
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    // If the current trigger is the correct one, delete it.
    if (allTriggers[i].getUniqueId() === triggerId) {
      ScriptApp.deleteTrigger(allTriggers[i]);
      break;
    }
  }
}
//==============================================================================
function get_text(st, ed, t) {
  return t.substring((t.indexOf(st) + st.length), (t.indexOf(ed)))
}
//==============================================================================
function get_to_chat_id_by_hashtag_result(hashtag_result, chat_id, ALL) {
  var to_chat_id = []
  var keys = Object.keys(ALL[chat_id]['transport'])
  if (hashtag_result) { // 設 to_chat_id
    for (var i in keys) {
      if (hashtag_result.indexOf(keys[i]) != -1) {
        to_chat_id.push(ALL[chat_id]['transport'][keys[i]])
      }
    }
  }
  return to_chat_id
}
//==============================================================================
function use_web_tansport(to_chat_id, url_result_A, chat_id, em) {
  if (A_have(url_result_A)) { //兩個都有才有可能是
    var emr = em.reply_to_message ? em.reply_to_message.text : ''

    var re_twitter = /^https:\/\/twitter\.com\/\w+\/status\/\d+(\?s=\d+)?$/g
    var re_plurk = /^https:\/\/www\.plurk\.com\/p\/\w{6,}$/g
    var re_pixel = /^https:\/\/www\.pixiv\.net\/member_illust\.php\?mode=medium&illust_id=\d+$/g

    if (re_twitter.test(url_result_A)) { // twitter ----------------------

      var response = UrlFetchApp.fetch(url_result_A);
      var html = response.getContentText()
      var t = get_text('<link id="async-css-placeholder">', '</head>', html)
      var re = /image" content="([^<>"]+)"/g
      var n = t.match(re);

      if (n.length == 0) {
        sendtext(chat_id, '網址中沒找到圖片', em.message_id)
        lock.releaseLock();
        return 0;
      }

      var wait_photo = []
      for (var i2 in n) {
        var InputMedia = {
          'type': 'photo',
          'media': get_text('image" content="', '"', n[i2]),
          'caption': em.caption
        }
        wait_photo.push(InputMedia)
      }
      wait_photo[0]['caption'] = emr.text ? emr.text : em.text
      var media = JSON.stringify(wait_photo)

      if (wait_photo.length == 1) {
        sendPhoto(to_chat_id, wait_photo[0]['media'], false, em.text)
      } else {
        sendMediaGroup(to_chat_id, media)
      }

    } else if (re_plurk.test(url_result_A)) { // plurk ------------------

      var response = UrlFetchApp.fetch(url_result_A);
      var html = response.getContentText()
      var t1 = html.slice(html.indexOf('<div class="text_holder">'))
      var t2 = t1.slice(0, t1.indexOf('</div> </div> <div class="controls clearfix"></div>'))
      var re = /href=\"([^\"]+)\"/g
      var n = t2.match(re);

      if (n.length == 0) {
        sendtext(chat_id, '網址中沒找到圖片', em.message_id)
        lock.releaseLock();
        return 0;
      }

      var wait_photo = []
      for (var i3 in n) {
        var InputMedia = {
          'type': 'photo',
          'media': get_text('href="', '"', n[i3]),
          'caption': em.caption
        }
        wait_photo.push(InputMedia)
      }
      wait_photo[0]['caption'] = emr.text ? emr.text : em.text
      var media = JSON.stringify(wait_photo)

      if (wait_photo.length == 1) {
        sendPhoto(to_chat_id, wait_photo[0]['media'], false, em.text)
      } else {
        sendMediaGroup(to_chat_id, media)
      }
    } else if (re_pixel.test(url_result_A)) {
      var response = UrlFetchApp.fetch(url_result_A);
      var html = response.getContentText()
      var t1 = html.slice(html.indexOf('<meta property="og:image"'))
      var t2 = t1.slice(0, t1.indexOf('<meta name="application-name"'))

      var re = /\"og:image\"\ content=\"([^\"]+)\"/g
      var n = t2.match(re);

      if (n.length == 0) {
        sendtext(chat_id, '網址中沒找到圖片', em.message_id)
        lock.releaseLock();
        return 0;
      }

      var wait_photo = []
      for (var i3 in n) {
        var InputMedia = {
          'type': 'photo',
          'media': get_text(' content="', '"', n[i3]),
          'caption': em.caption
        }
        wait_photo.push(InputMedia)
      }
      wait_photo[0]['caption'] = emr.text ? emr.text : em.text
      var media = JSON.stringify(wait_photo)

      if (wait_photo.length == 1) {
        sendPhoto(to_chat_id, wait_photo[0]['media'], false, em.text)
      } else {
        sendMediaGroup(to_chat_id, media)
      }
    } else {
      throw new Error("不支援")
    }
  }

}
//==============================================================================
function A_have(a) {
  if (a.length == 0) {
    return false
  }
  return true
}
//==============================================================================
String.prototype.format = function() {
  var txt = this.toString();
  for (var i = 0; i < arguments.length; i++) {
    var exp = getStringFormatPlaceHolderRegEx(i);
    txt = txt.replace(exp, (arguments[i] == null ? "" : arguments[i]));
  }
  return cleanStringFormatResult(txt);
}

function getStringFormatPlaceHolderRegEx(placeHolderIndex) {
  return new RegExp('({)?\\{' + placeHolderIndex + '\\}(?!})', 'gm')
}

function cleanStringFormatResult(txt) {
  if (txt == null) return "";
  return txt.replace(getStringFormatPlaceHolderRegEx("\\d+"), "");
}
//==============================================================================
// 我印象中有找到一種方式來分割字串的，但不知道是哪個指令...
// 用法是 text.xxxx(10) -> 回傳 [字串前10個字 , 後10個到底的字]
String.prototype.nslice = function() {
  var txt = this.toString();
  var t1 = txt.substr(0, arguments[0])
  var t2 = txt.slice(arguments[0])
  return [t1, t2];
}
//==============================================================================
