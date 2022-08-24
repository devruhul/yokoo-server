const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6jlv6.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const database = client.db("yokooBicycle");
        const bicyclesCollection = database.collection("bicycles");

        // send bicycle to database
        app.post('/bicycle', async (req, res) => {
            const bicycle = req.body;
            const result = await bicyclesCollection.insertOne(bicycle);
            res.send(result);
        });


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


