import React, { useState } from 'react';
import axios from 'axios';
import './Payments.css';

const Payments = ({ 
  seats, // Changed from seat to seats (array)
  schedule,
  user, 
  onSuccess, 
  onCancel,
  selectedSchedule,
  totalFare // Optional: can be calculated internally if not provided
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  
  // Define base fares for different seat classes
  const baseFares = {
    'AC': 1500, // AC class base fare
    'SL': 800,  // Sleeper class base fare
  };

  // Determine seat class based on seat number
  const getSeatClass = (seatNumber) => {
    if (!seatNumber) return 'AC'; // Default to AC if no seat number
    return seatNumber.startsWith('S') ? 'SL' : 'AC';
  };

  // Calculate fare based on all selected seats and user role
  const calculateFare = () => {
    // If totalFare is provided directly, use it
    if (totalFare) return totalFare;
    
    // Otherwise calculate based on seats
    if (!seats || !seats.length) return 0;
    
    // For backward compatibility - handle both single seat and array of seats
    const seatsArray = Array.isArray(seats) ? seats : [seats];
    
    let totalAmount = 0;
    seatsArray.forEach(seat => {
      const seatClass = getSeatClass(seat?.seat_number);
      const baseFare = baseFares[seatClass] || baseFares['AC'];
      totalAmount += baseFare;
    });
    
    // Apply 50% discount for staff members
    const discountFactor = user?.role === 'Staff' ? 0.5 : 1;
    return totalAmount * discountFactor;
  };

  const fareAmount = calculateFare();
  
  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Limit to 16 digits
    const trimmed = cleaned.substring(0, 16);
    
    // Add spaces every 4 digits
    const formatted = trimmed.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    return formatted;
  };

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Format as MM/YY
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    }
    
    setExpiryDate(value);
  };

  const handleCvvChange = (e) => {
    // Only allow 3-4 digits
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCvv(value);
  };

  // Simplified payment processing for multiple seats
  const processPayment = async () => {
    // Form validation
    if ((paymentMethod === 'credit' || paymentMethod === 'debit') && 
        (!cardNumber || !expiryDate || !cvv || !nameOnCard)) {
      setError('Please fill in all payment details');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Ensure seats is always an array
      const seatsArray = Array.isArray(seats) ? seats : [seats];
      
      // Get all seat IDs
      const seatIds = seatsArray.map(seat => seat.seat_id);
      
      // Simplified payload for multiple seats
      const paymentData = {
        user_id: user.user_id,
        seat_ids: seatIds, // Array of seat IDs
        schedule_id: selectedSchedule,
        amount: fareAmount,
        payment_method: paymentMethod
      };
      
      console.log('Payment data being sent:', paymentData);
      
      // Process payment
      const paymentResponse = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/payments/process`, paymentData);
      
      console.log('Payment response:', paymentResponse.data);
      
      if (paymentResponse.data.success) {
        // Create ticket after successful payment
        const ticketResponse = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/tickets/create`, {
          booking_id: paymentResponse.data.booking_id
        });
        
        console.log('Ticket response:', ticketResponse.data);
        
        // Add seat numbers to ticket data for display
        const ticketWithSeats = {
          ...ticketResponse.data,
          seat_numbers: seatsArray.map(seat => seat.seat_number).join(', '),
          total_fare: fareAmount
        };
        
        setLoading(false);
        onSuccess(ticketWithSeats);
      } else {
        throw new Error('Payment failed');
      }
    } catch (err) {
      console.error('Error during payment:', err);
      
      // Check for seat already booked error
      if (err.response?.data?.seatAlreadyBooked) {
        setError('One or more seats have already been booked. Please select different seats.');
      } else {
        setError(err.response?.data?.error || 'Payment processing failed. Please try again.');
      }
      
      setLoading(false);
    }
  };

  // Ensure seats is always an array for rendering
  const seatsArray = Array.isArray(seats) ? seats : [seats];

  return (
    <div className="payment-container">
      <div className="payment-modal">
        <div className="payment-header">
          <h2>Payment Details</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="booking-summary">
          <h3>Booking Summary</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Train:</span>
              <span>{schedule?.train_name}</span>
            </div>
            <div className="summary-row">
              <span>Date:</span>
              <span>{new Date(schedule?.travel_date).toLocaleDateString()}</span>
            </div>
            <div className="summary-row">
              <span>Time:</span>
              <span>{schedule?.departure_time} to {schedule?.arrival_time}</span>
            </div>
            <div className="summary-row">
              <span>Seats:</span>
              <span>{seatsArray.map(seat => seat.seat_number).join(', ')}</span>
            </div>
            <div className="summary-row fare">
              <span>Fare:</span>
              <span>{formatCurrency(fareAmount)}</span>
            </div>
            {user?.role === 'Staff' && (
              <div className="discount-badge">Staff Discount: 50% Off</div>
            )}
          </div>
        </div>
        
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        <div className="payment-methods">
          <div className="method-selector">
            <button
              className={paymentMethod === 'credit' ? 'active' : ''}
              onClick={() => setPaymentMethod('credit')}
            >
              Credit Card
            </button>
            <button
              className={paymentMethod === 'debit' ? 'active' : ''}
              onClick={() => setPaymentMethod('debit')}
            >
              Debit Card
            </button>
            <button
              className={paymentMethod === 'netbanking' ? 'active' : ''}
              onClick={() => setPaymentMethod('netbanking')}
            >
              Net Banking
            </button>
          </div>
          
          <div className="payment-form">
            {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
              <>
                <div className="form-group">
                  <label>Name on Card</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={nameOnCard}
                    onChange={(e) => setNameOnCard(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group half">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={handleExpiryDateChange}
                    />
                  </div>
                  <div className="form-group half">
                    <label>CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cvv}
                      onChange={handleCvvChange}
                    />
                  </div>
                </div>
              </>
            )}
            
            {paymentMethod === 'netbanking' && (
              <div className="netbanking-options">
                <div className="bank-option">
                  <input type="radio" id="sbi" name="bank" value="sbi" defaultChecked />
                  <label htmlFor="sbi">State Bank of India</label>
                </div>
                <div className="bank-option">
                  <input type="radio" id="hdfc" name="bank" value="hdfc" />
                  <label htmlFor="hdfc">HDFC Bank</label>
                </div>
                <div className="bank-option">
                  <input type="radio" id="icici" name="bank" value="icici" />
                  <label htmlFor="icici">ICICI Bank</label>
                </div>
                <div className="bank-option">
                  <input type="radio" id="axis" name="bank" value="axis" />
                  <label htmlFor="axis">Axis Bank</label>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {error && <div className="payment-error">{error}</div>}
        
        <div className="payment-actions">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button 
            className="pay-btn" 
            onClick={processPayment}
            disabled={loading || successMessage}
          >
            {loading ? 'Processing...' : `Pay ${formatCurrency(fareAmount)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payments;
