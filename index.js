import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

//middleware usage
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("static")); // Serve static files from the "static" directory

//connect to database
const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"TODOLIST",
    password:"tzl713714",
    port:5432,
  });
db.connect();

async function getTodayList(){
  const result = await db.query("SELECT * FROM daily_agenda");
  let today_agenda = result.rows;  // No need to assign an empty array

  const today = getTodayDate();  // Assuming this returns 'YYYY-MM-DD'
  console.log(today)
  for (let i = today_agenda.length - 1; i >= 0; i--) {
      const utcDate = new Date(today_agenda[i].date);  // Get date in UTC
      const localDate = utcDate.toLocaleDateString('en-CA');  // Convert to local date string in 'YYYY-MM-DD' format
      console.log(localDate);
      if (today !== localDate) {
          today_agenda.splice(i, 1);  // Remove the agenda if it doesn't match today
    }
}

  return today_agenda;
}

function getTodayDate(){
  const d = new Date();
  const year = d.getFullYear();
  let month = d.getMonth() + 1; // Use let for month since it might be reassigned
  let day = d.getDate(); // Use let if you plan to modify day too

  if (month < 10) {
    month = `0${month}`; // Add leading zero if month is less than 10
  }

  if (day < 10) {
    day = `0${day}`; // Add leading zero if day is less than 10 (if needed)
  }

  const today_date = `${year}-${month}-${day}`;
  return today_date;
}

function getThisWeekDate() {
  let DateInThisWeek = [];
  const d = new Date();
  const year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  let weekday = d.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

  // Adjust weekday so Monday = 0, ..., Sunday = 6
  weekday = (weekday === 0) ? 6 : weekday - 1;

  // Get the Monday of the current week
  const mondayDate = new Date(d);
  mondayDate.setDate(day - weekday);

  // Loop through the week (Monday to Sunday)
  for (let i = 0; i < 7; i++) {
    const tempDate = new Date(mondayDate);
    tempDate.setDate(mondayDate.getDate() + i);

    let tempMonth = tempDate.getMonth() + 1; // Months are 0-based
    let tempDay = tempDate.getDate();

    // Format the date as 'YYYY-MM-DD'
    const formattedDate = `${tempDate.getFullYear()}-${tempMonth.toString().padStart(2, '0')}-${tempDay.toString().padStart(2, '0')}`;
    
    DateInThisWeek.push(formattedDate);
  }

  return DateInThisWeek;
};

async function getThisWeekToDO() {
  const DateInThisWeek = getThisWeekDate();  // Assuming this returns an array of dates like ['2024-09-16', '2024-09-17', ...]
  let weekToDO = [];

  for (let date of DateInThisWeek) {
    // Query the database for tasks matching the specific date
    const result = await db.query("SELECT * FROM daily_agenda WHERE date = $1", [date]);
    let DailyToDo = result.rows;
    
    // Push the daily to-do list for that date into the weekToDO array
    weekToDO.push(DailyToDo);
  }

  return weekToDO;
}

app.get("/",async(req,res)=>{
    const today_agenda = await getTodayList();
    console.log(today_agenda);
    res.render("index.ejs",{
      today_agenda:today_agenda
    });
});

app.get("/daily",async(req,res)=>{
  const today_agenda = await getTodayList();
  const DateInThisWeek=getThisWeekDate();
  // console.log(DateInThisWeek);
  const ThisWeekToDO=await getThisWeekToDO()
  // console.log(ThisWeekToDO)
  res.render("daily.ejs",{
    today_agenda:today_agenda,
    DateInThisWeek:DateInThisWeek,
    ThisWeekToDo:ThisWeekToDO
  });
});

app.post("/add", async(req, res) => {
  const to_do = req.body.to_do;
  const date = req.body.Date;
  await db.query("INSERT INTO daily_agenda (to_do,date) VALUES ($1,$2)",[to_do,date]);
  res.redirect("/daily");
});

app.post("/delete", async(req, res) => {
  const id = req.body.deleteItemId;
  await db.query("DELETE FROM daily_agenda WHERE id=$1",[id]);
  res.redirect("/daily");
});

app.post("/edit",async(req,res)=>{
  const to_do = req.body.to_do;
  const id = req.body.id;
  await db.query("UPDATE daily_agenda SET to_do=$1 WHERE id=$2",[to_do,id]);
  res.redirect("/daily");
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});