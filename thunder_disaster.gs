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
  //Log(ee, username, sheet_key, Log_page);

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
          forwardMessage(String(to_chat_id[j]), chat_id, false, message_id)
        }

      } else if (em.entities && em.reply_to_message) {
        //  回覆文字中有 hastag
        var to_chat_id = []
        var hashtag_result = get_entities_by_type(em.text, em.entities, 'hashtag')
        var hashtag_result_A = get_entities_by_type(em.text, em.entities, 'hashtag', 'A')
        var url_result_A = get_entities_by_type(em.text, em.entities, 'url', 'A')
        var emr = em.reply_to_message
        // 前置完畢

        //先搞定發送對象
        if (hashtag_result) { // 設 to_chat_id
          for (var i in keys) {
            if (hashtag_result.indexOf(keys[i]) != -1) {
              to_chat_id.push(ALL[chat_id]['transport'][keys[i]])
            }
          }
        } else if (url_result && ALL[chat_id]['turn_on_preset']) {
          to_chat_id.push(ALL[chat_id]['preset'])
        }

        if (to_chat_id == []) { //沒對象就算了~
          lock.releaseLock();
          return 0;
        }

        //折射 (∩^o^)⊃━☆ﾟ.*･｡
        for (var j in to_chat_id) {
          forwardMessage(String(to_chat_id[j]), chat_id, false, emr.message_id)
        }
      }
      lock.releaseLock();
      return 0;

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
//喔乾，感謝 Kevin Tseng 開源這個用法
//來源:
// https://kevintsengtw.blogspot.com/2011/09/javascript-stringformat.html?
// showComment=1536387871696#c7569907085658128584
//可在Javascript中使用如同C#中的string.format (對jQuery String的擴充方法)
//使用方式 : var fullName = 'Hello. My name is {0} {1}.'.format('FirstName', 'LastName');
//
String.prototype.format = function() {
  var txt = this.toString();
  for (var i = 0; i < arguments.length; i++) {
    var exp = getStringFormatPlaceHolderRegEx(i);
    arguments[i] = String(arguments[i]).replace(/\$/gm,'♒☯◈∭')
    txt = txt.replace(exp, (arguments[i] == null ? "" : arguments[i]));
    txt = txt.replace(/♒☯◈∭/gm,'$')
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
//==============================================================================
