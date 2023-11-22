import { Schema, model } from 'mongoose';

// Define the StripeCustomer schema
const stripeCustomerSchema = new Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  
  // Add any other fields you want to store for the customer
  // For example, you might want to store subscription information or payment methods.
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Create the StripeCustomer model
const StripeCustomer = model('StripeCustomer', stripeCustomerSchema);

export default StripeCustomer;
