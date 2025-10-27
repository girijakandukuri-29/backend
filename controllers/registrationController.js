const Registration = require('../models/Registration');
const Event = require('../models/Event');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');


async function generateTicketPDF(registration, event) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, `../tickets/ticket_${registration._id}.pdf`);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    
    doc.fontSize(20).text("🎟 Event Ticket", { align: 'center' }).moveDown();

    // Event Info
    doc.fontSize(14).text(`Event: ${event.title}`);
    doc.text(`Location: ${event.location}`);
    doc.text(`Date: ${new Date(event.startAt).toLocaleString()}`);
    doc.text(`Registered by: ${registration.user.name} (${registration.user.email})`);

    doc.moveDown();

    // Generate QR and embed (encode ticketId)
    QRCode.toDataURL(registration.ticketId, (err, url) => {
      if (err) return reject(err);
      const qrImage = url.replace(/^data:image\/png;base64,/, "");
      const imgBuffer = Buffer.from(qrImage, 'base64');
      doc.image(imgBuffer, { fit: [150, 150], align: 'center' });
      doc.end();
    });

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}


async function sendTicketEmail(user, event, pdfPath) {
  // In development or when EMAIL_DISABLE=true, use a no-op transport to avoid network/tls issues
  if (process.env.EMAIL_DISABLE === 'true') {
    return Promise.resolve();
  }

  const transporter = nodemailer.createTransport({
    service: "gmail", // configure proper SMTP in production
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Allow self-signed in dev environments only
    tls: { rejectUnauthorized: false }
  });

  await transporter.sendMail({
    from: `"Event Portal" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Your Ticket for ${event.title}`,
    text: `Hi ${user.name},\n\nThank you for registering for ${event.title}.\nAttached is your ticket.\n\nSee you at the event!`,
    attachments: [
      { filename: `ticket_${event.title}.pdf`, path: pdfPath }
    ]
  });
}

exports.registerForEvent = async (req, res) => {
  try {
    const user = req.user;
    const { eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    // Check if already registered
    const existing = await Registration.findOne({ user: user.userId, event: eventId });
    if (existing) return res.status(400).json({ msg: 'Already registered for this event' });

    // Atomically increment seatsBooked if capacity not reached
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, $expr: { $lt: ['$seatsBooked', '$capacity'] } },
      { $inc: { seatsBooked: 1 } },
      { new: true }
    );
    if (!updatedEvent) {
      return res.status(400).json({ msg: 'Event is full' });
    }

    // Generate ticket identifier
    const ticketId = `${user.userId}-${eventId}-${Date.now()}`;

    // Save registration (QR will be derived from ticketId)
    const registration = await Registration.create({
      user: user.userId,
      event: eventId,
      ticketId
    });

    // Populate user for PDF
    await registration.populate("user", "name email");
    await registration.populate("event", "title location startAt");

    // Generate ticket PDF
    const pdfPath = await generateTicketPDF(registration, updatedEvent);
    // Save PDF location for later download
    registration.pdfUrl = pdfPath;
    await registration.save();

    // Send ticket by email, but don't fail registration if email fails
    try {
      await sendTicketEmail(registration.user, updatedEvent, pdfPath);
    } catch (mailErr) {
      console.error(mailErr);
    }

    res.status(201).json({ msg: "Registered successfully", registration });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
