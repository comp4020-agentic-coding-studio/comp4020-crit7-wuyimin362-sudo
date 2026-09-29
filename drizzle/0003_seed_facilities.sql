-- The facilities ANU Sport's free student hour covers, from anu-sport.com.au
-- ("Halls and Courts", "Ovals and Fields"). The tennis locations' court
-- counts aren't published, so each is modelled as one court. One statement:
-- the migrator runs each chunk between breakpoints as a single statement.
INSERT INTO `resources` (`id`, `venue`, `name`, `sports`) VALUES
  (1, 'Old Hall', 'Court 1', 'Badminton · Basketball (half court) · Pickleball'),
  (2, 'Old Hall', 'Court 2', 'Badminton · Basketball (half court) · Pickleball'),
  (3, 'New Hall', 'Court 1', 'Badminton · Basketball (half court) · Pickleball'),
  (4, 'New Hall', 'Court 2', 'Badminton · Basketball (half court) · Pickleball'),
  (5, 'Squash courts', 'Court 1', 'Squash'),
  (6, 'Squash courts', 'Court 2', 'Squash'),
  (7, 'Tennis courts', 'South Oval', 'Tennis'),
  (8, 'Tennis courts', 'Mills Road', 'Tennis'),
  (9, 'Tennis courts', 'Old Canberra House', 'Tennis'),
  (10, 'Cricket nets', 'South Oval', 'Cricket');
