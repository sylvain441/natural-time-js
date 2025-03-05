# Natural Time Context Tests

This document outlines detailed tests for the context.js functionality in the natural-time-js library.

## 1. NaturalSunAltitude Tests

### 1.1 Basic Functionality Tests

```javascript
test('should calculate sun altitude at equator', () => {
  const equinoxDate = new NaturalDate(SPRING_EQUINOX, EQUATOR.longitude);
  const sunAltitude = NaturalSunAltitude(equinoxDate, EQUATOR.latitude);
  
  // At equator during equinox, highest sun altitude should be close to 90°
  expect(sunAltitude.highestAltitude).toBeCloseTo(90, 0);
  
  // At noon during equinox at equator, sun should be directly overhead
  const noonEquinox = new Date(SPRING_EQUINOX);
  noonEquinox.setUTCHours(12, 0, 0, 0);
  const noonDate = new NaturalDate(noonEquinox, EQUATOR.longitude);
  const noonAltitude = NaturalSunAltitude(noonDate, EQUATOR.latitude);
  
  expect(noonAltitude.altitude).toBeCloseTo(90, 0);
});
```

### 1.2 Hemisphere Tests

```javascript
test('should calculate sun altitude in Northern Hemisphere', () => {
  // Summer solstice in Northern Hemisphere
  const summerDate = new NaturalDate(SUMMER_SOLSTICE_NH, PARIS.longitude);
  const summerAltitude = NaturalSunAltitude(summerDate, PARIS.latitude);
  
  // Winter solstice in Northern Hemisphere
  const winterDate = new NaturalDate(WINTER_SOLSTICE_NH, PARIS.longitude);
  const winterAltitude = NaturalSunAltitude(winterDate, PARIS.latitude);
  
  // Sun should be higher in summer than in winter
  expect(summerAltitude.highestAltitude).toBeGreaterThan(winterAltitude.highestAltitude);
});

test('should calculate sun altitude in Southern Hemisphere', () => {
  // Summer solstice in Northern Hemisphere (winter in Southern)
  const winterSHDate = new NaturalDate(SUMMER_SOLSTICE_NH, SYDNEY.longitude);
  const winterSHAltitude = NaturalSunAltitude(winterSHDate, SYDNEY.latitude);
  
  // Winter solstice in Northern Hemisphere (summer in Southern)
  const summerSHDate = new NaturalDate(WINTER_SOLSTICE_NH, SYDNEY.longitude);
  const summerSHAltitude = NaturalSunAltitude(summerSHDate, SYDNEY.latitude);
  
  // Sun should be higher in summer than in winter (opposite of Northern Hemisphere)
  expect(summerSHAltitude.highestAltitude).toBeGreaterThan(winterSHAltitude.highestAltitude);
});
```

### 1.3 Time of Day Tests

```javascript
test('should calculate sun altitude at different times of day', () => {
  // Create a date at noon
  const noonDate = new Date();
  noonDate.setUTCHours(12, 0, 0, 0);
  const naturalNoonDate = new NaturalDate(noonDate, 0); // At Greenwich
  
  // Create a date at midnight
  const midnightDate = new Date();
  midnightDate.setUTCHours(0, 0, 0, 0);
  const naturalMidnightDate = new NaturalDate(midnightDate, 0); // At Greenwich
  
  // Sun altitude should be higher at noon than at midnight
  const noonAltitude = NaturalSunAltitude(naturalNoonDate, PARIS.latitude);
  const midnightAltitude = NaturalSunAltitude(naturalMidnightDate, PARIS.latitude);
  
  expect(noonAltitude.altitude).toBeGreaterThan(midnightAltitude.altitude);
});
```

## 2. NaturalSunEvents Tests

### 2.1 Basic Events Tests

```javascript
test('should calculate sunrise correctly', () => {
  const date = new NaturalDate(new Date(), PARIS.longitude);
  const sunEvents = NaturalSunEvents(date, PARIS.latitude);
  
  // Sunrise should be between 0° and 180°
  expect(sunEvents.sunrise).toBeGreaterThan(0);
  expect(sunEvents.sunrise).toBeLessThan(180);
});

test('should calculate sunset correctly', () => {
  const date = new NaturalDate(new Date(), PARIS.longitude);
  const sunEvents = NaturalSunEvents(date, PARIS.latitude);
  
  // Sunset should be between 180° and 360°
  expect(sunEvents.sunset).toBeGreaterThan(180);
  expect(sunEvents.sunset).toBeLessThan(360);
});
```

### 2.2 Night and Golden Hour Tests

```javascript
test('should calculate night start and end correctly', () => {
  const date = new NaturalDate(new Date(), PARIS.longitude);
  const sunEvents = NaturalSunEvents(date, PARIS.latitude);
  
  // Night start should be after sunset
  expect(sunEvents.nightStart).toBeGreaterThan(sunEvents.sunset);
  
  // Night end should be before sunrise
  expect(sunEvents.nightEnd).toBeLessThan(sunEvents.sunrise);
});

test('should calculate golden hours correctly', () => {
  const date = new NaturalDate(new Date(), PARIS.longitude);
  const sunEvents = NaturalSunEvents(date, PARIS.latitude);
  
  // Morning golden hour should be between night end and sunrise
  expect(sunEvents.morningGoldenHour).toBeGreaterThan(sunEvents.nightEnd);
  expect(sunEvents.morningGoldenHour).toBeLessThan(sunEvents.sunrise);
  
  // Evening golden hour should be between sunset and night start
  expect(sunEvents.eveningGoldenHour).toBeGreaterThan(sunEvents.sunset);
  expect(sunEvents.eveningGoldenHour).toBeLessThan(sunEvents.nightStart);
});
```

### 2.3 Polar Day/Night Tests

```javascript
test('should handle polar day correctly', () => {
  // Summer solstice at North Pole
  const polarDayDate = new NaturalDate(SUMMER_SOLSTICE_NH, NORTH_POLE.longitude);
  const polarDaySunEvents = NaturalSunEvents(polarDayDate, NORTH_POLE.latitude);
  
  // During polar day, there should be no sunset
  expect(polarDaySunEvents.sunset).toBe(false);
});

test('should handle polar night correctly', () => {
  // Winter solstice at North Pole
  const polarNightDate = new NaturalDate(WINTER_SOLSTICE_NH, NORTH_POLE.longitude);
  const polarNightSunEvents = NaturalSunEvents(polarNightDate, NORTH_POLE.latitude);
  
  // During polar night, there should be no sunrise
  expect(polarNightSunEvents.sunrise).toBe(false);
});
```

### 2.4 Equinox Tests

```javascript
test('should handle equinox day correctly', () => {
  // Spring equinox at equator
  const equinoxDate = new NaturalDate(SPRING_EQUINOX, EQUATOR.longitude);
  const equinoxSunEvents = NaturalSunEvents(equinoxDate, EQUATOR.latitude);
  
  // At equinox on equator, sunrise should be close to 90° (6:00 AM)
  expect(equinoxSunEvents.sunrise).toBeCloseTo(90, 0);
  
  // At equinox on equator, sunset should be close to 270° (6:00 PM)
  expect(equinoxSunEvents.sunset).toBeCloseTo(270, 0);
});
```

## 3. NaturalMoonPosition Tests

### 3.1 Moon Phase Tests

```javascript
test('should calculate moon phase correctly', () => {
  const date = new NaturalDate(new Date(), 0);
  const moonPosition = NaturalMoonPosition(date, PARIS.latitude);
  
  // Moon phase should be between 0 and 360
  expect(moonPosition.phase).toBeGreaterThanOrEqual(0);
  expect(moonPosition.phase).toBeLessThanOrEqual(360);
});
```

### 3.2 Moon Altitude Tests

```javascript
test('should calculate moon altitude correctly', () => {
  const date = new NaturalDate(new Date(), PARIS.longitude);
  const moonPosition = NaturalMoonPosition(date, PARIS.latitude);
  
  // Moon altitude should be a number
  expect(typeof moonPosition.altitude).toBe('number');
  
  // Moon altitude should be between -90 and 90 degrees
  expect(moonPosition.altitude).toBeGreaterThanOrEqual(-90);
  expect(moonPosition.altitude).toBeLessThanOrEqual(90);
});

test('should calculate moon highest altitude correctly', () => {
  const date = new NaturalDate(new Date(), PARIS.longitude);
  const moonPosition = NaturalMoonPosition(date, PARIS.latitude);
  
  // Highest altitude should be a number
  expect(typeof moonPosition.highestAltitude).toBe('number');
  
  // Highest altitude should be between -90 and 90 degrees
  expect(moonPosition.highestAltitude).toBeGreaterThanOrEqual(-90);
  expect(moonPosition.highestAltitude).toBeLessThanOrEqual(90);
});
```

### 3.3 Latitude Tests

```javascript
test('should calculate moon position at different latitudes', () => {
  const date = new NaturalDate(new Date(), 0);
  
  // Calculate moon position at different latitudes
  const northPolePosition = NaturalMoonPosition(date, NORTH_POLE.latitude);
  const equatorPosition = NaturalMoonPosition(date, EQUATOR.latitude);
  const southPolePosition = NaturalMoonPosition(date, SOUTH_POLE.latitude);
  
  // Moon phase should be the same regardless of latitude
  expect(northPolePosition.phase).toBeCloseTo(equatorPosition.phase, 5);
  expect(equatorPosition.phase).toBeCloseTo(southPolePosition.phase, 5);
  
  // Moon altitude should vary with latitude
  expect(northPolePosition.altitude).not.toBeCloseTo(equatorPosition.altitude, 0);
  expect(equatorPosition.altitude).not.toBeCloseTo(southPolePosition.altitude, 0);
});
```

## 4. NaturalMoonEvents Tests

### 4.1 Basic Events Tests

```javascript
test('should calculate moonrise correctly', () => {
  const date = new NaturalDate(new Date(), PARIS.longitude);
  const moonEvents = NaturalMoonEvents(date, PARIS.latitude);
  
  // If moonrise exists, it should be between 0 and 360
  if (moonEvents.moonrise !== false) {
    expect(moonEvents.moonrise).toBeGreaterThanOrEqual(0);
    expect(moonEvents.moonrise).toBeLessThan(360);
  }
});

test('should calculate moonset correctly', () => {
  const date = new NaturalDate(new Date(), PARIS.longitude);
  const moonEvents = NaturalMoonEvents(date, PARIS.latitude);
  
  // If moonset exists, it should be between 0 and 360
  if (moonEvents.moonset !== false) {
    expect(moonEvents.moonset).toBeGreaterThanOrEqual(0);
    expect(moonEvents.moonset).toBeLessThan(360);
  }
});
```

### 4.2 Edge Cases Tests

```javascript
test('should handle cases where moon doesn\'t rise or set', () => {
  // This is a bit tricky to test deterministically without knowing the exact moon position
  // We'll create a test that checks the API behavior rather than specific astronomical events
  
  const date = new NaturalDate(new Date(), NORTH_POLE.longitude);
  const moonEvents = NaturalMoonEvents(date, NORTH_POLE.latitude);
  
  // At extreme latitudes, it's possible that the moon doesn't rise or set
  // The function should return either a number or false
  expect(typeof moonEvents.moonrise === 'number' || moonEvents.moonrise === false).toBe(true);
  expect(typeof moonEvents.moonset === 'number' || moonEvents.moonset === false).toBe(true);
});
```

## 5. Constants Tests

```javascript
test('should have correct HEMISPHERES constants', () => {
  expect(HEMISPHERES.NORTH).toBe('NORTH');
  expect(HEMISPHERES.SOUTH).toBe('SOUTH');
});

test('should have correct SEASONS constants', () => {
  expect(SEASONS.SUMMER_START_DAY).toBe(91);
  expect(SEASONS.SUMMER_END_DAY).toBe(273);
});

test('should have correct ANGLES constants', () => {
  expect(ANGLES.NIGHT_ALTITUDE).toBe(-12);
  expect(ANGLES.GOLDEN_HOUR_ALTITUDE).toBe(6);
});
```

## 6. Error Handling Tests

```javascript
test('should throw error for invalid latitude', () => {
  const date = new NaturalDate(new Date(), 0);
  
  // Test with latitude > 90°
  expect(() => NaturalSunAltitude(date, 91)).toThrow();
  expect(() => NaturalSunEvents(date, 91)).toThrow();
  expect(() => NaturalMoonPosition(date, 91)).toThrow();
  expect(() => NaturalMoonEvents(date, 91)).toThrow();
  
  // Test with latitude < -90°
  expect(() => NaturalSunAltitude(date, -91)).toThrow();
  expect(() => NaturalSunEvents(date, -91)).toThrow();
  expect(() => NaturalMoonPosition(date, -91)).toThrow();
  expect(() => NaturalMoonEvents(date, -91)).toThrow();
});

test('should throw error for invalid NaturalDate', () => {
  // Test with null date
  expect(() => NaturalSunAltitude(null, 0)).toThrow();
  expect(() => NaturalSunEvents(null, 0)).toThrow();
  expect(() => NaturalMoonPosition(null, 0)).toThrow();
  expect(() => NaturalMoonEvents(null, 0)).toThrow();
  
  // Test with invalid object (not a NaturalDate)
  expect(() => NaturalSunAltitude({}, 0)).toThrow();
  expect(() => NaturalSunEvents({}, 0)).toThrow();
  expect(() => NaturalMoonPosition({}, 0)).toThrow();
  expect(() => NaturalMoonEvents({}, 0)).toThrow();
});