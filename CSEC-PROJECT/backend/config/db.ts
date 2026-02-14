import mongoose from 'mongoose';

/**
 * Seed admin user for in-memory MongoDB
 */
const seedAdminUser = async (): Promise<void> => {
    try {
        // Dynamically import User model to avoid circular dependencies
        const User = (await import('../models/User')).default;
        
        const adminEmail = 'admin@astu.edu.et';
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (!existingAdmin) {
            // Don't hash password here - let the User model's pre-save hook handle it
            await User.create({
                name: 'Admin User',
                email: adminEmail,
                universityId: 'ugr/00000/00',
                password: '12345678', // Plain text - will be hashed by pre-save hook
                role: 'admin'
            });
            console.log('👤 Admin user seeded (admin@astu.edu.et / 12345678)');
        }
    } catch (error) {
        console.error('Failed to seed admin user:', error);
    }
};

/**
 * Seed sample documents for initial testing
 */
const seedSampleDocuments = async (): Promise<void> => {
    try {
        const Document = (await import('../models/Document')).default;
        const User = (await import('../models/User')).default;

        const count = await Document.countDocuments();
        if (count === 0) {
            const admin = await User.findOne({ role: 'admin' });
            if (!admin) return;

            const sampleDocs = [
                {
                    title: 'Student ID Replacement Procedure',
                    content: `Office Name: Registrar Office (Admin Building, G+1)

Required Documents:
- Police report for lost ID
- Copy of your clearance form
- Student information form
- One passport-sized photo

Step-by-Step Process:
1. File a police report at the local police station for the lost ID
2. Visit the Registrar office with all required documents
3. Fill out the ID replacement request form
4. Pay the replacement fee (50 ETB) at the Finance Office
5. Return the receipt to the Registrar office
6. Collect your new ID card after 2-3 business days

Estimated Time: 2-3 business days

Office Hours: Monday-Friday, 8:30 AM - 5:30 PM

Notes/Warnings:
- The replacement fee is non-refundable
- You must bring the police report within 7 days of filing
- Temporary ID can be issued for urgent cases`,
                    category: 'id_services',
                    source: 'procedure',
                    uploadedBy: admin._id,
                    isPublic: true,
                    status: 'indexed',
                    tags: ['id', 'replacement', 'registrar', 'lost id', 'student card']
                },
                {
                    title: 'Clearance Process for Graduating Students',
                    content: `Office Name: Multiple offices (Library, Finance, Department, Dormitory, Registrar)

Required Documents:
- Clearance form (obtain from Registrar)
- Student ID card
- Library card
- Dormitory key (if applicable)

Step-by-Step Process:
1. Obtain clearance form from the Registrar office
2. Visit Library - return all borrowed books and clear any fines
3. Visit Finance Office - settle all outstanding fees
4. Visit your Department - submit final project and get signatures
5. Visit Dormitory Office - return keys and clear room inspection
6. Return completed form to Registrar by end of June
7. Receive graduation clearance certificate

Estimated Time: 1-2 weeks (depending on pending obligations)

Office Hours: Monday-Friday, 8:30 AM - 5:30 PM

Notes/Warnings:
- Start clearance process at least 2 weeks before graduation
- Library fines must be paid before clearance
- Missing the deadline will delay your graduation certificate
- Keep copies of all clearance signatures`,
                    category: 'clearance',
                    source: 'policy',
                    uploadedBy: admin._id,
                    isPublic: true,
                    status: 'indexed',
                    tags: ['clearance', 'graduation', 'registrar', 'library', 'finance']
                },
                {
                    title: 'Dormitory Room Assignment and Rules',
                    content: `Office Name: Dormitory Administration (Main Campus, Student Services)

Required Documents for Room Assignment:
- Student ID card
- Admission letter or registration confirmation
- Health clearance certificate
- Dormitory fee payment receipt

Step-by-Step Process:
1. Pay dormitory fees at the Finance Office
2. Visit Dormitory Administration with receipt
3. Receive room assignment and key
4. Complete room inspection form
5. Sign dormitory rules agreement

Dormitory Rules:
- Quiet hours: 10:00 PM - 6:00 AM
- No visitors in rooms after 9:00 PM
- Keep room clean and organized
- No cooking in rooms
- Report maintenance issues immediately
- Smoking and alcohol prohibited

Estimated Time: Same day (if fees are paid)

Office Hours: Monday-Friday, 8:00 AM - 5:00 PM; Saturday, 9:00 AM - 12:00 PM; Emergency contact: 24/7

Notes/Warnings:
- Room assignments are non-transferable without approval
- Lost keys incur a 200 ETB replacement fee
- Damage to property will be charged to the student
- Violations may result in dormitory privileges being revoked`,
                    category: 'dormitory',
                    source: 'policy',
                    uploadedBy: admin._id,
                    isPublic: true,
                    status: 'indexed',
                    tags: ['dormitory', 'housing', 'room assignment', 'student residence']
                },
                {
                    title: 'Course Registration and Add/Drop Procedure',
                    content: `Office Name: Registrar Office / Academic Advising

Required Documents:
- Student ID card
- Academic transcript
- Advisor approval (for add/drop)

Step-by-Step Process for Registration:
1. Meet with academic advisor to plan course schedule
2. Register online through student portal during registration period
3. Print registration confirmation
4. Pay tuition fees at Finance Office
5. Confirm registration with Registrar

Add/Drop Period:
- First 2 weeks of semester for adding courses
- First 4 weeks for dropping courses without penalty

Estimated Time: 1-3 days during registration period

Office Hours: Monday-Friday, 8:30 AM - 5:30 PM

Notes/Warnings:
- Late registration incurs additional fees
- Dropping courses after deadline results in 'W' grade
- Must maintain minimum credit hours for full-time status
- Course overload requires dean approval`,
                    category: 'academics',
                    source: 'procedure',
                    uploadedBy: admin._id,
                    isPublic: true,
                    status: 'indexed',
                    tags: ['registration', 'courses', 'add drop', 'academic', 'enrollment']
                },
                {
                    title: 'Transcript Request Procedure',
                    content: `Office Name: Registrar Office (Admin Building, G+1)

Required Documents:
- Written request letter
- Student ID card
- Clearance certificate (for graduated students)
- Payment receipt

Step-by-Step Process:
1. Write a formal request letter stating the purpose
2. Pay transcript fee at Finance Office (50 ETB per copy)
3. Submit request letter and receipt to Registrar
4. Provide recipient address if mailing is required
5. Collect transcript after 5-7 business days

Types of Transcripts:
- Official sealed transcript: 50 ETB
- Unofficial copy: 20 ETB
- Electronic transcript: 30 ETB

Estimated Time: 5-7 business days (rush service available for additional fee)

Office Hours: Monday-Friday, 8:30 AM - 5:30 PM

Notes/Warnings:
- Transcripts show all attempted courses and grades
- Official transcripts are sealed and cannot be opened
- International mailing requires additional fees
- Students with financial holds cannot request transcripts`,
                    category: 'registrar',
                    source: 'procedure',
                    uploadedBy: admin._id,
                    isPublic: true,
                    status: 'indexed',
                    tags: ['transcript', 'registrar', 'academic records', 'grades']
                },
                {
                    title: 'Financial Aid and Scholarship Information',
                    content: `Office Name: Finance Office and Student Affairs

Available Financial Aid:
- Merit-based scholarships
- Need-based grants
- Work-study programs
- Emergency student loans

Required Documents:
- Financial aid application form
- Academic transcripts
- Family income documentation
- Student ID card

Step-by-Step Application Process:
1. Obtain application form from Finance Office
2. Complete form with all required information
3. Attach supporting documents (transcripts, income proof)
4. Submit to Finance Office before deadline
5. Attend interview if required
6. Receive notification within 4 weeks

Scholarship Criteria:
- Minimum GPA of 3.0 for merit scholarships
- Financial need documentation for grants
- Maintain good academic standing
- No disciplinary violations

Estimated Time: 4-6 weeks for processing

Office Hours: Monday-Friday, 9:00 AM - 4:00 PM

Notes/Warnings:
- Application deadline is typically in July for fall semester
- Scholarships must be renewed annually
- Work-study positions are limited
- Aid may be reduced or revoked for poor academic performance`,
                    category: 'finance',
                    source: 'policy',
                    uploadedBy: admin._id,
                    isPublic: true,
                    status: 'indexed',
                    tags: ['financial aid', 'scholarship', 'grants', 'student loan', 'finance']
                },
                {
                    title: 'University Security and Emergency Contacts',
                    content: `Office Name: University Security (Gate 1 & Gate 2)

Emergency Contacts:
- Security Emergency: Call Gate 1 or Gate 2 (24/7)
- Medical Emergency: University Clinic
- Fire Emergency: Campus Fire Safety
- Police: Local police station

Security Services:
- 24/7 campus patrol
- Lost and found
- Incident reporting
- Escort service (after dark)
- Access control

How to Report an Incident:
1. Call security immediately for emergencies
2. Visit security office for non-emergencies
3. Fill out incident report form
4. Provide detailed information and witnesses
5. Follow up for case updates

Campus Safety Tips:
- Always carry your student ID
- Use designated walkways at night
- Report suspicious activity immediately
- Don't share access codes or keys
- Keep valuables secured

Office Hours: 24/7

Notes/Warnings:
- Emergency numbers should be saved in your phone
- Report all incidents even if they seem minor
- Security escort available after 8:00 PM
- Parking violations will be ticketed`,
                    category: 'safety',
                    source: 'procedure',
                    uploadedBy: admin._id,
                    isPublic: true,
                    status: 'indexed',
                    tags: ['security', 'emergency', 'safety', 'police', 'lost and found']
                }
            ];

            await Document.create(sampleDocs);
            console.log('📄 Sample documents seeded');
        }
    } catch (error) {
        console.error('Failed to seed sample documents:', error);
    }
};

/**
 * Connect to MongoDB Atlas database.
 */
const connectDB = async (): Promise<void> => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required');
    }

    console.log('🔌 Connecting to MongoDB Atlas...');
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.name}`);
    } catch (err: any) {
        console.error('❌ MongoDB Atlas connection failed:', err.message || err);

        // In development, use in-memory MongoDB as fallback
        if (process.env.NODE_ENV === 'development') {
            try {
                console.log('\n🔄 Using in-memory MongoDB for development...');
                const { MongoMemoryServer } = require('mongodb-memory-server');
                const mongod = await MongoMemoryServer.create();
                const uri = mongod.getUri();
                const conn = await mongoose.connect(uri);
                console.log('✅ In-memory MongoDB connected');
                console.log(`📦 Database: ${conn.connection.name}`);
                console.log('⚠️  Data will be lost on server restart\n');
                
                // Seed admin and data
                await seedAdminUser();
                await seedSampleDocuments();
                return;
            } catch (memErr: any) {
                console.error('❌ In-memory MongoDB fallback failed:', memErr.message || memErr);
            }
        }

        console.error('\n⚠️  Connection troubleshooting:');
        console.error('1. Whitelist your IP in MongoDB Atlas → Network Access → Add IP Address');
        console.error('2. Verify MONGODB_URI in backend/.env has correct credentials');
        console.error('3. Check if you can access MongoDB Atlas from your network');
        console.error('4. Try adding your IP or use 0.0.0.0/0 (allow all) for testing\n');
        throw err;
    }

    mongoose.connection.on('error', (err: Error) => {
        console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
    });
};

export default connectDB;
