# V2_BOOKING_SYSTEM.md

# K Gaming XCafe — V2 Booking System Update

## Major System Update

This document explains the major booking system update requested for K Gaming XCafe.

The previous booking concept is no longer the primary system.

The project has now shifted into a:

# realtime slot-based booking platform

inspired by:

* cinema seat booking systems
* reservation scheduling systems
* modern time-slot operational systems

This update changes:

* booking architecture
* booking flow
* realtime logic
* UI/UX behavior
* database structure
* customer interaction flow

This is considered a major operational redesign.

---

# Previous System (Deprecated)

The previous booking flow used:

* simple realtime status
* manual booking flow
* generic ready/in use system

Example:

* device = ready
* device = booked
* device = in use

This approach is no longer sufficient for operational requirements.

Problems:

* unclear booking schedules
* possible booking conflicts
* difficult multi-time management
* less professional customer experience
* limited scheduling flexibility

---

# New V2 Booking Concept

The system is now:

# slot-based booking

Each device operates using:

* date-based schedules
* time slots
* realtime availability
* automatic slot blocking

This creates a more professional operational flow.

---

# Core Booking Philosophy

Customers should not manually type booking schedules anymore.

Instead:

1. customer selects device
2. customer selects available time slot
3. customer selects duration
4. system automatically handles scheduling logic

The experience should feel:

* simple
* modern
* realtime
* organized
* intuitive

---

# Operational Time Format

K Gaming XCafe operational hours:

```txt
10:00 AM — 01:00 AM
```

The system must automatically generate booking slots between operational hours.

---

# Slot Interval System

Booking intervals are:

# every 30 minutes

Example generated slots:

```txt
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

This interval system is mandatory.

Do NOT use:

* 1 hour intervals only
* free text manual time input

All scheduling must use controlled slot selection.

---

# Slot Availability Logic

Each slot has realtime availability status.

Example:

| Time  | Status    |
| ----- | --------- |
| 18:00 | Available |
| 18:30 | Available |
| 19:00 | Booked    |
| 19:30 | Booked    |
| 20:00 | Booked    |
| 20:30 | Booked    |
| 21:00 | Available |

If a booking exists:

* affected slots become unavailable
* other customers cannot select those slots

This prevents booking overlap.

---

# Booking Duration Logic

Customers choose:

* start time
* duration

The system automatically calculates:

* blocked slots
* end time
* availability conflict

Example:

Booking:

```txt
Start: 19:00
Duration: 2 Hours
```

Automatically blocks:

```txt
19:00
19:30
20:00
20:30
```

---

# Realtime Booking Behavior

The booking system must update in realtime.

When:

* booking created
* booking approved
* booking cancelled
* booking completed

all users must instantly see updated slot availability.

No manual refresh should be required.

---

# Pending Booking Logic

Bookings should NOT automatically become approved.

Flow:

1. customer creates booking
2. booking status becomes pending
3. staff/owner reviews request
4. staff approves or rejects booking

This helps prevent:

* fake bookings
* spam reservations
* slot abuse
* operational conflicts

---

# Slot Locking Logic

Recommended behavior:

## Pending bookings:

temporarily reserve slots

## Approved bookings:

fully lock slots

## Rejected/expired bookings:

release slots again

This system creates safer operational scheduling.

---

# Public Customer Experience

The customer booking experience must feel:

* lightweight
* touch-friendly
* mobile optimized
* visually simple

The customer should:

* immediately understand available times
* avoid confusion
* complete booking quickly

---

# Public Booking Flow

## Step 1

Select device

## Step 2

Select booking date

## Step 3

Select available time slot

## Step 4

Select duration

## Step 5

Booking confirmation

## Step 6

Automatically open WhatsApp booking message

---

# WhatsApp Integration

WhatsApp remains the primary communication method.

Admin Number:

```txt
082152425391
```

The system must automatically generate formatted booking messages.

Example:

```txt
Halo admin K Gaming XCafe

Saya ingin booking:

Device: PS5 VIP 1
Tanggal: 15 Juni 2026
Jam: 19:00
Durasi: 2 Jam
Nama: Raken
```

The customer should never need to manually type long booking text.

---

# UI/UX Direction Update

The booking UI must now prioritize:

* time visibility
* schedule clarity
* slot readability
* touch interaction
* fast booking flow

The interface should resemble:

* modern reservation systems
* cinema scheduling systems
* premium booking applications

Avoid:

* confusing calendar interfaces
* complex enterprise booking tables
* small touch targets

---

# Recommended Slot UI

Recommended interaction:

* large touch-friendly slot buttons
* color-coded availability
* responsive mobile layout
* clean spacing

Example:

```txt
[ 18:00 ]
[ 18:30 ]
[ 19:00 ❌ ]
[ 19:30 ❌ ]
[ 20:00 ❌ ]
[ 20:30 ❌ ]
[ 21:00 ]
```

---

# Device Status System Update

Devices are no longer:

* globally ready
* globally booked

Instead:
devices now operate based on:

# schedule availability

A device may:

* be available at 18:00
* booked at 19:00
* available again at 21:00

This is a major operational change.

---

# Database Structure Update

The database architecture must support:

* slot scheduling
* realtime booking conflicts
* time-based availability

Recommended tables:

## devices

Stores:

* device information
* category
* pricing
* operational status

---

## bookings

Stores:

* device_id
* booking_date
* start_time
* end_time
* duration
* booking_status
* customer_name
* created_by
* approval_status

---

## activity_logs

Stores:

* booking activity
* schedule changes
* slot updates
* shift activity

---

# Activity Log Requirements

Every booking action must be logged.

Examples:

* booking created
* booking approved
* booking rejected
* booking cancelled
* slot manually modified

This is mandatory for shift operations.

---

# Shift Operational Requirement

Because K Gaming XCafe uses:

* morning shift
* night shift

the system must maintain:

* clear booking history
* realtime operational visibility
* staff accountability

---

# Development Direction

This V2 update is considered:

# the new core booking architecture

Future development should follow this system.

The previous booking flow should not become the primary implementation anymore.

---

# Final Development Goal

The final platform should feel like:

* a professional gaming reservation platform
* a realtime operational scheduling system
* a modern customer booking experience

not a simple CRUD dashboard.

Every UI and system decision should prioritize:

* operational efficiency
* realtime clarity
* customer convenience
* mobile usability
* fast shift operations
