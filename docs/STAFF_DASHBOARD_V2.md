# STAFF_DASHBOARD_V2.md

# K Gaming XCafe — Staff Dashboard V2 System

## Major Dashboard Update

This document explains the new staff dashboard system for K Gaming XCafe after the implementation of the V2 slot-based booking architecture.

The previous dashboard concept is no longer sufficient.

Old concept:

* global device status
* simple ready/in use toggle
* generic CRUD interaction

The new V2 booking system requires:

# schedule-based operational management

The dashboard must now work around:

* booking schedules
* realtime slot visibility
* operational timelines
* time-slot management
* realtime booking conflicts

This document becomes the new primary dashboard direction.

---

# Core Dashboard Philosophy

The dashboard is designed for:

* fast operational usage
* cashier usage
* iPad usage
* mobile-first interaction
* shift-based workflows

The dashboard must feel:

* simple
* responsive
* operationally efficient
* touch-friendly
* realtime

This is NOT an enterprise management panel.

Avoid:

* complex tables
* excessive forms
* small buttons
* desktop-first layouts
* bloated analytics

---

# Important System Change

## OLD SYSTEM

Old system logic:

```txt id="old1"
device.status = Ready
device.status = In Use
```

This system is now deprecated.

---

# NEW SYSTEM

The dashboard now manages:

# device schedules and booking slots

Devices are no longer globally:

* ready
* booked
* in use

Instead:
a device may:

* be available at 18:00
* in use at 19:00
* booked at 20:00
* available again at 22:00

This is now the core operational logic.

---

# Dashboard Home Structure

The dashboard home should display:

# device overview cards

Each card should summarize:

* current status
* active session
* next booking
* quick actions

Do NOT display the full schedule on the homepage.

The homepage should remain clean and fast.

---

# Recommended Device Card Layout

Example:

```txt id="card1"
🎮 PS5 VIP 1

Current:
🔴 In Use

Ends:
21:00

Next Booking:
21:30
```

Quick Actions:

```txt id="card2"
[ START USE ]
[ VIEW SCHEDULE ]
[ MAINTENANCE ]
```

Cards must remain:

* large
* readable
* touch-friendly
* mobile responsive

---

# Dashboard Interaction Philosophy

The dashboard must prioritize:

# one-tap or two-tap operations

Staff should not navigate through:

* multiple menus
* complicated forms
* nested pages

Operational speed is the priority.

---

# Device Schedule View

When a staff member taps:

```txt id="tap1"
VIEW SCHEDULE
```

the system opens:

# Device Schedule View

This becomes the main operational interface.

---

# Device Schedule View Purpose

This page allows staff to:

* view realtime slot schedules
* manage slot statuses
* create manual sessions
* monitor upcoming bookings
* update slot conditions

This is the heart of the V2 operational system.

---

# Schedule Time Format

Operational hours:

```txt id="time1"
10:00 AM — 01:00 AM
```

MANDATORY:
The system must generate:

# 30-minute slot intervals

Correct example:

```txt id="time2"
10:00
10:30
11:00
11:30
12:00
12:30
...
00:30
01:00
```

This rule is mandatory.

The system must NEVER:

* fallback into 1-hour slots
* generate inconsistent intervals
* use manual free-text scheduling

---

# Slot Timeline UI

Recommended UI:

# horizontal slot timeline

Example:

```txt id="slot1"
18:00 🟢
18:30 🟢
19:00 🔴
19:30 🔴
20:00 🟡
20:30 🟡
21:00 🟢
```

Meaning:

* 🟢 Available
* 🔴 In Use
* 🟡 Booked/Pending
* ⚪ Maintenance

The UI must feel:

* visual
* touch-friendly
* easy to scan quickly

Avoid:

* spreadsheet-style grids
* enterprise booking tables

---

# Slot Interaction System

When a slot is tapped:
show quick operational actions.

Example:

```txt id="slot2"
[ In Use ]
[ Booked ]
[ Pending ]
[ Maintenance ]
[ Clear Slot ]
```

The interaction must remain:

* fast
* minimal
* operationally practical

---

# Manual Walk-In Customer System

The dashboard must support:

# walk-in customers

Example:
A customer arrives directly at the cafe.

Staff can:

1. select device
2. tap available slot
3. mark slot as:

* In Use
* Booked

The system then:

* locks affected slots
* updates realtime availability
* updates public booking view

---

# Booking Conflict Logic

The system must prevent:

* overlapping bookings
* double bookings
* invalid slot selection

If slots are occupied:
they must become unavailable automatically.

---

# Realtime Synchronization

All dashboard changes must sync in realtime.

When staff:

* changes slot status
* starts session
* ends session
* marks maintenance
* approves booking

the public view must instantly update.

No manual refresh.

---

# Maintenance Mode

Staff must be able to:

# temporarily disable slots

Example:
If a device has issues from:

```txt id="maint1"
19:00 — 21:00
```

those slots become:
⚪ Maintenance

Customers cannot book them.

---

# Quick Session Workflow

Recommended operational workflow:

## Start Session

Tap slot:

```txt id="flow1"
→ In Use
```

## Booking Session

Tap slot:

```txt id="flow2"
→ Booked
```

## End Session

Tap slot:

```txt id="flow3"
→ Clear Slot
```

This keeps operations extremely fast.

---

# Public View Synchronization

The public website must instantly reflect:

* slot changes
* booking approvals
* maintenance blocks
* active sessions

Public users should only see:

# available slots

---

# Shift-Based Operational Design

Because K Gaming XCafe uses:

* morning shifts
* night shifts

the dashboard must support:

* rapid staff transitions
* clear session visibility
* realtime operational continuity

---

# Activity Log Requirements

Every dashboard action must be logged.

Examples:

* slot updated
* session started
* maintenance enabled
* booking approved
* booking rejected
* slot cleared

Each log must contain:

* staff username
* timestamp
* device
* affected slot

This system is mandatory.

---

# Mobile-First Requirement

The dashboard is primarily used on:

* phones
* cashier tablets
* iPads

All layouts must prioritize:

* vertical spacing
* thumb interaction
* large buttons
* responsive behavior

Avoid desktop-only thinking.

---

# UI/UX Design Direction

The dashboard should feel:

* modern
* premium
* gaming-oriented
* operationally efficient

Reference feeling:

* premium booking systems
* realtime reservation apps
* modern esports operational interfaces

Avoid:

* generic admin templates
* enterprise ERP feeling
* cluttered analytics dashboards

---

# Recommended Navigation

Simple navigation only.

Recommended:

* bottom navigation
* simple tabs
* lightweight menu

Avoid:

* deep nested sidebar structures

---

# Owner vs Staff Dashboard

## Staff

Can:

* manage slots
* manage schedules
* update statuses
* approve bookings
* monitor operational activity

---

## Owner

Can additionally:

* manage staff accounts
* modify system settings
* monitor all activity
* manage operational controls

---

# Development Priority

Priority order:

1. operational speed
2. slot clarity
3. realtime synchronization
4. mobile usability
5. visual simplicity

Do NOT prioritize:

* excessive animations
* complex analytics
* unnecessary features

---

# Final Dashboard Goal

The final dashboard should feel like:

# a professional realtime gaming reservation control panel

not:

* a simple CRUD admin panel
* a generic inventory dashboard
* a bloated management system

Every interaction should support:

* fast gaming cafe operations
* realtime scheduling
* shift efficiency
* customer booking clarity
