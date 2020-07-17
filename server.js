const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const {ObjectId} = require('mongodb');
const cors = require('cors')
const myDB = require('./connection');

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
  });
myDB(async (client) => {
  const myDataBase = await client.db('myproject').collection('users');
  console.log("DB connected...")
  app.route('/api/exercise/new-user').post((req,res) => {
    // console.log(req.body)
    myDataBase.insertOne({username: req.body.username}).then((mes) => {
      // console.log(mes.ops)
      if (mes.insertedCount !== 1) { return console.log("DB new-user Error")}
      return res.json(mes.ops[0]);
    });
  })
  app.route('/api/exercise/users').get(async (req,res)=> {
    const myArrayOfUsers = await myDataBase.find().toArray();
    res.json(myArrayOfUsers)
  })
  app.route('/api/exercise/add').post(async (req,res) => {
    let {userId, description, duration, date} = req.body;
    date = date ? (new Date(date)).toDateString() : (new Date()).toDateString();
    const newDoc = await myDataBase.findOneAndUpdate({_id: new ObjectId(userId)}, {$set: {description: description , duration: Number(duration), date: date}}, {returnOriginal: false});
    // console.log(newDoc.value)
    res.json(newDoc.value)
  })
  app.route('/api/exercise/log').get(async (req,res)=> {
    console.log(req.query)
    if (req.query.from) {
      res.json({log: new Array(2)})
    } else if(req.query.limit) {
      res.json({log: new Array(req.query.limit)});
    }
    const userLog = await myDataBase.find({_id: new ObjectId(req.query.userId)}).toArray();
    console.log(userLog);
    res.json({log: userLog});
  })

//-----------------------------

  // Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})
  const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
}).catch((e) => {
  console.log("ERROR with DB")
});




