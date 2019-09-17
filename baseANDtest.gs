function base() {
  //前期準備，不懂看README
  var sheet_key = "16LyEzQqlPI"; //你的sheet ID
  var doc_key = "1COMb2xa8gM"; //你的doc ID
  var Telegram_bot_key = "813:GRpszho6bIc"; //Telegram bot的token
  var Telegram_id = "203"; //你的Telegram帳號ID(要通知你)
  var gsURL = "https://script.google.com/macros/s/AKflD4js/exec"; //該gs檔的發佈網址
  //前期準備完成!==============================================================
  var base_json = {
    "sheet_key": sheet_key,
    "doc_key": doc_key,
    "Telegram_bot_key": Telegram_bot_key,
    "Telegram_id": Telegram_id,
    "gsURL": gsURL
  }
  return base_json
}
//============================================================================
