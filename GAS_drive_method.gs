//=================================================================================

/**
 * create_Folder - 創資料夾
 *
 * @param  {Folder} Folder        創建地點的Folder引入
 * @param  {String} Name          新Folder名稱
 * @param  {String} Description   新Folder說明
 * @return {Folder}               新創的Folder
 */
function create_Folder(Folder, Name, Description) {
  //前置檢查跟預設
  if (Folder === void 0)
    throw new Error("Folder未給")
  if (Name === void 0)
    throw new Error("Name未給")
  Description === void 0 ? '' : Description

  return Folder.createFolder(Name).setDescription(Description)
}
//=================================================================================

/**
 * get_folder_info - 得到目標資料夾的詳細資料
 *
 * @param  {type} Folder 欲得到的目標資料夾
 * @return {type}        目標資料夾的詳細資料
 */
function get_folder_info(Folder) {
  if (Folder === void 0)
    throw new Error("Folder未給")

  var folder_info = {
    "FolderName": Folder.getName(),
    "FolderId": Folder.getId(),
    "FolderUrl": Folder.getUrl(),
    "FoldersDescription": Folder.getDescription()
  }
  return folder_info
}
//=================================================================================

/**
 * list_folder - 得到目標資料夾下所有資料夾的詳細資料
 *
 * @param  {Folder} Description_Folder  目標資料夾
 * @return {Array}           詳細資料陣列
 */
function list_folder(Description_Folder) {
  if (Description_Folder === void 0)
    throw new Error("Description_Folder未給")

  var Folders = Description_Folder.getFolders();
  var Folders_list = []
  while (Folders.hasNext()) {
    var Folder = Folders.next();
    Folders_list.push(get_folder_info(Folder))
  }
  return Folders_list
}
//=================================================================================

/**
 * clear_folders - 目標資料夾下所有資料夾塞入垃圾桶
 *
 * @param  {Folder} Description_Folder 目標資料夾
 * @return {Array}                   結果陣列
 */
function clear_folders(Description_Folder) {
  if (Description_Folder === void 0)
    throw new Error("Description_Folder未給")

  var Folders = Description_Folder.getFolders();
  while (Folders.hasNext()) {
    try {
      Folders.next().setTrashed(true);
    } catch (e) {
      return [false, e]
    }
  }
  return [true]
}
//=================================================================================

/**
 * clear_files - 目標資料夾下所有檔案塞入垃圾桶
 *
 * @param  {Folder} Description_Folder 目標資料夾
 * @return {Array}                    結果陣列
 */
function clear_files(Description_Folder) {
  if (Description_Folder === void 0)
    throw new Error("Description_Folder未給")

  var files = Description_Folder.getFiles();
  while (files.hasNext()) {
    try {
      files.next().setTrashed(true);
    } catch (e) {
      return [false, e]
    }
  }
  return [true]
}
//=================================================================================

/**
 * clear_files_by_mode - 依模式、時間、來源清理檔案
 *
 * @param  {Folder} Description_Folder 目標資料夾
 * @param  {String} mode               time、All、Line、Telegram
 * @param  {Number} time               間隔時間(單位：天)
 * @return {Array}                     結果
 */
function clear_files_by_mode(Description_Folder, mode, time) {

  if (Description_Folder === void 0)
    throw new Error("Description_Folder未給")
  if (mode === void 0)
    throw new Error("mode未給")

  var files = Description_Folder.getFiles();
  while (files.hasNext()) {
    try {
      var f = files.next()
      var ft = f.getLastUpdated().getTime()
      var fd = f.getDescription()
      var d = new Date();
      var difference = (d - ft) / 1000 / 60 / 60 / 24 //換算成"天"了

      if (mode == 'time') {
        if (time === void 0)
          throw new Error("time未給")
        if (difference > time) {
          f.setTrashed(true);
        } else if (time < 0) {
          throw new Error("time給錯了")
        }
      } else if (mode == 'All') {
        f.setTrashed(true);
      } else if (mode == 'Line') {
        if (fd == 'line') {
          f.setTrashed(true);
        }
      } else if (mode == 'Telegram') {
        if (fd == 'Telegram') {
          f.setTrashed(true);
        }
      } else {
        throw new Error("mode設定有誤!")
      }
    } catch (e) {
      return [false, e]
    }
  }
  return [true]
}
//=================================================================================

/**
 * copy_file - 複製檔案到目標資料夾
 *
 * @param  {file} file               目標檔案
 * @param  {Folder} destination_folder 目標資料夾
 * @return {Array}                    結果陣列
 */
function copy_file(file, destination_folder) {
  if (file === void 0)
    throw new Error("file未給")
  if (Description_Folder === void 0)
    throw new Error("destination_folder未給")

  try {
    file.makeCopy(destination_folder)
  } catch (e) {
    return [false, e]
  }
  return [true]
}
//=================================================================================
