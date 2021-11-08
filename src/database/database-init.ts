export const initScript = `
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS whitelistedvehicles;

CREATE TABLE users (
  userId VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL
);

CREATE TABLE whitelistedVehicles (
  vehicleId SERIAL PRIMARY KEY,
  ownerId VARCHAR(255) NOT NULL,
  licensePlateNumber VARCHAR(255) NOT NULL,
  startTime TIME DEFAULT '00:00:00',
  endTime TIME DEFAULT '00:00:00',
  dateAdded DATE DEFAULT NOW()
);`