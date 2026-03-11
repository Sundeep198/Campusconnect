const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');


const ExcelJS = require("exceljs");
const multer = require("multer");
const XLSX = require("xlsx");

const upload = multer({ storage: multer.memoryStorage() }); 
const app = express();

app.use(cors({
origin:"*",
methods:["GET","POST","PUT","DELETE"],
allowedHeaders:["Content-Type"]
}));
app.use(express.json());

// ✅ MySQL Connection (Promise Version)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_HOST?.includes("railway") 
      ? { rejectUnauthorized: false } 
      : undefined
});

(async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("✅ Database Connected Successfully");
  } catch (err) {
    console.error("❌ Database Connection Failed:", err);
  }
})();

app.get("/debug/tables", async (req,res)=>{
  try{
    const [rows] = await db.query("SHOW TABLES");
    res.json(rows);
  }catch(err){
    res.json(err);
  }
});

// ======================
// GET ROUTES
// ======================

app.get("/", (req,res)=>{
  res.send("Campus Connect API Running");
});

app.get('/students', async (req, res) => {
    try {

        const [rows] = await db.query(
        "SELECT studentID,studentName,username,password FROM students"
        );

        res.json(rows);

    } catch (err) {

        res.status(500).json({error: err.message});

    }
});

app.get('/staffs/list', async (req,res)=>{
const [rows]=await db.query("SELECT staffID,staffName FROM staffs")
res.json(rows)
})

app.get('/campus', async (req,res)=>{

try{

const [rows] = await db.query(
"SELECT name,lat,lng FROM campus_poi"
);

res.json(rows);

}catch(err){
res.status(500).json({error:err.message});
}

});

app.post("/campus/add", async (req,res)=>{

try{

const {name,lat,lng} = req.body;

await db.query(
"INSERT INTO campus_poi(name,lat,lng) VALUES(?,?,?)",
[name,lat,lng]
);

res.json({success:true});

}catch(err){

res.status(500).json({
success:false,
error:err.message
});

}

});

app.post("/campus/delete", async (req,res)=>{

try{

const {id} = req.body;

await db.query(
"DELETE FROM campus_poi WHERE id=?",
[id]
);

res.json({success:true});

}catch(err){

res.status(500).json({
success:false,
error:err.message
});

}

});

app.get('/staffs', async (req, res) => {
  try {

    const [rows] = await db.query(
      "SELECT staffID,staffName,designation,username,password FROM staffs"
    );

    res.json(rows);

  } catch (err) {

    res.status(500).json({error: err.message});

  }
});

app.get('/admin', async (req, res) => {
  try {

    const [rows] = await db.query(
      "SELECT adminID,adminName,username,password FROM admins"
    );

    res.json(rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({error: err.message});

  }
});

app.post('/subjects/add', async (req,res)=>{

try{

const {subjectID,subjectName,staffID} = req.body

await db.query(
"INSERT INTO subjects(subjectID,subjectName,staffID) VALUES(?,?,?)",
[subjectID,subjectName,staffID]
)

res.json({success:true})

}catch(err){

console.log(err)

res.json({success:false})

}

})

app.post('/subjects/update', async (req,res)=>{
try{

const {subjectID,subjectName,staffID} = req.body

await db.query(
"UPDATE subjects SET subjectName=?, staffID=? WHERE subjectID=?",
[subjectName,staffID,subjectID]
)

res.json({success:true})

}catch(err){
res.status(500).json({success:false,error:err.message})
}
})

app.post('/subjects/delete', async (req,res)=>{

try{

const {subjectID} = req.body;

await db.query(
"DELETE FROM subjects WHERE subjectID=?",
[subjectID]
);

res.json({success:true});

}catch(err){
res.status(500).json({success:false,error:err.message});
}

});

app.get('/marks', async (req,res)=>{

const [rows] = await db.query(`
SELECT
m.markID,
m.studentID,
m.subjectID,
m.staffID,
st.studentName,
sb.subjectName,
sf.staffName,
m.marks,
m.status
FROM marks m
JOIN students st ON m.studentID = st.studentID
JOIN subjects sb ON m.subjectID = sb.subjectID
JOIN staffs sf ON m.staffID = sf.staffID
`)

res.json(rows)

})


// ======================
// STUDENT ROUTES
// ======================

app.post('/students/add', async (req,res)=>{
try{

const {studentID,username,password,studentName}=req.body

await db.query(
"INSERT INTO students(studentID,username,password,studentName) VALUES(?,?,?,?)",
[studentID,username,password,studentName]
)

res.json({success:true})

}catch(err){
res.status(500).json({success:false,error:err.message})
}
})

app.post('/students/update', async (req,res)=>{
try{

const {studentID,username,password,studentName}=req.body

await db.query(
"UPDATE students SET username=?,password=?,studentName=? WHERE studentID=?",
[username,password,studentName,studentID]
)

res.json({success:true})

}catch(err){
res.status(500).json({success:false,error:err.message})
}
})

app.post('/students/delete', async (req,res)=>{
try{

const {studentID}=req.body

await db.query(
"DELETE FROM students WHERE studentID=?",
[studentID]
)

res.json({success:true})

}catch(err){
res.status(500).json({success:false,error:err.message})
}
})


// ======================
// MARKS ROUTES
// ======================

app.post('/marks/add', async (req,res)=>{
try{

const {studentID,subjectID,staffID,marks,status}=req.body

await db.query(
"INSERT INTO marks(studentID,subjectID,staffID,marks,status) VALUES(?,?,?,?,?)",
[studentID,subjectID,staffID,marks,status]
)

res.json({success:true})

}catch(err){
res.status(500).json({success:false,error:err.message})
}
})


app.post('/marks/update', async (req,res)=>{
try{

const {studentID,subjectID,status,notes,meeting}=req.body

await db.query(
"UPDATE marks SET status=?,notes=?,meeting=? WHERE studentID=? AND subjectID=?",
[status,notes,meeting,studentID,subjectID]
)

res.json({success:true})

}catch(err){
res.status(500).json({success:false,error:err.message})
}
})


app.post('/marks/updateMarks', async (req,res)=>{
try{

const {studentID,subjectID,staffID,marks}=req.body

await db.query(
"UPDATE marks SET marks=? WHERE studentID=? AND subjectID=? AND staffID=?",
[marks,studentID,subjectID,staffID]
)

res.json({success:true})

}catch(err){
res.status(500).json({success:false,error:err.message})
}
})


// ======================
// STAFF ROUTES
// ======================

app.post('/staff/availability',async(req,res)=>{

const {staffID,block,room,availability,date,startTime,endTime,duration}=req.body;

try{

await db.query(`
INSERT INTO staff_loc
(staffID,block,room,availability,date,startTime,endTime,duration)
VALUES (?,?,?,?,?,?,?,?)
`,[staffID,block,room,availability,date,startTime,endTime,duration]);

res.json({success:true});

}
catch(err){
console.log(err);
res.status(500).json({error:"DB error"});
}

});

app.get('/staff/location/:staffID',async(req,res)=>{

const staffID=req.params.staffID;

const [rows]=await db.query(`
SELECT s.staffName,l.block,l.room,l.availability,l.date,l.startTime,l.endTime
FROM staff_loc l
JOIN staffs s ON l.staffID=s.staffID
WHERE l.staffID=?
ORDER BY l.date DESC
LIMIT 1
`,[staffID]);

res.json(rows[0]);

});

app.post('/staffs/add', async (req,res)=>{
try{

const {staffID,staffName,designation,username,password}=req.body

await db.query(
"INSERT INTO staffs(staffID,staffName,designation,username,password) VALUES(?,?,?,?,?)",
[staffID,staffName,designation,username,password]
)

res.json({success:true})

}catch(err){
res.status(500).json({success:false,error:err.message})
}
})

app.post('/staffs/update', async (req,res)=>{
try{

const {staffID,staffName,designation,username,password} = req.body

await db.query(
"UPDATE staffs SET staffName=?,designation=?,username=?,password=? WHERE staffID=?",
[staffName,designation,username,password,staffID]
)

res.json({success:true})

}catch(err){
res.status(500).json({success:false,error:err.message})
}
})

app.post('/staffs/delete', async (req,res)=>{
try{

const {staffID} = req.body

await db.query(
"DELETE FROM staffs WHERE staffID=?",
[staffID]
)

res.json({success:true})

}catch(err){
res.status(500).json({success:false,error:err.message})
}
})

app.get('/subjects', async (req,res)=>{

try{

const [rows] = await db.query(`
SELECT 
s.subjectID,
s.subjectName,
s.staffID,
st.staffName
FROM subjects s
JOIN staffs st ON s.staffID = st.staffID
`);

res.json(rows);

}catch(err){
res.status(500).json({error:err.message});
}

});

app.get("/marks/template-full", async (req,res)=>{


let workbook = new ExcelJS.Workbook();
let sheet = workbook.addWorksheet("MarksEntry");

// Get students
let [students] = await db.query("SELECT studentID,studentName FROM students");

// Get all subjects from marks table
let [subjectRows] = await db.query("SELECT subjectID FROM subjects");
let subjects = subjectRows.map(r=>r.subjectID);

// Get all marks
let [marks] = await db.query("SELECT studentID,subjectID,marks FROM marks");

sheet.columns = [
{header:"Student Name", key:"name", width:20},
{header:"Student ID", key:"id", width:15},
{header:"Subject", key:"subject", width:20},
{header:"Marks", key:"marks", width:10}
];

students.forEach(student=>{
subjects.forEach(subject=>{

let existing = marks.find(m=>
m.studentID === student.studentID &&
m.subjectID === subject
);

sheet.addRow({
name: student.studentName,
id: student.studentID,
subject: subject,
marks: existing ? existing.marks : ""
});

});
});

sheet.views = [{state:'frozen', ySplit:1}];
res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);

res.setHeader(
  "Content-Disposition",
  "attachment; filename=marks-template.xlsx"
);
await workbook.xlsx.write(res);
res.end();

});

app.get("/marks/template-staff", async (req,res)=>{


let staffName = req.query.staffName;

if(!staffName){
return res.status(400).send("Staff required");
}

// Subjects handled by staff
let [subjectRows] = await db.query(
`SELECT s.subjectID 
 FROM subjects s
 JOIN staffs st ON s.staffID = st.staffID
 WHERE st.staffName=?`,
[staffName]
);

let subjects = subjectRows.map(r=>r.subjectID);

// Students
let [students] = await db.query(
"SELECT studentID,studentName FROM students"
);

// Marks of that staff
let [marks] = await db.query(
`SELECT m.studentID,m.subjectID,m.marks
 FROM marks m
 JOIN staffs s ON m.staffID=s.staffID
 WHERE s.staffName=?`,
[staffName]
);

let workbook = new ExcelJS.Workbook();
let sheet = workbook.addWorksheet("MarksEntry");

sheet.columns = [
{header:"Student Name", key:"name", width:20},
{header:"Student ID", key:"id", width:15},
{header:"Subject", key:"subject", width:20},
{header:"Marks", key:"marks", width:10}
];

students.forEach(student=>{
subjects.forEach(subject=>{

let existing = marks.find(m=>
m.studentID === student.studentID &&
m.subjectID === subject
);

sheet.addRow({
name: student.studentName,
id: student.studentID,
subject: subject,
marks: existing ? existing.marks : ""
});

});
});

sheet.views = [{state:'frozen', ySplit:1}];
res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);

res.setHeader(
  "Content-Disposition",
  "attachment; filename=marks-template.xlsx"
);
await workbook.xlsx.write(res);
res.end();

});



app.post("/marks/bulkUploadJSON", async (req,res)=>{

if(!req.body.data){
return res.status(400).json({error:"No data provided"});
}

const rows = req.body.data;

let success = 0;
let updated = 0;
let errorCount = 0;

for(const row of rows){

const {studentID,subjectID,marks,staffID} = row;

if(!studentID || !subject || marks==null){
errorCount++;
continue;
}

const [existing] = await db.query(
"SELECT * FROM marks WHERE studentID=? AND subjectID=? AND staffID=?",
[studentID,subject,staffName]
);

if(existing.length > 0){

await db.query(
"UPDATE marks SET marks=? WHERE studentID=? AND subjectID=? AND staffID=?",
[marks,studentID,subject,staffName]
);

updated++;

}else{

await db.query(
"INSERT INTO marks(studentID,subjectID,staffID,marks,status) VALUES(?,?,?,?, 'Pending')",
[studentID,subjectID,marks,staffName]
);

success++;

}
}

res.json({
successCount:success,
updateCount:updated,
errorCount:errorCount
});

});

// ======================
// START SERVER
// ======================

app.use((err, req, res, next) => {
console.error("Unhandled Error:", err);
res.status(500).json({
success:false,
error:"Internal Server Error"
});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});