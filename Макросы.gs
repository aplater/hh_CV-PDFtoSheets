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
      .addItem('Удалить повторяющиеся', 'removeDuplicates')
      .addItem('Занести новые PDF в базу','getCVfromPDF')
      .addToUi();
}