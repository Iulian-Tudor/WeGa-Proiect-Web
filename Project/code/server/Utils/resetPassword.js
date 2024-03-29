import { connectToDb } from '../db/db.js';
import bcrypt from 'bcryptjs';
import sanitize from 'mongo-sanitize';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

function generateUniqueToken() {
  return crypto.randomBytes(32).toString('hex');
}

const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  secureConnection: true,
  port: 587,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function requestPasswordReset(req, res) {
  const { email } = req.body;
  const sanitizedEmail = sanitize(email);

  const { db, client } = await connectToDb();

  try {
    const user = await db.collection('users').findOne({ email: sanitizedEmail });

    if (!user) {
      res.statusCode = 404;
      res.end('Email not found');
      return;
    }

    const resetToken = generateUniqueToken();
    await db.collection('password_reset').insertOne({ token: resetToken, email: sanitizedEmail });

    const content = {
      from: process.env.EMAIL_USERNAME,
      to: sanitizedEmail,
      subject: 'Password Reset',
      html: `<p>Click the link to reset your password: <a href="${process.env.BASE_URL}/html/resetPass.html?token=${resetToken}">Reset password</a></p>`
    };
    

    await transporter.sendMail(content);
    res.setHeader('Location', '/html/passwordEmail.html'); // Set the Location header to the desired redirect path
    res.statusCode = 302; // Set the status code to 302 for a temporary redirect
    res.end();
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end('Internal server error');
  } finally {
    client.close();
  }
}


export async function resetPassword(req, res) {
  
    const formData = req.body;
    const { token, newPassword } = formData;

    const { db, client } = await connectToDb();

    try {
      const resetEntry = await db.collection('password_reset').findOne({ token });

      if (!resetEntry) {
        res.statusCode = 400;
        res.end('Invalid token');
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.collection('users').updateOne({ email: resetEntry.email }, { $set: { password: hashedPassword } });

      await db.collection('password_reset').deleteOne({ token });

      res.setHeader('Location', '/html/passwordChanged.html'); // Set the Location header to the desired redirect path
      res.statusCode = 302; // Set the status code to 302 for a temporary redirect
      res.end();
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.end('Internal server error');
    } finally {
      client.close();
    }
  };


