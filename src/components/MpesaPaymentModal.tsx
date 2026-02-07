'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, XCircle, Phone } from 'lucide-react';

interface MpesaPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: {
        id: number;
        name: string;
        phone: string;
    };
    amount: number;
    invoiceId?: number;
    invoiceNumber?: string;
    onSuccess?: () => void;
}

export default function MpesaPaymentModal({
    isOpen,
    onClose,
    tenant,
    amount,
    invoiceId,
    invoiceNumber,
    onSuccess,
}: MpesaPaymentModalProps) {
    const [phoneNumber, setPhoneNumber] = useState(tenant.phone || '');
    const [paymentAmount, setPaymentAmount] = useState(amount.toString());
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
    const [message, setMessage] = useState('');
    const [checkoutRequestId, setCheckoutRequestId] = useState('');

    // Update phone number when tenant changes
    useEffect(() => {
        if (tenant?.phone) {
            setPhoneNumber(tenant.phone);
        }
    }, [tenant]);

    if (!isOpen) return null;

    const formatPhoneNumber = (phone: string) => {
        // Remove any non-digit characters
        let cleaned = phone.replace(/\D/g, '');

        // If starts with 0, replace with 254
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        }

        // If doesn't start with 254, add it
        if (!cleaned.startsWith('254')) {
            cleaned = '254' + cleaned;
        }

        return cleaned;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('pending');
        setMessage('Initiating payment...');

        try {
            const formattedPhone = formatPhoneNumber(phoneNumber);
            const accountReference = invoiceNumber || `T${tenant.id}`;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/mpesa/stk-push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    phone_number: formattedPhone,
                    amount: parseFloat(paymentAmount),
                    account_reference: accountReference,
                    transaction_desc: `Previous Balance Payment for ${tenant.name}`,
                    tenant_id: tenant.id,
                    invoice_id: invoiceId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCheckoutRequestId(data.checkout_request_id);
                setMessage('Payment request sent! Please check your phone and enter M-Pesa PIN.');

                // Start polling for payment status
                pollPaymentStatus(data.checkout_request_id);
            } else {
                setStatus('failed');
                setMessage(data.message || 'Failed to initiate payment');
                setLoading(false);
            }
        } catch (error) {
            setStatus('failed');
            setMessage('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    const pollPaymentStatus = async (requestId: string) => {
        let attempts = 0;
        const maxAttempts = 30; // Poll for up to 2.5 minutes (30 * 5 seconds)

        const poll = setInterval(async () => {
            attempts++;

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/mpesa/query/${requestId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                const data = await response.json();

                if (data.success && data.data.ResultCode !== undefined) {
                    clearInterval(poll);

                    if (data.data.ResultCode === '0') {
                        setStatus('success');
                        setMessage('Payment successful! Invoice updated.');
                        setLoading(false);

                        setTimeout(() => {
                            onSuccess?.();
                            onClose();
                        }, 2000);
                    } else {
                        setStatus('failed');
                        setMessage(data.data.ResultDesc || 'Payment failed');
                        setLoading(false);
                    }
                } else if (attempts >= maxAttempts) {
                    clearInterval(poll);
                    setStatus('failed');
                    setMessage('Payment timeout. Please check transaction status manually.');
                    setLoading(false);
                }
            } catch (error) {
                if (attempts >= maxAttempts) {
                    clearInterval(poll);
                    setStatus('failed');
                    setMessage('Error checking payment status');
                    setLoading(false);
                }
            }
        }, 5000); // Poll every 5 seconds
    };

    const handleClose = () => {
        if (!loading) {
            setStatus('idle');
            setMessage('');
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 text-zinc-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-300">
                    <h2 className="text-xl font-semibold text-black">M-Pesa Payment</h2>
                    {!loading && (
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-black transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {status === 'idle' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Tenant Name
                                </label>
                                <input
                                    type="text"
                                    value={tenant.name}
                                    disabled
                                    className="w-full cursor-not-allowed px-3 py-2 border border-gray-300 rounded-lg bg-zinc-200 text-black"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="0712345678 or 254712345678"
                                        required
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Enter phone number in format: 0712345678 or 254712345678
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Amount (KES) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    disabled
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black cursor-not-allowed"
                                />
                            </div>

                            {invoiceNumber && (
                                <div>
                                    <label className="block text-sm font-medium text-black mb-1">
                                        Invoice Number
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceNumber}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black cursor-not-allowed"
                                    />
                                </div>
                            )}

                            <div className="bg-blue-700/20 border border-blue-900/50 rounded-lg p-4">
                                <p className="text-sm text-blue-500">
                                    <strong>Note:</strong> The customer will receive an M-Pesa prompt on their phone.
                                    They need to enter their M-Pesa PIN to complete the payment.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send Payment Request
                            </button>
                        </form>
                    )}

                    {status === 'pending' && (
                        <div className="text-center py-8">
                            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Waiting for Payment
                            </h3>
                            <p className="text-zinc-400">{message}</p>
                            <div className="mt-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-4">
                                <p className="text-sm text-yellow-500">
                                    Customer should check their phone for M-Pesa prompt and enter PIN.
                                    This may take a few moments...
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Payment Successful!
                            </h3>
                            <p className="text-zinc-400">{message}</p>
                        </div>
                    )}

                    {status === 'failed' && (
                        <div className="text-center py-8">
                            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Payment Failed
                            </h3>
                            <p className="text-zinc-400 mb-4">{message}</p>
                            <button
                                onClick={() => {
                                    setStatus('idle');
                                    setMessage('');
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
