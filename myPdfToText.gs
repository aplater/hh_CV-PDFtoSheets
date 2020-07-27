function getCVfromPDF(){
  // open a folder with cvs and get all the files inside
  var folder = DriveApp.getFoldersByName('hh_stealer').next();
  var files = folder.getFiles();
  
  // go through the files and pick ony the pdf ones
  while (files.hasNext()){
    var file = files.next();
    var cvsDb = cvsDb || getArrayOfNames();
    var cvsDr = cvsDr || [];
    
    // get all the pdf names in an array, to compare with the names in the database
    if (file.getName().search('.pdf') != -1){
      fileName = file.getName().split('.')[0];
      if (cvsDb.indexOf(fileName) == -1){
        text = convertToText(file);
//        Logger.log(text);
      }
    }
  }
}


// get an array of all CV names from existing ss database
function getArrayOfNames(){
  var ss = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/17nBR8sHOoHBaUSYrMx7LzbEDV9h_71XtxodsidEbzxo/edit#gid=0');
  var end = ss.getLastRow();
  var range = ss.getRange("Лист1!A2:A" + String(end));
  
  // get all names from the range into an array and crop them to only have first and last names
  for (i=0; i<end-1; i++){
    var cvsDb = cvsDb || [];
    var name = range.getValues()[i][0];
    cvsDb.push(name); 
  }
  return cvsDb;
}


function convertToText(pdf) {
  var fileBlob = pdf.getBlob();
  var resource = {
    title : fileBlob.getName().replace('.pdf', '.gdoc'),
    mimeType : fileBlob.getContentType(),
    parents : [{"id":pdf.getParents().next().getId()}]
  };
  var options = {
    ocr : true,
    ocrLanguage : 'ru'
  };
  var docFile = Drive.Files.insert(resource, fileBlob, options);
  var docDoc = DocumentApp.openById(docFile.id);
  var text = docDoc.getBody().getText();
  Drive.Files.remove(docFile.id);
  return text 
}