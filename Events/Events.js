const express = require('express');
const router = express.Router();
const Event = require('../Models/Event');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const mongoose = require('mongoose');
const Notification=require('../Models/Notification')




// Middleware to check if the user is an organizer

const verifyToken = (req, res, next) => {
    try {
        // Extract token from the Authorization header
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(400).send("You don't have a token");
        }

        // Verify the token
        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                console.error('Token verification failed:'); // Log the error
                return res.sendStatus(403); // Forbidden
            }

            // Set user ID from the token
            req.userId = decoded._id;
            req.user = decoded; // Set the user object


            
            next(); // Call the next middleware or route handler
        });

    } catch (error) {
        console.error('Error occurred in verifyToken middleware:', error); // Log the error
        return res.status(500).send("An error occurred"); // Internal server error
    }
};
const verifyOrganizer = async (req, res, next) => {
    // First, verify the token
    await verifyToken(req, res, async () => {
        // After verifying the token, check the user's role
        const user = await User.findById(req.userId); // Fetch user based on userId set by verifyToken

        console.log(user)
        if (!user || user.role !== 'organizer') {
            return res.status(403).send('Access denied: You are not an organizer'); // Forbidden
        }
        next(); // Proceed to the next middleware if the user is an organizer
    });
}
const verifyAdmin = async (req, res, next) => {
    // First, verify the token
    await verifyToken(req, res, async () => {
        // After verifying the token, check the user's role
        const user = await User.findById(req.userId); // Fetch user based on userId set by verifyToken
        if (!user || user.role !== 'admin') {
            return res.status(403).send('Access denied: You are not an admin'); // Forbidden
        }
        next(); // Proceed to the next middleware if the user is an admin
    });
};

// Create an event (Organizer only)
router.post('/addEvent', verifyToken, verifyOrganizer, async (req, res) => {
    try {
        const { name, description, venue, date, ticketPrice, availableTickets, image } = req.body;

        // Validate required fields
        if (!name || !description || !venue || !date || !ticketPrice || !availableTickets || !image) {
            return res.status(400).send({ message: 'All fields are required.' });
        }

        const event = new Event({
            name,
            description,
            venue,
            date,
            ticketPrice,
            availableTickets,
            image,
            organizer: req.userId // This is correct
        });

        await event.save();
        console.log('User ID before creating notifications:', req.userId);
        
        // Create Notification for all users
        const users = await User.find(); // Fetch all users

        const notificationPromises = users.map(async user => {
            // Check if a notification for this event already exists for this user
            const existingNotification = await Notification.findOne({
                userId: user._id,
                eventId: event._id
            });

            // Only create a new notification if it doesn't exist
            if (!existingNotification) {
                const notification = new Notification({
                    userId: user._id, // Use user._id to target specific users
                    message: `A new event has been added: ${event.name}`,
                    eventId: event._id,
                });
                return notification.save(); // Return the promise
            }
        });

        await Promise.all(notificationPromises.filter(Boolean)); // Wait for all notifications to be saved

        return res.status(201).send({ message: 'Event created successfully' });

    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).send({ message: 'Server error', error: error.message });
    }
});



// Get all events
router.get('/Events', async (req, res) => {
    try {
        const events = await Event.find();
        return res.status(200).send(events);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Server error', error: error.message });
    }
});

//get a single event
router.get('/events/:id', async (req, res) => {
 const id=req.params.id
 try {
  const event=await Event.findById(id)
    if(!event){
        return res.status(404).send({message:'Event not found'})
    }
    return res.status(200).send(event)

 } catch (error) {
    return res.status(500).send({ message: 'Server error', error: error.message });
    
 }




})




// Register for event (User)
// Register for event (User)
router.post('/events/register/:id', verifyToken, async (req, res) => {
    const id = req.params.id;

    try {
        // Find event by ID
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).send({ message: 'Event not found' });
        }
        // Check if tickets are available
        if (event.availableTickets <= 0) {
            return res.status(400).send({ message: 'No tickets available' });
        }

        // Check if user is already registered for the event
        if (event.participants.includes(req.userId.toString())) { // Check against userId string
            return res.status(400).send({ message: 'You already registered for this event' });
        }

        // Check if there are enough tickets available
        if (event.participants.length >= event.availableTickets) {
            return res.status(400).send({ message: 'Tickets are full' });
        }

        // Register user: add user to participants and decrement available tickets
        event.participants.push(req.userId); // Push the user ID
        event.availableTickets -= 1; // Decrement the ticket count
        await event.save(); // Save the event
         

         //create Notification to the organizer
            const notification = new Notification({

                userId:event.organizer,
             message: `A new user has registered for an event: ${event.name}`,
                eventId: event._id,



            });
            await notification.save();




        // Respond with success message and updated event info
        return res.status(200).send({
            message: 'Registered successfully',
            event: {
                id: event._id,
                name: event.name,
                availableTickets: event.availableTickets,
                participants: event.participants.length,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Server error', error: error.message });
    }
});
   //get the notification for a user
router.get('/notifications',verifyToken, async (req, res) => {
    
    const notifications = await Notification.find()
    .sort({ createdAt: -1 }).populate('eventId');
    res.json(notifications);



});
//mark notification as read
router.put('/notifications/:id/read',verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });

        res.status(200).json(notification);

    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Server error', error: error.message });
    }
});



//delele event
router.delete('/events/:id',verifyToken,verifyOrganizer, async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Server error', error: error.message });
    }
});




//get registerd event for a user

router.get('/events-registered',verifyToken, async (req, res) => {
    try {
        const userId = req.userId; // Get the user ID from the verified token

        // Find events where the user is a participant
        const registeredEvents = await Event.find({ participants: userId });

        if (!registeredEvents.length) {
            return res.status(404).send({ message: 'No registered events found.' });
        }

        return res.status(200).send(registeredEvents); // Send the events back to the client
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Server error', error: error.message });
    }
});

router.get('/organizer-event/:id', verifyToken, verifyOrganizer, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('participants'); // Populate participants
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'Error fetching event details', error: error.message });
    }
});

//get user profile
router.get('/profile',verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        return res.status(200).send(user);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Server error', error: error.message });
    }




});

//get events regitered by a user
router.get('/events-registered',verifyToken, async (req, res) => {
   const userId=req.userId
    try {
        const events = await Event.find({ participants: userId });
        if (!events.length) {
            return res.status(404).send({ message: 'No registered events found' });
        }
        return res.status(200).send(events);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Server error', error: error.message });
    }


})




//update user profile
router.put('/updateprofile',verifyToken, async (req, res) => {

    try {

        const updateddata=  req.body

        const user = await User.findByIdAndUpdate(req.userId, updateddata, { new: true });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
         res.status(200).send({ message: 'Profile updated successfully', user });
        
    } catch (error) {
        res.status(500).send({ message: 'Server error', error: error.message });
        
    }





});






//feedback collection

router.post('/event/feedback/:id',verifyToken,verifyOrganizer, async (req, res) => {
    try {
const {feedback}=req.body
const event=await Event.findById(req.params.id)
if(!event){
    return res.status(404).send({message:'Event not found'})
}
event.feedback.push({user:req.userId,feedback})
await event.save()
return res.status(200).send({message:'Feedback added successfully'})

        
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Server error', error: error.message });
        
    }






} );
// Get Feedback for an Event
router.get('/:id/feedback',verifyToken, async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
  
      // Check if the user is the organizer of the event
      if (!event || event.organizer.toString() !== req.user.userId) {
        return res.status(403).json({ msg: 'Unauthorized access' });
      }
  
      // Fetch feedback for this event
      const feedback = await Feedback.find({ event: event._id }).populate('user');
      res.json(feedback);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });



// Update Event (Organizer)
router.put('/events/:id',verifyToken,verifyOrganizer,async (req, res) => {
    const { name, description, venue, date, ticketPrice, availableTickets } = req.body;

    try {
        const event = await Event.findByIdAndUpdate(req.params.id,
            { name, description, venue, date, ticketPrice, availableTickets },
            { new: true });

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        return res.json(event);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Server error', error: error.message });
    }
});
// Delete Event (Organizer)
router.delete('/events/:id', verifyToken,verifyOrganizer, async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Server error', error: error.message });
    }
});
// filter events by date
router.get('/filter', async (req, res) => {
    try {
      const { location, date, type } = req.query;
  
      // Create a filter object
      let filter = {};
  
      // Filter by location if provided
      if (location) {
        filter.venue = { $regex: location, $options: 'i' };  // Case-insensitive search
      }
  
      // Filter by date if provided (date format should be validated in frontend)
      if (date) {
        filter.date = { $gte: new Date(date) };  // Get events from this date onward
      }
  
      // Filter by ticket type if provided
      if (type) {
        filter['tickets.type'] = { $regex: type, $options: 'i' };  // Filter by ticket type
      }
  
      // Fetch events from the database with applied filters
      const events = await Event.find(filter);
  
      res.json(events);
    } catch (err) {    
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

//populat events with participan







module.exports = router;
