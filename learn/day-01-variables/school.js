// ============================================================
// DAY 1: Variables, Types, and console.log
// ============================================================
// 
// This is a COMMENT. JavaScript ignores everything after //
// Comments are notes for humans reading the code.
// Use them to explain WHY you did something, not WHAT.
//
// To run this file, open your terminal and type:
//   node learn/day-01-variables/school.js
// ============================================================


// -----------------------------------------------------------
// 1. VARIABLES — Storing data in named containers
// -----------------------------------------------------------

// Think of a variable like a labeled box.
// You put something inside, and the label tells you what's in it.

// There are 3 ways to create variables in JavaScript:

// (a) const — the value CANNOT be changed later (use this by default)
const platformName = "Teacher Recruitment System";

// (b) let — the value CAN be changed later
let totalSchools = 0;

// (c) var — the OLD way. NEVER use this. It has weird scoping bugs.
//     We mention it only so you recognize it in other people's code.
// var badVariable = "don't use me";  // ← DON'T

// RULE: Always use "const" first. Only use "let" if you NEED to change the value.
// Why? If something shouldn't change (like a platform name), making it "const"
// prevents accidental changes. Bugs from accidental reassignment are real.


// -----------------------------------------------------------
// 2. DATA TYPES — Different kinds of data
// -----------------------------------------------------------

// JavaScript has these basic types:

// STRING — text, always in quotes (single, double, or backticks)
const schoolName = "Delhi Public School";
const city = 'New Delhi';

// NUMBER — integers and decimals, no quotes
const strength = 1500;
const registrationFee = 999.00;

// BOOLEAN — true or false, no quotes
const isFreeTier = true;
const isPaid = false;

// NULL — intentionally empty ("we know there's nothing here")
const pendingPayment = null;

// UNDEFINED — not yet assigned ("we haven't set this yet")
let principalName;  // This is undefined — we declared it but didn't assign a value
// NOTE: undefined is different from null.
// null = "we intentionally set this to nothing"
// undefined = "this was never set"

// ARRAY — an ordered list of values (think: a list of subjects)
const subjects = ["Mathematics", "Physics", "English", "Hindi"];

// OBJECT — a collection of key-value pairs (think: a form with many fields)
const school = {
  name: "Delhi Public School",
  location: "New Delhi",
  pinCode: "110001",
  board: "CBSE",
  strength: 1500,
  schoolLevel: "Senior Secondary",
  contactNo: "011-26789456",
  email: "admin@dps.edu.in",
  principal: "Dr. Sharma",
  isFreeTier: true,
  paymentStatus: "NOT_REQUIRED",
};
// ^ Every key-value pair is separated by a comma
// ^ The key is the "label", the value is the "data"
// ^ This looks EXACTLY like the school data in our PRD!


// -----------------------------------------------------------
// 3. console.log() — Printing output to the terminal
// -----------------------------------------------------------

// console.log() is how you print things. It's your debugging best friend.

console.log("=== Welcome to the Teacher Recruitment System ===");
console.log("");  // empty line for spacing

// Print a simple string
console.log("Platform:", platformName);

// Print a number
console.log("Total schools registered:", totalSchools);

// Print a boolean
console.log("Is free tier?", isFreeTier);

// Print an entire object (JavaScript automatically formats it nicely)
console.log("School details:", school);

// Print an array
console.log("Subjects offered:", subjects);

// Print the LENGTH of an array (how many items)
console.log("Number of subjects:", subjects.length);


// -----------------------------------------------------------
// 4. TEMPLATE LITERALS — The modern way to build strings
// -----------------------------------------------------------

// The OLD way to combine strings (concatenation):
const oldWay = "School: " + schoolName + " in " + city + " with " + strength + " students";
console.log("\nOld way:", oldWay);

// The NEW way — template literals (use backticks ` and ${})
const newWay = `School: ${schoolName} in ${city} with ${strength} students`;
console.log("New way:", newWay);
// ^ Much cleaner! The ${} inserts a variable's value into the string.
// ^ Always use template literals. The old way is harder to read.


// -----------------------------------------------------------
// 5. ACCESSING OBJECT PROPERTIES
// -----------------------------------------------------------

// Dot notation (most common)
console.log("\n--- Accessing school data ---");
console.log("School name:", school.name);
console.log("Board:", school.board);
console.log("Principal:", school.principal);

// Bracket notation (useful when the key is stored in a variable)
const fieldToAccess = "email";
console.log(`${fieldToAccess}:`, school[fieldToAccess]);
// ^ Why bracket notation? In our privacy filter, we'll have a LIST of fields
//   to delete. We can't write school.fieldName — we need school[fieldName]
//   where fieldName is a variable that changes each loop iteration.


// -----------------------------------------------------------
// 6. MODIFYING VALUES
// -----------------------------------------------------------

// Remember: const can't be reassigned, but let can
totalSchools = 1;  // ✅ This works because totalSchools was declared with "let"
console.log("\nUpdated total schools:", totalSchools);

// Try uncommenting this line — it will throw an error:
// platformName = "New Name";  // ❌ ERROR: Assignment to constant variable

// BUT — objects declared with const CAN have their properties changed!
// const protects the REFERENCE (the box), not the CONTENTS.
school.strength = 1600;  // ✅ This works even though school is const
console.log("Updated strength:", school.strength);


// -----------------------------------------------------------
// 7. typeof — Checking what type a value is
// -----------------------------------------------------------

console.log("\n--- Type checking ---");
console.log("Type of schoolName:", typeof schoolName);       // "string"
console.log("Type of strength:", typeof strength);            // "number"
console.log("Type of isFreeTier:", typeof isFreeTier);        // "boolean"
console.log("Type of subjects:", typeof subjects);            // "object" (arrays are objects!)
console.log("Type of pendingPayment:", typeof pendingPayment); // "object" (null is weirdly "object" — JS bug from 1995)
console.log("Type of principalName:", typeof principalName);   // "undefined"

// To properly check if something is an array:
console.log("Is subjects an array?", Array.isArray(subjects));  // true


// -----------------------------------------------------------
// 8. YOUR EXERCISE — Create a candidate object
// -----------------------------------------------------------

// TODO: Create a "candidate" object with these fields:
//   - name (string)
//   - contactNo (string)
//   - email (string)
//   - gender (string)
//   - dob (string, like "1995-03-15")
//   - primaryRole (string, like "TGT" or "PGT")
//   - qualifications (array of strings)
//   - experience (number, in years)
//   - expectedSalary (number)
//   - locationInterested (array of strings)
//   - status (string, "ACTIVE")
//
// Then print:
//   1. The full candidate object
//   2. A sentence like: "[name] is a [primaryRole] with [experience] years of experience"
//   3. How many qualifications they have
//   4. Their first preferred location
//
// Hint: To get the first item of an array, use array[0]
// (arrays are "0-indexed" — first item is index 0, second is 1, etc.)

// Write your code below this line:
// -----------------------------------------------------------
