// Fictional businesses and authored English reviews for the portfolio demo.
export const portfolioCategories = [
  {
    name: 'Information Technology',
    businesses: ['Northstar Digital', 'Brightpath Software', 'Cloudbridge Studio'],
    description: 'An independent technology studio building accessible websites, business software, and cloud integrations for growing teams.',
    services: 'Web development, Software consulting, Cloud integration',
    reviews: [
      'The new website is easy to navigate on my phone. The team explained the handover clearly and included a useful maintenance guide.',
      'Our inventory integration now saves several hours each week. Communication was consistent, although the initial estimate needed one revision.',
      'The support engineer traced a difficult login issue and explained the fix in plain language. I appreciated the follow-up the next morning.',
      'The application works as agreed, but the deployment checklist arrived late. A clearer timeline would have made the launch less stressful.',
      'I waited three days for an answer about a recurring export error. The workaround helped, but the response time needs improvement.',
      'The discovery workshop helped us simplify our requirements. The prototype was practical and the accessibility improvements were thoughtful.',
    ],
  },
  {
    name: 'Education',
    businesses: ['Openfield Academy', 'Summit Learning', 'Oakwood Language Centre'],
    description: 'A learning centre offering small-group classes, practical workshops, and individual feedback for students and working professionals.',
    services: 'Small-group classes, Career workshops, Individual tutoring',
    reviews: [
      'The instructor used practical examples and gave individual feedback on every exercise. I left with a clear plan for practising at home.',
      'Course materials were well organised and the classroom was comfortable. More evening sessions would make attendance easier for working learners.',
      'My tutor adapted the pace to my progress instead of rushing through the slides. The weekly assignments made a noticeable difference.',
      'The lessons covered the advertised topics, though group activities felt short. I would have liked more time to ask questions.',
      'A class was rescheduled with very little notice. The replacement lesson was fine, but communication with students should be more reliable.',
      'The project workshop helped me turn a rough idea into a presentation. Feedback was specific, encouraging, and easy to act on.',
    ],
  },
  {
    name: 'Healthcare',
    businesses: ['Meadow Family Clinic', 'Harbour Wellness', 'Clearview Dental'],
    description: 'A community care provider with appointment-based visits, clear service information, and an accessible reception area.',
    services: 'Scheduled consultations, Routine check-ups, Appointment support',
    reviews: [
      'Reception explained the appointment process clearly and the waiting area was clean. The visit started close to the scheduled time.',
      'Staff answered my questions about the paperwork patiently. Online booking was convenient, although the confirmation email took a while.',
      'The team made the first visit straightforward with clear directions and a transparent fee breakdown before the appointment.',
      'The facilities were comfortable, but I waited longer than expected. An update from reception would have made the delay easier to manage.',
      'It took several calls to change my booking. The front desk eventually helped, but the telephone service was frustrating.',
      'Accessible entry and helpful reception staff made the visit easy to arrange. The follow-up instructions were clearly written.',
    ],
  },
  {
    name: 'Finance',
    businesses: ['Cedar Accounting', 'Bridgeway Advisory', 'Compass Bookkeeping'],
    description: 'A professional services team helping small businesses organise records, understand service fees, and manage bookkeeping workflows.',
    services: 'Bookkeeping, Business reporting, Document preparation',
    reviews: [
      'The monthly report was easy to follow and every service fee was explained in advance. The document checklist saved us considerable time.',
      'Our contact answered questions clearly and kept records organised. The appointment portal could offer more flexible time slots.',
      'The onboarding meeting clarified exactly which documents we needed. Progress updates arrived on schedule and were easy to understand.',
      'The final work met our requirements, but we had to resend a few documents. A single upload checklist would improve the process.',
      'The first response was slow and the estimate did not explain all the optional charges. We needed an extra meeting to clarify the scope.',
      'The team helped organise a backlog of receipts into a readable report. Their explanations made the handover manageable for our staff.',
    ],
  },
  {
    name: 'Retail',
    businesses: ['Willow Home Goods', 'Everyday Market', 'Fieldstone Outfitters'],
    description: 'A neighbourhood retailer offering thoughtfully selected everyday products, clear pricing, and helpful in-store assistance.',
    services: 'In-store shopping, Product advice, Order collection',
    reviews: [
      'Products were easy to find and prices were clearly displayed. Checkout was quick and the packaging kept everything secure on the way home.',
      'The assistant suggested a useful alternative when my first choice was unavailable. A live stock indicator online would be helpful.',
      'My collection order was ready at the agreed time. Staff checked the items with me and explained the return policy without being asked.',
      'The selection was reasonable, but the checkout queue moved slowly. Another open counter would help during the afternoon rush.',
      'An advertised item was unavailable and the shelf label had not been updated. I would appreciate more accurate stock information.',
      'The store was tidy and easy to browse. A staff member took time to compare two options without pressuring me to buy the pricier one.',
    ],
  },
] as const

export const portfolioLocations = [
  { province: 'Ho Chi Minh City', ward: 'Ben Thanh', addressLine: '12 Le Loi Street', latitude: 10.7731, longitude: 106.6996 },
  { province: 'Ha Noi', ward: 'Cua Nam', addressLine: '24 Trang Thi Street', latitude: 21.0267, longitude: 105.8464 },
  { province: 'Da Nang', ward: 'Hai Chau', addressLine: '36 Bach Dang Street', latitude: 16.0678, longitude: 108.2234 },
] as const

export const portfolioReviewers = ['Alex Morgan', 'Jamie Chen', 'Taylor Brooks', 'Jordan Lee', 'Casey Parker', 'Riley Bennett'] as const
export const portfolioCriteria = [
  { name: 'Service quality', description: 'How well the service or product meets customer expectations.' },
  { name: 'Customer support', description: 'Helpfulness, clarity, and responsiveness of the team.' },
  { name: 'Value for money', description: 'Value received relative to the stated price.' },
  { name: 'Overall experience', description: 'Convenience and satisfaction throughout the customer journey.' },
] as const
