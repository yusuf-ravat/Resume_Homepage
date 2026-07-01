const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory database (in production, use a real database)
let db = {
  deals: [],
  content: [],
  invoices: [],
  brands: [],
  automations: [],
  notifications: []
};

// Load sample data
function loadSampleData() {
  const now = new Date();
  
  // Sample brands
  db.brands = [
    { id: uuidv4(), name: 'Nike', email: 'partnerships@nike.com', platform: 'Instagram', status: 'active', dealCount: 3 },
    { id: uuidv4(), name: 'Red Bull', email: 'creators@redbull.com', platform: 'YouTube', status: 'active', dealCount: 2 },
    { id: uuidv4(), name: 'Audible', email: 'influencer@audible.com', platform: 'Podcast', status: 'active', dealCount: 5 },
    { id: uuidv4(), name: 'Glossier', email: 'collab@glossier.com', platform: 'Instagram', status: 'inactive', dealCount: 1 }
  ];

  // Sample deals in different stages
  db.deals = [
    { id: uuidv4(), brandId: db.brands[0].id, brandName: 'Nike', title: 'Summer Campaign 2024', value: 5000, stage: 'negotiation', platform: 'Instagram', deliverables: '3 posts, 5 stories', deadline: '2024-07-15', probability: 75, automated: true },
    { id: uuidv4(), brandId: db.brands[1].id, brandName: 'Red Bull', title: 'Extreme Sports Series', value: 12000, stage: 'contract', platform: 'YouTube', deliverables: '2 videos', deadline: '2024-06-30', probability: 90, automated: true },
    { id: uuidv4(), brandId: db.brands[2].id, brandName: 'Audible', title: 'Book Review Partnership', value: 3000, stage: 'closed_won', platform: 'Podcast', deliverables: '4 episodes', deadline: '2024-05-20', probability: 100, automated: true },
    { id: uuidv4(), brandId: db.brands[3].id, brandName: 'Glossier', title: 'Beauty Tutorial', value: 2500, stage: 'lead', platform: 'Instagram', deliverables: '1 reel, 2 stories', deadline: '2024-08-01', probability: 30, automated: false },
    { id: uuidv4(), brandId: db.brands[0].id, brandName: 'Nike', title: 'Fall Collection Launch', value: 8000, stage: 'proposal', platform: 'YouTube', deliverables: '1 video, 3 posts', deadline: '2024-09-10', probability: 60, automated: true }
  ];

  // Sample content calendar
  db.content = [
    { id: uuidv4(), title: 'Nike Summer Post 1', platform: 'Instagram', type: 'post', date: '2024-06-15', status: 'scheduled', relatedDealId: db.deals[0].id, automated: true },
    { id: uuidv4(), title: 'Red Bull Extreme Video', platform: 'YouTube', type: 'video', date: '2024-06-20', status: 'draft', relatedDealId: db.deals[1].id, automated: true },
    { id: uuidv4(), title: 'Audible Book Review #1', platform: 'Podcast', type: 'episode', date: '2024-06-10', status: 'published', relatedDealId: db.deals[2].id, automated: true },
    { id: uuidv4(), title: 'Glossier Beauty Tutorial', platform: 'Instagram', type: 'reel', date: '2024-07-05', status: 'planned', relatedDealId: db.deals[3].id, automated: false },
    { id: uuidv4(), title: 'Weekly Vlog #42', platform: 'YouTube', type: 'video', date: '2024-06-18', status: 'scheduled', relatedDealId: null, automated: false }
  ];

  // Sample invoices
  db.invoices = [
    { id: uuidv4(), dealId: db.deals[2].id, brandName: 'Audible', amount: 3000, issueDate: '2024-05-01', dueDate: '2024-05-15', status: 'paid', automated: true },
    { id: uuidv4(), dealId: db.deals[1].id, brandName: 'Red Bull', amount: 6000, issueDate: '2024-06-01', dueDate: '2024-06-15', status: 'pending', automated: true },
    { id: uuidv4(), dealId: db.deals[0].id, brandName: 'Nike', amount: 2500, issueDate: '2024-06-05', dueDate: '2024-06-20', status: 'sent', automated: true },
    { id: uuidv4(), dealId: db.deals[4].id, brandName: 'Nike', amount: 4000, issueDate: '2024-06-10', dueDate: '2024-06-25', status: 'draft', automated: true }
  ];

  // Automation rules
  db.automations = [
    { id: uuidv4(), name: 'Auto-create invoice on deal won', trigger: 'deal_stage_changed_to_closed_won', action: 'create_invoice', active: true },
    { id: uuidv4(), name: 'Send reminder 3 days before deadline', trigger: 'deadline_approaching', action: 'send_notification', active: true },
    { id: uuidv4(), name: 'Auto-schedule content from deal', trigger: 'deal_stage_changed_to_contract', action: 'create_content', active: true },
    { id: uuidv4(), name: 'Follow-up on unpaid invoices', trigger: 'invoice_overdue', action: 'send_email', active: true },
    { id: uuidv4(), name: 'Weekly pipeline report', trigger: 'schedule_weekly', action: 'send_report', active: true }
  ];

  // Notifications
  db.notifications = [
    { id: uuidv4(), title: 'Invoice overdue', message: 'Nike invoice #INV-001 is 5 days overdue', type: 'warning', read: false, createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Deal milestone', message: 'Red Bull deal moved to contract stage', type: 'success', read: false, createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Content reminder', message: '3 content pieces due this week', type: 'info', read: true, createdAt: new Date().toISOString() }
  ];
}

loadSampleData();

// ==================== AUTOMATION ENGINE ====================

class AutomationEngine {
  constructor() {
    this.rules = db.automations;
  }

  async executeRule(rule, context) {
    console.log(`Executing automation: ${rule.name}`);
    
    switch (rule.action) {
      case 'create_invoice':
        return this.createInvoice(context);
      case 'send_notification':
        return this.sendNotification(context);
      case 'create_content':
        return this.createContent(context);
      case 'send_email':
        return this.sendEmail(context);
      case 'send_report':
        return this.sendReport(context);
      default:
        console.log(`Unknown action: ${rule.action}`);
    }
  }

  createInvoice(context) {
    const { deal } = context;
    if (!deal || deal.stage !== 'closed_won') return;

    const existingInvoice = db.invoices.find(inv => inv.dealId === deal.id);
    if (existingInvoice) return;

    const invoice = {
      id: uuidv4(),
      dealId: deal.id,
      brandName: deal.brandName,
      amount: deal.value,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      automated: true
    };

    db.invoices.push(invoice);
    db.notifications.push({
      id: uuidv4(),
      title: 'Invoice Created',
      message: `Auto-generated invoice for ${deal.brandName} - $${deal.value}`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString()
    });

    console.log(`Created invoice for deal: ${deal.title}`);
    return invoice;
  }

  sendNotification(context) {
    const { deal, message } = context;
    
    db.notifications.push({
      id: uuidv4(),
      title: 'Deadline Reminder',
      message: message || `Deadline approaching for ${deal?.title}`,
      type: 'warning',
      read: false,
      createdAt: new Date().toISOString()
    });

    console.log(`Sent notification: ${message}`);
  }

  createContent(context) {
    const { deal } = context;
    if (!deal) return;

    const content = {
      id: uuidv4(),
      title: `${deal.brandName} - ${deal.title}`,
      platform: deal.platform,
      type: deal.deliverables.includes('video') ? 'video' : 'post',
      date: deal.deadline,
      status: 'planned',
      relatedDealId: deal.id,
      automated: true
    };

    db.content.push(content);
    db.notifications.push({
      id: uuidv4(),
      title: 'Content Created',
      message: `Auto-scheduled content for ${deal.brandName}`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });

    console.log(`Created content for deal: ${deal.title}`);
    return content;
  }

  async sendEmail(context) {
    const { invoice } = context;
    
    // Simulate email sending (in production, integrate with SendGrid, Mailgun, etc.)
    console.log(`Sending email to ${invoice.brandName} for overdue invoice #${invoice.id.slice(0, 8)}`);
    
    db.notifications.push({
      id: uuidv4(),
      title: 'Follow-up Email Sent',
      message: `Automated follow-up sent to ${invoice.brandName}`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  sendReport(context) {
    const totalRevenue = db.deals.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + d.value, 0);
    const pendingInvoices = db.invoices.filter(i => i.status === 'pending').length;
    const upcomingDeadlines = db.deals.filter(d => {
      const deadline = new Date(d.deadline);
      const now = new Date();
      const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && d.stage !== 'closed_won';
    }).length;

    db.notifications.push({
      id: uuidv4(),
      title: 'Weekly Pipeline Report',
      message: `Revenue: $${totalRevenue} | Pending Invoices: ${pendingInvoices} | Upcoming Deadlines: ${upcomingDeadlines}`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });

    console.log('Weekly report generated');
  }

  // Check and trigger automations based on deal stage changes
  onDealStageChange(deal, oldStage, newStage) {
    const relevantRules = this.rules.filter(rule => rule.active && 
      rule.trigger === 'deal_stage_changed_to_' + newStage
    );

    relevantRules.forEach(rule => {
      this.executeRule(rule, { deal, oldStage, newStage });
    });
  }

  // Check for approaching deadlines
  checkDeadlines() {
    const now = new Date();
    
    db.deals.forEach(deal => {
      if (deal.stage === 'closed_won') return;
      
      const deadline = new Date(deal.deadline);
      const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 3) {
        const rule = this.rules.find(r => r.trigger === 'deadline_approaching' && r.active);
        if (rule) {
          this.executeRule(rule, { 
            deal, 
            message: `⚠️ Deadline in 3 days: ${deal.title} (${deal.brandName})` 
          });
        }
      }
    });
  }

  // Check for overdue invoices
  checkOverdueInvoices() {
    const now = new Date();
    
    db.invoices.forEach(invoice => {
      if (invoice.status === 'paid') return;
      
      const dueDate = new Date(invoice.dueDate);
      if (now > dueDate) {
        invoice.status = 'overdue';
        
        const rule = this.rules.find(r => r.trigger === 'invoice_overdue' && r.active);
        if (rule) {
          this.executeRule(rule, { invoice });
        }
      }
    });
  }
}

const automationEngine = new AutomationEngine();

// Scheduled tasks
cron.schedule('0 9 * * *', () => {
  console.log('Running daily automation checks...');
  automationEngine.checkDeadlines();
  automationEngine.checkOverdueInvoices();
});

cron.schedule('0 9 * * 1', () => {
  console.log('Generating weekly report...');
  const rule = db.automations.find(r => r.trigger === 'schedule_weekly' && r.active);
  if (rule) {
    automationEngine.executeRule(rule, {});
  }
});

// ==================== API ROUTES ====================

// Dashboard stats
app.get('/api/dashboard', (req, res) => {
  const totalDeals = db.deals.length;
  const wonDeals = db.deals.filter(d => d.stage === 'closed_won');
  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const pendingPayments = db.invoices.filter(i => i.status === 'pending' || i.status === 'sent').reduce((sum, i) => sum + i.amount, 0);
  const upcomingContent = db.content.filter(c => {
    const contentDate = new Date(c.date);
    const now = new Date();
    const diffDays = Math.ceil((contentDate - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }).length;

  const pipelineStats = {
    lead: db.deals.filter(d => d.stage === 'lead').length,
    proposal: db.deals.filter(d => d.stage === 'proposal').length,
    negotiation: db.deals.filter(d => d.stage === 'negotiation').length,
    contract: db.deals.filter(d => d.stage === 'contract').length,
    closed_won: db.deals.filter(d => d.stage === 'closed_won').length
  };

  res.json({
    totalDeals,
    totalRevenue,
    pendingPayments,
    upcomingContent,
    pipelineStats,
    recentNotifications: db.notifications.filter(n => !n.read).slice(0, 5)
  });
});

// Deals
app.get('/api/deals', (req, res) => {
  res.json(db.deals);
});

app.post('/api/deals', (req, res) => {
  const deal = {
    id: uuidv4(),
    ...req.body,
    automated: req.body.automated !== undefined ? req.body.automated : true
  };
  db.deals.push(deal);
  
  // Trigger automation if stage is closed_won
  if (deal.stage === 'closed_won') {
    automationEngine.onDealStageChange(deal, null, 'closed_won');
  }
  
  res.json(deal);
});

app.put('/api/deals/:id', (req, res) => {
  const { id } = req.params;
  const dealIndex = db.deals.findIndex(d => d.id === id);
  
  if (dealIndex === -1) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  const oldStage = db.deals[dealIndex].stage;
  const newStage = req.body.stage;
  
  db.deals[dealIndex] = { ...db.deals[dealIndex], ...req.body };
  
  // Trigger automation on stage change
  if (oldStage !== newStage) {
    automationEngine.onDealStageChange(db.deals[dealIndex], oldStage, newStage);
  }
  
  res.json(db.deals[dealIndex]);
});

app.delete('/api/deals/:id', (req, res) => {
  const { id } = req.params;
  db.deals = db.deals.filter(d => d.id !== id);
  res.json({ success: true });
});

// Content Calendar
app.get('/api/content', (req, res) => {
  res.json(db.content);
});

app.post('/api/content', (req, res) => {
  const content = {
    id: uuidv4(),
    ...req.body,
    automated: req.body.automated !== undefined ? req.body.automated : true
  };
  db.content.push(content);
  res.json(content);
});

app.put('/api/content/:id', (req, res) => {
  const { id } = req.params;
  const contentIndex = db.content.findIndex(c => c.id === id);
  
  if (contentIndex === -1) {
    return res.status(404).json({ error: 'Content not found' });
  }
  
  db.content[contentIndex] = { ...db.content[contentIndex], ...req.body };
  res.json(db.content[contentIndex]);
});

// Invoices
app.get('/api/invoices', (req, res) => {
  res.json(db.invoices);
});

app.post('/api/invoices', (req, res) => {
  const invoice = {
    id: uuidv4(),
    ...req.body,
    automated: req.body.automated !== undefined ? req.body.automated : true
  };
  db.invoices.push(invoice);
  res.json(invoice);
});

app.put('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  const invoiceIndex = db.invoices.findIndex(i => i.id === id);
  
  if (invoiceIndex === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  db.invoices[invoiceIndex] = { ...db.invoices[invoiceIndex], ...req.body };
  res.json(db.invoices[invoiceIndex]);
});

// Brands
app.get('/api/brands', (req, res) => {
  // Update deal counts
  db.brands.forEach(brand => {
    brand.dealCount = db.deals.filter(d => d.brandId === brand.id).length;
  });
  res.json(db.brands);
});

app.post('/api/brands', (req, res) => {
  const brand = {
    id: uuidv4(),
    ...req.body,
    dealCount: 0
  };
  db.brands.push(brand);
  res.json(brand);
});

// Automations
app.get('/api/automations', (req, res) => {
  res.json(db.automations);
});

app.put('/api/automations/:id', (req, res) => {
  const { id } = req.params;
  const autoIndex = db.automations.findIndex(a => a.id === id);
  
  if (autoIndex === -1) {
    return res.status(404).json({ error: 'Automation not found' });
  }
  
  db.automations[autoIndex] = { ...db.automations[autoIndex], ...req.body };
  res.json(db.automations[autoIndex]);
});

// Notifications
app.get('/api/notifications', (req, res) => {
  res.json(db.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notifIndex = db.notifications.findIndex(n => n.id === id);
  
  if (notifIndex === -1) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  db.notifications[notifIndex].read = true;
  res.json(db.notifications[notifIndex]);
});

app.put('/api/notifications/read-all', (req, res) => {
  db.notifications.forEach(n => n.read = true);
  res.json({ success: true });
});

// Manual trigger for automations (for testing)
app.post('/api/automation/trigger', (req, res) => {
  const { ruleId, context } = req.body;
  const rule = db.automations.find(r => r.id === ruleId);
  
  if (!rule) {
    return res.status(404).json({ error: 'Automation rule not found' });
  }
  
  const result = automationEngine.executeRule(rule, context);
  res.json({ success: true, result });
});

// Run automation checks manually
app.post('/api/automation/check', (req, res) => {
  automationEngine.checkDeadlines();
  automationEngine.checkOverdueInvoices();
  res.json({ success: true, message: 'Automation checks completed' });
});

app.listen(PORT, () => {
  console.log(`🚀 CreatorCRM Automated Server running on http://localhost:${PORT}`);
  console.log('📅 Daily automation: Deadline & invoice checks at 9 AM');
  console.log('📊 Weekly automation: Pipeline reports every Monday at 9 AM');
});
