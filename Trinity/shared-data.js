/* ============================================================
   VERIFI — shared-data.js
   Mock data shared across every page: trucks, units, components.
   Included via <script src> in index.html and every standalone page file.
   This file declares globals — no module wrapping. Order matters:
     truckGroups → trucks (derived) → UNLINKED_TRUCKS → UNITS_DATA →
     MC_CARD_DEFS → CC_TRUCKS
   ============================================================ */

/* ── DATA ───────────────────────────────────────── */
const truckGroups = [
  {
    account: 'Cemex AZ',
    label: 'Phoenix Central',
    uptime: '94.3%',
    attention: 4,
    open: true,
    trucks: [
      { num:'45689', ver:'v5.01.008', ign:'On',  ignDetail:'6 hr',   source:'Customer Ticket', plant:'Phoenix Central', impact:'Not Managing',  issue:'Water System', account:'Cemex AZ', age:'3 min',  conn:'live',  err:1, wrn:0,  unitId:'UID-45689', readyMaint:'No',  truckMode:'Active',   lastConn:'1:16 PM 07/23/25' },
      { num:'12457', ver:'v5.01.008', ign:'On',  ignDetail:'5 hr',   source:'Customer Ticket', plant:'Phoenix Central', swCompliant:false, impact:'Not Measuring', issue:'Water System', account:'Cemex AZ', age:'15 min', conn:'none',  err:2, wrn:10, unitId:'UID-12457', readyMaint:'No',  truckMode:'Active',   lastConn:'12:44 PM 07/23/25' },
      { num:'39821', ver:'v5.01.008', ign:'On',  ignDetail:'3 hr',   source:'Customer Ticket', plant:'Phoenix Central', impact:'Verify Down',   issue:'Drum RPM',     account:'Cemex AZ', age:'8 hrs',  conn:'live',  err:0, wrn:10, unitId:'UID-39821', readyMaint:'Yes', truckMode:'Active',   lastConn:'9:02 AM 07/23/25' },
      { num:'53127', ver:'Pulse-1.2.3', ign:'On',  ignDetail:'1 hr',   source:'Customer Ticket', plant:'Phoenix Central', impact:'Not Measuring', issue:'Water System', account:'Cemex AZ', age:'2 days', conn:'live',  err:1, wrn:0,  unitId:'UID-53127', readyMaint:'No',  truckMode:'Standby',  lastConn:'8:30 AM 07/21/25' },
      { num:'61042', ver:'Spark-2.0.1', ign:'Off', ignDetail:'2 hr',   source:'Customer Ticket', plant:'Phoenix Central', swCompliant:false, impact:'None',         issue:'',             account:'Cemex AZ', age:'4 hrs',  conn:'live',  err:0, wrn:0,  unitId:'UID-61042', readyMaint:'Yes', truckMode:'Standby',  lastConn:'10:15 AM 07/23/25' },
      { num:'77391', ver:'v5.01.008', ign:'Off', ignDetail:'8 hr',   source:'Customer Ticket', plant:'Phoenix Central', impact:'None',         issue:'',             account:'Cemex AZ', age:'1 day',  conn:'live',  err:0, wrn:0,  unitId:'UID-77391', readyMaint:'No',  truckMode:'Inactive', lastConn:'2:00 PM 07/22/25' },
    ]
  },
  {
    account: 'Cemex AZ',
    label: 'Mesa South',
    uptime: '96.3%',
    attention: 4,
    open: true,
    trucks: [
      { num:'67234', ver:'v5.01.008', ign:'Off', ignDetail:'3 hrs',  source:'Customer Ticket', plant:'Mesa South', swCompliant:false, impact:'At Risk',       issue:'Water System', account:'Cemex AZ', age:'15 min', conn:'live',  err:0, wrn:10, unitId:'UID-67234', readyMaint:'No',  truckMode:'Standby',  lastConn:'1:00 PM 07/23/25' },
      { num:'84760', ver:'v5.01.008', ign:'Off', ignDetail:'1 hr',   source:'System Alert',    plant:'Mesa South', impact:'Not Measuring', issue:'Hydraulic',    account:'Cemex AZ', age:'4 hrs',  conn:'live',  err:2, wrn:10, unitId:'UID-84760', readyMaint:'No',  truckMode:'Active',   lastConn:'9:45 AM 07/23/25' },
      { num:'98214', ver:'Spark-2.0.1', ign:'Off', ignDetail:'30 min', source:'System Alert',    plant:'Mesa South', impact:'At Risk',       issue:'Hydraulic',    account:'Cemex AZ', age:'1 day',  conn:'none',  err:1, wrn:0,  unitId:'UID-98214', readyMaint:'Yes', truckMode:'Standby',  lastConn:'1:30 PM 07/22/25' },
      { num:'21348', ver:'v5.01.008', ign:'On',  ignDetail:'1 hr',   source:'System Alert',    plant:'Mesa South', impact:'Not Measuring', issue:'Hydraulic',    account:'Cemex AZ', age:'2 days', conn:'live',  err:2, wrn:10, unitId:'UID-21348', readyMaint:'No',  truckMode:'Active',   lastConn:'8:00 AM 07/21/25' },
      { num:'33501', ver:'Pulse-1.2.3', ign:'On',  ignDetail:'2 hr',   source:'Customer Ticket', plant:'Mesa South', impact:'None',         issue:'',             account:'Cemex AZ', age:'5 min',  conn:'live',  err:0, wrn:0,  unitId:'UID-33501', readyMaint:'No',  truckMode:'Active',   lastConn:'1:10 PM 07/23/25' },
      { num:'44892', ver:'v5.01.008', ign:'Off', ignDetail:'4 hr',   source:'Customer Ticket', plant:'Mesa South', impact:'None',         issue:'',             account:'Cemex AZ', age:'6 hrs',  conn:'live',  err:0, wrn:0,  unitId:'UID-44892', readyMaint:'Yes', truckMode:'Inactive', lastConn:'7:45 AM 07/23/25' },
    ]
  },
  {
    account: 'Cemex AZ',
    label: 'Tempe East',
    uptime: '91.7%',
    attention: 3,
    open: true,
    trucks: [
      { num:'55120', ver:'v5.01.008', ign:'On',  ignDetail:'1 hr',   source:'Customer Ticket', plant:'Tempe East', impact:'Not Managing',  issue:'Drum RPM',     account:'Cemex AZ', age:'10 min', conn:'live',  err:3, wrn:5,  unitId:'UID-55120', readyMaint:'No',  truckMode:'Active',   lastConn:'1:05 PM 07/23/25' },
      { num:'66783', ver:'v5.01.008', ign:'On',  ignDetail:'3 hr',   source:'System Alert',    plant:'Tempe East', impact:'At Risk',       issue:'Water System', account:'Cemex AZ', age:'30 min', conn:'live',  err:1, wrn:8,  unitId:'UID-66783', readyMaint:'No',  truckMode:'Active',   lastConn:'12:45 PM 07/23/25' },
      { num:'72914', ver:'Pulse-1.2.3', ign:'Off', ignDetail:'6 hr',   source:'Customer Ticket', plant:'Tempe East', impact:'None',         issue:'',             account:'Cemex AZ', age:'2 hrs',  conn:'live',  err:0, wrn:0,  unitId:'UID-72914', readyMaint:'Yes', truckMode:'Standby',  lastConn:'11:00 AM 07/23/25' },
      { num:'81056', ver:'Spark-2.0.1', ign:'Off', ignDetail:'2 hr',   source:'Customer Ticket', plant:'Tempe East', impact:'None',         issue:'',             account:'Cemex AZ', age:'3 hrs',  conn:'none',  err:0, wrn:0,  unitId:'UID-81056', readyMaint:'No',  truckMode:'Inactive', lastConn:'10:30 AM 07/23/25' },
      { num:'90237', ver:'v5.01.008', ign:'On',  ignDetail:'30 min', source:'System Alert',    plant:'Tempe East', impact:'Verify Down',  issue:'Hydraulic',    account:'Cemex AZ', age:'1 hr',   conn:'live',  err:2, wrn:3,  unitId:'UID-90237', readyMaint:'No',  truckMode:'Active',   lastConn:'12:15 PM 07/23/25' },
    ]
  },
  {
    account: 'Vulcan AZ',
    label: 'Scottsdale North',
    uptime: '88.4%',
    attention: 3,
    open: true,
    trucks: [
      { num:'30471', ver:'v5.01.008', ign:'On',  ignDetail:'2 hr',   source:'System Alert',    plant:'Scottsdale North', impact:'Not Measuring', issue:'Drum RPM',     account:'Vulcan AZ', age:'22 min', conn:'live',  err:2, wrn:6,  unitId:'UID-30471', readyMaint:'No',  truckMode:'Active',   lastConn:'1:10 PM 07/23/25' },
      { num:'41852', ver:'v5.01.008', ign:'On',  ignDetail:'4 hr',   source:'Customer Ticket', plant:'Scottsdale North', impact:'At Risk',       issue:'Water System', account:'Vulcan AZ', age:'1 hr',   conn:'live',  err:0, wrn:8,  unitId:'UID-41852', readyMaint:'No',  truckMode:'Active',   lastConn:'12:30 PM 07/23/25' },
      { num:'52963', ver:'Spark-2.0.1', ign:'Off', ignDetail:'1 hr',   source:'System Alert',    plant:'Scottsdale North', impact:'Verify Down',   issue:'Hydraulic',    account:'Vulcan AZ', age:'3 hrs',  conn:'none',  err:1, wrn:0,  unitId:'UID-52963', readyMaint:'Yes', truckMode:'Standby',  lastConn:'10:45 AM 07/23/25' },
      { num:'64074', ver:'Pulse-1.2.3', ign:'On',  ignDetail:'30 min', source:'Customer Ticket', plant:'Scottsdale North', impact:'None',         issue:'',             account:'Vulcan AZ', age:'5 min',  conn:'live',  err:0, wrn:0,  unitId:'UID-64074', readyMaint:'No',  truckMode:'Active',   lastConn:'1:25 PM 07/23/25' },
    ]
  },
  {
    account: 'Vulcan AZ',
    label: 'Gilbert East',
    uptime: '97.1%',
    attention: 0,
    open: true,
    trucks: [
      { num:'75185', ver:'v5.01.008', ign:'On',  ignDetail:'3 hr',   source:'Customer Ticket', plant:'Gilbert East', impact:'None', issue:'', account:'Vulcan AZ', age:'10 min', conn:'live', err:0, wrn:0, unitId:'UID-75185', readyMaint:'No',  truckMode:'Active',  lastConn:'1:20 PM 07/23/25' },
      { num:'86296', ver:'v5.01.008', ign:'Off', ignDetail:'2 hr',   source:'Customer Ticket', plant:'Gilbert East', impact:'None', issue:'', account:'Vulcan AZ', age:'2 hrs',  conn:'live', err:0, wrn:0, unitId:'UID-86296', readyMaint:'Yes', truckMode:'Standby', lastConn:'11:30 AM 07/23/25' },
      { num:'97307', ver:'v5.01.008', ign:'On',  ignDetail:'1 hr',   source:'System Alert',    plant:'Gilbert East', impact:'At Risk', issue:'CAN Bus', account:'Vulcan AZ', age:'1 hr',  conn:'live', err:1, wrn:4, unitId:'UID-97307', readyMaint:'No',  truckMode:'Active',  lastConn:'1:15 PM 07/23/25' },
      { num:'10841', ver:'Pulse-1.2.3', ign:'On',  ignDetail:'45 min', source:'System Alert',    plant:'Gilbert East', impact:'None', issue:'', account:'Vulcan AZ', age:'45 min', conn:'live', err:0, wrn:2, unitId:'UID-10841', readyMaint:'No',  truckMode:'Active',  lastConn:'1:22 PM 07/23/25' },
      { num:'21952', ver:'Spark-2.0.1', ign:'Off', ignDetail:'4 hr',   source:'Customer Ticket', plant:'Gilbert East', impact:'None', issue:'', account:'Vulcan AZ', age:'4 hrs',  conn:'none', err:0, wrn:0, unitId:'UID-21952', readyMaint:'Yes', truckMode:'Standby', lastConn:'9:30 AM 07/23/25' },
    ]
  },
  {
    account: 'Vulcan AZ',
    label: 'Mesa Gateway',
    uptime: '93.2%',
    open: true,
    trucks: [
      { num:'32063', ver:'v5.01.008', ign:'On',  ignDetail:'2 hr',   source:'System Alert',    plant:'Mesa Gateway', impact:'Not Measuring', issue:'Water Sensor', account:'Vulcan AZ', age:'2 hrs',  conn:'live', err:2, wrn:5, unitId:'UID-32063', readyMaint:'No',  truckMode:'Active',  lastConn:'1:18 PM 07/23/25' },
      { num:'43174', ver:'v5.01.008', ign:'On',  ignDetail:'3 hr',   source:'Customer Ticket', plant:'Mesa Gateway', impact:'At Risk',       issue:'Drum RPM',    account:'Vulcan AZ', age:'3 hrs',  conn:'live', err:0, wrn:8, unitId:'UID-43174', readyMaint:'No',  truckMode:'Active',  lastConn:'1:05 PM 07/23/25' },
      { num:'54285', ver:'v5.01.008', ign:'Off', ignDetail:'1 hr',   source:'System Alert',    plant:'Mesa Gateway', impact:'None',         issue:'',            account:'Vulcan AZ', age:'1 hr',   conn:'live', err:0, wrn:0, unitId:'UID-54285', readyMaint:'Yes', truckMode:'Standby', lastConn:'12:15 PM 07/23/25' },
      { num:'65396', ver:'Pulse-1.2.3', ign:'On',  ignDetail:'30 min', source:'Customer Ticket', plant:'Mesa Gateway', impact:'None',         issue:'',            account:'Vulcan AZ', age:'30 min', conn:'live', err:0, wrn:0, unitId:'UID-65396', readyMaint:'No',  truckMode:'Active',  lastConn:'1:25 PM 07/23/25' },
      { num:'76407', ver:'Spark-2.0.1', ign:'On',  ignDetail:'5 hr',   source:'System Alert',    plant:'Mesa Gateway', impact:'Verify Down',   issue:'Hydraulic',   account:'Vulcan AZ', age:'5 hrs',  conn:'none', err:1, wrn:0, unitId:'UID-76407', readyMaint:'No',  truckMode:'Active',  lastConn:'8:30 AM 07/23/25' },
      { num:'87518', ver:'v5.01.008', ign:'Off', ignDetail:'6 hr',   source:'Customer Ticket', plant:'Mesa Gateway', impact:'None',         issue:'',            account:'Vulcan AZ', age:'6 hrs',  conn:'none', err:0, wrn:0, unitId:'UID-87518', readyMaint:'Yes', truckMode:'Standby', lastConn:'7:45 AM 07/23/25' },
    ]
  },
  {
    account: 'Cemex AZ',
    label: 'Chandler West',
    uptime: '95.8%',
    open: true,
    trucks: [
      { num:'11223', ver:'v5.01.008', ign:'On',  ignDetail:'1 hr',   source:'System Alert',    plant:'Chandler West', impact:'At Risk',       issue:'Bus Power',   account:'Cemex AZ', age:'1 hr',   conn:'live', err:3, wrn:7, unitId:'UID-11223', readyMaint:'No',  truckMode:'Active',  lastConn:'1:24 PM 07/23/25' },
      { num:'22334', ver:'Pulse-1.2.3', ign:'On',  ignDetail:'2 hr',   source:'Customer Ticket', plant:'Chandler West', impact:'Not Measuring', issue:'CPS Sensor',  account:'Cemex AZ', age:'2 hrs',  conn:'live', err:1, wrn:5, unitId:'UID-22334', readyMaint:'No',  truckMode:'Active',  lastConn:'1:10 PM 07/23/25' },
      { num:'33445', ver:'v5.01.008', ign:'Off', ignDetail:'3 hr',   source:'System Alert',    plant:'Chandler West', impact:'None',         issue:'',            account:'Cemex AZ', age:'3 hrs',  conn:'live', err:0, wrn:0, unitId:'UID-33445', readyMaint:'Yes', truckMode:'Standby', lastConn:'10:30 AM 07/23/25' },
      { num:'44556', ver:'v5.01.008', ign:'On',  ignDetail:'20 min', source:'Customer Ticket', plant:'Chandler West', impact:'None',         issue:'',            account:'Cemex AZ', age:'20 min', conn:'live', err:0, wrn:1, unitId:'UID-44556', readyMaint:'No',  truckMode:'Active',  lastConn:'1:26 PM 07/23/25' },
      { num:'55667', ver:'v5.01.008', ign:'On',  ignDetail:'4 hr',   source:'System Alert',    plant:'Chandler West', impact:'Verify Down',   issue:'WDS',         account:'Cemex AZ', age:'4 hrs',  conn:'live', err:2, wrn:3, unitId:'UID-55667', readyMaint:'No',  truckMode:'Active',  lastConn:'9:45 AM 07/23/25' },
      { num:'66778', ver:'Spark-2.0.1', ign:'Off', ignDetail:'2 hr',   source:'Customer Ticket', plant:'Chandler West', impact:'None',         issue:'',            account:'Cemex AZ', age:'2 hrs',  conn:'none', err:0, wrn:0, unitId:'UID-66778', readyMaint:'Yes', truckMode:'Standby', lastConn:'11:00 AM 07/23/25' },
      { num:'77889', ver:'v5.01.008', ign:'On',  ignDetail:'1 hr',   source:'System Alert',    plant:'Chandler West', impact:'At Risk',       issue:'Discharge',   account:'Cemex AZ', age:'1 hr',   conn:'live', err:1, wrn:6, unitId:'UID-77889', readyMaint:'No',  truckMode:'Active',  lastConn:'1:20 PM 07/23/25' },
    ]
  },
];

/* flat list for row iteration */
const trucks = truckGroups.flatMap(g => g.trucks);
var tbUnitsSelected   = new Set();
var dtUnitsSelected   = new Set(); // unit IDs currently checked
const UNLINKED_TRUCKS = [
  { number:'AV17 ZXW (3427)', type:'Front',  drum:'8 yd',  water:'Pump',        mixer:'McNeilus' },
  { number:'BK19 YTR (2891)', type:'Rear',   drum:'9 yd',  water:'Pressure',    mixer:'Schwing'  },
  { number:'CL21 MNP (5503)', type:'Front',  drum:'10 yd', water:'Flow',        mixer:'McNeilus' },
  { number:'DX22 QRS (6614)', type:'Rear',   drum:'11 yd', water:'Temperature', mixer:'Schwing'  },
  { number:'EF18 ABC (1120)', type:'Front',  drum:'8 yd',  water:'Pump',        mixer:'London'   },
  { number:'GH20 DEF (3345)', type:'Rear',   drum:'9 yd',  water:'Pressure',    mixer:'McNeilus' },
  { number:'HJ23 GHI (7782)', type:'Front',  drum:'10 yd', water:'Flow',        mixer:'Schwing'  },
  { number:'KL24 JKL (8891)', type:'Rear',   drum:'11 yd', water:'Temperature', mixer:'London'   },
];
const UNITS_DATA = [
  { id:'U-836510', status:'Unlinked Unit', truck:'--',    tgw:'210000222277', contract:'Cemex AZ', sysType:'V5',    config:'Temp+ Admix',  firstCommissioned:null, assignedToTruck:null, decommissioned:null },
  { id:'U-184759', status:'Unlinked Unit', truck:'--',    tgw:'210000608331', contract:'Cemex AZ', sysType:'Spark', config:'Measured Only',firstCommissioned:null, assignedToTruck:null, decommissioned:null },
  { id:'U-348610', status:'Maintenance',   truck:'--',    tgw:'210000819204', contract:'Cemex AZ', sysType:'Pulse', config:'Measured Only',firstCommissioned:null, assignedToTruck:null, decommissioned:'01/10/2025' },
  { id:'U-100000', status:'Linked Unit', truck:'45689', tgw:'210000100000', contract:'Cemex AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'01/14/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-101337', status:'Linked Unit', truck:'12457', tgw:'210000107919', contract:'Cemex AZ', sysType:'V5', config:'Measured Only', firstCommissioned:'03/22/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-102674', status:'Linked Unit', truck:'39821', tgw:'210000115838', contract:'Cemex AZ', sysType:'V5', config:'Winter Water', firstCommissioned:'08/14/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-104011', status:'Linked Unit', truck:'53127', tgw:'210000123757', contract:'Cemex AZ', sysType:'Pulse', config:'Measured Only', firstCommissioned:'06/01/2022', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-105348', status:'Linked Unit', truck:'61042', tgw:'210000131676', contract:'Cemex AZ', sysType:'Spark', config:'Measured Only', firstCommissioned:'11/03/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-106685', status:'Linked Unit', truck:'77391', tgw:'210000139595', contract:'Cemex AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'04/17/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-108022', status:'Linked Unit', truck:'67234', tgw:'210000147514', contract:'Cemex AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'07/20/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-109359', status:'Linked Unit', truck:'84760', tgw:'210000155433', contract:'Cemex AZ', sysType:'V5', config:'Winter Water', firstCommissioned:'03/09/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-110696', status:'Linked Unit', truck:'98214', tgw:'210000163352', contract:'Cemex AZ', sysType:'Spark', config:'Measured Only', firstCommissioned:'09/15/2022', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-112033', status:'Linked Unit', truck:'21348', tgw:'210000171271', contract:'Cemex AZ', sysType:'V5', config:'Measured Only', firstCommissioned:'02/28/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-113370', status:'Linked Unit', truck:'33501', tgw:'210000179190', contract:'Cemex AZ', sysType:'Pulse', config:'Measured Only', firstCommissioned:'05/10/2023', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-114707', status:'Linked Unit', truck:'44892', tgw:'210000187109', contract:'Cemex AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'07/20/2022', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-116044', status:'Linked Unit', truck:'55120', tgw:'210000195028', contract:'Cemex AZ', sysType:'V5', config:'Winter Water', firstCommissioned:'10/05/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-117381', status:'Linked Unit', truck:'66783', tgw:'210000202947', contract:'Cemex AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'01/18/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-118718', status:'Linked Unit', truck:'72914', tgw:'210000210866', contract:'Cemex AZ', sysType:'Pulse', config:'Measured Only', firstCommissioned:'03/30/2022', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-120055', status:'Linked Unit', truck:'81056', tgw:'210000218785', contract:'Cemex AZ', sysType:'Spark', config:'Measured Only', firstCommissioned:'12/01/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-121392', status:'Linked Unit', truck:'90237', tgw:'210000226704', contract:'Cemex AZ', sysType:'V5', config:'Measured Only', firstCommissioned:'06/14/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-122729', status:'Linked Unit', truck:'30471', tgw:'210000234623', contract:'Vulcan AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'02/11/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-124066', status:'Linked Unit', truck:'41852', tgw:'210000242542', contract:'Vulcan AZ', sysType:'V5', config:'Winter Water', firstCommissioned:'08/22/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-125403', status:'Linked Unit', truck:'52963', tgw:'210000250461', contract:'Vulcan AZ', sysType:'Spark', config:'Measured Only', firstCommissioned:'04/09/2022', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-126740', status:'Linked Unit', truck:'64074', tgw:'210000258380', contract:'Vulcan AZ', sysType:'Pulse', config:'Measured Only', firstCommissioned:'07/15/2023', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-128077', status:'Linked Unit', truck:'75185', tgw:'210000266299', contract:'Vulcan AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'09/01/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-129414', status:'Linked Unit', truck:'86296', tgw:'210000274218', contract:'Vulcan AZ', sysType:'V5', config:'Measured Only', firstCommissioned:'11/20/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-130751', status:'Linked Unit', truck:'97307', tgw:'210000282137', contract:'Vulcan AZ', sysType:'V5', config:'Winter Water', firstCommissioned:'05/06/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-132088', status:'Linked Unit', truck:'10841', tgw:'210000290056', contract:'Vulcan AZ', sysType:'Pulse', config:'Measured Only', firstCommissioned:'01/25/2023', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-133425', status:'Linked Unit', truck:'21952', tgw:'210000297975', contract:'Vulcan AZ', sysType:'Spark', config:'Measured Only', firstCommissioned:'06/30/2022', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-134762', status:'Linked Unit', truck:'32063', tgw:'210000305894', contract:'Vulcan AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'03/14/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-136099', status:'Linked Unit', truck:'43174', tgw:'210000313813', contract:'Vulcan AZ', sysType:'V5', config:'Measured Only', firstCommissioned:'10/08/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-137436', status:'Linked Unit', truck:'54285', tgw:'210000321732', contract:'Vulcan AZ', sysType:'V5', config:'Winter Water', firstCommissioned:'12/15/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-138773', status:'Linked Unit', truck:'65396', tgw:'210000329651', contract:'Vulcan AZ', sysType:'Pulse', config:'Measured Only', firstCommissioned:'08/01/2022', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-140110', status:'Linked Unit', truck:'76407', tgw:'210000337570', contract:'Vulcan AZ', sysType:'Spark', config:'Measured Only', firstCommissioned:'04/20/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-141447', status:'Linked Unit', truck:'87518', tgw:'210000345489', contract:'Vulcan AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'07/11/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-142784', status:'Linked Unit', truck:'11223', tgw:'210000353408', contract:'Cemex AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'02/28/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-144121', status:'Linked Unit', truck:'22334', tgw:'210000361327', contract:'Cemex AZ', sysType:'Pulse', config:'Measured Only', firstCommissioned:'09/10/2022', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-145458', status:'Linked Unit', truck:'33445', tgw:'210000369246', contract:'Cemex AZ', sysType:'V5', config:'Winter Water', firstCommissioned:'05/15/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-146795', status:'Linked Unit', truck:'44556', tgw:'210000377165', contract:'Cemex AZ', sysType:'V5', config:'Measured Only', firstCommissioned:'11/30/2021', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-148132', status:'Linked Unit', truck:'55667', tgw:'210000385084', contract:'Cemex AZ', sysType:'V5', config:'Temp+ Admix', firstCommissioned:'01/07/2020', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-149469', status:'Linked Unit', truck:'66778', tgw:'210000393003', contract:'Cemex AZ', sysType:'Spark', config:'Measured Only', firstCommissioned:'07/22/2022', assignedToTruck:'07/01/2025', decommissioned:null },
  { id:'U-150806', status:'Linked Unit', truck:'77889', tgw:'210000400922', contract:'Cemex AZ', sysType:'V5', config:'Measured Only', firstCommissioned:'03/18/2021', assignedToTruck:'07/01/2025', decommissioned:null },
];
const senSelected = new Set(['slump','water']);
const MC_CARD_DEFS = [
  { id:'ping', title:'Ping Truck', hasInput:false, idleMetric:'2', idleUnit:'min ago', idleMetricSub:'Last Ping', idleStatusKey:'Status:', idleStatusVal:'Online', idleBtnLabel:'Ping Truck', mountId:'mc-unit-ping',
    scenarios:[
      { id:'success', label:'Responded', progressTo:100, progressDuration:1200, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Responded',cls:'badge-ok'}, inputContent:{type:'pill',label:'Responded',cls:'pill-success'}, metric:'just now', unit:'', metricSub:'Last Ping', statusKey:'Status:', statusVal:'Online', btn:{label:'Ping Again',cls:'btn-primary',disabled:false} }) },
      { id:'error', label:'No Response', progressTo:80, progressDuration:1400, stutter:true, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'No Response',cls:'badge-error'}, inputContent:{type:'pill',label:'Timed Out',cls:'pill-error'}, metric:'Timed Out', unit:'', metricSub:'Last known: 2 min ago', statusKey:'Status:', statusVal:'Unreachable', btn:{label:'Retry Ping',cls:'btn-primary',disabled:false} }) }
    ]
  },
  { id:'restart', title:'Restart System', hasInput:false, idleMetric:'2', idleUnit:'min ago', idleMetricSub:'Last Attempt', idleStatusKey:'Truck Status:', idleStatusVal:'Online', idleBtnLabel:'Restart System', hasConfirm:false, mountId:'mc-unit-restart',
    scenarios:[
      { id:'success', label:'Acknowledged', progressTo:100, progressDuration:1500, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Acknowledged',cls:'badge-ok'}, inputContent:{type:'pill',label:'Shutdown event logged',cls:'pill-success'}, metric:'just now', unit:'', metricSub:'Last Attempt', statusKey:'Truck Status:', statusVal:'Restarting', btn:{label:'Restart System',cls:'btn-primary',disabled:false} }) },
      { id:'error', label:'Command Failed', progressTo:45, progressDuration:800, retract:true, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Failed',cls:'badge-error'}, inputContent:{type:'pill',label:'Command failed',cls:'pill-error'}, metric:'2', unit:'min ago', metricSub:'Last Attempt', statusKey:'Truck Status:', statusVal:'Online', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) },
      { id:'disabled', label:'Truck Off', isDisabled:true, resolve:()=>({ dotClass:'dot-muted', cardClass:'state-disabled', badge:{label:'Truck Off',cls:'badge-disabled'}, inputContent:{type:'pill',label:'Truck is offline',cls:'pill-disabled'}, metric:'—', unit:'', metricSub:'Last Attempt', statusKey:'Truck Status:', statusVal:'Offline', btn:{label:'Restart System',cls:'btn-primary',disabled:true} }) }
    ]
  },
  { id:'canerrors', title:'CAN Errors', hasInput:false, idleMetric:'3', idleUnit:'', idleMetricSub:'Current CAN Errors', idleStatusKey:'Last Reset:', idleStatusVal:'10:32 AM', idleBtnLabel:'Reset', mountId:'mc-unit-canerrors',
    scenarios:[
      { id:'success', label:'All Cleared', progressTo:100, progressDuration:1400, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Cleared',cls:'badge-ok'}, inputContent:{type:'pill',label:'All errors cleared',cls:'pill-success'}, metric:'0', unit:'', metricSub:'Current CAN Errors', statusKey:'Last Reset:', statusVal:'just now', btn:{label:'Reset',cls:'btn-primary',disabled:false} }) },
      { id:'partial', label:'Partial Clear', progressTo:65, progressDuration:1100, progressStall:400, resolve:()=>({ dotClass:'dot-amber', cardClass:'state-partial', badge:{label:'1 remaining',cls:'badge-warn'}, inputContent:{type:'pill',label:'Partial clear',cls:'pill-partial'}, metric:'1', unit:'', metricSub:'Current CAN Errors', statusKey:'Last Reset:', statusVal:'just now', btn:{label:'Reset Again',cls:'btn-partial',disabled:false} }) },
      { id:'error', label:'All Persist', progressTo:100, progressDuration:1300, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Not cleared',cls:'badge-error'}, inputContent:{type:'pill',label:'Errors persist',cls:'pill-error'}, metric:'3', unit:'', metricSub:'Current CAN Errors', statusKey:'Last Reset:', statusVal:'just now', btn:{label:'Retry Reset',cls:'btn-primary',disabled:false} }) },
      { id:'timeout', label:'Timeout', progressTo:80, progressDuration:1400, stutter:true, resolve:()=>({ dotClass:'dot-red-heavy', cardClass:'state-error-heavy', badge:{label:'Timed Out',cls:'badge-error-heavy'}, inputContent:{type:'pill',label:'No response from truck',cls:'pill-error-heavy'}, metric:'3', unit:'', metricSub:'Current CAN Errors', statusKey:'Last Reset:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) }
    ]
  },
  { id:'sensors', title:'Reset Sensors', hasInput:false, idleMetric:'2', idleUnit:'min ago', idleMetricSub:'Last Attempt', idleStatusKey:'Feed Status:', idleStatusVal:'Active', idleBtnLabel:'Reset', mountId:'mc-unit-sensors',
    scenarios:[
      { id:'success', label:'Feed Active', progressTo:100, progressDuration:1300, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Feed Active',cls:'badge-ok'}, inputContent:{type:'pill',label:'Sensors responding',cls:'pill-success'}, metric:'just now', unit:'', metricSub:'Last Attempt', statusKey:'Feed Status:', statusVal:'Active', btn:{label:'Reset',cls:'btn-primary',disabled:false} }) },
      { id:'error', label:'No Feed', progressTo:100, progressDuration:1200, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'No Feed',cls:'badge-error'}, inputContent:{type:'pill',label:'Sensors not reporting',cls:'pill-error'}, metric:'just now', unit:'', metricSub:'Last Attempt', statusKey:'Feed Status:', statusVal:'No Feed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) },
      { id:'timeout', label:'Timeout', progressTo:80, progressDuration:1400, stutter:true, resolve:()=>({ dotClass:'dot-red-heavy', cardClass:'state-error-heavy', badge:{label:'Timed Out',cls:'badge-error-heavy'}, inputContent:{type:'pill',label:'No response from truck',cls:'pill-error-heavy'}, metric:'2', unit:'min ago', metricSub:'Last Attempt', statusKey:'Feed Status:', statusVal:'Unknown', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) }
    ]
  },
  { id:'water', title:'Add Water', hasInput:true, inputPlaceholder:'Add Water (liters)', inputMax:999, idleMetric:'--', idleUnit:'', idleMetricSub:'Flow Rate', idleStatusKey:'Last Delivery:', idleStatusVal:'--', idleBtnLabel:'Add Water', mountId:'mc-unit-water',
    scenarios:[
      { id:'success', label:'Full Delivery', progressTo:100, progressDuration:1800, resolve:(val)=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Delivered',cls:'badge-ok'}, inputContent:{type:'pill',label:`${val}L delivered`,cls:'pill-success'}, metric:String(val), unit:'L', metricSub:'Flow Rate  145 ml/s', statusKey:'Last Delivery:', statusVal:'just now', btn:{label:'Add More Water',cls:'btn-primary',disabled:false} }) },
      { id:'partial', label:'Partial Delivery', progressTo:65, progressDuration:1100, progressStall:600, resolve:(val)=>{ const r=parseInt(val)||45; const d=Math.max(1,Math.floor(r*0.67)); const s=r-d; return { dotClass:'dot-amber', cardClass:'state-partial', badge:{label:`${s}L short`,cls:'badge-partial'}, inputContent:{type:'pill',label:'Flow issue active',cls:'pill-partial'}, metric:String(d), unit:'L', metricSub:'Flow Rate  4.0 gal/min', statusKey:'Short by:', statusVal:`${s}L`, btn:{label:`Add remaining ${s}L`,cls:'btn-partial',disabled:false} }; } },
      { id:'error', label:'Command Failed', progressTo:40, progressDuration:700, retract:true, resolve:(val)=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Failed',cls:'badge-error'}, inputContent:{type:'input',val:val,locked:false}, metric:'—', unit:'', metricSub:'Flow Rate', statusKey:'Requested:', statusVal:`${val}L`, btn:{label:'Retry',cls:'btn-primary',disabled:false} }) }
    ]
  },
  { id:'waterstate', title:'Water State', hasInput:false, idleMetric:'On', idleUnit:'', idleMetricSub:'Water State', idleStatusKey:'Last Changed:', idleStatusVal:'10:32 AM', idleBtnLabel:'Turn Off Water', hasConfirm:true, confirmLabel:'Confirm before turning off water', confirmBtnLabel:'Yes', mountId:'mc-unit-waterstate',
    scenarios:[
      { id:'success', label:'On → Off', progressTo:100, progressDuration:1400, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Acknowledged',cls:'badge-ok'}, inputContent:{type:'pill',label:'Water turned off',cls:'pill-success'}, metric:'Off', unit:'', metricSub:'Water State', statusKey:'Last Changed:', statusVal:'just now', btn:{label:'Turn On Water',cls:'btn-primary',disabled:false} }) },
      { id:'error', label:'On → Timeout', progressTo:80, progressDuration:1400, stutter:true, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Timed Out',cls:'badge-error'}, inputContent:{type:'pill',label:'No response',cls:'pill-error'}, metric:'On', unit:'', metricSub:'Water State', statusKey:'Last Changed:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) },
      { id:'success2', label:'Off → On', progressTo:100, progressDuration:1400, isOffStart:true, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Acknowledged',cls:'badge-ok'}, inputContent:{type:'pill',label:'Water turned on',cls:'pill-success'}, metric:'On', unit:'', metricSub:'Water State', statusKey:'Last Changed:', statusVal:'just now', btn:{label:'Turn Off Water',cls:'btn-primary',disabled:false} }) },
      { id:'error2', label:'Off → Timeout', progressTo:80, progressDuration:1400, stutter:true, isOffStart:true, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Timed Out',cls:'badge-error'}, inputContent:{type:'pill',label:'No response',cls:'pill-error'}, metric:'Off', unit:'', metricSub:'Water State', statusKey:'Last Changed:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) }
    ]
  },
  { id:'waterprop', title:'Water Prop.', hasInput:false, idleMetric:'On', idleUnit:'', idleMetricSub:'Propulsion State', idleStatusKey:'Last Changed:', idleStatusVal:'10:32 AM', idleBtnLabel:'Turn Off Propulsion', hasConfirm:true, confirmLabel:'Confirm before changing water propulsion', confirmBtnLabel:'Yes', mountId:'mc-unit-waterprop',
    scenarios:[
      { id:'success', label:'On → Off', progressTo:100, progressDuration:1400, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Acknowledged',cls:'badge-ok'}, inputContent:{type:'pill',label:'Propulsion off',cls:'pill-success'}, metric:'Off', unit:'', metricSub:'Propulsion State', statusKey:'Last Changed:', statusVal:'just now', btn:{label:'Turn On Propulsion',cls:'btn-primary',disabled:false} }) },
      { id:'error', label:'On → Timeout', progressTo:80, progressDuration:1400, stutter:true, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Timed Out',cls:'badge-error'}, inputContent:{type:'pill',label:'No response',cls:'pill-error'}, metric:'On', unit:'', metricSub:'Propulsion State', statusKey:'Last Changed:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) },
      { id:'success2', label:'Off → On', progressTo:100, progressDuration:1400, isOffStart:true, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Acknowledged',cls:'badge-ok'}, inputContent:{type:'pill',label:'Propulsion on',cls:'pill-success'}, metric:'On', unit:'', metricSub:'Propulsion State', statusKey:'Last Changed:', statusVal:'just now', btn:{label:'Turn Off Propulsion',cls:'btn-primary',disabled:false} }) },
      { id:'error2', label:'Off → Timeout', progressTo:80, progressDuration:1400, stutter:true, isOffStart:true, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Timed Out',cls:'badge-error'}, inputContent:{type:'pill',label:'No response',cls:'pill-error'}, metric:'Off', unit:'', metricSub:'Propulsion State', statusKey:'Last Changed:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) }
    ]
  },
  { id:'waterflow', title:'Water Flow', hasInput:false, idleMetric:'3', idleUnit:'', idleMetricSub:'Flow Errors', idleStatusKey:'Last Reset:', idleStatusVal:'10:32 AM', idleBtnLabel:'Reset', mountId:'mc-unit-waterflow',
    scenarios:[
      { id:'success', label:'All Cleared', progressTo:100, progressDuration:1400, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Cleared',cls:'badge-ok'}, inputContent:{type:'pill',label:'All errors cleared',cls:'pill-success'}, metric:'0', unit:'', metricSub:'Current Flow Errors', statusKey:'Last Reset:', statusVal:'just now', btn:{label:'Reset',cls:'btn-primary',disabled:false} }) },
      { id:'partial', label:'Partial Clear', progressTo:65, progressDuration:1100, progressStall:400, resolve:()=>({ dotClass:'dot-amber', cardClass:'state-partial', badge:{label:'1 remaining',cls:'badge-warn'}, inputContent:{type:'pill',label:'Partial clear',cls:'pill-partial'}, metric:'1', unit:'', metricSub:'Current Flow Errors', statusKey:'Last Reset:', statusVal:'just now', btn:{label:'Reset Again',cls:'btn-partial',disabled:false} }) },
      { id:'error', label:'All Persist', progressTo:100, progressDuration:1300, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Not cleared',cls:'badge-error'}, inputContent:{type:'pill',label:'Errors persist',cls:'pill-error'}, metric:'3', unit:'', metricSub:'Current Flow Errors', statusKey:'Last Reset:', statusVal:'just now', btn:{label:'Retry Reset',cls:'btn-primary',disabled:false} }) },
      { id:'timeout', label:'Timeout', progressTo:80, progressDuration:1400, stutter:true, resolve:()=>({ dotClass:'dot-red-heavy', cardClass:'state-error-heavy', badge:{label:'Timed Out',cls:'badge-error-heavy'}, inputContent:{type:'pill',label:'No response from truck',cls:'pill-error-heavy'}, metric:'3', unit:'', metricSub:'Current Flow Errors', statusKey:'Last Reset:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) }
    ]
  },
  { id:'admix', title:'Add Admix', hasInput:true, inputPlaceholder:'Add Admix (oz)', inputMax:999, idleMetric:'--', idleUnit:'', idleMetricSub:'Flow Rate', idleStatusKey:'Last Delivery:', idleStatusVal:'--', idleBtnLabel:'Add Admix', mountId:'mc-unit-admix',
    scenarios:[
      { id:'success', label:'Full Delivery', progressTo:100, progressDuration:1800, resolve:(val)=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Delivered',cls:'badge-ok'}, inputContent:{type:'pill',label:`${val}oz delivered`,cls:'pill-success'}, metric:String(val), unit:'oz', metricSub:'Flow Rate  145 ml/s', statusKey:'Last Delivery:', statusVal:'just now', btn:{label:'Add More Admix',cls:'btn-primary',disabled:false} }) },
      { id:'partial', label:'Partial Delivery', progressTo:65, progressDuration:1100, progressStall:600, resolve:(val)=>{ const r=parseInt(val)||45; const d=Math.max(1,Math.floor(r*0.67)); const s=r-d; return { dotClass:'dot-amber', cardClass:'state-partial', badge:{label:`${s}oz short`,cls:'badge-partial'}, inputContent:{type:'pill',label:'Flow issue active',cls:'pill-partial'}, metric:String(d), unit:'oz', metricSub:'Flow Rate  4.0 gal/min', statusKey:'Short by:', statusVal:`${s}oz`, btn:{label:`Add remaining ${s}oz`,cls:'btn-partial',disabled:false} }; } },
      { id:'error', label:'Command Failed', progressTo:40, progressDuration:700, retract:true, resolve:(val)=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Failed',cls:'badge-error'}, inputContent:{type:'input',val:val,locked:false}, metric:'—', unit:'', metricSub:'Flow Rate', statusKey:'Requested:', statusVal:`${val}oz`, btn:{label:'Retry',cls:'btn-primary',disabled:false} }) }
    ]
  },
  { id:'admixstate', title:'Admix State', hasInput:false, idleMetric:'On', idleUnit:'', idleMetricSub:'Admix State', idleStatusKey:'Last Changed:', idleStatusVal:'10:32 AM', idleBtnLabel:'Turn Off Admix', hasConfirm:true, confirmLabel:'Confirm before turning off admix', confirmBtnLabel:'Yes', mountId:'mc-unit-admixstate',
    scenarios:[
      { id:'success', label:'On → Off', progressTo:100, progressDuration:1400, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Acknowledged',cls:'badge-ok'}, inputContent:{type:'pill',label:'Admix turned off',cls:'pill-success'}, metric:'Off', unit:'', metricSub:'Admix State', statusKey:'Last Changed:', statusVal:'just now', btn:{label:'Turn On Admix',cls:'btn-primary',disabled:false} }) },
      { id:'error', label:'On → Timeout', progressTo:80, progressDuration:1400, stutter:true, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Timed Out',cls:'badge-error'}, inputContent:{type:'pill',label:'No response',cls:'pill-error'}, metric:'On', unit:'', metricSub:'Admix State', statusKey:'Last Changed:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) },
      { id:'success2', label:'Off → On', progressTo:100, progressDuration:1400, isOffStart:true, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Acknowledged',cls:'badge-ok'}, inputContent:{type:'pill',label:'Admix turned on',cls:'pill-success'}, metric:'On', unit:'', metricSub:'Admix State', statusKey:'Last Changed:', statusVal:'just now', btn:{label:'Turn Off Admix',cls:'btn-primary',disabled:false} }) },
      { id:'error2', label:'Off → Timeout', progressTo:80, progressDuration:1400, stutter:true, isOffStart:true, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Timed Out',cls:'badge-error'}, inputContent:{type:'pill',label:'No response',cls:'pill-error'}, metric:'Off', unit:'', metricSub:'Admix State', statusKey:'Last Changed:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) }
    ]
  },
  { id:'admixprop', title:'Admix Prop.', hasInput:false, idleMetric:'On', idleUnit:'', idleMetricSub:'Propulsion State', idleStatusKey:'Last Changed:', idleStatusVal:'10:32 AM', idleBtnLabel:'Turn Off Propulsion', hasConfirm:true, confirmLabel:'Confirm before changing admix propulsion', confirmBtnLabel:'Yes', mountId:'mc-unit-admixprop',
    scenarios:[
      { id:'success', label:'On → Off', progressTo:100, progressDuration:1400, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Acknowledged',cls:'badge-ok'}, inputContent:{type:'pill',label:'Admix propulsion off',cls:'pill-success'}, metric:'Off', unit:'', metricSub:'Propulsion State', statusKey:'Last Changed:', statusVal:'just now', btn:{label:'Turn On Propulsion',cls:'btn-primary',disabled:false} }) },
      { id:'error', label:'On → Timeout', progressTo:80, progressDuration:1400, stutter:true, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Timed Out',cls:'badge-error'}, inputContent:{type:'pill',label:'No response',cls:'pill-error'}, metric:'On', unit:'', metricSub:'Propulsion State', statusKey:'Last Changed:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) },
      { id:'success2', label:'Off → On', progressTo:100, progressDuration:1400, isOffStart:true, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Acknowledged',cls:'badge-ok'}, inputContent:{type:'pill',label:'Admix propulsion on',cls:'pill-success'}, metric:'On', unit:'', metricSub:'Propulsion State', statusKey:'Last Changed:', statusVal:'just now', btn:{label:'Turn Off Propulsion',cls:'btn-primary',disabled:false} }) },
      { id:'error2', label:'Off → Timeout', progressTo:80, progressDuration:1400, stutter:true, isOffStart:true, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Timed Out',cls:'badge-error'}, inputContent:{type:'pill',label:'No response',cls:'pill-error'}, metric:'Off', unit:'', metricSub:'Propulsion State', statusKey:'Last Changed:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) }
    ]
  },
  { id:'admixflow', title:'Admix Flow', hasInput:false, idleMetric:'3', idleUnit:'', idleMetricSub:'Flow Errors', idleStatusKey:'Last Reset:', idleStatusVal:'10:32 AM', idleBtnLabel:'Reset', mountId:'mc-unit-admixflow',
    scenarios:[
      { id:'success', label:'All Cleared', progressTo:100, progressDuration:1400, resolve:()=>({ dotClass:'dot-green', cardClass:'state-success', badge:{label:'Cleared',cls:'badge-ok'}, inputContent:{type:'pill',label:'All errors cleared',cls:'pill-success'}, metric:'0', unit:'', metricSub:'Current Flow Errors', statusKey:'Last Reset:', statusVal:'just now', btn:{label:'Reset',cls:'btn-primary',disabled:false} }) },
      { id:'partial', label:'Partial Clear', progressTo:65, progressDuration:1100, progressStall:400, resolve:()=>({ dotClass:'dot-amber', cardClass:'state-partial', badge:{label:'1 remaining',cls:'badge-warn'}, inputContent:{type:'pill',label:'Partial clear',cls:'pill-partial'}, metric:'1', unit:'', metricSub:'Current Flow Errors', statusKey:'Last Reset:', statusVal:'just now', btn:{label:'Reset Again',cls:'btn-partial',disabled:false} }) },
      { id:'error', label:'All Persist', progressTo:100, progressDuration:1300, resolve:()=>({ dotClass:'dot-red', cardClass:'state-error', badge:{label:'Not cleared',cls:'badge-error'}, inputContent:{type:'pill',label:'Errors persist',cls:'pill-error'}, metric:'3', unit:'', metricSub:'Current Flow Errors', statusKey:'Last Reset:', statusVal:'just now', btn:{label:'Retry Reset',cls:'btn-primary',disabled:false} }) },
      { id:'timeout', label:'Timeout', progressTo:80, progressDuration:1400, stutter:true, resolve:()=>({ dotClass:'dot-red-heavy', cardClass:'state-error-heavy', badge:{label:'Timed Out',cls:'badge-error-heavy'}, inputContent:{type:'pill',label:'No response from truck',cls:'pill-error-heavy'}, metric:'3', unit:'', metricSub:'Current Flow Errors', statusKey:'Last Reset:', statusVal:'Failed', btn:{label:'Retry',cls:'btn-primary',disabled:false} }) }
    ]
  }
];
const CC_TRUCKS = [
  { num:'45689', ver:'v5.01.008', ign:'On',  ignOff:false, err:1,  wrn:0, ignDetail:'3 min',  plant:'Phoenix Central', lastConn:'1:16 PM 07/23/25',
    components:[
      { name:'TCG',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Discharge',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#d70100', state:'alarm', evt:'Alarm · no signal' },
      { name:'Water Pump',  dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Admix Pump',  dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'12457', ver:'v5.01.008', ign:'On',  ignOff:false, err:2,  wrn:10, ignDetail:'15 min', plant:'Phoenix Central', lastConn:'12:44 PM 07/23/25',
    components:[
      { name:'TCG', dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Discharge',   dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#d70100', state:'alarm', evt:'Alarm · no signal' },
    ]},
  { num:'39821', ver:'v5.01.008', ign:'On',  ignOff:false, err:0,  wrn:10, ignDetail:'8 hrs',  plant:'Phoenix Central', lastConn:'9:02 AM 07/23/25',
    components:[
      { name:'TCG', dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Discharge',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#d70100', state:'alarm', evt:'Alarm · ongoing' },
    ]},
  { num:'53127', ver:'Pulse-1.2.3', ign:'On',  ignOff:false, err:1, wrn:0,  ignDetail:'2 days', plant:'Phoenix Central', lastConn:'2 days ago',
    components:[
      { name:'TCG', dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Discharge',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Drum',        dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'CWR',         dot:'#d70100', state:'alarm', evt:'1 Alarm' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'67234', ver:'v5.01.008',    ign:'Off', ignOff:true,  err:0, wrn:10,  ignDetail:'15 min', plant:'Mesa South',      lastConn:'2:05 PM 07/23/25',
    components:[
      { name:'TCG', dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Discharge',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'84760', ver:'v5.01.008', ign:'Off', ignOff:true,  err:2, wrn:10,  ignDetail:'4 hrs',  plant:'Mesa South',      lastConn:'11:30 AM 07/23/25',
    components:[
      { name:'TCG', dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#d70100', state:'alarm', evt:'2 Alarms' },
      { name:'Discharge',   dot:'#d70100', state:'alarm', evt:'1 Alarm' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#d70100', state:'alarm', evt:'Alarm · ongoing' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'98214', ver:'Spark-2.0.1',    ign:'Off', ignOff:true,  err:1, wrn:0,   ignDetail:'1 day',  plant:'Mesa South',      lastConn:'07/22/25',
    components:[
      { name:'TCG', dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Discharge',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'CWR',         dot:'#d70100', state:'alarm', evt:'1 Alarm' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'21348', ver:'v5.01.008',    ign:'On',  ignOff:false, err:2, wrn:10,  ignDetail:'2 days', plant:'Mesa South',      lastConn:'07/21/25',
    components:[
      { name:'TCG', dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'Discharge',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Drum',        dot:'#d70100', state:'alarm', evt:'1 Alarm' },
      { name:'Int. Display',dot:'#d70100', state:'alarm', evt:'2 Alarms' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'55120', ver:'v5.01.008', ign:'On',  ignOff:false, err:3, wrn:5,   ignDetail:'10 min', plant:'Tempe East',      lastConn:'2:10 PM 07/23/25',
    components:[
      { name:'TCG', dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Discharge',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Drum',        dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'Int. Display',dot:'#d70100', state:'alarm', evt:'1 Alarm' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#d70100', state:'alarm', evt:'1 Alarm' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},

  /* ── Vulcan AZ — Scottsdale North ── */
  { num:'30471', ver:'v5.01.008', ign:'On', ignOff:false, err:2, wrn:6, ignDetail:'2 hr', plant:'Scottsdale North', lastConn:'1:10 PM 07/23/25',
    components:[
      { name:'TCG',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'Discharge',   dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Drum',        dot:'#d70100', state:'alarm', evt:'Alarm · ongoing' },
      { name:'Int. Display',dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#d70100', state:'alarm', evt:'Alarm · ongoing' },
      { name:'CWR',         dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'41852', ver:'v5.01.008', ign:'On', ignOff:false, err:0, wrn:8, ignDetail:'4 hr', plant:'Scottsdale North', lastConn:'12:30 PM 07/23/25',
    components:[
      { name:'TCG',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Discharge',   dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'CWR',         dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'WDS',         dot:'#ffba0d', state:'warn',  evt:'3 Warnings' },
      { name:'Water Pump',  dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Admix Pump',  dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'52963', ver:'Spark-2.0.1', ign:'Off', ignOff:true, err:1, wrn:0, ignDetail:'1 hr', plant:'Scottsdale North', lastConn:'10:45 AM 07/23/25',
    components:[
      { name:'TCG',         dot:'#d70100', state:'alarm', evt:'Alarm · no signal' },
      { name:'Charge',      dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Discharge',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},

  /* ── Vulcan AZ — Gilbert East ── */
  { num:'97307', ver:'v5.01.008', ign:'On', ignOff:false, err:1, wrn:4, ignDetail:'1 hr', plant:'Gilbert East', lastConn:'1:15 PM 07/23/25',
    components:[
      { name:'TCG',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Discharge',   dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#d70100', state:'alarm', evt:'Alarm · CAN Bus' },
      { name:'CWR',         dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'10841', ver:'Pulse-1.2.3', ign:'On', ignOff:false, err:0, wrn:2, ignDetail:'45 min', plant:'Gilbert East', lastConn:'1:22 PM 07/23/25',
    components:[
      { name:'TCG',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Discharge',   dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},

  /* ── Vulcan AZ — Mesa Gateway ── */
  { num:'32063', ver:'v5.01.008', ign:'On', ignOff:false, err:2, wrn:5, ignDetail:'2 hr', plant:'Mesa Gateway', lastConn:'1:18 PM 07/23/25',
    components:[
      { name:'TCG',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'Discharge',   dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#d70100', state:'alarm', evt:'Alarm · ongoing' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#d70100', state:'alarm', evt:'Alarm · no signal' },
      { name:'Water Pump',  dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'Admix Pump',  dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'43174', ver:'v5.01.008', ign:'On', ignOff:false, err:0, wrn:8, ignDetail:'3 hr', plant:'Mesa Gateway', lastConn:'1:05 PM 07/23/25',
    components:[
      { name:'TCG',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'Discharge',   dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'Drum',        dot:'#ffba0d', state:'warn',  evt:'2 Warnings' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'CWR',         dot:'#ffba0d', state:'warn',  evt:'1 Warning' },
      { name:'WDS',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
    ]},
  { num:'76407', ver:'Spark-2.0.1', ign:'On', ignOff:false, err:1, wrn:0, ignDetail:'5 hr', plant:'Mesa Gateway', lastConn:'8:30 AM 07/23/25',
    components:[
      { name:'TCG',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Charge',      dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Discharge',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Drum',        dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Int. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Ext. Display',dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'Bus Power',   dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'CWR',         dot:'#2ecf1d', state:'clean', evt:'No Events' },
      { name:'WDS',         dot:'#d70100', state:'alarm', evt:'Alarm · Hydraulic' },
    ]},
];
