


-- 1. USERS
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  gender VARCHAR(10),
  dob DATE,
  mobile VARCHAR(15),
  role ENUM('Passenger', 'Staff', 'Admin') DEFAULT 'Passenger'
);

-- 2. PASSENGER (1:1 to users)
CREATE TABLE passenger (
  passenger_id INT PRIMARY KEY,
  FOREIGN KEY (passenger_id) REFERENCES users(user_id)
);

-- 3. ROUTES
CREATE TABLE routes (
  route_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);



-- 4. STATIONS
CREATE TABLE stations (
  station_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- 5. ROUTE_STATION (M:N)
CREATE TABLE route_stations (
  route_id INT,
  station_id INT,
  station_order INT,
  PRIMARY KEY (route_id, station_id),
  FOREIGN KEY (route_id) REFERENCES routes(route_id),
  FOREIGN KEY (station_id) REFERENCES stations(station_id)
);



-- 6. TRAINS
CREATE TABLE trains (
  train_id INT AUTO_INCREMENT PRIMARY KEY,
  train_number VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  route_id INT NOT NULL,
  FOREIGN KEY (route_id) REFERENCES routes(route_id)
);

-- 7. SCHEDULES
CREATE TABLE schedules (
  schedule_id INT AUTO_INCREMENT PRIMARY KEY,
  train_id INT NOT NULL,
  travel_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  FOREIGN KEY (train_id) REFERENCES trains(train_id)
);

-- 8. SEATS
CREATE TABLE seats (
  seat_id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  class_type ENUM('AC', 'SL') NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id)
);



-- 9. BOOKINGS
CREATE TABLE bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  schedule_id INT NOT NULL,
  booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_status ENUM('Pending', 'Completed') DEFAULT 'Pending',
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id)
);

select * from bookings;
-- 10. BOOKING_DETAILS
CREATE TABLE booking_details (
  booking_detail_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  passenger_name VARCHAR(100) NOT NULL,
  age INT,
  gender VARCHAR(10),
  seat_id INT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
  FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
);


-- 11. PAYMENTS (1:1 with booking)
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNIQUE NOT NULL,
  amount DECIMAL(10, 2),
  method VARCHAR(50),
  status ENUM('Paid', 'Failed') DEFAULT 'Paid',
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);


-- 12. TICKETS (1:N with booking)
CREATE TABLE tickets (
  ticket_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  issued_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);



-- 13. TRAVEL_HISTORY
CREATE TABLE travel_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  passenger_id INT NOT NULL,
  booking_id INT NOT NULL,
  trip_date DATE NOT NULL,
  FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);




-- ROUTES
INSERT INTO routes (name) VALUES
('Delhi to Mumbai Express'),
('Chennai to Hyderabad Line'),
('Bangalore to Kochi Express'),
('Kolkata to Patna Intercity'),
('Ahmedabad to Jaipur Special');

-- STATIONS
INSERT INTO stations (name) VALUES
('Delhi'),
('Agra'),
('Bhopal'),
('Mumbai'),
('Chennai'),
('Bangalore'),
('Hyderabad');

-- ROUTE_STATIONS (assign stations to each route in order)
-- Route 1: Delhi → Mumbai
INSERT INTO route_stations (route_id, station_id, station_order) VALUES
(1, 1, 1), -- Delhi
(1, 2, 2), -- Agra
(1, 3, 3), -- Bhopal
(1, 4, 4); -- Mumbai

-- Route 2: Chennai → Hyderabad
INSERT INTO route_stations (route_id, station_id, station_order) VALUES
(2, 5, 1), -- Chennai
(2, 6, 2), -- Bangalore
(2, 7, 3); -- Hyderabad

-- TRAINS
INSERT INTO trains (train_number, name, route_id) VALUES
('12345', 'Delhi-Mumbai Superfast', 1),
('67890', 'Chennai-Hyderabad Express', 2),
('45678', 'Bangalore-Kochi Express', 3),
('98765', 'Kolkata-Patna Intercity', 4);

-- SCHEDULES (today + future travel dates)
INSERT INTO schedules (train_id, travel_date, departure_time, arrival_time) VALUES
(1, '2025-04-03', '06:00:00', '16:00:00'),
(1, '2025-04-04', '06:00:00', '16:00:00'),
(2, '2025-04-03', '08:00:00', '14:30:00'),
(2, '2025-04-05', '08:00:00', '14:30:00'),
(3, '2025-04-03', '09:00:00', '18:00:00'),
(3, '2025-04-05', '09:00:00', '18:00:00'),
(4, '2025-04-04', '07:30:00', '12:30:00'),
(1, '2025-04-06', '07:30:00', '12:30:00'),
(2, '2025-04-07', '10:00:00', '17:00:00'),
(4, '2025-04-08', '06:30:00', '11:00:00');

-- SEATS (AC & SL for each schedule)
-- For each schedule, 5 AC and 5 SL seats
INSERT INTO seats (schedule_id, class_type, seat_number)
VALUES
-- Schedule 1
(1, 'AC', 'A1'), (1, 'AC', 'A2'), (1, 'AC', 'A3'), (1, 'AC', 'A4'), (1, 'AC', 'A5'),
(1, 'SL', 'S1'), (1, 'SL', 'S2'), (1, 'SL', 'S3'), (1, 'SL', 'S4'), (1, 'SL', 'S5'),
(1, 'AC', 'A11'), (1, 'AC', 'A12'), (1, 'AC', 'A13'), (1, 'AC', 'A14'), (1, 'AC', 'A15'),
(1, 'SL', 'S1'), (1, 'SL', 'S2'), (1, 'SL', 'S3'), (1, 'SL', 'S4'), (1, 'SL', 'S5'),
(1, 'SL', 'S6'), (1, 'SL', 'S7'), (1, 'SL', 'S8'), (1, 'SL', 'S9'), (1, 'SL', 'S10'),
(1, 'SL', 'S11'), (1, 'SL', 'S12'), (1, 'SL', 'S13'), (1, 'SL', 'S14'), (1, 'SL', 'S15'),

-- Schedule 2
(2, 'AC', 'A1'), (2, 'AC', 'A2'), (2, 'AC', 'A3'), (2, 'AC', 'A4'), (2, 'AC', 'A5'),
(2, 'SL', 'S1'), (2, 'SL', 'S2'), (2, 'SL', 'S3'), (2, 'SL', 'S4'), (2, 'SL', 'S5'),
(2, 'AC', 'A11'), (2, 'AC', 'A12'), (2, 'AC', 'A13'), (2, 'AC', 'A14'), (2, 'AC', 'A15'),
(2, 'SL', 'S1'), (2, 'SL', 'S2'), (2, 'SL', 'S3'), (2, 'SL', 'S4'), (2, 'SL', 'S5'),
(2, 'SL', 'S6'), (2, 'SL', 'S7'), (2, 'SL', 'S8'), (2, 'SL', 'S9'), (2, 'SL', 'S10'),
(2, 'SL', 'S11'), (2, 'SL', 'S12'), (2, 'SL', 'S13'), (2, 'SL', 'S14'), (2, 'SL', 'S15'),

-- Schedule 3
(3, 'AC', 'A1'), (3, 'AC', 'A2'), (3, 'AC', 'A3'), (3, 'AC', 'A4'), (3, 'AC', 'A5'),
(3, 'SL', 'S1'), (3, 'SL', 'S2'), (3, 'SL', 'S3'), (3, 'SL', 'S4'), (3, 'SL', 'S5'),
(3, 'AC', 'A11'), (3, 'AC', 'A12'), (3, 'AC', 'A13'), (3, 'AC', 'A14'), (3, 'AC', 'A15'),
(3, 'SL', 'S1'), (3, 'SL', 'S2'), (3, 'SL', 'S3'), (3, 'SL', 'S4'), (3, 'SL', 'S5'),
(3, 'SL', 'S6'), (3, 'SL', 'S7'), (3, 'SL', 'S8'), (3, 'SL', 'S9'), (3, 'SL', 'S10'),
(3, 'SL', 'S11'), (3, 'SL', 'S12'), (3, 'SL', 'S13'), (3, 'SL', 'S14'), (3, 'SL', 'S15'),

-- Schedule 4
(4, 'AC', 'A1'), (4, 'AC', 'A2'), (4, 'AC', 'A3'), (4, 'AC', 'A4'), (4, 'AC', 'A5'),
(4, 'SL', 'S1'), (4, 'SL', 'S2'), (4, 'SL', 'S3'), (4, 'SL', 'S4'), (4, 'SL', 'S5'),
(4, 'AC', 'A11'), (4, 'AC', 'A12'), (4, 'AC', 'A13'), (4, 'AC', 'A14'), (4, 'AC', 'A15'),
(4, 'SL', 'S1'), (4, 'SL', 'S2'), (4, 'SL', 'S3'), (4, 'SL', 'S4'), (4, 'SL', 'S5'),
(4, 'SL', 'S6'), (4, 'SL', 'S7'), (4, 'SL', 'S8'), (4, 'SL', 'S9'), (4, 'SL', 'S10'),
(4, 'SL', 'S11'), (4, 'SL', 'S12'), (4, 'SL', 'S13'), (4, 'SL', 'S14'), (4, 'SL', 'S15'),

-- Schedule 5
(5, 'AC', 'A1'), (5, 'AC', 'A2'), (5, 'AC', 'A3'), (5, 'AC', 'A4'), (5, 'AC', 'A5'),
(5, 'AC', 'A6'), (5, 'AC', 'A7'), (5, 'AC', 'A8'), (5, 'AC', 'A9'), (5, 'AC', 'A10'),
(5, 'AC', 'A11'), (5, 'AC', 'A12'), (5, 'AC', 'A13'), (5, 'AC', 'A14'), (5, 'AC', 'A15'),
(5, 'SL', 'S1'), (5, 'SL', 'S2'), (5, 'SL', 'S3'), (5, 'SL', 'S4'), (5, 'SL', 'S5'),
(5, 'SL', 'S6'), (5, 'SL', 'S7'), (5, 'SL', 'S8'), (5, 'SL', 'S9'), (5, 'SL', 'S10'),
(5, 'SL', 'S11'), (5, 'SL', 'S12'), (5, 'SL', 'S13'), (5, 'SL', 'S14'), (5, 'SL', 'S15'),

-- Schedule 6
(6, 'AC', 'A1'), (6, 'AC', 'A2'), (6, 'AC', 'A3'), (6, 'AC', 'A4'), (6, 'AC', 'A5'),
(6, 'AC', 'A6'), (6, 'AC', 'A7'), (6, 'AC', 'A8'), (6, 'AC', 'A9'), (6, 'AC', 'A10'),
(6, 'AC', 'A11'), (6, 'AC', 'A12'), (6, 'AC', 'A13'), (6, 'AC', 'A14'), (6, 'AC', 'A15'),
(6, 'SL', 'S1'), (6, 'SL', 'S2'), (6, 'SL', 'S3'), (6, 'SL', 'S4'), (6, 'SL', 'S5'),
(6, 'SL', 'S6'), (6, 'SL', 'S7'), (6, 'SL', 'S8'), (6, 'SL', 'S9'), (6, 'SL', 'S10'),
(6, 'SL', 'S11'), (6, 'SL', 'S12'), (6, 'SL', 'S13'), (6, 'SL', 'S14'), (6, 'SL', 'S15'),

-- Schedule 7
(7, 'AC', 'A1'), (7, 'AC', 'A2'), (7, 'AC', 'A3'), (7, 'AC', 'A4'), (7, 'AC', 'A5'),
(7, 'AC', 'A6'), (7, 'AC', 'A7'), (7, 'AC', 'A8'), (7, 'AC', 'A9'), (7, 'AC', 'A10'),
(7, 'AC', 'A11'), (7, 'AC', 'A12'), (7, 'AC', 'A13'), (7, 'AC', 'A14'), (7, 'AC', 'A15'),
(7, 'SL', 'S1'), (7, 'SL', 'S2'), (7, 'SL', 'S3'), (7, 'SL', 'S4'), (7, 'SL', 'S5'),
(7, 'SL', 'S6'), (7, 'SL', 'S7'), (7, 'SL', 'S8'), (7, 'SL', 'S9'), (7, 'SL', 'S10'),
(7, 'SL', 'S11'), (7, 'SL', 'S12'), (7, 'SL', 'S13'), (7, 'SL', 'S14'), (7, 'SL', 'S15'),

-- Schedule 8
(8, 'AC', 'A1'), (8, 'AC', 'A2'), (8, 'AC', 'A3'), (8, 'AC', 'A4'), (8, 'AC', 'A5'),
(8, 'AC', 'A6'), (8, 'AC', 'A7'), (8, 'AC', 'A8'), (8, 'AC', 'A9'), (8, 'AC', 'A10'),
(8, 'AC', 'A11'), (8, 'AC', 'A12'), (8, 'AC', 'A13'), (8, 'AC', 'A14'), (8, 'AC', 'A15'),
(8, 'SL', 'S1'), (8, 'SL', 'S2'), (8, 'SL', 'S3'), (8, 'SL', 'S4'), (8, 'SL', 'S5'),
(8, 'SL', 'S6'), (8, 'SL', 'S7'), (8, 'SL', 'S8'), (8, 'SL', 'S9'), (8, 'SL', 'S10'),
(8, 'SL', 'S11'), (8, 'SL', 'S12'), (8, 'SL', 'S13'), (8, 'SL', 'S14'), (8, 'SL', 'S15'),

-- Schedule 9
(9, 'AC', 'A1'), (9, 'AC', 'A2'), (9, 'AC', 'A3'), (9, 'AC', 'A4'), (9, 'AC', 'A5'),
(9, 'AC', 'A6'), (9, 'AC', 'A7'), (9, 'AC', 'A8'), (9, 'AC', 'A9'), (9, 'AC', 'A10'),
(9, 'AC', 'A11'), (9, 'AC', 'A12'), (9, 'AC', 'A13'), (9, 'AC', 'A14'), (9, 'AC', 'A15'),
(9, 'SL', 'S1'), (9, 'SL', 'S2'), (9, 'SL', 'S3'), (9, 'SL', 'S4'), (9, 'SL', 'S5'),
(9, 'SL', 'S6'), (9, 'SL', 'S7'), (9, 'SL', 'S8'), (9, 'SL', 'S9'), (9, 'SL', 'S10'),
(9, 'SL', 'S11'), (9, 'SL', 'S12'), (9, 'SL', 'S13'), (9, 'SL', 'S14'), (9, 'SL', 'S15'),

-- Schedule 10
(10, 'AC', 'A1'), (10, 'AC', 'A2'), (10, 'AC', 'A3'), (10, 'AC', 'A4'), (10, 'AC', 'A5'),
(10, 'AC', 'A6'), (10, 'AC', 'A7'), (10, 'AC', 'A8'), (10, 'AC', 'A9'), (10, 'AC', 'A10'),
(10, 'AC', 'A11'), (10, 'AC', 'A12'), (10, 'AC', 'A13'), (10, 'AC', 'A14'), (10, 'AC', 'A15'),
(10, 'SL', 'S1'), (10, 'SL', 'S2'), (10, 'SL', 'S3'), (10, 'SL', 'S4'), (10, 'SL', 'S5'),
(10, 'SL', 'S6'), (10, 'SL', 'S7'), (10, 'SL', 'S8'), (10, 'SL', 'S9'), (10, 'SL', 'S10'),
(10, 'SL', 'S11'), (10, 'SL', 'S12'), (10, 'SL', 'S13'), (10, 'SL', 'S14'), (10, 'SL', 'S15');


