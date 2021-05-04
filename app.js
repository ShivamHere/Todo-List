const express = require('express');
const app = express();
const mongoose = require('mongoose');
const _ = require('lodash');

const PORT = process.env.PORT || 3300;

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.json());
app.set('view engine', 'ejs');

const newDbName = "/todolistDB";
const db = "mongodb://localhost:27017"+newDbName; //for local database.

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
    if (err) console.error(err);
    else console.log("Connected to the mongodb");
});
mongoose.set('useFindAndModify', false);

const itemSchema = new mongoose.Schema({
    name: String
});
const customListSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
})
const Item = mongoose.model("Item", itemSchema);
const CustomList = mongoose.model("CustomList", customListSchema);

app.get('/', (req, res) => {
    const date = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const dayHeading = date.toLocaleDateString();
    Item.find({}, (err, list) => {
        if (err) console.log(err);
        else res.render('list.ejs', {
            dayData: dayHeading,
            items: list
        });
    });
});
app.get('/:customListName', (req, res) => {
    const listName = _.capitalize(req.params.customListName);
    CustomList.findOne({name: listName}, (err, list) => {
        if (err) console.log(err);
        else {
            if (list == null) {
                const item1 = new Item({
                    name: `Welcome to ${listName}`
                });
                const item2 = new Item({
                    name: `Click on + to add.`
                });
                const item3 = new Item({
                    name: `<- Click here to delete.`
                });
                const newList = new CustomList({
                    name:listName,
                    items:[item1,item2,item3]
                });
                newList.save().then((err)=>{
                    if(err) console.log(err);
                    else    console.log(`${listName} created with default items.`);
                });
                res.redirect(`/${listName}`);
            }
            else{
                res.render('customList.ejs', {cusListName: listName,cusListItems: list.items});
            }
        }
    })
})

app.post('/', (req, res) => {
    const item = new Item({
        name: req.body.item
    });
    item.save().then(() => console.log(`${req.body.item} was added to list.`));
    res.redirect('/');
});
app.post('/delete', (req, res) => {
    Item.deleteOne({_id: req.body.checkbox}, (err) => {
        if (err) console.log(err);
        else console.log(`${req.body.checkbox} deleted.`)
    });
    res.redirect('/');
});
app.post('/:customListName',(req,res)=>{        //We could have used only one ejs file, handling in post('/')
    const listName = _.capitalize(req.params.customListName);
    console.log(`Inside post function for ${listName}`);
    CustomList.findOne({name: listName}, (err, list) => {
        if(err) console.log(err);
        else {
            const item = new Item({
                name:req.body.item
            });
            list.items.push(item);
            list.save().then(()=>console.log(`${req.body.item} is added in ${list.name}.`));
        }
    });
    res.redirect(`/${listName}`);
});
app.post('/:customListName/delete',(req,res)=>{
    const listName = req.params.customListName;
    console.log(`Inside post-delete function for ${listName}`);
    const itemId = req.body.checkbox;
    /*CustomList.findOne({name: listName}, (err, list) => {
        if(err) console.log(err);
        else {
            const idx = list.items.findIndex(({_id})=> _id==itemId);
            console.log(itemId, idx);
            list.items.splice(idx,1);
            list.save().then(()=>console.log(`${itemId} is removed from ${list.name}.`));
        }
    });*/
    CustomList.findOneAndUpdate({name:listName}, {$pull: {items: {_id:itemId}}}, (err,foundList)=>{
        if(err) console.log(err);
        else    console.log(`${itemId} is removed from ${listName}.`);
    });
    res.redirect(`/${listName}`);
});

app.listen(PORT, () => {
    console.log("Server started at port", PORT);
});
