var express = require('express');
var router = express.Router();
require("dotenv").config();


const { API_KEY, BASE } = process.env;


var Airtable = require('airtable');
var base = new Airtable({apiKey: API_KEY}).base(BASE);


/* GET students listing. */
router.post('/student', async function(req, res) {

  const name = req.body.name;

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
        classes = record[0].fields.Classes;
        resolve(classes)
    })
  })
  
  promise.then(async (classes) => {

    // Query the Classes base to get a list of 
    // students ID in each class
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
        return classArray
      }
      i++
    }

  })
  .then(async(classArray) => {

    // Query Students base by ID to get names of students

    // This nested while loop will not perform well in production, as it executes in O(n2) time complexity.
    // I couldn't figure out the filterByFormula functions that would use the student IDs to 
    // get students names with one API call. Would love to learn how it was done in that video.
  
    let i = 0;
    
    const studentsTable = base("Students");
    while(i < classArray.length) {

      let j = 0;
      let student = classArray[i].Students;
      while(j < student.length){
        const studentsRecord = await studentsTable.find(student[j]);
        const studentName = studentsRecord.fields.Name;
        classArray[i].Students[j] = studentName;
        j++
      }
      
      if(i + 1 == classArray.length){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.send(classArray);
      }
      i++
    }
    
  })
  .catch(err => console.log(err))
  
});



module.exports = router;
