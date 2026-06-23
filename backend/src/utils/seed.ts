import 'dotenv/config';
import { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import Society from '../models/Society.js';
import Unit from '../models/Unit.js';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Complaint from '../models/Complaint.js';
import Invoice, { invoiceStatusFor } from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Post from '../models/Post.js';
import Visitor from '../models/Visitor.js';
import { enrichComplaint } from '../services/aiService.js';
import { computeDueAt, type ComplaintCategory } from '../config/constants.js';

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const pick = <T>(arr: T[], i: number): T => arr[i % arr.length];

export async function seedData() {
  await Promise.all([
    Society.deleteMany({}),
    Unit.deleteMany({}),
    User.deleteMany({}),
    Vendor.deleteMany({}),
    Complaint.deleteMany({}),
    Invoice.deleteMany({}),
    Expense.deleteMany({}),
    Post.deleteMany({}),
    Visitor.deleteMany({}),
  ]);

  const society = await Society.create({
    name: 'Green Meadows Residency',
    address: '12 Palm Avenue, Whitefield',
    city: 'Bengaluru',
    totalUnits: 12,
    currency: '₹',
    defaultMaintenance: 2500,
  });

  // Units across two blocks.
  const unitDefs = [
    ['A', '101', '2BHK'], ['A', '102', '3BHK'], ['A', '201', '2BHK'], ['A', '202', '1BHK'],
    ['A', '301', '3BHK'], ['A', '302', '2BHK'], ['B', '101', '2BHK'], ['B', '102', '3BHK'],
    ['B', '201', '1BHK'], ['B', '202', '2BHK'], ['B', '301', 'Penthouse'], ['B', '302', '2BHK'],
  ] as const;
  const units = await Unit.create(
    unitDefs.map(([block, number, type]) => ({
      society: society._id,
      block,
      number: `${block}-${number}`,
      type,
      areaSqft: type === 'Penthouse' ? 2400 : type === '3BHK' ? 1500 : type === '1BHK' ? 650 : 1100,
      monthlyMaintenance: type === 'Penthouse' ? 5000 : type === '3BHK' ? 3200 : type === '1BHK' ? 1800 : 2500,
      occupancy: 'owner-occupied',
    }))
  );

  // Users.
  const committee = await User.create({
    name: 'Ramesh Kumar', email: 'committee@demo.com', password: 'password123', phone: '+91 98800 11111',
    role: 'committee', society: society._id, badges: ['hero', 'guardian'], points: 95,
  });
  await Society.findByIdAndUpdate(society._id, { createdBy: committee._id });

  const residentDefs = [
    ['Asha Rao', 'asha@demo.com', 40], ['Vikram Singh', 'vikram@demo.com', 22],
    ['Meera Iyer', 'meera@demo.com', 60], ['John Dsouza', 'john@demo.com', 12],
    ['Fatima Khan', 'fatima@demo.com', 33], ['Arjun Nair', 'arjun@demo.com', 18],
  ] as const;
  const residents = await User.create(
    residentDefs.map(([name, email, points], i) => ({
      name, email, password: 'password123', phone: `+91 98765 4${String(1000 + i)}`,
      role: 'resident', society: society._id, points,
      badges: points > 30 ? ['reporter'] : ['newcomer'],
      primaryUnit: units[i]._id, units: [units[i]._id],
    }))
  );
  // Link unit owners; mark a couple rented (multi-property: Meera owns two).
  for (let i = 0; i < residents.length; i++) {
    units[i].owner = residents[i]._id;
    await units[i].save();
  }
  units[6].owner = residents[2]._id; // Meera owns B-101 too
  units[6].occupancy = 'rented';
  units[6].tenant = residents[3]._id;
  await units[6].save();
  await User.findByIdAndUpdate(residents[2]._id, { $addToSet: { units: units[6]._id } });

  // Vendors.
  const vendorDefs: [string, ComplaintCategory, number, number, number][] = [
    ['QuickFix Plumbing', 'plumbing', 4.6, 18, 16],
    ['Volt Electricals', 'electrical', 4.2, 12, 9],
    ['LiftCare Services', 'lift', 4.8, 7, 7],
    ['Sparkle Housekeeping', 'housekeeping', 3.9, 25, 20],
    ['GreenPest Solutions', 'pest-control', 4.4, 6, 5],
    ['SecureGuard Agency', 'security', 4.1, 4, 4],
  ];
  const vendors = await Vendor.create(
    vendorDefs.map(([name, trade, ratingAvg, jobsCompleted, onTime]) => ({
      society: society._id, name, trade, phone: '+91 90000 00000', verified: true,
      ratingAvg, ratingCount: Math.max(jobsCompleted - 2, 1), jobsAssigned: jobsCompleted + 1,
      jobsCompleted, onTimeCompletions: onTime,
    }))
  );

  // Complaints.
  const complaintDefs: { title: string; description: string; category: ComplaintCategory; unitIdx: number | null; age: number; status: string }[] = [
    { title: 'Water leakage from ceiling', description: 'Continuous leak from the bathroom pipe flooding the floor below.', category: 'plumbing', unitIdx: 0, age: 6, status: 'resolved' },
    { title: 'Lift stuck on 2nd floor', description: 'The elevator is stuck and making noise, residents are trapped sometimes.', category: 'lift', unitIdx: null, age: 1, status: 'in-progress' },
    { title: 'No power in parking area', description: 'Basement parking lights are out, very dark and unsafe at night.', category: 'electrical', unitIdx: null, age: 4, status: 'assigned' },
    { title: 'Garbage not collected', description: 'Housekeeping skipped B block, trash piling up near the staircase.', category: 'housekeeping', unitIdx: 7, age: 3, status: 'open' },
    { title: 'Cockroach infestation', description: 'Severe cockroach problem in the kitchen, need urgent pest control.', category: 'pest-control', unitIdx: 4, age: 5, status: 'resolved-pending' },
    { title: 'Main gate camera not working', description: 'Security CCTV at the main gate has been down for days.', category: 'security', unitIdx: null, age: 2, status: 'open' },
    { title: 'No water supply since morning', description: 'Entire A block has no water since 6am, tank seems empty.', category: 'water-supply', unitIdx: null, age: 1, status: 'assigned' },
    { title: 'Broken door hinge', description: 'Main door hinge is broken and the door wont close properly.', category: 'carpentry', unitIdx: 2, age: 8, status: 'resolved' },
    { title: 'Clubhouse AC not cooling', description: 'The clubhouse air conditioner stopped cooling, gym is too hot.', category: 'common-area', unitIdx: null, age: 9, status: 'open' },
  ];

  const allResidents = [committee, ...residents];
  for (let i = 0; i < complaintDefs.length; i++) {
    const d = complaintDefs[i];
    const ai = enrichComplaint({ title: d.title, description: d.description }, []);
    const createdAt = daysAgo(d.age);
    const reporter = pick(residents, i);
    const isCommon = d.unitIdx === null;
    const statusHistory: { status: string; by: Types.ObjectId; note: string; at: Date }[] = [
      { status: 'open', by: reporter._id, note: 'Complaint logged', at: createdAt },
    ];
    let assignedVendor: Types.ObjectId | undefined;
    let resolutionProof = '';
    const vendorForCat = vendors.find((v) => v.trade === d.category);
    if (['assigned', 'in-progress', 'resolved-pending', 'resolved'].includes(d.status) && vendorForCat) {
      assignedVendor = vendorForCat._id;
      statusHistory.push({ status: 'assigned', by: committee._id, note: `Assigned to ${vendorForCat.name}`, at: daysAgo(Math.max(d.age - 1, 0)) });
    }
    if (d.status === 'resolved-pending' || d.status === 'resolved') {
      resolutionProof = '/uploads/sample-fix.jpg';
      statusHistory.push({ status: 'resolved-pending', by: committee._id, note: 'Fix submitted with proof', at: daysAgo(Math.max(d.age - 2, 0)) });
    }
    if (d.status === 'resolved') {
      statusHistory.push({ status: 'resolved', by: reporter._id, note: 'Confirmed by residents', at: daysAgo(Math.max(d.age - 3, 0)) });
    }

    await Complaint.create({
      society: society._id,
      unit: isCommon ? undefined : units[d.unitIdx!]._id,
      isCommonArea: isCommon,
      title: d.title,
      description: d.description,
      category: d.category,
      aiCategory: ai.category,
      aiConfidence: ai.confidence,
      aiSummary: ai.summary,
      severity: ai.severity,
      status: d.status,
      assignedVendor,
      reporter: reporter._id,
      createdAt,
      dueAt: computeDueAt(createdAt, d.category, ai.severity),
      upvotes: isCommon ? allResidents.slice(0, (i % 4) + 1).map((u) => u._id) : [],
      resolutionProof,
      resolutionConfirmations: d.status === 'resolved' ? residents.slice(0, 2).map((r) => r._id) : [],
      statusHistory,
      cost: d.status === 'resolved' ? 1200 + i * 300 : undefined,
    });
  }

  // Invoices: this month (pending) + last month (mostly paid, a few overdue) per unit.
  const thisMonth = new Date();
  const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const thisDue = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 10);
    await Invoice.create({
      society: society._id, unit: u._id, type: 'maintenance', period: fmt(thisMonth),
      amount: u.monthlyMaintenance, paidAmount: i % 3 === 0 ? u.monthlyMaintenance : 0,
      dueDate: thisDue, createdBy: committee._id,
      status: invoiceStatusFor({ amount: u.monthlyMaintenance, paidAmount: i % 3 === 0 ? u.monthlyMaintenance : 0, dueDate: thisDue }),
      payments: i % 3 === 0 ? [{ amount: u.monthlyMaintenance, method: 'upi', reference: 'STUB-PAID', at: daysAgo(5) }] : [],
    });
    const lastDue = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 10);
    const paidLast = i % 4 !== 0; // 3 of 4 paid on time
    await Invoice.create({
      society: society._id, unit: u._id, type: 'maintenance', period: fmt(lastMonth),
      amount: u.monthlyMaintenance, paidAmount: paidLast ? u.monthlyMaintenance : 0,
      dueDate: lastDue, createdBy: committee._id,
      status: invoiceStatusFor({ amount: u.monthlyMaintenance, paidAmount: paidLast ? u.monthlyMaintenance : 0, dueDate: lastDue }),
      payments: paidLast ? [{ amount: u.monthlyMaintenance, method: 'upi', reference: 'STUB-PAID', at: daysAgo(25) }] : [],
    });
  }

  // Expenses across categories, some linked to vendors.
  const expenseDefs: [string, number, number, number][] = [
    ['security', 28000, 0, 20], ['housekeeping', 18000, 3, 18], ['utilities', 42000, 0, 15],
    ['repairs', 9500, 0, 6], ['maintenance', 15000, 1, 10], ['amenities', 12000, 0, 12],
  ];
  await Expense.create(
    expenseDefs.map(([category, amount, vendorIdx, age]) => ({
      society: society._id, category, amount, date: daysAgo(age),
      vendor: vendorIdx >= 0 ? vendors[vendorIdx]._id : undefined,
      description: `${category} expense`, status: 'approved', createdBy: committee._id,
    }))
  );

  // Community posts.
  await Post.create([
    { society: society._id, type: 'announcement', title: 'Water tanker schedule revised', body: 'Due to higher demand, tankers will now arrive twice daily at 7am and 5pm.', author: committee._id, pinned: true },
    { society: society._id, type: 'event', title: 'Summer Community Potluck 🎉', body: 'Join us at the clubhouse for food and fun!', author: residents[0]._id, eventDate: daysAgo(-5), location: 'Clubhouse', rsvps: residents.slice(0, 3).map((r) => r._id) },
    { society: society._id, type: 'marketplace', title: 'Sofa set for sale', body: 'Gently used 3-seater, great condition.', author: residents[1]._id, price: 8000, contact: '+91 98765 41001', likes: [residents[2]._id] },
    { society: society._id, type: 'poll', title: 'Should we install EV charging points?', author: committee._id, pollOptions: [{ label: 'Yes', votes: residents.slice(0, 4).map((r) => r._id) }, { label: 'No', votes: [residents[4]._id] }, { label: 'Need more info', votes: [] }] },
  ]);

  // Visitors.
  await Visitor.create([
    { society: society._id, unit: units[0]._id, name: 'Amazon Delivery', purpose: 'delivery', status: 'checked-out', inTime: daysAgo(0), outTime: daysAgo(0), createdBy: residents[0]._id },
    { society: society._id, unit: units[1]._id, name: 'Suresh (Guest)', purpose: 'guest', status: 'checked-in', inTime: new Date(), createdBy: residents[1]._id },
    { society: society._id, unit: units[2]._id, name: 'Plumber - QuickFix', purpose: 'service', status: 'expected', expectedAt: daysAgo(-1), createdBy: committee._id },
  ]);

  return { society: society.name, units: units.length, residents: residents.length + 1, vendors: vendors.length };
}

// CLI entry: `npm run seed`
const isCli = process.argv[1] && process.argv[1].endsWith('seed.ts');
if (isCli) {
  (async () => {
    await connectDB();
    const summary = await seedData();
    console.log('✅ Seeded:', summary);
    console.log('   Login: committee@demo.com / asha@demo.com / vikram@demo.com (password123)');
    await disconnectDB();
    process.exit(0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
