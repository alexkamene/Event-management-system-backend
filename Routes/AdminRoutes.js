const express = require('express');
const User = require('../Models/User');
const Event = require('../Models/Event');
const jwt = require('jsonwebtoken');
// Import the middleware
const router = express.Router();
// Middlewares
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


          console.log(req.userId)
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


router.get('/users',verifyToken,verifyOrganizer, async (req, res) => {
  const users = await User.find();
  res.json(users);
});


router.get('/admin/users',verifyToken,verifyAdmin, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

//get all organizers
router.get('/organizers',verifyToken,verifyAdmin,async(req,res)=>{

try {
    const organizers=await User.find({role:'organizer'})
    res.status(200).send(organizers)

} catch (error) {
    res.status(500).send({message:'Server error'})
}

})
//// Get all events with the number of registered users
router.get('/events',async(req,res)=>{


    try {
const event=await Event.find().populate('participants','name email')
const eventdetails=event.map(e=>({
    id: event._id,
      name: event.name,
      description: event.description,
      venue: event.venue,
      date: event.date,
      ticketPrice: event.ticketPrice,
      availableTickets: event.availableTickets,
      participantsCount: event.participants.length

}))
res.status(200).send(eventdetails)
        
    } catch (error) {
        
    }
})

// Get recent events with status
router.get('/recent-events',verifyToken,verifyAdmin, async (req, res) => {
    try {
      const recentEvents = await Event.find()
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order
        .populate('participants', 'name email'); // Populate participants if needed
  
      const categorizedEvents = recentEvents.map(event => ({
        id: event._id,
        name: event.name,
        description: event.description,
        venue: event.venue,
        date: event.date,
        ticketPrice: event.ticketPrice,
        participantsCount: event.participants.length,
        availableTickets:event.availableTickets,
        status: event.status, // Add event status
      }));
  
      res.json(categorizedEvents);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

//ban a user
router.put('/users/:id/ban',verifyToken,verifyAdmin,async(req,res)=>{

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    user.banned = true;  // Assuming you have a banned field in the User model
    await user.save();
    res.json({ msg: 'User has been banned' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
  


});
//unban a user
router.put('/users/:id/unban',verifyToken,verifyAdmin,async(req,res)=>{
 const user=await User.findById(req.params.id)
  if(!user){
    return res.status(404).send({message:'User not found'})
  }
  user.banned=false
  await user.save()

  res.status(200).send({message:'User' + user.name + 'has been unbanned'})


})
//delete a user
router.delete('/users/:id',verifyToken,verifyAdmin,async(req,res)=>{

  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
  
})
//delete an event
router.delete('/events/:id',verifyToken,verifyAdmin,async(req,res)=>{

  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.json({ msg: 'Event deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
  
})
//update event status
router.put('/events/:id/status',verifyToken,verifyAdmin,async(req,res)=>{
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    event.status = req.body.status;
    await event.save();
    res.json({ msg: 'Event status updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
})
//update event details
router.put('/events/:id',verifyToken,verifyAdmin,async(req,res)=>{
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    event.name = req.body.name;
    event.description = req.body.description;
    event.venue = req.body.venue;
    event.date = req.body.date;
    event.ticketPrice = req.body.ticketPrice;
    event.availableTickets = req.body.availableTickets;
    await event.save();
    res.json({ msg: 'Event updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
})

//get all events
router.get('/events',verifyToken,verifyAdmin,async(req,res)=>{
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
})
//register a user as an organizer
router.put('/users/:id/organizer',verifyToken,verifyAdmin,async(req,res)=>{
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    user.role = 'organizer';
    await user.save();
    res.json({ msg: 'User is now an organizer' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
})
//register a user as an admin
router.put('/users/:id/admin',verifyToken,verifyAdmin,async(req,res)=>{
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    user.role = 'admin';
    await user.save();
    res.json({ msg: 'User is now an admin' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
})
//get all users
router.get('/users',verifyToken,verifyAdmin,async(req,res)=>{
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
})
//generate user Activity report
router.get('/reports/user-activity', verifyToken,verifyAdmin, async (req, res) => {
  try {
    const users = await User.find();
    const report = users.map(user => ({
      name: user.name,
      email: user.email,
      registeredAt: user.createdAt,
      banned: user.banned,
      // eventsParticipated: await TicketPurchase.countDocuments({ user: user._id }),
    }));
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
// // Generate Event Participation Report
// router.get('/reports/event-participation', auth, adminMiddleware, async (req, res) => {
//   try {
//     const events = await Event.find();
//     const report = await Promise.all(events.map(async (event) => {
//       const participantsCount = await TicketPurchase.countDocuments({ event: event._id });
//       return {
//         title: event.title,
//         date: event.date,
//         participantsCount,
//       };
//     }));
//     res.json(report);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// });
// Check Server Health
router.get('/health', (req, res) => {
  res.json({ message: 'Server is up and running' });
});

router.get('/events-organizer', verifyToken, verifyOrganizer, async (req, res) => {
  const organizerId =  req.userId;  // Using user ID from token

  try {
    const events = await Event.find({organizer:organizerId});

    if (!events || events.length === 0) {
      return res.status(404).json({ message: 'No events found for this organizer' });
    }

    return res.status(200).json(events);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});










module.exports = router;