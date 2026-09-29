# Free Hour

Free Hour lets ANU students book their free weekly court hour online. ANU
Sport gives every student one free hour a week, weekdays before 2pm. It covers
the badminton, basketball, pickleball, squash and tennis courts and the
cricket nets. Today the only way to claim it is to walk up to the front desk
with a student card, no earlier than 15 minutes before the slot. Free Hour
turns that into a page you can open anywhere: see which courts are free over
the next seven days, enter your uni ID (and your partners'), and tap a slot.
It is a COMP4020 prototype, not an ANU Sport service, and bookings made here
are not real.

<img src="public/after.png" width="1200" height="1420" alt="Free Hour's booking page: the rules in three cards, the booker's confirmed slot with a Cancel button, a day picker for the next seven days, and a court-by-hour grid where one slot shows as Booked">

## The system it replaces

I've tried booking through ANU Sport's website. The place to book is hard to
find, and it's awkward to use once you get there. When I looked closely while
planning this, the free student hour turned out to be the sharpest example:

- The homepage carousel says "ANU Students can hire facilities FREE before 2pm
  for an hour every week". Its "Hire a Facility" button leads to the
  Facilities page and on to online booking. But the rules, on the
  [Student Benefits page](https://anu-sport.com.au/student-services/benefits),
  say the free hour can't be booked online at all (quoted as published):

  > 1 hour of free facility hire every week to play badminton, basketball
  > (half-court), Cricket, tennis, pickleball or squash before 2pm, Monday to
  > Friday, including public holidays (not available on the weekends). This
  > is only applicable to walk in bookings, and valid student IDs must be
  > presented at the time of booking. Bookings cannot be made more then 15
  > minutes before the desired slot. All participants must be ANU Students
  > with valid student IDs. groups cannot book multiple, consecutive hours.

- The [Halls and Courts page](https://anu-sport.com.au/pages/73) promises
  something else: "ANU Students can hire indoor facilities for free before
  2pm!" It mentions no weekly limit and no walk-in rule.
- Other facility bookings go through a separate, white-labelled third-party
  portal. That portal has its own login, which is not the site's "Club Login".
- Nothing tells you whether a court is free before you walk over, and you
  can't plan ahead: 15 minutes before the slot is the earliest you can ask.

## What good looks like here

The decisions, and what each one answers:

- **Booking is the homepage.** The complaint is that booking is hard to find,
  so the first screen is the booking itself: the rules, the free slots for the
  next week, and one form. There's no login, just a uni ID and a tap.
- **The rules are written once, in plain language, and the database enforces
  them instead of a person at a desk.** Whatever the code above it does, the
  schema refuses:
  - a second booking of the same slot;
  - a second free hour in the same week for any listed player;
  - weekends, and slots outside 6am–2pm;
  - impossible dates and malformed uni IDs.

  The server checks the rules that depend on the clock: the slot hasn't
  started, it's at most seven days ahead, and it's after 9am on a public
  holiday. It checks them in Canberra time, because the server runs in UTC and
  Canberra moves between standard and daylight time.
- **You can plan ahead.** Seven days ahead replaces "no more than 15 minutes
  before".
- **Everyone playing is listed, and every listed player uses their free
  hour.** ANU Sport says all participants must be students and that a group
  can't book consecutive hours. Counting every player is my reading of that,
  and it's stricter than their wording. Its advantage is that a group can't
  chain hours at all, rather than relying on a staff member to notice.
- **It works without JavaScript.** Every action is a form that posts and
  redirects. With JavaScript on, open pages update live when anyone books or
  cancels.
- **It's accessible and usable on a phone.** The grid has real table headers,
  every slot button's spoken name says which court and hour it books, and on
  narrow screens the court column stays put while the hours scroll.
- **It's private by default.** Uni IDs are used only to count free hours.
  They are never shown on a page or stored in a cookie. A booking is tied to a
  random device token, only that device can cancel it, and "Forget this
  device" clears the token on a shared computer.

While deciding, I read these ANU Sport pages:

- the homepage;
- the Student Benefits page;
- the Halls and Courts and the Ovals and Fields pages, for the real list of
  facilities and their hours;
- the Gym page, for public holiday hours;
- the facility price list;
- the booking portal itself.

### What the checks enforce, and what's a judgement call

The spec tests in `spec/booking.test.ts` drive the built server the way a
browser does. They hold these promises:

- a booking survives a reload and a server restart;
- it shows as taken to everyone, and as yours to you;
- a slot can't be booked twice;
- each student gets one free hour a week, with partners counted;
- only the booking device can cancel, and cancelling gives back the slot and
  every player's hour;
- forgetting the device clears its cookie;
- no uni ID reaches a cookie or a page;
- a booking is announced on the live stream.

`spec/time.test.ts` pins ISO week numbers and the Canberra clock across the
daylight-saving change. The shipped invariants check landmarks, headings and
an automated accessibility floor on every page.

No test can hold the following, so they are for the crit to judge:

- whether this is actually easier than walking to the desk;
- whether the rules are worded clearly;
- how it looks;
- whether counting every player is the right reading of ANU Sport's rule;
- the modelling choices below.

## Modelling choices

- There are ten facilities, taken from ANU Sport's own pages:
  - Old Hall and New Hall, two courts each;
  - two squash courts;
  - tennis courts at South Oval, Mills Road and Old Canberra House;
  - the cricket nets at South Oval.
- ANU Sport doesn't publish how many tennis courts each location has, so each
  location is one court here.
- Slots are whole hours from 6am, when the halls open, to 2pm. On ACT public
  holidays they start at 9am.
- A week runs from Monday to Sunday.

## What I chose not to build

- paid bookings and payments;
- a real ANU login;
- the front desk's side: check-in and no-shows;
- the gym and group fitness timetables;
- email confirmations;
- waitlists.

Each is a real part of the system, but none is needed to show that the free
hour can be booked online.
