// Check what day 2025-08-24 actually is
console.log("2025-08-24 is day:", new Date("2025-08-24").getDay());
console.log("Day names: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat");

// Let's check a few dates around this time
const dates = ["2025-08-22", "2025-08-23", "2025-08-24", "2025-08-25"];
dates.forEach((date) => {
  const d = new Date(date);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  console.log(`${date} is ${dayNames[d.getDay()]}`);
});
