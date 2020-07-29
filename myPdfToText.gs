function getCVfromPDF(){
  var cvsDb = getArrayOfNames();
  // open a folder with cvs and get all the files inside
  var folder = DriveApp.getFoldersByName(cvsDb[cvsDb.length-1]).next();
  var files = folder.getFiles();
  
  // go through the files and pick only the pdf ones
  while (files.hasNext()){
    var file = files.next();
    
    // get all the pdf names in an array, to compare with the names in the database
    if (file.getName().search('.pdf') != -1){
      var fileName = file.getName().split('.')[0];   
      if (cvsDb.indexOf(fileName) == -1 && fileName.slice(0,1) != '_'){
        var text = convertToText(file);
        SpreadsheetApp.getActive().getSheetByName(cvsDb[cvsDb.length-1]).appendRow(parseCV(text, file));
      }
      if (fileName.search('(1)') != -1){
        removeDuplicates();
        var oldFile = DriveApp.getFoldersByName(cvsDb[cvsDb.length-1]).next().getFilesByName(fileName.replace(' (1)','')+'.pdf').next();
        oldFile.setTrashed(true);
        file.setName(file.getName().replace(' (1)',''))
      }
    }
  }
}


// get an array of all CV names from existing ss database
function getArrayOfNames(){
  var ss = SpreadsheetApp.getActiveSheet();
  var end = ss.getLastRow();
  var range = ss.getRange(ss.getName() + "!A2:A" + String(end));
  range = range.getValues().join().split(',');
  range.push(ss.getName());
  return range;
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


function parseCV(text, file){
  text = text.split('\n')
  
  var name
  var i = 0;
  if (text[i].slice(0,6)=='Отклик'){i += 1}
  if (text[i].slice(0,3)=='ФИО'){
    name = 'ФИО не указано';
    file.setName('_' + file.getName());
    }
  else {name = text[i].slice(0,text[i].length-1)}
  if (name.search('ё') != -1){
    file.setName('_' + file.getName());
  }
  
  var link = file.getUrl();
  
  i += 1;
  var birth = text[i].split(' ');
  if (birth.length > 2) {birth = birth.slice(-4).join(' ')}
  else {birth = ''}
  
  i += 1;
  var phone,  mail;
  if (text[i].search("7 ") != -1){phone = "'"+text[i].split(' ').slice(0,3).join('')}
  else {phone = ''}
  if (text[i].search('@') != -1){
    var left = text[i].split('@')[0].split(' ')
    mail = left[left.length-1] + '@' + text[i].split('@')[1].split(' ')[0]
  }
  else {mail = ''}
  
  i += 1;
  var city = text[i].split(' ');
  if (city[0] == 'Проживает:'){
    city = city.slice(1,city.indexOf('Гражданство:')).join(' ')
  }
  else {city = ''}
  
  var trips = text[i].toLowerCase().indexOf('готов');
  if (text[i].slice(trips-3,trips-1) == 'Не') {trips = text[i].slice(trips-3)}
  else {trips = text[i].slice(trips)}
  
  text = text.slice(i+1)
  
  // cleaning the text from page breaks
  for (var j=i+1;j<text.length;j++){
    if (text[j].split(' ')[0] == name.split(' ')[0] || text[j].slice(0,8) == '• Резюме'){
      text = text.slice(0,j).concat(text.slice(j+1))
    }
  }
  
  var drivingLicense, income, jobName, experience, education, comment;
  
  for (var j=0;j<text.length;j++){
    if (text[j].slice(0,5) == 'Права'){drivingLicense = text[j]}
    if (text[j].slice(-5,-2) == 'руб' && text[j].length < 15){income = text[j]}
    if (text[j].slice(0,8) == 'Желаемая'){jobName = text[j+1]}
    if (text[j].slice(0,13) == 'Опыт работы —'){var expStart = j}
    if (text[j].slice(0,12) == 'Образование '){var eduStart = j}
    if (text[j].slice(0,16) == 'Ключевые навыки '){var eduEnd = j}
    if (text[j].slice(0,20) == 'Комментарии к резюме'){var commStart = j}
    if (text[j].slice(0,28) == 'История общения с кандидатом'){var commEnd = j}
  }
  
  if (expStart && eduStart){experience = text.slice(expStart, eduStart).join('\n')}
  if (eduStart && eduEnd){education = text.slice(eduStart + 1, eduEnd).join('\n')}
  if (commStart && commEnd){comment = text.slice(commStart + 1, commEnd).join('\n')}
  
  if (!experience){experience=''}
  if(!comment){comment=''}
  if(!drivingLicense){drivingLicense=''}
  if(!income){income=''}
  
  return [name,city,link,jobName,birth,mail,phone,comment,trips,drivingLicense,education,experience,income];
}