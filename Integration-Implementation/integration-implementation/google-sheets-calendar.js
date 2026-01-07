/**
 * Google Sheets Calendar Integration
 * Manages travel date availability and bookings via Google Sheets
 */

const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

class GoogleSheetsCalendar {
    constructor() {
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        this.auth = null;
        this.sheets = null;
    }

    /**
     * Initialize Google Sheets API authentication
     */
    async initialize() {
        try {
            // Option 1: Service Account (recommended for production)
            if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
                const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

                this.auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
            }
            // Option 2: OAuth2 (for development)
            else if (process.env.GOOGLE_OAUTH_CLIENT_ID) {
                this.auth = new google.auth.OAuth2(
                    process.env.GOOGLE_OAUTH_CLIENT_ID,
                    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
                    process.env.GOOGLE_OAUTH_REDIRECT_URI
                );

                this.auth.setCredentials({
                    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
                });
            } else {
                throw new Error('No Google authentication credentials provided');
            }

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('✅ Google Sheets API initialized');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Google Sheets:', error.message);
            throw error;
        }
    }

    /**
     * Get available dates for a destination
     * @param {string} destination - Destination name (sheet tab name)
     * @param {object} options - Optional filters (month, year, etc.)
     */
    async getAvailableDates(destination, options = {}) {
        try {
            // Read the destination sheet
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${destination}!A2:F1000`, // Assuming columns: Date, Status, Slots Available, Slots Booked, Hotel, Notes
            });

            const rows = response.data.values || [];

            // Parse and filter available dates
            const availableDates = rows
                .filter(row => {
                    const status = (row[1] || '').toLowerCase();
                    const slotsAvailable = parseInt(row[2] || '0');
                    return status === 'available' && slotsAvailable > 0;
                })
                .map(row => ({
                    date: row[0], // Date (YYYY-MM-DD format)
                    status: row[1] || 'unknown',
                    slots_available: parseInt(row[2] || '0'),
                    slots_booked: parseInt(row[3] || '0'),
                    hotel: row[4] || '',
                    notes: row[5] || ''
                }));

            // Apply optional filters
            let filtered = availableDates;

            if (options.month || options.year) {
                filtered = filtered.filter(item => {
                    const date = new Date(item.date);
                    if (options.month && date.getMonth() + 1 !== parseInt(options.month)) {
                        return false;
                    }
                    if (options.year && date.getFullYear() !== parseInt(options.year)) {
                        return false;
                    }
                    return true;
                });
            }

            return {
                destination,
                total_dates: filtered.length,
                dates: filtered
            };

        } catch (error) {
            console.error(`Error getting availability for ${destination}:`, error.message);
            throw error;
        }
    }

    /**
     * Book dates in the calendar
     * @param {object} bookingData - Booking information
     */
    async bookDates(bookingData) {
        const {
            destination,
            startDate,
            certificateNumber,
            customerName,
            numberOfNights = 4
        } = bookingData;

        try {
            // 1. Find the row for this date
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${destination}!A2:F1000`,
            });

            const rows = response.data.values || [];
            let targetRowIndex = -1;

            for (let i = 0; i < rows.length; i++) {
                if (rows[i][0] === startDate) {
                    targetRowIndex = i + 2; // +2 because sheet rows are 1-indexed and we start at row 2
                    break;
                }
            }

            if (targetRowIndex === -1) {
                throw new Error(`Date ${startDate} not found in ${destination} calendar`);
            }

            // 2. Check if date is available
            const currentRow = rows[targetRowIndex - 2];
            const slotsAvailable = parseInt(currentRow[2] || '0');
            const slotsBooked = parseInt(currentRow[3] || '0');

            if (slotsAvailable <= 0) {
                throw new Error(`No slots available for ${startDate}`);
            }

            // 3. Update the row (decrement available, increment booked)
            const newSlotsAvailable = slotsAvailable - 1;
            const newSlotsBooked = slotsBooked + 1;

            // Update columns C (slots available) and D (slots booked)
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${destination}!C${targetRowIndex}:D${targetRowIndex}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[newSlotsAvailable, newSlotsBooked]]
                }
            });

            // 4. Add booking to a separate "Bookings" log sheet
            await this.logBooking({
                destination,
                date: startDate,
                certificateNumber,
                customerName,
                numberOfNights,
                timestamp: new Date().toISOString()
            });

            // 5. If fully booked, update status
            if (newSlotsAvailable === 0) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${destination}!B${targetRowIndex}`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [['Fully Booked']]
                    }
                });
            }

            return {
                success: true,
                destination,
                startDate,
                slotsRemaining: newSlotsAvailable,
                confirmationNumber: `CB${Date.now()}`
            };

        } catch (error) {
            console.error('Error booking dates:', error.message);
            throw error;
        }
    }

    /**
     * Log booking to "Bookings" sheet
     */
    async logBooking(bookingData) {
        try {
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Bookings!A:G', // Assuming columns: Timestamp, Destination, Date, Certificate, Customer, Nights, Status
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [[
                        bookingData.timestamp,
                        bookingData.destination,
                        bookingData.date,
                        bookingData.certificateNumber,
                        bookingData.customerName,
                        bookingData.numberOfNights,
                        'Confirmed'
                    ]]
                }
            });

            console.log(`✅ Booking logged: ${bookingData.certificateNumber} - ${bookingData.destination} ${bookingData.date}`);

        } catch (error) {
            console.error('Error logging booking:', error.message);
            // Don't throw - booking was successful even if logging failed
        }
    }

    /**
     * Cancel a booking
     * @param {object} cancelData - Cancellation information
     */
    async cancelBooking(cancelData) {
        const { destination, startDate, certificateNumber } = cancelData;

        try {
            // 1. Find and update the main calendar
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${destination}!A2:F1000`,
            });

            const rows = response.data.values || [];
            let targetRowIndex = -1;

            for (let i = 0; i < rows.length; i++) {
                if (rows[i][0] === startDate) {
                    targetRowIndex = i + 2;
                    break;
                }
            }

            if (targetRowIndex === -1) {
                throw new Error('Booking not found');
            }

            // 2. Increment available, decrement booked
            const currentRow = rows[targetRowIndex - 2];
            const slotsAvailable = parseInt(currentRow[2] || '0');
            const slotsBooked = parseInt(currentRow[3] || '0');

            if (slotsBooked <= 0) {
                throw new Error('No bookings to cancel for this date');
            }

            const newSlotsAvailable = slotsAvailable + 1;
            const newSlotsBooked = slotsBooked - 1;

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${destination}!C${targetRowIndex}:D${targetRowIndex}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[newSlotsAvailable, newSlotsBooked]]
                }
            });

            // 3. Update status if now available
            if (newSlotsAvailable > 0) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${destination}!B${targetRowIndex}`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [['Available']]
                    }
                });
            }

            // 4. Update booking log
            await this.logCancellation({
                destination,
                date: startDate,
                certificateNumber,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                message: 'Booking cancelled successfully'
            };

        } catch (error) {
            console.error('Error cancelling booking:', error.message);
            throw error;
        }
    }

    /**
     * Log cancellation
     */
    async logCancellation(cancelData) {
        try {
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Bookings!A:G',
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [[
                        cancelData.timestamp,
                        cancelData.destination,
                        cancelData.date,
                        cancelData.certificateNumber,
                        '',
                        '',
                        'Cancelled'
                    ]]
                }
            });
        } catch (error) {
            console.error('Error logging cancellation:', error.message);
        }
    }

    /**
     * Get all bookings for a certificate
     */
    async getBookingsForCertificate(certificateNumber) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Bookings!A:G',
            });

            const rows = response.data.values || [];

            const bookings = rows
                .slice(1) // Skip header
                .filter(row => row[3] === certificateNumber && row[6] === 'Confirmed')
                .map(row => ({
                    timestamp: row[0],
                    destination: row[1],
                    date: row[2],
                    certificateNumber: row[3],
                    customerName: row[4],
                    numberOfNights: parseInt(row[5] || '0'),
                    status: row[6]
                }));

            return bookings;

        } catch (error) {
            console.error('Error getting bookings:', error.message);
            throw error;
        }
    }
}

// =============================================================================
// SETUP HELPER - Create Initial Sheet Structure
// =============================================================================

async function setupCalendarSheets(destinations = ['Orlando', 'Las Vegas', 'Hawaii']) {
    const calendar = new GoogleSheetsCalendar();
    await calendar.initialize();

    console.log('Setting up calendar sheets...');

    for (const destination of destinations) {
        try {
            // Create header row
            await calendar.sheets.spreadsheets.values.update({
                spreadsheetId: calendar.spreadsheetId,
                range: `${destination}!A1:F1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[
                        'Date',
                        'Status',
                        'Slots Available',
                        'Slots Booked',
                        'Hotel',
                        'Notes'
                    ]]
                }
            });

            // Add sample dates (next 90 days)
            const dates = [];
            const today = new Date();

            for (let i = 0; i < 90; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);

                dates.push([
                    date.toISOString().split('T')[0],
                    'Available',
                    10, // 10 slots available
                    0,  // 0 booked
                    'Marriott ' + destination,
                    ''
                ]);
            }

            await calendar.sheets.spreadsheets.values.update({
                spreadsheetId: calendar.spreadsheetId,
                range: `${destination}!A2:F91`,
                valueInputOption: 'RAW',
                resource: {
                    values: dates
                }
            });

            console.log(`✅ Setup complete for ${destination}`);

        } catch (error) {
            console.error(`Error setting up ${destination}:`, error.message);
        }
    }

    // Create Bookings log sheet
    try {
        await calendar.sheets.spreadsheets.values.update({
            spreadsheetId: calendar.spreadsheetId,
            range: 'Bookings!A1:G1',
            valueInputOption: 'RAW',
            resource: {
                values: [[
                    'Timestamp',
                    'Destination',
                    'Date',
                    'Certificate Number',
                    'Customer Name',
                    'Number of Nights',
                    'Status'
                ]]
            }
        });

        console.log('✅ Bookings log sheet created');

    } catch (error) {
        console.error('Error creating Bookings sheet:', error.message);
    }

    console.log('\n✅ Calendar setup complete!');
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    GoogleSheetsCalendar,
    setupCalendarSheets
};

// If run directly, setup sheets
if (require.main === module) {
    setupCalendarSheets()
        .then(() => {
            console.log('Done!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Setup failed:', error);
            process.exit(1);
        });
}
