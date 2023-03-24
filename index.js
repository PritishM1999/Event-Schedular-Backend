const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/myEventScheduler', { useNewUrlParser: true })
    .then(() => {
        console.log('MongoDB connected Sucessfully')
    })
    .catch((err) => {
        console.log('Error connecting to mongoDB:', err);
    });

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true }
});

let Event = mongoose.model('Event', eventSchema);

app.post('/events', async (req, res) => {
    let { title, description, startTime, endTime } = req.body;

    let parsed_startTime = new Date(startTime)
    let parsed_endTime = new Date(endTime);

    let event = new Event(req.body);
    event.save()
        .then(() => {
            res.status(201).json(event);
        })
        .catch((err) => {
            if (err.name == 'ValidationError') {
                res.status(400).json({ err: message })
            } else {
                res.status(500).json({ err: err.message });
            }

            // res.status(201).send(event);
        });

});

app.get('/v1/events', async (req, res) => {
    Event.find()
        .then((events) => {
            res.json(events);
        })
        .catch((err) => {
            res.status(500).json({ err: err.message });
        });
});

app.get('/v1/events/:eventId', async (req, res) => {
    let { eventId } = req.params;
    Event.findById(eventId)
        .then((event) => {
            if (event) {
                res.json(event);
            } else {
                res.status(404).json({ err: 'Event not found' });
            }
        })
        .catch((err) => {
            res.status(500).json({ err: err.message });
        });
});
//Delete event
app.delete('/v1/events/:eventId', async (req, res) => {
    let { eventId } = req.params;
    Event.findByIdAndDelete(eventId)
        .then((event) => {
            if (event) {
                res.status(204).end();
            } else {
                res.status(404).json({ err: 'Event not found' });
            }
        })
        .catch((err) => {
            res.status(500).json({ err: err.message });
        });
});


//7
app.put('/v1/events/:eventId', async (req, res) => {
    let { eventId } = req.params;
    Event.findOneAndUpdate(eventId, req.body, { new: true, runValidators: true})
        .then((event) => {
            if (event) {
                res.json(event);
            } else {
                res.status(404).json({ err: 'Validation error: title is required' });
            }
        })
        .catch((err) => {
            if(err.name == 'ValidationError'){
                res.status(400).json({err: err.message})
            }
            else {
                res.status(500).json({
                    err: err.message
                });
            }
        });
});
// app.put('/v1/events/:eventId', async (req, res) => {
//     try {
//         let event = await Event.findByIdAndUpdate(req.params.eventId, req.body, { new: true });
//         res.json(event);
//     }
//     catch (err) {
//         res.status(400).json({
//             err: 'Validation error:title is required',
//             message: err.message
//         });
//     }
// });


//8
let eventExists = async (req, res, next) => {
    try {
        let event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({
                err: 'Not Found',
                message: 'There is no event with that id'
            });
        }
        req.event = event;
        next();
    }
    catch (err) {
        res.status(500).json({
            err: 'Internal Serer Error',
            message: err.message
        });
    }
};

app.get('/v1/events/:eventId', eventExists, (req, res) => {
    res.json(req.event)
})

//9
app.delete('/v1/events/:eventId', eventExists, async (req, res) => {
    try {
        await req.event.remove();
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({
            err: 'Internal Serer Error',
            message: err.message
        });
    }
});





app.listen(3000, () => console.log('Server is started at port 3000'));