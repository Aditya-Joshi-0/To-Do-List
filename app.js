const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your To Do List!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const day = date.getDate();

app.get("/", function (req, res) {

  Item.find({}, function (error, results) {
    if (results.length === 0) {
      Item.insertMany(defaultItems, function (error) {
        if (error) {
          console.log(error);
        } else {
          console.log("Dafault items were added successfully to the DB.");
        };
        res.redirect("/");
      }); 
    } else {
      res.render("list", { listTitle: "Today", newListItems: results , currentDay : day });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items, currentDay : day })
      };
    };
  })
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name : listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  } 
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox.trim();
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (error) {
      if (!error) {
        console.log("Successfully removed the checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name : listName},
      {$pull : {items : {_id : checkedItemId}}},
      function(err, foundList){
        if (!err) {
          res.redirect("/" + listName);
        }
    })
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started successfully.");
});