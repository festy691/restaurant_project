const express = require('express');

const path = require('path');

const {Client} = require("pg");

const uuid = require('uuid');

const nodemailer = require('nodemailer');

const multer = require('multer');
const { user } = require('pg/lib/defaults');

const app = express();

var thisFoodId;
var thisCategoryId;
var thisUserId;
var thisOrderId;
var thisCartId;

const smtpTransport = nodemailer.createTransport(
    {
        host: 'localhost',
        secure: false,
        port: process.env.PORT || 8000
    },
    {
    service: "Gmail",
    auth: {
        user: "mockexams101@gmail.com",
        pass: "Mock2019"
    }
});

var rand,mailOptions,host,link;


const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './foodImages/');
    },
    filename: function(req, file, cb){
        //cb(null, new Date().toISOString() + file.originalname);
        thisFoodId = uuid.v4();
        cb(null, thisFoodId + file.originalname);
    }
});

const upload = multer({storage: storage});

const catStorage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './categoryImages/');
    },
    filename: function(req, file, cb){
        //cb(null, new Date().toISOString() + file.originalname);
        thisCategoryId = uuid.v4();
        cb(null, thisCategoryId + file.originalname);
    }
});

const uploadCatImg = multer({storage: catStorage});

const profStorage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './profileimages/');
    },
    filename: function(req, file, cb){
        //cb(null, new Date().toISOString() + file.originalname);
        thisUserId = uuid.v4();
        cb(null, thisUserId + file.originalname);
    }
});

const uploadProfImg = multer({storage: profStorage});

app.use('/foodImages', express.static('foodImages'));
app.use('/categoryImages', express.static('categoryImages'));
app.use('/profileImages', express.static('profileImages'));
app.use(express.json());

//Initializing the database client
const client = new Client({
    "user":"postgres",
    "password": "root",
    "host": "localhost",
    "port": 5432,
    "database": "postgres"
});

//calling a function that conects to the database
start()
async function start() {
    await connect();
    await createSchema();
    await createFoodTable();
    await createCategoryTable();
    await createUserTable();
    await createCartTable();
    await createOrderTable();
}

//this function performs the connection to the database
async function connect(){
    try {
        await client.connect();
    } catch (e) {
        console.log(`Failed to connect ${e}`);
    }
}

//this function creates the new schema
async function createSchema(){
    try {
        await client.query(
            `CREATE SCHEMA IF NOT EXISTS restaurant_db
            AUTHORIZATION postgres;`
        );
    } catch (error) {
        console.log(error);
    }
}

//this function creates the food table
async function createFoodTable(){
    try {
        await client.query(
            `CREATE TABLE IF NOT EXISTS restaurant_db.foods
            (
                food_name character varying(35) COLLATE pg_catalog."default" NOT NULL,
                food_category character varying COLLATE pg_catalog."default" NOT NULL,
                food_price integer NOT NULL,
                food_details character varying COLLATE pg_catalog."default" NOT NULL,
                food_id uuid NOT NULL,
                food_image character varying COLLATE pg_catalog."default" NOT NULL,
                CONSTRAINT foods_pkey PRIMARY KEY (food_id)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;
            
            ALTER TABLE restaurant_db.foods
                OWNER to postgres;`
        );
    } catch (error) {
        console.log(error);
    }
}

//this function creates the user table
async function createUserTable(){
    try {
        await client.query(
            `CREATE TABLE IF NOT EXISTS restaurant_db.user
            (
                user_id uuid NOT NULL,
                user_email character varying COLLATE pg_catalog."default" NOT NULL,
                user_name character varying COLLATE pg_catalog."default",
                user_phone character varying COLLATE pg_catalog."default",
                user_city character varying COLLATE pg_catalog."default",
                user_address character varying COLLATE pg_catalog."default",
                user_password character varying COLLATE pg_catalog."default" NOT NULL,
                user_level character varying COLLATE pg_catalog."default",
                user_image character varying COLLATE pg_catalog."default",
                user_active boolean,
                CONSTRAINT user_pkey PRIMARY KEY (user_id),
                CONSTRAINT user_user_email_key UNIQUE (user_email)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;
            
            ALTER TABLE restaurant_db.user
                OWNER to postgres;`
        );
    } catch (error) {
        console.log(error);
    }
}

//this function creates the category table
async function createCategoryTable(){
    try {
        await client.query(
            `CREATE TABLE IF NOT EXISTS restaurant_db.category
            (
                category_id uuid NOT NULL,
                category_name character varying(20) COLLATE pg_catalog."default" NOT NULL,
                category_image character varying COLLATE pg_catalog."default",
                CONSTRAINT category_pkey PRIMARY KEY (category_id)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;
            
            ALTER TABLE restaurant_db.category
                OWNER to postgres;`
        );
    } catch (error) {
        console.log(error);
    }
}

//this function creates the cart table
async function createCartTable(){
    try {
        await client.query(
            `CREATE TABLE IF NOT EXISTS restaurant_db.cart
            (
                cart_id uuid NOT NULL,
                cart_details json NOT NULL,
                user_id uuid NOT NULL,
                CONSTRAINT cart_pkey PRIMARY KEY (cart_id)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;
            
            ALTER TABLE restaurant_db.cart
                OWNER to postgres;`
        );
    } catch (error) {
        console.log(error);
    }
}

//this function creates the order table
async function createOrderTable(){
    try {
        await client.query(
            `CREATE TABLE IF NOT EXISTS restaurant_db.order
            (
                order_id uuid NOT NULL,
                user_id uuid NOT NULL,
                status character varying(20) COLLATE pg_catalog."default" NOT NULL,
                date time with time zone NOT NULL,
                order_details json NOT NULL,
                CONSTRAINT order_pkey PRIMARY KEY (order_id),
                CONSTRAINT order_fkey FOREIGN KEY (user_id)
                    REFERENCES restaurant_db."user" (user_id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION
                    NOT VALID
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;
            
            ALTER TABLE restaurant_db.order
                OWNER to postgres;`
        );
    } catch (error) {
        console.log(error);
    }
}

//This function reads data from the table containing the foods
async function readFoods(){
    try {
        const results = await client.query("select * from restaurant_db.foods");
        return results.rows;
    } catch (e) {
        return e;
    }
}

//This function reads data with reference id from the table containing the foods
async function readFood(id){
    try {
        const results = await client.query(`select * from restaurant_db.foods where food_id = '${id}'`);
        return results.rows;
    } catch (e) {
        return e;
    }
}

//This function insert data to the table containing the foods
async function createFood(name,price,category,details,id,image){
    try {
        await client.query(`INSERT INTO restaurant_db.foods (food_name, food_category, food_price, food_details, food_id, food_image) VALUES ('${name}','${category}',${price},'${details}', '${id}','${image}')`);
        return true;
    } catch (e) {
        return e;
    }
}

//This function udates data in the table containing the foods
async function updateFood(id,name,price,category,details,image){
    try {
        await client.query(`UPDATE restaurant_db.foods SET food_name = '${name}', food_category = '${category}', food_price = ${price}, food_details = '${details}', food_image = '${image}' WHERE food_id = '${id}'`);
        return true;
    } catch (e) {
        return e;
    }
}

//This function deletes data in the table containing the foods
async function deleteFood(id){
    try {
        await client.query(`DELETE FROM restaurant_db.foods WHERE food_id = '${id}'`);
        return true;
    } catch (e) {
        return e;
    }
}

//Function to convert image to base64 String
async function convertImageToBase64(image){
    image.crossOrigin = 'Anonymous';
    image.onload = function(){

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.height = this.naturalHeight;
        canvas.width = this.naturalWidth;
        ctx.drawImage(this,0,0);
        var data = canvas.toDataURL('image/jpeg');
        
        return data;
    }
}

//home route of the api
app.get('/', (req, res)=>{
    res.send('Hello World');
});

//route to convert image to Base64 String
app.get('/api/images', upload.single('image'), async (req, res)=>{

    //const base64Image = await convertImageToBase64(req.params.image);
    console.log(req.file);
    res.send(path.join(__dirname, req.file.path));

});

//route to get all foods
app.get('/api/foods', async (req, res)=>{
    myFoods = [];
    const foods = await readFoods();
    foods.forEach(food => {
        thisFood = {
            "id" : food.food_id,
            "name" : food.food_name,
            "price" : food.food_price,
            "category" : food.food_category,
            "details" : food.food_details,
            "image" : food.food_image,
        };

        myFoods.push(thisFood);
    });
    
    res.json(myFoods);
});

//route to get a single food by id
app.get('/api/foods/:id', async (req, res)=>{

    myFoods = [];
    foods = await readFood(req.params.id);
       
    const found = foods.length > 0;
        
    if(found){
        foods.forEach(food => {
            if (food.food_id === req.params.id){
                thisFood = {
                    "id" : food.food_id,
                    "name" : food.food_name,
                    "price" : food.food_price,
                    "category" : food.food_category,
                    "details" : food.food_details,
                    "image" : food.food_image,
                };
            myFoods.push(thisFood);
            }
        });
        
        res.setHeader("content-type", "application/json");
        res.json(myFoods);
        //res.json(foods.filter(food => food.food_id === req.params.id));
    }
    else{
        res.status(400).json({message: `No food with the ID of ${req.params.id}`});
    }
    
});

//route to post a single food
app.post('/api/foods', upload.single('image'), async (req, res)=>{
    const rest = {};
    console.log(req.file);
    var foods;

    const name = req.body.name;
    const price = req.body.price;
    const category = req.body.category;
    const details = req.body.details;
    const image = req.file.path;

    if (!name || !price || !category || !details || !details || !thisFoodId){
      res.status(400).json({message: `You must enter name, price, category and details`});
      return;
    }
    try {
        const result = await createFood(name,price,category,details,thisFoodId,image);
        rest.success = result;
    } catch (error) {
        rest.success = false;
    }
    finally{
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(rest));
    }
});

//route to update a single food
app.put('/api/foods/:id', upload.single('image'), async (req, res)=>{

    foods = await readFoods();
       
    const found = foods.some(food => food.food_id === req.params.id);
        
    if(found){
        const updFood = req.body;
        foods.forEach(food => {
            if(food.food_id === req.params.id){
                const name = updFood.name ? updFood.name  : food.food_name;
                const price = updFood.price ? updFood.price  : food.food_price;
                const category = updFood.category ? updFood.category  : food.food_category;
                const details = updFood.details ? updFood.details : food.food_details;
                const image = req.file ? req.file.path : food.food_image;

                updateFood(req.params.id,name,price,category,details,image);

                res.json({message: `Food Updated`});
            }
        });
    }
    else{
        res.status(400).json({message: `No  food with the ID of ${req.params.id}`});
    }
    
});

//route to delete a single food by id
app.delete('/api/foods/:id', async (req, res)=>{

    foods = await readFoods();
       
    const found = foods.some(food => food.food_id === req.params.id);
        
    if(found){
        await deleteFood(req.params.id);    
        res.setHeader("content-type", "application/json");
        res.status(200).json({message: `Deleted`});
    }
    else{
        res.status(400).json({message: `No food with the ID of ${req.params.id}`});
    }
    
});


// This session is for the food category

//This function reads data from the table containing the category
async function readCategory(){
    try {
        const results = await client.query("select * from restaurant_db.category");
        return results.rows;
    } catch (e) {
        return e;
    }
}

//This function insert data to the table containing the category
async function createCategory(id,name,image){
    try {
        await client.query(`INSERT INTO restaurant_db.category (category_id,category_name,category_image) VALUES ('${id}','${name}','${image}')`);
        return true;
    } catch (e) {
        return e;
    }
}

//This function udates data in the table containing the category
async function updateCategory(id,name,image){
    if (name == null){
        try {
            await client.query(`UPDATE restaurant_db.category SET category_image = '${image}' WHERE category_id = '${id}'`);
            return true;
        } catch (e) {
            return e;
        }
    }
    else if (image == null){
        try {
            await client.query(`UPDATE restaurant_db.category SET category_name = '${name}' WHERE category_id = '${id}'`);
            return true;
        } catch (e) {
            return e;
        }
    }
    else if (name != null && image != null){
        try {
            await client.query(`UPDATE restaurant_db.category SET category_name = '${name}',category_image = '${image}' WHERE category_id = '${id}'`);
            return true;
        } catch (e) {
            return e;
        }
    }
    return false;
}

//This function deletes data in the table containing the category
async function deleteCategory(id){
    try {
        await client.query(`DELETE FROM restaurant_db.category WHERE category_id = '${id}'`);
        return true;
    } catch (e) {
        return e;
    }
}

//route to get all categories
app.get('/api/category', async (req, res)=>{
    
    const categories = await readCategory();
    myCategories = [];
    categories.forEach(category => {
        thisCategory = {
            "id" : category.category_id,
            "name" : category.category_name,
            "image" : category.category_image
        };

        myCategories.push(thisCategory);
    });
    res.json(myCategories);
 
});

//route to get a single category by id
app.get('/api/category/:id', async (req, res)=>{

    myCategories = [];

    categories = await readCategory();
       
    const found = categories.some(category => category.category_id === req.params.id);
        
    if(found){
        categories.forEach(category => {
            if (category.category_id === req.params.id){
                thisCategory = {
                    "id" : category.category_id,
                    "name" : category.category_name,
                    "image" : category.category_image
                };
            myCategories.push(thisCategory);
            }
        });
        res.setHeader("content-type", "application/json");
        
        res.json(myCategories);

        //res.json(categories.filter(category => category.category_id === req.params.id));
    }
    else{
        res.status(400).json({message: `No category with the ID of ${req.params.id}`});
    }
    
});

//route to post a single category
app.post('/api/category', uploadCatImg.single('image'), async (req, res)=>{
    const rest = {};

    const name = req.body.name;
    const image = req.file.path;

    if (!name){
      res.status(400).json({message: `You must enter category name`});
      return;
    }
    try {
        const result = await createCategory(thisCategoryId,name,image);
        rest.success = result;
    } catch (error) {
        rest.success = error;
    }
    finally{
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(rest));
    }
});

//route to update a single category
app.put('/api/category/:id', uploadCatImg.single('image'), async (req, res)=>{
    
    const rest = {};
    
    const name = req.body.name ? req.body.name  : null;
    const image = req.file ? req.file.path : null;

    try {
        
        const result = await updateCategory(req.params.id,name,image);

        rest.success = result;

    } catch (error) {
        
        rest.success = error;

    } finally {

        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(rest));

    }
    
});

//route to delete a single category by id
app.delete('/api/category/:id', async (req, res)=>{

    categories = await readCategory();
       
    const found = categories.some(category => category.category_id === req.params.id);
        
    if(found){
        await deleteCategory(req.params.id);    
        res.setHeader("content-type", "application/json");
        res.status(200).json({message: `Deleted`});
    }
    else{
        res.status(400).json({message: `No food with the ID of ${req.params.id}`});
    }
    
});

// this is where the function and route to manipulate users start

//Function to create new user
async function createUser(id,name,phone,email,city,address,password,image){
    try {
        await client.query(`INSERT INTO restaurant_db.user (user_id,user_email,user_name,user_phone,user_city,user_address,user_password,user_level,user_image,user_active) VALUES ('${id}','${email}','${name}','${phone}','${city}','${address}','${password}','user','${image}',false)`);
        return true;
    } catch (e) {
        return e;
    }
}

//Function to get all users
async function readUsers(){
    try {
        const results = await client.query("select * from restaurant_db.user");
        return results.rows;
    } catch (e) {
        return[];
    }
}

//Function to get all users
async function readUser(id){
    try {
        const results = await client.query(`select * from restaurant_db.user where user_id = '${id}'`);
        return results.rows;
    } catch (e) {
        return[];
    }
}

//Function to update user details
async function updateUser(id,name,phone,city,address,image){
    try {
        await client.query(`UPDATE restaurant_db.user SET user_name = '${name}', user_phone = '${phone}', user_city = '${city}', user_address = '${address}', user_image = '${image}' WHERE user_id = '${id}'`);
        return true;
    } catch (e) {
        return false;
    }
}

//Function to verify user email
async function verifyEmail(email){
    try {
        await client.query(`UPDATE restaurant_db.user SET user_active = true WHERE user_email = '${email}'`);
        return true;
    } catch (e) {
        return false;
    }
}

//Function to delete user
async function deleteUser(id){
    try {
        await client.query(`DELETE FROM restaurant_db.user WHERE user_id = '${id}'`);
        return true;
    } catch (e) {
        return false;
    }
}

//Function to log in user
async function loginUser(email,password){
    try {
        const results = await client.query(`select user_id, user_name, user_phone, user_email, user_city, user_address, user_level, user_active from restaurant_db.user where user_email = '${email}' AND user_password = '${password}'`);
        return results.rows;
    } catch (e) {
        return "Ivalid Password";
    }
}

//Route to get all users
app.get('/api/user', async (req, res)=>{
    
    const users = await readUsers();
    myUsers = [];
    users.forEach(user => {
        thisUser = {
            "id" : user.user_id,
            "name" : user.user_name,
            "email" : user.user_email,
            "phonenumber" : user.user_phone,
            "city" : user.user_city,
            "address" : user.user_address,
            "password" : user.user_password,
            "access" : user.user_level,
            "image" : user.user_image
        };

        myUsers.push(thisUser);
    });
    res.json(myUsers);
 
});

//Route to get user by ID
app.get('/api/user/:id', async (req, res)=>{

    thisId = req.params.id;

    users = await readUser(thisId);
    myUsers = [];
       
    const found = users.some(user => user.user_id === thisId);
        
    if(found){
        users.forEach(user => {
            if (user.user_id === thisId){
                thisUser = {
                    "id" : user.user_id,
                    "name" : user.user_name,
                    "email" : user.user_email,
                    "phonenumber" : user.user_phone,
                    "city" : user.user_city,
                    "address" : user.user_address,
                    "password" : user.user_password,
                    "access" : user.user_level,
                    "image" : user.user_image
                };
        
                myUsers.push(thisUser);
            }
        });
        res.setHeader("content-type", "application/json");
        res.json(myUsers);
        //res.json(users.filter(user => user.user_id === req.params.id));
    }
    else{
        res.status(400).json({message: `No  user with the ID of ${req.params.id}`});
    }
    
});

//Route to create user
app.post('/api/user', uploadProfImg.single('image'), async (req, res)=>{
    const rest = {};
    
    users = await readUsers();

    const name = req.body.name ? req.body.name : null;
    const phone = req.body.phonenumber ? req.body.phonenumber : null;
    const email = req.body.email;
    const password = req.body.password;
    const city = req.body.city ? req.body.city : null;
    const address = req.body.address ? req.body.address : null;
    const image = req.file ? req.file.path : null;

    var hasUsedEMail = false;

    users.forEach(user => {
        if (email === user.user_email){
            hasUsedEMail = true;
        }
    });
    
    if (hasUsedEMail){
        res.status(400).json({message: `This email has been used to register an account, you can reset your password if you forgot it`});
    }
    else {
        
    if (thisUserId == null){
        thisUserId = uuid.v4();
    }

    if (!email || !password || !thisUserId){
      res.status(400).json({message: `You must supply email and password`});
      return;
    }
    try {
        await createUser(thisUserId, name,phone,email,city,address,password,image);
        rest.success = true;
    } catch (error) {
        rest.success = false;
    }
    finally{
        res.setHeader("content-type", "application/json");
        if (rest.success == true){
            rand=Math.floor((Math.random() * 100) + 54);
            host=req.get('host');
            link="http://"+req.get('host')+"/verify?id="+rand;
            mailOptions={
                to : email,
                subject : "Please confirm your Email account",
                html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>" 
            }
            console.log(mailOptions);
            smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                    console.log(error);
                    res.json({message: `error sending verification message to your email`});
            }else{
                    console.log("Message sent: " + response.message);
                res.json({message: `sent verification message to your email`});
                }
        });

        //res.status(200).send(JSON.stringify(rest));
        }
        else{
            res.status(400).send(JSON.stringify(rest));
        }
    }
    }

});

//Route to comfirm email verification
app.get('/verify', async (req,res) => {
    console.log(req.protocol+":/"+req.get('host'));
    if((req.protocol+"://"+req.get('host'))==("http://"+host))
    {
        console.log("Domain is matched. Information is from Authentic email");
        if(req.query.id==rand)
        {
            verifyEmail(mailOptions.to);
            console.log("email is verified");
            res.json({message: `email is verified`});
        }
        else
        {
            console.log("email is not verified");
            res.status(400).end("<h1>Bad Request</h1>");
        }
    }
    else
    {
        res.status(400).end("<h1>Request is from unknown source");
    }
});
    

//Route to update user by ID
app.put('/api/user/:id', uploadProfImg.single('image'), async (req, res)=>{

    users = await readUsers();
       
    const found = users.some(user => user.user_id === req.params.id);
        
    if(found){
        const updUser = req.body;
        users.forEach(user => {
            if(user.user_id === req.params.id){
                const name = updUser.name ? updUser.name  : user.user_name;
                const phone = updUser.phonenumber ? updUser.phonenumber  : user.user_phone;
                const city = updUser.city ? updUser.city  : user.user_city;
                const address = updUser.address ? updUser.address  : user.user_address;
                const image = req.file ? req.file.path : user.user_image;

                updateUser(req.params.id, name, phone, city, address, image);

                res.json({message: `User Details Updated`});
            }
        });
    }
    else{
        res.status(400).json({message: `No User with the ID of ${req.params.id}`});
    }
    
});

//Route to delete user
app.delete('/api/user/:id', async (req, res)=>{

    users = await readUsers();
       
    const found = users.some(user => user.user_id === req.params.id);
        
    if(found){
        await deleteUser(req.params.id);    
        res.setHeader("content-type", "application/json");
        res.status(200).json({message: `Deleted`});
    }
    else{
        res.status(400).json({message: `No User with the ID of ${req.params.id}`});
    }
    
});

// Route to login user
app.get('/api/user/login/:email/:password', async (req, res)=>{

    users = await readUsers();
    var user = [];
    var userExist = false;
    var userVerified = false;
       
    const foundEmail = users.some(user => user.user_email === req.params.email);
    if(foundEmail){
        users.forEach(user => {
            if(user.user_email === req.params.email){
                userExist = true;
                if(user.user_active == true)
                    userVerified = true;
            }
        });

        if (userExist && userVerified){
            user = await loginUser(req.params.email, req.params.password);
            if (user.length > 0)
                res.status(200).json({message: `Login Successful`});
            else
                res.status(400).json({message: `Login failed: Invalid Password`});
        }
        else if (userExist && !userVerified){
            res.status(400).json({message: `User email not verified`});
        }

    }
    else{
        res.status(400).json({message: `No  user with the Email of ${req.params.email}`});
    }
    
});

//Code for basket starts here

//This function reads data from the table containing the basket
async function readBasket(userId){
    try {
        const results = await client.query(`SELECT * from restaurant_db.cart WHERE user_id = '${userId}'`);
        return results.rows;
    } catch (e) {
        return[];
    }
}

//This function reads data from the table containing the basket
async function readBasketItem(id){
    try {
        const results = await client.query(`SELECT * from restaurant_db.cart WHERE cart_id = '${id}'`);
        return results.rows;
    } catch (e) {
        return[];
    }
}

//Function to add items to basket
async function addToBasket(user,id,quantity){
    try {
        foods = await readFood(id);
        if (foods.length < 1)   return "invalid food id";
        if (foods.length > 1)   return "error: multiple food with same id";
        foods.forEach(food => {
            if (food.food_id === id){
                item = {
                    "name" : food.food_name,
                    "price" : food.food_price,
                    "category" : food.food_category,
                    "details" : food.food_details,
                    "image" : food.food_image,
                    "quantity" : quantity
                };
                items = JSON.stringify(item);
            }
        });

        thisCartId = uuid.v4();
        
        await client.query(`INSERT INTO restaurant_db.cart (cart_id,cart_details,user_id) VALUES ('${thisCartId}','${items}','${user}')`);
        return true;
    } catch (e) {
        return e;
    }
}

//Function to delete item from basket
async function deleteItemBasket(id){
    try {
        await client.query(`DELETE FROM restaurant_db.cart WHERE cart_id = '${id}'`);
        return true;
    } catch (e) {
        return false;
    }
}

//Function to update item in basket
async function updateItemBasket(quantity,id){
    
    try {
        baskets = await readBasketItem(id);
        var items;

        baskets.forEach(basket => {
            item = {
                "name" : basket.cart_details.name,
                "price" : basket.cart_details.price,
                "category" : basket.cart_details.category,
                "details" : basket.cart_details.details,
                "quantity" : quantity,
                "image" : basket.cart_details.image,
            };
            
        items = JSON.stringify(item);
        });
        
        await client.query(`UPDATE restaurant_db.cart SET cart_details = '${items}' WHERE cart_id = '${id}'`);
        return true;
    } catch (e) {
        return e;
    }
}

//Route to add item to basket
app.post('/api/basket', async (req, res)=>{
    const rest = {};
    
    const userId = req.body.userId;
    const id = req.body.foodId;
    const quantity = req.body.quantity;

    if (!userId || !id || !quantity){
      res.status(400).json({message: `You must parse foodId, quantity and userId in the body of the request`});
      return;
    }
    try {
        test = await  addToBasket(userId,id,quantity);
        rest.success = test;
    } catch (error) {
        rest.success = error;
    }
    finally{
        if (rest.success)
            res.status(200).json({message: `Item added succesfuly`});
            
        else
            res.status(400).json({message: `Item was not added`});
        
    }
});

//Route to get items from basket for each user
app.get('/api/basket/:userId', async (req, res)=>{
    const baskets = await readBasket(req.params.userId);

    items = [];
    baskets.forEach(basket => {
        thisFood = {
            "id" : basket.cart_id,
            "name" : basket.cart_details.name,
            "price" : basket.cart_details.price,
            "category" : basket.cart_details.category,
            "details" : basket.cart_details.details,
            "quantity" : basket.cart_details.quantity,
            "image" : basket.cart_details.image,
        };
        items.push(thisFood);
    });
    
    res.json(items);
});

//Route to update item in basket for each user
app.put('/api/basket/:id', async (req, res)=>{
    const rest = {};
    
    const quantity = req.body.quantity;

    try {
        test = await  updateItemBasket(quantity,req.params.id);
        rest.success = test;
    } catch (error) {
        rest.success = error;
    }
    finally{
        if (rest.success)
            res.status(200).json({message: `Item updated succesfuly`});
            
        else
            res.status(400).json({message: `Item was not updated`});
    }
});

//Route to delete item from cart
app.delete('/api/basket/:cartId/:userId', async (req, res)=>{

    baskets = await readBasket(req.params.userId);
       
    const found = baskets.some(basket => basket.cart_id === req.params.cartId);
        
    if(found){
        await deleteItemBasket(req.params.cartId);    
        res.setHeader("content-type", "application/json");
        res.status(200).json({message: `Item Removed`});
    }
    else{
        res.status(400).json({message: `No User with the ID of ${req.params.id}`});
    }
    
});

//Code for order starts here

//This function reads data from the table containing the order
async function readAllUserOrder(){
    try {
        const results = await client.query(`SELECT * from restaurant_db.order`);
        return results.rows;
    } catch (e) {
        return[];
    }
}

//This function reads data from the table containing the order by user id
async function readUserOrder(userId){
    try {
        const results = await client.query(`SELECT * from restaurant_db.order WHERE user_id = '${userId}'`);
        return results.rows;
    } catch (e) {
        return[];
    }
}

//This function reads all pending orders
async function readPendingOrder(){
    try {
        const results = await client.query(`SELECT * from restaurant_db.order WHERE status = 'pending'`);
        return results.rows;
    } catch (e) {
        return e;
    }
}

//Function to add items to basket
async function placeOrder(user){
    try {
        foods = await readBasket(user);
        var price = 0;
        var myItems = [];
        var date = new Date();
        foods.forEach(basket => {
            price = price + (basket.cart_details.price * basket.cart_details.quantity)
            item = {
                "name" : basket.cart_details.name,
                "price" : basket.cart_details.price,
                "category" : basket.cart_details.category,
                "details" : basket.cart_details.details,
                "quantity" : basket.cart_details.quantity,
                "image" : basket.cart_details.image,
            };
            items = JSON.stringify(item);
            myItems.push(items);
        
        });


        for (let index = 0; index < myItems.length; index++) {
            
            thisOrderId = await uuid.v4();
            await client.query(`INSERT INTO restaurant_db.order (order_id,order_details,user_id,status,date) VALUES ('${thisOrderId}','${myItems[index]}','${user}','pending',CURRENT_TIMESTAMP)`);

        } 
            
        return price;
    } catch (e) {
        return e;
    }
}

//Function to delete item from basket
async function deleteOrder(id){
    try {
        await client.query(`DELETE FROM restaurant_db.order WHERE order_id = '${id}'`);
        return true;
    } catch (e) {
        return false;
    }
}

//Function to update item in basket
async function acceptOrder(id){
    
    try {
        await client.query(`UPDATE restaurant_db.order SET status = 'accepted' WHERE order_id = '${id}'`);
        return true;
    } catch (e) {
        return e;
    }
}

//Route to get items from order for all users
app.get('/api/order', async (req, res)=>{
    const orders = await readAllUserOrder();

    items = [];
    orders.forEach(order => {
        thisFood = {
            "id" : order.order_id,
            "userId" : order.user_id,
            "date" : order.date,
            "status" : order.status,
            "name" : order.order_details.name,
            "price" : order.order_details.price,
            "category" : order.order_details.category,
            "details" : order.order_details.details,
            "quantity" : order.order_details.quantity,
            "image" : order.order_details.image,
        };
        items.push(thisFood);
    });
    
    res.json(items);
});

//Route to get items from order for a single users
app.get('/api/order/:userId', async (req, res)=>{
    const orders = await readUserOrder(req.params.userId);

    items = [];
    orders.forEach(order => {
        thisFood = {
            "id" : order.order_id,
            "userId" : order.user_id,
            "date" : order.date,
            "status" : order.status,
            "name" : order.order_details.name,
            "price" : order.order_details.price,
            "category" : order.order_details.category,
            "details" : order.order_details.details,
            "quantity" : order.order_details.quantity,
            "image" : order.order_details.image,
        };
        items.push(thisFood);
    });
    
    res.json(items);
});

//Route to read all pending orders
app.get('/api/pending', async (req, res)=>{
    const orders = await readPendingOrder();

    items = [];
    orders.forEach(order => {
        thisFood = {
            "id" : order.order_id,
            "userId" : order.user_id,
            "date" : order.date,
            "status" : order.status,
            "name" : order.order_details.name,
            "price" : order.order_details.price,
            "category" : order.order_details.category,
            "details" : order.order_details.details,
            "quantity" : order.order_details.quantity,
            "image" : order.order_details.image,
        };
        items.push(thisFood);
    });
    
    res.json(items);
});

//Route to accept order
app.put('/api/order/:id', async (req, res)=>{
    const rest = {};
    
    try {
        test = await  acceptOrder(req.params.id);
        rest.success = test;
    } catch (error) {
        rest.success = error;
    }
    finally{
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(rest));
    }
});

//Route to place order
app.post('/api/order', async (req, res)=>{
    const rest = {};
    
    const userId = req.body.userId;

    if (!userId){
      res.status(400).json({message: `You must parse food object and userId`});
      return;
    }
    try {
        test = await  placeOrder(userId);
        rest.success = test;
    } catch (error) {
        rest.success = error;
    }
    finally{

        if (rest.success){
            await client.query(`DELETE FROM restaurant_db.cart
            WHERE user_id = '${userId}'`);
        }
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(rest));
    }
});

//Route to delete item from cart
app.delete('/api/basket/:cartId/:userId', async (req, res)=>{

    baskets = await readBasket(req.params.userId);
       
    const found = baskets.some(basket => basket.cart_id === req.params.cartId);
        
    if(found){
        await deleteItemBasket(req.params.cartId);    
        res.setHeader("content-type", "application/json");
        res.status(200).json({message: `Deleted`});
    }
    else{
        res.status(400).json({message: `No User with the ID of ${req.params.id}`});
    }
    
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, ()=> console.log(`Server started on PORT ${PORT}`));
