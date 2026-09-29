# Crit 7 reflection: Free Hour

## What was the breakthrough that moved the work forward?

The breakthrough was reading ANU Sport's own pages side by side. The homepage
promises students a free hour a week and sends them to online booking. The
Student Benefits page says that hour is walk-in only and can't be claimed more
than 15 minutes ahead. The Halls and Courts page says something different
again. I already knew the booking was hard to use, but that contradiction
turned "improve the site" into one slice with rules precise enough to build.

The second step was deciding that every listed player uses their free hour.
ANU's rule that a group can't book consecutive hours needs someone at a desk
to police it. Once each player's hour counts, a single unique index on uni ID
and week enforces it, just as another index stops double bookings. The rules
stopped being code I had to trust and became constraints nothing can get
round.

## What did this work change about who I want to be as a software developer?

This week I directed more than I typed. I decided which system to take on,
which slice of it, and which rules the agent works under, and the checks held
it to them. The lesson came from a link check that passed when it shouldn't
have. The test server could load a library that production can't, so a green
result was hiding an image that would break on the live site. I want to be the
developer who asks whether a check would actually fail if the thing were
broken. I also want to put my effort into the few decisions and checks that
matter, not into every line.
