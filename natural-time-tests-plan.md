# Natural Time Test Suite Plan

This document outlines a comprehensive test suite for the natural-time-js library based on the specifications in the README.

## 1. NaturalDate Class Tests

### 1.1 Constructor Tests
- [x] Create instance with current date (already implemented)
- [x] Create instance with specific date and longitude (already implemented)
- [x] Throw error for invalid longitude (already implemented)
- [x] Throw error for invalid date (already implemented)
- [ ] Test with string date input
- [ ] Test with timestamp input
- [ ] Test with Date object input
- [ ] Test with different timezone dates

### 1.2 Basic Properties Tests
- [x] Calculate correct year (already implemented)
- [x] Calculate correct moon (1-14) (already implemented)
- [x] Calculate correct week (1-53) (already implemented)
- [x] Calculate correct week of moon (1-4) (already implemented)
- [x] Calculate correct day of moon (1-28) (already implemented)
- [x] Calculate correct day of week (1-7) (already implemented)
- [ ] Test day property (days since END_OF_ARTIFICIAL_TIME)
- [ ] Test dayOfYear property (1-366)
- [ ] Test isRainbowDay property
- [ ] Test yearStart property
- [ ] Test yearDuration property (365-366)
- [ ] Test nadir property

### 1.3 Time Calculations Tests
- [x] Calculate time between 0 and 360 (already implemented)
- [x] Calculate correct time for noon (already implemented)
- [ ] Calculate correct time for midnight
- [ ] Calculate correct time for sunrise
- [ ] Calculate correct time for sunset
- [ ] Test time precision with milliseconds

### 1.4 String Formatting Tests
- [x] Format date string correctly (already implemented)
- [x] Format time string correctly (already implemented)
- [x] Format longitude string correctly (already implemented)
- [x] Format full string correctly (already implemented)
- [ ] Test toYearString() method
- [ ] Test toMoonString() method
- [ ] Test toDayOfMoonString() method
- [ ] Test custom separators in toDateString()
- [ ] Test different decimal places in toTimeString()
- [ ] Test different decimal places in toLongitudeString()

### 1.5 Special Cases Tests
- [x] Handle rainbow days correctly (already implemented)
- [x] Handle different longitudes correctly (already implemented)
- [ ] Test date at END_OF_ARTIFICIAL_TIME
- [ ] Test date before END_OF_ARTIFICIAL_TIME (should have a negative year number)
- [ ] Test date at International Date Line (longitude 180/-180)
- [ ] Test date at Prime Meridian (longitude 0)
- [ ] Test leap year handling
- [ ] Test year transitions
- [ ] Test moon transitions

## 2. NaturalDateContext Tests

### 2.1 NaturalSunAltitude Tests
- [ ] Test sun altitude calculation at equator
- [ ] Test sun altitude calculation in Northern Hemisphere
- [ ] Test sun altitude calculation in Southern Hemisphere
- [ ] Test highest altitude calculation
- [ ] Test sun altitude at different times of day
- [ ] Test sun altitude at different seasons

### 2.2 NaturalSunEvents Tests
- [ ] Test sunrise calculation
- [ ] Test sunset calculation
- [ ] Test nightStart calculation
- [ ] Test nightEnd calculation
- [ ] Test morningGoldenHour calculation
- [ ] Test eveningGoldenHour calculation
- [ ] Test polar day (no sunset in summer at high latitudes)
- [ ] Test polar night (no sunrise in winter at high latitudes)
- [ ] Test equinox day (equal day and night)

### 2.3 NaturalMoonPosition Tests
- [ ] Test moon phase calculation
- [ ] Test moon altitude calculation
- [ ] Test moon highest altitude calculation
- [ ] Test moon position at different latitudes
- [ ] Test moon position at different times of day
- [ ] Test full moon position
- [ ] Test new moon position

### 2.4 NaturalMoonEvents Tests
- [ ] Test moonrise calculation
- [ ] Test moonset calculation
- [ ] Test cases where moon doesn't rise or set
- [ ] Test moonrise/moonset near poles
- [ ] Test moonrise/moonset at equator

### 2.5 MustachesRange Tests (if applicable)
- [ ] Test mustaches range calculation
- [ ] Test edge cases for mustaches range

## 3. Integration Tests

### 3.1 Combined Features Tests
- [ ] Test natural date with sun events
- [ ] Test natural date with moon events
- [ ] Test natural date at different longitudes with sun/moon events
- [ ] Test natural date at different latitudes with sun/moon events

### 3.2 Real-world Scenarios Tests
- [ ] Test specific known dates (solstices, equinoxes)
- [ ] Test specific locations (poles, equator, prime meridian)
- [ ] Test date transitions (year, moon, day)

## 4. Edge Cases and Error Handling

### 4.1 Edge Cases Tests
- [ ] Test with extreme latitudes (±90°)
- [ ] Test with extreme longitudes (±180°)
- [ ] Test with dates far in the future
- [ ] Test with dates at the boundary of END_OF_ARTIFICIAL_TIME

### 4.2 Error Handling Tests
- [ ] Test with invalid latitudes
- [ ] Test with invalid longitudes
- [ ] Test with invalid dates
- [ ] Test with null/undefined parameters

## 5. Performance Tests (Optional)

- [ ] Test performance with many date calculations
- [ ] Test performance with many context calculations
- [ ] Test memory usage with large datasets

## Implementation Priority

1. Complete the basic NaturalDate tests
2. Implement NaturalDateContext tests for sun calculations
3. Implement NaturalDateContext tests for moon calculations
4. Add integration tests
5. Add edge cases and error handling tests
6. (Optional) Add performance tests 