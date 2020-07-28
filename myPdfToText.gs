function getCVfromPDF(){
  var cvsDb = getArrayOfNames();
  // open a folder with cvs and get all the files inside
  var folder = DriveApp.getFoldersByName('hh_stealer').next();
  var files = folder.getFiles();
  
  // go through the files and pick only the pdf ones
  while (files.hasNext()){
    var file = files.next();
    
    // get all the pdf names in an array, to compare with the names in the database
    if (file.getName().search('.pdf') != -1){
      var fileName = file.getName().split('.')[0];   
      if (cvsDb.indexOf(fileName) == -1 && fileName.slice(0,1) != '_'){
        var text = convertToText(file);
        parseCV(text, file);
      }
    }
  }
}


// get an array of all CV names from existing ss database
function getArrayOfNames(){
  var ss = SpreadsheetApp.getActiveSheet();
  var end = ss.getLastRow();
  var range = ss.getRange(ss.getName() + "!A2:A" + String(end));
  
  // get all names from the range into an array
  for (var i=0; i<end-1; i++){
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


function parseCV(text, file){
  text = text.split('\n')

  // name
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
  
  // cleaning the text from page breaks
  for (var j=i+1;j<text.length;j++){
    if (text[j].split(' ')[0] == name.split(' ')[0] || text[j].slice(0,8) == '• Резюме'){
      text = text.slice(0,j).concat(text.slice(j+1))
    }
  }
  
  // link
  var link = file.getUrl();
  
  // birth
  i += 1;
  var birth = text[i].split(' ');
  if (birth.length > 2) {birth = birth.slice(-4).join(' ')}
  else {birth = ''}
  
  // phone and mail
  i += 1;
  var phone,  mail;
  if (text[i].search("7 ") != -1){phone = "'"+text[i].split(' ').slice(0,3).join('')}
  else {phone = ''}
  if (text[i].search('@') != -1){
    var left = text[i].split('@')[0].split(' ')
    mail = left[left.length-1] + '@' + text[i].split('@')[1].split(' ')[0]
  }
  else {mail = ''}
  
  // trips
  i += 1;
  var trips = text[i].toLowerCase().indexOf('готов');
  if (text[i].slice(trips-3,trips-1) == 'Не') {trips = text[i].slice(trips-3)}
  else {trips = text[i].slice(trips)}
  
  // driving license
  i += 1;
  var drivingLicense;
  for (var j=i;j<text.length;j++){
    if (text[j].slice(0,5) == 'Права'){
      drivingLicense = text[j];
      break;
    }
    else {drivingLicense=''}
  }
  
  // income
  var income;
  for (var j=i;j<text.length;j++){
    if (text[j].slice(-5,-2)=='руб' && text[j].length < 15){
      income = text[j]; 
      break
    }
    else {income = ''}
  }
  
  // job name
  var jobName;
  for (var j=i;j<text.length;j++){
    if (text[j].slice(0,8)=='Желаемая'){jobName = text[j+1]; break}
    else {jobName = ''}
  }
  
  // experience
  var experience;
  for (var j=i;j<text.length;j++){
    if (text[j].slice(0,13) == 'Опыт работы —'){var start1 = j}
    if (text[j].slice(0,12) == 'Образование '){var end1 = j}
  }
  if (start1 && end1){
    experience = text.slice(start1, end1).join('\n');
  }
  else {experience = "Нет опыта"}
  
  // education
  var education;
  for (var j=i;j<text.length;j++){
    if (text[j].slice(0,12) == 'Образование '){var start2 = j}
    if (text[j].slice(0,16) == 'Ключевые навыки '){var end2 = j}
  }
  if (start2 && end2){
    education = text.slice(start2 + 1, end2).join('\n');
  }
  else {education = ""}
  
  // comment
  var comment
  for (var j=i;j<text.length;j++){
    if (text[j].slice(0,20) == 'Комментарии к резюме'){var start3 = j}
    if (text[j].slice(0,28) == 'История общения с кандидатом'){var end3 = j}
  }
  if (start3 && end3){
    comment = text.slice(start3 + 1, end3).join('\n');
  }
  else {comment = ""}
  
  // adding info to spreadsheet
  var sheet = SpreadsheetApp.getActiveSheet();
  sheet.appendRow([name,'',link,jobName,birth,mail,phone,comment,trips,drivingLicense,education,experience,income]);
}