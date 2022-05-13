var express = require('express');
var router = express.Router();
require("dotenv").config();


const { API_KEY, BASE } = process.env;


var Airtable = require('airtable');
var base = new Airtable({apiKey: API_KEY}).base(BASE);


/* GET students listing. */
router.post('/student', async function(req, res) {

  const name = req.body.name;
  console.log({ name })

  // base('Students').select({
  //   view: 'Grid view',
  //   filterByFormula: FIND(name, "fld5ckhQnYC5iGlRR")
  // }).firstPage(function(err, records) {
  //   if (err) { console.error(err); return; }
  //   console.log({records})
  //   res.statusCode = 200;
  //   res.setHeader('Content-Type', 'application/json');
  //   res.send(records);
  // });

  // We query the Student base to get the list of 
  // classes a student belongs to

  let classes;

  const promise = new Promise(function(resolve, reject) {
    base('Students').select({
      view: 'Grid view',
      filterByFormula: `SEARCH(LOWER("${name}"), LOWER(Name))`
    }).firstPage(function(err, record) {
        if (err) { 
          reject(console.error(err)); 
          return; 
        }
        //console.log("Students", record )
        classes = record[0].fields.Classes;
        resolve(classes)
    })
  })
  
  promise.then(async (classes) => {

    // Query the Classes base to get a list of 
    // students ID in each class
    console.log("1", {classes})
    let classArray = []
    
    const classesTable = base("Classes");

    // A little trick here using a while loop to 
    // execute a synchronous promise.
    let i = 0;
    while(i < classes.length){
      const classesRecord = await classesTable.find(classes[i])
      classArray.push(classesRecord.fields)
      console.log(i, classes.length)
      if(i + 1 == classes.length){
        console.log({classArray})
        return classArray
      }
      i++
    }

  })
  .then(async(classArray) => {

    // Query Students base by ID to get names of students
  
    let i = 0;
    
    const studentsTable = base("Students");
    while(i < classArray.length) {

      let j = 0;
      let student = classArray[i].Students;
      while(j < student.length){
        console.log('Student ID ',student[j])
        const studentsRecord = await studentsTable.find(student[j]);
        const studentName = studentsRecord.fields.Name;
        classArray[i].Students[j] = studentName;
        if(j + 1 == student.length){
          console.log('classArray ',classArray[i])
        }
        j++
      }
      
      if(i + 1 == classArray.length){
        console.log("3 ",{classArray})
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.send(classArray);
      }
      i++
    }
    
  })
  .catch(err => console.log(err))

  

  
  
   
  // let filter = classes.forEach((classid) => `RECORD_ID() = ${classid}`)
  // base('Classes').select({
  //   view: 'Grid view',
  //   filterByFormula: `AND(${filter})`
  // }).firstPage(function(err, records) {
  //     if (err) { console.error(err); return; }
  //     console.log("Students ids", records )
  //     // classes.forEach(function(classId) {
  //     //     const query = records.filter(record => record.id == classId)[0];
  //     //     console.log("Classes", query.fields )
  //     //     classArray.push(query.fields)
  //     //     console.log('1', {classArray});
  //     // });

  // });

  // let studentsArray = [];
  // base('Students').select({
  //   view: 'Grid view',
  // }).firstPage(function(err, records) {
  //     if (err) { console.error(err); return; }
  //     console.log('2 ',{records});
  //     console.log('2 ',{classArray});
  //     classArray.Students.forEach(function(id, index) {
  //       const query = records.filter(record => record.id == id)[0];
  //       //classArray.Students[index] = query.fields.Name;
  //       studentsArray.push(query.fields.Name)
  //       //console.log('2 ',{classArray});
  //       console.log({studentsArray});
  //    });
  // });

  
  
});



module.exports = router;
