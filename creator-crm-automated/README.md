# CreatorCRM - Fully Automated CRM for Influencers & Creators

A powerful, fully automated CRM system designed specifically for YouTubers, Instagrammers, Podcasters, and content creators to manage brand deals, sponsorships, invoices, and content calendars with intelligent automation.

## 🚀 Features

### Core Modules
- **Dashboard** - Real-time stats on deals, revenue, payments, and upcoming content
- **Deal Pipeline** - Kanban-style board with drag-and-drop functionality across 5 stages
- **Content Calendar** - Monthly view with platform-specific color coding
- **Invoice Tracking** - Automated invoice generation and payment status tracking
- **Brand Management** - Contact database with deal counts and relationship tracking
- **Automation Hub** - Configure and manage automated workflows

### 🔥 Automation Engine

The system includes 5 built-in automation rules that run automatically:

1. **Auto-create Invoice on Deal Won**
   - Trigger: Deal stage changes to "Closed Won"
   - Action: Automatically generates an invoice with 14-day payment terms

2. **Deadline Reminder Notifications**
   - Trigger: Daily check at 9 AM
   - Action: Sends notifications for deals with deadlines in 3 days

3. **Auto-schedule Content from Deals**
   - Trigger: Deal moves to "Contract" stage
   - Action: Creates content calendar entries based on deliverables

4. **Overdue Invoice Follow-up**
   - Trigger: Daily check at 9 AM
   - Action: Marks invoices as overdue and sends follow-up emails

5. **Weekly Pipeline Report**
   - Trigger: Every Monday at 9 AM
   - Action: Generates summary report with revenue, pending invoices, and deadlines

### Scheduled Tasks
- **Daily (9 AM)**: Deadline checks and overdue invoice detection
- **Weekly (Monday 9 AM)**: Pipeline performance reports

## 📁 Project Structure

```
creator-crm-automated/
├── server.js           # Node.js backend with automation engine
├── package.json        # Dependencies and scripts
├── .env                # Environment variables (PORT, API keys)
└── public/
    └── index.html      # Modern responsive frontend
```

## 🛠️ Tech Stack

- **Backend**: Node.js with Express
- **Automation**: node-cron for scheduled tasks
- **Frontend**: Vanilla JavaScript with modern CSS
- **Styling**: Custom CSS with gradient themes
- **Icons**: Font Awesome 6

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

```bash
cd creator-crm-automated

# Install dependencies
npm install

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard statistics |
| GET | `/api/deals` | List all deals |
| POST | `/api/deals` | Create new deal |
| PUT | `/api/deals/:id` | Update deal (triggers automations) |
| DELETE | `/api/deals/:id` | Delete a deal |
| GET | `/api/content` | List content calendar items |
| POST | `/api/content` | Create content item |
| GET | `/api/invoices` | List all invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/brands` | List brand contacts |
| GET | `/api/automations` | List automation rules |
| PUT | `/api/automations/:id` | Toggle automation |
| GET | `/api/notifications` | Get notifications |
| POST | `/api/automation/check` | Manually trigger automation checks |

## 🎯 How Automation Works

### Example Flow: Closing a Deal

1. User drags a deal card to "Closed Won" column
2. Backend detects stage change via PUT request
3. `AutomationEngine.onDealStageChange()` is triggered
4. System finds matching automation rule: "Auto-create invoice on deal won"
5. Invoice is automatically created with:
   - Amount from deal value
   - Issue date = today
   - Due date = today + 14 days
   - Status = "draft"
6. Notification is sent to the user
7. Frontend refreshes to show new invoice

### Example Flow: Contract Stage

1. Deal moved to "Contract" stage
2. Automation rule triggers: "Auto-schedule content from deal"
3. Content item created with:
   - Title from deal
   - Platform from deal
   - Type based on deliverables (video/post)
   - Date set to deadline
   - Linked to original deal
4. Content appears on calendar automatically

## 🎨 UI Features

- **Drag & Drop Pipeline**: Move deals between stages effortlessly
- **Real-time Notifications**: Bell icon shows unread alerts
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Gradient Theme**: Purple-pink gradient branding
- **Status Badges**: Color-coded statuses for quick scanning
- **Automation Tags**: Visual indicators for auto-generated items

## 📈 Sample Data

The app loads with sample data including:
- 5 brands (Nike, Red Bull, Audible, Glossier, Tesla)
- 5 deals in various pipeline stages
- 5 content calendar items
- 4 invoices with different statuses
- 5 automation rules (all active)
- Sample notifications

## 🔧 Customization

### Adding New Automation Rules

Edit `server.js` and add to the `db.automations` array:

```javascript
{
  id: uuidv4(),
  name: 'Your Rule Name',
  trigger: 'your_trigger_event',
  action: 'your_action',
  active: true
}
```

Then implement the action in the `AutomationEngine` class.

### Integrating Real Email

Replace the simulated `sendEmail()` method with actual email service:

```javascript
async sendEmail(context) {
  const { invoice } = context;
  
  // Integrate with SendGrid, Mailgun, or AWS SES
  await axios.post('https://api.sendgrid.com/v3/mail/send', {
    // email configuration
  });
}
```

### Connecting to External APIs

The automation engine can be extended to:
- Sync with YouTube Analytics API
- Pull Instagram insights
- Connect to podcast hosting platforms
- Integrate with accounting software (QuickBooks, Xero)

## 📝 License

MIT License - feel free to use for your creator business!

## 💡 Tips for Creators

1. **Move deals promptly**: Drag deals through stages as they progress to trigger automations
2. **Check notifications daily**: Click the bell icon for important alerts
3. **Review weekly reports**: Monday reports give you pipeline overview
4. **Keep deadlines updated**: Accurate dates ensure reminder notifications work
5. **Mark invoices paid**: Update status when payments arrive

---

Built with ❤️ for creators who want to automate their business operations!
