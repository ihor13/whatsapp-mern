// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;


const pusher = new Pusher({
    appId: "1217655",
    key: "5ebe9b582330a7d9be54",
    secret: "c5c30571b8f16b4a8746",
    cluster: "us2",
    useTLS: true
  });

// middleware

app.use(express.json());
app.use(cors());
/*
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
})
*/
// DB config

const connection_URL = "mongodb+srv://admin:TF3cKCwWVcstSN7@cluster0.xj8g8.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_URL,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;

db.once('open', () =>{
    console.log('DB connected');

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received
                }
            );
        } else {
            console.log('Error triggering Pusher');
        }
    })
});



// ???

// api routes

app.get('/',(req,res) => res.status(200).send("Hello world"));

app.get('/api/v1/messages/sync', (req, res) => {
   Messages.find((err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    })
})

app.post('/api/v1/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(`new message created: \n ${data}`);
        }
    })
})

// listen

app.listen(port, () => console.log(`Listening on localhost: ${port}`));
