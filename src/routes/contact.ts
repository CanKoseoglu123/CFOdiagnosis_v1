// Contact form routes
// Public endpoint for contact form submissions
// Admin endpoints for message management

import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// ============================================
// POST /api/contact
// Public endpoint - accepts contact form submissions
// ============================================

router.post('/', async (req: Request, res: Response) => {
  const { name, email, company_name, category, message, website } = req.body;

  // Honeypot check - if website field is filled, it's likely a bot
  // Silently accept but don't save (avoid tipping off bots)
  if (website) {
    console.log('[Contact] Honeypot triggered, ignoring submission');
    return res.json({ success: true });
  }

  // Validation
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
  } else if (name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  if (company_name && company_name.length > 200) {
    errors.push('Company name must be 200 characters or less');
  }

  if (category && !['general', 'demo', 'partnership', 'support'].includes(category)) {
    errors.push('Invalid category');
  }

  if (!message || typeof message !== 'string') {
    errors.push('Message is required');
  } else if (message.length > 5000) {
    errors.push('Message must be 5000 characters or less');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    // Get user agent for spam analysis
    const userAgent = req.headers['user-agent'] || null;

    // Insert message into database
    const { error: insertError } = await req.supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company_name: company_name?.trim() || null,
        category: category || 'general',
        message: message.trim(),
        user_agent: userAgent,
      });

    if (insertError) {
      console.error('[Contact] Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    // Send admin notification email
    await sendAdminNotification({
      name: name.trim(),
      email: email.trim(),
      company_name: company_name?.trim(),
      category: category || 'general',
      message: message.trim(),
    });

    console.log(`[Contact] New message from ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[Contact] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Admin Routes
// ============================================

// GET /api/contact/admin/messages
// List all contact messages with optional status filter
router.get('/admin/messages', requireAdmin, async (req: Request, res: Response) => {
  const { status } = req.query;

  try {
    let query = req.supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && ['new', 'read', 'archived'].includes(status as string)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Contact Admin] Fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    res.json(data);
  } catch (err) {
    console.error('[Contact Admin] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/contact/admin/messages/count
// Get count of new messages (for badge)
router.get('/admin/messages/count', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { count, error } = await req.supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    if (error) {
      console.error('[Contact Admin] Count error:', error);
      return res.status(500).json({ error: 'Failed to get count' });
    }

    res.json({ count: count || 0 });
  } catch (err) {
    console.error('[Contact Admin] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/contact/admin/messages/:id
// Update message status
router.patch('/admin/messages/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['new', 'read', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const { error } = await req.supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('[Contact Admin] Update error:', error);
      return res.status(500).json({ error: 'Failed to update message' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Contact Admin] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/contact/admin/messages/:id
// Delete a message
router.delete('/admin/messages/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { error } = await req.supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Contact Admin] Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete message' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Contact Admin] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Email Notification Helper
// ============================================

interface ContactMessage {
  name: string;
  email: string;
  company_name?: string;
  category: string;
  message: string;
}

async function sendAdminNotification(contact: ContactMessage): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'support@cfo-lens.com';

  if (!resendApiKey) {
    console.log('[Contact] RESEND_API_KEY not set, skipping email notification');
    return;
  }

  const categoryLabels: Record<string, string> = {
    general: 'General Inquiry',
    demo: 'Demo Request',
    partnership: 'Partnership',
    support: 'Support',
  };

  const messagePreview = contact.message.length > 200
    ? contact.message.slice(0, 200) + '...'
    : contact.message;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CFO Lens <noreply@cfo-lens.com>',
        to: adminEmail,
        subject: `New contact message from ${contact.name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(contact.name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></p>
          ${contact.company_name ? `<p><strong>Company:</strong> ${escapeHtml(contact.company_name)}</p>` : ''}
          <p><strong>Category:</strong> ${categoryLabels[contact.category] || contact.category}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(messagePreview)}</p>
          <hr />
          <p><small>View all messages in the <a href="https://cfodiagnosisv1.vercel.app/admin">Admin Dashboard</a></small></p>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Contact] Email send failed:', errorData);
    } else {
      console.log('[Contact] Admin notification email sent');
    }
  } catch (err) {
    console.error('[Contact] Email send error:', err);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default router;
