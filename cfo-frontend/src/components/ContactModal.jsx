/**
 * ContactModal
 *
 * Contact form modal for public visitors.
 * Includes honeypot spam protection.
 */

import React, { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import { BRAND_COLORS } from './Logo';

import { API_URL } from '../lib/constants';

const CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'demo', label: 'Demo Request' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'support', label: 'Support' },
];

export default function ContactModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company_name: '',
    category: 'general',
    message: '',
    website: '', // Honeypot field
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
    } catch (err) {
      console.error('Contact form error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    // Reset form on close
    setFormData({
      name: '',
      email: '',
      company_name: '',
      category: 'general',
      message: '',
      website: '',
    });
    setError(null);
    setSuccess(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - only close on click if not showing success */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={success ? undefined : handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-sm max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: BRAND_COLORS.navy }}
          >
            Get in Touch
          </h2>
          {!success && (
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            // Success state
            <div className="text-center py-8">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${BRAND_COLORS.gold}20` }}
              >
                <CheckCircle className="w-7 h-7" style={{ color: BRAND_COLORS.gold }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: BRAND_COLORS.navy }}
              >
                Message Sent
              </h3>
              <p className="text-slate-600 mb-6">
                Thank you for reaching out. We'll get back to you as soon as possible.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-sm font-medium text-white transition-colors"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                Close
              </button>
            </div>
          ) : (
            // Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot - hidden from humans, bots will fill it */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-slate-400"
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-slate-400"
                  placeholder="your@email.com"
                />
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  maxLength={200}
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-slate-400"
                  placeholder="Your company"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-slate-400 bg-white"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  maxLength={5000}
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-slate-400 resize-none"
                  placeholder="How can we help you?"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {formData.message.length}/5000
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 border border-slate-300 rounded-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: BRAND_COLORS.gold }}
                >
                  {loading ? 'Sending...' : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
