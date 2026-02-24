const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


// ১. DNS সমস্যা সমাধানের জন্য এই দুটি লাইন যোগ করুন
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// middleware
app.use(cors());
app.use(express.json());

// mongo uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vknfgr8.mongodb.net/?retryWrites=true&w=majority`;

// client
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// collections
let servicesCollection;
let bookingsCollection;

async function run() {
    try {
        await client.connect();
        console.log("MongoDB connected successfully ✅");



        const database = client.db("homeHeroDB");
        servicesCollection = database.collection("services");
        bookingsCollection = database.collection("bookings");

        // All services routes apis

        // post a service
        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await servicesCollection.insertOne(service);
            res.send(result);
        });

        // get all services
        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find();
            const services = await cursor.toArray();
            res.send(services);
        });     

        // get a service by id
        app.get('/services/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const service = await servicesCollection.findOne({
                    _id: new ObjectId(id)
                });

                if (!service) {
                    return res.status(404).send({ message: "Service not found" });
                }

                res.send(service);
            } catch (error) {
                res.status(500).send({ message: "Invalid ID" });
            }
        });


        // put service by id
        app.put('/services/:id', async (req, res) => {
            try {
                const id = req.params.id;

                // Validate ObjectId
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ message: "Invalid service ID" });
                }

                const updatedService = req.body;

                const filter = { _id: new ObjectId(id) };

                const updateDoc = {
                    $set: {
                        serviceName: updatedService.serviceName,
                        category: updatedService.category,
                        price: updatedService.price,
                        description: updatedService.description,
                        image: updatedService.image,
                        providerName: updatedService.providerName,
                        providerEmail: updatedService.providerEmail,
                        updatedAt: new Date()
                    }
                };

                const result = await servicesCollection.updateOne(filter, updateDoc);

                if (result.matchedCount === 0) {
                    return res.status(404).send({ message: "Service not found" });
                }

                res.send(result);

            } catch (error) {
                res.status(500).send({ message: "Failed to update service" });
            }
        });


        // delete service by id
        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await servicesCollection.deleteOne(query);
            res.send(result);
        });
        

        // bookings routes apis

        // post a booking
        app.post('/bookings', async (req, res) => {
            const booking = req.body;

            booking.status = "pending";   
            booking.createdAt = new Date(); 

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        // get all bookings
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;   // ✅ ADD THIS

            let query = {};

            if (email) {                     // ✅ ADD THIS BLOCK
                query = { userEmail: email };
            }

            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        }); 

        // get a booking by id
        // get a booking by id
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid booking ID" });
            }

            const booking = await bookingsCollection.findOne({
                _id: new ObjectId(id)
            });

            if (!booking) {
                return res.status(404).send({ message: "Booking not found" });
            }

            res.send(booking);
        });


        // update booking status
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid booking ID" });
            }

            const result = await bookingsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: status } }
            );

            res.send(result);
        });


        // delete booking
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid booking ID" });
            }

            const result = await bookingsCollection.deleteOne({
                _id: new ObjectId(id)
            });

            res.send(result);
        });

        

        // root route
        app.get('/', (req, res) => {
            res.send("Backed server on running.. Welcome to HomeHero API");
        });


    } catch (error) {
        console.error(error);
    }
}

run();

// listen
app.listen(port, () => {
    console.log(`HomeHero server running on port ${port}`);
});
