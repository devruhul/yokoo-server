const { MongoClient, ServerApiVersion } = require('mongodb');
const admin = require("firebase-admin");
const express = require('express');
const app = express();
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// initialize firebase admin
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6jlv6.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Verify token
async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        try {
            const decodedIdToken = await admin.auth().verifyIdToken(idToken);
            req.decodedEmail = decodedIdToken.email;
        }
        catch (error) {
            console.error("Error while verifying token:", error);
            res.status(403).send("Unauthorized");
        }
    }
    next()
}

async function run() {
    try {
        const database = client.db("yokooBicycle");
        const bicyclesCollection = database.collection("bicycles");
        const bookingsCollection = database.collection("bookings");
        const usersCollection = database.collection("users");
        const contactsCollection = database.collection("contacts");
        const reviewsCollection = database.collection("reviews");

        // send bicycle to database
        app.post('/bicycle', async (req, res) => {
            const bicycle = req.body;
            const result = await bicyclesCollection.insertOne(bicycle);
            res.send(result);
        });

        // get 3 bicycles from database
        app.get('/bicycles', async (req, res) => {
            const bicycles = await bicyclesCollection.find({}).limit(3).toArray();
            res.send(bicycles);
        })

        // get all bicycles from database
        app.get('/allBicycles', async (req, res) => {
            const bicycles = await bicyclesCollection.find({}).toArray();
            res.send(bicycles);
        })


        // delete bicycle from database
        app.delete('/bicycles/:id', async (req, res) => {
            const deleteBicycleId = req.params;
            const result = await bicyclesCollection.deleteOne({ _id: new ObjectId(deleteBicycleId) });
            res.send(result);
        })

        // get a bicycle from database
        app.get('/bicycles/:id', async (req, res) => {
            const id = req.params.id;
            const bicycle = await bicyclesCollection.findOne({ _id: new ObjectId(id) });
            res.send(bicycle);
        })

        // book a bicycle
        app.post('/booking', async (req, res) => {
            const book = req.body;
            const result = await bookingsCollection.insertOne(book);
            res.send(result);
        })

        // get current user order by email
        app.get('/booking/:email', async (req, res) => {
            const email = req.params.email;
            const booking = await bookingsCollection.find({ userEmail: email }).toArray();
            res.send(booking);
        })

        // save users to database
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // uodate user if not existed
        app.put('/users', async (req, res) => {
            const user = req.body;
            const query = { userEmail: user.email };
            const result = await usersCollection.updateOne(query, { $set: user }, { upsert: true });
            res.send(result);
        })

        // check if user roll is admin or not
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // add admin roll to user
        app.put('/users/makeAdmin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ userEmail: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { userEmail: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }
        })

        // send review to database
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        })

        // send contacts to database
        app.post('/contact', async (req, res) => {
            const review = req.body;
            const result = await contactsCollection.insertOne(review);
            res.send(result);
        })


    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);

// create root api
app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.listen(port, () => {
    console.log(`Yokoo server listening at ${port}`);
})


