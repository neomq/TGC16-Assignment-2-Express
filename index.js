const express = require('express');
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const {
    connect,
    getDB
} = require('./MongoUtil');

// console.log(process.env.MONGO_URI)

// Express
const app = express();

// enable JSON data processing
app.use(express.json());

// enable CORS 
app.use(cors());


// Routes
async function main(){
    // connect to mongodb
    await connect(process.env.MONGO_URI, "diy_home_decor")

    // get all projects
    app.get('/projects', async function (req, res) {
        try {
            const db = getDB();
            let projects = await db.collection('projects').find().toArray();

            res.status(200);
            res.send(projects);
        } catch (e) {
            res.status(500);
            res.send({
                "message": "unable to display projects"
            })
        }
    })

    // get each project
    app.get('/projects/:id', async function (req, res) {
        try {
            const db = getDB();
            let each_project = await db.collection('projects').find({
                '_id': ObjectId(req.params.id)
            }).toArray();

            res.status(200);
            res.send(each_project);
        } catch (e) {
            res.status(500);
            res.send({
                "message": "unable to display project"
            })
        }
    })
    
    // get projects by search
    app.get('/projects/search', async function (req, res) {

        try { 

            // search by project_title or description
            let criteria_1 = {} // project_title
            let criteria_2 = {} // description

            // filter by craft_type, category, time and difficulty
            let criteria_3 = {}
            
            if (req.query.search_word) {
                criteria_1['project_title'] = {
                    '$regex': req.query.search_word,
                    '$options': 'i'
                }
                criteria_2['description'] = {
                    '$regex': req.query.search_word,
                    '$options': 'i'
                }
            }

            // filter by craft_type
            if (req.query.craft_type) {
                criteria_3['craft_type'] = {
                    '$in': [req.query.craft_type]
                }
            }

            // filter by category
            if (req.query.category) {
                criteria_3['category'] = {
                    '$in': [req.query.category]
                }
            }

            // filter by time required
            if (req.query.time_required) {
                if (req.query.time_required == "less than 30 mins"){
                    criteria_3['time_required'] = {
                        '$lt': 30
                    }
                }

                if (req.query.time_required == "30 mins - 60 mins"){
                    criteria_3['time_required'] = {
                        '$gte': 30,
                        '$lte': 60
                    }
                }

                if (req.query.time_required == "more than 60 mins"){
                    criteria_3['time_required'] = {
                        '$gt': 60
                    }
                }
            }

            // filter by difficulty
            if (req.query.difficulty) {
                criteria_3['difficulty'] = {
                    '$regex': req.query.difficulty
                }
            }

            console.log(criteria_1);
            console.log(criteria_2);
            console.log(criteria_3);

            const db = getDB();
            let results = await db.collection('projects')
                .find({
                    '$or': [criteria_1, criteria_2],
                    '$and': [criteria_3]
                },
                {
                    'projection': {
                        'project_title': 1,
                        'user_name': 1,
                        'date_of_post': 1,
                        'photo': 1,
                        'description': 1,
                        'tags': 1,
                        'supplies': 1,
                        'craft_type': 1,
                        'category': 1,
                        'time_required': 1,
                        'difficulty': 1,
                        'instructions': 1,
                        'comments': 1
                    }
                })
                .toArray();
            res.status(200);
            res.send(results)
        } catch (e) {
            res.status(500);
            res.send({
                "message": "unable to display search results"
            })
        }
    })

    // get categories
    app.get('/category_list', async function (req, res) {
        try {
            const db = getDB();
            let categories = await db.collection('category_list').find().toArray();

            res.status(200);
            res.send(categories);
        } catch (e) {
            res.status(500);
            res.send({
                "message": "unable to get categories"
            })
        }
    })

    // get craft types
    app.get('/craft_type_list', async function (req, res) {
        try {
            const db = getDB();
            let craft_types = await db.collection('craft_type_list').find().toArray();

            res.status(200);
            res.send(craft_types);
        } catch (e) {
            res.status(500);
            res.send({
                "message": "unable to get craft types"
            })
        }
    })

    // post new project
    app.post('/projects', async function (req, res) {

        try {
            // 1. get info from req.body - done
            // 2. validate info from req.body, e.g. required, minLength
            // 3. set a variable to count number of invalid fields
            // 4. if else statement:
            //  a. if errorCount > 0 --> sendStatus(406)
            //  b. else --> sendStatus(200)
            let project_title = req.body.project_title;
            let user_name = req.body.user_name;
            let photo = req.body.photo;
            let description = req.body.description;
            // let tags = req.body.tags.split(',');
            // let supplies = req.body.supplies.split(',');
            let supplies = req.body.supplies;
            let craft_type = req.body.craft_type;
            let category = req.body.category;
            let time_required = parseInt(req.body.time_required);
            let difficulty = req.body.difficulty;
            // let text = req.body.text.split(',');
            let text = req.body.text;
            let link = req.body.link;

            // validation
            let errorCount = 0;

            if (project_title.length < 3) {
                errorCount += 1;
            }
            if (user_name.length < 2){
                errorCount += 1;
            }
            if (!photo) {
                errorCount += 1;
            }
            if (description.length < 5){
                errorCount += 1;
            }
            if (supplies.length < 2){
                errorCount += 1;
            }
            if (!craft_type) {
                errorCount += 1;
            }
            if (!category) {
                errorCount += 1;
            }
            if (parseInt(time_required) < 1){
                errorCount += 1;
            }
            if (!difficulty){
                errorCount += 1;
            }
            if (text.length < 5){
                errorCount += 1;
            }

            errorCount = 0 // FOR TESTING ONLY

            if (errorCount > 0){
                res.status(406)
                res.json({
                    "message": "error"
                })
            } else {
                // split into array
                supplies = supplies.split(',');
                text = text.split(',');
                category = category.split(',');
                craft_type = craft_type.split(',');

                // remove all whitespaces from the front and back
                supplies = supplies.map(function (each_supply) {
                    return each_supply.trim();
                })
                text = text.map(function (each_content) {
                    return each_content.trim();
                })

                let instructions = { text, link };

                const db = getDB();
                db.collection('projects').insertOne({
                    project_title,
                    user_name,
                    date_of_post: new Date(),
                    photo,
                    description,
                    //tags,
                    supplies,
                    craft_type,
                    category,
                    time_required,
                    difficulty,
                    instructions
                });
                console.log("Data inserted")
                res.status(200);
                res.json({
                    "message": "success"
                });
            }
        } catch (e) {
            res.status(500);
            res.json({
                "message": "unable to submit project"
            })
            console.log(e)
        }
    })

    // update project
    app.put('/projects/:id', async function (req,res) {

        try {
            // let project_title = req.body.project_title;
            // let user_name = req.body.user_name;
            // let photo = req.body.photo;
            // let description = req.body.description;
            // let tags = req.body.tags;
            // let supplies = req.body.supplies;
            // let craft_type = req.body.craft_type;
            // let category = req.body.category;
            // let time_required = req.body.time_required;
            // let difficulty = req.body.difficulty;
            // let text = req.body.text;
            // let link = req.body.link;

            let {
                project_title,
                user_name,
                photo,
                description,
                //tags,
                supplies,
                craft_type,
                category,
                time_required,
                difficulty,
                text,
                link } = req.body;
            
            // validation
            let errorCount = 0;

            if (project_title.length < 3) {
                errorCount += 1;
            }
            if (user_name.length < 2){
                errorCount += 1;
            }
            if (!photo) {
                errorCount += 1;
            }
            if (description.length < 5){
                errorCount += 1;
            }
            if (supplies.length < 2){
                errorCount += 1;
            }
            if (!craft_type) {
                errorCount += 1;
            }
            if (!category) {
                errorCount += 1;
            }
            if (parseInt(time_required) < 1){
                errorCount += 1;
            }
            if (!difficulty){
                errorCount += 1;
            }
            if (text.length < 5){
                errorCount += 1;
            }

            if (errorCount > 0){
                res.status(406)
                res.json({
                    "message": "error"
                })
            } else {
                // split into array
                //tags = tags.split(',');
                supplies = supplies.split(',');
                text = text.split(',');
                category = category.split(',');
                craft_type = craft_type.split(',');

                time_required = parseInt(time_required);

                // remove all whitespaces from the front and back
                supplies = supplies.map(function (each_supply) {
                    return each_supply.trim();
                })
                text = text.map(function (each_content) {
                    return each_content.trim();
                })

                let instructions = { text, link };

                const db = getDB();
                let results = await db.collection('projects').updateOne({
                    '_id': ObjectId(req.params.id)
                }, {
                    '$set': {
                        project_title,
                        user_name,
                        date_of_post: new Date(),
                        photo,
                        description,
                        //tags,
                        supplies,
                        craft_type,
                        category,
                        time_required,
                        difficulty,
                        instructions
                    }
                })
                res.status(200);
                res.json({
                    "message": "project updated successfully"
                })
            }
        } catch (e) {
            res.status(500);
            res.json({
                "message": "unable to update project"
            });
            console.log(e);
        }
    })

    // delete project
    app.delete('/projects/:id', async function (req, res) {

        try {
            const db = getDB();
            await db.collection('projects').deleteOne({
                '_id': ObjectId(req.params.id)
            })
            res.status(200);
            res.json({
                "message": "project deleted successfully"
            })
        } catch (e) {
            res.status(500);
            res.json({
                "message": "unable to delete project"
            })
        }
        
    })

    // -- comments -- //
    // get all comments for each project
    app.get('/projects/:id/comments', async function (req, res) {

        try {
            const db = getDB();
            let results = await db.collection('projects').find({
                "_id": ObjectId(req.params.id)
            }).project({
                'comments': 1
            }).toArray()

            res.status(200);
            res.send(results)
        } catch (e) {
            res.status(500);
            res.json({
                "message": "unable to display comments"
            })
        }
    })

    // post comment
    app.post('/projects/:id/comments', async function (req, res) {

        try {
            const db = getDB();
            // let comment_name = req.body.comment_name;
            // let comment_text = req.body.comment_text;
            let { comment_name, comment_text } = req.body

            // validation
            let errorCount = 0;
            
            if (comment_name.length < 2){
                errorCount += 1;
            }
            if (comment_text.length < 2){
                errorCount += 1;
            }
            
            if (errorCount > 0){
                res.status(406)
                res.json({
                    "message": "error"
                })
            } else {
                await db.collection('projects').updateOne({
                    '_id': ObjectId(req.params.id)
                }, {
                    '$push': {
                        'comments': {
                            comment_id: new ObjectId(),
                            comment_name,
                            comment_date: new Date(),
                            comment_text
                        }
                    }
                })
                res.status(200);
                res.json({
                    'message': 'comments added successfully'
                })
            }
        } catch (e) {
            res.status(500);
            res.json({
                "message": "unable to insert comment"
            });
            console.log(e)
        }
    })

    // update comment
    app.put('/projects/:id/comments/:comment_id', async function (req, res) {

        try {
            const db = getDB();
            let { comment_name, comment_text } = req.body

            // validation
            let errorCount = 0;
            
            if (comment_name.length < 2){
                errorCount += 1;
            }
            if (comment_text.length < 2){
                errorCount += 1;
            }

            if (errorCount > 0){
                res.status(406)
                res.json({
                    "message": "error"
                })
            } else {
                await db.collection('projects').updateOne({
                    'comments': {
                        '$elemMatch': {
                            'comment_id': ObjectId(req.params.comment_id)
                        }
                    }
                }, {
                    '$set': {
                        'comments.$.comment_date': new Date(),
                        'comments.$.comment_name': comment_name,
                        'comments.$.comment_text': comment_text
                    }
                })
                res.status(200);
                res.json({
                    'message': 'comments updated successfully'
                })
            }
        } catch (e) {
            res.status(500);
            res.json({
                'message': 'unable to update comment'
            });
            console.log(e)
        }
    })

    // delete comment
    app.delete('/projects/:id/comments/:comment_id', async function (req, res) {

        try {
            const db = getDB();
            let project = await db.collection('projects').findOne({
                '_id': ObjectId(req.params.id)
            })

            if (project) {
                let indexToRemove = project.comments.findIndex((i) => {
                    return i.comment_id == req.params.comment_id;
                });

                let clone = [
                    ...project.comments.slice(0, indexToRemove),
                    ...project.comments.slice(indexToRemove + 1)
                ];
                await db.collection('projects').updateOne({
                    '_id': ObjectId(req.params.id)
                }, {
                    $set: {
                        "comments": clone
                    }
                })
                res.status(200)
                res.json({
                    'message': 'comment deleted successfully'
                });
            }
        } catch (e) {
            res.status(500);
            res.json({
                'message': 'unable to delete comment'
            });
            console.log(e)
        }
    })

}
main();

// Listen
// app.listen(process.env.PORT, function(){
//     console.log("Server has started")
// })

app.listen(3000, function(){
    console.log("Server has started")
})