const nodemailer = require('nodemailer');
require('dotenv').config()


    const sendRegistrationEmail = async (email, eventDetails) => {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: `Registration Confirmation for ${eventDetails.title}`,
          html: `
            <h3>Thank you for registering for the event!</h3>
            <p><strong>Event:</strong> ${eventDetails.title}</p>
            <p><strong>Date:</strong> ${new Date(eventDetails.date).toLocaleDateString()}</p>
            <p><strong>Venue:</strong> ${eventDetails.venue}</p>
            <p>We look forward to seeing you at the event!</p>
          `,
        };
const sendRegistrationEmail = async (email, eventDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Registration Confirmation for ${eventDetails.title}`,
    html: `
      <h3>Thank you for registering for the event!</h3>
      <p><strong>Event:</strong> ${eventDetails.title}</p>
      <p><strong>Date:</strong> ${new Date(eventDetails.date).toLocaleDateString()}</p>
      <p><strong>Venue:</strong> ${eventDetails.venue}</p>
      <p>We look forward to seeing you at the event!</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};



}

module.exports = { sendRegistrationEmail };