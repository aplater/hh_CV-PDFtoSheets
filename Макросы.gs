/**
 * Removes duplicate rows from the current sheet keeping the last duplicate intact
 */
function removeDuplicates() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var newData = [];
  for (var i in data) {
    var row = data[i];
    var duplicate = false;
    for (var j in newData) {
      if (row[0] == newData[j][0]) {
        duplicate = true;
        newData.splice(j,1,row)
      }
    }
    if (!duplicate) {
      newData.push(row);
    }
  }
  sheet.clearContents();
  sheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
}

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('hh')
      .addItem('Импортировать новые записи', 'importCSV')
      .addItem('Удалить повторяющиеся', 'removeDuplicates')
      .addItem('Считать pdf резюме','pdfCVread')
      .addToUi();
}

function importCSV() {
  var html = HtmlService.createHtmlOutputFromFile('Index');
  SpreadsheetApp.getUi()
      .showModalDialog(html, 'Выберите файл database.csv:');
}