'use client';
import { useState } from 'react';
import { paymentAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function PaymentPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.createOrder();
      setOrderData(res.data);

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => openRazorpay(res.data);
      document.body.appendChild(script);
    } catch (err) {
      if (err.code === 'FEE_ALREADY_PAID') {
        toast.info('Registration fee has already been paid!');
      } else {
        toast.error(err.message || 'Failed to create payment order.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openRazorpay = (data) => {
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: 'Teacher Recruitment System',
      description: 'School Registration Fee',
      order_id: data.orderId,
      handler: async (response) => {
        // Called when payment succeeds — verify on backend
        try {
          await paymentAPI.verifyPayment(response);
          toast.success('Payment successful! Your school is now fully activated.');
          setOrderData(null);
        } catch {
          toast.error('Payment verification failed. Please contact support.');
        }
      },
      theme: { color: '#2563EB' },
      modal: {
        ondismiss: () => toast.warning('Payment cancelled. You can try again anytime.'),
      },
    };

    const rzp = new window.Razorpay(options);

    // Handle payment failure (card declined, insufficient balance, etc.)
    rzp.on('payment.failed', (response) => {
      toast.error(
        response.error?.description || 'Payment failed. Please try again.'
      );
    });

    rzp.open();
  };

  return (
    <>
      <div className="topbar"><div className="topbar-left"><h1>Payment</h1></div></div>
      <div className="page-content">
        <div className="card" style={{ maxWidth: '520px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>💳</div>
            <h3>School Registration Fee</h3>
            <p style={{ marginTop: 'var(--space-sm)' }}>
              Complete your registration by paying the one-time fee.
            </p>
            <div style={{
              fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--blue-700)',
              margin: 'var(--space-lg) 0', padding: 'var(--space-md)', background: 'var(--blue-50)',
              borderRadius: 'var(--radius-md)',
            }}>
              ₹5,000
            </div>
            <button className="btn btn-primary btn-lg btn-block" onClick={handleCreateOrder} disabled={loading}>
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-md)' }}>
              Secure payment via Razorpay. Supports UPI, cards, netbanking.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
