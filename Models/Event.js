const mongoose=require('mongoose')
const {Schema}=mongoose
const eventSchema=new mongoose.Schema({

    name: String,
    description: String,
    venue: String,
    date: Date,
    ticketPrice: Number,
    availableTickets: Number,
    image: String,
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }]
,
   
    







},{timestamps:true})

module.exports=mongoose.model('Event',eventSchema)
