const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// MongoDB Connection URL
const uri = `mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PASSWORD}@cluster0.b0di4c5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('portfolio');
        const usersCollection = db.collection('superuser');
        const skillsCollection = db.collection('skills');
        const blogsCollection = db.collection('blogs')


        // User Login
        app.post('/api/auth/superuser', async (req, res) => {
            const { username, password } = req.body;
            // Find user by email
            const user = await usersCollection.findOne({ username });
            if (!user) {
                return res.status(401).json({ message: 'Invalid username or password', notFound: true });
            }
            if (user.password != password && user.role !== 'admin') {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            // Generate JWT token
            const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });
            res.json({
                success: true,
                message: 'Login successful',
                token
            });
        });

        app.get('/superuser/skills', async (req, res) => {
            const query = {};
            const result = await skillsCollection.find(query).limit(3).toArray(); // Limit to the first 3 documents
            res.send(result);
        });

        app.get('/superuser/admin/skills', async (req, res) => {
            const query = {};
            const result = await skillsCollection.find(query).toArray(); // Limit to the first 3 documents
            res.send(result);

        });

        app.delete('/superuser/delete-skills/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await skillsCollection.deleteOne(query);
            res.send(result);
        })



        // app.patch('/superuser/update-skills', async (req, res) => {
        //     const query = {};
        //     const result = await skillsCollection.find(query).toArray();
        //     res.send(result);
        // })


        app.post('/superuser/add-skills', async (req, res) => {
            const query = req.body;
            const result = await skillsCollection.insertOne(query);
            res.send(result);
        })

        app.post('/superuser/add-blogs', async (req, res) => {
            const query = req.body;
            const result = await blogsCollection.insertOne(query);
            res.send(result);
        })

        app.get('/api/data', async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1; // Get the requested page number from query params
                const perPage = 5; // Number of items per page
                const startIndex = (page - 1) * perPage;

                // Fetch total count of documents
                const totalDocuments = await skillsCollection.countDocuments();

                // Fetch paginated documents
                const results = await skillsCollection.find().skip(startIndex).limit(perPage).toArray();

                res.json({
                    data: results,
                    currentPage: page,
                    totalPages: Math.ceil(totalDocuments / perPage)
                });
            } catch (error) {
                console.error('Error fetching paginated data:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // ==============================================================
        // WRITE YOUR CODE HERE
        // app.get('/supplies', async (req, res) => {
        //     const search = {};
        //     const result = await suppliesCollection.find(search).toArray();
        //     res.send(result);
        // })
        // app.post('/supplies', async (req, res) => {
        //     const query = req.body;
        //     const result = await suppliesCollection.insertOne(query);
        //     res.send(result);
        // })

        // app.post('/community-posts', async (req, res) => {
        //     const query = req.body;
        //     try {
        //         const result = await communityPostsCollection.insertOne(query);
        //         res.send(result)
        //     } catch (error) {
        //         console.log(error);
        //         res.status(401).json({
        //             success: false,
        //             message: 'something went wrong!'
        //         })
        //     }
        // })

        // app.get('/community-posts', async (req, res) => {
        //     const search = {};
        //     const result = await communityPostsCollection.find(search).toArray();
        //     console.log(result);
        //     res.send(result);
        // })


        // app.post('/testimonial', async (req, res) => {
        //     const query = req.body;
        //     const result = await testimonialCollection.insertOne(query);
        //     res.send(result);
        // })

        // app.get('/testimonial', async (req, res) => {
        //     const search = {};
        //     const result = await testimonialCollection.find(search).toArray();
        //     console.log(result);
        //     res.send(result);
        // })


        // app.post('/volunteer', async (req, res) => {
        //     const query = req.body;
        //     const query_ano = {Email : query.Email};
        //     const result_temp = await volunteerCollection.findOne(query_ano);
        //     if(result_temp) {
        //       return res.status(404).json({
        //              result_temp,
        //              message: 'you already a volunteer',
        //              success : false
        //          })
        //     }
        //     const result = await volunteerCollection.insertOne(query);
        //     res.send(result);
        // })

        // app.get('/volunteer', async (req, res) => {
        //     const search = {};
        //     const result = await volunteerCollection.find(search).toArray();
        //     res.send(result);
        // })



        // app.get('/leaderboard', async (req, res) => {
        //     const search = {};
        //     const result = await donorCollection.find(search).sort({ total_donation: -1 }).toArray();
        //     console.log(result);
        //     res.send(result);
        // })

        // app.delete('/supplies/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) };
        //     const result = await suppliesCollection.deleteOne(query);
        //     res.send(result);
        // });
        // ==============================================================

        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});