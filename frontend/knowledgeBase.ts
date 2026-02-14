
import { AdministrativeProcess } from './types';

export const ASTU_KNOWLEDGE_BASE: AdministrativeProcess[] = [
  {
    id: 'id-replacement',
    title: 'Lost Student ID Card Replacement',
    office: 'Registrar Office & Campus Security',
    documents: [
      'Police Report from Adama City Police Station',
      'Bank Receipt of 100 ETB (Payment for replacement)',
      'Passport-sized photograph (2 copies)',
      'Application letter to the Registrar'
    ],
    steps: [
      'Go to the Adama City Police Station to report the loss and get a police report.',
      'Pay the ID replacement fee (100 ETB) at the Commercial Bank of Ethiopia (CBE) using the university account number.',
      'Submit the police report and bank receipt to the University Security Office for verification.',
      'Go to the Registrar Office with your verification and new photos to process the new card.'
    ],
    estimatedTime: '3-5 working days',
    notes: 'Keep the police report safely as it serves as a temporary identification within campus.'
  },
  {
    id: 'graduation-clearance',
    title: 'Graduation Clearance Process',
    office: 'Registrar, Library, Sports, Dormitory, and Finance',
    documents: [
      'Official Clearance Form (available at the Registrar)',
      'Student ID Card (to be returned)',
      'Library Clearance Slip',
      'Departmental Clearance Slip'
    ],
    steps: [
      'Collect the clearance form from the Registrar Office.',
      'Visit your Department to get clearance for equipment and academic records.',
      'Visit the Library to ensure no books are overdue.',
      'Go to the Dormitory Administration to return keys and check for damages.',
      'Visit the Sports Office for sports gear clearance.',
      'Finalize the process at the Finance Office to settle any outstanding payments.',
      'Submit the completed form to the Registrar Office.'
    ],
    estimatedTime: '1-2 weeks',
    notes: 'Clearance should be started at least two weeks before the final graduation date.'
  },
  {
    id: 'dorm-key',
    title: 'Broken or Lost Dormitory Key',
    office: 'Dormitory Administration (Proctors Office)',
    documents: [
      'Student ID Card',
      'Application Form for key replacement'
    ],
    steps: [
      'Inform your block proctor immediately about the broken or lost key.',
      'Fill out the key replacement application form.',
      'Pay the replacement fee (usually 50 ETB) at the finance window in the administration building.',
      'Bring the receipt to the proctor to receive a new key or have the lock serviced.'
    ],
    estimatedTime: 'Same day or next day',
    notes: 'If the lock is damaged, a maintenance worker will be dispatched.'
  },
  {
    id: 'withdrawal',
    title: 'Semester Withdrawal (Dropping Out Temporarily)',
    office: 'Registrar Office & Academic Dean',
    documents: [
      'Withdrawal Form',
      'Clearance Form (Temporary)',
      'Formal letter explaining the reason for withdrawal (Medical/Personal)'
    ],
    steps: [
      'Write a formal letter to your Academic Dean explaining your situation.',
      'If medical, attach a valid medical certificate from the University Clinic or a recognized hospital.',
      'Obtain a withdrawal form from the Registrar.',
      'Complete a temporary clearance process for the current semester.',
      'Submit the withdrawal form and clearance to the Registrar for approval.'
    ],
    estimatedTime: '3-7 working days',
    notes: 'Students must re-apply for admission within the specified timeframe stated on the withdrawal approval.'
  },
  {
    id: 'recommendation-letter',
    title: 'Requesting a Recommendation Letter',
    office: 'Department Office',
    documents: [
      'Copy of Student ID',
      'Academic Transcript (Unofficial is usually fine)',
      'Brief Resume or Statement of Purpose'
    ],
    steps: [
      'Identify the professor or department head you wish to request the letter from.',
      'Submit your documents along with a formal request via email or in-person.',
      'Wait for the department to verify your academic performance.',
      'Collect the signed and sealed letter from the Department Secretary.'
    ],
    estimatedTime: '3-5 working days',
    notes: 'Always request recommendation letters at least two weeks before your deadline.'
  }
];
