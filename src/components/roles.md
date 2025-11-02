See the Role types definition tab in the spreadsheeet XoCleaners - Laundry Management System for additional matrix details




Role
  types definition
 As a Product owner,
I want different roles defined in the system 

So that,
this can be used to manage access controls (what users can see and do) -
  CRUD operations
 I will know this is completed
  when,
- the following roles have been defined in the system
Platform Admin

Has full access across the platform to do everything all users across
  the platform can do. This is reserved for us at Xo Cleaners and can not be
  assigned to users outside of Xo Cleaners

Can CRUD store account

Manage subscription plans for external stores (billing, limits, renewals). 

Configure global system settings (payment gateways, notification templates, pickup/delivery pricing logic).

Monitor platform-wide analytics: total stores, active users, ticket volumes, revenue trends.

Impersonate any store admin for troubleshooting or support.

Manage integrations (QuickBooks, Twilio, SendGrid, Google Maps API).

Set data retention, backup, and restoration policies.

Configure audit logs and access history.

Activate/Inactivate stores.

Define and manage default roles and permissions templates for new stores.

Store Admin

Can create users for their store

Perform every function any other user in the store can
  perform

Can CRUD all data relate  to the store

If a user with this role deletes any data the Platform Admin should still be able to access the data and restore it.

Manage employee accounts (create, deactivate, assign roles). 

Configure store-specific settings (operating hours, delivery zones, tax rates, pricing tiers).

Create and manage service categories (Dry Cleaning, Wash & Fold, Alterations, etc.).

Set up item price lists (shirts, pants, suits, comforters, etc.).

Define discount rules, loyalty programs, and promo codes.

Manage pickup/delivery schedule settings and assign drivers.

Approve or override refunds above a defined limit.

Export store reports (sales summary, employee productivity, inventory, etc.).

Manage store notifications (SMS, email templates, push alerts).

 Store Owner

Can do everything admin can

their account can not be deactivated by the store admin

Access high-level financial and operational dashboards (revenue, profit, costs).

Approve large transactions, refunds, or discounts.

Manage or override Store Admin access if needed.

Access HR module: view staff timesheets, payroll summaries, and attendance.

Manage store subscription with the platform (upgrade plan, billing info).

Receive and review customer feedback reports.

View audit trail for their store (who did what, when).

Store Manager

Can do everything admin can

Has access to Store Manager's dashboard / metrics

Can do approval for items they are setup to approve.

Assign or reassign customer orders to staff (washers, pressers, drivers). 

Monitor order progress in real time (Received → Processing → Ready → Delivered).

Handle escalated customer complaints from Customer Support.

Generate shift reports and end-of-day summaries.

Approve staff clock-in/out and timesheets.

Manage inventory levels for detergents, bags, hangers, etc.

Request supplies from Store Admin.

Manage route assignments for delivery staff.

Approve or reject promo requests or manual price adjustments.

Cashier / Store Associate

Can create new customer profile

Can collect and process payment

Can void a ticket

Can process a refund

Can apply promo code/discount

Search and view customer order history. 

Reprint or email receipts/invoices.

Update customer contact or address details (with limited permissions).

Transfer a ticket/order to another store location if multi-branch.

Manage missed pickups or reschedules.

Log complaints and resolutions.

Send notifications or reminders (via SMS/email) for pickup or delivery.

Manage petty cash and end-of-day reconciliation.

End user

Can book / Cancel pickup date/time

Can add their Payment method to their account: Cards, Paypal,
  Cashapp

Can make Payments online

Can track status of their tickets/order

Can CRUD their user profile, EXCEPT birthday details

Can track their points / promo code online

Can view all previous and ongoing tickets

View estimated delivery/pickup times. 

Receive real-time SMS/email updates for order status change

Save multiple delivery addresses and favorite pickup instructions.

Rate each order or leave feedback.

View loyalty points, coupons, and referral credits.

Set auto-pickup schedules (e.g., every Monday).

Download digital invoices and receipts.

Share referral codes with friends.

Opt into or out of marketing notifications.

Pause account temporarily (useful for vacations).

Laundry Staff / Operator 

View assigned items and mark process stages (washed, pressed, packaged).

Report damaged/missing items.

Track workload and shift completion.

Driver / Delivery Agent 

View assigned pickup/delivery routes.

Update order status (Picked Up, Delivered).

Capture customer signatures or photos.

Access navigation link via Google Maps API.
 

 


