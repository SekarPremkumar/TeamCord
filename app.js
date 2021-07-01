var express = require('express');
var socket = require('socket.io');
var bodyParser = require('body-parser');
const _ = require("lodash");
const mongoose = require('mongoose');

// App setup
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

var server = app.listen(4000, function(){
    console.log('listening for requests on port 4000,');
});

// Static files
app.use(express.static('public'));

//mongoose setup
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);


// mongoose data entry
const item1 = new Item({
  name: "welcome"
});

const item2 = new Item({
  name: "Hit + button to add"
});

const item3 = new Item({
  name: "<-- hit it to delete"
});

const defaultItems = [item1, item2, item3];

//schema and model for list of pages
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model('List', listSchema);


//data entry end here








//get route

app.get("/",function(req,res){
  res.sendFile(__dirname + "/public/main.html");
});


//chat room

app.get("/chat",function(req,res){
      res.sendFile(__dirname + "/public/chat.html");
});

var io = socket(server);
io.on('connection', (socket) => {

    console.log('made socket connection', socket.id);

    // Handle chat event
    socket.on('chat', function(data){
        // console.log(data);
        io.sockets.emit('chat', data);
    });

    // Handle typing event
    socket.on('typing', function(data){
        socket.broadcast.emit('typing', data);
    });

});

app.post("/gotochat",function(req,res){
  res.redirect("/chat");
})

//chat room ends


//todolist
app.post("/gototodo",function(req,res){
  res.redirect("/todolist");
});



// get function
// home route
app.get("/todolist", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added default");
        }
        res.redirect("/todolist");
      });
    } else {
      res.render("list", {
        listTitle: "GoalOfTheDay",
        newlistitem: foundItems
      });
    }

  });

});


//dynamic routing
app.get("/todolist/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);


  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // create a newlist
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/todolist"+customListName);
      } else {
        res.render("list",{listTitle:foundList.name,  newlistitem: foundList.items} );
      }
    }
  })

});







// post method
// Home route
app.post("/todo", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if (listName === "GoalOfTheDay"){
    item.save()
    res.redirect("/todolist");
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/todolist/"+listName);
    });
  }

});

app.post("/part",function(req,res){

  const namepar=_.capitalize(req.body.parname);
  List.findOne({name: namepar}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // create a newlist
        const list = new List({
          name: namepar,
          items: defaultItems
        });
        list.save();
        res.redirect("/todolist/"+namepar);
      } else {
        res.render("list",{listTitle:foundList.name,  newlistitem: foundList.items} );
      }
    }
  })
});
//delete route
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkItem;
  const listName = req.body.listName

  if (listName === 'GoalOfTheDay'){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checkrd item");
        res.redirect("/todolist");
      }
    });
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundlist){
      if (!err){
        res.redirect("/todolist/"+ listName);
      }
    });
  }

});


// listen function



//todolist ends



                      // About
app.get("/about",function(req,res){
  res.render("about");
});
